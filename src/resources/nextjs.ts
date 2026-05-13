export const nextjsConventions = `# Next.js 15 App Router Conventions

## TypeScript best practices

- **Never use \`any\`** — use \`unknown\` + type guards, or define an explicit type. Always type \`error\` in catch blocks as \`unknown\`.
- Always type API responses: \`const data = await res.json() as MyType\` — never \`as any\`.
- Use \`as Type\` sparingly and only when certain; prefer \`z.infer<typeof Schema>\` from Zod.

## JSX / HTML entity guidelines

- Escape raw apostrophes and quotes in JSX text — use \`&apos;\`, \`&quot;\`, \`&lt;\`, \`&gt;\`, \`&amp;\` to avoid ESLint errors.

## Validation

- Use Zod for ALL API route input validation and ALL form validation — no exceptions.
- Use React Hook Form + Zod for all client-side forms.
- Validate at system boundaries (API routes, server actions) — not deep in business logic.
- Never trust client-supplied data; re-validate on the server even if validated on the client.

## Components

- Default to Server Components for all data fetching.
- Use Client Components only when interactivity is required (\`'use client'\` directive).
- Lift data fetching to Server Component parents; pass data as typed props to children.
- Never import Firebase Admin SDK in Client Components.
- Keep client components minimal — use \`'use client'\` only when you need state, effects, or refs.

## Next.js 15 patterns

- **\`params\` is a Promise** — always \`const { id } = await params\` before use in Server Components:

\`\`\`tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
\`\`\`

- \`page.tsx\` and \`layout.tsx\` must default export a React component; \`loading.tsx\` must default export a component.
- Target React 19/Next 15 patterns; do not use legacy pages router APIs.

## API Routes

- All route handlers live under \`src/app/api/\`.
- Export named functions: \`GET\`, \`POST\`, \`PATCH\`, \`DELETE\`.
- Return \`NextResponse.json()\` for all responses.
- **Always check auth before any data access.**
- Use \`adminDb\` helpers from \`src/lib/firestore/\` — never call Firestore directly in route handlers.

## MUI v7 layout best practices

- **DO NOT use the old Grid API** — avoid \`<Grid container>\` and \`<Grid item xs={12}>\` (deprecated in MUI v7).
- **Responsive grid** — use native CSS Grid via \`Box\` with \`sx\`:

\`\`\`tsx
<Box sx={{
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
  gap: 2,
}}>
  <Card>...</Card>
</Box>
\`\`\`

- **Simple stacking** — use \`Stack\` with \`direction\` and \`spacing\`.
- **Flex layouts** — use \`Box\` with \`display: 'flex'\` and flex properties in \`sx\`.
- **Icon components from \`ElementType\` props** — use type assertion:

\`\`\`tsx
const IconComponent = item.icon as React.ComponentType<{ fontSize?: 'small' | 'medium' | 'large' }>
return <IconComponent fontSize="small" />
\`\`\`

- Prefer \`<Link>\` over polymorphic \`Typography\` when you need \`href\`.
- For images inside MUI cards, use \`Box component="img"\` or a Box wrapper + \`img\` (avoids \`CardMedia\` typing pitfalls).
- Always reference colors via MUI theme tokens in \`sx\` — never hard-code hex values in new code.
- If the project uses both MUI and Tailwind, never apply both on the same element — pick one per element.

## Forms (MUI + React Hook Form + Zod)

- Define a Zod schema; use \`zodResolver\` with RHF.
- For numeric fields, use \`z.coerce.number()\` to avoid empty-string/NaN issues.
- Group fields into section cards: \`Stack\`, \`Typography\`, \`TextField\`, \`Button\`, \`Alert\`, \`CircularProgress\`.
- Keep styling in MUI \`sx\`.
- Presentational client component that accepts typed props; parent (Server Component) fetches data and injects via props.

## Firebase Auth — session cookie pattern

- Exchange a Firebase ID token for an HttpOnly session cookie via a \`POST /api/auth/session\` route handler.
- Use \`adminAuth.createSessionCookie(idToken, { expiresIn })\` server-side.
- \`DELETE /api/auth/session\` clears the cookie on sign-out.
- Session cookie must be \`HttpOnly\` and \`Secure\` in production.
- Custom claims (e.g. \`isSubscribed\`) are only set via the Admin SDK, never from the client.
- Never import \`firebase-admin\` in any \`"use client"\` file.
- No sensitive values should be prefixed \`NEXT_PUBLIC_\` — those are exposed in the browser bundle.

## Firestore — server helper pattern

Use in Server Components and API routes via the Admin SDK (\`adminDb\`):

\`\`\`typescript
import { adminDb } from "@/lib/firebase/admin";

export async function getActiveItems(): Promise<Item[]> {
  const snap = await adminDb.collection("items").where("isActive", "==", true).get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return { id: doc.id, title: d.title as string } satisfies Item;
  });
}
\`\`\`

## Firestore — real-time client subscription pattern

Use in \`"use client"\` components only:

\`\`\`typescript
"use client";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

useEffect(() => {
  const q = query(collection(db, "collectionName"), where("status", "==", "active"));
  const unsub = onSnapshot(q, (snap) => {
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MyType));
  });
  return unsub; // always return the unsubscribe function
}, []);
\`\`\`

## Models & Types

- Types live in \`shared/models/ardeej/*.ts\`.
- DTO-safe: no React elements in shared models.
- Export as named typed constants; use \`import type\` where possible.

## Data fetching & fallbacks

Server-first fetching with try/catch and typed placeholder fallback:

\`\`\`ts
let data = sampleItems
try {
  const res = await fetch(url, { cache: "no-store" })
  if (res.ok) data = await res.json() as MyType[]
} catch {}
\`\`\`

## Build & quality

- Lint with \`eslint-config-next\`; build with \`next build\`.
- Target React 19/Next 15 patterns.
`;
