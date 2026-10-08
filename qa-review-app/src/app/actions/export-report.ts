"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/withAuth";

export type ProjectCategory = "MANUAL" | "AUTOMATION";

export interface ExportableProject {
    id: string;
    name: string;
    type: string;
    leadName?: string | null;
    reviewerName?: string | null;
    lastSubmittedDate?: string | null;
    lastReviewId?: string | null;
    hasSubmittedReview: boolean;
}

/**
 * Fetch projects categorized as Manual or Automation with their latest submitted review metadata.
 * Only accessible to ADMIN and QA_HEAD roles.
 */
export async function getExportableProjects(category: ProjectCategory): Promise<ExportableProject[]> {
    await requireRole("ADMIN", "QA_HEAD");

    const typeFilter = category === "MANUAL" 
        ? { in: ["MANUAL"] }
        : { in: ["AUTOMATION_WEB", "AUTOMATION_MOBILE", "API", "DESKTOP"] };

    const projects = await prisma.project.findMany({
        where: {
            type: typeFilter,
            status: "ACTIVE"
        },
        include: {
            lead: { select: { name: true } },
            reviewer: { select: { name: true } },
            reviews: {
                where: { status: "SUBMITTED" },
                orderBy: [
                    { submittedDate: "desc" },
                    { createdAt: "desc" }
                ],
                take: 1,
                select: {
                    id: true,
                    submittedDate: true,
                    createdAt: true
                }
            }
        },
        orderBy: { name: "asc" }
    });

    return projects.map(p => {
        const latestSubmitted = p.reviews[0];
        const submittedDate = latestSubmitted?.submittedDate || latestSubmitted?.createdAt;
        return {
            id: p.id,
            name: p.name,
            type: p.type,
            leadName: p.lead?.name || null,
            reviewerName: p.reviewer?.name || null,
            lastSubmittedDate: submittedDate ? submittedDate.toISOString() : null,
            lastReviewId: latestSubmitted?.id || null,
            hasSubmittedReview: !!latestSubmitted
        };
    });
}

/**
 * Fetch full details of the latest submitted review for each of the selected project IDs.
 * Only accessible to ADMIN and QA_HEAD roles.
 */
export async function getLastSubmittedReviewsForProjects(projectIds: string[]) {
    await requireRole("ADMIN", "QA_HEAD");

    if (!projectIds || projectIds.length === 0) {
        return [];
    }

    const reviewsData = await Promise.all(
        projectIds.map(async (projectId) => {
            const review = await prisma.review.findFirst({
                where: {
                    projectId,
                    status: "SUBMITTED"
                },
                orderBy: [
                    { submittedDate: "desc" },
                    { createdAt: "desc" }
                ],
                include: {
                    project: {
                        include: {
                            lead: { select: { name: true, email: true } },
                            contactPerson: { select: { name: true, email: true } },
                            reviewer: { select: { name: true, email: true } },
                            secondaryReviewer: { select: { name: true, email: true } }
                        }
                    },
                    reviewer: { select: { name: true, email: true } },
                    secondaryReviewer: { select: { name: true, email: true } },
                    form: {
                        select: {
                            id: true,
                            title: true,
                            questions: true,
                            projectType: true
                        }
                    }
                }
            });

            if (!review) return null;

            return {
                id: review.id,
                status: review.status,
                healthStatus: review.healthStatus || "On Track",
                observations: review.observations || null,
                recommendedActions: review.recommendedActions || null,
                followUpComment: review.followUpComment || null,
                aiAnalysis: review.aiAnalysis || null,
                submittedDate: (review.submittedDate || review.createdAt).toISOString(),
                createdAt: review.createdAt.toISOString(),
                answers: review.answers,
                project: {
                    id: review.project.id,
                    name: review.project.name,
                    type: review.project.type,
                    lead: review.project.lead,
                    contactPerson: review.project.contactPerson,
                    reviewer: review.project.reviewer,
                    secondaryReviewer: review.project.secondaryReviewer
                },
                reviewer: review.reviewer,
                secondaryReviewer: review.secondaryReviewer,
                form: review.form
            };
        })
    );

    // Filter out projects that didn't have any submitted review
    return reviewsData.filter(Boolean);
}
