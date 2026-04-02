import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ReportsView } from "./ReportsView";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    searchParams: Promise<{ type?: string; month?: string; year?: string }>;
}

async function getReviews(typeFilter?: string, userId?: string, userRoles?: string[]) {
    // Build the where clause
    const whereClause: any = {};

    // Apply type filter if present
    if (typeFilter) {
        whereClause.project = {
            type: typeFilter
        };
    }

    // If user is PM, filter to only show their assigned projects
    if (userId && userRoles?.includes('PM')) {
        whereClause.project = {
            ...whereClause.project,
            pmId: userId
        };
    }

    const reviews = await prisma.review.findMany({
        include: {
            project: true,
            reviewer: true,
            form: true
        },
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined
    });

    // Serialize dates to strings
    return reviews.map(review => ({
        ...review,
        submittedDate: review.submittedDate ? review.submittedDate.toISOString() : null,
        scheduledDate: review.scheduledDate ? review.scheduledDate.toISOString() : null,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
    }));
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const typeFilter = ['MANUAL', 'AUTOMATION_WEB', 'AUTOMATION_MOBILE', 'API', 'DESKTOP'].includes(params.type || '') ? params.type : undefined;

    // Get current user session
    const session = await getSession();
    const userId = session?.user?.id;
    const userRoles = session?.user?.roles ? JSON.parse(session.user.roles) : [];

    const reviews = await getReviews(typeFilter, userId, userRoles);

    // Dynamic page title based on type filter
    const pageTitle = typeFilter === 'MANUAL' ? 'Manual QA Reports' :
        typeFilter === 'AUTOMATION_WEB' ? 'Web Automation QA Reports' :
            typeFilter === 'AUTOMATION_MOBILE' ? 'Mobile Automation QA Reports' :
                typeFilter === 'API' ? 'API QA Reports' :
                    typeFilter === 'DESKTOP' ? 'Desktop QA Reports' :
                        'QA Reports';

    return (
        <ReportsView
            reviews={reviews}
            pageTitle={pageTitle}
            typeFilter={typeFilter}
            initialMonth={params.month ? parseInt(params.month) : undefined}
            initialYear={params.year ? parseInt(params.year) : undefined}
        />
    );
}
