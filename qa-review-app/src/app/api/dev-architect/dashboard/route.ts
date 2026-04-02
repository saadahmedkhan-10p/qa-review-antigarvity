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

        // Get only projects where user is assigned as Dev Architect
        const projects = await prisma.project.findMany({
            where: { devArchitectId: userId },
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

        // Get all reviews for assigned projects
        const reviews = projects.flatMap(p => p.reviews);
        const completedReviews = reviews.filter(r => r.status === 'SUBMITTED');

        const stats = {
            totalProjects: projects.length,
            totalReviews: reviews.length,
            technicalReviews: completedReviews.length,
            architectureIssues: 0, // Would be calculated from review data
            commentsProvided: 0 // Would be calculated from comments system
        };

        return NextResponse.json({
            projects,
            reviews,
            stats
        });
    } catch (error) {
        console.error("Error fetching Dev Architect dashboard data:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
