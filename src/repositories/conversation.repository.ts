import mongoose from "mongoose";
import { ConversationModel, IConversation } from "../modules/conversation.model";

function generateConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_");
}

export class ConversationRepository {
  async ensureConversation(
    userId: string,
    otherUserId: string
  ): Promise<IConversation> {
    const conversationId = generateConversationId(userId, otherUserId);

    const existing = await ConversationModel.findOne({ conversationId });
    if (existing) {
      return existing;
    }

    const conversation = await ConversationModel.create({
      conversationId,
      participants: [
        new mongoose.Types.ObjectId(userId),
        new mongoose.Types.ObjectId(otherUserId),
      ],
      messageCount: 0,
      lastMessage: null,
      lastMessageAt: null,
    });

    return conversation;
  }

  async updateFromMessage(
    conversationId: string,
    messageId: string,
    messageCreatedAt: Date
  ): Promise<IConversation | null> {
    return ConversationModel.findOneAndUpdate(
      { conversationId },
      {
        $set: {
          lastMessage: new mongoose.Types.ObjectId(messageId),
          lastMessageAt: messageCreatedAt,
        },
        $inc: { messageCount: 1 },
      },
      { new: true }
    );
  }
}

export const conversationRepository = new ConversationRepository();
