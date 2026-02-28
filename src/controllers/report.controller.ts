import { Request, Response } from "express";
import { reportService } from "../services/report.service";
import { CreateReportDto, ReviewReportDto, ResolveReportDto } from "../dots/report.dto";
import { HttpError } from "../errors/http-error";

export class ReportController {
    /**
     * Submit a report against a user
     * POST /api/reports
     * Body: { reportedUserId: string, reason: string, description?: string }
     */
    async submitReport(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const validatedData = CreateReportDto.parse(req.body);
            const { reportedUserId, reason, description } = validatedData;

            const report = await reportService.submitReport(userId, reportedUserId, reason, description);

            res.status(201).json({
                success: true,
                message: "Report submitted successfully",
                data: report,
            });
        } catch (error: any) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to submit report",
            });
        }
    }

    /**
     * Get all reports with optional status filter (admin)
     * GET /api/admin/reports?status=pending&page=1&limit=10
     */
    async getAllReports(req: Request, res: Response) {
        try {
            const status = req.query.status as "pending" | "reviewed" | "resolved" | undefined;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await reportService.getAllReports(status, page, limit);

            res.status(200).json({
                success: true,
                message: "Reports retrieved successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get reports",
            });
        }
    }

    /**
     * Get report by ID (admin)
     * GET /api/admin/reports/:id
     */
    async getReportById(req: Request, res: Response) {
        try {
            const reportId = req.params.id;

            const report = await reportService.getReportById(reportId);

            res.status(200).json({
                success: true,
                message: "Report retrieved successfully",
                data: report,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get report",
            });
        }
    }

    /**
     * Review a report (admin)
     * PUT /api/admin/reports/:id/review
     * Body: { adminNote: string }
     */
    async reviewReport(req: Request, res: Response) {
        try {
            const reportId = req.params.id;
            const validatedData = ReviewReportDto.parse(req.body);
            const { adminNote } = validatedData;

            const report = await reportService.reviewReport(reportId, adminNote);

            res.status(200).json({
                success: true,
                message: "Report reviewed successfully",
                data: report,
            });
        } catch (error: any) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to review report",
            });
        }
    }

    /**
     * Resolve a report (admin)
     * PUT /api/admin/reports/:id/resolve
     * Body: { adminNote?: string }
     */
    async resolveReport(req: Request, res: Response) {
        try {
            const reportId = req.params.id;
            const validatedData = ResolveReportDto.parse(req.body);
            const { adminNote } = validatedData;

            const report = await reportService.resolveReport(reportId, adminNote);

            res.status(200).json({
                success: true,
                message: "Report resolved successfully",
                data: report,
            });
        } catch (error: any) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to resolve report",
            });
        }
    }

    /**
     * Get report statistics (admin)
     * GET /api/admin/reports/stats
     */
    async getReportStats(req: Request, res: Response) {
        try {
            const stats = await reportService.getReportStats();

            res.status(200).json({
                success: true,
                message: "Report statistics retrieved successfully",
                data: stats,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get report statistics",
            });
        }
    }

    /**
     * Get reports for a specific user (admin)
     * GET /api/admin/reports/user/:userId?page=1&limit=10
     */
    async getReportsForUser(req: Request, res: Response) {
        try {
            const reportedUserId = req.params.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await reportService.getReportsForUser(reportedUserId, page, limit);

            res.status(200).json({
                success: true,
                message: "User reports retrieved successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get user reports",
            });
        }
    }
}

export const reportController = new ReportController();
