import { z } from "zod";

/**
 * DTO for registering FCM device token
 */
export const RegisterTokenDto = z.object({
  token: z.string().min(1, "FCM token is required"),
  deviceType: z.enum(["ios", "android", "web"]).optional(),
});

export type RegisterTokenDto = z.infer<typeof RegisterTokenDto>;

/**
 * DTO for querying notifications
 */
export const GetNotificationsQueryDto = z.object({
  isRead: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type GetNotificationsQueryDto = z.infer<typeof GetNotificationsQueryDto>;

/**
 * DTO for creating a notification (internal use)
 */
export const CreateNotificationDto = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  type: z.enum([
    "trip_reminder",
    "partner_request",
    "request_accepted",
    "request_rejected",
    "new_message",
    "new_review",
  ]),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  relatedId: z.string().optional(),
});

export type CreateNotificationDto = z.infer<typeof CreateNotificationDto>;
