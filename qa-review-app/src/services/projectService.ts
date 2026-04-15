import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/schemas";
import { logActivity } from "@/lib/activityLogger";
import { sendEmail, emailTemplates } from "@/lib/email";
import { SessionUser } from "@/lib/auth";
import { User } from "@prisma/client";
import { z } from "zod";

type ProjectInput = z.infer<typeof projectSchema>;

interface ProjectWithRelations {
    id: string;
    name: string;
    description: string | null;
    type: string;
    lead?: User | null;
    reviewer?: User | null;
    secondaryReviewer?: User | null;
    contactPerson?: User | null;
    reviewerId?: string | null;
    leadId?: string | null;
    secondaryReviewerId?: string | null;
}

export class ProjectService {
    /**
     * Get all projects with assigned users
     */
    static async getAll() {
        return await prisma.project.findMany({
            include: {
                lead: true,
                reviewer: true,
                secondaryReviewer: true,
                contactPerson: true,
                pm: true,
                devArchitect: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get a single project by ID
     */
    static async getById(id: string) {
        return await prisma.project.findUnique({
            where: { id },
            include: {
                lead: true,
                reviewer: true,
                secondaryReviewer: true,
                contactPerson: true,
                pm: true,
                devArchitect: true,
            }
        });
    }

    /**
     * Create a new project
     */
    static async create(data: ProjectInput, currentUser: SessionUser) {
        // Validation
        const validatedData = projectSchema.parse(data);

        const project = await prisma.project.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                type: validatedData.type,
                leadId: validatedData.leadId,
                reviewerId: validatedData.reviewerId,
                secondaryReviewerId: validatedData.secondaryReviewerId,
                contactPersonId: validatedData.contactPersonId,
                pmId: validatedData.pmId,
                devArchitectId: validatedData.devArchitectId,
                status: "ACTIVE",
            },
            include: {
                lead: true,
                reviewer: true,
                secondaryReviewer: true,
                contactPerson: true
            }
        });

        // Log Activity
        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            action: 'CREATE_PROJECT',
            entity: 'Project',
            entityId: project.id,
            projectId: project.id,
            projectName: project.name,
            details: { type: project.type }
        });

        // Notifications
        await this.handleProjectAssignmentsEmails(project, null);

        return project;
    }

    /**
     * Update an existing project
     */
    static async update(id: string, data: Partial<ProjectInput>, currentUser: SessionUser) {
        // Validation with improved logging
        console.log(`[ProjectService] Updating Project ${id}`, data);
        
        let validatedData;
        try {
            validatedData = projectSchema.partial().parse(data);
        } catch (error: any) {
            console.error("[ProjectService] Validation Error:", error.errors);
            throw new Error(`Validation failed: ${error.errors?.[0]?.message || error.message}`);
        }

        const oldProject = await this.getById(id);
        if (!oldProject) throw new Error("Project not found");

        try {
            const project = await prisma.project.update({
                where: { id },
                data: {
                    name: validatedData.name,
                    description: validatedData.description,
                    type: validatedData.type,
                    leadId: validatedData.leadId,
                    reviewerId: validatedData.reviewerId,
                    secondaryReviewerId: validatedData.secondaryReviewerId,
                    contactPersonId: validatedData.contactPersonId,
                    pmId: validatedData.pmId,
                    devArchitectId: validatedData.devArchitectId,
                },
                include: {
                    lead: true,
                    reviewer: true,
                    secondaryReviewer: true,
                    contactPerson: true,
                    pm: true,
                    devArchitect: true
                }
            });

            // Log Activity
            await logActivity({
                userId: currentUser.id,
                userName: currentUser.name,
                userEmail: currentUser.email,
                action: 'UPDATE_PROJECT',
                entity: 'Project',
                entityId: id,
                projectId: id,
                projectName: project.name,
                details: { 
                    updatedFields: Object.keys(validatedData),
                    timestamp: new Date().toISOString()
                }
            });

            // Handle notifications defensively
            try {
                const leadsChanged = oldProject.leadId !== project.leadId;
                const reviewersChanged = oldProject.reviewerId !== project.reviewerId;
                const secondaryReviewersChanged = oldProject.secondaryReviewerId !== project.secondaryReviewerId;

                if (leadsChanged || reviewersChanged || secondaryReviewersChanged) {
                    await this.handleProjectAssignmentsEmails(project as any, oldProject as any);
                }
            } catch (notifyError) {
                console.error("[ProjectService] Notification Error (Non-blocking):", notifyError);
            }

            return project;
        } catch (error: any) {
            console.error("[ProjectService] Database Update Error:", error);
            if (error.code === 'P2002') {
                throw new Error("A project with this name already exists.");
            }
            throw new Error(`Failed to update project: ${error.message}`);
        }
    }

    /**
     * Close a project
     */
    static async close(id: string, currentUser: SessionUser) {
        const project = await prisma.project.update({
            where: { id },
            data: {
                status: "CLOSED",
                closedAt: new Date()
            }
        });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            action: 'CLOSE_PROJECT',
            entity: 'Project',
            entityId: id,
            projectId: id,
            projectName: project.name
        });

        return project;
    }

    /**
     * Reopen a project
     */
    static async reopen(id: string, currentUser: SessionUser) {
        const project = await prisma.project.update({
            where: { id },
            data: {
                status: "ACTIVE",
                closedAt: null
            }
        });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            action: 'REOPEN_PROJECT',
            entity: 'Project',
            entityId: id,
            projectId: id,
            projectName: project.name
        });

        return project;
    }

    /**
     * Delete a project
     */
    static async delete(id: string, currentUser: SessionUser) {
        const project = await this.getById(id);
        if (!project) throw new Error("Project not found");

        // Delete associated reviews first (Prisma cascades could handle this, but explicit is better for logic)
        await prisma.review.deleteMany({ where: { projectId: id } });
        await prisma.project.delete({ where: { id } });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            action: 'DELETE_PROJECT',
            entity: 'Project',
            entityId: id,
            projectId: id,
            projectName: project.name
        });

        return true;
    }

    /**
     * Internal helper to handle assignment notifications
     */
    private static async handleProjectAssignmentsEmails(project: ProjectWithRelations, oldProject: ProjectWithRelations | null) {
        // Notify Primary Reviewer if new or changed
        if (project.reviewer && (!oldProject || oldProject.reviewerId !== project.reviewerId)) {
            await sendEmail(
                project.reviewer.email,
                emailTemplates.projectAssigned(
                    project.reviewer.name,
                    project.name,
                    project.lead?.name || 'Not Assigned',
                    project.contactPerson?.name || 'Not Assigned',
                    project.secondaryReviewer?.name
                )
            );
        }

        // Notify Secondary Reviewer if new or changed
        if (project.secondaryReviewer && (!oldProject || oldProject.secondaryReviewerId !== project.secondaryReviewerId)) {
            await sendEmail(
                project.secondaryReviewer.email,
                emailTemplates.projectAssigned(
                    project.secondaryReviewer.name,
                    project.name,
                    project.lead?.name || 'Not Assigned',
                    project.contactPerson?.name || 'Not Assigned',
                    project.reviewer?.name
                )
            );
        }

        // Notify Lead if new or changed
        if (project.lead && (!oldProject || oldProject.leadId !== project.leadId)) {
            await sendEmail(
                project.lead.email,
                emailTemplates.leadNotification(
                    project.lead.name,
                    project.name,
                    project.reviewer?.name || 'Not Assigned',
                    `You have been assigned as the Review Lead for this project.`
                )
            );
        }
    }
}
