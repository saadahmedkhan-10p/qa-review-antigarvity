import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser, SessionUser } from "@/lib/auth";

type ApiHandler = (req: Request, context: { params: Promise<Record<string, string>>; user: SessionUser }) => Promise<Response>;

/**
 * Architect-optimized wrapper for API routes
 * - Handles authentication automatically
 * - Catches all errors and returns standardized JSON
 * - Formats Zod validation errors nicely
 */
export function withErrorHandler(handler: ApiHandler, options?: { requiredRole?: string | string[] }) {
    return async (req: Request, context: { params: Promise<Record<string, string>> }) => {
        try {
            // 1. Authenticate user
            const user = await getCurrentUser();
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            // 2. Check roles if required
            if (options?.requiredRole) {
                const requiredRoles = Array.isArray(options.requiredRole) ? options.requiredRole : [options.requiredRole];
                const hasRole = user.roles.some(role => requiredRoles.includes(role));
                if (!hasRole) {
                    return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
                }
            }

            // 3. Execute handler
            return await handler(req, { ...context, user });

        } catch (error: unknown) {
            console.error(`[API Error] ${req.url}:`, error);

            // Handle Zod Validation Errors
            if (error instanceof ZodError) {
                const zodError = error as any;
                return NextResponse.json({
                    error: "Validation Failed",
                    details: zodError.errors.map((err: any) => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                }, { status: 400 });
            }

            // Handle Prisma Errors
            if (typeof error === 'object' && error !== null && 'code' in error && typeof (error as any).code === 'string' && (error as any).code.startsWith('P')) {
                return NextResponse.json({ 
                    error: "Database integrity error", 
                    code: (error as any).code 
                }, { status: 400 });
            }

            // L-03: Never expose raw error.message to client
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    };
}
