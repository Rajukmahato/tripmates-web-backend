import mongoose, { Document, Schema } from "mongoose";
import { PartnerRequestType } from "../types/partnerRequest.type";

const partnerRequestMongoSchema: Schema = new Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      maxlength: 500,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate requests: same sender cannot send multiple requests for same trip (unique index)
partnerRequestMongoSchema.index({ trip: 1, sender: 1 }, { unique: true });

// Additional indexes for performance
partnerRequestMongoSchema.index({ trip: 1, receiver: 1 });
partnerRequestMongoSchema.index({ sender: 1, status: 1 });
partnerRequestMongoSchema.index({ receiver: 1, status: 1 });
partnerRequestMongoSchema.index({ status: 1 });

export interface IPartnerRequest extends Document {
  _id: mongoose.Types.ObjectId;
  trip: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export const PartnerRequestModel = mongoose.model<IPartnerRequest>(
  "PartnerRequest",
  partnerRequestMongoSchema
);
