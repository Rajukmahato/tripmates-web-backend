import mongoose, { Document, Schema } from "mongoose";
import { ReviewType } from "../types/review.type";

const reviewMongoSchema: Schema = new Schema(
    {
        reviewer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reviewee: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        trip: {
            type: Schema.Types.ObjectId,
            ref: "Trip",
            required: true,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            maxlength: 500,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Ensure one review per reviewer per trip (prevent duplicates)
reviewMongoSchema.index({ reviewer: 1, trip: 1 }, { unique: true });

// Index for efficient queries
reviewMongoSchema.index({ reviewee: 1, createdAt: -1 });

export interface IReview extends Document {
    reviewer: mongoose.Types.ObjectId;
    reviewee: mongoose.Types.ObjectId;
    trip: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const ReviewModel = mongoose.model<IReview>("Review", reviewMongoSchema);
