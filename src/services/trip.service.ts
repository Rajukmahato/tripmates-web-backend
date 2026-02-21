import { TripRepository } from "../repositories/trip.repository";
import { GroupChatRepository } from "../repositories/groupChat.repository";
import { CreateTripDto, UpdateTripDto, SearchTripDto } from "../dots/trip.dto";
import { HttpError } from "../errors/http-error";
import { destinationRepository } from "../repositories/destination.repository";
import mongoose from "mongoose";

let tripRepository = new TripRepository();
let groupChatRepository = new GroupChatRepository();

export class TripService {
  async createTrip(creatorId: string, tripData: CreateTripDto) {
    // Validate creator ID
    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      throw new HttpError(400, "Invalid creator ID");
    }

    // Generate unique group chat ID
    const groupChatId = `trip-${new mongoose.Types.ObjectId().toString()}-${Date.now()}`;

    let resolvedDestinationName = tripData.destination;
    let resolvedDestinationId: mongoose.Types.ObjectId | undefined;

    // Handle destination: either use existing destination ID or allow custom destination
    if ((tripData as any).destinationId && (tripData as any).destinationId !== "") {
      const destinationId = (tripData as any).destinationId as string;
      
      // Only validate if it's a valid ObjectId format
      if (mongoose.Types.ObjectId.isValid(destinationId)) {
        try {
          const selectedDestination = await destinationRepository.findById(destinationId, false);
          if (selectedDestination) {
            // Use existing destination from database
            resolvedDestinationName = selectedDestination.name;
            resolvedDestinationId = selectedDestination._id as mongoose.Types.ObjectId;
          } else {
            // Destination ID provided but not found - fall back to custom destination
            console.warn(`Destination ID ${destinationId} not found, using custom destination`);
            if (!tripData.destination) {
              throw new HttpError(400, "Destination not found. Please provide a custom destination name.");
            }
          }
        } catch (error: any) {
          // If there's an error fetching destination, fall back to custom
          console.warn(`Error fetching destination: ${error.message}`);
          if (!tripData.destination) {
            throw new HttpError(400, "Could not validate destination. Please provide a custom destination name.");
          }
        }
      } else {
        // Invalid ObjectId format - just use custom destination
        console.warn(`Invalid destination ID format: ${destinationId}, using custom destination`);
        if (!tripData.destination) {
          throw new HttpError(400, "Invalid destination ID format. Please provide a custom destination name.");
        }
      }
    }

    // Ensure we have a destination name (either from DB or custom)
    if (!resolvedDestinationName) {
      throw new HttpError(400, "Destination is required (provide either destinationId or destination)");
    }

    // Convert string dates to Date objects
    const tripWithCreator: any = {
      ...tripData,
      destination: resolvedDestinationName,
      destinationId: resolvedDestinationId,
      creator: new mongoose.Types.ObjectId(creatorId),
      startDate: new Date(tripData.startDate),
      endDate: new Date(tripData.endDate),
      groupChatId,
    };

    const newTrip = await tripRepository.createTrip(tripWithCreator);

    // Create group chat for this trip
    try {
      await groupChatRepository.createGroupChat({
        groupChatId,
        trip: newTrip._id,
        createdBy: new mongoose.Types.ObjectId(creatorId),
        members: [new mongoose.Types.ObjectId(creatorId)], // Add creator as first member
      });
    } catch (error) {
      console.error("Failed to create group chat for trip:", error);
      // Don't fail trip creation if group chat fails
    }

