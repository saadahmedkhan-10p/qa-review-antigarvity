import { NextResponse } from 'next/server';
import { ReminderService } from '@/services/reminderService';
import { pruneActivityLogs } from '@/lib/activityLogger';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secretParam = searchParams.get('secret') || searchParams.get('key');
        const typeParam = searchParams.get('type') as 'SCHEDULING' | 'SUBMISSION' | 'AUTO' | null;

        // Verify CRON_SECRET if configured in environment
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret) {
            const authHeader = request.headers.get('authorization');
            const isBearerValid = authHeader === `Bearer ${cronSecret}`;
            const isSecretParamValid = secretParam === cronSecret;

            if (!isBearerValid && !isSecretParamValid) {
                return NextResponse.json({ error: 'Unauthorized: Invalid or missing CRON_SECRET' }, { status: 401 });
            }
        }

        // Run reminders via ReminderService
        const result = await ReminderService.processReminders(typeParam || 'AUTO');

        // Automatically purge activity logs older than 40 days as part of daily cron maintenance
        let logsPruned = 0;
        try {
            const pruneResult = await pruneActivityLogs(40);
            logsPruned = pruneResult.deletedCount;
        } catch (e) {
            console.error('[cron/reminders] Error pruning activity logs:', e);
        }

        return NextResponse.json({
            success: true,
            reminderType: result.type,
            today: result.today,
            emailsSent: result.emailsSent,
            notificationsCreated: result.notificationsCreated,
            activityLogsPruned: logsPruned,
            details: result.details
        });

    } catch (error: any) {
        console.error('[cron/reminders] Error processing reminders:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

