import { prisma } from "@/lib/prisma";

/**
 * Synchronizes all non-submitted reviews (PENDING, SCHEDULED, NOT_COMPLETED, DEFERRED, ON_HOLD)
 * with their parent project's current primary and secondary reviewer assignments.
 */
export async function syncAllPendingReviewers(projectId?: string) {
    try {
        const projects = await prisma.project.findMany({
            where: projectId ? { id: projectId } : { status: "ACTIVE" },
            select: {
                id: true,
                reviewerId: true,
                secondaryReviewerId: true,
            }
        });

        for (const project of projects) {
            if (!project.reviewerId) continue;

            await prisma.review.updateMany({
                where: {
                    projectId: project.id,
                    status: { not: "SUBMITTED" },
                    OR: [
                        { reviewerId: { not: project.reviewerId } },
                        { secondaryReviewerId: { not: project.secondaryReviewerId } }
                    ]
                },
                data: {
                    reviewerId: project.reviewerId,
                    secondaryReviewerId: project.secondaryReviewerId
                }
            });
        }
    } catch (error) {
        console.error("[syncAllPendingReviewers] Error syncing reviewers:", error);
    }
}
