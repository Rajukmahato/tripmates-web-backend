import mongoose, { Document, Schema } from "mongoose";

const destinationMongoSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            maxlength: 2000,
            default: "",
        },
        coverImage: {
            type: String,
            default: "",
        },
        attractions: {
            type: [String],
            default: [],
        },
        bestTimeToVisit: {
            type: String,
            default: "",
        },
        travelTips: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

destinationMongoSchema.index({ name: 1, country: 1 }, { unique: true });
destinationMongoSchema.index({ name: "text", country: "text", description: "text" });

export interface IDestination extends Document {
    name: string;
    country: string;
    description?: string;
    coverImage?: string;
    attractions?: string[];
    bestTimeToVisit?: string;
    travelTips?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const DestinationModel = mongoose.model<IDestination>("Destination", destinationMongoSchema);
