import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        // Get current user from session
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Get only projects where user is assigned as PM
        const projects = await prisma.project.findMany({
            where: { pmId: userId },
            include: {
                reviews: {
                    include: {
                        form: true,
                        reviewer: true
                    }
                },
                lead: true,
                contactPerson: true,
                pm: true,
                devArchitect: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate stats
        const allReviews = projects.flatMap(p => p.reviews);
        const stats = {
            totalProjects: projects.length,
            activeReviews: allReviews.filter(r => r.status === 'SCHEDULED').length,
            completedReviews: allReviews.filter(r => r.status === 'SUBMITTED').length,
            pendingReviews: allReviews.filter(r => r.status === 'PENDING').length
        };

        return NextResponse.json({
            projects,
            stats
        });
    } catch (error) {
        console.error("Error fetching PM dashboard data:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
