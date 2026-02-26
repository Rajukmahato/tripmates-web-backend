import mongoose, { Document, Schema } from "mongoose";
import { NotificationType } from "../types/notification.type";

const notificationMongoSchema: Schema = new Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                "trip_reminder",
                "partner_request",
                "request_accepted",
                "request_rejected",
                "new_message",
                "new_review",
                "location_shared",
                "trip_started",
                "itinerary_updated",
            ],
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        body: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        relatedId: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
notificationMongoSchema.index({ recipient: 1, isRead: 1 });
notificationMongoSchema.index({ recipient: 1, createdAt: -1 });

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    type: "trip_reminder" | "partner_request" | "request_accepted" | "request_rejected" | "new_message" | "new_review" | "location_shared" | "trip_started" | "itinerary_updated";
    title: string;
    body: string;
    isRead: boolean;
    relatedId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const NotificationModel = mongoose.model<INotification>("Notification", notificationMongoSchema);
