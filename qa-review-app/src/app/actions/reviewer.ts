"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { sendEmail, emailTemplates } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/withAuth";

export async function updateReviewStatus(reviewId: string, status: string, options?: { reason?: string; date?: Date }) {
    // H-04: Require authentication; verify ownership before updating
    const caller = await requireAuth();

    // Validate status
    const validStatuses = ['PENDING', 'SCHEDULED', 'DEFERRED', 'ON_HOLD', 'PROJECT_ENDED'];
    if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
    }

    try {
        const currentReview = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        // H-04: Verify the caller is associated with this review (unless admin)
        const callerRoles = caller.roles as string[];
        const isAdmin = callerRoles.includes("ADMIN") || callerRoles.includes("QA_HEAD");
        if (!isAdmin && currentReview?.reviewerId !== caller.id && currentReview?.secondaryReviewerId !== caller.id) {
            throw new Error("Forbidden");
        }

        const data: any = { status };

        if (status === 'SCHEDULED' && options?.date) {
            data.scheduledDate = options.date;
        } else if (status === 'DEFERRED' && options?.reason) {
            data.deferredReason = options.reason;
        } else if (status === 'ON_HOLD' && options?.reason) {
            data.onHoldReason = options.reason;
        } else if (status === 'PROJECT_ENDED' && options?.reason) {
            data.endedReason = options.reason;
        }

        const review = await prisma.review.update({
            where: { id: reviewId },
            data,
            include: {
                project: true,
                reviewer: true,
                form: true
            }
        });

        // Log activity
        // Log activity
        await logActivity({
            action: status === 'SUBMITTED' ? 'SUBMIT_REVIEW' : 'UPDATE_REVIEW',
            entity: 'Review',
            entityId: reviewId,
            userId: review.reviewerId,
            projectId: review.projectId,
            projectName: review.project.name,
            details: {
                action: 'status_change',
                oldStatus: currentReview?.status,
                newStatus: status,
                formId: review.formId,
                ...options
            }
        });

        revalidatePath("/reviewer/dashboard");
        revalidatePath("/lead/dashboard");
        revalidatePath("/admin/reviews");

        return review;
    } catch (error) {
        console.error('Error updating review status:', error);
        throw error;
    }
}


// H-04: reviewerId param removed — always derived from the authenticated session
export async function getReviewerProjects() {
    const caller = await requireAuth();
    const reviewerId = caller.id;

    console.log('[getReviewerProjects] Called for authenticated user:', reviewerId);

    try {
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { reviewerId },
                    { secondaryReviewerId: reviewerId },
                    {
                        reviews: {
                            some: {
                                OR: [
                                    { reviewerId },
                                    { secondaryReviewerId: reviewerId }
                                ]
                            }
                        }
                    }
                ]
            },
            include: {
                lead: true,
                contactPerson: true,
                secondaryReviewer: true,
                reviews: {
                    include: { form: true },
                    orderBy: { createdAt: 'desc' }
                }
            },
        });

        console.log('[getReviewerProjects] Found projects:', projects.length);
        if (projects.length > 0) {
            console.log('[getReviewerProjects] First project:', projects[0].name);
        }

        return projects;
    } catch (error) {
        console.error('[getReviewerProjects] Error:', error);
        throw error;
    }
}

export async function debugReviewer(reviewerId: string) {
    const count = await prisma.project.count({
        where: { reviewerId }
    });
    const project = await prisma.project.findFirst({
        where: { reviewerId }
    });
    return {
        queriedId: reviewerId,
        count,
        firstProject: project ? project.name : 'None',
        dbUrl: process.env.DATABASE_URL
    };
}

export async function scheduleReview(reviewId: string, date: Date) {
    // H-04: Require auth and verify the caller owns this review
    const caller = await requireAuth();
    const reviewRecord = await prisma.review.findUnique({ where: { id: reviewId } });
    const callerRoles = caller.roles as string[];
    const isAdmin = callerRoles.includes("ADMIN") || callerRoles.includes("QA_HEAD");
    if (!isAdmin && reviewRecord?.reviewerId !== caller.id && reviewRecord?.secondaryReviewerId !== caller.id) {
        throw new Error("Forbidden");
    }

    const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
            scheduledDate: date,
            status: "SCHEDULED"
        },
        include: {
            project: {
                include: {
                    lead: true
                }
            },
            reviewer: true
        }
    });

    // Send confirmation email to reviewer
    await sendEmail(
        review.reviewer.email,
        emailTemplates.reviewScheduled(
            review.reviewer.name,
            review.project.name,
            new Date(date).toLocaleDateString()
        )
    );

    // Notify lead
    if (review.project.lead?.email) {
        await sendEmail(
            review.project.lead.email,
            emailTemplates.leadNotification(
                review.project.lead.name,
                review.project.name,
                review.reviewer.name,
                `Review scheduled for ${new Date(date).toLocaleDateString()}`
            )
        );
    }

    await logActivity({
        action: 'UPDATE_REVIEW', // Using UPDATE_REVIEW as scheduling is an update to the review state
        entity: 'Review',
        entityId: reviewId,
        userId: review.reviewerId,
        projectId: review.projectId,
        projectName: review.project.name,
        details: {
            action: 'scheduled',
            scheduledDate: date
        }
    });

    revalidatePath("/reviewer/dashboard");
    revalidatePath("/lead/dashboard");
}
