import mongoose, { Document, Schema } from "mongoose";
import { ReportType } from "../types/report.type";

const reportMongoSchema: Schema = new Schema(
    {
        reporter: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reportedUser: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reason: {
            type: String,
            required: true,
            maxlength: 200,
        },
        description: {
            type: String,
            maxlength: 1000,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved"],
            default: "pending",
            index: true,
        },
        adminNote: {
            type: String,
            maxlength: 1000,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
reportMongoSchema.index({ status: 1, createdAt: -1 });
reportMongoSchema.index({ reportedUser: 1, createdAt: -1 });

export interface IReport extends Document {
    reporter: mongoose.Types.ObjectId;
    reportedUser: mongoose.Types.ObjectId;
    reason: string;
    description?: string;
    status: "pending" | "reviewed" | "resolved";
    adminNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const ReportModel = mongoose.model<IReport>("Report", reportMongoSchema);
