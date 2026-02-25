import { Request, Response } from "express";
import { chatService } from "../services/chat.service";
import { EnsureConversationDto, SendMessageDto } from "../dots/message.dto";
import { HttpError } from "../errors/http-error";

export class ChatController {
    /**
     * Get all conversations for current user
     * GET /api/chat/conversations?page=1&limit=20
     */
    async getConversations(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await chatService.getConversations(userId, page, limit);

            res.status(200).json({
                success: true,
                message: "Conversations retrieved successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get conversations",
            });
        }
    }

    /**
     * Ensure a conversation exists between the current user and another user
     * POST /api/chat/conversations/ensure
     * Body: { participantId: string }
     */
    async ensureConversation(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const validatedData = EnsureConversationDto.parse(req.body);
            const { participantId } = validatedData;

            const conversation = await chatService.ensureConversation(
                userId,
                participantId
            );

            res.status(201).json({
                success: true,
                message: "Conversation ensured successfully",
                data: conversation,
            });
        } catch (error: any) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to ensure conversation",
            });
        }
    }

    /**
     * Get message history with a specific user
     * GET /api/chat/messages/:userId?page=1&limit=50
     */
    async getMessages(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const otherUserId = req.params.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            const result = await chatService.getMessageHistory(userId, otherUserId, page, limit);

            res.status(200).json({
                success: true,
                message: "Messages retrieved successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get messages",
            });
        }
    }

    /**
     * Send a message (REST API - also handled by Socket.io)
     * POST /api/chat/messages
     * Body: { receiverId: string, content: string }
     */
    async sendMessage(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const validatedData = SendMessageDto.parse(req.body);
            const { receiverId, content } = validatedData;

            const message = await chatService.sendMessage(userId, receiverId, content);

            // Emit Socket.io event if available
            const io = req.app.get("io");
            if (io) {
                io.to(receiverId).emit("receiveMessage", {
                    _id: message._id,
                    conversation: message.conversation,
                    sender: message.sender,
                    receiver: message.receiver,
                    content: message.content,
                    isRead: message.isRead,
                    createdAt: message.createdAt,
                });
            }

            res.status(201).json({
                success: true,
                message: "Message sent successfully",
                data: message,
            });
        } catch (error: any) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to send message",
            });
        }
    }

    /**
     * Mark messages as read
     * PUT /api/chat/messages/:userId/read
     */
    async markAsRead(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const otherUserId = req.params.userId;

            const result = await chatService.markMessagesAsRead(userId, otherUserId);

            // Emit Socket.io event if available
            const io = req.app.get("io");
            if (io) {
                io.to(otherUserId).emit("messagesRead", {
                    userId,
                });
            }

            res.status(200).json({
                success: true,
                message: "Messages marked as read",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to mark messages as read",
            });
        }
    }

    /**
     * Get unread message count
     * GET /api/chat/unread-count
     */
    async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const result = await chatService.getUnreadCount(userId);

            res.status(200).json({
                success: true,
                message: "Unread count retrieved successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get unread count",
            });
        }
    }

    /**
     * Get group chats for current user
     * GET /api/chat/groups?page=1&limit=20
     */
    async getGroupChats(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await chatService.getGroupChatsForUser(userId, page, limit);

            res.status(200).json({
                success: true,
                message: "Group chats retrieved successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get group chats",
            });
        }
    }

    // ===== GROUP CHAT METHODS =====

    /**
     * Create a group chat for a trip
     * POST /api/chat/groups
     * Body: { tripId: string }
     */
    async createGroup(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const { tripId } = req.body;
            if (!tripId) {
                throw new HttpError(400, "Trip ID is required");
            }

            const group = await chatService.createGroup(tripId, userId);

            res.status(201).json({
                success: true,
                message: "Group created successfully",
                data: group,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to create group",
            });
        }
    }

    /**
     * Get group chat for a trip
     * GET /api/chat/groups/:tripId
     */
    async getGroupByTrip(req: Request, res: Response) {
        try {
            const { tripId } = req.params;
            const group = await chatService.getGroupByTripId(tripId);

            res.status(200).json({
                success: true,
                message: "Group retrieved successfully",
                data: group,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get group",
            });
        }
    }

    /**
     * Get group chat by groupChatId
     * GET /api/chat/groups/chat/:groupChatId
     */
    async getGroupChat(req: Request, res: Response) {
        try {
            const { groupChatId } = req.params;
            const groupChat = await chatService.getGroupChatByGroupId(groupChatId);

            res.status(200).json({
                success: true,
                message: "Group chat retrieved successfully",
                data: groupChat,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get group chat",
            });
        }
    }

    /**
     * Add member to group
     * POST /api/chat/groups/:groupId/members
     * Body: { userId: string }
     */
    async addGroupMember(req: Request, res: Response) {
        try {
            const { groupId } = req.params;
            const { userId } = req.body;

            if (!userId) {
                throw new HttpError(400, "User ID is required");
            }

            const result = await chatService.addGroupMember(groupId, userId);

            res.status(200).json({
                success: true,
                message: "Member added to group successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to add member",
            });
        }
    }

    /**
     * Remove member from group
     * DELETE /api/chat/groups/:groupId/members/:userId
     */
    async removeGroupMember(req: Request, res: Response) {
        try {
            const { groupId, userId } = req.params;

            const result = await chatService.removeGroupMember(groupId, userId);

            res.status(200).json({
                success: true,
                message: "Member removed from group successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to remove member",
            });
        }
    }

    /**
     * Get group chat messages
     * GET /api/chat/groups/:groupId/messages?page=1&limit=50
     */
    async getGroupMessages(req: Request, res: Response) {
        try {
            const { groupId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            const result = await chatService.getGroupMessages(groupId, page, limit);

            res.status(200).json({
                success: true,
                message: "Group messages retrieved successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get group messages",
            });
        }
    }

    /**
     * Send message to group
     * POST /api/chat/groups/:groupId/messages
     * Body: { content: string }
     */
    async sendGroupMessage(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const { groupId } = req.params;
            const { content } = req.body;

            if (!content || content.trim().length === 0) {
                throw new HttpError(400, "Message content is required");
            }

            if (content.length > 2000) {
                throw new HttpError(400, "Message too long (max 2000 characters)");
            }

            const message = await chatService.sendGroupMessage(groupId, userId, content.trim());

            // Emit Socket.io event if available
            const io = req.app.get("io");
            if (io) {
                io.to(groupId).emit("groupMessage", {
                    _id: message._id,
                    groupId,
                    sender: message.sender,
                    content: message.content,
                    createdAt: message.createdAt,
                });
            }

            res.status(201).json({
                success: true,
                message: "Message sent successfully",
                data: message,
            });
        } catch (error: any) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to send message",
            });
        }
    }
}

export const chatController = new ChatController();
