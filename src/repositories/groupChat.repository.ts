import { GroupChatModel, IGroupChat } from "../modules/groupChat.model";
import mongoose from "mongoose";

export class GroupChatRepository {
  /**
   * Create a new group chat
   */
  async createGroupChat(groupChatData: Partial<IGroupChat>): Promise<IGroupChat> {
    const groupChat = new GroupChatModel(groupChatData);
    return await groupChat.save();
  }

  /**
   * Get group chat by groupChatId
   */
  async getGroupChatByGroupId(groupChatId: string): Promise<IGroupChat | null> {
    const groupChat = await GroupChatModel.findOne({ groupChatId })
      .populate("trip", "-password")
      .populate("members", "-password")
      .populate("createdBy", "-password")
      .populate("lastMessage");
    return groupChat;
  }

  /**
   * Get group chat by trip ID
   */
  async getGroupChatByTripId(tripId: string): Promise<IGroupChat | null> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return null;
    }
    const groupChat = await GroupChatModel.findOne({ trip: tripId })
      .populate("trip", "-password")
      .populate("members", "-password")
      .populate("createdBy", "-password")
      .populate("lastMessage");
    return groupChat;
  }

  /**
   * Add member to group chat
   */
  async addMember(groupChatId: string, userId: string): Promise<IGroupChat | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    const groupChat = await GroupChatModel.findOneAndUpdate(
      { groupChatId },
      { $addToSet: { members: new mongoose.Types.ObjectId(userId) } },
      { new: true }
    );
    return groupChat;
  }

  /**
   * Remove member from group chat
   */
  async removeMember(groupChatId: string, userId: string): Promise<IGroupChat | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    const groupChat = await GroupChatModel.findOneAndUpdate(
      { groupChatId },
      { $pull: { members: new mongoose.Types.ObjectId(userId) } },
      { new: true }
    );
    return groupChat;
  }

  /**
   * Update last message and count
   */
  async updateLastMessage(
    groupChatId: string,
    messageId: string
  ): Promise<IGroupChat | null> {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return null;
    }
    const groupChat = await GroupChatModel.findOneAndUpdate(
      { groupChatId },
      {
        lastMessage: new mongoose.Types.ObjectId(messageId),
        lastMessageAt: new Date(),
        $inc: { messageCount: 1 },
      },
      { new: true }
    );
    return groupChat;
  }

  /**
   * Get all group chats for a user (as member)
   */
  async getGroupChatsForUser(userId: string, page: number = 1, limit: number = 10) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { groupChats: [], total: 0, pages: 0 };
    }

    const skip = (page - 1) * limit;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const baseQuery = {
      members: userObjectId,
      $or: [{ messageCount: { $gt: 0 } }, { lastMessage: { $ne: null } }],
    };

    const [groupChats, total] = await Promise.all([
      GroupChatModel.find(baseQuery)
        .populate("trip", "-password")
        .populate("createdBy", "-password")
        .populate({
          path: "lastMessage",
          populate: { path: "sender", select: "fullName profileImagePath" },
        })
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit),
      GroupChatModel.countDocuments(baseQuery),
    ]);

    return {
      groupChats,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete group chat (cascade when trip is deleted)
   */
  async deleteGroupChat(groupChatId: string): Promise<boolean> {
    const result = await GroupChatModel.findOneAndDelete({ groupChatId });
    return result ? true : false;
  }
}

export const groupChatRepository = new GroupChatRepository();
