import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types/roles";

const secretKey = process.env.JWT_SECRET || "your-secret-key"; 
const key = new TextEncoder().encode(secretKey);

export interface SessionUser {
    id: string;
    name: string;
    email: string;
    roles: Role[];
}

export interface SessionPayload {
    user: SessionUser;
    expires: Date;
}

/**
 * Helper to safely parse roles from the session payload
 */
export function parseRoles(roles: any): Role[] {
    if (Array.isArray(roles)) return roles as Role[];
    if (typeof roles === 'string') {
        try {
            const parsed = JSON.parse(roles);
            return Array.isArray(parsed) ? (parsed as Role[]) : [roles as Role];
        } catch {
            return [roles as Role];
        }
    }
    return ["REVIEWER"]; // Default fallback
}

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h") 
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload;
}

/**
 * Standardized login function
 */
export async function login(userData: Omit<SessionUser, 'roles'> & { roles: string | Role[] }) {
    const roles = parseRoles(userData.roles);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); 
    
    const session = await encrypt({ 
        user: { ...userData, roles }, 
        expires 
    });

    (await cookies()).set("session", session, { 
        expires, 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    });
}

export async function logout() {
    (await cookies()).set("session", "", { expires: new Date(0) });
}

/**
 * Get the raw session payload
 */
export async function getSession(): Promise<SessionPayload | null> {
    const session = (await cookies()).get("session")?.value;
    if (!session) return null;
    try {
        const payload = await decrypt(session);
        return {
            ...payload,
            expires: new Date(payload.expires)
        } as SessionPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Architect-optimized utility to get the current user with typed roles
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
    const session = await getSession();
    if (!session || !session.user) return null;
    
    // Ensure roles are parsed correctly
    return {
        ...session.user,
        roles: parseRoles(session.user.roles)
    };
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return;

    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
        name: "session",
        value: await encrypt(parsed),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: parsed.expires,
    });
    return res;
}
