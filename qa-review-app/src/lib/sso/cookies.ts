import { cookies } from "next/headers";

const STATE_COOKIE = "sso_state";
const NONCE_COOKIE = "sso_nonce";
const PKCE_COOKIE = "sso_pkce";
const COOKIE_TTL_SECONDS = 600; // 10 minutes

interface SsoCookies {
    state: string;
    nonce: string;
    codeVerifier: string;
}

export async function setSsoCookies({ state, nonce, codeVerifier }: SsoCookies): Promise<void> {
    const jar = await cookies();
    const opts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: COOKIE_TTL_SECONDS,
    };
    jar.set(STATE_COOKIE, state, opts);
    jar.set(NONCE_COOKIE, nonce, opts);
    jar.set(PKCE_COOKIE, codeVerifier, opts);
}

export async function readSsoCookies(): Promise<Partial<SsoCookies>> {
    const jar = await cookies();
    return {
        state: jar.get(STATE_COOKIE)?.value,
        nonce: jar.get(NONCE_COOKIE)?.value,
        codeVerifier: jar.get(PKCE_COOKIE)?.value,
    };
}

export async function clearSsoCookies(): Promise<void> {
    const jar = await cookies();
    const expired = { expires: new Date(0), path: "/" };
    jar.set(STATE_COOKIE, "", expired);
    jar.set(NONCE_COOKIE, "", expired);
    jar.set(PKCE_COOKIE, "", expired);
}
