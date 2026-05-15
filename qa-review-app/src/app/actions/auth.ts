"use server";

import * as bcrypt from "bcryptjs";
import { login, getSession, parseRoles } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { sendEmail, emailTemplates } from "@/lib/email";
import crypto from "crypto";

export async function loginAction(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return { error: "Invalid email or password" };
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        return { error: "Invalid email or password" };
    }

    // Create session
    await login({
        id: user.id,
        name: user.name,
        email: user.email,
        // user.roles is a Prisma JsonValue (string|array at runtime); parseRoles in auth.ts handles both
        roles: user.roles as unknown as string,
    });

    // Log the login activity
    await logActivity({
        userId: user.id,
        userName: user.name,
        action: 'LOGIN',
    });

    // Return success and roles for client-side handling
    const roles = parseRoles(user.roles);
    return { success: true, roles };
}

export async function requestPasswordReset(prevState: any, formData: FormData) {
    try {
        const email = formData.get("email") as string;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Return generic success to prevent email enumeration
            return { success: true, message: "If an account exists with that email, a reset link has been sent." };
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        // Save to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: token,
                passwordResetExpiry: expiry,
            },
        });

        // Send email
        await sendEmail(user.email, emailTemplates.passwordReset(user.name, token));

        // Log activity
        await logActivity({
            userId: user.id,
            userName: user.name,
            action: 'PASSWORD_RESET_REQUESTED',
        });

        return { success: true, message: "If an account exists with that email, a reset link has been sent." };
    } catch (error) {
        console.error('Password reset request error:', error);
        return { success: false, error: "An unexpected error occurred. Please try again later." };
    }
}

export async function getUserSession() {
    const session = await getSession();
    return session;
}
