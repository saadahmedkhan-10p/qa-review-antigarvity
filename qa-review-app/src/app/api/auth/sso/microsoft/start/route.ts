import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import {
    isConfigured,
    generatePkce,
    generateRandomString,
    getAuthorizeUrl,
} from "@/lib/sso/microsoft";
import { setSsoCookies } from "@/lib/sso/cookies";

export async function GET() {
    if (!isConfigured()) {
        return new NextResponse("Microsoft SSO is not configured on this server.", { status: 404 });
    }

    const state = generateRandomString(32);
    const nonce = generateRandomString(32);
    const { codeVerifier, codeChallenge } = generatePkce();

    await setSsoCookies({ state, nonce, codeVerifier });

    const authorizeUrl = getAuthorizeUrl({ state, nonce, codeChallenge });
    return NextResponse.redirect(authorizeUrl);
}
