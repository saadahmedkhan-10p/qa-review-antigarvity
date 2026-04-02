import { Role, getDashboardPath } from "@/types/roles";

describe("Dashboard Path Verification", () => {
    const roleDashboardMap: Record<Role, string> = {
        "ADMIN": "/admin/reports",
        "QA_HEAD": "/admin/reports",
        "QA_MANAGER": "/qa-manager/dashboard",
        "QA_ARCHITECT": "/qa-architect/dashboard",
        "REVIEW_LEAD": "/lead/dashboard",
        "REVIEWER": "/reviewer/dashboard",
        "PM": "/pm/dashboard",
        "DEV_ARCHITECT": "/dev-architect/dashboard",
        "CONTACT_PERSON": "/contact-person/dashboard",
        "DIRECTOR": "/director/dashboard"
    };

    Object.entries(roleDashboardMap).forEach(([role, expectedPath]) => {
        it(`should return ${expectedPath} for ${role}`, () => {
            expect(getDashboardPath([role as Role])).toBe(expectedPath);
        });
    });
});
