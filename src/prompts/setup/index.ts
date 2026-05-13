import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createHash } from 'crypto';
import { nextjsConventions } from '../../resources/nextjs.js';
import { flutterConventions } from '../../resources/flutter.js';
import { cloudFunctionsConventions } from '../../resources/cloud-functions.js';
import { nodejsCliConventions } from '../../resources/nodejs-cli.js';

const stackConventionsMap: Record<string, string> = {
  nextjs: nextjsConventions,
  flutter: flutterConventions,
  'cloud-functions': cloudFunctionsConventions,
  'nodejs-cli': nodejsCliConventions,
};

function hash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 12);
}

const decisionCaptureInstructions = `---
applyTo: '**'
description: Process for capturing architectural decisions (DEC-NNN) and changelog entries with mid-task signal detection.
---

# Decision capture

Universal process for recording architectural decisions and changelogs.

## Defaults

| Setting | Default value |
|---|---|
| **Decisions file** | \`../ardeeportal/docs/notes/decisions.md\` |
| **Changelog file** | \`../ardeeportal/docs/notes/CHANGELOG.md\` |
| **Entry numbering** | \`DEC-NNN\` sequential — read existing \`## DEC-NNN\` headings to find the next number |

## Mid-task — detect decision signals

Watch for these signals during any task. When one fires, start probing **immediately**:
- User says "I don't want to use X" / "let's not do Y"
- User says "should we use X or Y?"
- A choice between two or more libraries/approaches is visible in the code
- A file or feature is being deleted rather than changed
- User message contains "because" or "since" explaining a choice

**Interview (one question at a time):**
1. "What alternatives did you consider?"
2. For each rejected alternative: "Why did you reject [X]?"
3. "Are there any risks you're accepting with this choice?"
4. "Is there a condition that would make you revisit this?"

## Entry format

\`\`\`markdown
## DEC-NNN [YYYY-MM-DD] Short title
**Category**: Architecture | Feature scope | Library | Security | Cross-system contract
**Context**: Why this decision came up
**Decision**: What was decided
**Alternatives considered**: Option A (rejected: reason); Option B (rejected: reason)
**Rationale**: Why this choice
**Risks accepted**: Known downsides
**Revisit when**: Condition that would change this
**Repos**: this-repo | ardeeportal | both
**Affected**: path/to/file
\`\`\`

## Linkback comment format (TypeScript/Dart): \`// Decision: DEC-NNN ../ardeeportal/docs/notes/decisions.md#dec-nnn\`
`;

const documentationInstructions = `---
applyTo: '**'
description: Documentation standards — Key concepts Q&A format, doc-worthy triggers, and Manual fallback section requirements.
---

# Documentation standards

## Key concepts section format

When writing docs for a non-trivial feature, include a "Key concepts" section with 3–5 Q&A pairs:

\`\`\`markdown
## Key concepts

**Q: [Most confusing part?]**
A: [Direct answer in 1–3 sentences.]
\`\`\`

## Doc-worthy triggers

Ask at end of task if any apply:
- New feature, screen, or top-level UI surface
- New or changed schema, collection, field, or security rule
- New environment variable or required config
- Breaking refactor that changes how other features should be built
- A concept that required mid-task clarification

**Not doc-worthy:** bug fixes, copy/style tweaks, dependency bumps, test-only changes.

## Security note
Never document credentials or secret values. Reference only the variable name, never the value.
`;

const errorCaptureInstructions = `---
applyTo: '**'
description: Process for documenting recurring errors — only on explicit user request.
---

# Error capture

## When to document
Only write an error entry when the user **explicitly asks** to record it.

## Dedup rule
Before creating a new entry, scan for an existing entry with the same error message. Update rather than duplicate.

## Entry format

\`\`\`markdown
### Error title (short, searchable)

**Quick fix:** One-line command or code change.

**Full error:**
\`\`\`
Exact error message or stack trace
\`\`\`

**Fix steps:**
1. Step one
2. Step two
\`\`\`

## Errors file: \`../ardeeportal/docs/developer/errors.md\`
`;

function nextjsInstructions(projectName: string): string {
  return `---
applyTo: '**/*.{ts,tsx}'
description: Next.js 15 App Router + Firebase conventions for ${projectName}.
---

# Stack conventions — ${projectName}

See \`conventions://nextjs\` in the ardeemcp MCP server for the full conventions reference.

## Quick reference
- Zod validation on ALL API routes and forms
- React Hook Form + Zod for client forms
- MUI v7 for all UI (sx prop for styling)
- Firebase Auth: \`ardeej_session\` cookie pattern
- Server Components by default; Client only for interactivity
- adminDb helpers in \`src/lib/firestore/\` — never call Firestore directly in routes
- Never expose Firebase Admin credentials client-side (no NEXT_PUBLIC_ prefix on admin vars)

## Decisions log
\`../ardeeportal/docs/notes/decisions.md\` (DEC-NNN sequential)
`;
}

function flutterInstructions(projectName: string): string {
  return `---
applyTo: '**/*.dart'
description: Flutter + Dart + Riverpod conventions for ${projectName}.
---

# Stack conventions — ${projectName}

See \`conventions://flutter\` in the ardeemcp MCP server for the full conventions reference.

## Quick reference
- Riverpod with @riverpod code generation — run build_runner after changes
- Dumb Widget Pattern: leaf widgets accept typed props only, no provider consumption
- Immutable state classes: copyWith(), ==, hashCode required
- context.mounted check after every async gap before using context
- All Firestore access through service classes in \`lib/services/firebase/\`

## Decisions log
\`../ardeeportal/docs/notes/decisions.md\` (DEC-NNN sequential)
`;
}

