import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerSharedPrompts(server: McpServer): void {

  server.registerPrompt(
    'fix-stub',
    {
      description: 'Replace a Mock service stub with a Real implementation following the Mock/Real stub pattern. Works for both Flutter (Riverpod) and Portal (Next.js + adminDb).',
      argsSchema: {
        serviceName: z.string().describe('Service name in PascalCase, e.g. "SongService", "PartySessionService"'),
        methods: z.string().describe('Comma-separated methods to wire, e.g. "getAll, getById, create, stream"'),
        collection: z.string().describe('Firestore collection path, e.g. "songs", "partySessions/{sessionId}/requests"'),
        platform: z.enum(['flutter', 'portal']).describe('Target platform'),
      },
    },
    ({ serviceName, methods, collection, platform }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Read \`conventions://stub-pattern\` first. It defines the anatomy, lifecycle, rules, and anti-patterns for the Mock/Real swap.

Then read the project schema for the target collection:
- Portal: \`docs/firestore/schema.md\`
- Flutter: schema lives in the portal repo — see \`../ardeeportal/docs/firestore/schema.md\`

## Task

Wire the **Real${serviceName}** implementation for collection \`${collection}\`, replacing the active **Mock${serviceName}**.

- Platform: **${platform}**
- Methods to implement: ${methods}

## Steps

${platform === 'flutter' ? `1. Open \`lib/services/<name>_service.dart\`. Confirm the abstract \`${serviceName}\` interface and \`Mock${serviceName}\` exist. If \`Real${serviceName}\` is stubbed/commented, uncomment and complete it. Otherwise add it.
2. Implement each method using \`FirebaseFirestore.instance.collection('${collection}')\`. Use \`fromFirestore\` constructors for the model. Wrap in try/catch for \`FirebaseException\` and log via the project logger before rethrowing.
3. Open the corresponding provider in \`lib/providers/\` (look for the \`@riverpod\` provider that returns \`${serviceName}\`). Comment out the \`Mock${serviceName}()\` line and uncomment / add \`Real${serviceName}()\`. Exactly one line must be active.
4. Run code generation:
   \`\`\`bash
   flutter pub run build_runner build --delete-conflicting-outputs
   \`\`\`
5. Test against staging: \`flutter run --dart-define=ENV=staging\` (or the project's staging flavor).
6. Run \`flutter analyze\` — must be clean before review.` : `1. Open or create \`src/lib/firestore/${collection.replace(/[\/{}]/g, '_')}.ts\`. Confirm the \`${serviceName}\` interface and \`Mock${serviceName}\` exist; add \`Real${serviceName}\` if missing.
2. Implement each method using \`adminDb.collection('${collection}')\`. Map \`doc.data()\` plus \`doc.id\` to the typed model from \`shared/models/ardeej/\`.
3. Open the swap-point file (e.g. \`src/lib/firestore/${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}.ts\`). Comment out the \`MockX\` import + export, uncomment / add \`RealX\`. Exactly one line must be active.
4. Verify the API routes / Server Components that consume \`${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}\` still type-check.
5. Test: \`npm run dev:staging\` (or the project's staging script).
6. Run \`npm run lint && npm run build\` — must be clean before review.`}

## After wiring

- Mark the stub as resolved in \`docs/notes/feature-status.md\` (in ardeeportal).
- Verify in the Firestore console that reads/writes hit the real docs.
- Do **not** delete \`Mock${serviceName}\` — keep it commented out for offline dev and tests.

## Rules (from \`conventions://stub-pattern\`)

- Same interface shape on both implementations
- Single uncommented swap line (grep-friendly)
- No cross-talk between Mock and Real
- Backend SDK imports only inside \`Real${serviceName}\``,
        },
      }],
    })
  );

  server.registerPrompt(
    'security-review',
    {
      description: 'Apply the security review checklist (auth, Firestore rules, API routes, Cloud Functions, env, headers, OWASP Top 10) to a scope. Produces a severity-ranked report — no code changes by default.',
      argsSchema: {
        scope: z.string().describe('Area to review (e.g. "auth + middleware", "firestore.rules", "src/app/api/admin/", "all changed files in this PR")'),
      },
    },
    ({ scope }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Read \`conventions://security-review\` first. It contains the full checklist grouped by surface (auth, Firestore rules, API routes, Cloud Functions, env, headers, client exposure, Storage rules, OWASP Top 10, CI).

## Task

Apply the checklist to: **${scope}**

## Procedure

1. Identify which checklist sections apply to this scope. Skip sections that don't.
2. For every applicable item, determine **PASS / FAIL / N/A** by reading the relevant files in the workspace.
3. Produce a markdown report in the format defined under "Output format" in the resource:
   - **Scope** — files / surfaces reviewed
   - **Findings** — one row per FAIL with severity 🔴 Critical / 🟠 High / 🟡 Medium, file path, line number, brief description
   - **Recommendations** — concrete fix per finding
   - **Pass list** — items checked and confirmed safe
4. **Do not modify code.** Report only. Wait for the user to approve fixes before making changes.

## Severity guide (from the resource)

- 🔴 Critical — credential leak, auth bypass, RCE, public write
- 🟠 High — privilege escalation, data exposure, missing rate limit
- 🟡 Medium — defense-in-depth gap, hardening miss, config drift`,
        },
      }],
    })
  );
}
