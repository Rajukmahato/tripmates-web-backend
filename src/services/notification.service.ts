import { notificationRepository } from "../repositories/notification.repository";
import { INotification } from "../modules/notification.model";
import { HttpError } from "../errors/http-error";
import mongoose from "mongoose";

type NotificationType =
    | "trip_reminder"
    | "partner_request"
    | "request_accepted"
    | "request_rejected"
    | "new_message"
    | "new_review";

// In-memory storage for FCM tokens (in production, store in database or Redis)
const fcmTokens = new Map<string, string>();

export class NotificationService {
    /**
     * Register FCM device token for a user
     */
    async registerToken(userId: string, token: string): Promise<{ message: string }> {
        if (!token || token.trim().length === 0) {
            throw new HttpError(400, "FCM token is required");
        }

        // Store token in memory (in production, store in database)
        fcmTokens.set(userId, token);

        return { message: "Device token registered successfully" };
    }

    /**
     * Send push notification using FCM
     * Note: Firebase Admin SDK integration required for production
     */
    private async sendPushNotification(
        userId: string,
        title: string,
        body: string,
        data?: any
    ): Promise<void> {
        const token = fcmTokens.get(userId);

        if (!token) {
            return;
        }

        // TODO: Implement Firebase Admin SDK push notification
        // Example implementation:
        /*
        const admin = require('firebase-admin');
        
        try {
            await admin.messaging().send({
                token: token,
                notification: {
                    title,
                    body,
                },
                data: data || {},
            });
        } catch (error) {
            console.error(`Failed to send push notification:`, error);
        }
        */
    }

    /**
     * Create and send notification
     */
    async createNotification(
        recipientId: string,
        type: NotificationType,
        title: string,
        body: string,
        relatedId?: string
    ): Promise<INotification> {
        // Create in-app notification
        const notification = await notificationRepository.create(
            recipientId,
            type,
            title,
            body,
            relatedId
        );

        // Send push notification
        await this.sendPushNotification(recipientId, title, body, {
            type,
            relatedId: relatedId || "",
            notificationId: notification._id.toString(),
        });

        return notification;
    }

    /**
     * Get notifications for a user
     */
    async getNotifications(
        userId: string,
        isRead?: boolean,
        page: number = 1,
        limit: number = 20
    ): Promise<{
        notifications: INotification[];
        total: number;
        pages: number;
        currentPage: number;
        unreadCount: number;
    }> {
        const result = await notificationRepository.findByUser(userId, isRead, page, limit);

        return {
            ...result,
            currentPage: page,
        };
    }

    /**
     * Mark notification as read
     */
    async markAsRead(userId: string, notificationId: string): Promise<INotification> {
        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            throw new HttpError(400, "Invalid notification ID");
        }

        const notification = await notificationRepository.findById(notificationId);

        if (!notification) {
            throw new HttpError(404, "Notification not found");
        }

        // Verify ownership
        if (notification.recipient.toString() !== userId) {
            throw new HttpError(403, "You can only mark your own notifications as read");
        }

        const updatedNotification = await notificationRepository.markAsRead(notificationId);

        if (!updatedNotification) {
            throw new HttpError(500, "Failed to mark notification as read");
        }

        return updatedNotification;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string): Promise<{ count: number }> {
        const count = await notificationRepository.markAllAsRead(userId);

        return { count };
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<{ count: number }> {
        const count = await notificationRepository.getUnreadCount(userId);

        return { count };
    }

    // ===== Notification Trigger Methods =====

    /**
     * Notify when partner request is sent
     */
    async notifyPartnerRequestSent(receiverId: string, senderName: string, tripTitle: string, requestId: string) {
        await this.createNotification(
            receiverId,
            "partner_request",
            "New Partner Request",
            `${senderName} wants to be your travel partner for "${tripTitle}"`,
            requestId
        );
    }

    /**
     * Notify when partner request is accepted
     */
    async notifyPartnerRequestAccepted(senderId: string, acceptorName: string, tripTitle: string, requestId: string) {
        await this.createNotification(
            senderId,
            "request_accepted",
            "Partner Request Accepted",
            `${acceptorName} accepted your partner request for "${tripTitle}"`,
            requestId
        );
    }

    /**
     * Notify when partner request is rejected
     */
    async notifyPartnerRequestRejected(senderId: string, rejecterName: string, tripTitle: string, requestId: string) {
        await this.createNotification(
            senderId,
            "request_rejected",
            "Partner Request Rejected",
            `${rejecterName} declined your partner request for "${tripTitle}"`,
            requestId
        );
    }

    /**
     * Notify when new message is received
     */
    async notifyNewMessage(receiverId: string, senderName: string, messagePreview: string, conversationId: string) {
        await this.createNotification(
            receiverId,
            "new_message",
            `New message from ${senderName}`,
            messagePreview.length > 50 ? messagePreview.substring(0, 50) + "..." : messagePreview,
            conversationId
        );
    }

    /**
     * Notify when new review is submitted
     */
    async notifyNewReview(revieweeId: string, reviewerName: string, rating: number, reviewId: string) {
        await this.createNotification(
            revieweeId,
            "new_review",
            "New Review Received",
            `${reviewerName} gave you ${rating} stars`,
            reviewId
        );
    }
}

export const notificationService = new NotificationService();
