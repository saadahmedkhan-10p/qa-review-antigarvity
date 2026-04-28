import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail, emailTemplates } from "@/lib/email";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { roleSchema } from "@/lib/schemas";

// C-02: Zod schema — whitelist roles and cap array length
const bulkInviteSchema = z.object({
    users: z
        .array(
            z.object({
                email: z.string().email(),
                name: z.string().min(1).max(200),
                roles: z.array(roleSchema).min(1).max(5),
            })
        )
        .min(1)
        .max(50),
});

export async function POST(request: Request) {
    // C-02: Require ADMIN or QA_HEAD session
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const callerRoles: string[] = Array.isArray(session.user.roles)
        ? session.user.roles
        : [];
    if (!callerRoles.includes("ADMIN") && !callerRoles.includes("QA_HEAD")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const raw = await request.json();
        const parsed = bulkInviteSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const { users } = parsed.data;

        let invitedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        for (const user of users) {
            try {
                // Check if user already exists
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email }
                });

                if (existingUser) {
                    skippedCount++;
                    continue;
                }

                // Generate password reset token
                const resetToken = crypto.randomBytes(32).toString('hex');
                const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                // Create new user
                const newUser = await prisma.user.create({
                    data: {
                        email: user.email,
                        name: user.name,
                        password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
                        roles: JSON.stringify(user.roles),
                        passwordResetToken: resetToken,
                        passwordResetExpiry: resetExpiry
                    }
                });

                // Send actual email with password setup link
                await sendEmail(
                    newUser.email,
                    emailTemplates.userCreated(newUser.name, newUser.email, user.roles.join(", "), resetToken)
                );

                invitedCount++;
            } catch (error: any) {
                // L-03: Don't expose internal error messages to the client
                console.error(`Failed to invite ${user.email}:`, error);
                errors.push(`Failed to invite ${user.email}: invite failed`);
            }
        }

        return NextResponse.json({
            success: true,
            invitedCount,
            skippedCount,
            errors
        });

    } catch (error) {
        console.error("Bulk invite API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
