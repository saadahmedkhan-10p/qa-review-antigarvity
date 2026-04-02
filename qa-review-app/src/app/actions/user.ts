"use server";

import { getSession, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
    const session = await getSession();
    if (!session?.user) return null;

    // Parse roles from JSON string (handle old sessions)
    let roles = ["REVIEWER"]; // Default fallback

    if (typeof session.user.roles === 'string' && session.user.roles.trim().startsWith('[')) {
        try {
            roles = JSON.parse(session.user.roles);
        } catch (e) {
            console.error("Failed to parse roles:", e);
        }
    } else if (Array.isArray(session.user.roles)) {
        roles = session.user.roles; // If it's already an array
    } else if ((session.user as any).role) {
        // Handle old session format with single 'role' field
        roles = [(session.user as any).role];
    }

    return {
        ...session.user,
        roles
    };
}

export async function logoutAction() {
    await logout();
    redirect("/");
}
