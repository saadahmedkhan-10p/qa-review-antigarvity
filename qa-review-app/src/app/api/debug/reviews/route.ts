import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const count = await prisma.review.count();
        const reviews = await prisma.review.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                project: true,
                reviewer: true,
            }
        });

        return NextResponse.json({
            count,
            reviews: reviews.map(r => ({
                id: r.id,
                projectName: r.project.name,
                reviewerName: r.reviewer.name,
                status: r.status,
                createdAt: r.createdAt.toISOString(),
            }))
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
