import { PartnerRequestModel, IPartnerRequest } from "../modules/partnerRequest.model";
import mongoose from "mongoose";

export interface IPartnerRequestRepository {
  createRequest(requestData: Partial<IPartnerRequest>): Promise<IPartnerRequest>;
  getRequestById(requestId: string): Promise<IPartnerRequest | null>;
  getRequestsByReceiver(
    receiverId: string,
    status?: string,
    page?: number,
    limit?: number
  ): Promise<IPartnerRequest[]>;
  getRequestsBySender(
    senderId: string,
    status?: string,
    page?: number,
    limit?: number
  ): Promise<IPartnerRequest[]>;
  getRequestByTripAndSender(tripId: string, senderId: string): Promise<IPartnerRequest | null>;
  updateRequestStatus(requestId: string, status: string): Promise<IPartnerRequest | null>;
  deleteRequest(requestId: string): Promise<boolean>;
  getRequestsCount(filters: any): Promise<number>;
}

export class PartnerRequestRepository implements IPartnerRequestRepository {
  async createRequest(requestData: Partial<IPartnerRequest>): Promise<IPartnerRequest> {
    const request = new PartnerRequestModel(requestData);
    return await request.save();
  }

  async getRequestById(requestId: string): Promise<IPartnerRequest | null> {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return null;
    }
    const request = await PartnerRequestModel.findById(requestId)
      .populate("trip", "-__v")
      .populate("sender", "-password -resetPasswordToken -resetPasswordExpires")
      .populate("receiver", "-password -resetPasswordToken -resetPasswordExpires");
    return request;
  }

  async getRequestsByReceiver(
    receiverId: string,
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<IPartnerRequest[]> {
    const skip = (page - 1) * limit;
    const query: any = { receiver: receiverId };

    if (status) {
      query.status = status;
    }

    const requests = await PartnerRequestModel.find(query)
      .populate("trip", "-__v")
      .populate("sender", "-password -resetPasswordToken -resetPasswordExpires")
      .populate("receiver", "-password -resetPasswordToken -resetPasswordExpires")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    return requests;
  }

  async getRequestsBySender(
    senderId: string,
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<IPartnerRequest[]> {
    const skip = (page - 1) * limit;
    const query: any = { sender: senderId };

    if (status) {
      query.status = status;
    }

    const requests = await PartnerRequestModel.find(query)
      .populate("trip", "-__v")
      .populate("sender", "-password -resetPasswordToken -resetPasswordExpires")
      .populate("receiver", "-password -resetPasswordToken -resetPasswordExpires")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    return requests;
  }

  async getRequestByTripAndSender(
    tripId: string,
    senderId: string
  ): Promise<IPartnerRequest | null> {
    if (!mongoose.Types.ObjectId.isValid(tripId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      return null;
    }
    const request = await PartnerRequestModel.findOne({ trip: tripId, sender: senderId });
    return request;
  }

  async updateRequestStatus(requestId: string, status: string): Promise<IPartnerRequest | null> {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return null;
    }
    const request = await PartnerRequestModel.findByIdAndUpdate(
      requestId,
      { $set: { status } },
      { new: true, runValidators: true }
    )
      .populate("trip", "-__v")
      .populate("sender", "-password -resetPasswordToken -resetPasswordExpires")
      .populate("receiver", "-password -resetPasswordToken -resetPasswordExpires");

    return request;
  }

  async deleteRequest(requestId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return false;
    }
    const result = await PartnerRequestModel.findByIdAndDelete(requestId);
    return result ? true : false;
  }

  async getRequestsCount(filters: any = {}): Promise<number> {
    return await PartnerRequestModel.countDocuments(filters);
  }
}
