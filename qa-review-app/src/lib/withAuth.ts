"use server";

import { getCurrentUser, SessionUser } from "@/lib/auth";
import { Role } from "@/types/roles";

/**
 * C-04 / Defense-in-Depth: Centralized authorization wrapper for Server Actions.
 *
 * Usage:
 *   export const myAction = withAuth(["ADMIN", "QA_HEAD"], async (user, arg1, arg2) => { ... });
 */
export function withAuth<Args extends unknown[], R>(
    allowed: Role[],
    fn: (user: SessionUser, ...args: Args) => Promise<R>
): (...args: Args) => Promise<R> {
    return async (...args: Args): Promise<R> => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Unauthorized");
        if (!allowed.some((r) => user.roles.includes(r))) {
            throw new Error("Forbidden");
        }
        return fn(user, ...args);
    };
}

/**
 * Verify the caller is authenticated (any role) and return the session user.
 * Throws if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return user;
}

/**
 * Verify the caller has at least one of the given roles.
 * Throws if not authenticated or insufficiently privileged.
 */
export async function requireRole(...allowed: Role[]): Promise<SessionUser> {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    if (!allowed.some((r) => user.roles.includes(r))) {
        throw new Error("Forbidden");
    }
    return user;
}
