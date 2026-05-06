// Role definitions
export type Role =
    | "ADMIN"
    | "QA_HEAD"
    | "QA_MANAGER"
    | "QA_ARCHITECT"
    | "REVIEW_LEAD"
    | "REVIEWER"
    | "PM"
    | "DEV_ARCHITECT"
    | "CONTACT_PERSON"
    | "DIRECTOR"
    | "GUEST";

// Permission levels
export enum PermissionLevel {
    NONE = 0,
    VIEW = 1,
    COMMENT = 2,
    MANAGE = 3,
    ADMIN = 4
}

// Role configurations
export const ROLE_CONFIG: Record<Role, {
    label: string;
    description: string;
    dashboardPath: string;
    permissions: {
        viewReviews: boolean;
        commentOnReviews: boolean;
        manageReviews: boolean;
        manageProjects: boolean;
        manageUsers: boolean;
        manageForms: boolean;
        viewReports: boolean;
        exportReports: boolean;
    };
    badgeColor: {
        light: string;
        dark: string;
    };
}> = {
    ADMIN: {
        label: "Admin",
        description: "Full system access",
        dashboardPath: "/admin/reports",
        permissions: {
            viewReviews: true,
            commentOnReviews: true,
            manageReviews: true,
            manageProjects: true,
            manageUsers: true,
            manageForms: true,
            viewReports: true,
            exportReports: true,
        },
        badgeColor: {
            light: "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
            dark: "bg-purple-600 text-white"
        }
    },
    QA_HEAD: {
        label: "QA Head",
        description: "High-level oversight with restricted deletion and form creation",
        dashboardPath: "/admin/reports",
        permissions: {
            viewReviews: true,
            commentOnReviews: true,
            manageReviews: true,
            manageProjects: true,
            manageUsers: true,
            manageForms: true,
            viewReports: true,
            exportReports: true,
        },
        badgeColor: {
            light: "bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
            dark: "bg-indigo-600 text-white"
        }
    },
    QA_MANAGER: {
        label: "QA Manager",
        description: "Manage all QA operations",
        dashboardPath: "/qa-manager/dashboard",
        permissions: {
            viewReviews: true,
            commentOnReviews: true,
            manageReviews: true,
            manageProjects: true,
            manageUsers: false,
            manageForms: true,
            viewReports: true,
            exportReports: true,
        },
        badgeColor: {
            light: "bg-indigo-100 text-indigo-800 border border-indigo-200",
            dark: "bg-indigo-600 text-white"
        }
    },
    QA_ARCHITECT: {
        label: "QA Architect",
        description: "Define QA standards and oversee reviews",
        dashboardPath: "/qa-architect/dashboard",
        permissions: {
            viewReviews: true,
            commentOnReviews: true,
            manageReviews: true,
            manageProjects: true,
            manageUsers: false,
            manageForms: true,
            viewReports: true,
            exportReports: true,
        },
        badgeColor: {
            light: "bg-blue-100 text-blue-800 border border-blue-200",
            dark: "bg-blue-600 text-white"
        }
    },
    REVIEW_LEAD: {
        label: "Review Lead",
        description: "Lead review processes",
        dashboardPath: "/lead/dashboard",
        permissions: {
            viewReviews: true,
            commentOnReviews: true,
            manageReviews: true,
            manageProjects: false,
            manageUsers: false,
            manageForms: false,
            viewReports: false,
            exportReports: false,
        },
        badgeColor: {
            light: "bg-cyan-100 text-cyan-800 border border-cyan-200",
            dark: "bg-cyan-600 text-white"
        }
    },
    REVIEWER: {
        label: "Reviewer",
        description: "Conduct reviews",
        dashboardPath: "/reviewer/dashboard",
        permissions: {
            viewReviews: true,
            commentOnReviews: true,
            manageReviews: false,
            manageProjects: false,
            manageUsers: false,
            manageForms: false,
            viewReports: false,
            exportReports: false,
        },
        badgeColor: {
            light: "bg-green-100 text-green-800 border border-green-200",
            dark: "bg-green-600 text-white"
        }
    },
    PM: {
        label: "Project Manager",
        description: "View and comment on reviews",
        dashboardPath: "/pm/dashboard",
        permissions: {
            viewReviews: true,
            commentOnReviews: true,
            manageReviews: false,
            manageProjects: false,
            manageUsers: false,
            manageForms: false,
            viewReports: true,
            exportReports: false,
        },
        badgeColor: {
            light: "bg-orange-100 text-orange-800 border border-orange-200",
            dark: "bg-orange-600 text-white"
        }
    },
    DEV_ARCHITECT: {
        label: "Dev Architect",
        description: "View and provide technical comments",
        dashboardPath: "/dev-architect/dashboard",
        permissions: {
            viewReviews: true,
            commentOnReviews: true,
            manageReviews: false,
            manageProjects: false,
            manageUsers: false,
            manageForms: false,
            viewReports: true,
            exportReports: false,
        },
        badgeColor: {
            light: "bg-teal-100 text-teal-800 border border-teal-200",
            dark: "bg-teal-600 text-white"
        }
    },
    CONTACT_PERSON: {
        label: "Contact Person",
        description: "View access to assigned projects",
        dashboardPath: "/contact-person/dashboard",
        permissions: {
            viewReviews: true,
            commentOnReviews: false,
            manageReviews: false,
            manageProjects: false,
            manageUsers: false,
            manageForms: false,
            viewReports: false,
            exportReports: false,
        },
        badgeColor: {
            light: "bg-pink-100 text-pink-800 border border-pink-200",
            dark: "bg-pink-600 text-white"
        }
    },
    DIRECTOR: {
        label: "Director",
        description: "Executive oversight and strategic comments",
        dashboardPath: "/director/dashboard",
        permissions: {
            viewReviews: true,
            commentOnReviews: true,
            manageReviews: false,
            manageProjects: false,
            manageUsers: false,
            manageForms: false,
            viewReports: true,
            exportReports: true,
        },
        badgeColor: {
            light: "bg-rose-100 text-rose-800 border border-rose-200",
            dark: "bg-rose-600 text-white"
        }
    },
    GUEST: {
        label: "Guest",
        description: "Read-only access to basic information",
        dashboardPath: "/guest", 

        permissions: {
            viewReviews: true,
            commentOnReviews: false,
            manageReviews: false,
            manageProjects: false,
            manageUsers: false,
            manageForms: false,
            viewReports: false,
            exportReports: false,
        },
        badgeColor: {
            light: "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
            dark: "bg-gray-600 text-white"
        }
    },
}

