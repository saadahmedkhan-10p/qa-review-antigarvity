"use server";

import { sendEmail, emailTemplates } from "@/lib/email";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { getSession } from "@/lib/auth";

export async function getProjects() {
    return await prisma.project.findMany({
        include: {
            lead: true,
            reviewer: true,
            secondaryReviewer: true,
            contactPerson: true,
        },
    });
}

export async function getUsers() {
    return await prisma.user.findMany();
}

export async function createProject(formData: FormData) {
    const session = await getSession();
    const user = session?.user;
    const roles = user?.roles || [];
    const isAdmin = roles.includes("ADMIN");
    const isQAHead = roles.includes("QA_HEAD");

    if (isQAHead && !isAdmin) {
        // QA Head is now allowed to create projects
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string || "MANUAL";
    const leadId = formData.get("leadId") as string | null;
    const reviewerId = formData.get("reviewerId") as string | null;
    const secondaryReviewerId = formData.get("secondaryReviewerId") as string | null;
    const contactPersonId = formData.get("contactPersonId") as string;
    const pmId = formData.get("pmId") as string | null;
    const devArchitectId = formData.get("devArchitectId") as string | null;

    const project = await prisma.project.create({
        data: {
            name,
            description,
            type,
            ...(leadId && leadId !== "" && { leadId }),
            ...(reviewerId && reviewerId !== "" && { reviewerId }),
            ...(secondaryReviewerId && secondaryReviewerId !== "" && { secondaryReviewerId }),
            contactPersonId,
            ...(pmId && pmId !== "" && { pmId }),
            ...(devArchitectId && devArchitectId !== "" && { devArchitectId })
        },
        include: {
            lead: true,
            reviewer: true,
            secondaryReviewer: true,
            contactPerson: true
        }
    });

    await logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'CREATE_PROJECT',
        entity: 'Project',
        entityId: project.id,
        projectId: project.id,
        projectName: project.name,
        details: { description: project.description, type: project.type }
    });

    // Send emails only if reviewer and lead are assigned
    if (project.reviewer) {
        await sendEmail(
            project.reviewer.email,
            emailTemplates.projectAssigned(
                project.reviewer.name,
                project.name,
                project.lead?.name || 'Not Assigned',
                project.contactPerson?.name || 'Not Assigned',
                (project as any).secondaryReviewer?.name
            )
        );
    }

    if ((project as any).secondaryReviewer) {
        await sendEmail(
            (project as any).secondaryReviewer.email,
            emailTemplates.projectAssigned(
                (project as any).secondaryReviewer.name,
                project.name,
                project.lead?.name || 'Not Assigned',
                project.contactPerson?.name || 'Not Assigned',
                project.reviewer?.name
            )
        );
    }

    if (project.lead) {
        await sendEmail(
            project.lead.email,
            emailTemplates.leadNotification(
                project.lead.name,
                project.name,
                project.reviewer?.name || 'Not Assigned',
                `A new project has been created and you have been assigned as the Review Lead.`
            )
        );
    }

    revalidatePath("/admin/projects");
}

