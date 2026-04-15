import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Get all projects
        const projects = await prisma.project.findMany();

        // Get all reviews
        const reviews = await prisma.review.findMany({
            include: {
                project: true,
                form: true,
                reviewer: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Get all reviewers (users with REVIEWER role)
        const users = await prisma.user.findMany();
        const reviewers = users.filter((u: any) => {
            try {
                const roles = typeof u.roles === 'string' ? JSON.parse(u.roles || "[]") : (u.roles || []);
                return Array.isArray(roles) && (roles.includes('REVIEWER') || roles.includes('REVIEW_LEAD'));
            } catch {
                return false;
            }
        });

        // Get all active forms
        const forms = await prisma.form.findMany({
            where: { isActive: true }
        });

        // Calculate stats
        const stats = {
            totalProjects: projects.length,
            totalReviews: reviews.length,
            pendingReviews: reviews.filter(r => r.status === 'PENDING').length,
            completedReviews: reviews.filter(r => r.status === 'SUBMITTED').length,
            totalReviewers: reviewers.length,
            activeForms: forms.length
        };

        return NextResponse.json({
            stats,
            recentReviews: reviews.slice(0, 10)
        });
    } catch (error) {
        console.error("Error fetching QA Manager dashboard data:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
