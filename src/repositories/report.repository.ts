import mongoose from "mongoose";
import { ReportModel, IReport } from "../modules/report.model";

export class ReportRepository {
    /**
     * Create a new report
     */
    async create(
        reporterId: string,
        reportedUserId: string,
        reason: string,
        description?: string
    ): Promise<IReport> {
        const report = await ReportModel.create({
            reporter: new mongoose.Types.ObjectId(reporterId),
            reportedUser: new mongoose.Types.ObjectId(reportedUserId),
            reason,
            description: description || "",
            status: "pending",
        });

        return report;
    }

    /**
     * Find all reports with optional status filter
     */
    async findAll(
        status?: "pending" | "reviewed" | "resolved",
        page: number = 1,
        limit: number = 10
    ): Promise<{ reports: IReport[]; total: number; pages: number }> {
        const skip = (page - 1) * limit;

        const filter = status ? { status } : {};

        const [reports, total] = await Promise.all([
            ReportModel.find(filter)
                .populate("reporter", "fullName email profileImagePath")
                .populate("reportedUser", "fullName email profileImagePath")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ReportModel.countDocuments(filter),
        ]);

        return {
            reports,
            total,
            pages: Math.ceil(total / limit),
        };
    }

    /**
     * Find report by ID
     */
    async findById(reportId: string): Promise<IReport | null> {
        return await ReportModel.findById(reportId)
            .populate("reporter", "fullName email profileImagePath")
            .populate("reportedUser", "fullName email profileImagePath");
    }

    /**
     * Update report status and add admin note
     */
    async updateStatus(
        reportId: string,
        status: "pending" | "reviewed" | "resolved",
        adminNote?: string
    ): Promise<IReport | null> {
        return await ReportModel.findByIdAndUpdate(
            reportId,
            {
                status,
                ...(adminNote && { adminNote }),
            },
            { new: true }
        )
            .populate("reporter", "fullName email profileImagePath")
            .populate("reportedUser", "fullName email profileImagePath");
    }

    /**
     * Get reports count by status
     */
    async getCountsByStatus(): Promise<{
        pending: number;
        reviewed: number;
        resolved: number;
        total: number;
    }> {
        const [pending, reviewed, resolved, total] = await Promise.all([
            ReportModel.countDocuments({ status: "pending" }),
            ReportModel.countDocuments({ status: "reviewed" }),
            ReportModel.countDocuments({ status: "resolved" }),
            ReportModel.countDocuments(),
        ]);

        return {
            pending,
            reviewed,
            resolved,
            total,
        };
    }

    /**
     * Find reports for a specific user (reported user)
     */
    async findByReportedUser(
        reportedUserId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ reports: IReport[]; total: number; pages: number }> {
        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            ReportModel.find({ reportedUser: new mongoose.Types.ObjectId(reportedUserId) })
                .populate("reporter", "fullName profileImagePath")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ReportModel.countDocuments({ reportedUser: new mongoose.Types.ObjectId(reportedUserId) }),
        ]);

        return {
            reports,
            total,
            pages: Math.ceil(total / limit),
        };
    }
}

export const reportRepository = new ReportRepository();
