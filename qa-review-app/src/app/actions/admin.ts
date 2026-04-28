"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/withAuth";
import { ProjectService } from "@/services/projectService";
import { UserService } from "@/services/userService";
import { ReviewService } from "@/services/reviewService";
import { userSchema, projectSchema } from "@/lib/schemas";

/**
 * --- Read Actions (Wrappers for Services) ---
 */

export async function getProjects() {
    return await ProjectService.getAll();
}

export async function getUsers() {
    return await UserService.getAll();
}

export async function getForms() {
    return await ReviewService.getAllForms();
}

export async function getContactPersonUsers() {
    return await UserService.getContactPersons();
}

export async function getForm(id: string) {
    return await ReviewService.getFormById(id);
}

/**
 * --- Project Actions ---
 */

export async function createProject(formData: FormData) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    const data = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        type: (formData.get("type") as string || "MANUAL") as "MANUAL" | "AUTOMATION_WEB" | "AUTOMATION_MOBILE" | "API" | "DESKTOP",
        status: "ACTIVE" as const,
        leadId: formData.get("leadId") as string || null,
        reviewerId: formData.get("reviewerId") as string || null,
        secondaryReviewerId: formData.get("secondaryReviewerId") as string || null,
        contactPersonId: formData.get("contactPersonId") as string,
        pmId: formData.get("pmId") as string || null,
        devArchitectId: formData.get("devArchitectId") as string || null,
    };

    await ProjectService.create(data, user);
    revalidatePath("/admin/projects");
}

export async function updateProject(projectId: string, data: any) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    // Support both direct data and potentially any remaining FormData processing
    const payload = {
        name: data.name?.trim(),
        description: data.description,
        type: data.type || "MANUAL",
        leadId: data.leadId || null,
        reviewerId: data.reviewerId || null,
        secondaryReviewerId: data.secondaryReviewerId || null,
        contactPersonId: data.contactPersonId || null,
        pmId: data.pmId || null,
        devArchitectId: data.devArchitectId || null,
    };

    try {
        await ProjectService.update(projectId, payload, user);
        revalidatePath("/admin/projects");
        return { success: true };
    } catch (error: any) {
        // L-03: Log full error server-side; return generic message to client
        console.error("Failed to update project:", error);
        return { 
            success: false, 
            error: "An unexpected error occurred while updating the project." 
        };
    }
}

export async function deleteProject(projectId: string) {
    const user = await requireRole("ADMIN", "QA_HEAD");
    
    await ProjectService.delete(projectId, user);
    revalidatePath("/admin/projects");
}

export async function closeProject(projectId: string) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    await ProjectService.close(projectId, user);
    revalidatePath("/admin/projects");
}

export async function reopenProject(projectId: string) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    await ProjectService.reopen(projectId, user);
    revalidatePath("/admin/projects");
}

/**
 * --- User Actions ---
 */

export async function createUser(formData: FormData) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    // M-06: Validate with Zod before processing
    const raw = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        roles: formData.getAll("roles"),
    };
    const parsed = userSchema.pick({ name: true, email: true, roles: true }).safeParse(raw);
    if (!parsed.success) throw new Error("Invalid input: " + JSON.stringify(parsed.error.flatten()));

    await UserService.create(parsed.data as any, user);
    revalidatePath("/admin/users");
}

export async function updateUser(userId: string, formData: FormData) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        roles: formData.getAll("roles") as ("ADMIN" | "QA_HEAD" | "QA_MANAGER" | "QA_ARCHITECT" | "REVIEW_LEAD" | "REVIEWER" | "PM" | "DEV_ARCHITECT" | "CONTACT_PERSON" | "DIRECTOR")[],
    };

    await UserService.update(userId, data, user);
    revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    try {
        await UserService.delete(userId, user);
        revalidatePath("/admin/users");
        return { success: true };
    } catch {
        return { error: "Failed to delete user" };
    }
}

/**
 * --- Review & Form Actions ---
 */

export async function createReviewCycle(formId: string, targetNewOnly: boolean = false) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    await ReviewService.initiateCycle(formId, targetNewOnly, user);
    revalidatePath("/admin/projects");
    revalidatePath("/admin/reports");
}

export async function updateReview(reviewId: string, answers: any, summary: any) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    await ReviewService.adminUpdate(reviewId, { ...summary, answers }, user);
    
    revalidatePath("/admin/reviews");
    revalidatePath(`/admin/reviews/${reviewId}`);
    revalidatePath("/admin/reports");
}

export async function markReviewAsNotCompleted(reviewId: string, reason: string) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    await ReviewService.adminUpdate(reviewId, { status: "NOT_COMPLETED", notCompletedReason: reason }, user);
    revalidatePath("/admin/reviews");
}

export async function createForm(title: string, questions: any, projectType: string | null) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    await ReviewService.createForm({ title, questions, projectType }, user);
    revalidatePath("/admin/forms");
}

export async function updateForm(id: string, title: string, questions: any, projectType: string | null) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    await ReviewService.updateForm(id, { title, questions, projectType }, user);
    revalidatePath("/admin/forms");
}

export async function deleteForm(formData: FormData) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    const id = formData.get("id") as string;
    await ReviewService.deleteForm(id, user);
    revalidatePath("/admin/forms");
}
