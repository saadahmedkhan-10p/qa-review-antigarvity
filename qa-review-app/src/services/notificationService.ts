import { prisma } from "@/lib/prisma";

export type NotificationType =
    | "MENTION"
    | "COMMENT"
    | "REVIEW_ASSIGNED"
    | "REVIEW_SUBMITTED"
    | "REVIEW_SCHEDULED"
    | "AI_ALERT"
    | "ASSIGNMENT"
    | "SYSTEM";

export class NotificationService {
    // ─── Core CRUD ────────────────────────────────────────────────────────

    static async create(userId: string, type: NotificationType, message: string, link?: string) {
        return await prisma.notification.create({
            data: { userId, type, message, link },
        });
    }

    /** Returns unread notifications only (used by the notification bell badge). */
    static async getUnread(userId: string) {
        return await prisma.notification.findMany({
            where: { userId, read: false },
            orderBy: { createdAt: "desc" },
        });
    }

    /** Returns the last 100 notifications (read + unread) for the history page. */
    static async getAll(userId: string) {
        return await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    }

    static async markAsRead(id: string) {
        return await prisma.notification.update({ where: { id }, data: { read: true } });
    }

    static async markAllAsRead(userId: string) {
        return await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    }

    // ─── Semantic Event Helpers ───────────────────────────────────────────

    /**
     * COMMENT — Notify all review stakeholders (except the commenter) that a
     * new comment has been posted on a review.
     */
    static async onComment(
        reviewId: string,
        projectName: string,
        commenterName: string,
        recipientUserIds: string[],
        excludeUserId: string
    ) {
        const unique = [...new Set(recipientUserIds)].filter((id) => id !== excludeUserId);
        await Promise.all(
            unique.map((uid) =>
                this.create(
                    uid,
                    "COMMENT",
                    `${commenterName} commented on the review for "${projectName}"`,
                    `/reviews/${reviewId}`
                )
            )
        );
    }

    /**
     * REVIEW_ASSIGNED — Notify a reviewer/secondary reviewer that a new
     * review cycle has been initiated and they have been assigned.
     */
    static async onReviewAssigned(reviewId: string, projectName: string, reviewerUserId: string) {
        await this.create(
            reviewerUserId,
            "REVIEW_ASSIGNED",
            `You have been assigned to conduct the QA review for "${projectName}"`,
            `/reviews/${reviewId}`
        );
    }

    /**
     * REVIEW_SUBMITTED — Notify admins, QA heads, and the project lead when
     * a reviewer submits a completed review.
     */
    static async onReviewSubmitted(
        reviewId: string,
        projectName: string,
        reviewerName: string,
        recipientUserIds: string[]
    ) {
        const unique = [...new Set(recipientUserIds)];
        await Promise.all(
            unique.map((uid) =>
                this.create(
                    uid,
                    "REVIEW_SUBMITTED",
                    `${reviewerName} submitted the QA review for "${projectName}"`,
                    `/admin/reviews/${reviewId}`
                )
            )
        );
    }

    /**
     * REVIEW_SCHEDULED — Notify assigned reviewers when a review has been
     * given a specific scheduled date.
     */
    static async onReviewScheduled(
        reviewId: string,
        projectName: string,
        scheduledDate: string,
        reviewerUserIds: string[]
    ) {
        const unique = [...new Set(reviewerUserIds)];
        await Promise.all(
            unique.map((uid) =>
                this.create(
                    uid,
                    "REVIEW_SCHEDULED",
                    `The QA review for "${projectName}" has been scheduled for ${scheduledDate}`,
                    `/reviews/${reviewId}`
                )
            )
        );
    }

    /**
     * AI_ALERT — Notify project stakeholders when AI analysis flags a review
     * as HIGH or CRITICAL risk.
     */
    static async onAIAlert(
        reviewId: string,
        projectName: string,
        riskLevel: string,
        riskScore: number,
        recipientUserIds: string[]
    ) {
        const unique = [...new Set(recipientUserIds)].filter(Boolean);
        await Promise.all(
            unique.map((uid) =>
                this.create(
                    uid,
                    "AI_ALERT",
                    `AI Alert: "${projectName}" flagged as ${riskLevel} risk (Score: ${riskScore}/10)`,
                    `/reviews/${reviewId}`
                )
            )
        );
    }
}
