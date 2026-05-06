import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NotificationService } from "@/services/notificationService";
import { sendEmail, emailTemplates } from "@/lib/email";

// Helper: verify the caller is associated with this review (reviewer, secondary, lead, or admin)
async function canAccessReview(reviewId: string, userId: string, roles: string[]): Promise<boolean> {
    if (roles.includes("ADMIN") || roles.includes("QA_HEAD")) return true;
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { project: true },
    });
    if (!review) return false;
    return (
        review.reviewerId === userId ||
        review.secondaryReviewerId === userId ||
        review.project.leadId === userId ||
        review.project.contactPersonId === userId
    );
}

// GET - Fetch all comments for a review (H-01: requires auth + access check)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
        if (!(await canAccessReview(id, session.user.id, roles))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const comments = await prisma.comment.findMany({
            where: { reviewId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        roles: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

// POST - Add a new comment (H-01: requires auth + record-level access check)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
        if (!(await canAccessReview(id, session.user.id, roles))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: "Comment content is required" },
                { status: 400 }
            );
        }
        // M-07: Cap comment length
        if (content.trim().length > 5000) {
            return NextResponse.json(
                { error: "Comment must be 5000 characters or fewer" },
                { status: 400 }
            );
        }

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                reviewId: id,
                userId: session.user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        roles: true
                    }
                }
            }
        });

        // Background: Detect mentions
        (async () => {
            const mentions = content.match(/@(\w+)/g);
            if (mentions) {
                // Get unique mentions
                const uniqueMentions = Array.from(new Set(mentions.map((m: string) => m.substring(1)))) as string[];



                
                for (const targetName of uniqueMentions) {
                    const targetUser = await prisma.user.findFirst({
                        where: { 
                            OR: [
                                { name: { contains: targetName } },
                                { email: { startsWith: targetName } }
                            ]
                        }
                    });

                    if (targetUser && targetUser.id !== session.user.id) {
                        await NotificationService.create(
                            targetUser.id,
                            "MENTION",
                            `${session.user.name} tagged you in a comment.`,
                            `/reviews/${id}`
                        );

                        await sendEmail(
                            targetUser.email,
                            emailTemplates.mentionNotification(targetUser.name, session.user.name, content, id)
                        );
                    }
                }
            }
        })().catch(err => console.error("Mention processing error:", err));

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        );
    }
}
