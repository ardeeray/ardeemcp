export const firestoreServerConventions = `# Firestore — Server-Side Patterns

## SDK split

| Context | SDK | Import from |
|---------|-----|------------|
| API routes, Server Components, middleware | Firebase Admin SDK (\`adminDb\`) | \`src/lib/firebase/admin.ts\` |
| Client components (real-time subscriptions) | Firebase Client SDK (\`db\`) | \`src/lib/firebase/client.ts\` |

**Never use the Admin SDK in client components** — it exposes service account credentials.
**Never use the Client SDK for privileged writes** — security rules may not be
tight enough to substitute for server-side validation.

## adminDb helper pattern

Wrap every Firestore operation in a typed helper function. Route handlers and
Server Components call helpers — they never call \`adminDb\` directly.

\`\`\`ts
// src/lib/firestore/things.ts
import { adminDb } from '@/lib/firebase/admin';

export async function getThing(id: string): Promise<Thing | null> {
  const snap = await adminDb.collection('things').doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<Thing, 'id'>) };
}

export async function listThings(filter: ThingFilter): Promise<Thing[]> {
  let q = adminDb.collection('things').where('isActive', '==', true);
  if (filter.category) q = q.where('category', '==', filter.category);
  const snaps = await q.orderBy('createdAt', 'desc').limit(50).get();
  return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Thing, 'id'>) }));
}
\`\`\`

## API route pattern

\`\`\`ts
// src/app/api/things/route.ts
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/firebase/auth';   // check cookie first
import { listThings } from '@/lib/firestore/things';
import { z } from 'zod';

const QuerySchema = z.object({ category: z.string().optional() });

export async function GET(req: Request) {
  const uid = await verifySession();                   // 401 if not authed
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const items = await listThings(parsed.data);
  return NextResponse.json({ items });
}
\`\`\`

## Rules

- **Auth before data** — verify the session cookie before any Firestore read or
  write.
- **Validate all inputs** — use Zod at the API route boundary before passing
  values to helpers. Never pass raw \`req.body\` or URL params into a query.
- **Sanitize strings** — never interpolate user-supplied strings directly into
  Firestore field paths or collection names.
- **Document ID ≠ stored field** — the Firestore doc \`id\` is not automatically
  stored as a field. Add \`id: snap.id\` when mapping to your type.
- **Always use \`snap.exists\`** — check before calling \`snap.data()\`.
- **Batch writes for multi-doc updates** — use \`adminDb.batch()\` when writing
  to more than one document atomically.
- **Transactions for read-modify-write** — use \`adminDb.runTransaction()\` to
  prevent race conditions on counters or status fields.

## Real-time subscriptions (client-side only)

\`\`\`ts
// Only in "use client" components
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

useEffect(() => {
  const q = query(collection(db, 'things'), where('status', '==', 'active'));
  const unsub = onSnapshot(q, snap => {
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
  return unsub;
}, []);
\`\`\`

## Firestore security rules

Even with the Admin SDK (which bypasses security rules), write rules that
enforce your data shape — they protect against client SDK misuse.

- Default deny all: \`allow read, write: if false;\`
- Authenticate reads: \`allow read: if request.auth != null;\`
- Ownership checks: \`allow write: if request.auth.uid == resource.data.ownerUid;\`
- Validate required fields: \`allow create: if request.resource.data.keys().hasAll(['title', 'createdAt']);\`

## Pagination

Use cursor-based pagination with \`startAfter(lastDoc)\` rather than
offset-based pagination — Firestore charges for every skipped document with
offset.

\`\`\`ts
const page1 = await adminDb.collection('things').orderBy('createdAt').limit(20).get();
const lastDoc = page1.docs[page1.docs.length - 1];
const page2 = await adminDb.collection('things').orderBy('createdAt').startAfter(lastDoc).limit(20).get();
\`\`\`
`;
