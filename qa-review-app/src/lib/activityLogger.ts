import { prisma } from '@/lib/prisma';

export type ActivityAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE_PROJECT'
    | 'UPDATE_PROJECT'
    | 'DELETE_PROJECT'
    | 'CLOSE_PROJECT'
    | 'REOPEN_PROJECT'
    | 'CREATE_REVIEW'
    | 'UPDATE_REVIEW'
    | 'SUBMIT_REVIEW'
    | 'DELETE_REVIEW'
    | 'CREATE_USER'
    | 'UPDATE_USER'
    | 'DELETE_USER'
    | 'CREATE_COMMENT'
    | 'DELETE_COMMENT'
    | 'CREATE_FORM'
    | 'UPDATE_FORM'
    | 'DELETE_FORM'
    | 'CREATE_CONTACT'
    | 'UPDATE_CONTACT'
    | 'DELETE_CONTACT'
    | 'BULK_IMPORT_CONTACTS'
    | 'VIEW_REPORT'
    | 'EXPORT_REPORT'
    | 'PASSWORD_RESET_REQUESTED';

export type ActivityEntity = 'Project' | 'Review' | 'User' | 'Comment' | 'Form' | 'ContactPerson' | 'Report';

interface LogActivityParams {
    userId?: string;
    userName?: string;
    userEmail?: string;
    action: ActivityAction;
    entity?: ActivityEntity;
    entityId?: string;
    projectId?: string;
    projectName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an activity to the database
 */
export async function logActivity(params: LogActivityParams) {
    try {
        // Safety check: ensure Prisma client has been regenerated with ActivityLog model
        if (!(prisma as any).activityLog) {
            console.warn('ActivityLog model not found in Prisma client. Please restart the server to regenerate the client.');
            return;
        }

        await (prisma as any).activityLog.create({
            data: {
                userId: params.userId,
                userName: params.userName,
                userEmail: params.userEmail,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                projectId: params.projectId,
                projectName: params.projectName,
                details: params.details ? JSON.stringify(params.details) : null,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
    } catch (error) {
        // Don't throw errors for logging failures - just log to console
        console.error('Failed to log activity:', error);
    }
}

/**
 * Get activity logs with optional filters
 */
export async function getActivityLogs(options?: {
    userId?: string;
    action?: ActivityAction;
    entity?: ActivityEntity;
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

    // Safety check
    if (!(prisma as any).activityLog) {
        return { logs: [], total: 0 };
    }

    const [logs, total] = await Promise.all([
        (prisma as any).activityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100,
            skip: options?.offset || 0,
        }),
        (prisma as any).activityLog.count({ where }),
    ]);

    return { logs, total };
}