export async function createReviewCycle(formId: string, targetNewOnly: boolean = false) {
    const session = await getSession();
    const user = session?.user;
    const roles = user?.roles || [];
    const isAdmin = roles.includes("ADMIN");
    const isQAHead = roles.includes("QA_HEAD");

    if (isQAHead && !isAdmin) {
        throw new Error("QA Head is not allowed to initiate review cycles");
    }

    const projects = await prisma.project.findMany({
        include: {
            reviewer: true,
            secondaryReviewer: true,
            lead: true,
            reviews: {
                select: { id: true }
            }
        }
    });

    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form) return;

    for (const project of projects) {
        // Skip if form is for a specific project type and project doesn't match
        if (form.projectType && form.projectType !== (project as any).type) {
            continue;
        }

        // Apply "New Only" filter if requested
        if (targetNewOnly && project.reviews.length > 0) {
            continue;
        }

        // Skip if project has no reviewer assigned
        if (!project.reviewerId || !project.reviewer) {
            continue;
        }

        const existing = await prisma.review.findFirst({
            where: {
                projectId: project.id,
                formId: formId,
                status: { not: "SUBMITTED" }
            }
        });

        if (!existing) {
            await prisma.review.create({
                data: {
                    projectId: project.id,
                    reviewerId: project.reviewerId,
                    secondaryReviewerId: project.secondaryReviewerId,
                    formId: formId,
                    status: "PENDING"
                }
            });

            await sendEmail(
                project.reviewer.email,
                emailTemplates.reviewInvite(
                    project.reviewer.name,
                    project.name,
                    form.title,
                    new Date().toLocaleDateString(),
                    project.secondaryReviewer?.name
                )
            );

            if (project.secondaryReviewer) {
                await sendEmail(
                    project.secondaryReviewer.email,
                    emailTemplates.reviewInvite(
                        project.secondaryReviewer.name,
                        project.name,
                        form.title,
                        new Date().toLocaleDateString(),
                        project.reviewer.name,
                        true // isSecondary
                    )
                );
            }

            if (project.lead) {
                const reviewers = [project.reviewer.name];
                if (project.secondaryReviewer) reviewers.push(project.secondaryReviewer.name);

                await sendEmail(
                    project.lead.email,
                    emailTemplates.reviewInvite(
                        project.lead.name,
                        project.name,
                        form.title,
                        new Date().toLocaleDateString(),
                        reviewers.join(' & '),
                        false, // isSecondary
                        true   // isLead
                    )
                );
            }
        }
    }

    revalidatePath("/admin/projects");
    revalidatePath("/admin/reports");
}

export async function getForms() {
    return await prisma.form.findMany();
}

export async function getForm(id: string) {
    return await prisma.form.findUnique({ where: { id } });
}

export async function createForm(title: string, questions: any[], projectType: string | null = null) {

    await (prisma.form as any).create({
        data: {
            title,
            questions: JSON.stringify(questions),
            projectType
        }
    });

    revalidatePath("/admin/forms");
}

export async function updateForm(id: string, title: string, questions: any[], projectType: string | null = null) {
    await (prisma.form as any).update({
        where: { id },
        data: {
            title,
            questions: JSON.stringify(questions),
            projectType
        }
    });

    revalidatePath("/admin/forms");
}

export async function markReviewAsNotCompleted(reviewId: string, reason: string) {
    const session = await getSession();
    const user = session?.user;
    const roles = user?.roles || [];
    const isAdmin = roles.includes("ADMIN");
    const isQAHead = roles.includes("QA_HEAD");

    if (!isAdmin && !isQAHead) {
        throw new Error("Unauthorized: Only Admins or QA Heads can mark reviews as not completed");
    }

    await (prisma.review as any).update({
        where: { id: reviewId },
        data: {
            status: "NOT_COMPLETED",
            notCompletedReason: reason
        }
    });

    revalidatePath("/admin/reviews");
}

export async function deleteForm(formData: FormData) {
    const session = await getSession();
    const user = session?.user;
    const roles = user?.roles || [];
    const isAdmin = roles.includes("ADMIN");
    const isQAHead = roles.includes("QA_HEAD");

    if (isQAHead && !isAdmin) {
        throw new Error("QA Head is not allowed to delete forms");
    }

    const id = formData.get("id") as string;

    const reviewsUsingForm = await prisma.review.count({
        where: { formId: id }
    });

    if (reviewsUsingForm > 0) {
        throw new Error(`Cannot delete form. It is being used in ${reviewsUsingForm} review(s).`);
    }

    await prisma.form.delete({
        where: { id }
    });

    revalidatePath("/admin/forms");
}

