import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET - Fetch all comments for a review
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

// POST - Add a new comment
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: "Comment content is required" },
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

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        );
    }
}
