import { z } from "zod";

// --- Shared Helpers ---
export const paginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(100),
    offset: z.coerce.number().int().min(0).default(0),
});

export const dateRangeSchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});

// --- User Schemas ---
export const roleSchema = z.enum([
    "ADMIN", "QA_HEAD", "QA_MANAGER", "QA_ARCHITECT", 
    "REVIEW_LEAD", "REVIEWER", "PM", "DEV_ARCHITECT", 
    "CONTACT_PERSON", "DIRECTOR"
]);

export const userSchema = z.object({
    id: z.string().cuid().optional(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    roles: z.array(roleSchema).min(1, "At least one role is required"),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

// --- Project Schemas ---
export const projectTypeSchema = z.enum([
    "MANUAL", "AUTOMATION_WEB", "AUTOMATION_MOBILE", "API", "DESKTOP"
]);

export const projectStatusSchema = z.enum(["ACTIVE", "CLOSED"]);

export const projectSchema = z.object({
    id: z.string().cuid().optional(),
    name: z.string().min(2, "Project name must be at least 2 characters"),
    description: z.string().optional().nullable(),
    type: projectTypeSchema.default("MANUAL"),
    leadId: z.string().cuid().optional().nullable(),
    reviewerId: z.string().cuid().optional().nullable(),
    secondaryReviewerId: z.string().cuid().optional().nullable(),
    contactPersonId: z.string().cuid().optional().nullable(), // Changed to User reference in v1
    pmId: z.string().cuid().optional().nullable(),
    devArchitectId: z.string().cuid().optional().nullable(),
    status: projectStatusSchema.default("ACTIVE"),
});

// --- Form Schemas ---
export const formQuestionSchema = z.object({
    id: z.string(),
    type: z.enum(["TEXT", "TEXTAREA", "SELECT", "RADIO", "CHECKBOX", "NUMBER"]),
    label: z.string(),
    options: z.array(z.string()).optional(),
    required: z.boolean().default(true),
});

export const formSchema = z.object({
    id: z.string().cuid().optional(),
    title: z.string().min(2, "Form title must be at least 2 characters"),
    questions: z.array(formQuestionSchema),
    projectType: projectTypeSchema.optional().nullable(),
    isActive: z.boolean().default(true),
});

// --- Review Schemas ---
export const reviewStatusSchema = z.enum([
    "PENDING", "SCHEDULED", "SUBMITTED", "DEFERRED", "ON_HOLD", "PROJECT_ENDED", "NOT_COMPLETED"
]);

export const healthStatusSchema = z.enum([
    "On Track", "Slightly Challenged", "Extremely Challenged", "N/A"
]);

export const reviewSchema = z.object({
    id: z.string().cuid().optional(),
    projectId: z.string().cuid(),
    reviewerId: z.string().cuid(),
    secondaryReviewerId: z.string().cuid().optional().nullable(),
    formId: z.string().cuid(),
    status: reviewStatusSchema.default("PENDING"),
    healthStatus: healthStatusSchema.default("On Track"),
    deferredReason: z.string().optional().nullable(),
    endedReason: z.string().optional().nullable(),
    onHoldReason: z.string().optional().nullable(),
    notCompletedReason: z.string().optional().nullable(),
    observations: z.string().optional().nullable(),
    recommendedActions: z.string().optional().nullable(),
    followUpComment: z.string().optional().nullable(),
    scheduledDate: z.coerce.date().optional().nullable(),
    submittedDate: z.coerce.date().optional().nullable(),
    answers: z.record(z.string(), z.any()).optional().nullable(),
});

// --- Comment Schema ---
export const commentSchema = z.object({
    id: z.string().cuid().optional(),
    content: z.string().min(1, "Comment cannot be empty"),
    reviewId: z.string().cuid(),
    userId: z.string().cuid(),
});
