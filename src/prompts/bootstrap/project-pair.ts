import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerProjectPairPrompt(server: McpServer): void {
  server.registerPrompt(
    'setup-project-pair',
    {
      description:
        'Orchestrates scaffolding of a matched Flutter app + companion Next.js portal. This is the primary entry point for new projects. Calls bootstrap-flutter-app and bootstrap-nextjs-app (companion mode) in sequence, then prints a unified checklist.',
      argsSchema: {
        flutterProjectName: z
          .string()
          .describe('Flutter app name in snake_case, e.g. "my_app"'),
        portalProjectName: z
          .string()
          .optional()
          .describe('Portal repo name in kebab-case (default: [flutterProjectName with _ replaced by -]-portal, e.g. "my-app-portal")'),
        primaryDomain: z
          .string()
          .optional()
          .describe('Primary domain name for the Flutter seed service trio, e.g. "catalog" (default: catalog)'),
      },
    },
    ({ flutterProjectName, portalProjectName, primaryDomain = 'catalog' }) => {
      const portal =
        portalProjectName ??
        `${flutterProjectName.replace(/_/g, '-')}-portal`;
      const cookieName = `${portal.replace(/-/g, '_')}_session`;
      const flutterDisplay = flutterProjectName
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const portalDisplay = portal
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Scaffold a complete new project pair:

| Repo | Name | Type |
|---|---|---|
| Flutter app | \`${flutterProjectName}\` | Mobile (iOS/Android/Web) |
| Portal | \`${portal}\` | Next.js 15, companion mode |

Both repos will be created as **sibling directories** at the same level (matching the ardeej/ardeeportal pattern).
Primary domain for Flutter seed service: **${primaryDomain}**.
Session cookie: **${cookieName}**.

---

## Phase 1 — Create the Flutter app

Follow the \`bootstrap-flutter-app\` prompt with:
- \`projectName\`: ${flutterProjectName}
- \`portalRepoName\`: ${portal}
- \`primaryDomain\`: ${primaryDomain}

Complete all steps in that prompt before proceeding to Phase 2.

**Expected output:**
- \`${flutterProjectName}/\` directory with full Flutter skeleton
- Three-layer directory structure (models, providers, services, screens, widgets)
- Seed service trio for domain: ${primaryDomain}
- Firebase init in main.dart (offline persistence enabled)
- \`.github/instructions/\` kit with all Dart/Flutter convention files
- Paths in decision-capture.instructions.md pointing to \`../${portal}/docs/notes/\`

---

## Phase 2 — Create the companion portal

Follow the \`bootstrap-nextjs-app\` prompt with:
- \`projectName\`: ${portal}
- \`mode\`: companion
- \`flutterRepoName\`: ${flutterProjectName}
- \`cookieName\`: ${cookieName}

Complete all steps in that prompt before proceeding to Phase 3.

**Expected output:**
- \`${portal}/\` directory with Next.js 15 skeleton
- Firebase Auth session-cookie pattern with cookie name \`${cookieName}\`
- MUI v7 dark theme
- src/lib/firebase/ (client.ts, admin.ts, auth.ts, session.ts)
- src/middleware.ts protecting /account and /admin
- docs/ structure with ONBOARDING.md + decisions triple
- /admin/docs CMS slice (Firestore adminDocs collection)
- \`.github/instructions/\` kit

---

## Phase 3 — Cross-repo verification

Confirm these cross-repo references are correctly wired:

### Flutter → Portal references
- [ ] \`${flutterProjectName}/lib/ARCHITECTURE.md\` links to \`../../${portal}/docs/ONBOARDING.md\`
- [ ] \`${flutterProjectName}/lib/ARCHITECTURE.md\` links to \`../../${portal}/docs/firestore/schema.md\`
- [ ] \`${flutterProjectName}/.github/instructions/decision-capture.instructions.md\` references \`../${portal}/docs/notes/\`
- [ ] \`${flutterProjectName}/.github/instructions/error-capture.instructions.md\` references \`../${portal}/docs/developer/errors.md\`
- [ ] \`${flutterProjectName}/AGENTS.md\` references the onboarding doc in the portal

### Portal self-references
- [ ] \`${portal}/docs/ONBOARDING.md\` mentions both repos by name
- [ ] \`${portal}/docs/notes/decisions.md\` exists with DEC-NNN header
- [ ] \`${portal}/docs/notes/CHANGELOG.md\` exists
- [ ] \`${portal}/docs/developer/errors.md\` exists
- [ ] \`${portal}/docs/notes/feature-status.md\` lists ${primaryDomain}Service as 🟡 Mock (initial state)

---

## Phase 4 — Post-scaffold next steps

Print this checklist for the developer:

### Firebase project setup
1. Create a Firebase project (use \`bootstrap-firebase-project\` MCP prompt for Terraform, or create manually in Firebase Console)
2. Enable Authentication (Email/Password + Google)
3. Enable Firestore in native mode (region: us-central1)
4. Enable Firebase Storage
5. Register a web app and note the config values

### Flutter config
6. Register Android app (package: com.example.${flutterProjectName}) → download \`google-services.json\` → place in \`${flutterProjectName}/android/app/\`
7. Register iOS app (bundle ID: com.example.${flutterProjectName}) → download \`GoogleService-Info.plist\` → place in \`${flutterProjectName}/ios/Runner/\`
8. Run: \`cd ${flutterProjectName} && flutterfire configure\` to generate \`lib/config/firebase_options.dart\`
9. Uncomment Firebase options import in \`lib/main.dart\`
10. Fill in \`${flutterProjectName}/.env\` with \`FIREBASE_PROJECT_ID\`

### Portal config
11. Fill in \`${portal}/.env.local\` with all \`NEXT_PUBLIC_FIREBASE_*\` values from web app config
12. Create a Firebase Admin service account → download JSON → extract values into \`${portal}/.env.local\`:
    - \`FIREBASE_ADMIN_PROJECT_ID\`
    - \`FIREBASE_ADMIN_CLIENT_EMAIL\`
    - \`FIREBASE_ADMIN_PRIVATE_KEY\` (include the full \`-----BEGIN PRIVATE KEY-----...\` string)

### Install & build
13. \`cd ${flutterProjectName} && flutter pub get\`
14. \`cd ${flutterProjectName} && flutter pub run build_runner build --delete-conflicting-outputs\`
15. \`cd ${flutterProjectName} && flutter analyze\` — must pass with 0 errors
16. \`cd ${portal} && npm install\`
17. \`cd ${portal} && npm run build\` — must pass with 0 errors
18. \`cd ${portal} && npm run lint\` — must pass

### First-run verification
19. Run Flutter app on simulator/emulator — should reach home screen
20. Run portal with \`npm run dev\` — should reach \`/\` landing page
21. Sign up at \`/sign-up\` — should set cookie \`${cookieName}\` and redirect to \`/account\`
22. Navigate to \`/admin/docs\` — should redirect to \`/sign-in\` if not admin role

---

## Directory structure (final)

\`\`\`
parent-directory/
├── ${flutterProjectName}/          # Flutter mobile app
│   ├── lib/
│   │   ├── config/         # Firebase options (generated)
│   │   ├── models/${primaryDomain}/
│   │   ├── providers/${primaryDomain}Providers/
│   │   ├── screens/
│   │   ├── services/${primaryDomain}/
│   │   └── widgets/
│   ├── assets/
│   └── .github/instructions/
└── ${portal}/              # Next.js companion portal
    ├── src/
    │   ├── app/
    │   │   ├── api/auth/session/
    │   │   ├── admin/docs/
    │   │   └── ...
    │   ├── lib/firebase/
    │   └── middleware.ts
    ├── shared/
    │   ├── components/
    │   ├── models/
    │   └── themes/
    ├── docs/
    │   ├── ONBOARDING.md
    │   ├── architecture/
    │   ├── firestore/
    │   ├── notes/
    │   │   ├── decisions.md
    │   │   ├── CHANGELOG.md
    │   │   └── feature-status.md
    │   └── developer/
    │       └── errors.md
    └── .github/instructions/
\`\`\`
`,
            },
          },
        ],
      };
    },
  );
}
