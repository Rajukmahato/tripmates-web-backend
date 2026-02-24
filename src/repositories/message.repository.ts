import mongoose, { PipelineStage } from "mongoose";
import { MessageModel, IMessage } from "../modules/message.model";

/**
 * Generate conversation ID from two user IDs (sorted for consistency)
 */
function generateConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join("_");
}

export class MessageRepository {
    /**
     * Save a new message
     */
    async save(
        senderId: string,
        receiverId: string,
        content: string
    ): Promise<IMessage> {
        const conversationId = generateConversationId(senderId, receiverId);

        const message = await MessageModel.create({
            conversation: conversationId,
            sender: new mongoose.Types.ObjectId(senderId),
            receiver: new mongoose.Types.ObjectId(receiverId),
            content,
            isRead: false,
        });

        return message;
    }

    /**
     * Save a group message
     */
    async saveGroupMessage(
        groupId: string,
        senderId: string,
        content: string,
        conversationId: string
    ): Promise<IMessage> {
        const message = await MessageModel.create({
            conversation: conversationId,
            sender: new mongoose.Types.ObjectId(senderId),
            content,
            isRead: false,
            type: "group",
            groupId: groupId,
        });

        return message;
    }

    /**
     * Find messages in a conversation between two users
     */
    async findByConversation(
        userId1: string,
        userId2: string,
        page: number = 1,
        limit: number = 50
    ): Promise<{ messages: IMessage[]; total: number; pages: number }> {
        const conversationId = generateConversationId(userId1, userId2);
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            MessageModel.find({ conversation: conversationId })
                .populate("sender", "fullName profileImagePath")
                .populate("receiver", "fullName profileImagePath")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            MessageModel.countDocuments({ conversation: conversationId }),
        ]);

        return {
            messages: messages.reverse(), // Reverse to show oldest first
            total,
            pages: Math.ceil(total / limit),
        };
    }

    /**
     * Get all conversations for a user with the latest message
     */
    async getConversations(
        userId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ conversations: any[]; total: number; pages: number }> {
        const skip = (page - 1) * limit;
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const basePipeline: PipelineStage[] = [
            {
                $match: {
                    $or: [{ sender: userObjectId }, { receiver: userObjectId }],
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $group: {
                    _id: "$conversation",
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiver", userObjectId] },
                                        { $eq: ["$isRead", false] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "lastMessage.sender",
                    foreignField: "_id",
                    as: "senderUser",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "lastMessage.receiver",
                    foreignField: "_id",
                    as: "receiverUser",
                },
            },
            {
                $addFields: {
                    senderUser: { $arrayElemAt: ["$senderUser", 0] },
                    receiverUser: { $arrayElemAt: ["$receiverUser", 0] },
                },
            },
            {
                $match: {
                    senderUser: { $ne: null },
                    receiverUser: { $ne: null },
                },
            },
            {
                $sort: { "lastMessage.createdAt": -1 },
            },
        ];

        const totalAgg = await MessageModel.aggregate([
            ...basePipeline,
            { $count: "total" },
        ]);
        const total = totalAgg[0]?.total ?? 0;

        const messages = await MessageModel.aggregate([
            ...basePipeline,
            { $skip: skip },
            { $limit: limit },
        ]);

        const conversations = messages.map((conv: any) => {
            const sender = conv.senderUser;
            const receiver = conv.receiverUser;
            const isSender = sender._id.toString() === userId;
            const participant = isSender ? receiver : sender;

            return {
                _id: conv._id,
                participant: {
                    _id: participant._id,
                    fullName: participant.fullName,
                    profileImagePath: participant.profileImagePath || "",
                    profileImage: participant.profileImagePath || "",
                },
                lastMessage: {
                    _id: conv.lastMessage._id,
                    content: conv.lastMessage.content,
                    createdAt: conv.lastMessage.createdAt,
                    updatedAt: conv.lastMessage.updatedAt,
                    sender: {
                        _id: sender._id,
                        fullName: sender.fullName,
                        profileImagePath: sender.profileImagePath || "",
                        profileImage: sender.profileImagePath || "",
                    },
                    receiver: {
                        _id: receiver._id,
                        fullName: receiver.fullName,
                        profileImagePath: receiver.profileImagePath || "",
                        profileImage: receiver.profileImagePath || "",
                    },
                    isRead: conv.lastMessage.isRead,
                },
                unreadCount: conv.unreadCount,
                updatedAt: conv.lastMessage.createdAt,
            };
        });

        return {
            conversations,
            total,
            pages: Math.ceil(total / limit),
        };
    }

    /**
     * Mark messages as read
     */
    async markAsRead(userId: string, otherUserId: string): Promise<number> {
        const conversationId = generateConversationId(userId, otherUserId);

        const result = await MessageModel.updateMany(
            {
                conversation: conversationId,
                receiver: new mongoose.Types.ObjectId(userId),
                isRead: false,
            },
            { isRead: true }
        );

        return result.modifiedCount;
    }

    /**
     * Get unread message count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        return await MessageModel.countDocuments({
            receiver: new mongoose.Types.ObjectId(userId),
            isRead: false,
        });
    }

    /**
     * Find messages in a group by groupId
     */
    async findByGroupId(
        groupId: string,
        page: number = 1,
        limit: number = 50
    ): Promise<{ messages: IMessage[]; total: number; pages: number }> {
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            MessageModel.find({ groupId, type: "group" })
                .populate("sender", "fullName profileImage email")
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit),
            MessageModel.countDocuments({ groupId, type: "group" }),
        ]);

        return {
            messages,
            total,
            pages: Math.ceil(total / limit),
        };
    }

    /**
     * Delete all messages in a conversation
     */
    async deleteConversation(userId1: string, userId2: string): Promise<number> {
        const conversationId = generateConversationId(userId1, userId2);

        const result = await MessageModel.deleteMany({ conversation: conversationId });
        return result.deletedCount;
    }
}

export const messageRepository = new MessageRepository();
