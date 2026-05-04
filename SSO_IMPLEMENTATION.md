# SSO Implementation — Microsoft Entra ID (Azure AD)

## Overview

This document describes the Single Sign-On (SSO) feature added to the QA Review Hub application. It enables users to sign in using their corporate Microsoft 365 / Entra ID credentials in addition to the existing email-and-password login.

**Status:** Implemented in branch `ssoimplementation`. Awaiting an Entra app registration and production deployment.

## Goals & Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Provider** | Microsoft Entra ID (Azure AD) only | A disabled "Sign in with Microsoft" button already existed on the login page; users have corporate M365 accounts. |
| **Coexistence** | SSO + password both supported | Safe rollout; admin/seed users can still sign in by password during migration. |
| **Provisioning** | Pre-provisioned only (match by email) | Preserves the existing admin-creates-users model; prevents random tenant members from gaining access. |
| **Library** | Custom OIDC flow using `jose` + `fetch` | Smaller diff than migrating to Auth.js; preserves existing `getCurrentUser()`, session cookie, and `withErrorHandler()` patterns. |
| **Standard** | OIDC Authorization Code Flow with PKCE | Industry standard for browser-based SSO; uses `state`, `nonce`, and PKCE to prevent CSRF / replay / code interception. |

## Architecture

### Sign-in Flow

```
User clicks "Sign in with Microsoft"
            |
            v
GET /api/auth/sso/microsoft/start
  - Generate state, nonce, PKCE code_verifier
  - Set 3 short-lived httpOnly cookies (sso_state, sso_nonce, sso_pkce)
  - 302 redirect to Microsoft
            |
            v
login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
  - User authenticates with Microsoft
  - Microsoft redirects back with ?code=...&state=...
            |
            v
GET /api/auth/sso/microsoft/callback?code=...&state=...
  - Verify state matches cookie
  - Exchange code for tokens (with code_verifier for PKCE)
  - Verify id_token (issuer, audience, nonce, expiry) via JWKS
  - Look up User by ssoSubject -> fall back to email
  - If unknown user: redirect to /?error=not_provisioned
  - First-time SSO login: bind ssoProvider + ssoSubject on User row
  - Issue the existing session JWT cookie via login()
  - Log LOGIN_SSO activity
  - Clear SSO cookies
  - Redirect to role-specific dashboard
```

### Why this design

- The existing session cookie, [AuthContext](qa-review-app/src/context/AuthContext.tsx), and route protection in [src/proxy.ts](qa-review-app/src/proxy.ts) continue to work unchanged. SSO is purely an alternative way to *create* the same session.
- Subject (`oid` claim) pinning on first login means subsequent logins match by stable Entra subject, not just email. Defends against email changes in Entra.

## Files Created

| File | Purpose |
|---|---|
| [qa-review-app/src/lib/sso/microsoft.ts](qa-review-app/src/lib/sso/microsoft.ts) | OIDC plumbing: env config, PKCE/state generation, authorize URL builder, code-for-token exchange, ID-token JWKS verification (issuer/audience/nonce checked). |
| [qa-review-app/src/lib/sso/cookies.ts](qa-review-app/src/lib/sso/cookies.ts) | Helpers to set/read/clear the three short-lived httpOnly cookies (`sso_state`, `sso_nonce`, `sso_pkce`). 10-minute TTL. |
| [qa-review-app/src/app/api/auth/sso/microsoft/start/route.ts](qa-review-app/src/app/api/auth/sso/microsoft/start/route.ts) | Initiates the OIDC flow. Returns 404 if env vars unset. |
| [qa-review-app/src/app/api/auth/sso/microsoft/callback/route.ts](qa-review-app/src/app/api/auth/sso/microsoft/callback/route.ts) | Handles the redirect from Microsoft. Verifies tokens, looks up the user, issues the session, redirects to the dashboard. |

## Files Modified

| File | Change |
|---|---|
| [qa-review-app/prisma/schema.prisma](qa-review-app/prisma/schema.prisma) | Added `ssoProvider String?`, `ssoSubject String?`, and `@@unique([ssoProvider, ssoSubject])` to the `User` model. |
| [qa-review-app/src/proxy.ts](qa-review-app/src/proxy.ts) | Added `/api/auth/sso` to `publicPaths` so the SSO routes can run without an existing session. |
| [qa-review-app/src/app/page.tsx](qa-review-app/src/app/page.tsx) | Replaced the disabled mock Microsoft button with a real link to `/api/auth/sso/microsoft/start`. Gated by `NEXT_PUBLIC_SSO_MICROSOFT_ENABLED=true`. Added `useSearchParams` effect to toast SSO errors and strip them from the URL. |
| [qa-review-app/.env.local](qa-review-app/.env.local) | Added five new env vars: `NEXT_PUBLIC_SSO_MICROSOFT_ENABLED`, `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_REDIRECT_URI`. |

## Database Schema Change

```prisma
model User {
  // ...existing fields...
  ssoProvider  String?
  ssoSubject   String?

  @@unique([ssoProvider, ssoSubject])
}
```

