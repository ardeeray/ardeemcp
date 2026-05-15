export const docsPortalArchitectureConventions = `
# Docs-Portal Architecture Conventions

The companion Next.js portal is the documentation and admin hub for a Flutter app ecosystem.
It lives as a sibling directory to the Flutter repo: \`../[portalRepoName]/\`.

---

## 1. Docs-as-routes pattern

Long-form documentation lives in \`docs/<category>/<slug>.md\` with YAML frontmatter.
A build step writes an index to \`docs/_generated/routes.json\` which the Next.js
docs viewer reads at build time to generate routes.

### YAML frontmatter

\`\`\`yaml
---
title: "Title here"
category: architecture   # must match the folder name
order: 100               # optional display order, default 100
updated: 2026-01-01      # ISO date of last meaningful edit
---
\`\`\`

### Valid category folders

| Folder | Contents |
|---|---|
| \`architecture/\` | System design, ADRs, glossary, overview |
| \`functions/\` | Cloud Functions catalogue, trigger shapes |
| \`firestore/\` | Firestore schema, indexes, rules notes |
| \`deploy/\` | Deployment runbooks, CI/CD, environment setup |
| \`security/\` | Auth model, security rules, OWASP notes |
| \`loyalty/\` | Points model, events, redemption logic |
| \`notes/\` | decisions.md, CHANGELOG.md, feature-status.md |
| \`mobile/\` | Flutter-specific notes consumed by the portal |
| \`developer/\` | Onboarding, errors.md, tooling notes |

---

## 2. The three-file decisions triple

Every portal repo maintains exactly three cross-ecosystem log files:

| File | Purpose |
|---|---|
| \`docs/notes/decisions.md\` | DEC-NNN architectural decisions log |
| \`docs/notes/CHANGELOG.md\` | Feature-level changelog entries |
| \`docs/developer/errors.md\` | Recurring errors and their fixes |

Sibling repos (Flutter, MCP server, etc.) reference these via \`../[portalRepoName]/docs/notes/\`.
The \`.github/instructions/decision-capture.instructions.md\` in each sibling repo carries the exact paths.

---

## 3. ONBOARDING.md

\`docs/ONBOARDING.md\` is the canonical "start here" document for the entire ecosystem.
It should answer:
- What is this product?
- What repos exist and how do they relate?
- How do I run the dev environment?
- Where is the schema source of truth?
- What are the key architectural decisions?

Link to it from every repo's \`AGENTS.md\` as the cross-repo overview.

---

## 4. /admin/docs — Firestore adminDocs CMS slice

Short-lived runbooks, ops notes, and session debriefs that don't belong in the repo
live in Firestore under the \`adminDocs\` collection. The portal's \`/admin/docs\` routes
provide a browser-based editor.

### Firestore collection shape

\`\`\`
adminDocs/{docId}
  title:     string
  content:   string          // markdown
  category:  string          // e.g. "runbook", "ops", "session"
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string          // uid
\`\`\`

### Route structure

\`\`\`
src/app/admin/docs/
  page.tsx           // list all adminDocs (server component, adminDb)
  new/
    page.tsx         // create form (client component, POST /api/admin/docs)
  [id]/
    page.tsx         // view a single doc (server component)
    edit/
      page.tsx       // edit form (client component, PATCH /api/admin/docs/[id])
\`\`\`

### Firestore helper pattern (server-side)

\`\`\`ts
// src/lib/firestore/adminDocs/adminDocs.ts
import { getAdminDb } from '@/lib/firebase/admin';
import type { AdminDoc } from '@/models/[projectName]/adminDoc';

export async function getAdminDocs(): Promise<AdminDoc[]> {
  const snap = await getAdminDb().collection('adminDocs')
    .orderBy('updatedAt', 'desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminDoc));
}

export async function createAdminDoc(data: Omit<AdminDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await getAdminDb().collection('adminDocs').add({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
}

export async function updateAdminDoc(id: string, data: Partial<AdminDoc>): Promise<void> {
  await getAdminDb().collection('adminDocs').doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
}

export async function deleteAdminDoc(id: string): Promise<void> {
  await getAdminDb().collection('adminDocs').doc(id).delete();
}
\`\`\`

Security: all \`/admin/docs\` routes and \`/api/admin/*\` handlers call \`requireAdminUser()\`
from \`src/lib/firebase/session.ts\` before touching adminDocs data.

---

## 5. feature-status.md

\`docs/notes/feature-status.md\` tracks which Flutter services are still pointing at Mock
implementations vs. Real Firestore. Format:

\`\`\`markdown
## Service status

| Service | Status | Notes |
|---|---|---|
| CatalogService | ✅ Real | Firestore \`songs\` collection |
| PartyService | 🟡 Mock | Stub until party feature ships |
\`\`\`

Update this file whenever a \`fix-stub\` prompt completes successfully.

---

## 6. Cross-repo reference convention

| What | Where |
|---|---|
| Schema source of truth | \`[portalRepo]/docs/firestore/schema.md\` |
| Decisions log | \`[portalRepo]/docs/notes/decisions.md\` |
| Changelog | \`[portalRepo]/docs/notes/CHANGELOG.md\` |
| Errors log | \`[portalRepo]/docs/developer/errors.md\` |
| Cross-repo contract | \`[portalRepo]/docs/architecture/cross-repo-contract.md\` |

All paths above use \`../[portalRepoName]/\` relative to sibling repos.
Never duplicate schema or decisions content — always reference the portal.
`;
