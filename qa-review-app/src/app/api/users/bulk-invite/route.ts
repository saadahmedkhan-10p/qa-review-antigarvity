import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { users } = body;

        if (!users || !Array.isArray(users)) {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

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
                console.error(`Failed to invite ${user.email}:`, error);
                errors.push(`Failed to invite ${user.email}: ${error.message}`);
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
