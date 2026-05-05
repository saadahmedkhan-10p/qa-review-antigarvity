import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession, decrypt, parseRoles } from "@/lib/auth";
import { Role, getDashboardPath } from "@/types/roles";

export async function proxy(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const path = request.nextUrl.pathname;
    const isApiRoute = path.startsWith("/api");

    // Public paths
    const publicPaths = ["/", "/set-password", "/forgot-password", "/documentation", "/api/auth/sso"];
    const isPublicPath = publicPaths.some(publicPath => 
        path === publicPath || path.startsWith(`${publicPath}/`)
    );

    if (isPublicPath) {
        if (session && path === "/") {
            try {
                const payload = await decrypt(session);
                const roles = parseRoles(payload.user?.roles);
                const dashboardPath = getDashboardPath(roles);
                return NextResponse.redirect(new URL(dashboardPath, request.url));
            } catch (e) {
                const response = NextResponse.next();
                response.cookies.delete("session");
                return response;
            }
        }
        return NextResponse.next();
    }

    // Protected paths check
    if (!session) {
        if (isApiRoute) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Verify RBAC
    try {
        const payload = await decrypt(session);
        const user = payload?.user;
        const roles = parseRoles(user?.roles);

        // Declarative Role-based access control mapping
        const rolePathMap: Record<string, Role[]> = {
            '/admin/reports': ['ADMIN', 'QA_HEAD', 'QA_MANAGER', 'QA_ARCHITECT', 'PM', 'DEV_ARCHITECT', 'REVIEW_LEAD', 'DIRECTOR'],
            '/admin/projects': ['ADMIN', 'QA_HEAD', 'QA_MANAGER', 'QA_ARCHITECT', 'DIRECTOR'],
            '/admin': ['ADMIN', 'QA_HEAD', 'QA_MANAGER', 'QA_ARCHITECT'],
            '/qa-manager': ['QA_MANAGER', 'ADMIN'],
            '/qa-architect': ['QA_ARCHITECT', 'ADMIN'],
            '/lead': ['REVIEW_LEAD', 'ADMIN'],
            '/reviewer': ['REVIEWER', 'REVIEW_LEAD', 'ADMIN'],
            '/pm': ['PM', 'ADMIN'],
            '/dev-architect': ['DEV_ARCHITECT', 'ADMIN'],
            '/director': ['DIRECTOR', 'ADMIN'],
            // API Route protection
            '/api/admin': ['ADMIN', 'QA_HEAD', 'QA_MANAGER', 'QA_ARCHITECT'],
            '/api/users': ['ADMIN'],
        };

        // Check if user has access to the requested path
        for (const [pathPrefix, allowedRoles] of Object.entries(rolePathMap)) {
            if (path.startsWith(pathPrefix)) {
                const hasAccess = roles.some(role => allowedRoles.includes(role));
                if (!hasAccess) {
                    if (isApiRoute) {
                        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                    }
                    const dashboardPath = getDashboardPath(roles);
                    return NextResponse.redirect(new URL(dashboardPath, request.url));
                }
                break;
            }
        }

        // Refresh session expiry
        return await updateSession(request);
    } catch (e) {
        if (isApiRoute) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }
        const response = NextResponse.redirect(new URL("/", request.url));
        response.cookies.delete("session");
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Public static assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
