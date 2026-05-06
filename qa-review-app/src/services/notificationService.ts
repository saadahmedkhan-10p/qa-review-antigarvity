import { prisma } from "@/lib/prisma";

export type NotificationType = "MENTION" | "ASSIGNMENT" | "AI_ALERT" | "SYSTEM";

export class NotificationService {
    /**
     * Create a new notification for a user
     */
    static async create(userId: string, type: NotificationType, message: string, link?: string) {
        return await prisma.notification.create({
            data: {
                userId,
                type,
                message,
                link,
            }
        });
    }

    /**
     * Get unread notifications for a user
     */
    static async getUnread(userId: string) {
        return await prisma.notification.findMany({
            where: {
                userId,
                read: false,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });
    }

    /**
     * Mark a notification as read
     */
    static async markAsRead(id: string) {
        return await prisma.notification.update({
            where: { id },
            data: { read: true }
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId: string) {
        return await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
    }
}
