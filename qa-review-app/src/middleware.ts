import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession, decrypt } from "@/lib/auth";
import { Role, getDashboardPath, getPrimaryRole } from "@/types/roles";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session")?.value;

    // Public paths (including set-password, forgot-password, and documentation)
    if (request.nextUrl.pathname === "/" ||
        request.nextUrl.pathname.startsWith("/set-password") ||
        request.nextUrl.pathname.startsWith("/forgot-password") ||
        request.nextUrl.pathname.startsWith("/documentation")) {
        if (session && request.nextUrl.pathname === "/") {
            // If already logged in, redirect to appropriate dashboard
            try {
                const payload = await decrypt(session);
                if (payload && payload.user) {
                    let roles: Role[] = ["REVIEWER"];

                    if (typeof payload.user.roles === 'string' && payload.user.roles.trim().startsWith('[')) {
                        try {
                            roles = JSON.parse(payload.user.roles);
                        } catch (e) {
                            console.error("Failed to parse roles in middleware:", e);
                        }
                    } else if (Array.isArray(payload.user.roles)) {
                        roles = payload.user.roles;
                    } else if ((payload.user as any).role) {
                        roles = [(payload.user as any).role];
                    }

                    // Use getDashboardPath to redirect to the appropriate dashboard
                    const dashboardPath = getDashboardPath(roles);
                    return NextResponse.redirect(new URL(dashboardPath, request.url));
                }
            } catch (e) {
                // Invalid session - clear the cookie
                console.error("Invalid session cookie, clearing:", e);
                const response = NextResponse.next();
                response.cookies.delete("session");
                return response;
            }
        }
        return NextResponse.next();
    }

    // Protected paths
    if (!session) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Verify user has access to the requested path
    try {
        const payload = await decrypt(session);
        if (payload && payload.user) {
            let roles: Role[] = ["REVIEWER"];

            if (typeof payload.user.roles === 'string' && payload.user.roles.trim().startsWith('[')) {
                try {
                    roles = JSON.parse(payload.user.roles);
                } catch (e) {
                    console.error("Failed to parse roles:", e);
                }
            } else if (Array.isArray(payload.user.roles)) {
                roles = payload.user.roles;
            }

            const path = request.nextUrl.pathname;

            // Role-based access control
            const rolePathMap: Record<string, Role[]> = {
                '/admin/reports': ['ADMIN', 'QA_HEAD', 'QA_MANAGER', 'QA_ARCHITECT', 'PM', 'DEV_ARCHITECT', 'REVIEW_LEAD', 'DIRECTOR'], // Allow all roles with viewReports permission
                '/admin/projects': ['ADMIN', 'QA_HEAD', 'QA_MANAGER', 'QA_ARCHITECT', 'DIRECTOR'], // Allow management roles and Director to view projects
                '/admin': ['ADMIN', 'QA_HEAD', 'QA_MANAGER', 'QA_ARCHITECT'], // Allow management roles to access admin routes
                '/qa-manager': ['QA_MANAGER', 'ADMIN'],
                '/qa-architect': ['QA_ARCHITECT', 'ADMIN'],
                '/lead': ['REVIEW_LEAD', 'ADMIN'],
                '/reviewer': ['REVIEWER', 'REVIEW_LEAD', 'ADMIN'],
                '/pm': ['PM', 'ADMIN'],
                '/dev-architect': ['DEV_ARCHITECT', 'ADMIN'],
                '/director': ['DIRECTOR', 'ADMIN'],

            };

            // Check if user has access to the requested path
            for (const [pathPrefix, allowedRoles] of Object.entries(rolePathMap)) {
                if (path.startsWith(pathPrefix)) {
                    const hasAccess = roles.some(role => allowedRoles.includes(role));
                    if (!hasAccess) {
                        // Redirect to user's appropriate dashboard
                        const dashboardPath = getDashboardPath(roles);
                        return NextResponse.redirect(new URL(dashboardPath, request.url));
                    }
                    break;
                }
            }
        }

        // Refresh session expiry
        return await updateSession(request);
    } catch (e) {
        // Invalid session - clear cookie and redirect to login
        console.error("Invalid session in updateSession, redirecting to login:", e);
        const response = NextResponse.redirect(new URL("/", request.url));
        response.cookies.delete("session");
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
