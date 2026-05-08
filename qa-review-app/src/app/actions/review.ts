"use server";

import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/services/notificationService";

export async function getReview(id: string) {
    return await prisma.review.findUnique({
        where: { id },
        include: {
            form: true,
            project: {
                include: {
                    contactPerson: true,
                    lead: true,
                    reviewer: true,
                    secondaryReviewer: true
                }
            },
            secondaryReviewer: true
        }
    });
}

import { logActivity } from "@/lib/activityLogger";
import { getSession } from "@/lib/auth";
import { AIAnalysisService } from "@/services/aiAnalysisService";

export async function submitReview(
    reviewId: string,
    answers: any,
    summary: {
        healthStatus: string;
        deferredReason?: string;
        endedReason?: string;
        onHoldReason?: string;
        observations?: string;
        recommendedActions?: string;
        followUpComment?: string;
        aiAnalysis?: string;
        status?: string;
        scheduledDate?: string; // ISO string
    }
) {
    const session = await getSession();
    const user = session?.user;

    const status = summary.status || "SUBMITTED";

    // Only set submittedDate if we are actually submitting a review
    const isSubmission = status === "SUBMITTED";

    const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
            status: status,
            submittedDate: isSubmission ? new Date() : undefined,
            scheduledDate: summary.scheduledDate ? new Date(summary.scheduledDate) : null,
            answers: JSON.stringify(answers),
            healthStatus: summary.healthStatus,
            deferredReason: summary.deferredReason,
            endedReason: summary.endedReason,
            onHoldReason: summary.onHoldReason,
            observations: summary.observations,
            recommendedActions: summary.recommendedActions,
            followUpComment: summary.followUpComment,
            aiAnalysis: summary.aiAnalysis
        } as any,
        include: {
            project: {
                include: { lead: true }
            },
            reviewer: true,
            secondaryReviewer: true,
        }
    }) as any;

    // Trigger AI Analysis if project is challenged or critical
    const highRiskStatuses = ["Challenged", "Critical", "Risk", "Behind Schedule"];
    if (highRiskStatuses.includes(summary.healthStatus)) {
        AIAnalysisService.analyzeReview(reviewId).catch(err =>
            console.error("Background AI analysis failed:", err)
        );
    }

    // REVIEW_SUBMITTED notification — notify all admins / QA heads / project lead
    if (isSubmission) {
        (async () => {
            try {
                const adminUsers = await prisma.user.findMany({
                    where: {
                        OR: [
                            { roles: { contains: "ADMIN" } },
                            { roles: { contains: "QA_HEAD" } },
                            { roles: { contains: "QA_MANAGER" } },
                        ]
                    },
                    select: { id: true }
                });
                const recipientIds = [
                    ...adminUsers.map((u: { id: string }) => u.id),
                    review.project.lead?.id,
                ].filter((id): id is string => !!id);

                await NotificationService.onReviewSubmitted(
                    reviewId,
                    review.project.name,
                    user?.name || review.reviewer?.name || "Reviewer",
                    recipientIds
                );
            } catch (e) {
                console.error("REVIEW_SUBMITTED notification failed:", e);
            }
        })();
    }

    // REVIEW_SCHEDULED notification — notify reviewer + secondary reviewer
    if (summary.scheduledDate) {
        (async () => {
            try {
                const scheduled = new Date(summary.scheduledDate!).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric"
                });
                const reviewerIds = [
                    review.reviewerId,
                    review.secondaryReviewer?.id,
                ].filter((id): id is string => !!id);

                await NotificationService.onReviewScheduled(
                    reviewId,
                    review.project.name,
                    scheduled,
                    reviewerIds
                );
            } catch (e) {
                console.error("REVIEW_SCHEDULED notification failed:", e);
            }
        })();
    }

    // Log the activity
    await logActivity({
        userId: user?.id || review.reviewerId,
        userName: user?.name || review.reviewer.name,
        action: isSubmission ? 'SUBMIT_REVIEW' : 'UPDATE_REVIEW',
        entity: 'Review',
        entityId: reviewId,
        projectId: review.projectId,
        projectName: review.project.name,
        details: {
            status: status,
            healthStatus: summary.healthStatus
        }
    });

    return { success: true };
}
