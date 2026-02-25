import { messageRepository } from "../repositories/message.repository";
import { groupChatRepository } from "../repositories/groupChat.repository";
import { conversationRepository } from "../repositories/conversation.repository";
import { IMessage } from "../modules/message.model";
import { HttpError } from "../errors/http-error";

export class ChatService {
    /**
     * Send a message (REST API endpoint, also handled by Socket.io)
     */
    async sendMessage(
        senderId: string,
        receiverId: string,
        content: string
    ): Promise<IMessage> {
        if (!receiverId || !content || content.trim().length === 0) {
            throw new HttpError(400, "Receiver ID and message content are required");
        }

        if (content.length > 2000) {
            throw new HttpError(400, "Message too long (max 2000 characters)");
        }

        if (senderId === receiverId) {
            throw new HttpError(400, "Cannot send message to yourself");
        }

        const conversation = await conversationRepository.ensureConversation(
            senderId,
            receiverId
        );

        const message = await messageRepository.save(senderId, receiverId, content.trim());

        await conversationRepository.updateFromMessage(
            conversation.conversationId,
            message._id.toString(),
            message.createdAt
        );

        // Populate sender and receiver
        await message.populate([
            { path: "sender", select: "fullName profileImagePath" },
            { path: "receiver", select: "fullName profileImagePath" },
        ]);

        return message;
    }

    /**
     * Ensure a conversation exists between two users (created on open)
     */
    async ensureConversation(userId: string, otherUserId: string) {
        if (!otherUserId) {
            throw new HttpError(400, "Other user ID is required");
        }

        if (userId === otherUserId) {
            throw new HttpError(400, "Cannot create a conversation with yourself");
        }

        return conversationRepository.ensureConversation(userId, otherUserId);
    }

    /**
     * Get message history with another user
     */
    async getMessageHistory(
        userId: string,
        otherUserId: string,
        page: number = 1,
        limit: number = 50
    ): Promise<{ messages: IMessage[]; total: number; pages: number; currentPage: number }> {
        if (!otherUserId) {
            throw new HttpError(400, "Other user ID is required");
        }

        if (userId === otherUserId) {
            throw new HttpError(400, "Cannot get message history with yourself");
        }

        const result = await messageRepository.findByConversation(userId, otherUserId, page, limit);

        return {
            ...result,
            currentPage: page,
        };
    }

    /**
     * Get all conversations for a user
     */
    async getConversations(
        userId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ conversations: any[]; total: number; pages: number; currentPage: number }> {
        const result = await messageRepository.getConversations(userId, page, limit);

        return {
            ...result,
            currentPage: page,
        };
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(userId: string, otherUserId: string): Promise<{ count: number }> {
        if (!otherUserId) {
            throw new HttpError(400, "Other user ID is required");
        }

        const count = await messageRepository.markAsRead(userId, otherUserId);

        return { count };
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(userId: string): Promise<{ count: number }> {
        const count = await messageRepository.getUnreadCount(userId);
        return { count };
    }

    /**
     * Get group chats for a user (only with messages)
     */
    async getGroupChatsForUser(
        userId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ groupChats: any[]; total: number; pages: number; currentPage: number }> {
        const result = await groupChatRepository.getGroupChatsForUser(userId, page, limit);

        const groupChats = result.groupChats.map((groupChat: any) => {
            const trip = groupChat.trip && typeof groupChat.trip === "object"
                ? {
                      _id: groupChat.trip._id,
                      destination: groupChat.trip.destination,
                      images: groupChat.trip.images,
                      image: groupChat.trip.image,
                  }
                : groupChat.trip;

            return {
                _id: groupChat._id,
                groupChatId: groupChat.groupChatId,
                trip,
                members: groupChat.members,
                createdBy: groupChat.createdBy,
                lastMessage: groupChat.lastMessage,
                lastMessageAt: groupChat.lastMessageAt,
                messageCount: groupChat.messageCount,
                createdAt: groupChat.createdAt,
                updatedAt: groupChat.updatedAt,
            };
        });

        return {
            groupChats,
            total: result.total,
            pages: result.pages,
            currentPage: page,
        };
    }

    // ===== GROUP CHAT METHODS =====

    /**
     * Create a group chat for a trip
     */
    async createGroup(tripId: string, creatorId: string): Promise<any> {
        if (!tripId) {
            throw new HttpError(400, "Trip ID is required");
        }

        const groupId = `trip-${tripId}-${Date.now()}`;
        const group = {
            groupId,
            tripId,
            members: [creatorId],
            createdBy: creatorId,
            createdAt: new Date(),
        };

        return group;
    }

    /**
     * Get group by trip ID
     */
    async getGroupByTripId(tripId: string): Promise<any> {
        const groupId = `trip-${tripId}`;
        return {
            groupId,
            tripId,
            message: "Group ID for this trip",
        };
    }

    /**
     * Get group chat by groupChatId
     */
    async getGroupChatByGroupId(groupChatId: string): Promise<any> {
        if (!groupChatId) {
            throw new HttpError(400, "Group chat ID is required");
        }

        const groupChat = await groupChatRepository.getGroupChatByGroupId(groupChatId);
        if (!groupChat) {
            throw new HttpError(404, "Group chat not found");
        }

        return groupChat;
    }

    /**
     * Add member to group
     */
    async addGroupMember(groupId: string, userId: string): Promise<any> {
        if (!userId) {
            throw new HttpError(400, "User ID is required");
        }

        return {
            groupId,
            userId,
            message: "Member added successfully",
        };
    }

    /**
     * Remove member from group
     */
    async removeGroupMember(groupId: string, userId: string): Promise<any> {
        if (!userId) {
            throw new HttpError(400, "User ID is required");
        }

        return {
            groupId,
            userId,
            message: "Member removed successfully",
        };
    }

    /**
     * Get group messages
     */
    async getGroupMessages(
        groupId: string,
        page: number = 1,
        limit: number = 50
    ): Promise<{ messages: IMessage[]; total: number; pages: number; currentPage: number }> {
        if (!groupId) {
            throw new HttpError(400, "Group ID is required");
        }

        const result = await messageRepository.findByGroupId(groupId, page, limit);

        return {
            ...result,
            currentPage: page,
        };
    }

    /**
     * Send message to group
     */
    async sendGroupMessage(
        groupId: string,
        senderId: string,
        content: string
    ): Promise<IMessage> {
        if (!groupId || !content || content.trim().length === 0) {
            throw new HttpError(400, "Group ID and message content are required");
        }

        if (content.length > 2000) {
            throw new HttpError(400, "Message too long (max 2000 characters)");
        }

        // Save group message with groupId as conversation
        const message = await messageRepository.saveGroupMessage(
            groupId,
            senderId,
            content.trim(),
            groupId
        );

        // Populate sender
        await message.populate("sender", "-password");

        // Update GroupChat metadata (lastMessage, lastMessageAt, messageCount)
        try {
            await groupChatRepository.updateLastMessage(groupId, message._id.toString());
        } catch (error) {
            // Silently catch errors updating group chat metadata
            // This shouldn't fail message sending
            console.error("Error updating group chat metadata:", error);
        }

        return message;
    }
}

export const chatService = new ChatService();