    return newTrip;
  }

  async getTripById(tripId: string) {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new HttpError(400, "Invalid trip ID");
    }
    const trip = await tripRepository.getTripById(tripId);
    if (!trip) {
      throw new HttpError(404, "Trip not found");
    }
    return trip;
  }

  async getTripsByCreator(creatorId: string, page: number = 1, limit: number = 10) {
    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      throw new HttpError(400, "Invalid creator ID");
    }

    const trips = await tripRepository.getTripsByCreator(creatorId, page, limit);
    const totalCount = await tripRepository.getTripsCount({ creator: creatorId });
    const totalPages = Math.ceil(totalCount / limit);

    return {
      trips,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    };
  }

  async updateTrip(tripId: string, userId: string, updateData: UpdateTripDto) {
    const trip = await tripRepository.getTripById(tripId);
    if (!trip) {
      throw new HttpError(404, "Trip not found");
    }

    // Only creator can update their trip
    if (trip.creator._id.toString() !== userId) {
      throw new HttpError(403, "You can only update your own trips");
    }

    // Convert string dates to Date objects if provided
    const updatePayload: any = { ...updateData };

    // Handle destination update: either use existing destination ID or allow custom destination
    if ((updateData as any).destinationId && (updateData as any).destinationId !== "") {
      const destinationId = (updateData as any).destinationId as string;
      
      // Only validate if it's a valid ObjectId format
      if (mongoose.Types.ObjectId.isValid(destinationId)) {
        try {
          const selectedDestination = await destinationRepository.findById(destinationId, false);
          if (selectedDestination) {
            // Use existing destination from database
            updatePayload.destination = selectedDestination.name;
            updatePayload.destinationId = selectedDestination._id;
          } else {
            // Destination ID provided but not found - allow custom destination
            console.warn(`Destination ID ${destinationId} not found, keeping custom destination`);
            // Don't update destinationId if not found
            delete updatePayload.destinationId;
          }
        } catch (error: any) {
          // If there's an error fetching destination, keep custom
          console.warn(`Error fetching destination: ${error.message}`);
          delete updatePayload.destinationId;
        }
      } else {
        // Invalid ObjectId format - just use custom destination if provided
        console.warn(`Invalid destination ID format: ${destinationId}, keeping custom destination`);
        delete updatePayload.destinationId;
      }
    }

    // Allow clearing destinationId (falling back to custom destination)
    if ((updateData as any).destinationId === "") {
      delete updatePayload.destinationId;
    }

    if (updateData.startDate) {
      updatePayload.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updatePayload.endDate = new Date(updateData.endDate);
    }

    const updatedTrip = await tripRepository.updateTrip(tripId, updatePayload);
    return updatedTrip;
  }

  async deleteTrip(tripId: string, userId: string) {
    const trip = await tripRepository.getTripById(tripId);
    if (!trip) {
      throw new HttpError(404, "Trip not found");
    }

    // Only creator can delete their trip
    if (trip.creator._id.toString() !== userId) {
      throw new HttpError(403, "You can only delete your own trips");
    }

    const deleted = await tripRepository.deleteTrip(tripId);
    if (!deleted) {
      throw new HttpError(500, "Failed to delete trip");
    }

    return { message: "Trip deleted successfully" };
  }

  async searchTrips(searchParams: SearchTripDto) {
    const { page, limit, ...filters } = searchParams;
    
    const trips = await tripRepository.searchTrips(filters, page, limit);
    const totalCount = await tripRepository.getTripsCount(filters);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      trips,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    };
  }

  // ===== ADMIN METHODS =====

  async getAllTrips(page: number = 1, limit: number = 10, upcomingOnly: boolean = false) {
    const trips = await tripRepository.getAllTrips(page, limit, upcomingOnly);
    const totalCount = await tripRepository.getTripsCount({ upcomingOnly });
    const totalPages = Math.ceil(totalCount / limit);

    return {
      trips,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    };
  }

  async updateTripAsAdmin(tripId: string, updateData: UpdateTripDto) {
    const trip = await tripRepository.getTripById(tripId);
    if (!trip) {
      throw new HttpError(404, "Trip not found");
    }

    const updatePayload: any = { ...updateData };

    // Handle destination update: either use existing destination ID or allow custom destination
    if ((updateData as any).destinationId && (updateData as any).destinationId !== "") {
      const destinationId = (updateData as any).destinationId as string;
      
      // Only validate if it's a valid ObjectId format
      if (mongoose.Types.ObjectId.isValid(destinationId)) {
        try {
          const selectedDestination = await destinationRepository.findById(destinationId, false);
          if (selectedDestination) {
            // Use existing destination from database
            updatePayload.destination = selectedDestination.name;
            updatePayload.destinationId = selectedDestination._id;
          } else {
            // Destination ID provided but not found - allow custom destination
            console.warn(`Destination ID ${destinationId} not found, keeping custom destination`);
            // Don't update destinationId if not found
            delete updatePayload.destinationId;
          }
        } catch (error: any) {
          // If there's an error fetching destination, keep custom
          console.warn(`Error fetching destination: ${error.message}`);
          delete updatePayload.destinationId;
        }
      } else {
        // Invalid ObjectId format - just use custom destination if provided
        console.warn(`Invalid destination ID format: ${destinationId}, keeping custom destination`);
        delete updatePayload.destinationId;
      }
    }

    // Allow clearing destinationId (falling back to custom destination)
    if ((updateData as any).destinationId === "") {
      delete updatePayload.destinationId;
    }

    if (updateData.startDate) {
      updatePayload.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updatePayload.endDate = new Date(updateData.endDate);
    }

    const updatedTrip = await tripRepository.updateTrip(tripId, updatePayload);
    return updatedTrip;
  }

  async deleteTripAsAdmin(tripId: string) {
    const trip = await tripRepository.getTripById(tripId);
    if (!trip) {
      throw new HttpError(404, "Trip not found");
    }

    const deleted = await tripRepository.deleteTrip(tripId);
    if (!deleted) {
      throw new HttpError(500, "Failed to delete trip");
    }

    return { message: "Trip deleted successfully" };
  }

  // ===== STATS METHODS =====

  async getTripStats() {
    const { TripModel } = await import("../modules/trip.model");

    const [totalTrips, activeTrips, completedTrips, cancelledTrips] = await Promise.all([
      TripModel.countDocuments(),
      TripModel.countDocuments({ status: "open" }),
      TripModel.countDocuments({ status: "completed" }),
      TripModel.countDocuments({ status: "cancelled" }),
    ]);

    return {
      totalTrips,
      activeTrips,
      completedTrips,
      cancelledTrips,
    };
  }

  // ===== ITINERARY METHODS =====

  async updateItinerary(tripId: string, userId: string, itinerary: any[]) {
    const trip = await tripRepository.getTripById(tripId);
    if (!trip) {
      throw new HttpError(404, "Trip not found");
    }

    // Only creator can update trip itinerary
    if (trip.creator._id.toString() !== userId) {
      throw new HttpError(403, "Only trip creator can update itinerary");
    }

    // Validate itinerary format
    if (!Array.isArray(itinerary)) {
      throw new HttpError(400, "Itinerary must be an array");
    }

    const updatedTrip = await tripRepository.updateTrip(tripId, { itinerary });
    return updatedTrip;
  }

  // ===== CHECKLIST METHODS =====

  async updateChecklist(tripId: string, userId: string, travelChecklist: string[]) {
    const trip = await tripRepository.getTripById(tripId);
    if (!trip) {
      throw new HttpError(404, "Trip not found");
    }

    // Only creator can update trip checklist
    if (trip.creator._id.toString() !== userId) {
      throw new HttpError(403, "Only trip creator can update checklist");
    }

    // Validate checklist format
    if (!Array.isArray(travelChecklist)) {
      throw new HttpError(400, "Checklist must be an array");
    }

    const updatedTrip = await tripRepository.updateTrip(tripId, { travelChecklist });
    return updatedTrip;
  }
}