export async function createUser(formData: FormData) {
    const session = await getSession();
    const currentUser = session?.user;
    const currentRoles = currentUser?.roles || [];
    const isAdmin = currentRoles.includes("ADMIN");
    const isQAHead = currentRoles.includes("QA_HEAD");

    if (isQAHead && !isAdmin) {
        // QA Head is now allowed to create users
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const roles = formData.getAll("roles") as string[];
    const projectIds = formData.getAll("projectIds") as string[];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let user;
    try {
        user = await prisma.user.create({
            data: {
                name,
                email,
                password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
                roles: JSON.stringify(roles),
                passwordResetToken: resetToken,
                passwordResetExpiry: resetExpiry
            }
        });
    } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            throw new Error("User with this email already exists.");
        }
        throw error;
    }

    if (projectIds.length > 0) {
        for (const projectId of projectIds) {
            const updateData: any = {};

            if (roles.includes("REVIEW_LEAD")) {
                updateData.leadId = user.id;
            }
            if (roles.includes("REVIEWER")) {
                updateData.reviewerId = user.id;
            }
            if (roles.includes("CONTACT_PERSON")) {
                updateData.contactPersonId = user.id;
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.project.update({
                    where: { id: projectId },
                    data: updateData
                });
            }
        }
    }

    await sendEmail(
        user.email,
        emailTemplates.userCreated(user.name, user.email, roles.join(", "), resetToken)
    );

    revalidatePath("/admin/users");
    revalidatePath("/admin/projects");
}

export async function deleteUser(userId: string) {
    const session = await getSession();
    const user = session?.user;
    const roles = user?.roles || [];
    const isAdmin = roles.includes("ADMIN");
    const isQAHead = roles.includes("QA_HEAD");

    if (isQAHead && !isAdmin) {
        return { error: "QA Head is not allowed to delete users" };
    }

    const assignedProjects = await prisma.project.findMany({
        where: {
            OR: [
                { leadId: userId },
                { reviewerId: userId },
                { contactPersonId: userId }
            ]
        }
    });

    if (assignedProjects.length > 0) {
        console.error("Cannot delete user: User is assigned to projects.");
        return { error: "Cannot delete user: User is assigned to projects." };
    }

    await prisma.user.delete({
        where: { id: userId }
    });

    revalidatePath("/admin/users");
}

export async function updateUser(userId: string, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const roles = formData.getAll("roles") as string[];

    await prisma.user.update({
        where: { id: userId },
        data: {
            name,
            email,
            roles: JSON.stringify(roles)
        }
    });

    revalidatePath("/admin/users");
}