**Local dev:** applied via `prisma db push` (since the migration history is locked to a SQLite lockfile from a prior issue, `migrate dev` would fail).

**Production:** apply manually:
```sql
ALTER TABLE "User"
  ADD COLUMN "ssoProvider" TEXT,
  ADD COLUMN "ssoSubject" TEXT;

CREATE UNIQUE INDEX "User_ssoProvider_ssoSubject_key"
  ON "User"("ssoProvider", "ssoSubject");
```

## Reused Existing Code

| Function | Used by SSO callback |
|---|---|
| [`login()`](qa-review-app/src/lib/auth.ts) | Issues the existing `session` JWT cookie. SSO callback uses it identically to password login. |
| [`parseRoles()`](qa-review-app/src/lib/auth.ts) | Handles the JSON-string-encoded `User.roles` column. |
| [`getCurrentUser()`](qa-review-app/src/lib/auth.ts) | Used by [AuthContext](qa-review-app/src/context/AuthContext.tsx) on the next render — no client changes needed. |
| [`getDashboardPath()`](qa-review-app/src/types/roles.ts) | Same redirect logic password login uses. |
| [`logActivity()`](qa-review-app/src/lib/activityLogger.ts) | Reused with `action: 'LOGIN_SSO'` for audit trail. |

## Configuration — Entra ID App Registration

### 1. Register the application

