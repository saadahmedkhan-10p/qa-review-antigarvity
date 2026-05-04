"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/withAuth";
import { ProjectService } from "@/services/projectService";
import { UserService } from "@/services/userService";
import { ReviewService } from "@/services/reviewService";
import { userSchema, projectSchema, formSchema } from "@/lib/schemas";

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

    // M-06: Validate with Zod before processing
    const raw = {
        name: formData.get("name") as string,
        description: formData.get("description") as string || undefined,
        type: formData.get("type") as string || "MANUAL",
        leadId: formData.get("leadId") as string || null,
        reviewerId: formData.get("reviewerId") as string || null,
        secondaryReviewerId: formData.get("secondaryReviewerId") as string || null,
        contactPersonId: formData.get("contactPersonId") as string || null,
        pmId: formData.get("pmId") as string || null,
        devArchitectId: formData.get("devArchitectId") as string || null,
    };
    const parsed = projectSchema.omit({ id: true, status: true }).safeParse(raw);
    if (!parsed.success) throw new Error("Invalid input");

    await ProjectService.create({ ...parsed.data, status: "ACTIVE" }, user);
    revalidatePath("/admin/projects");
}

export async function updateProject(projectId: string, data: any) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    // M-06: Validate with Zod before processing
    const parsed = projectSchema.omit({ id: true }).safeParse({
        name: data.name,
        description: data.description || undefined,
        type: data.type || "MANUAL",
        leadId: data.leadId || null,
        reviewerId: data.reviewerId || null,
        secondaryReviewerId: data.secondaryReviewerId || null,
        contactPersonId: data.contactPersonId || null,
        pmId: data.pmId || null,
        devArchitectId: data.devArchitectId || null,
    });
    if (!parsed.success) return { success: false, error: "Invalid input" };

    try {
        await ProjectService.update(projectId, parsed.data, user);
        revalidatePath("/admin/projects");
        return { success: true };
    } catch (error: unknown) {
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

    // M-06: Validate with Zod before processing
    const raw = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        roles: formData.getAll("roles"),
    };
    const parsed = userSchema.pick({ name: true, email: true, roles: true }).safeParse(raw);
    if (!parsed.success) throw new Error("Invalid input");

    await UserService.update(userId, parsed.data as any, user);
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

    // M-06: Validate with Zod before processing
    const parsed = formSchema.pick({ title: true, questions: true, projectType: true }).safeParse({
        title,
        questions,
        projectType: projectType || null,
    });
    if (!parsed.success) throw new Error("Invalid input");

    await ReviewService.createForm(parsed.data as { title: string, questions: any, projectType: string | null }, user);
    revalidatePath("/admin/forms");
}

export async function updateForm(id: string, title: string, questions: any, projectType: string | null) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    // M-06: Validate with Zod before processing
    const parsed = formSchema.pick({ title: true, questions: true, projectType: true }).safeParse({
        title,
        questions,
        projectType: projectType || null,
    });
    if (!parsed.success) throw new Error("Invalid input");

    await ReviewService.updateForm(id, parsed.data as { title: string, questions: any, projectType: string | null }, user);
    revalidatePath("/admin/forms");
}

export async function deleteForm(formData: FormData) {
    const user = await requireRole("ADMIN", "QA_HEAD");

    const id = formData.get("id") as string;
    await ReviewService.deleteForm(id, user);
    revalidatePath("/admin/forms");
}
