import { z } from "zod";

/**
 * Notification Type Schema
 * Used for in-app and push notifications
 */
export const NotificationSchema = z.object({
  recipient: z.string().min(1, "Recipient ID is required"),
  type: z.enum([
    "trip_reminder",
    "partner_request",
    "request_accepted",
    "request_rejected",
    "new_message",
    "new_review",
    "location_shared",
    "trip_started",
    "itinerary_updated",
  ]),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  isRead: z.boolean().default(false),
  relatedId: z.string().optional(),
  createdAt: z.date().optional(),
});

export type NotificationType = z.infer<typeof NotificationSchema>;

export const NotificationTypeEnum = [
  "trip_reminder",
  "partner_request",
  "request_accepted",
  "request_rejected",
  "new_message",
  "new_review",
] as const;
