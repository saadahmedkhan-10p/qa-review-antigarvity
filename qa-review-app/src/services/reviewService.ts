import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/schemas";
import { logActivity } from "@/lib/activityLogger";
import { sendEmail, emailTemplates } from "@/lib/email";
import { SessionUser } from "@/lib/auth";
import { User, Form } from "@prisma/client";
import { z } from "zod";

type ReviewInput = z.infer<typeof reviewSchema>;

interface ProjectWithCollaborators {
    id: string;
    name: string;
    reviewer?: User | null;
    secondaryReviewer?: User | null;
    lead?: User | null;
}

export class ReviewService {
    /**
     * Get all active forms
     */
    static async getAllForms() {
        return await prisma.form.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get a form by ID
     */
    static async getFormById(id: string) {
        return await prisma.form.findUnique({
            where: { id }
        });
    }

    /**
     * Create a new form
     */
    static async createForm(data: { title: string, questions: any, projectType: string | null }, currentUser: SessionUser) {
        const form = await prisma.form.create({
            data: {
                title: data.title,
                questions: JSON.stringify(data.questions),
                projectType: data.projectType,
                isActive: true
            }
        });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            action: 'CREATE_FORM',
            entity: 'Form',
            entityId: form.id,
            details: { title: data.title, projectType: data.projectType }
        });

        return form;
    }

    /**
     * Update an existing form
     */
    static async updateForm(id: string, data: { title: string, questions: any, projectType: string | null }, currentUser: SessionUser) {
        const form = await prisma.form.update({
            where: { id },
            data: {
                title: data.title,
                questions: JSON.stringify(data.questions),
                projectType: data.projectType
            }
        });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            action: 'UPDATE_FORM',
            entity: 'Form',
            entityId: id,
            details: { title: data.title, projectType: data.projectType }
        });

        return form;
    }

    /**
     * Delete a form
     */
    static async deleteForm(id: string, currentUser: SessionUser) {
        // Check if form has associated reviews
        const reviewsCount = await prisma.review.count({
            where: { formId: id }
        });

        if (reviewsCount > 0) {
            throw new Error("Cannot delete form because it has associated reviews. Forms in use must remain for historical record.");
        }

        const form = await prisma.form.delete({
            where: { id }
        });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            action: 'DELETE_FORM',
            entity: 'Form',
            entityId: id,
            details: { title: form.title }
        });

        return { success: true };
    }

    /**
     * Get a single review by ID with full relations
     */
    static async getById(id: string) {
        return await prisma.review.findUnique({
            where: { id },
            include: {
                project: {
                    include: { 
                        lead: true, 
                        reviewer: true, 
                        secondaryReviewer: true,
                        contactPerson: true 
                    }
                },
                reviewer: true,
                secondaryReviewer: true,
                form: true
            }
        });
    }

    /**
     * Initiate a new review cycle for all active projects
     */
    static async initiateCycle(formId: string, targetNewOnly: boolean = false, currentUser: SessionUser) {
        const form = await prisma.form.findUnique({ where: { id: formId } });
        if (!form) throw new Error("Form not found");

        const projects = await prisma.project.findMany({
            where: { status: "ACTIVE" },
            include: {
                reviewer: true,
                secondaryReviewer: true,
                lead: true,
                reviews: {
                    select: { id: true }
                }
            }
        });

        const initiatedReviews = [];

        for (const project of projects) {
            // Logic filters (Project Type match, Target New Only)
            if (form.projectType && form.projectType !== project.type) continue;
            if (targetNewOnly && project.reviews.length > 0) continue;
            if (!project.reviewerId || !project.reviewer) continue;

            const existing = await prisma.review.findFirst({
                where: {
                    projectId: project.id,
                    formId: formId,
                    status: { not: "SUBMITTED" }
                }
            });

            if (!existing) {
                const review = await prisma.review.create({
                    data: {
                        projectId: project.id,
                        reviewerId: project.reviewerId,
                        secondaryReviewerId: project.secondaryReviewerId,
                        formId: formId,
                        status: "PENDING"
                    }
                });

                // Send Invitations
                await this.sendReviewCycleEmails(project, form);
                initiatedReviews.push(review);
            }
        }

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            action: 'CREATE_REVIEW', // Cycle creation
            entity: 'Review',
            details: { formId, formTitle: form.title, projectsCount: initiatedReviews.length }
        });

        return initiatedReviews;
    }

    /**
     * Update an existing review (Admin/Lead mode)
     */
    static async adminUpdate(id: string, data: Partial<ReviewInput>, currentUser: SessionUser) {
        // Validation (partial)
        const validatedData = reviewSchema.partial().parse(data);

        const review = await prisma.review.update({
            where: { id },
            data: {
                ...validatedData,
                status: validatedData.status as string | undefined,
                healthStatus: validatedData.healthStatus as string | undefined,
                answers: validatedData.answers || undefined,
            },
            include: { project: true }
        });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            action: 'UPDATE_REVIEW',
            entity: 'Review',
            entityId: id,
            projectId: review.projectId,
            projectName: review.project.name,
            details: { adminEdit: true, updatedFields: Object.keys(validatedData) }
        });

        return review;
    }

    /**
     * Submit a review (Reviewer mode)
     */
    static async submitReview(id: string, data: ReviewInput, currentUser: SessionUser) {
        // Validation
        const validatedData = reviewSchema.parse(data);

        const review = await prisma.review.update({
            where: { id },
            data: {
                ...validatedData,
                answers: validatedData.answers || undefined,
                status: "SUBMITTED",
                submittedDate: new Date()
            },
            include: { project: { include: { lead: true } } }
        });

        await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            action: 'SUBMIT_REVIEW',
            entity: 'Review',
            entityId: id,
            projectId: review.projectId,
            projectName: review.project.name,
            details: { healthStatus: review.healthStatus }
        });

        // Notify Lead if applicable
        if (review.project.lead) {
            await sendEmail(
                review.project.lead.email,
                emailTemplates.leadNotification(
                    review.project.lead.name,
                    review.project.name,
                    currentUser.name,
                    "The monthly QA review has been submitted for your project."
                )
            );
        }

        return review;
    }

    private static async sendReviewCycleEmails(project: ProjectWithCollaborators, form: Form) {
        // Implementation of existing email trigger logic
        if (project.reviewer) {
            await sendEmail(
                project.reviewer.email,
                emailTemplates.reviewInvite(
                    project.reviewer.name,
                    project.name,
                    form.title,
                    "20th of the month",
                    project.secondaryReviewer?.name
                )
            );
        }

        if (project.secondaryReviewer) {
            await sendEmail(
                project.secondaryReviewer.email,
                emailTemplates.reviewInvite(
                    project.secondaryReviewer.name,
                    project.name,
                    form.title,
                    "20th of the month",
                    project.reviewer?.name,
                    true // isSecondary
                )
            );
        }

        if (project.lead) {
            await sendEmail(
                project.lead.email,
                emailTemplates.reviewInvite(
                    project.lead.name,
                    project.name,
                    form.title,
                    "20th of the month",
                    project.reviewer?.name,
                    false, // isSecondary
                    true   // isLead
                )
            );
        }
    }
}
