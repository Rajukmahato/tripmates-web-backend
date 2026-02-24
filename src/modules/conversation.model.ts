import mongoose, { Document, Schema } from "mongoose";

const conversationMongoSchema: Schema = new Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
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

conversationMongoSchema.index({ participants: 1 });

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: string;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId | null;
  lastMessageAt?: Date | null;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ConversationModel = mongoose.model<IConversation>(
  "Conversation",
  conversationMongoSchema
);
