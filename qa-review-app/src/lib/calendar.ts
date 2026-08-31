/**
 * Utility functions for creating iCalendar (.ics) files and calendar deep links (Outlook, Teams).
 */

export interface CalendarEventDetails {
    reviewId: string;
    projectName: string;
    formTitle?: string;
    startDate: Date;
    endDate?: Date;
    organizerEmail?: string;
    organizerName?: string;
    reviewerName?: string;
    qaContactName?: string;
    leadName?: string;
    attendees?: { name: string; email: string }[];
    appUrl?: string;
}

/**
 * Format a Date to UTC string for iCalendar (YYYYMMDDTHHMMSSZ).
 */
function formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Generates an RFC 5545 compliant .ics (iCalendar) string.
 */
export function generateICS(event: CalendarEventDetails): string {
    const appUrl = (event.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://qa-review-app.10pearls.com").replace(/\/$/, "");
    const reviewUrl = `${appUrl}/reviews/${event.reviewId}/conduct`;

    const start = event.startDate;
    // Default duration: 1 hour if end date not explicitly provided
    const end = event.endDate || new Date(start.getTime() + 60 * 60 * 1000);

    const now = new Date();
    const dtStamp = formatICSDate(now);
    const dtStart = formatICSDate(start);
    const dtEnd = formatICSDate(end);

    const uid = `qa-review-${event.reviewId}-${start.getTime()}@10pearls.com`;
    const summary = `QA Review: ${event.projectName}`;

    const descriptionLines = [
        `QA Review for Project: ${event.projectName}`,
        event.formTitle ? `Review Form: ${event.formTitle}` : "",
        event.reviewerName ? `Primary Reviewer: ${event.reviewerName}` : "",
        event.qaContactName ? `QA Contact Person: ${event.qaContactName}` : "",
        event.leadName ? `Project Lead: ${event.leadName}` : "",
        "",
        `Conduct Review Link: ${reviewUrl}`,
        "",
        "This meeting was automatically scheduled via the 10Pearls QA Review System."
    ].filter(line => line !== undefined);

    const description = descriptionLines.join("\\n");

    const organizerEmail = event.organizerEmail || process.env.SMTP_USER || "qa-review@10pearls.com";
    const organizerName = event.organizerName || "QA Review System";

    const attendeeStrings = (event.attendees || [])
        .filter(a => a.email)
        .map(a => `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${a.name || a.email}:mailto:${a.email}`)
        .join("\r\n");

    const icsLines = [
        "BEGIN:VCALENDAR",
        "PRODID:-//10Pearls//QA Review System//EN",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:Microsoft Teams / Online Meeting`,
        `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
        attendeeStrings ? attendeeStrings : "",
        "STATUS:CONFIRMED",
        "SEQUENCE:0",
        "TRANSP:OPAQUE",
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Reminder: QA Review Meeting",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR"
    ].filter(line => line.length > 0);

    return icsLines.join("\r\n");
}

/**
 * Generates an Outlook Web (Office 365) Calendar compose link.
 */
export function getOutlookWebCalendarUrl(event: CalendarEventDetails): string {
    const appUrl = (event.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://qa-review-app.10pearls.com").replace(/\/$/, "");
    const reviewUrl = `${appUrl}/reviews/${event.reviewId}/conduct`;

    const start = event.startDate;
    const end = event.endDate || new Date(start.getTime() + 60 * 60 * 1000);

    const subject = `QA Review: ${event.projectName}`;
    const body = `QA Review for Project: ${event.projectName}\n` +
        (event.reviewerName ? `Primary Reviewer: ${event.reviewerName}\n` : "") +
        (event.qaContactName ? `QA Contact: ${event.qaContactName}\n` : "") +
        `\nConduct Review: ${reviewUrl}\n`;

    const to = (event.attendees || []).map(a => a.email).filter(Boolean).join(";");

    const params = new URLSearchParams({
        path: "/calendar/action/compose",
        rru: "addevent",
        subject,
        startdt: start.toISOString(),
        enddt: end.toISOString(),
        body,
        location: "Microsoft Teams Meeting",
        to
    });

    return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generates a Microsoft Teams meeting scheduling deep link.
 */
export function getTeamsMeetingUrl(event: CalendarEventDetails): string {
    const appUrl = (event.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://qa-review-app.10pearls.com").replace(/\/$/, "");
    const reviewUrl = `${appUrl}/reviews/${event.reviewId}/conduct`;

    const start = event.startDate;
    const end = event.endDate || new Date(start.getTime() + 60 * 60 * 1000);

    const subject = `QA Review: ${event.projectName}`;
    const content = `QA Review for Project: ${event.projectName}\nConduct Review Link: ${reviewUrl}`;
    const attendees = (event.attendees || []).map(a => a.email).filter(Boolean).join(",");

    const params = new URLSearchParams({
        subject,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        content,
        attendees
    });

    return `https://teams.microsoft.com/l/meeting/new?${params.toString()}`;
}