1. **[portal.azure.com](https://portal.azure.com)** -> **Microsoft Entra ID** -> **App registrations** -> **+ New registration**.
2. Settings:
   - **Name:** `QA Review Hub` (or any internal label)
   - **Supported account types:** *Accounts in this organizational directory only (Single tenant)*
   - **Redirect URI:** Web -> `http://localhost:3001/api/auth/sso/microsoft/callback`
3. Click **Register**.

### 2. Capture credentials

From the app's **Overview** page, copy:
- **Directory (tenant) ID** -> goes into `AZURE_AD_TENANT_ID`
- **Application (client) ID** -> goes into `AZURE_AD_CLIENT_ID`

### 3. Create a client secret

1. **Certificates & secrets** -> **+ New client secret** -> set description and expiry -> **Add**.
2. **Immediately** copy the secret's `Value` column (only shown once). This becomes `AZURE_AD_CLIENT_SECRET`.

### 4. (Optional) Configure optional ID-token claims

1. **Token configuration** -> **+ Add optional claim** -> **ID** -> check `email` and `preferred_username`.
2. The callback already falls back from `email` -> `preferred_username`, so this is a safety net for tenants that don't surface email by default.

### 5. Fill in `.env.local`

```env
NEXT_PUBLIC_SSO_MICROSOFT_ENABLED="true"
AZURE_AD_TENANT_ID="<Directory (tenant) ID>"
AZURE_AD_CLIENT_ID="<Application (client) ID>"
AZURE_AD_CLIENT_SECRET="<secret VALUE column>"
AZURE_AD_REDIRECT_URI="http://localhost:3001/api/auth/sso/microsoft/callback"
```

The `AZURE_AD_REDIRECT_URI` MUST match the URI registered in Entra exactly — port and all.

### 6. Restart the dev server

```bash
cd qa-review-app && npm run dev
```

Required because `NEXT_PUBLIC_*` variables are bundled at server startup.

### 7. Provision a test user

The user signing in via Microsoft must already exist in the `User` table with the **same email** as their Microsoft account.

Either via the admin UI (`/admin/users`) or directly:
```sql
INSERT INTO "User" (id, name, email, password, roles)
VALUES (
  'cuid_test_1',
  'Your Name',
  'your.name@yourcompany.com',
  '$2a$10$dummy.placeholder.hash',
  '["ADMIN"]'
);
```

The `password` column is required by the schema but unused for SSO sign-ins.

## Testing in Development

### Recommended path — Microsoft 365 Developer Program (free)

1. Sign up at **[developer.microsoft.com/microsoft-365/dev-program](https://developer.microsoft.com/microsoft-365/dev-program)** (free, 90-day renewable).
2. You get an admin account `admin@yourname.onmicrosoft.com` and ~25 sample users.
3. Use that tenant for the Entra app registration above.
4. Provision a `User` row with one of the sample users' emails (e.g. `MeganB@yourname.onmicrosoft.com`).
5. Sign in with that sample user's credentials.

### Alternative — corporate Entra tenant

Ask your IT team to register an internal app pointing at `http://localhost:3001/api/auth/sso/microsoft/callback`. Many tenants allow self-service registration.

### Edge cases to verify

| Test | How to trigger | Expected |
|---|---|---|
| Happy path | Provision user, click button, sign in | Redirect to role dashboard, `session` cookie set |
| Pre-provisioning rejection | Sign in as a tenant user *not* in `User` table | Redirect to `/?error=not_provisioned`, no session cookie |
| Subject pinning on first login | After happy path, query DB | `User.ssoProvider='microsoft'`, `User.ssoSubject=<oid>` populated |
| Subject pinning across email change | Change the user's email in DB, sign in again | Still works — matched by `ssoSubject` |
| Password login coexistence | Log out, log in with password | Works as before |
| State CSRF | Visit `/api/auth/sso/microsoft/callback?code=x&state=hacked` | Redirect to `/?error=sso_state_mismatch` |
| IdP cancel | Click "Cancel" on Microsoft's consent page | Redirect to `/?error=sso_idp_error` |

### Verifying the session cookie

In DevTools -> Application -> Cookies after a successful sign-in:
- `session` (httpOnly) — present
- `sso_state`, `sso_nonce`, `sso_pkce` — **cleared** (the callback explicitly removes them)

Decode the `session` cookie at jwt.io to confirm `user.id`, `email`, `roles`.

### Verifying the audit log

```sql
SELECT * FROM "ActivityLog"
WHERE action = 'LOGIN_SSO'
ORDER BY "createdAt" DESC
LIMIT 5;
```

Expected: a row per sign-in with `userId`, `userEmail`, and `details='{"provider":"microsoft"}'`.

## Security Considerations

| Concern | Mitigation |
|---|---|
| **CSRF on callback** | `state` cookie must match the `state` query param. |
| **Code interception** | PKCE (`code_challenge=S256`). The `code_verifier` is stored httpOnly server-side. |
| **ID-token replay** | `nonce` cookie validated against `id_token.nonce` claim. |
| **Tenant impersonation** | Single-tenant `TENANT_ID` (not `common`) hardcodes the issuer in the JWT verifier. |
| **Email enumeration via SSO** | `not_provisioned` redirect happens after token verification, so probing requires a real Microsoft account. |
| **JWKS rotation** | `createRemoteJWKSet` from `jose` caches keys with built-in rotation handling. |
| **Cookie hijacking** | `httpOnly`, `secure` (in production), `sameSite=lax`, 10-minute TTL on flow cookies. |
| **`JWT_SECRET` value** | Currently the dev placeholder `dev-only-change-me-please`. **MUST be rotated to a strong random value before SSO ships to production.** |

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| Microsoft page shows `redirect_uri` mismatch | `AZURE_AD_REDIRECT_URI` doesn't match the URI registered in Entra | Update one to match the other (including port) |
| Toast: "Your Microsoft account is not provisioned" | Email not in `User` table | Create the user via admin UI |
| Toast: "We couldn't verify your Microsoft sign-in" | Wrong tenant ID, wrong client secret, expired token, or network issue | Check the dev-server terminal for the underlying error message |
| Plain-text 404 "Microsoft SSO is not configured" | One or more `AZURE_AD_*` vars empty | Set all four vars and restart |
| `{"error":"Unauthorized"}` JSON | `/api/auth/sso/*` not whitelisted in `proxy.ts` | Already fixed — `proxy.ts` now whitelists this path prefix |

## Out of Scope (v1)

- **Microsoft single-logout / front-channel logout.** The current `/logout` action just clears the `session` cookie. The user remains signed into Microsoft, which is the desired behavior for an internal tool.
- **Group / role claim mapping.** Roles continue to live in `User.roles`. Admin manually grants roles via `/admin/users`.
- **UI to link/unlink an existing password account to an Entra identity.** Linking happens automatically on first SSO login by email match.
- **OIDC refresh tokens.** The 24-hour session JWT is sufficient; users re-click the SSO button to extend.

## Production Deployment Checklist

- [ ] **Entra app:** add a second redirect URI for the production domain (`https://<prod-domain>/api/auth/sso/microsoft/callback`)
- [ ] **Vercel env vars:** set `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_REDIRECT_URI` (with prod URI), `NEXT_PUBLIC_SSO_MICROSOFT_ENABLED=true`
- [ ] **Database migration:** run the `ALTER TABLE` SQL above against the production Postgres
- [ ] **Rotate `JWT_SECRET`** away from the dev placeholder
- [ ] **Provision users:** ensure all SSO users have matching `User.email` rows
- [ ] **Smoke test in staging** before flipping production
- [ ] **Communicate to users:** add a one-pager telling them they can now use the Microsoft button

## Verification Quick Reference

```bash
# Type-check the SSO files specifically
cd qa-review-app && npx tsc --noEmit

# Run the dev server
cd qa-review-app && npm run dev

# Inspect the route handlers
ls -la qa-review-app/src/app/api/auth/sso/microsoft/
ls -la qa-review-app/src/lib/sso/

# Inspect the schema change
grep -A 2 "ssoProvider" qa-review-app/prisma/schema.prisma
```

## Files at a Glance

```
qa-review-app/
├── prisma/
│   └── schema.prisma                            (modified)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── sso/
│   │   │           └── microsoft/
│   │   │               ├── start/route.ts       (new)
│   │   │               └── callback/route.ts    (new)
│   │   └── page.tsx                             (modified)
│   ├── lib/
│   │   └── sso/
│   │       ├── microsoft.ts                     (new)
│   │       └── cookies.ts                       (new)
│   └── proxy.ts                                 (modified)
└── .env.local                                   (modified)
```
