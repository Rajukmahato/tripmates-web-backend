import mongoose, { Document, Schema } from "mongoose";
import { MessageType } from "../types/message.type";

const messageMongoSchema: Schema = new Schema(
    {
        conversation: {
            type: String,
            required: true,
            index: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: 2000,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        type: {
            type: String,
            enum: ["private", "group"],
            default: "private",
        },
        tripId: {
            type: Schema.Types.ObjectId,
            ref: "Trip",
            required: false,
        },
        groupId: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
messageMongoSchema.index({ conversation: 1, createdAt: -1 });
messageMongoSchema.index({ receiver: 1, isRead: 1 });

export interface IMessage extends Document {
    conversation: string;
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    content: string;
    isRead: boolean;
    type?: "private" | "group";
    tripId?: mongoose.Types.ObjectId;
    groupId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const MessageModel = mongoose.model<IMessage>("Message", messageMongoSchema);
