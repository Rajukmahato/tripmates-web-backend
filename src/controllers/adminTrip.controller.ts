import { Request, Response } from "express";
import { TripService } from "../services/trip.service";
import { UpdateTripDto } from "../dots/trip.dto";
import z from "zod";

const tripService = new TripService();

export class AdminTripController {
  async getAllTrips(req: Request, res: Response) {
    try {
      let page = parseInt(req.query.page as string) || 1;
      let limit = parseInt(req.query.limit as string) || 10;

      // Validate pagination parameters
      page = Math.max(1, page);
      limit = Math.max(1, Math.min(100, limit)); // Min 1, Max 100

      const result = await tripService.getAllTrips(page, limit);
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

      const parsedData = UpdateTripDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const updatedTrip = await tripService.updateTripAsAdmin(tripId, parsedData.data);
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

      const result = await tripService.deleteTripAsAdmin(tripId);
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

  async getTripStats(req: Request, res: Response) {
    try {
      const stats = await tripService.getTripStats();
      return res.status(200).json({
        success: true,
        message: "Trip statistics retrieved successfully",
        data: stats,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
