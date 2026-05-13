export const firebaseAuthConventions = `# Firebase Auth — Session Cookie Pattern

## Overview

Use the **session cookie pattern** for server-rendered apps. The browser never
stores a raw Firebase ID token — instead, the server exchanges it for an
HttpOnly cookie that the browser sends automatically on every request.

## Flow

1. User signs in with Firebase Auth client SDK (email/password or Google OAuth).
2. Client calls your session API endpoint (\`POST /api/auth/session\`) with the
   Firebase ID token in the request body.
3. Server verifies the ID token using Firebase Admin SDK
   (\`adminAuth.verifyIdToken()\`), then creates a session cookie
   (\`adminAuth.createSessionCookie()\`) and sets it as an HttpOnly response
   cookie.
4. On sign-out, client calls \`DELETE /api/auth/session\`; server clears the
   cookie (\`res.clearCookie()\`).
5. Middleware reads the session cookie on every protected request, verifies it
   with \`adminAuth.verifySessionCookie()\`, and redirects unauthenticated users
   to the sign-in page.

## Cookie settings

- **HttpOnly** — not accessible to JavaScript
- **Secure** — only sent over HTTPS (disable in local dev if needed)
- **SameSite: lax** — CSRF protection for navigations
- **Max-Age / expiry** — set to match your session lifetime (e.g. 5 days)
- **Path: /** — applies to all routes

## Client vs Admin SDK boundary

| SDK | Where it runs | Purpose |
|-----|--------------|---------|
| Firebase Client SDK | Browser (\`"use client"\`) | Auth sign-in/sign-out, real-time subscriptions |
| Firebase Admin SDK | Server only (API routes, Server Components, middleware) | Verify tokens, create session cookies, privileged Firestore reads/writes |

**Never import the Admin SDK in client components.** The service account key
would be bundled into the browser.

## Environment variables

**Client bundle (safe to expose — prefix with \`NEXT_PUBLIC_\`):**
- Firebase API key
- Auth domain
- Project ID
- Storage bucket
- Messaging sender ID
- App ID

**Server only (never expose — no public prefix):**
- Admin project ID
- Admin client email
- Admin private key — store with literal \`\\n\` escape sequences; replace
  \`/\\\\n/g\` with \`"\\n"\` at runtime before passing to the SDK

## Middleware pattern

- Read the session cookie in \`middleware.ts\` (Edge Runtime — use the Admin SDK
  via a server action or API route if you need full verification; for
  lightweight checks, inspect the cookie's presence only).
- Redirect unauthenticated users: \`/sign-in?redirect=<pathname>\`
- Skip auth on public routes: marketing pages, sign-in/sign-up, public API
  endpoints, static assets.

## File layout convention

\`\`\`
src/lib/firebase/
  client.ts   — exports auth, db, storage (browser singletons, lazy-init)
  admin.ts    — exports adminAuth, adminDb (server-only, lazy-init)
  auth.ts     — thin helpers: signInWithEmail, signUpWithEmail,
                signInWithGoogle, signOut — each calls the session endpoint
src/app/api/auth/
  session/
    route.ts  — POST (create cookie) + DELETE (clear cookie)
src/middleware.ts — reads cookie, protects routes
\`\`\`

## Security rules

- Always call \`adminAuth.verifySessionCookie(cookie, true)\` (the second
  argument checks revocation).
- Revoke all sessions on password change or account deletion.
- Never return the raw session cookie value in API responses.
- Rate-limit the \`POST /api/auth/session\` endpoint.
`;
