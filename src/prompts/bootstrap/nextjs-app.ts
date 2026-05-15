import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerNextjsBootstrapPrompt(server: McpServer): void {
  server.registerPrompt(
    'bootstrap-nextjs-app',
    {
      description:
        'Scaffold a Next.js 15 app with Firebase Auth (session-cookie), MUI v7, and the .github/instructions/ kit. Use mode=companion when pairing with a Flutter app (adds docs/ structure, admin/docs CMS, cross-repo references). Use mode=standalone for a marketing/admin site with no paired Flutter app.',
      argsSchema: {
        projectName: z
          .string()
          .describe('Project name in kebab-case, e.g. "my-app-portal"'),
        mode: z
          .enum(['companion', 'standalone'])
          .describe('companion = paired with a Flutter app and includes docs/ structure; standalone = marketing + admin only'),
        flutterRepoName: z
          .string()
          .optional()
          .describe('Flutter sibling repo name — required for companion mode, e.g. "my_app"'),
        cookieName: z
          .string()
          .optional()
          .describe('Session cookie name (default: [projectName]_session with hyphens replaced by underscores)'),
      },
    },
    ({ projectName, mode, flutterRepoName, cookieName }) => {
      const cookie =
        cookieName ?? `${projectName.replace(/-/g, '_')}_session`;
      const flutterRepo = flutterRepoName ?? (mode === 'companion' ? 'my_flutter_app' : '');
      const displayName = projectName
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const modelNamespace = projectName.replace(/-/g, '_');
      const companionNote =
        mode === 'companion'
          ? `\n> **Companion mode** — this portal is paired with Flutter app \`../${flutterRepo}/\`. The docs/ triple and /admin/docs CMS are included. Read \`conventions://docs-portal-architecture\` for the full pattern.`
          : `\n> **Standalone mode** — no paired Flutter app. The docs/ structure and cross-repo references are omitted.`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Scaffold a new Next.js 15 app called **${projectName}** (mode: **${mode}**).${companionNote}

Follow all rules from \`conventions://nextjs\`, \`conventions://firebase-auth\`, and \`conventions://firestore-server\`.

---

## Step 1 — Create the project

\`\`\`bash
npx create-next-app@latest ${projectName} \\
  --typescript \\
  --eslint \\
  --app \\
  --src-dir \\
  --no-tailwind \\
  --import-alias "@/*"
cd ${projectName}
\`\`\`

---

## Step 2 — Install dependencies

\`\`\`bash
npm install @mui/material @mui/material-nextjs @emotion/react @emotion/styled
npm install firebase firebase-admin
npm install react-hook-form @hookform/resolvers zod
npm install framer-motion
npm install server-only
\`\`\`

---

## Step 3 — tsconfig.json path aliases

Add these paths under \`compilerOptions\` in \`tsconfig.json\` (in addition to the default \`@/*\`):

\`\`\`json
"paths": {
  "@/*": ["./src/*"],
  "@/data/*": ["./shared/data/*"],
  "@/models/*": ["./shared/models/*"],
  "@/components/*": ["./shared/components/*"],
  "@/themes/*": ["./shared/themes/*"]
}
\`\`\`

Also add to \`next.config.ts\`:
\`\`\`ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
};

export default nextConfig;
\`\`\`

---

## Step 4 — Firebase client library

Create **src/lib/firebase/client.ts** with exactly this content:

\`\`\`ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getClientApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getClientAuth(): Auth {
  return getAuth(getClientApp());
}

export function getClientDb(): Firestore {
  return getFirestore(getClientApp());
}

export function getClientStorage(): FirebaseStorage {
  return getStorage(getClientApp());
}
\`\`\`

---

## Step 5 — Firebase admin library

Create **src/lib/firebase/admin.ts** with exactly this content:

\`\`\`ts
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\\\n/g, '\\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin env vars missing: FIREBASE_ADMIN_PROJECT_ID, ' +
      'FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY'
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

let _adminAuth: Auth | undefined;
let _adminDb: Firestore | undefined;

export function getAdminAuth(): Auth {
  if (!_adminAuth) _adminAuth = getAuth(getAdminApp());
  return _adminAuth;
}

export function getAdminDb(): Firestore {
  if (!_adminDb) _adminDb = getFirestore(getAdminApp());
  return _adminDb;
}
\`\`\`

---

## Step 6 — Firebase auth helpers

Create **src/lib/firebase/auth.ts** with exactly this content:

\`\`\`ts
'use client';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getClientAuth } from './client';

const googleProvider = new GoogleAuthProvider();

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(getClientAuth(), email, password);
  await createSessionCookie(credential.user);
  return credential.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(getClientAuth(), email, password);
  await updateProfile(credential.user, { displayName });
  await createSessionCookie(credential.user);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(getClientAuth(), googleProvider);
  await createSessionCookie(credential.user);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getClientAuth());
  await fetch('/api/auth/session', { method: 'DELETE' });
}

async function createSessionCookie(user: User): Promise<void> {
  const idToken = await user.getIdToken();
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}
\`\`\`

---

## Step 7 — Session helper

Create **src/lib/firebase/session.ts** with exactly this content:

\`\`\`ts
import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth } from '@/lib/firebase/admin';

const SESSION_COOKIE_NAME = '${cookie}';

export type SessionUser = {
  uid: string;
  role: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (!session?.value) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(session.value, true);
    return { uid: decoded.uid, role: (decoded as { role?: string }).role ?? 'user' };
  } catch {
    return null;
  }
}

export async function requireAdminUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/sign-in');
  if (user.role !== 'admin') redirect('/account');
  return user;
}
\`\`\`

---

## Step 8 — Session API route

Create **src/app/api/auth/session/route.ts** with exactly this content:

\`\`\`ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

const SESSION_COOKIE_NAME = '${cookie}';
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as { idToken?: unknown };
    const idToken = body.idToken;

    if (typeof idToken !== 'string' || !idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    await getAdminDb().collection('users').doc(decoded.uid).set(
      {
        displayName: decoded.name ?? '',
        email: decoded.email ?? null,
        isSubscribed: false,
        role: 'user',
      },
      { merge: true }
    );

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create session';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(): Promise<NextResponse> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ status: 'ok' });
}
\`\`\`

---

## Step 9 — Middleware

Create **src/middleware.ts** with exactly this content:

\`\`\`ts
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = '${cookie}';

const publicRoutes = [
  /^\\/$/,
  /^\\/sign-in(\\/.*)?$/,
  /^\\/sign-up(\\/.*)?$/,
  /^\\/blog(\\/.*)?$/,
  /^\\/api\\/auth(\\/.*)?$/,
];

const protectedRoutes = [
  /^\\/account(\\/.*)?$/,
  /^\\/admin(\\/.*)?$/,
];

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  if (publicRoutes.some((r) => r.test(pathname))) {
    return NextResponse.next();
  }

  if (protectedRoutes.some((r) => r.test(pathname))) {
    const session = req.cookies.get(SESSION_COOKIE_NAME);
    if (!session?.value) {
      const signInUrl = req.nextUrl.clone();
      signInUrl.pathname = '/sign-in';
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
\`\`\`

---

## Step 10 — MUI theme

Create **shared/themes/baseTheme.ts** with exactly this content:

\`\`\`ts
import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4ade80', light: '#86efac', dark: '#16a34a', contrastText: '#000000' },
    secondary: { main: '#22c55e', contrastText: '#000000' },
    background: { default: '#0a0a0a', paper: '#1a1a2e' },
    text: { primary: '#ffffff', secondary: '#9ca3af' },
    divider: '#2a2a4a',
    error: { main: '#f87171' },
    warning: { main: '#f59e0b' },
    success: { main: '#4ade80' },
    info: { main: '#60a5fa' },
  },
  typography: {
    fontFamily: 'var(--font-roboto), Roboto, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});
\`\`\`

Create **shared/themes/themeProvider.tsx**:

\`\`\`tsx
'use client';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { appTheme } from './baseTheme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={appTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
\`\`\`

---

## Step 11 — Root layout

Create **src/app/layout.tsx** (spec — agent generates matching Next.js 15 pattern):
- Import \`AppRouterCacheProvider\` from \`@mui/material-nextjs/v15-appRouter\`
- Wrap children in \`<AppRouterCacheProvider options={{ enableCssLayer: true }}>\` then \`<ThemeProvider>\`
- Set \`<html lang="en">\` with Roboto font variable
- Export metadata with \`title: '${displayName}'\`

---

## Step 12 — App routes (spec)

Generate these pages following Next.js 15 App Router conventions:

| Route | File | Type | Notes |
|---|---|---|---|
| \`/\` | \`src/app/page.tsx\` | Server | Marketing landing — hero section + CTA |
| \`/sign-in\` | \`src/app/sign-in/page.tsx\` | Client | Firebase Auth email + Google; calls \`signInWithEmail\` / \`signInWithGoogle\` from \`src/lib/firebase/auth.ts\` |
| \`/sign-up\` | \`src/app/sign-up/page.tsx\` | Client | Firebase Auth; calls \`signUpWithEmail\` / \`signInWithGoogle\` |
| \`/blog\` | \`src/app/blog/page.tsx\` | Server | Blog listing stub |
| \`/blog/[slug]\` | \`src/app/blog/[slug]/page.tsx\` | Server | Blog post stub |
| \`/account\` | \`src/app/account/page.tsx\` | Server | Protected — calls \`getSessionUser()\`; redirects if unauthenticated |
| \`/admin\` | \`src/app/admin/page.tsx\` | Server | Protected — calls \`requireAdminUser()\` |

---

## Step 13 — Shared model stub

Create **shared/models/${modelNamespace}/user.ts** (spec):
\`\`\`ts
export type UserProfile = {
  uid: string;
  displayName: string;
  email: string | null;
  role: 'user' | 'admin';
  isSubscribed: boolean;
};
\`\`\`

---

## Step 14 — .env.local stub

Create **.env.local**:

\`\`\`
# Firebase client config — fill in after running terraform apply + generate-env.sh
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK — SERVER ONLY, never prefix with NEXT_PUBLIC_
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Session cookie name
SESSION_COOKIE_NAME=${cookie}
\`\`\`

---
${mode === 'companion' ? `
## Step 15 — Companion-mode: docs/ structure

Create the docs directory triple:

\`\`\`bash
mkdir -p docs/{architecture,functions,firestore,deploy,security,notes,mobile,developer}
mkdir -p docs/_generated
\`\`\`

Create **docs/ONBOARDING.md** (spec — generate content):
- What is ${displayName}?
- Repos in this ecosystem (${flutterRepo} Flutter app, ${projectName} portal)
- How to run local dev
- Schema source of truth location
- Key architectural decisions pointer

Create **docs/notes/decisions.md** with header:
\`\`\`markdown
# Architectural Decisions

Entries use DEC-NNN sequential numbering. Full capture process: \`conventions://decision-capture\`.
\`\`\`

Create **docs/notes/CHANGELOG.md** with header:
\`\`\`markdown
# Changelog

## [Unreleased]
\`\`\`

Create **docs/developer/errors.md** with header:
\`\`\`markdown
# Recurring Errors & Fixes

Entries added only on explicit request. Full process: \`conventions://error-capture\`.
\`\`\`

Create **docs/notes/feature-status.md**:
\`\`\`markdown
# Feature Status

Tracks which Flutter services are Real vs Mock.

| Service | Status | Notes |
|---|---|---|
\`\`\`

Create **docs/_generated/README.md**:
\`\`\`markdown
# _generated

Build-step output. Do not edit manually. Run the docs build script to regenerate.
\`\`\`

---

## Step 16 — Companion-mode: /admin/docs CMS

See \`conventions://docs-portal-architecture\` section 4 for the full pattern.

Create **src/lib/firestore/adminDocs/adminDocs.ts** — implement \`getAdminDocs()\`, \`createAdminDoc()\`, \`updateAdminDoc()\`, \`deleteAdminDoc()\` using \`getAdminDb()\` from \`src/lib/firebase/admin.ts\`.

Create these routes (spec — agent generates MUI forms):

\`\`\`
src/app/admin/docs/
  page.tsx         Server component — list all adminDocs, link to create/edit
  new/page.tsx     Client component — MUI form with title, content (textarea), category
  [id]/page.tsx    Server component — view a single doc
  [id]/edit/page.tsx  Client component — edit form
\`\`\`

All routes call \`requireAdminUser()\` before touching data.

Create shared model **shared/models/${modelNamespace}/adminDoc.ts**:
\`\`\`ts
export type AdminDoc = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
};
\`\`\`

---

## Step 17 — Companion-mode: update AGENTS.md cross-repo references

After running \`setup-project nextjs\` (step 18), open the generated \`AGENTS.md\` and add a section:

\`\`\`markdown
## Flutter companion app

This portal is paired with the Flutter app at \`../${flutterRepo}/\`.
- Flutter ARCHITECTURE.md: [\`../${flutterRepo}/lib/ARCHITECTURE.md\`](../${flutterRepo}/lib/ARCHITECTURE.md)
- Firestore schema source of truth: \`docs/firestore/schema.md\` (this repo)
\`\`\`
` : ''}
## Step ${mode === 'companion' ? '18' : '15'} — Run setup-project to create the instructions kit

Use the \`setup-project\` MCP prompt with:
- \`projectName\`: ${projectName}
- \`stack\`: nextjs
- \`portalRepoName\`: ${projectName} (this repo is the portal)

---

## Step ${mode === 'companion' ? '19' : '16'} — Verification checklist

- [ ] \`npm install\` succeeds
- [ ] \`npm run build\` succeeds with no errors
- [ ] \`npm run lint\` passes
- [ ] \`src/lib/firebase/\` contains client.ts, admin.ts, auth.ts, session.ts
- [ ] \`src/middleware.ts\` protects /admin and /account routes with cookie \`${cookie}\`
- [ ] \`.github/instructions/\` contains nextjs-firebase + decision-capture + documentation + error-capture files
${mode === 'companion' ? `- [ ] \`docs/notes/decisions.md\` exists with header
- [ ] \`docs/notes/CHANGELOG.md\` exists
- [ ] \`docs/developer/errors.md\` exists
- [ ] \`src/app/admin/docs/\` route structure exists
- [ ] \`src/lib/firestore/adminDocs/adminDocs.ts\` exists` : ''}
`,
            },
          },
        ],
      };
    },
  );
}