export async function updateProject(projectId: string, formData: FormData) {
    const session = await getSession();
    const user = session?.user;

    // Fetch the old project data before updating
    const oldProject = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            lead: true,
            reviewer: true,
            secondaryReviewer: true,
            contactPerson: true,
            pm: true,
            devArchitect: true
        }
    });

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const leadId = formData.get("leadId") as string;
    const reviewerId = formData.get("reviewerId") as string;
    const secondaryReviewerId = formData.get("secondaryReviewerId") as string | null;
    const contactPersonId = formData.get("contactPersonId") as string;
    const pmId = formData.get("pmId") as string | null;
    const devArchitectId = formData.get("devArchitectId") as string | null;

    await prisma.project.update({
        where: { id: projectId },
        data: {
            name,
            description,
            type,
            leadId,
            reviewerId,
            secondaryReviewerId: secondaryReviewerId && secondaryReviewerId !== "" ? secondaryReviewerId : null,
            contactPersonId,
            pmId: pmId && pmId !== "" ? pmId : null,
            devArchitectId: devArchitectId && devArchitectId !== "" ? devArchitectId : null
        }
    });

    // Build a changes object showing what was modified
    const changes: Record<string, { from: string; to: string }> = {};

    if (oldProject) {
        if (oldProject.name !== name) {
            changes.name = { from: oldProject.name, to: name };
        }
        if (oldProject.description !== description) {
            changes.description = { from: oldProject.description || '', to: description };
        }
        if ((oldProject as any).type !== type) {
            changes.type = { from: (oldProject as any).type || 'MANUAL', to: type };
        }
        if (oldProject.leadId !== leadId) {
            changes.lead = { from: oldProject.lead?.name || 'None', to: 'Updated' };
        }
        if (oldProject.reviewerId !== reviewerId) {
            changes.reviewer = { from: oldProject.reviewer?.name || 'None', to: 'Updated' };
        }
        if ((oldProject as any).secondaryReviewerId !== secondaryReviewerId) {
            changes.secondaryReviewer = { from: (oldProject as any).secondaryReviewer?.name || 'None', to: 'Updated' };
        }
        if (oldProject.contactPersonId !== contactPersonId) {
            changes.contactPerson = { from: oldProject.contactPerson?.name || 'None', to: 'Updated' };
        }
        if (oldProject.pmId !== (pmId && pmId !== "" ? pmId : null)) {
            changes.pm = { from: oldProject.pm?.name || 'None', to: pmId ? 'Updated' : 'Removed' };
        }
        if (oldProject.devArchitectId !== (devArchitectId && devArchitectId !== "" ? devArchitectId : null)) {
            changes.devArchitect = { from: oldProject.devArchitect?.name || 'None', to: devArchitectId ? 'Updated' : 'Removed' };
        }
    }

    await logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'UPDATE_PROJECT',
        entity: 'Project',
        entityId: projectId,
        projectId: projectId,
        projectName: name,
        details: { changes }
    });

    // Automatic Notifications for Role Changes
    if (changes.reviewer || changes.secondaryReviewer || changes.lead) {
        const updatedProject = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                lead: true,
                reviewer: true,
                secondaryReviewer: true,
                contactPerson: true
            }
        });

        if (updatedProject) {
            // New Primary Reviewer Notification
            if (changes.reviewer && updatedProject.reviewer) {
                await sendEmail(
                    updatedProject.reviewer.email,
                    emailTemplates.projectAssigned(
                        updatedProject.reviewer.name,
                        updatedProject.name,
                        updatedProject.lead?.name || 'Not Assigned',
                        updatedProject.contactPerson?.name || 'Not Assigned',
                        updatedProject.secondaryReviewer?.name
                    )
                );
            }

            // New Secondary Reviewer Notification
            if (changes.secondaryReviewer && updatedProject.secondaryReviewer) {
                await sendEmail(
                    updatedProject.secondaryReviewer.email,
                    emailTemplates.projectAssigned(
                        updatedProject.secondaryReviewer.name,
                        updatedProject.name,
                        updatedProject.lead?.name || 'Not Assigned',
                        updatedProject.contactPerson?.name || 'Not Assigned',
                        updatedProject.reviewer?.name
                    )
                );
            }

            // New Lead Notification
            if (changes.lead && updatedProject.lead) {
                await sendEmail(
                    updatedProject.lead.email,
                    emailTemplates.leadNotification(
                        updatedProject.lead.name,
                        updatedProject.name,
                        updatedProject.reviewer?.name || 'Not Assigned',
                        `You have been assigned as the Review Lead for this project.`
                    )
                );
            }
        }
    }

    revalidatePath("/admin/projects");
}

// Contact Person Actions - MOVED TO USER MANAGEMENT
// Since Contact Person is now a USER role, we use the standard getUsers logic.

export async function getContactPersonUsers() {
    // Helper to get users who have the CONTACT_PERSON role
    const allUsers = await prisma.user.findMany({
        orderBy: { name: 'asc' }
    });
    return allUsers.filter(u => {
        try {
            const roles = JSON.parse(u.roles);
            return roles.includes('CONTACT_PERSON');
        } catch (e) { return false; }
    });
}

