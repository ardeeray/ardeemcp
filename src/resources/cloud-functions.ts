export const cloudFunctionsConventions = `# Firebase Cloud Functions 2nd-Gen Conventions

## Version
- Always use 2nd-gen functions (firebase-functions v4+)
- Never use 1st-gen function signatures in new code

## Trigger types
- Callable: \`onCall(async (request) => { ... })\` — use for client-triggered operations
- Scheduled: \`onSchedule('every 24 hours', async () => { ... })\` — use for cron jobs
- Firestore triggers: \`onDocumentWritten / onDocumentCreated / onDocumentUpdated\` — use for reactive logic

## Auth & validation
- For callable functions, always check \`request.auth\` before any data access
- Throw \`new HttpsError('unauthenticated', ...)\` for missing auth
- Throw \`new HttpsError('invalid-argument', ...)\` for bad input
- Validate input with Zod before processing

## Environment variables
- Access via \`defineString / defineInt / defineBoolean\` from firebase-functions/params
- Never hard-code project IDs, credentials, or secrets in function code
- All secrets must be stored in Secret Manager and referenced via params

## Error handling
- Always return structured errors using HttpsError for callable functions
- Log errors with \`logger.error()\` before throwing
- Never expose internal error details to the client

## Admin SDK
- Import admin only once per file
- Use \`getFirestore() / getStorage() / getAuth()\` getters — not the global admin instance
- Always await Firestore writes before returning from a function

## Performance
- Keep cold start time low: avoid top-level awaits and heavy imports
- Use regional deployment (us-central1) to match Firestore region

## Deployment
- Functions live in \`functions/src/\`
- Export all functions from \`functions/src/index.ts\`
- Run \`npm run build\` in the functions directory before deploying

---

## TypeScript setup — Node16 module resolution

Use Node16 module resolution in \`functions/tsconfig.json\`:

\`\`\`jsonc
{
  "compilerOptions": {
    "module": "node16",
    "target": "es2022",
    "lib": ["es2022"],
    "moduleResolution": "node16",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "rootDir": "src",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"]
}
\`\`\`

### The \`.js\` extension rule

With \`moduleResolution: node16\`, every relative import must end in \`.js\` — even though source files are \`.ts\`. The extension refers to the *emitted* file under \`lib/\`.

\`\`\`ts
// ✅ correct
import { db } from "../init.js";
import { requireAuthUid } from "./common/auth.js";

// ❌ wrong — tsc compiles but deploy crashes with ERR_MODULE_NOT_FOUND
import { db } from "../init";
\`\`\`

Bare-package imports (\`firebase-admin/firestore\`, \`firebase-functions/v2/https\`) do **not** need the extension — only relative paths do.

### Why not commonjs / node10?

\`node10\` is soft-deprecated in TS 5.5+ and will hard-error in TS 7.0. Migrate to \`node16\` (future-proof) — requires adding \`.js\` extensions to all relative imports.

### Common errors

| Error | Cause |
|---|---|
| \`TS5110: Option 'module' must be set ...\` | \`module\` and \`moduleResolution\` mismatched |
| \`TS2835: Relative import paths need explicit file extensions\` | missing \`.js\` on a relative import |
| \`ERR_MODULE_NOT_FOUND\` at deploy | tsc OK but \`.js\` missing on a relative import |
| \`TS5103: Invalid value for '--ignoreDeprecations'\` | \`ignoreDeprecations\` value not accepted by your TS version |

---

## Function module scaffold

Organize by domain: \`functions/src/<domain>/<feature>.ts\`. Never put logic in \`index.ts\`.

\`\`\`ts
// functions/src/<domain>/<feature>.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../init.js";
import { requireAuthUid } from "../common/auth.js";

export const myFunctionName = onCall(async (request) => {
  const uid = requireAuthUid(request); // throws HttpsError('unauthenticated') if missing

  // Validate input
  const { someParam } = request.data;
  if (!someParam || typeof someParam !== 'string') {
    throw new HttpsError('invalid-argument', 'someParam is required');
  }

  // Do all reads before any writes
  const snap = await db().collection('items').doc(someParam).get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Item not found');
  }

  // Write
  await db().collection('results').add({ uid, result: snap.data() });
  return { ok: true };
});
\`\`\`

### Re-export from \`index.ts\`

\`\`\`ts
// functions/src/index.ts — thin re-exporter only, no logic here
import "./init.js";

export { awardLoyaltyPoints } from "./loyalty/award.js";
export { myFunctionName } from "./<domain>/<feature>.js";
\`\`\`

The Firebase CLI discovers functions by scanning \`index.ts\` exports — anything not re-exported will not be deployed.

### Patterns
- **Auth gate**: call \`requireAuthUid(request)\` at the top of every callable
- **Admin gate**: read \`users/{uid}.role\` and throw \`HttpsError('permission-denied')\` for non-admins
- **Idempotency**: build a deterministic transaction ref (\`\${uid}:\${event}:\${refId}\`) and short-circuit if doc already exists
- **Firestore transactions**: do all reads before any writes
- **Logging**: use \`import * as logger from 'firebase-functions/logger'\` — not \`console.log\`

### Anti-patterns
- Never put logic or imports in \`index.ts\`
- Never use top-level \`await\` (cold-start cost)
- Never import the Admin SDK at module level without lazy init
- Never use \`commonjs\` / \`node10\` for new functions
`;
