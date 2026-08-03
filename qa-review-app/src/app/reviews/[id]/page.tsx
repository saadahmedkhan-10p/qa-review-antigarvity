import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReviewRedirectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();

    if (!session || !session.user) {
        redirect("/");
    }

    const review = await prisma.review.findUnique({
        where: { id },
        select: { id: true, status: true, reviewerId: true, secondaryReviewerId: true }
    });

    if (!review) {
        redirect("/dashboard");
    }

    const userId = session.user.id;
    const isAssignedReviewer = review.reviewerId === userId || review.secondaryReviewerId === userId;
    const isPendingOrScheduled = review.status === "PENDING" || review.status === "SCHEDULED";

    // If assigned reviewer and review is not yet completed/submitted, take them to conduct page
    if (isAssignedReviewer && isPendingOrScheduled) {
        redirect(`/reviews/${id}/conduct`);
    }

    // Otherwise, redirect to view page
    redirect(`/reviews/${id}/view`);
}
