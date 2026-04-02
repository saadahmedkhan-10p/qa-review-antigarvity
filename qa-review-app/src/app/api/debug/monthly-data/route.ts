import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
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

        // Serialize dates like the page does
        const serializedReviews = reviews.map(r => ({
            ...r,
            scheduledDate: r.scheduledDate?.toISOString() || null,
            submittedDate: r.submittedDate?.toISOString() || null,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
            project: {
                ...r.project,
                createdAt: r.project.createdAt.toISOString(),
                updatedAt: r.project.updatedAt.toISOString(),
                closedAt: r.project.closedAt?.toISOString() || null,
            },
            reviewer: {
                ...r.reviewer,
                createdAt: r.reviewer.createdAt.toISOString(),
                updatedAt: r.reviewer.updatedAt.toISOString(),
                passwordResetExpiry: r.reviewer.passwordResetExpiry?.toISOString() || null,
            },
            form: {
                ...r.form,
                createdAt: r.form.createdAt.toISOString(),
                updatedAt: r.form.updatedAt.toISOString(),
            }
        }));

        return NextResponse.json({
            count: reviews.length,
            reviews: serializedReviews
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
