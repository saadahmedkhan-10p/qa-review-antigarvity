import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

export interface EntraClaims extends JWTPayload {
    oid?: string;
    sub: string;
    email?: string;
    preferred_username?: string;
    name?: string;
    nonce?: string;
}

export interface MicrosoftSsoConfig {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export function getConfig(): MicrosoftSsoConfig | null {
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
    const redirectUri = process.env.AZURE_AD_REDIRECT_URI;

    if (!tenantId || !clientId || !clientSecret || !redirectUri) return null;
    return { tenantId, clientId, clientSecret, redirectUri };
}

export function isConfigured(): boolean {
    return getConfig() !== null;
}

function base64UrlEncode(buf: Buffer): string {
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateRandomString(bytes = 32): string {
    return base64UrlEncode(crypto.randomBytes(bytes));
}

export function generatePkce(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = generateRandomString(48);
    const codeChallenge = base64UrlEncode(crypto.createHash("sha256").update(codeVerifier).digest());
    return { codeVerifier, codeChallenge };
}

export function getAuthorizeUrl(params: {
    state: string;
    nonce: string;
    codeChallenge: string;
}): string {
    const cfg = getConfig();
    if (!cfg) throw new Error("Microsoft SSO not configured");

    const url = new URL(`https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/authorize`);
    url.searchParams.set("client_id", cfg.clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", cfg.redirectUri);
    url.searchParams.set("response_mode", "query");
    url.searchParams.set("scope", "openid profile email");
    url.searchParams.set("state", params.state);
    url.searchParams.set("nonce", params.nonce);
    url.searchParams.set("code_challenge", params.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("prompt", "select_account");
    return url.toString();
}

export async function exchangeCodeForTokens(params: {
    code: string;
    codeVerifier: string;
}): Promise<{ id_token: string; access_token: string }> {
    const cfg = getConfig();
    if (!cfg) throw new Error("Microsoft SSO not configured");

    const body = new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        grant_type: "authorization_code",
        code: params.code,
        redirect_uri: cfg.redirectUri,
        code_verifier: params.codeVerifier,
    });

    const res = await fetch(`https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Token exchange failed (${res.status}): ${text}`);
    }

    const json = await res.json();
    if (!json.id_token) throw new Error("Token response missing id_token");
    return { id_token: json.id_token, access_token: json.access_token };
}

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksCacheTenant: string | null = null;

function getJwks(tenantId: string) {
    if (!jwksCache || jwksCacheTenant !== tenantId) {
        jwksCache = createRemoteJWKSet(
            new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`),
        );
        jwksCacheTenant = tenantId;
    }
    return jwksCache;
}

export async function verifyIdToken(idToken: string, expectedNonce: string): Promise<EntraClaims> {
    const cfg = getConfig();
    if (!cfg) throw new Error("Microsoft SSO not configured");

    const jwks = getJwks(cfg.tenantId);
    const { payload } = await jwtVerify(idToken, jwks, {
        audience: cfg.clientId,
        issuer: [
            `https://login.microsoftonline.com/${cfg.tenantId}/v2.0`,
            `https://sts.windows.net/${cfg.tenantId}/`,
        ],
    });

    const claims = payload as EntraClaims;
    if (!claims.nonce || claims.nonce !== expectedNonce) {
        throw new Error("Nonce mismatch");
    }
    return claims;
}
