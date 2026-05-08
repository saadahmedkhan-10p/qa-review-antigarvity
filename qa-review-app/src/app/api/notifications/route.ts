import { NextResponse } from "next/server";
import { NotificationService } from "@/services/notificationService";
import { withErrorHandler } from "@/lib/apiErrorHandler";

export const GET = withErrorHandler(async (req, { user }) => {
    const { searchParams } = new URL(req.url);
    // ?all=true → full history page; omitted → unread only (bell badge)
    const notifications = searchParams.get("all") === "true"
        ? await NotificationService.getAll(user.id)
        : await NotificationService.getUnread(user.id);
    return NextResponse.json(notifications);
});

export const PATCH = withErrorHandler(async (req, { user }) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true") {
        await NotificationService.markAllAsRead(user.id);
    } else if (id) {
        await NotificationService.markAsRead(id);
    }

    return NextResponse.json({ success: true });
});
