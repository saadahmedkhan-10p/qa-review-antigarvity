import { prisma } from '@/lib/prisma';

interface LogActivityParams {
    userId?: string;
    userName?: string;
    // H-10: userEmail removed from interface — do NOT log email addresses
    action: string;
    entity?: string;
    entityId?: string;
    projectId?: string;
    projectName?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Architect-optimized logging utility
 */
export async function logActivity(params: LogActivityParams) {
    try {
        await prisma.activityLog.create({
            data: {
                userId: params.userId,
                userName: params.userName,
                // H-10: Never persist email — store userId for correlation instead
                userEmail: undefined,
                action: params.action.toString(),
                entity: params.entity?.toString(),
                entityId: params.entityId,
                projectId: params.projectId,
                projectName: params.projectName,
                details: params.details ? JSON.stringify(params.details) : undefined,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
    } catch (error) {
        // Silently log failure to avoid breaking main flow, but announce in console
        console.error('Audit Log Failure (no PII)');
    }
}

/**
 * Get activity logs with typed filters
 */
export async function getActivityLogs(options?: {
    userId?: string;
    action?: string;
    entity?: string;
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}) {
    const where: any = {};

    if (options?.userId) where.userId = options.userId;
    if (options?.action) where.action = options.action;
    if (options?.entity) where.entity = options.entity;
    if (options?.projectId) where.projectId = options.projectId;
    if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = options.startDate;
        if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100,
            skip: options?.offset || 0,
        }),
        prisma.activityLog.count({ where }),
    ]);

    return { logs, total };
}
