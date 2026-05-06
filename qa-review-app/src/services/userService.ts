import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/schemas";
import { logActivity } from "@/lib/activityLogger";
import { sendEmail, emailTemplates } from "@/lib/email";
import { SessionUser } from "@/lib/auth";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";

import { z } from "zod";

type UserInput = z.infer<typeof userSchema>;

export class UserService {
    /**
     * Get all users
     */
    static async getAll() {
        return await prisma.user.findMany({
            orderBy: { name: 'asc' }
        });
    }

    /**
     * Get all users who can be contact persons
     */
    static async getContactPersons() {
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' }
        });

        // SQLite doesn't support complex JSON filters like 'contains' for arrays well, 
        // so we filter in application logic for stability.
        return users.filter(user => {
            const roles = (user.roles as any) || [];
            if (Array.isArray(roles)) return roles.includes('CONTACT_PERSON');
            if (typeof roles === 'string') return roles.includes('CONTACT_PERSON');
            return false;
        });
    }

    /**
     * Get a single user by ID
     */
    static async getById(id: string) {
        return await prisma.user.findUnique({
            where: { id }
        });
    }

    /**
     * Create a new user with automatic password reset invitation
     */
    static async create(data: UserInput, currentUser: SessionUser) {
        // Validation
        const validatedData = userSchema.parse(data);

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Default secure password that must be reset
        const tempPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

        const user = await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: tempPassword,
                roles: JSON.stringify(validatedData.roles), 
                passwordResetToken: resetToken,
                passwordResetExpiry: resetExpiry
            }
        });

        // Log Activity
        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            action: 'CREATE_USER',
            entity: 'User',
            entityId: user.id,
            details: { email: user.email, roles: user.roles }
        });

        // Send Welcome/Password Reset Email
        await sendEmail(
            user.email,
            emailTemplates.userCreated(user.name, user.email, validatedData.roles.join(", "), resetToken)
        );

        return user;
    }

    /**
     * Update user details and roles
     */
    static async update(id: string, data: Partial<UserInput>, currentUser: SessionUser) {
        // Partial validation (only validate what's provided)
        const validatedData = userSchema.partial().parse(data);

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...validatedData,
                roles: validatedData.roles ? JSON.stringify(validatedData.roles) : undefined,
            }
        });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            action: 'UPDATE_USER',
            entity: 'User',
            entityId: id,
            details: { updatedFields: Object.keys(validatedData) }
        });

        return user;
    }

    /**
     * Delete a user if they are not assigned to any projects
     */
    static async delete(id: string, currentUser: SessionUser) {
        // Check assignments
        const assignments = await prisma.project.findFirst({
            where: {
                OR: [
                    { leadId: id },
                    { reviewerId: id },
                    { secondaryReviewerId: id },
                    { contactPersonId: id },
                    { pmId: id },
                    { devArchitectId: id }
                ]
            }
        });

        if (assignments) {
            throw new Error("Cannot delete user: User is assigned to one or more projects.");
        }

        await prisma.user.delete({ where: { id } });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            action: 'DELETE_USER',
            entity: 'User',
            entityId: id
        });

        return true;
    }

    /**
     * Bulk update roles for multiple users
     */
    static async bulkUpdateRoles(userIds: string[], roles: string[], currentUser: SessionUser) {
        // Validate roles
        const validatedRoles = z.array(z.string()).parse(roles);
        
        await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { roles: JSON.stringify(validatedRoles) }
        });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            action: 'BULK_UPDATE_USERS',
            entity: 'User',
            details: { userCount: userIds.length, newRoles: validatedRoles }
        });

        return { count: userIds.length };
    }
}