function nodejsInstructions(projectName: string): string {
  return `---
applyTo: '**/*.ts'
description: Node.js TypeScript CLI conventions for ${projectName}.
---

# Stack conventions — ${projectName}

See \`conventions://nodejs-cli\` in the ardeemcp MCP server for the full conventions reference.

## Quick reference
- TypeScript strict mode
- Validate ALL env vars at startup — exit(1) if missing
- process.stderr for logs, process.stdout for data output
- Wrap main() in try/catch — process.exit(1) on error

## Decisions log
\`../ardeeportal/docs/notes/decisions.md\` (DEC-NNN sequential)
`;
}

function agentsMd(projectName: string, stack: string): string {
  const stackSection = stack === 'nextjs'
    ? `## Stack\nNext.js 15 App Router, TypeScript, MUI v7, Firebase Auth + Firestore`
    : stack === 'flutter'
    ? `## Stack\nFlutter, Dart, Riverpod (code generation), Firebase`
    : `## Stack\nNode.js, TypeScript (strict), CLI`;

  return `# ${projectName} — AI Agent Instructions

## Read these first
1. \`README.md\` — repo overview & setup
2. \`.github/instructions/\` — stack conventions and process instructions

${stackSection}

## Conventions
Stack conventions are available as MCP Resources at \`mcp.riverregionai.com\`:
- \`conventions://${stack}\`
- \`conventions://manifest\` — check for convention drift

## Decisions & changelog
All decisions funnel to \`../ardeeportal/docs/notes/decisions.md\` (DEC-NNN sequential).
Changelog: \`../ardeeportal/docs/notes/CHANGELOG.md\`

## Before you PR
- Run linter / analyzer and resolve all warnings
- Update \`../ardeeportal/docs/notes/CHANGELOG.md\` if a feature shipped
- Update \`../ardeeportal/docs/notes/decisions.md\` if a meaningful architectural choice was made
`;
}

export function registerSetupPrompts(server: McpServer): void {

  server.registerPrompt(
    'setup-project',
    {
      description: 'Scaffold a complete .github/instructions/ kit + AGENTS.md for a new project. Sets up all always-on conventions, decision capture, documentation, and error capture instructions.',
      argsSchema: {
        projectName: z.string().describe('Project name, e.g. "my-app"'),
        stack: z.enum(['nextjs', 'flutter', 'nodejs-cli']).describe('Primary tech stack'),
      },
    },
    ({ projectName, stack }) => {
      const stackInstructions = stack === 'nextjs'
        ? nextjsInstructions(projectName)
        : stack === 'flutter'
        ? flutterInstructions(projectName)
        : nodejsInstructions(projectName);

      const stackFilename = stack === 'nextjs'
        ? 'nextjs-firebase.instructions.md'
        : stack === 'flutter'
        ? 'flutter-firebase.instructions.md'
        : 'nodejs-cli.instructions.md';

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Scaffold a complete .github/instructions/ kit for project: **${projectName}** (stack: ${stack})

Create these files exactly as specified below:

---
**File: .github/instructions/decision-capture.instructions.md**
\`\`\`
${decisionCaptureInstructions}
\`\`\`

---
**File: .github/instructions/documentation.instructions.md**
\`\`\`
${documentationInstructions}
\`\`\`

---
**File: .github/instructions/error-capture.instructions.md**
\`\`\`
${errorCaptureInstructions}
\`\`\`

---
**File: .github/instructions/${stackFilename}**
\`\`\`
${stackInstructions}
\`\`\`

---
**File: AGENTS.md**
\`\`\`
${agentsMd(projectName, stack)}
\`\`\`

---
**File: CLAUDE.md**
\`\`\`
See [AGENTS.md](./AGENTS.md) for project rules and AI agent guidance.
\`\`\`

After creating all files, confirm the full list of created files.`,
          },
        }],
      };
    }
  );

  server.registerPrompt(
    'check-conventions',
    {
      description: 'Detect convention drift — compare this repo\'s .github/instructions/ files against the current ardeemcp conventions manifest and report what is stale.',
      argsSchema: {},
    },
    () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Check this repo's conventions for drift against the current ardeemcp server.

Steps:
1. Read \`conventions://manifest\` — this gives you the current canonical convention hashes
2. Read each file in \`.github/instructions/\` in this repo
3. For each stack-specific instructions file (nextjs-firebase, flutter-firebase, nodejs-cli), compare its embedded conventions summary against the manifest hashes
4. Report:
   - **Up to date**: files that match current conventions
   - **Stale**: files that appear out of date (conventions may have changed since this kit was generated)
   - **Missing**: expected instruction files that don't exist in this repo

5. For any stale or missing files, suggest running \`/setup-project\` with the appropriate stack to regenerate them.

Current manifest hashes for reference:
${JSON.stringify(
  Object.entries(stackConventionsMap).map(([name, content]) => ({
    uri: `conventions://${name}`,
    hash: hash(content),
  })),
  null, 2
)}`,
        },
      }],
    })
  );
}
