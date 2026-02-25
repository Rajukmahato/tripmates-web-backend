import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs";
import { MessageModel } from "../modules/message.model";
import mongoose from "mongoose";

/**
 * Interface for authenticated socket with user data
 */
interface AuthenticatedSocket extends Socket {
    userId?: string;
}

interface SendMessageData {
    receiverId?: string;
    content: string;
    groupId?: string;
    tripId?: string;
}

/**
 * Generate conversation ID from two user IDs (sorted for consistency)
 */
function generateConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join("_");
}

/**
 * Authenticate socket connection using JWT token
 */
function authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { _id?: string; id?: string };
        const userId = decoded._id || decoded.id;

        if (!userId) {
            return next(new Error("Authentication error: Invalid token payload"));
        }

        socket.userId = userId;
        next();
    } catch (error) {
        next(new Error("Authentication error: Invalid token"));
    }
}

/**
 * Initialize chat socket handlers
 */
export function initializeChatSocket(io: Server) {
    // Apply authentication middleware
    io.use(authenticateSocket);

    io.on("connection", (socket: AuthenticatedSocket) => {
        console.log(`✅ User connected: ${socket.userId}`);

        // Join user to their personal room (for receiving messages)
        if (socket.userId) {
            socket.join(socket.userId);
            
            // Broadcast user online status
            io.emit("userOnline", { userId: socket.userId });
        }

        // Handle sending a message
        socket.on("sendMessage", async (data: SendMessageData) => {
            try {
                const { receiverId, content } = data;

                if (!socket.userId) {
                    socket.emit("error", { message: "User not authenticated" });
                    return;
                }

                // Validate input
                if (!receiverId || !content || content.trim().length === 0) {
                    socket.emit("error", { message: "Invalid message data" });
                    return;
                }

                if (content.length > 2000) {
                    socket.emit("error", { message: "Message too long (max 2000 characters)" });
                    return;
                }

                // Generate conversation ID
                const conversationId = generateConversationId(socket.userId, receiverId);

                // Save message to database
                const message = await MessageModel.create({
                    conversation: conversationId,
                    sender: new mongoose.Types.ObjectId(socket.userId),
                    receiver: new mongoose.Types.ObjectId(receiverId),
                    content: content.trim(),
                    isRead: false,
                });

                // Populate sender and receiver data
                await message.populate([
                    { path: "sender", select: "fullName profileImagePath" },
                    { path: "receiver", select: "fullName profileImagePath" },
                ]);

                // Emit message to receiver
                io.to(receiverId).emit("receiveMessage", {
                    _id: message._id,
                    conversation: message.conversation,
                    sender: message.sender,
                    receiver: message.receiver,
                    content: message.content,
                    isRead: message.isRead,
                    createdAt: message.createdAt,
                });

                // Send acknowledgment to sender
                socket.emit("messageSent", {
                    _id: message._id,
                    conversation: message.conversation,
                    sender: message.sender,
                    receiver: message.receiver,
                    content: message.content,
                    isRead: message.isRead,
                    createdAt: message.createdAt,
                });

                console.log(`📨 Message sent from ${socket.userId} to ${receiverId}`);
            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // Handle marking messages as read
        socket.on("markAsRead", async (data: { senderId: string }) => {
            try {
                const { senderId } = data;

                if (!socket.userId) {
                    socket.emit("error", { message: "User not authenticated" });
                    return;
                }

                // Generate conversation ID
                const conversationId = generateConversationId(socket.userId, senderId);

                // Mark all messages in this conversation as read
                await MessageModel.updateMany(
                    {
                        conversation: conversationId,
                        receiver: new mongoose.Types.ObjectId(socket.userId),
                        isRead: false,
                    },
                    { isRead: true }
                );

                // Notify sender that messages were read
                io.to(senderId).emit("messagesRead", {
                    userId: socket.userId,
                    conversationId,
                });

                console.log(`✅ Messages marked as read in conversation ${conversationId}`);
            } catch (error) {
                console.error("Error marking messages as read:", error);
                socket.emit("error", { message: "Failed to mark messages as read" });
            }
        });

        // Handle user typing indicator
        socket.on("typing", (data: { receiverId: string; isTyping: boolean }) => {
            const { receiverId, isTyping } = data;
            io.to(receiverId).emit("userTyping", {
                userId: socket.userId,
                isTyping,
            });
        });

        // ===== GROUP CHAT HANDLERS =====

        // Handle joining group chat
        socket.on("joinGroup", (data: { groupId: string; tripId: string }) => {
            try {
                const { groupId, tripId } = data;

                if (!socket.userId) {
                    socket.emit("error", { message: "User not authenticated" });
                    return;
                }

                const groupRoom = `group-${groupId}`;
                socket.join(groupRoom);

                // Notify group that user joined
                io.to(groupRoom).emit("groupMemberJoined", {
                    userId: socket.userId,
                    groupId,
                    timestamp: new Date(),
                });

                console.log(`✅ User ${socket.userId} joined group ${groupId}`);
            } catch (error: any) {
                socket.emit("error", { message: error.message });
            }
        });

        // Handle leaving group chat
        socket.on("leaveGroup", (data: { groupId: string }) => {
            try {
                const { groupId } = data;

                if (!socket.userId) {
                    socket.emit("error", { message: "User not authenticated" });
                    return;
                }

                const groupRoom = `group-${groupId}`;
                socket.leave(groupRoom);

                // Notify group that user left
                io.to(groupRoom).emit("groupMemberLeft", {
                    userId: socket.userId,
                    groupId,
                    timestamp: new Date(),
                });

                console.log(`❌ User ${socket.userId} left group ${groupId}`);
            } catch (error: any) {
                socket.emit("error", { message: error.message });
            }
        });

        // Handle sending group message
        socket.on("sendGroupMessage", async (data: SendMessageData) => {
            try {
                const { groupId, tripId, content } = data;

                if (!socket.userId) {
                    socket.emit("error", { message: "User not authenticated" });
                    return;
                }

                // Validate input
                if (!groupId || !content || content.trim().length === 0) {
                    socket.emit("error", { message: "Invalid message data" });
                    return;
                }

                if (content.length > 2000) {
                    socket.emit("error", { message: "Message too long (max 2000 characters)" });
                    return;
                }

                // Save group message to database
                const message = await MessageModel.create({
                    conversation: groupId,
                    sender: new mongoose.Types.ObjectId(socket.userId),
                    content: content.trim(),
                    isRead: true, // Group messages are considered read
                    type: "group",
                    groupId,
                    tripId: tripId ? new mongoose.Types.ObjectId(tripId) : undefined,
                });

                // Populate sender data
                await message.populate("sender", "fullName profileImagePath");

                // Broadcast to group
                const groupRoom = `group-${groupId}`;
                io.to(groupRoom).emit("receiveGroupMessage", {
                    _id: message._id,
                    conversation: message.conversation,
                    sender: message.sender,
                    content: message.content,
                    type: message.type,
                    groupId: message.groupId,
                    createdAt: message.createdAt,
                });

                console.log(`📨 Group message sent in ${groupId} by ${socket.userId}`);
            } catch (error) {
                console.error("Error sending group message:", error);
                socket.emit("error", { message: "Failed to send group message" });
            }
        });

        // Handle group typing indicator
        socket.on("groupTyping", (data: { groupId: string; isTyping: boolean }) => {
            try {
                const { groupId, isTyping } = data;
                const groupRoom = `group-${groupId}`;

                io.to(groupRoom).emit("groupUserTyping", {
                    userId: socket.userId,
                    groupId,
                    isTyping,
                });
            } catch (error: any) {
                socket.emit("error", { message: error.message });
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log(`❌ User disconnected: ${socket.userId}`);
            
            if (socket.userId) {
                // Broadcast user offline status
                io.emit("userOffline", { userId: socket.userId });
            }
        });
    });
}
