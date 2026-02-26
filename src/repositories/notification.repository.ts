import mongoose from "mongoose";
import { NotificationModel, INotification } from "../modules/notification.model";

type NotificationType =
    | "trip_reminder"
    | "partner_request"
    | "request_accepted"
    | "request_rejected"
    | "new_message"
    | "new_review";

export class NotificationRepository {
    /**
     * Create a new notification
     */
    async create(
        recipientId: string,
        type: NotificationType,
        title: string,
        body: string,
        relatedId?: string
    ): Promise<INotification> {
        const notification = await NotificationModel.create({
            recipient: new mongoose.Types.ObjectId(recipientId),
            type,
            title,
            body,
            relatedId: relatedId || "",
            isRead: false,
        });

        return notification;
    }

    /**
     * Find notifications for a user
     */
    async findByUser(
        userId: string,
        isRead?: boolean,
        page: number = 1,
        limit: number = 20
    ): Promise<{ notifications: INotification[]; total: number; pages: number; unreadCount: number }> {
        const skip = (page - 1) * limit;

        const filter: any = { recipient: new mongoose.Types.ObjectId(userId) };
        if (isRead !== undefined) {
            filter.isRead = isRead;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            NotificationModel.countDocuments(filter),
            NotificationModel.countDocuments({
                recipient: new mongoose.Types.ObjectId(userId),
                isRead: false,
            }),
        ]);

        return {
            notifications,
            total,
            pages: Math.ceil(total / limit),
            unreadCount,
        };
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<INotification | null> {
        return await NotificationModel.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<number> {
        const result = await NotificationModel.updateMany(
            {
                recipient: new mongoose.Types.ObjectId(userId),
                isRead: false,
            },
            { isRead: true }
        );

        return result.modifiedCount;
    }

    /**
     * Find notification by ID
     */
    async findById(notificationId: string): Promise<INotification | null> {
        return await NotificationModel.findById(notificationId);
    }

    /**
     * Delete notification
     */
    async delete(notificationId: string): Promise<boolean> {
        const result = await NotificationModel.findByIdAndDelete(notificationId);
        return !!result;
    }

    /**
     * Delete all notifications for a user
     */
    async deleteAllForUser(userId: string): Promise<number> {
        const result = await NotificationModel.deleteMany({
            recipient: new mongoose.Types.ObjectId(userId),
        });
        return result.deletedCount;
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
        return await NotificationModel.countDocuments({
            recipient: new mongoose.Types.ObjectId(userId),
            isRead: false,
        });
    }
}

export const notificationRepository = new NotificationRepository();
