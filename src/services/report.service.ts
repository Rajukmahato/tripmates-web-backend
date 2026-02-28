import { reportRepository } from "../repositories/report.repository";
import { IReport } from "../modules/report.model";
import { HttpError } from "../errors/http-error";
import mongoose from "mongoose";

export class ReportService {
    /**
     * Submit a report against a user
     */
    async submitReport(
        reporterId: string,
        reportedUserId: string,
        reason: string,
        description?: string
    ): Promise<IReport> {
        // Validate input
        if (!reportedUserId || !reason || reason.trim().length === 0) {
            throw new HttpError(400, "Reported user ID and reason are required");
        }

        if (reporterId === reportedUserId) {
            throw new HttpError(400, "Cannot report yourself");
        }

        // Create report
        const report = await reportRepository.create(reporterId, reportedUserId, reason, description);

        // Populate fields
        await report.populate([
            { path: "reporter", select: "fullName profileImagePath" },
            { path: "reportedUser", select: "fullName profileImagePath" },
        ]);

        return report;
    }

    /**
     * Get all reports with optional status filter (admin)
     */
    async getAllReports(
        status?: "pending" | "reviewed" | "resolved",
        page: number = 1,
        limit: number = 10
    ): Promise<{ reports: IReport[]; total: number; pages: number; currentPage: number }> {
        const result = await reportRepository.findAll(status, page, limit);

        return {
            ...result,
            currentPage: page,
        };
    }

    /**
     * Get report by ID (admin)
     */
    async getReportById(reportId: string): Promise<IReport> {
        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            throw new HttpError(400, "Invalid report ID");
        }

        const report = await reportRepository.findById(reportId);

        if (!report) {
            throw new HttpError(404, "Report not found");
        }

        return report;
    }

    /**
     * Review a report (admin)
     */
    async reviewReport(reportId: string, adminNote: string): Promise<IReport> {
        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            throw new HttpError(400, "Invalid report ID");
        }

        if (!adminNote || adminNote.trim().length === 0) {
            throw new HttpError(400, "Admin note is required");
        }

        const report = await reportRepository.findById(reportId);
        if (!report) {
            throw new HttpError(404, "Report not found");
        }

        const updatedReport = await reportRepository.updateStatus(reportId, "reviewed", adminNote);

        if (!updatedReport) {
            throw new HttpError(500, "Failed to update report");
        }

        return updatedReport;
    }

    /**
     * Resolve a report (admin)
     */
    async resolveReport(reportId: string, adminNote?: string): Promise<IReport> {
        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            throw new HttpError(400, "Invalid report ID");
        }

        const report = await reportRepository.findById(reportId);
        if (!report) {
            throw new HttpError(404, "Report not found");
        }

        const updatedReport = await reportRepository.updateStatus(reportId, "resolved", adminNote);

        if (!updatedReport) {
            throw new HttpError(500, "Failed to update report");
        }

        return updatedReport;
    }

    /**
     * Get report statistics (admin)
     */
    async getReportStats(): Promise<{
        pending: number;
        reviewed: number;
        resolved: number;
        total: number;
    }> {
        return await reportRepository.getCountsByStatus();
    }

    /**
     * Get reports for a specific user (admin)
     */
    async getReportsForUser(
        reportedUserId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ reports: IReport[]; total: number; pages: number; currentPage: number }> {
        if (!mongoose.Types.ObjectId.isValid(reportedUserId)) {
            throw new HttpError(400, "Invalid user ID");
        }

        const result = await reportRepository.findByReportedUser(reportedUserId, page, limit);

        return {
            ...result,
            currentPage: page,
        };
    }
}

export const reportService = new ReportService();
