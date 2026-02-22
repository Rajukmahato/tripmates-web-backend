import { Request, Response } from "express";
import { TripService } from "../services/trip.service";
import { CreateTripDto, UpdateTripDto, SearchTripDto } from "../dots/trip.dto";
import { getTripImageFilePath } from "../middlewares/upload.middleware";
import z from "zod";

const tripService = new TripService();

export class TripController {
  async createTrip(req: Request, res: Response) {
    try {
      const creatorId = req.user?._id?.toString();
      if (!creatorId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const parsedData = CreateTripDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      let tripData: any = { ...parsedData.data };
      
      // Handle uploaded files
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const images = req.files.map((file: Express.Multer.File) => getTripImageFilePath(file.filename));
        tripData.images = images;
        // Set the first image as the main image
        tripData.image = images[0];
      }

      const newTrip = await tripService.createTrip(creatorId, tripData);
      return res.status(201).json({
        success: true,
        message: "Trip created successfully",
        data: newTrip,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getAllTrips(req: Request, res: Response) {
    try {
      let page = parseInt(req.query.page as string) || 1;
      let limit = parseInt(req.query.limit as string) || 10;
      const upcomingOnly =
        req.query.upcoming === "true" ||
        req.query.upcoming === "1";

      // Validate pagination parameters
      page = Math.max(1, page);
      limit = Math.max(1, Math.min(100, limit)); // Min 1, Max 100

      const result = await tripService.getAllTrips(page, limit, upcomingOnly);
      return res.status(200).json({
        success: true,
        message: "Trips retrieved successfully",
        data: result.trips,
        pagination: result.pagination,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getTripById(req: Request, res: Response) {
    try {
      const tripId = req.params.id;
      const trip = await tripService.getTripById(tripId);
      return res.status(200).json({
        success: true,
        message: "Trip retrieved successfully",
        data: trip,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getTripsByCreator(req: Request, res: Response) {
    try {
      const creatorId = req.params.userId;
      let page = parseInt(req.query.page as string) || 1;
      let limit = parseInt(req.query.limit as string) || 10;

      // Validate pagination parameters
      page = Math.max(1, page);
      limit = Math.max(1, Math.min(100, limit)); // Min 1, Max 100

      const result = await tripService.getTripsByCreator(creatorId, page, limit);
      return res.status(200).json({
        success: true,
        message: "Trips retrieved successfully",
        data: result.trips,
        pagination: result.pagination,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async updateTrip(req: Request, res: Response) {
    try {
      const tripId = req.params.id;
      const userId = req.user?._id?.toString();

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const parsedData = UpdateTripDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      let updateData: any = { ...parsedData.data };
      
      // Handle uploaded files
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const images = req.files.map((file: Express.Multer.File) => getTripImageFilePath(file.filename));
        updateData.images = images;
        // Set the first image as the main image
        updateData.image = images[0];
      }

      const updatedTrip = await tripService.updateTrip(tripId, userId, updateData);
      return res.status(200).json({
        success: true,
        message: "Trip updated successfully",
        data: updatedTrip,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async deleteTrip(req: Request, res: Response) {
    try {
      const tripId = req.params.id;
      const userId = req.user?._id?.toString();

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const result = await tripService.deleteTrip(tripId, userId);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async searchTrips(req: Request, res: Response) {
    try {
      const parsedQuery = SearchTripDto.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      // Validate pagination bounds
      let queryData = parsedQuery.data;
      queryData.page = Math.max(1, queryData.page);
      queryData.limit = Math.max(1, Math.min(100, queryData.limit)); // Min 1, Max 100

      const result = await tripService.searchTrips(queryData);
      return res.status(200).json({
        success: true,
        message: "Trips found successfully",
        data: result.trips,
        pagination: result.pagination,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // ===== ITINERARY METHODS =====

  async updateItinerary(req: Request, res: Response) {
    try {
      const tripId = req.params.id;
      const userId = req.user?._id?.toString();
      const { itinerary } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!itinerary || !Array.isArray(itinerary)) {
        return res.status(400).json({
          success: false,
          message: "Itinerary must be an array",
        });
      }

      const updatedTrip = await tripService.updateItinerary(tripId, userId, itinerary);
      return res.status(200).json({
        success: true,
        message: "Itinerary updated successfully",
        data: updatedTrip,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getItinerary(req: Request, res: Response) {
    try {
      const tripId = req.params.id;
      const trip = await tripService.getTripById(tripId);

      return res.status(200).json({
        success: true,
        message: "Itinerary retrieved successfully",
        data: { itinerary: trip.itinerary || [] },
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // ===== CHECKLIST METHODS =====

  async updateChecklist(req: Request, res: Response) {
    try {
      const tripId = req.params.id;
      const userId = req.user?._id?.toString();
      const { travelChecklist } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!travelChecklist || !Array.isArray(travelChecklist)) {
        return res.status(400).json({
          success: false,
          message: "Checklist must be an array",
        });
      }

      const updatedTrip = await tripService.updateChecklist(tripId, userId, travelChecklist);
      return res.status(200).json({
        success: true,
        message: "Checklist updated successfully",
        data: updatedTrip,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getChecklist(req: Request, res: Response) {
    try {
      const tripId = req.params.id;
      const trip = await tripService.getTripById(tripId);

      return res.status(200).json({
        success: true,
        message: "Checklist retrieved successfully",
        data: { checkList: trip.travelChecklist || [] },
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
