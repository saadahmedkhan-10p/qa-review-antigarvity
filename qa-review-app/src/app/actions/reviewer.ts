"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { sendEmail, emailTemplates } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/withAuth";
import { generateICS, getOutlookWebCalendarUrl } from "@/lib/calendar";

export async function updateReviewStatus(reviewId: string, status: string, options?: { reason?: string; date?: Date; timeZone?: string }) {
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
        } else if (status === 'PENDING') {
            data.scheduledDate = null;
        } else if (status === 'DEFERRED') {
            data.deferredReason = options?.reason || null;
            data.scheduledDate = null;
        } else if (status === 'ON_HOLD') {
            data.onHoldReason = options?.reason || null;
            data.scheduledDate = null;
        } else if (status === 'PROJECT_ENDED') {
            data.endedReason = options?.reason || null;
            data.scheduledDate = null;
        }

        const review = await prisma.review.update({
            where: { id: reviewId },
            data,
            include: {
                project: {
                    include: {
                        lead: true,
                        contactPerson: true
                    }
                },
                reviewer: true,
                secondaryReviewer: true,
                form: true
            }
        });

        // If newly scheduled, trigger calendar invitation email to all stakeholders
        if (status === 'SCHEDULED' && options?.date) {
            (async () => {
                try {
                    const scheduledDate = new Date(options.date!);
                    const attendees: { name: string; email: string }[] = [];

                    if (review.reviewer?.email) attendees.push({ name: review.reviewer.name || 'Primary Reviewer', email: review.reviewer.email });
                    if (review.secondaryReviewer?.email) attendees.push({ name: review.secondaryReviewer.name || 'Secondary Reviewer', email: review.secondaryReviewer.email });
                    if (review.project.contactPerson?.email) attendees.push({ name: review.project.contactPerson.name || 'QA Contact', email: review.project.contactPerson.email });
                    if (review.project.lead?.email) attendees.push({ name: review.project.lead.name || 'Project Lead', email: review.project.lead.email });

                    const icsContent = generateICS({
                        reviewId: review.id,
                        projectName: review.project.name,
                        formTitle: review.form.title,
                        startDate: scheduledDate,
                        reviewerName: review.reviewer?.name,
                        qaContactName: review.project.contactPerson?.name,
                        leadName: review.project.lead?.name,
                        attendees
                    });

                    const outlookUrl = getOutlookWebCalendarUrl({
                        reviewId: review.id,
                        projectName: review.project.name,
                        startDate: scheduledDate,
                        reviewerName: review.reviewer?.name,
                        qaContactName: review.project.contactPerson?.name,
                        leadName: review.project.lead?.name,
                        attendees
                    });

                    // Send invite email to each unique attendee
                    const uniqueRecipients = new Map<string, string>();
                    attendees.forEach(a => {
                        if (a.email && !uniqueRecipients.has(a.email.toLowerCase())) {
                            uniqueRecipients.set(a.email.toLowerCase(), a.name);
                        }
                    });

                    for (const [email, name] of uniqueRecipients.entries()) {
                        const emailData = emailTemplates.reviewScheduled({
                            recipientName: name,
                            projectName: review.project.name,
                            scheduledDate,
                            timeZone: options?.timeZone || 'Asia/Karachi',
                            reviewerName: review.reviewer?.name || 'Assigned Reviewer',
                            secondaryReviewerName: review.secondaryReviewer?.name,
                            qaContactName: review.project.contactPerson?.name,
                            leadName: review.project.lead?.name,
                            reviewId: review.id,
                            outlookUrl
                        });

                        await sendEmail(email, {
                            ...emailData,
                            icalEvent: {
                                filename: `qa-review-${review.project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`,
                                method: 'REQUEST',
                                content: icsContent
                            }
                        });
                    }
                } catch (e) {
                    console.error('Failed to send calendar invite emails:', e);
                }
            })();
        }

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


import { syncAllPendingReviewers } from "@/lib/syncReviewers";

// H-04: reviewerId param removed — always derived from the authenticated session
export async function getReviewerProjects() {
    const caller = await requireAuth();
    const reviewerId = caller.id;

    // Ensure database records for non-submitted reviews match the project's current reviewer assignments
    await syncAllPendingReviewers();

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

export async function scheduleReview(reviewId: string, date: Date, timeZone?: string) {
    // H-04: Require authentication; verify ownership before scheduling
    const caller = await requireAuth();

    const currentReview = await prisma.review.findUnique({
        where: { id: reviewId }
    });

    const callerRoles = caller.roles as string[];
    const isAdmin = callerRoles.includes("ADMIN") || callerRoles.includes("QA_HEAD");
    if (!isAdmin && currentReview?.reviewerId !== caller.id && currentReview?.secondaryReviewerId !== caller.id) {
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
                    lead: true,
                    contactPerson: true
                }
            },
            reviewer: true,
            secondaryReviewer: true,
            form: true
        }
    });

    // Send calendar invite emails to all stakeholders
    const scheduledDate = new Date(date);
    const attendees: { name: string; email: string }[] = [];

    if (review.reviewer?.email) attendees.push({ name: review.reviewer.name || 'Primary Reviewer', email: review.reviewer.email });
    if (review.secondaryReviewer?.email) attendees.push({ name: review.secondaryReviewer.name || 'Secondary Reviewer', email: review.secondaryReviewer.email });
    if (review.project.contactPerson?.email) attendees.push({ name: review.project.contactPerson.name || 'QA Contact', email: review.project.contactPerson.email });
    if (review.project.lead?.email) attendees.push({ name: review.project.lead.name || 'Project Lead', email: review.project.lead.email });

    const icsContent = generateICS({
        reviewId: review.id,
        projectName: review.project.name,
        formTitle: review.form?.title,
        startDate: scheduledDate,
        reviewerName: review.reviewer?.name,
        qaContactName: review.project.contactPerson?.name,
        leadName: review.project.lead?.name,
        attendees
    });

    const outlookUrl = getOutlookWebCalendarUrl({
        reviewId: review.id,
        projectName: review.project.name,
        startDate: scheduledDate,
        reviewerName: review.reviewer?.name,
        qaContactName: review.project.contactPerson?.name,
        leadName: review.project.lead?.name,
        attendees
    });

    const uniqueRecipients = new Map<string, string>();
    attendees.forEach(a => {
        if (a.email && !uniqueRecipients.has(a.email.toLowerCase())) {
            uniqueRecipients.set(a.email.toLowerCase(), a.name);
        }
    });

    for (const [email, name] of uniqueRecipients.entries()) {
        const emailData = emailTemplates.reviewScheduled({
            recipientName: name,
            projectName: review.project.name,
            scheduledDate,
            timeZone: timeZone || 'Asia/Karachi',
            reviewerName: review.reviewer?.name || 'Assigned Reviewer',
            secondaryReviewerName: review.secondaryReviewer?.name,
            qaContactName: review.project.contactPerson?.name,
            leadName: review.project.lead?.name,
            reviewId: review.id,
            outlookUrl
        });

        await sendEmail(email, {
            ...emailData,
            icalEvent: {
                filename: `qa-review-${review.project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`,
                method: 'REQUEST',
                content: icsContent
            }
        });
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
