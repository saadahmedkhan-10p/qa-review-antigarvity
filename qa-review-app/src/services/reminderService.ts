import { prisma } from "@/lib/prisma";
import { emailTemplates, sendEmail } from "@/lib/email";
import { NotificationService } from "./notificationService";
import { startOfMonth, endOfMonth, isSameDay, addDays, getDay, setDate, getDate } from "date-fns";

export interface ReminderResult {
    success: boolean;
    type: "SCHEDULING" | "SUBMISSION" | "NONE";
    today: string;
    emailsSent: number;
    notificationsCreated: number;
    details: Array<{
        projectId: string;
        projectName: string;
        reviewer: string;
        reminderType: string;
        emailSent: boolean;
        error?: string;
    }>;
}

// Helper to calculate effective reminder date (skipping weekends to following Monday)
export function getEffectiveReminderDate(baseDate: Date, targetDay: number): Date {
    const date = setDate(baseDate, targetDay);
    const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday

    if (dayOfWeek === 6) { // Saturday -> Monday (+2)
        return addDays(date, 2);
    } else if (dayOfWeek === 0) { // Sunday -> Monday (+1)
        return addDays(date, 1);
    }
    return date;
}

export class ReminderService {
    /**
     * Run monthly reminders.
     * @param forceType Optional override: 'SCHEDULING', 'SUBMISSION', or 'AUTO'
     * @param checkDate Date to evaluate against (defaults to today)
     */
    static async processReminders(
        forceType?: "SCHEDULING" | "SUBMISSION" | "AUTO",
        checkDate: Date = new Date()
    ): Promise<ReminderResult> {
        const today = checkDate;
        const currentDayOfMonth = getDate(today);

        const effectiveDay10 = getEffectiveReminderDate(today, 10);
        const effectiveDay20 = getEffectiveReminderDate(today, 20);

        let runType: "SCHEDULING" | "SUBMISSION" | "NONE" = "NONE";

        if (forceType === "SCHEDULING") {
            runType = "SCHEDULING";
        } else if (forceType === "SUBMISSION") {
            runType = "SUBMISSION";
        } else {
            // AUTO detection:
            if (isSameDay(today, effectiveDay10)) {
                runType = "SCHEDULING";
            } else if (isSameDay(today, effectiveDay20)) {
                runType = "SUBMISSION";
            } else if (currentDayOfMonth >= 10 && currentDayOfMonth < 20) {
                runType = "SCHEDULING";
            } else if (currentDayOfMonth >= 20) {
                runType = "SUBMISSION";
            }
        }

        if (runType === "NONE") {
            return {
                success: true,
                type: "NONE",
                today: today.toISOString(),
                emailsSent: 0,
                notificationsCreated: 0,
                details: []
            };
        }

        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        // Fetch active projects that have an assigned primary reviewer
        const activeProjects = await prisma.project.findMany({
            where: {
                status: "ACTIVE",
                reviewerId: { not: null }
            },
            include: {
                reviewer: true,
                secondaryReviewer: true,
            }
        });

        let emailsSent = 0;
        let notificationsCreated = 0;
        const details: ReminderResult["details"] = [];

        for (const project of activeProjects) {
            if (!project.reviewer || !project.reviewer.email) continue;

            // Find current month's review for this project
            const currentReview = await prisma.review.findFirst({
                where: {
                    projectId: project.id,
                    createdAt: {
                        gte: monthStart,
                        lte: monthEnd
                    }
                }
            });

            // ── 1. SCHEDULING REMINDER (10th of the month) ───────────────────
            if (runType === "SCHEDULING") {
                // Trigger if review does not exist, or review is PENDING and has no scheduledDate
                const needsScheduling = !currentReview || (currentReview.status === "PENDING" && !currentReview.scheduledDate);

                if (needsScheduling) {
                    console.log(`[ReminderService] Sending Scheduling Reminder for ${project.name} to ${project.reviewer.email}`);

                    // Send email to primary reviewer
                    const template = emailTemplates.reminderScheduling(
                        project.reviewer.name,
                        project.name,
                        project.secondaryReviewer?.name
                    );
                    const emailRes = await sendEmail(project.reviewer.email, template);

                    if (emailRes.success) emailsSent++;

                    // Send to secondary reviewer if assigned
                    if (project.secondaryReviewer?.email) {
                        const secTemplate = emailTemplates.reminderScheduling(
                            project.secondaryReviewer.name,
                            project.name,
                            project.reviewer.name,
                            true
                        );
                        await sendEmail(project.secondaryReviewer.email, secTemplate);
                    }

                    // Create in-app notifications
                    await NotificationService.create(
                        project.reviewer.id,
                        "SYSTEM",
                        `Reminder: Please schedule the QA Review for ${project.name} (Deadline: 10th of this month).`,
                        `/reviewer/dashboard`
                    );
                    notificationsCreated++;

                    if (project.secondaryReviewer?.id) {
                        await NotificationService.create(
                            project.secondaryReviewer.id,
                            "SYSTEM",
                            `Notice: QA Review scheduling for ${project.name} is pending with primary reviewer.`,
                            `/reviewer/dashboard`
                        );
                        notificationsCreated++;
                    }

                    details.push({
                        projectId: project.id,
                        projectName: project.name,
                        reviewer: project.reviewer.name,
                        reminderType: "SCHEDULING (10th Deadline)",
                        emailSent: emailRes.success,
                        error: emailRes.error ? String(emailRes.error) : undefined
                    });
                }
            }

            // ── 2. SUBMISSION / CONDUCT REMINDER (20th of the month) ────────
            if (runType === "SUBMISSION") {
                // Trigger if review is missing, or review status is PENDING / SCHEDULED (not yet submitted)
                const isIncomplete = !currentReview || ["PENDING", "SCHEDULED"].includes(currentReview.status);

                if (isIncomplete) {
                    console.log(`[ReminderService] Sending Conduct/Submission Reminder for ${project.name} to ${project.reviewer.email}`);

                    // Send email to primary reviewer
                    const template = emailTemplates.reminderSubmission(
                        project.reviewer.name,
                        project.name,
                        project.secondaryReviewer?.name
                    );
                    const emailRes = await sendEmail(project.reviewer.email, template);

                    if (emailRes.success) emailsSent++;

                    // Send to secondary reviewer if assigned
                    if (project.secondaryReviewer?.email) {
                        const secTemplate = emailTemplates.reminderSubmission(
                            project.secondaryReviewer.name,
                            project.name,
                            project.reviewer.name
                        );
                        await sendEmail(project.secondaryReviewer.email, secTemplate);
                    }

                    // In-app notifications
                    await NotificationService.create(
                        project.reviewer.id,
                        "SYSTEM",
                        `Urgent Reminder: Please conduct and submit the QA Review for ${project.name} (Deadline: 20th of this month).`,
                        currentReview ? `/reviews/${currentReview.id}/conduct` : `/reviewer/dashboard`
                    );
                    notificationsCreated++;

                    if (project.secondaryReviewer?.id) {
                        await NotificationService.create(
                            project.secondaryReviewer.id,
                            "SYSTEM",
                            `Urgent Reminder: QA Review for ${project.name} is due for submission.`,
                            currentReview ? `/reviews/${currentReview.id}/conduct` : `/reviewer/dashboard`
                        );
                        notificationsCreated++;
                    }

                    details.push({
                        projectId: project.id,
                        projectName: project.name,
                        reviewer: project.reviewer.name,
                        reminderType: "CONDUCT / SUBMISSION (20th Deadline)",
                        emailSent: emailRes.success,
                        error: emailRes.error ? String(emailRes.error) : undefined
                    });
                }
            }
        }

        return {
            success: true,
            type: runType,
            today: today.toISOString(),
            emailsSent,
            notificationsCreated,
            details
        };
    }
}
