import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { login, parseRoles } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { getDashboardPath } from "@/types/roles";
import {
    isConfigured,
    exchangeCodeForTokens,
    verifyIdToken,
} from "@/lib/sso/microsoft";
import { readSsoCookies, clearSsoCookies } from "@/lib/sso/cookies";

const PROVIDER = "microsoft";

function redirectWithError(req: NextRequest, code: string): NextResponse {
    const url = new URL("/", req.url);
    url.searchParams.set("error", code);
    return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
    if (!isConfigured()) {
        return new NextResponse("Microsoft SSO is not configured on this server.", { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const idpError = searchParams.get("error");

    const cookies = await readSsoCookies();
    await clearSsoCookies();

    if (idpError) {
        console.error("Entra returned error:", idpError, searchParams.get("error_description"));
        return redirectWithError(req, "sso_idp_error");
    }

    if (!code || !state) return redirectWithError(req, "sso_missing_params");
    if (!cookies.state || !cookies.nonce || !cookies.codeVerifier) {
        return redirectWithError(req, "sso_session_expired");
    }
    if (state !== cookies.state) return redirectWithError(req, "sso_state_mismatch");

    let claims;
    try {
        const tokens = await exchangeCodeForTokens({ code, codeVerifier: cookies.codeVerifier });
        claims = await verifyIdToken(tokens.id_token, cookies.nonce);
    } catch (err) {
        console.error("SSO token verify failed:", err);
        return redirectWithError(req, "sso_token_invalid");
    }

    const subject = (claims.oid || claims.sub) as string;
    const emailRaw = (claims.email || claims.preferred_username || "").toString();
    const email = emailRaw.toLowerCase().trim();

    if (!subject || !email) return redirectWithError(req, "sso_token_invalid");

    let user = await prisma.user.findFirst({
        where: { ssoProvider: PROVIDER, ssoSubject: subject },
    });

    if (!user) {
        user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            const name = (claims.name || email.split("@")[0]).toString();
            // Provide a random password since this is an SSO user and the schema requires it
            const dummyPassword = Math.random().toString(36).slice(-10);
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    password: dummyPassword,
                    ssoProvider: PROVIDER,
                    ssoSubject: subject,
                    roles: JSON.stringify(["REVIEWER"]),
                },
            });
        } else if (!user.ssoSubject) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { ssoProvider: PROVIDER, ssoSubject: subject },
            });
        }
    }

    const roles = parseRoles(user.roles);

    await login({
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
    });

    await logActivity({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: "LOGIN_SSO",
        details: { provider: PROVIDER },
    });

    const dashboardPath = getDashboardPath(roles);
    return NextResponse.redirect(new URL(dashboardPath, req.url));
}
