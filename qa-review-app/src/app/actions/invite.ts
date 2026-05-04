"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";
import { requireRole } from "@/lib/withAuth";

export async function sendProjectInvites(projectId: string) {
    // Auth matrix: requires ADMIN or QA_HEAD
    await requireRole("ADMIN", "QA_HEAD");

    // Get project with all related data
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            reviewer: true,
            secondaryReviewer: true,
            lead: true,
            contactPerson: true,
            reviews: {
                include: {
                    form: true
                }
            }
        }
    });

    if (!project) {
        return { error: "Project not found" };
    }

    if (!project.reviewer) {
        return { error: "Project has no reviewer assigned" };
    }

    let emailCount = 0;

    // Filter pending reviews in-memory
    const pendingReviews = project.reviews.filter(r => r.status !== "SUBMITTED");
    const totalReviewsCount = project.reviews.length;

    // If NO pending reviews exist, automatically create one so the reviewer can schedule it
    if (pendingReviews.length === 0) {
        // Find an active form for this project type
        let form = await prisma.form.findFirst({
            where: {
                OR: [
                    { projectType: (project as any).type },
                    { projectType: null }
                ],
                isActive: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (form) {
            const newReview = await prisma.review.create({
                data: {
                    projectId: project.id,
                    reviewerId: project.reviewerId!,
                    secondaryReviewerId: project.secondaryReviewerId,
                    formId: form.id,
                    status: 'PENDING',
                },
                include: {
                    form: true
                }
            });
            // Update the pending list so we can send the email for it
            pendingReviews.push(newReview);
        } else {
            return { error: "No pending reviews found and no active form available for this project type. Please ensure a form exists before sending invites." };
        }
    }

    // Now send "Review Invites" (Scheduling emails) for all reviews found or created
    for (const review of pendingReviews) {
        // Primary Reviewer invitation
        await sendEmail(
            project.reviewer.email,
            emailTemplates.reviewInvite(
                project.reviewer.name,
                project.name,
                review.form.title,
                new Date().toLocaleDateString(),
                project.secondaryReviewer?.name
            )
        );
        emailCount++;

        // Secondary Reviewer invitation (if assigned to this specific review)
        if (project.secondaryReviewer) {
            await sendEmail(
                project.secondaryReviewer.email,
                emailTemplates.reviewInvite(
                    project.secondaryReviewer.name,
                    project.name,
                    review.form.title,
                    new Date().toLocaleDateString(),
                    project.reviewer.name,
                    true // isSecondary
                )
            );
            emailCount++;
        }

        // Lead invitation/notification
        if (project.lead) {
            await sendEmail(
                project.lead.email,
                emailTemplates.reviewInvite(
                    project.lead.name,
                    project.name,
                    review.form.title,
                    new Date().toLocaleDateString(),
                    `${project.reviewer.name}${project.secondaryReviewer ? ` & ${project.secondaryReviewer.name}` : ''}`,
                    false, // isSecondary
                    true   // isLead
                )
            );
            emailCount++;
        }
    }


    return { success: true, count: emailCount };
}