// Permission helper functions
export function hasPermission(
    roles: Role[],
    permission: keyof typeof ROLE_CONFIG[Role]["permissions"]
): boolean {
    return roles.some(role => ROLE_CONFIG[role]?.permissions[permission]);
}

export function canViewReviews(roles: Role[]): boolean {
    return hasPermission(roles, "viewReviews");
}

export function canCommentOnReviews(roles: Role[]): boolean {
    return hasPermission(roles, "commentOnReviews");
}

export function canManageReviews(roles: Role[]): boolean {
    return hasPermission(roles, "manageReviews");
}

export function canManageProjects(roles: Role[]): boolean {
    return hasPermission(roles, "manageProjects");
}

export function canManageUsers(roles: Role[]): boolean {
    return hasPermission(roles, "manageUsers");
}

export function canManageForms(roles: Role[]): boolean {
    return hasPermission(roles, "manageForms");
}

export function canViewReports(roles: Role[]): boolean {
    return hasPermission(roles, "viewReports");
}

export function canExportReports(roles: Role[]): boolean {
    return hasPermission(roles, "exportReports");
}

export function getPrimaryRole(roles: Role[]): Role {
    // Priority order for determining primary role
    const priority: Role[] = [
        "ADMIN",
        "QA_HEAD",
        "QA_MANAGER",
        "QA_ARCHITECT",
        "DIRECTOR",
        "REVIEW_LEAD",
        "PM",
        "DEV_ARCHITECT",
        "CONTACT_PERSON",
        "REVIEWER",
        "GUEST"
    ];

    for (const role of priority) {
        if (roles.includes(role)) {
            return role;
        }
    }

    return roles[0] || "GUEST";
}

export function getDashboardPath(roles: Role[]): string {
    const primaryRole = getPrimaryRole(roles);
    return ROLE_CONFIG[primaryRole].dashboardPath;
}

export function getRoleBadgeColor(role: Role): string {
    return ROLE_CONFIG[role].badgeColor.light;
}

export function getRoleLabel(role: Role): string {
    return ROLE_CONFIG[role].label;
}

export function getRoleDescription(role: Role): string {
    return ROLE_CONFIG[role].description;
}

// Get all available roles for selection
export function getAllRoles(): Role[] {
    return Object.keys(ROLE_CONFIG) as Role[];
}

// Check if user has any of the specified roles
export function hasAnyRole(userRoles: Role[], requiredRoles: Role[]): boolean {
    return userRoles.some(role => requiredRoles.includes(role));
}

// Check if user has all of the specified roles
export function hasAllRoles(userRoles: Role[], requiredRoles: Role[]): boolean {
    return requiredRoles.every(role => userRoles.includes(role));
}

