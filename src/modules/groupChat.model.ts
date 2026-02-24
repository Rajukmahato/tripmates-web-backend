import mongoose, { Document, Schema } from "mongoose";

const groupChatMongoSchema: Schema = new Schema(
  {
    groupChatId: {
      type: String,
      required: true,
      unique: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    members: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
groupChatMongoSchema.index({ trip: 1 });
groupChatMongoSchema.index({ createdBy: 1 });

export interface IGroupChat extends Document {
  _id: mongoose.Types.ObjectId;
  groupChatId: string;
  trip: mongoose.Types.ObjectId;
  members?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const GroupChatModel = mongoose.model<IGroupChat>("GroupChat", groupChatMongoSchema);
