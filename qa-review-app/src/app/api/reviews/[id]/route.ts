import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        const user = session?.user;

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const review = await prisma.review.findUnique({
            where: { id },
            include: {
                form: true,
                project: {
                    include: {
                        lead: true,
                        contactPerson: true,
                        reviewer: true,
                        secondaryReviewer: true
                    }
                },
                reviewer: true,
                secondaryReviewer: true
            }
        });

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // Authorization check: Allow access if user is:
        // - The primary reviewer
        // - The secondary reviewer
        // - The project lead
        // - The contact person
        // - An admin/QA manager (check roles)
        const userRoles = Array.isArray(user.roles) ? user.roles :
            (typeof user.roles === 'string' && user.roles.startsWith('[')) ?
                JSON.parse(user.roles) : [user.roles];

        const isAdmin = userRoles.some((role: string) =>
            ['ADMIN', 'QA_HEAD', 'QA_MANAGER', 'QA_ARCHITECT', 'DIRECTOR'].includes(role)
        );

        const isAuthorized =
            review.reviewerId === user.id ||
            review.secondaryReviewerId === user.id ||
            review.project.leadId === user.id ||
            review.project.contactPersonId === user.id ||
            review.project.reviewerId === user.id ||
            review.project.secondaryReviewerId === user.id ||
            isAdmin;

        if (!isAuthorized) {
            console.log('Authorization failed for user:', user.email, 'review:', id);
            return NextResponse.json({ error: "Forbidden: You do not have access to this review" }, { status: 403 });
        }

        // Log successful access for debugging
        console.log('Review accessed by:', user.email, 'role:', userRoles, 'review:', id);
        console.log('Review data:', {
            hasAnswers: !!review.answers,
            hasQuestions: !!review.form?.questions,
            answersLength: review.answers?.length || 0,
            questionsLength: review.form?.questions?.length || 0
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error("Error fetching review:", error);
        return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
    }
}