export async function deleteProject(projectId: string) {
    const session = await getSession();
    const user = session?.user;
    const roles = user?.roles || [];
    const isAdmin = roles.includes("ADMIN");
    const isQAHead = roles.includes("QA_HEAD");

    if (isQAHead && !isAdmin) {
        throw new Error("QA Head is not allowed to delete projects");
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    await prisma.review.deleteMany({
        where: { projectId }
    });

    await prisma.project.delete({
        where: { id: projectId }
    });

    if (project) {
        await logActivity({
            userId: user?.id,
            userName: user?.name,
            userEmail: user?.email,
            action: 'DELETE_PROJECT',
            entity: 'Project',
            entityId: projectId,
            projectId: projectId,
            projectName: project.name,
        });
    }

    revalidatePath("/admin/projects");
}

export async function closeProject(projectId: string) {
    const session = await getSession();
    const user = session?.user;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, status: true }
    });

    if (!project) {
        throw new Error('Project not found');
    }

    if (project.status === 'CLOSED') {
        throw new Error('Project is already closed');
    }

    await prisma.project.update({
        where: { id: projectId },
        data: {
            status: 'CLOSED',
            closedAt: new Date()
        }
    });

    await logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'CLOSE_PROJECT',
        entity: 'Project',
        entityId: projectId,
        projectId: projectId,
        projectName: project.name,
        details: { closedAt: new Date().toISOString() }
    });

    revalidatePath("/admin/projects");
}

export async function reopenProject(projectId: string) {
    const session = await getSession();
    const user = session?.user;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, status: true }
    });

    if (!project) {
        throw new Error('Project not found');
    }

    if (project.status === 'ACTIVE') {
        throw new Error('Project is already active');
    }

    await prisma.project.update({
        where: { id: projectId },
        data: {
            status: 'ACTIVE',
            closedAt: null
        }
    });

    await logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'REOPEN_PROJECT',
        entity: 'Project',
        entityId: projectId,
        projectId: projectId,
        projectName: project.name,
    });

    revalidatePath("/admin/projects");
}

export async function updateReview(
    reviewId: string,
    answers: any,
    summary: {
        healthStatus: string;
        deferredReason?: string;
        endedReason?: string;
        onHoldReason?: string;
        observations?: string;
        recommendedActions?: string;
        followUpComment?: string;
    }
) {
    // Determine status: if there's a reason for Deferred/Ended/OnHold, set that status?
    // The user said "Admins should be able to view and edit". usually preserving status is safer unless Admin explicitly changes it.
    // However, existing submitReview infers status.
    // If Admin changes health status to "Deferred", should status become DEFERRED?
    // Let's assume Admin just edits content. But if they provide reasons, we might want to sync status.
    // For now, let's keep it simple: update fields. If logic is needed, we can add it.
    // But wait, the schema has `status` and `healthStatus`.
    // If I change `healthStatus` to `Deferred`, `status` usually tracks that?
    // Let's update status if it's implied by reasons?
    // No, let's just update the fields and let the user (Admin) manage status if I add a status field?
    // The simplified version I drafted earlier is safer for now.

    const updateData: any = {
        answers: JSON.stringify(answers),
        healthStatus: summary.healthStatus,
        observations: summary.observations,
        recommendedActions: summary.recommendedActions,
        followUpComment: summary.followUpComment
    };

    if (summary.deferredReason) updateData.deferredReason = summary.deferredReason;
    if (summary.endedReason) updateData.endedReason = summary.endedReason;
    if (summary.onHoldReason) updateData.onHoldReason = summary.onHoldReason;

    const review = await prisma.review.update({
        where: { id: reviewId },
        data: updateData,
        include: {
            project: true
        }
    });

    const session = await getSession();
    const user = session?.user;

    await logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'UPDATE_REVIEW',
        entity: 'Review',
        entityId: reviewId,
        projectId: review.projectId,
        projectName: review.project.name,
        details: {
            updatedFields: Object.keys(updateData),
            adminEdit: true
        }
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/admin/reviews/${reviewId}`);
    revalidatePath("/admin/reports");
}
