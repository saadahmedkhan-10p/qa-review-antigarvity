import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailTemplates, sendEmail } from '@/lib/email';
import { startOfMonth, endOfMonth, isSameDay, addDays, getDay, setDate } from 'date-fns';

// Helper to get effective reminder date (skipping weekends)
function getEffectiveReminderDate(baseDate: Date, targetDay: number): Date {
    const date = setDate(baseDate, targetDay);
    const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday

    if (dayOfWeek === 6) { // Saturday -> Monday (+2)
        return addDays(date, 2);
    } else if (dayOfWeek === 0) { // Sunday -> Monday (+1)
        return addDays(date, 1);
    }
    return date;
}

export async function GET(request: Request) {
    try {
        // Optional: Verify CRON_SECRET if you set one up in Vercel/environment
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();

        // Calculate effective dates for this month
        const effectiveDay8 = getEffectiveReminderDate(today, 8);
        const effectiveDay18 = getEffectiveReminderDate(today, 18);

        const isSchedulingReminderDay = isSameDay(today, effectiveDay8);
        const isSubmissionReminderDay = isSameDay(today, effectiveDay18);

        if (!isSchedulingReminderDay && !isSubmissionReminderDay) {
            return NextResponse.json({
                message: 'No reminders scheduled for today',
                today: today.toISOString(),
                effectiveDay8: effectiveDay8.toISOString(),
                effectiveDay18: effectiveDay18.toISOString()
            });
        }

        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        // Fetch active projects that have a reviewer
        const activeProjects = await prisma.project.findMany({
            where: {
                status: 'ACTIVE',
                reviewerId: { not: null }
            },
            include: {
                reviewer: true
            }
        });

        let emailsSent = 0;
        const errors: any[] = [];

        // Process each project
        for (const project of activeProjects) {
            if (!project.reviewer || !project.reviewer.email) continue;

            // Check current month's review
            const currentReview = await prisma.review.findFirst({
                where: {
                    projectId: project.id,
                    createdAt: {
                        gte: monthStart,
                        lte: monthEnd
                    }
                }
            });

            // Remind to schedule (8th)
            if (isSchedulingReminderDay) {
                // Condition: No review exists OR review exists but is PENDING and not scheduled
                const needsScheduling = !currentReview || (currentReview.status === 'PENDING' && !currentReview.scheduledDate);

                if (needsScheduling) {
                    console.log(`Sending Scheduling Reminder to ${project.reviewer.email} for ${project.name}`);
                    const template = emailTemplates.reminderScheduling(project.reviewer.name, project.name);
                    const result = await sendEmail(project.reviewer.email, template);
                    if (result.success) emailsSent++;
                    else errors.push({ user: project.reviewer.email, error: result.error });
                }
            }

            // Remind to submit (18th)
            if (isSubmissionReminderDay) {
                // Condition: Review exists and is SCHEDULED (or PENDING) but not SUBMITTED/DEFERRED/ENDED
                // If no review exists at all by 18th, we probably should remind them to start (treat as submission/urgent?)
                // Let's assume if it exists and is status PENDING or SCHEDULED.

                // If review is missing or pending/scheduled, send reminder
                const isIncomplete = !currentReview || ['PENDING', 'SCHEDULED'].includes(currentReview.status);

                if (isIncomplete) {
                    console.log(`Sending Submission Reminder to ${project.reviewer.email} for ${project.name}`);
                    const template = emailTemplates.reminderSubmission(project.reviewer.name, project.name);
                    const result = await sendEmail(project.reviewer.email, template);
                    if (result.success) emailsSent++;
                    else errors.push({ user: project.reviewer.email, error: result.error });
                }
            }
        }

        return NextResponse.json({
            success: true,
            remindersType: isSchedulingReminderDay ? 'SCHEDULING' : 'SUBMISSION',
            emailsSent,
            errors
        });

    } catch (error) {
        console.error('Cron error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
