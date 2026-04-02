import { PrismaClient } from "@prisma/client";
import { ReviewsTable } from "@/components/ReviewsTable";
import { Metadata } from "next";

const prisma = new PrismaClient();

export const metadata: Metadata = {
    title: "Reviews Management | QA Review App",
    description: "Manage and view all QA reviews",
};

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ type?: string }>;
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const typeFilter = ['MANUAL', 'AUTOMATION_WEB', 'AUTOMATION_MOBILE', 'API', 'DESKTOP'].includes(params.type || '') ? params.type : undefined;

    const reviews = await prisma.review.findMany({
        include: {
            project: {
                select: {
                    name: true,
                    type: true
                }
            },
            reviewer: {
                select: {
                    name: true
                }
            }
        },
        where: typeFilter ? {
            project: {
                type: typeFilter
            }
        } : undefined,
        orderBy: {
            updatedAt: 'desc'
        }
    });

    // Serialize dates to strings
    const serializedReviews = reviews.map(review => ({
        ...review,
        submittedDate: review.submittedDate ? review.submittedDate.toISOString() : null,
        scheduledDate: review.scheduledDate ? review.scheduledDate.toISOString() : null,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
    }));

    // Dynamic page title based on type filter
    const pageTitle = typeFilter === 'MANUAL' ? 'Manual Reviews' :
        typeFilter === 'AUTOMATION_WEB' ? 'Web Automation Reviews' :
            typeFilter === 'AUTOMATION_MOBILE' ? 'Mobile Automation Reviews' :
                typeFilter === 'API' ? 'API AUTO Reviews' :
                    typeFilter === 'DESKTOP' ? 'Desktop Reviews' :
                        'Reviews Management';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        View and manage all QA reviews across projects.
                    </p>
                </div>

                <ReviewsTable
                    reviews={serializedReviews}
                    initialType={(typeFilter as any) || 'ALL'}
                />
            </div>
        </div>
    );
}
