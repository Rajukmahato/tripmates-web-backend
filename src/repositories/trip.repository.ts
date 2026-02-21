import { TripModel, ITrip } from "../modules/trip.model";
import mongoose from "mongoose";

export interface ITripRepository {
  createTrip(tripData: Partial<ITrip>): Promise<ITrip>;
  getTripById(tripId: string): Promise<ITrip | null>;
  getTripsByCreator(creatorId: string, page?: number, limit?: number): Promise<ITrip[]>;
  getAllTrips(page?: number, limit?: number, upcomingOnly?: boolean): Promise<ITrip[]>;
  updateTrip(tripId: string, tripData: Partial<ITrip>): Promise<ITrip | null>;
  deleteTrip(tripId: string): Promise<boolean>;
  searchTrips(filters: any, page?: number, limit?: number): Promise<ITrip[]>;
  getTripsCount(filters?: any): Promise<number>;
}

export class TripRepository implements ITripRepository {
  async createTrip(tripData: Partial<ITrip>): Promise<ITrip> {
    const trip = new TripModel(tripData);
    return await trip.save();
  }

  async getTripById(tripId: string): Promise<ITrip | null> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return null;
    }
    const trip = await TripModel.findById(tripId)
      .populate("creator", "-password")
      .populate("members", "-password")
      .populate("destinationId", "name country coverImage isActive");
    return trip;
  }

  async getTripsByCreator(
    creatorId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ITrip[]> {
    const skip = (page - 1) * limit;
    const trips = await TripModel.find({ creator: creatorId })
      .populate("creator", "-password")
      .populate("members", "-password")
      .populate("destinationId", "name country coverImage isActive")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });
    return trips;
  }

  async getAllTrips(
    page: number = 1,
    limit: number = 10,
    upcomingOnly: boolean = false
  ): Promise<ITrip[]> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (upcomingOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.endDate = { $gte: today };
    }

    const trips = await TripModel.find(query)
      .populate("creator", "-password")
      .populate("members", "-password")
      .populate("destinationId", "name country coverImage isActive")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });
    return trips;
  }

  async updateTrip(tripId: string, tripData: Partial<ITrip>): Promise<ITrip | null> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return null;
    }
    const trip = await TripModel.findByIdAndUpdate(
      tripId,
      { $set: tripData },
      { new: true, runValidators: true }
    )
      .populate("creator", "-password")
      .populate("members", "-password")
      .populate("destinationId", "name country coverImage isActive");
    return trip;
  }

  async deleteTrip(tripId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return false;
    }
    const result = await TripModel.findByIdAndDelete(tripId);
    return result ? true : false;
  }

  async searchTrips(filters: any = {}, page: number = 1, limit: number = 10): Promise<ITrip[]> {
    const skip = (page - 1) * limit;
    const query: any = {};

    // Text search on destination
    if (filters.destination) {
      query.destination = { $regex: filters.destination, $options: "i" };
    }

    if (filters.destinationId && mongoose.Types.ObjectId.isValid(filters.destinationId)) {
      query.destinationId = new mongoose.Types.ObjectId(filters.destinationId);
    }

    // Date range filters
    if (filters.startDate || filters.endDate) {
      query.$and = [];
      if (filters.startDate) {
        query.$and.push({ endDate: { $gte: new Date(filters.startDate) } });
      }
      if (filters.endDate) {
        query.$and.push({ startDate: { $lte: new Date(filters.endDate) } });
      }
    }

    // Budget range filters
    if (filters.minBudget || filters.maxBudget) {
      query.budget = {};
      if (filters.minBudget) {
        query.budget.$gte = filters.minBudget;
      }
      if (filters.maxBudget) {
        query.budget.$lte = filters.maxBudget;
      }
    }

    // Travel type filter
    if (filters.travelType) {
      query.travelType = filters.travelType;
    }

    // Status filter (default: only open trips)
    query.status = filters.status || "open";

    const trips = await TripModel.find(query)
      .populate("creator", "-password")
      .populate("members", "-password")
      .populate("destinationId", "name country coverImage isActive")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    return trips;
  }

  async getTripsCount(filters: any = {}): Promise<number> {
    const query: any = {};

    if (filters.creator && mongoose.Types.ObjectId.isValid(filters.creator)) {
      query.creator = new mongoose.Types.ObjectId(filters.creator);
    }

    if (filters.destination) {
      query.destination = { $regex: filters.destination, $options: "i" };
    }

    if (filters.destinationId && mongoose.Types.ObjectId.isValid(filters.destinationId)) {
      query.destinationId = new mongoose.Types.ObjectId(filters.destinationId);
    }

    if (filters.startDate || filters.endDate) {
      query.$and = [];
      if (filters.startDate) {
        query.$and.push({ endDate: { $gte: new Date(filters.startDate) } });
      }
      if (filters.endDate) {
        query.$and.push({ startDate: { $lte: new Date(filters.endDate) } });
      }
    }

    if (filters.minBudget || filters.maxBudget) {
      query.budget = {};
      if (filters.minBudget) {
        query.budget.$gte = filters.minBudget;
      }
      if (filters.maxBudget) {
        query.budget.$lte = filters.maxBudget;
      }
    }

    if (filters.travelType) {
      query.travelType = filters.travelType;
    }

    if (filters.upcomingOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.endDate = { $gte: today };
    }

    query.status = filters.status || "open";

    return await TripModel.countDocuments(query);
  }
}
