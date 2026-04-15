import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Get all projects with reviews
        const projects = await prisma.project.findMany({
            include: {
                reviews: true
            }
        });

        // Get all reviews
        const allReviews = await prisma.review.findMany();

        // Get all users with reviewer roles
        const users = await prisma.user.findMany();
        const reviewers = users.filter((u: any) => {
            try {
                const roles = typeof u.roles === 'string' ? JSON.parse(u.roles || "[]") : (u.roles || []);
                return Array.isArray(roles) && (
                    roles.includes('REVIEWER') || 
                    roles.includes('REVIEW_LEAD') ||
                    roles.includes('QA_MANAGER') || 
                    roles.includes('QA_ARCHITECT')
                );
            } catch {
                return false;
            }
        });

        // Calculate completion rate
        const completedReviews = allReviews.filter(r => r.status === 'SUBMITTED').length;
        const completionRate = allReviews.length > 0
            ? Math.round((completedReviews / allReviews.length) * 100)
            : 0;

        // Get current month's completed reviews
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const completedThisMonth = allReviews.filter(r =>
            r.status === 'SUBMITTED' &&
            r.submittedDate &&
            new Date(r.submittedDate) >= firstDayOfMonth
        ).length;

        // Calculate stats
        const stats = {
            totalProjects: projects.length,
            totalReviews: allReviews.length,
            completionRate,
            activeReviewers: reviewers.length,
            pendingReviews: allReviews.filter(r => r.status === 'PENDING').length,
            completedThisMonth
        };

        // Create project summary
        const projectSummary = projects.map(project => ({
            id: project.id,
            name: project.name,
            totalReviews: project.reviews.length,
            completed: project.reviews.filter(r => r.status === 'SUBMITTED').length,
            pending: project.reviews.filter(r => r.status === 'PENDING').length,
            scheduled: project.reviews.filter(r => r.status === 'SCHEDULED').length
        }));

        return NextResponse.json({
            stats,
            projectSummary
        });
    } catch (error) {
        console.error("Error fetching Director dashboard data:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
