"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { ProjectService } from "@/services/projectService";
import { UserService } from "@/services/userService";
import { ReviewService } from "@/services/reviewService";

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
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

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

export async function updateProject(projectId: string, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const data = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        type: (formData.get("type") as string || "MANUAL") as "MANUAL" | "AUTOMATION_WEB" | "AUTOMATION_MOBILE" | "API" | "DESKTOP",
        leadId: formData.get("leadId") as string,
        reviewerId: formData.get("reviewerId") as string,
        secondaryReviewerId: formData.get("secondaryReviewerId") as string || null,
        contactPersonId: formData.get("contactPersonId") as string,
        pmId: formData.get("pmId") as string || null,
        devArchitectId: formData.get("devArchitectId") as string || null,
    };

    await ProjectService.update(projectId, data, user);
    revalidatePath("/admin/projects");
}

export async function deleteProject(projectId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    
    await ProjectService.delete(projectId, user);
    revalidatePath("/admin/projects");
}

export async function closeProject(projectId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await ProjectService.close(projectId, user);
    revalidatePath("/admin/projects");
}

export async function reopenProject(projectId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await ProjectService.reopen(projectId, user);
    revalidatePath("/admin/projects");
}

/**
 * --- User Actions ---
 */

export async function createUser(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        roles: formData.getAll("roles") as ("ADMIN" | "QA_HEAD" | "QA_MANAGER" | "QA_ARCHITECT" | "REVIEW_LEAD" | "REVIEWER" | "PM" | "DEV_ARCHITECT" | "CONTACT_PERSON" | "DIRECTOR")[],
    };

    await UserService.create(data, user);
    revalidatePath("/admin/users");
}

export async function updateUser(userId: string, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        roles: formData.getAll("roles") as ("ADMIN" | "QA_HEAD" | "QA_MANAGER" | "QA_ARCHITECT" | "REVIEW_LEAD" | "REVIEWER" | "PM" | "DEV_ARCHITECT" | "CONTACT_PERSON" | "DIRECTOR")[],
    };

    await UserService.update(userId, data, user);
    revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    try {
        await UserService.delete(userId, user);
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * --- Review & Form Actions ---
 */

export async function createReviewCycle(formId: string, targetNewOnly: boolean = false) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await ReviewService.initiateCycle(formId, targetNewOnly, user);
    revalidatePath("/admin/projects");
    revalidatePath("/admin/reports");
}

export async function updateReview(reviewId: string, answers: any, summary: any) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await ReviewService.adminUpdate(reviewId, { ...summary, answers }, user);
    
    revalidatePath("/admin/reviews");
    revalidatePath(`/admin/reviews/${reviewId}`);
    revalidatePath("/admin/reports");
}

export async function markReviewAsNotCompleted(reviewId: string, reason: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await ReviewService.adminUpdate(reviewId, { status: "NOT_COMPLETED", notCompletedReason: reason }, user);
    revalidatePath("/admin/reviews");
}

export async function createForm(title: string, questions: any, projectType: string | null) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await ReviewService.createForm({ title, questions, projectType }, user);
    revalidatePath("/admin/forms");
}

export async function updateForm(id: string, title: string, questions: any, projectType: string | null) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await ReviewService.updateForm(id, { title, questions, projectType }, user);
    revalidatePath("/admin/forms");
}

export async function deleteForm(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const id = formData.get("id") as string;
    await ReviewService.deleteForm(id, user);
    revalidatePath("/admin/forms");
}
