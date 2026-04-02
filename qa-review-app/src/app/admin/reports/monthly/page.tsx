import { prisma } from "@/lib/prisma";
import MonthlyReportView from "./MonthlyReportView";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default async function MonthlyReportPage() {
    // Fetch all reviews to aggregate on client
    // In a real app, we might want to filter by year here
    const reviews = await prisma.review.findMany({
        include: {
            project: true,
            reviewer: true,
            form: true
        },
        orderBy: {
            submittedDate: 'desc'
        }
    });

    // Serialize dates
    const serializedReviews = reviews.map(r => ({
        ...r,
        scheduledDate: r.scheduledDate?.toISOString() || null,
        submittedDate: r.submittedDate?.toISOString() || null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
    }));

    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Report...</div>}>
            <MonthlyReportView reviews={serializedReviews} />
        </Suspense>
    );
}
