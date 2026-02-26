import { Request, Response } from "express";
import { PartnerRequestService } from "../services/partnerRequest.service";
import {
  CreatePartnerRequestDto,
  UpdatePartnerRequestStatusDto,
  GetPartnerRequestsQueryDto,
} from "../dots/partnerRequest.dto";
import z from "zod";

const partnerRequestService = new PartnerRequestService();

export class PartnerRequestController {
  /**
   * Send a partner request to join a trip
   * POST /api/partner-requests
   */
  async sendRequest(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const parsedData = CreatePartnerRequestDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const newRequest = await partnerRequestService.sendRequest(userId, parsedData.data);
      return res.status(201).json({
        success: true,
        message: "Partner request sent successfully",
        data: newRequest,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * Get requests received by current user (as trip creator)
   * GET /api/partner-requests/received
   */
  async getReceivedRequests(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const parsedQuery = GetPartnerRequestsQueryDto.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const { status, page, limit } = parsedQuery.data;
      const result = await partnerRequestService.getReceivedRequests(userId, status, page, limit);

      return res.status(200).json({
        success: true,
        message: "Received requests retrieved successfully",
        data: result.requests,
        pagination: result.pagination,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * Get requests sent by current user (as traveler)
   * GET /api/partner-requests/sent
   */
  async getSentRequests(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const parsedQuery = GetPartnerRequestsQueryDto.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const { status, page, limit } = parsedQuery.data;
      const result = await partnerRequestService.getSentRequests(userId, status, page, limit);

      return res.status(200).json({
        success: true,
        message: "Sent requests retrieved successfully",
        data: result.requests,
        pagination: result.pagination,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * Accept or reject a partner request (trip creator only)
   * PUT /api/partner-requests/:id/status
   */
  async updateRequestStatus(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const requestId = req.params.id;

      const parsedData = UpdatePartnerRequestStatusDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const updatedRequest = await partnerRequestService.updateRequestStatus(
        requestId,
        userId,
        parsedData.data
      );

      return res.status(200).json({
        success: true,
        message: `Request ${parsedData.data.status} successfully`,
        data: updatedRequest,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * Cancel a sent request (sender only)
   * DELETE /api/partner-requests/:id
   */
  async cancelRequest(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const requestId = req.params.id;

      const result = await partnerRequestService.cancelRequest(requestId, userId);

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

  /**
   * Get a specific request by ID
   * GET /api/partner-requests/:id
   */
  async getRequestById(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const requestId = req.params.id;

      const request = await partnerRequestService.getRequestById(requestId, userId);

      return res.status(200).json({
        success: true,
        message: "Request retrieved successfully",
        data: request,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
