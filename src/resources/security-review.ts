export const securityReviewConventions = `# Security Review Checklist

A consolidated security checklist for the ardeej / ardeeportal / ardeemcp suite.
Apply this checklist before merging any change that touches:

- Authentication (sign-in, session cookie, middleware guards)
- Authorization (admin gates, Firestore security rules, role checks)
- API routes / route handlers (\`src/app/api/**\`)
- Cloud Functions (\`functions/src/**\`)
- Environment variables / secrets / config
- Firestore Storage rules
- Public endpoints (no auth required)
- Anything sent over the wire to or from a third party

The checklist is grouped by surface. Run only the sections relevant to the change scope.

---

## Output format

When applying this checklist, produce a markdown report with:

1. **Scope** — files / surfaces reviewed
2. **Findings** — one row per failed item with severity:
   - 🔴 **Critical** — credential leak, auth bypass, RCE, public write
   - 🟠 **High** — privilege escalation, data exposure, missing rate limit
   - 🟡 **Medium** — defense-in-depth gap, hardening miss, config drift
3. **Recommendations** — concrete fix per finding with file path + line number
4. **Pass list** — items checked and confirmed safe

Do not fix issues unless the user explicitly asks. The default is report-only.

---

## 1. Auth (session cookie + middleware)

- [ ] Session cookie name is the canonical one for the project (e.g. \`ardeej_session\`); no other cookie names accepted
- [ ] Cookie attributes: \`HttpOnly\`, \`Secure\`, \`SameSite=Lax\` or \`Strict\`, explicit \`Path\` and \`Max-Age\`
- [ ] Session creation only on the server (route handler), never via client-side fetch with a bearer token
- [ ] All protected routes are guarded — verify via \`src/middleware.ts\` matcher includes them
- [ ] Admin routes use the canonical helper (e.g. \`requireAdminUser()\` in ardeeportal); no local \`verifyAdmin()\` duplicates
- [ ] Firebase Admin SDK (\`admin.initializeApp\`, \`adminDb\`, \`adminAuth\`) is **never** imported in Client Components or browser-shipped code
- [ ] Redirect targets after sign-in are validated as same-origin; \`?redirect=\` URL params can't be used for open-redirect
- [ ] No auth tokens in URLs, logs, error messages, or analytics events
- [ ] Sign-out clears the session cookie server-side, not just client-side state

## 2. Firestore security rules

- [ ] Every collection has explicit \`allow read\` and \`allow write\` rules — no \`allow read, write: if true\`
- [ ] Wildcard matches (\`/{document=**}\`) are bounded by an auth condition
- [ ] Owner-scoped collections check \`request.auth.uid == resource.data.ownerUid\` (or doc ID match)
- [ ] Field-shape validation on writes: \`request.resource.data.keys().hasOnly([...])\` and \`hasAll([...required])\`
- [ ] Server-only fields (counters, timestamps set by triggers) are blocked from client writes
- [ ] No client-supplied \`uid\` is trusted — always read from \`request.auth.uid\`
- [ ] Test rules with the emulator suite if non-trivial change (\`firebase emulators:exec --only firestore "npm test"\`)
- [ ] Storage rules audited with the same severity as Firestore rules
- [ ] Reference: https://firebase.google.com/support/guides/security-checklist

## 3. API routes (Next.js App Router)

- [ ] Every handler validates input with **Zod** at the boundary; no \`as any\` after parse
- [ ] Auth check happens **before** any Firestore read or write
- [ ] User-supplied values never used as Firestore document paths without sanitization (no \`adminDb.collection(req.body.path)\`)
- [ ] Errors returned to client are generic — never leak stack traces, internal field names, or DB error codes
- [ ] HTTP status codes match the failure: 400 bad input, 401 unauth, 403 forbidden, 404 not found, 429 rate limit, 500 server error
- [ ] Public endpoints (no auth) have rate limiting or are explicitly safe (read-only, idempotent, no sensitive data)
- [ ] All responses use \`NextResponse.json()\` with explicit status (don't rely on default 200)
- [ ] Long-running handlers protected by request timeout

## 4. Cloud Functions (2nd gen)

- [ ] Callable functions set \`enforceAppCheck: true\` (or have a documented exemption)
- [ ] \`request.auth\` is checked first thing in callable handlers; throw \`HttpsError('unauthenticated')\` otherwise
- [ ] Trigger functions (Firestore / Storage) are idempotent — safe to retry; use \`event.id\` for dedup if needed
- [ ] No PII (email, phone, full name, payment data) in \`logger.info\` / \`logger.warn\`; use \`logger.debug\` only locally
- [ ] \`region\` is set explicitly on every function (don't rely on default us-central1 if your project is elsewhere)
- [ ] Memory and timeout configured per workload — don't leave at defaults for heavy work
- [ ] Secret access via \`defineSecret()\` + \`runWith({ secrets: [...] })\`, not \`process.env\` directly for sensitive values
- [ ] No third-party HTTP calls without timeout + error handling

## 5. Environment / secrets

- [ ] No secrets hard-coded in source — all in \`.env.local\`, \`.env.staging\`, etc.
- [ ] \`.env*\` files in \`.gitignore\`; verify with \`git check-ignore .env.local\`
- [ ] No \`NEXT_PUBLIC_\` prefix on Firebase Admin private key, service account JSON, or any server-only secret
- [ ] Required env vars validated at startup — fail fast with a clear error if missing
- [ ] Secrets rotation path documented (see \`docs/notes/secret-inventory.md\` in ardeeportal)
- [ ] Production secrets stored in Google Secret Manager / Firebase config, not \`.env\` on the deploy target
- [ ] Verify no secrets shipped in the client bundle: \`npx next-bundle-analyzer\` or grep \`.next/static\` for known prefixes

## 6. HTTP security headers (Next.js)

- [ ] \`next.config.ts\` defines \`headers()\` with the OWASP baseline:
  - \`Content-Security-Policy\` (start with report-only, then enforce)
  - \`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload\`
  - \`X-Frame-Options: DENY\` (or \`frame-ancestors\` in CSP)
  - \`Referrer-Policy: strict-origin-when-cross-origin\`
  - \`Permissions-Policy: camera=(), microphone=(), geolocation=()\` (per app needs)
  - \`X-Content-Type-Options: nosniff\`
- [ ] CSP allows only the origins actually needed (Firebase, Stripe, etc.); no \`unsafe-inline\` for scripts in production
- [ ] CORS on API routes is set deliberately (not \`*\` for credentialed routes)

## 7. Client-side data exposure

- [ ] Server Components fetch sensitive data and pass only the needed fields to Client Components
- [ ] Firestore client SDK reads are limited to what the security rules already allow publicly
- [ ] No admin tokens, service-account JSON, or session secrets exposed via \`window.__NEXT_DATA__\`
- [ ] React Server Component output doesn't include unredacted PII for non-owners

## 8. Cloud Storage rules

- [ ] Every bucket path has explicit allow rules
- [ ] Upload size limits enforced (\`request.resource.size < N * 1024 * 1024\`)
- [ ] Content type validation (\`request.resource.contentType.matches('image/.*')\`)
- [ ] Owner-only access: \`request.auth.uid == userId\` for \`/users/{userId}/...\` paths
- [ ] Public-read paths are documented and intentional

## 9. OWASP Top 10 — quick map to this stack

| OWASP | Where it shows up here |
|---|---|
| A01 Broken Access Control | Firestore rules, admin gate, middleware matcher, doc-owner checks |
| A02 Cryptographic Failures | HTTPS-only (Firebase Hosting / App Hosting handles); session cookie attrs |
| A03 Injection | User input in Firestore paths/queries; unsanitized HTML in blog posts |
| A04 Insecure Design | Trusting client-side checks; no rate limit on public POST endpoints |
| A05 Security Misconfiguration | Missing security headers; debug logs in production; default rules |
| A06 Vulnerable Components | \`npm audit\`, Dependabot, \`flutter pub outdated\`, pinned action SHAs in CI |
| A07 Identification & Auth Failures | Session cookie weaknesses, no rate limit on sign-in, password reset flow |
| A08 Software & Data Integrity | Unsigned commits, unpinned dependencies, missing CSP for inline scripts |
| A09 Logging & Monitoring Failures | No audit log for admin actions; PII in logs; errors silently swallowed |
| A10 SSRF | Server-side fetch with user-supplied URLs (image proxies, link previews) |

## 10. CI / supply chain

- [ ] CI uses pinned action SHAs (\`uses: actions/checkout@<sha>\`), not version tags
- [ ] Dependency updates reviewed (Dependabot, Renovate); no auto-merge for prod deps
- [ ] No secrets in workflow logs (\`echo $TOKEN\` etc.)
- [ ] \`npm audit --production\` passes (or known issues triaged)
- [ ] Branch protection on \`main\`: required reviews, required status checks, no force-push

---

## How to invoke

Use the \`security-review\` MCP prompt with the scope you want reviewed
(e.g. \`auth + middleware\`, \`firestore rules\`, \`functions/src/loyalty/\`,
\`all changed files in this PR\`). The prompt will instruct the agent to load
this resource and apply the relevant sections.
`;
