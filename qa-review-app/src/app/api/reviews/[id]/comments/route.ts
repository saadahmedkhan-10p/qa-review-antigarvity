import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NotificationService } from "@/services/notificationService";
import { sendEmail, emailTemplates } from "@/lib/email";

// Helper: verify the caller is associated with this review (reviewer, secondary, lead, or admin)
// Helper: verify the caller is associated with this review (reviewer, secondary, lead, or admin)
async function canAccessReview(reviewId: string, userId: string, roles: string[], isWrite: boolean = false): Promise<boolean> {
    const roleList = roles as any[];
    
    // Admin, QA Head/Manager, Director, and PM have global comment access
    const hasGlobalAccess = roleList.some(r => 
        ["ADMIN", "QA_HEAD", "QA_MANAGER", "QA_ARCHITECT", "DIRECTOR", "PM"].includes(r)
    );
    
    if (hasGlobalAccess) return true;
    
    // Check if user has comment permission at all if this is a write
    const hasCommentPermission = roleList.some(r => 
        ["REVIEW_LEAD", "REVIEWER", "DEV_ARCHITECT"].includes(r)
    );

    // If it's a write and they don't even have the permission, block early
    if (isWrite && !hasCommentPermission) return false;

    // For assigned roles (Lead, Reviewer, Dev Arch), verify they are linked to this specific review/project
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
        if (!(await canAccessReview(id, session.user.id, roles, false))) {
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
        if (!(await canAccessReview(id, session.user.id, roles, true))) {
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

        // Background: notify stakeholders + detect mentions
        (async () => {
            // 1. Load review relations to find all stakeholders
            const reviewWithProject = await prisma.review.findUnique({
                where: { id },
                include: {
                    project: {
                        include: { lead: true, contactPerson: true }
                    },
                    reviewer: true,
                    secondaryReviewer: true,
                }
            });

            if (reviewWithProject) {
                const stakeholderIds = [
                    reviewWithProject.reviewerId,
                    reviewWithProject.secondaryReviewerId,
                    reviewWithProject.project.leadId,
                    reviewWithProject.project.contactPersonId,
                ].filter((uid): uid is string => !!uid);

                // COMMENT notification for all stakeholders (excluding the commenter)
                await NotificationService.onComment(
                    id,
                    reviewWithProject.project.name,
                    session.user.name,
                    stakeholderIds,
                    session.user.id
                );
            }

            // 2. MENTION detection — @handle lookup
            const mentions = content.match(/@([a-zA-Z0-9._-]+)/g);
            if (mentions) {
                const uniqueHandles = Array.from(new Set(mentions.map((m: string) => m.substring(1)))) as string[];

                for (const handle of uniqueHandles) {
                    const targetUser = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { name: { contains: handle } },
                                { email: { startsWith: handle } }
                            ]
                        }
                    });

                    if (targetUser && targetUser.id !== session.user.id) {
                        await NotificationService.create(
                            targetUser.id,
                            "MENTION",
                            `${session.user.name} tagged you in a comment on a review.`,
                            `/reviews/${id}`
                        );

                        await sendEmail(
                            targetUser.email,
                            emailTemplates.mentionNotification(targetUser.name, session.user.name, content, id)
                        );
                    }
                }
            }
        })().catch(err => console.error("Notification processing error:", err));

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        );
    }
}
