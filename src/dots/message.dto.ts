import { z } from "zod";

/**
 * DTO for sending a new message
 */
export const SendMessageDto = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  content: z.string().min(1, "Message content is required").max(2000, "Message too long (max 2000 characters)"),
});

export type SendMessageDto = z.infer<typeof SendMessageDto>;

/**
 * DTO for marking messages as read
 */
export const MarkAsReadDto = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type MarkAsReadDto = z.infer<typeof MarkAsReadDto>;

/**
 * DTO for ensuring a conversation exists
 */
export const EnsureConversationDto = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
});

export type EnsureConversationDto = z.infer<typeof EnsureConversationDto>;
