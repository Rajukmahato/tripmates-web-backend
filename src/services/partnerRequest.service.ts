import { PartnerRequestRepository } from "../repositories/partnerRequest.repository";
import { TripRepository } from "../repositories/trip.repository";
import { GroupChatRepository } from "../repositories/groupChat.repository";
import { CreatePartnerRequestDto, UpdatePartnerRequestStatusDto } from "../dots/partnerRequest.dto";
import { HttpError } from "../errors/http-error";
import { notificationService } from "./notification.service";
import mongoose from "mongoose";

const partnerRequestRepository = new PartnerRequestRepository();
const tripRepository = new TripRepository();
const groupChatRepository = new GroupChatRepository();

export class PartnerRequestService {
  /**
   * Send a partner request to join a trip
   */
  async sendRequest(senderId: string, requestData: CreatePartnerRequestDto) {
    // Validate sender ID
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      throw new HttpError(400, "Invalid sender ID");
    }

    // Validate trip ID
    if (!mongoose.Types.ObjectId.isValid(requestData.tripId)) {
      throw new HttpError(400, "Invalid trip ID");
    }

    // Get the trip to find the receiver (trip creator)
    const trip = await tripRepository.getTripById(requestData.tripId);
    if (!trip) {
      throw new HttpError(404, "Trip not found");
    }

    // Check if trip is closed
    if (trip.status === "closed") {
      throw new HttpError(400, "This trip is closed and not accepting requests");
    }

    // Prevent sending request to own trip
    const receiverId = trip.creator._id.toString();
    if (senderId === receiverId) {
      throw new HttpError(400, "You cannot send a request to your own trip");
    }

    // Check for existing request
    const existingRequest = await partnerRequestRepository.getRequestByTripAndSender(
      requestData.tripId,
      senderId
    );

    if (existingRequest) {
      throw new HttpError(409, "You have already sent a request for this trip");
    }

    // Create the request
    const newRequest: any = {
      trip: new mongoose.Types.ObjectId(requestData.tripId),
      sender: new mongoose.Types.ObjectId(senderId),
      receiver: new mongoose.Types.ObjectId(receiverId),
      message: requestData.message || "",
      status: "pending",
    };

    const createdRequest = await partnerRequestRepository.createRequest(newRequest);

    // Populate references before returning
    const populatedRequest = await partnerRequestRepository.getRequestById(
      createdRequest._id.toString()
    );

    // Send notification to trip creator
    try {
      await notificationService.notifyPartnerRequestSent(
        receiverId,
        (populatedRequest!.sender as any).fullName,
        trip.destination,
        createdRequest._id.toString()
      );
    } catch (error) {
      console.error("Failed to send partner request notification:", error);
    }

    return populatedRequest;
  }

  /**
   * Get requests received by a user (as trip creator)
   */
  async getReceivedRequests(
    userId: string,
    status?: string,
    page: number = 1,
    limit: number = 10
  ) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(400, "Invalid user ID");
    }

    const requests = await partnerRequestRepository.getRequestsByReceiver(
      userId,
      status,
      page,
      limit
    );

    const filters: any = { receiver: userId };
    if (status) {
      filters.status = status;
    }

    const totalCount = await partnerRequestRepository.getRequestsCount(filters);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      requests,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    };
  }

  /**
   * Get requests sent by a user (as traveler)
   */
  async getSentRequests(userId: string, status?: string, page: number = 1, limit: number = 10) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(400, "Invalid user ID");
    }

    const requests = await partnerRequestRepository.getRequestsBySender(
      userId,
      status,
      page,
      limit
    );

    const filters: any = { sender: userId };
    if (status) {
      filters.status = status;
    }

    const totalCount = await partnerRequestRepository.getRequestsCount(filters);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      requests,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    };
  }

  /**
   * Accept or reject a partner request (trip creator only)
   */
  async updateRequestStatus(
    requestId: string,
    userId: string,
    statusData: UpdatePartnerRequestStatusDto
  ) {
    // Get the request
    const request = await partnerRequestRepository.getRequestById(requestId);
    if (!request) {
      throw new HttpError(404, "Request not found");
    }

    // Only receiver (trip creator) can accept/reject
    if (request.receiver._id.toString() !== userId) {
      throw new HttpError(403, "You can only respond to requests for your own trips");
    }

    // Check if request is already processed
    if (request.status !== "pending") {
      throw new HttpError(400, `This request has already been ${request.status}`);
    }

    // Update status
    const updatedRequest = await partnerRequestRepository.updateRequestStatus(
      requestId,
      statusData.status
    );

    // If accepted, add sender to trip members and group chat
    if (statusData.status === "accepted") {
      const trip = request.trip as any;
      if (!trip.members) {
        trip.members = [];
      }
      // Check if member already exists
      if (!trip.members.some((memberId: any) => memberId.toString() === request.sender._id.toString())) {
        await tripRepository.updateTrip(trip._id.toString(), {
          members: [...(trip.members || []), request.sender._id],
        });
      }

      // Add sender to group chat members
      try {
        await groupChatRepository.addMember(trip.groupChatId, request.sender._id.toString());
      } catch (error) {
        console.error("Failed to add member to group chat:", error);
        // Don't fail the request acceptance if group chat update fails
      }
    }

    // Send notification to sender
    try {
      if (statusData.status === "accepted") {
        await notificationService.notifyPartnerRequestAccepted(
          request.sender._id.toString(),
          (request.receiver as any).fullName,
          (request.trip as any).destination,
          requestId
        );
      } else if (statusData.status === "rejected") {
        await notificationService.notifyPartnerRequestRejected(
          request.sender._id.toString(),
          (request.receiver as any).fullName,
          (request.trip as any).destination,
          requestId
        );
      }
    } catch (error) {
      console.error("Failed to send status update notification:", error);
    }

    return updatedRequest;
  }

  /**
   * Cancel a sent request (sender only, pending requests only)
   */
  async cancelRequest(requestId: string, userId: string) {
    // Get the request
    const request = await partnerRequestRepository.getRequestById(requestId);
    if (!request) {
      throw new HttpError(404, "Request not found");
    }

    // Only sender can cancel
    if (request.sender._id.toString() !== userId) {
      throw new HttpError(403, "You can only cancel your own requests");
    }

    // Can only cancel pending requests
    if (request.status !== "pending") {
      throw new HttpError(400, "You can only cancel pending requests");
    }

    // Delete the request
    const deleted = await partnerRequestRepository.deleteRequest(requestId);
    if (!deleted) {
      throw new HttpError(500, "Failed to cancel request");
    }

    return { message: "Request cancelled successfully" };
  }

  /**
   * Get a specific request by ID
   */
  async getRequestById(requestId: string, userId: string) {
    const request = await partnerRequestRepository.getRequestById(requestId);
    if (!request) {
      throw new HttpError(404, "Request not found");
    }

    // User must be either sender or receiver
    const isSender = request.sender._id.toString() === userId;
    const isReceiver = request.receiver._id.toString() === userId;

    if (!isSender && !isReceiver) {
      throw new HttpError(403, "You do not have access to this request");
    }

    return request;
  }
}
