import { NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/activityLogger';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        const user = session?.user;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can view activity logs
        const userRoles = JSON.parse(user.roles || '[]');
        if (!userRoles.includes('ADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || undefined;
        const action = searchParams.get('action') || undefined;
        const entity = searchParams.get('entity') || undefined;
        const projectId = searchParams.get('projectId') || undefined;
        const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
        const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

        const result = await getActivityLogs({
            userId,
            action: action as any,
            entity: entity as any,
            projectId,
            startDate,
            endDate,
            limit,
            offset,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
