import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
    // H-02: Require QA_ARCHITECT or ADMIN session
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
    if (!roles.includes("QA_ARCHITECT") && !roles.includes("ADMIN") && !roles.includes("QA_HEAD")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Get all forms
        const forms = await prisma.form.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Get all reviews
        const reviews = await prisma.review.findMany();

        // Calculate quality metrics (placeholder logic - can be enhanced)
        const completedReviews = reviews.filter(r => r.status === 'SUBMITTED');
        const qualityScore = completedReviews.length > 0
            ? Math.round((completedReviews.length / reviews.length) * 100)
            : 0;

        // Standards compliance (placeholder - can be based on actual review data)
        const standardsCompliance = 85; // This would be calculated based on review answers

        // Critical issues (placeholder - would come from review answers)
        const criticalIssues = 0;

        const stats = {
            totalForms: forms.length,
            activeForms: forms.filter(f => f.isActive).length,
            totalReviews: reviews.length,
            qualityScore,
            standardsCompliance,
            criticalIssues
        };

        return NextResponse.json({
            stats,
            forms: forms.slice(0, 10)
        });
    } catch (error) {
        console.error("Error fetching QA Architect dashboard data:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
