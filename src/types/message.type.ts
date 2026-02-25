import { z } from "zod";

/**
 * Message Type Schema
 * Used for private chat messages between two users
 */
export const MessageSchema = z.object({
  conversation: z.string().min(1, "Conversation ID is required"),
  sender: z.string().min(1, "Sender ID is required"),
  receiver: z.string().min(1, "Receiver ID is required"),
  content: z.string().min(1, "Message content is required").max(2000, "Message too long (max 2000 characters)"),
  isRead: z.boolean().default(false),
  createdAt: z.date().optional(),
});

export type MessageType = z.infer<typeof MessageSchema>;
