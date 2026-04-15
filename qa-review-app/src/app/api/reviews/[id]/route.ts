import { NextResponse } from "next/server";
import { ReviewService } from "@/services/reviewService";
import { withErrorHandler } from "@/lib/apiErrorHandler";

/**
 * Standardized Review Detail API
 */
export const GET = withErrorHandler(async (req, { params, user }) => {
    const { id } = await params;
    const review = await ReviewService.getById(id);

    if (!review) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Record-level Authorization check
    const isAdmin = user.roles.some(role => 
        ['ADMIN', 'QA_HEAD', 'QA_MANAGER', 'QA_ARCHITECT', 'DIRECTOR'].includes(role)
    );

    const isAuthorized =
        review.reviewerId === user.id ||
        review.secondaryReviewerId === user.id ||
        review.project.leadId === user.id ||
        review.project.contactPersonId === user.id ||
        isAdmin;

    if (!isAuthorized) {
        return NextResponse.json({ error: "Forbidden: You do not have access to this review" }, { status: 403 });
    }

    return NextResponse.json(review);
});
