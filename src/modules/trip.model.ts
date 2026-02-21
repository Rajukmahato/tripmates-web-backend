import mongoose, { Document, Schema } from "mongoose";
import { TripType } from "../types/trip.type";

const tripMongoSchema: Schema = new Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: false,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    travelType: {
      type: String,
      enum: ["adventure", "leisure", "business", "backpacking"],
      required: true,
    },
    groupSize: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    itinerary: {
      type: [
        {
          day: Number,
          title: String,
          description: String,
          location: String,
        },
      ],
      default: [],
    },
    travelChecklist: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    members: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    groupChatId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    image: {
      type: String,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for search performance
tripMongoSchema.index({ destination: "text", description: "text" });
tripMongoSchema.index({ startDate: 1, endDate: 1 });
tripMongoSchema.index({ budget: 1 });
tripMongoSchema.index({ creator: 1 });
tripMongoSchema.index({ status: 1 });
tripMongoSchema.index({ destinationId: 1 });

export interface ITrip extends TripType, Document {
  _id: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  destinationId?: mongoose.Types.ObjectId;
  members?: mongoose.Types.ObjectId[];
  groupChatId: string;
  itinerary?: {
    day: number;
    title: string;
    description?: string;
    location?: string;
  }[];
  travelChecklist?: string[];
  notes?: string;
  image?: string | null;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const TripModel = mongoose.model<ITrip>("Trip", tripMongoSchema);
