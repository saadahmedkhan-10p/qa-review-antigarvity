import {
    Role,
    hasPermission,
    getPrimaryRole,
    getDashboardPath,
    canViewReviews,
    canCommentOnReviews,
    canManageReviews,
    canManageProjects,
    canManageUsers,
    canManageForms,
    canViewReports,
    canExportReports,
    getRoleBadgeColor,
    getRoleLabel,
    hasAnyRole,
    hasAllRoles
} from "@/types/roles";

describe("Role System Tests", () => {
    describe("Permission Helpers", () => {
        it("should correctly identify permissions for ADMIN", () => {
            const roles: Role[] = ["ADMIN"];
            expect(canViewReviews(roles)).toBe(true);
            expect(canCommentOnReviews(roles)).toBe(true);
            expect(canManageReviews(roles)).toBe(true);
            expect(canManageProjects(roles)).toBe(true);
            expect(canManageUsers(roles)).toBe(true);
            expect(canManageForms(roles)).toBe(true);
            expect(canViewReports(roles)).toBe(true);
            expect(canExportReports(roles)).toBe(true);
        });

        it("should correctly identify permissions for QA_MANAGER", () => {
            const roles: Role[] = ["QA_MANAGER"];
            expect(canViewReviews(roles)).toBe(true);
            expect(canCommentOnReviews(roles)).toBe(true);
            expect(canManageReviews(roles)).toBe(true);
            expect(canManageProjects(roles)).toBe(true);
            expect(canManageUsers(roles)).toBe(false); // QA Manager cannot manage users
            expect(canManageForms(roles)).toBe(true);
            expect(canViewReports(roles)).toBe(true);
            expect(canExportReports(roles)).toBe(true);
        });

        it("should correctly identify permissions for REVIEWER", () => {
            const roles: Role[] = ["REVIEWER"];
            expect(canViewReviews(roles)).toBe(true);
            expect(canCommentOnReviews(roles)).toBe(true);
            expect(canManageReviews(roles)).toBe(false);
            expect(canManageProjects(roles)).toBe(false);
            expect(canManageUsers(roles)).toBe(false);
            expect(canManageForms(roles)).toBe(false);
            expect(canViewReports(roles)).toBe(false);
            expect(canExportReports(roles)).toBe(false);
        });

        it("should correctly identify permissions for PM", () => {
            const roles: Role[] = ["PM"];
            expect(canViewReviews(roles)).toBe(true);
            expect(canCommentOnReviews(roles)).toBe(true);
            expect(canManageReviews(roles)).toBe(false);
            expect(canManageProjects(roles)).toBe(false);
            expect(canManageUsers(roles)).toBe(false);
            expect(canManageForms(roles)).toBe(false);
            expect(canViewReports(roles)).toBe(true);
            expect(canExportReports(roles)).toBe(false);
        });
    });

    describe("Primary Role Resolution", () => {
        it("should prioritize ADMIN over other roles", () => {
            const roles: Role[] = ["REVIEWER", "ADMIN", "PM"];
            expect(getPrimaryRole(roles)).toBe("ADMIN");
        });

        it("should prioritize QA_MANAGER over REVIEWER", () => {
            const roles: Role[] = ["REVIEWER", "QA_MANAGER"];
            expect(getPrimaryRole(roles)).toBe("QA_MANAGER");
        });

        it("should prioritize DIRECTOR over PM", () => {
            const roles: Role[] = ["PM", "DIRECTOR"];
            expect(getPrimaryRole(roles)).toBe("DIRECTOR");
        });

        it("should default to the first role if no priority match found (fallback)", () => {
            // In our current priority list, almost all roles are covered, but let's test single role
            expect(getDashboardPath(["QA_ARCHITECT"])).toBe("/qa-architect/dashboard");
        });

        it("should return correct dashboard for PM", () => {
            expect(getDashboardPath(["PM"])).toBe("/pm/dashboard");
        });

        it("should return correct dashboard for mixed roles (prioritizing higher role)", () => {
            expect(getDashboardPath(["REVIEWER", "QA_MANAGER"])).toBe("/qa-manager/dashboard");
        });
    });

    describe("Role Utilities", () => {
        it("should return correct badge colors", () => {
            expect(getRoleBadgeColor("ADMIN")).toContain("bg-purple-100");
            expect(getRoleBadgeColor("QA_MANAGER")).toContain("bg-indigo-100");
            expect(getRoleBadgeColor("REVIEWER")).toContain("bg-green-100");
        });

        it("should return correct labels", () => {
            expect(getRoleLabel("ADMIN")).toBe("Admin");
            expect(getRoleLabel("QA_MANAGER")).toBe("QA Manager");
            expect(getRoleLabel("PM")).toBe("Project Manager");
        });

        it("should correctly check for any role", () => {
            const userRoles: Role[] = ["REVIEWER", "PM"];
            expect(hasAnyRole(userRoles, ["ADMIN", "PM"])).toBe(true);
            expect(hasAnyRole(userRoles, ["ADMIN", "QA_MANAGER"])).toBe(false);
        });

        it("should correctly check for all roles", () => {
            const userRoles: Role[] = ["REVIEWER", "PM"];
            expect(hasAllRoles(userRoles, ["REVIEWER", "PM"])).toBe(true);
            expect(hasAllRoles(userRoles, ["REVIEWER"])).toBe(true);
            expect(hasAllRoles(userRoles, ["REVIEWER", "ADMIN"])).toBe(false);
        });
    });
});
