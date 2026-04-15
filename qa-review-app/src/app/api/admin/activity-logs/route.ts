import { NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/activityLogger';
import { withErrorHandler } from '@/lib/apiErrorHandler';
import { paginationSchema } from '@/lib/schemas';

/**
 * Standardized Activity Logs API
 */
export const GET = withErrorHandler(async (request: Request) => {
    const { searchParams } = new URL(request.url);
    
    // Architect preference: Use Zod for query parameter parsing
    const { limit, offset } = paginationSchema.parse({
        limit: searchParams.get('limit'),
        offset: searchParams.get('offset'),
    });

    const filters = {
        userId: searchParams.get('userId') || undefined,
        action: searchParams.get('action') || undefined,
        entity: searchParams.get('entity') || undefined,
        projectId: searchParams.get('projectId') || undefined,
        startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
        endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    const result = await getActivityLogs({
        ...filters,
        limit,
        offset,
    });

    return NextResponse.json(result);
}, { requiredRole: 'ADMIN' });
