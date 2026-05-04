"use server";

import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export async function setPassword(token: string, password: string) {
    const trimmedToken = token?.trim();

    if (!trimmedToken) {
        return { error: "Token is required" };
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: trimmedToken
        }
    });

    if (!user) {
        return { error: "Invalid token" };
    }

    if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
        return { error: "Expired token" };
    }

    if (!password || password.length < 12) {
        return { error: "Password must be at least 12 characters" };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpiry: null
        }
    });

    return { success: true };
}
