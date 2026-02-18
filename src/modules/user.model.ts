import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";

const userMongoSchema: Schema = new Schema(
    {
        fullName: { type: String, required: false, default: "" },
        email: { type: String, required: true, unique: true },
        phoneNumber: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        bio: { type: String, required: false, default: "" },
        location: { type: String, required: false, default: "" },
        profileImagePath: { type: String, required: false, default: "" },
        travelInterests: { type: [String], default: [] },
        budgetRange: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 0 }
        },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
    },
    {
        timestamps: true,
    }
)

export interface IUser extends UserType, Document {
    role: any;
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
}

export const UserModel = mongoose.model<IUser>("User", userMongoSchema);