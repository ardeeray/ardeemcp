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

function decisionCaptureInstructions(portalRepoName: string): string {
  return `---
applyTo: '**'
description: Process for capturing architectural decisions (DEC-NNN) and changelog entries with mid-task signal detection.
---

# Decision capture

> Full process (mid-task signals, interview sequence, entry format, linkback syntax) is in MCP resource [\`conventions://decision-capture\`](https://mcp.riverregionai.com/mcp).

## Project defaults

| Setting | Value |
|---|---|
| **Decisions file** | \`../${portalRepoName}/docs/notes/decisions.md\` |
| **Changelog file** | \`../${portalRepoName}/docs/notes/CHANGELOG.md\` |

Add this field to every entry: **\`Repos: <this-repo> | ${portalRepoName} | both\`**.
`;
}

const documentationInstructions = `---
applyTo: '**'
description: Documentation standards — Key concepts Q&A format, doc-worthy triggers, and Manual fallback section requirements.
---

# Documentation standards

> Full standards (Key concepts Q&A format, doc-worthy triggers, Manual fallback requirements, runbook quality bar, status stamps, destructive script rules, security note) are in MCP resource [\`conventions://documentation-standards\`](https://mcp.riverregionai.com/mcp).

Add project-specific doc-worthy triggers below as the project grows.
`;

function errorCaptureInstructions(portalRepoName: string): string {
  return `---
applyTo: '**'
description: Process for documenting recurring errors — only on explicit user request.
---

# Error capture

> Full process (when to document, dedup rule, entry format, section structure, lookup steps) is in MCP resource [\`conventions://error-capture\`](https://mcp.riverregionai.com/mcp).

**Errors file:** \`../${portalRepoName}/docs/developer/errors.md\`
`;
}

function nextjsInstructions(projectName: string): string {
  return `---
applyTo: '**/*.{ts,tsx}'
description: Next.js 15 App Router + Firebase conventions for ${projectName}.
---

# Stack conventions — ${projectName}

> Stack rules (Server vs Client components, Zod validation, MUI v7, Firebase Auth session-cookie pattern, adminDb helpers, env-var safety) are in MCP resource [\`conventions://nextjs\`](https://mcp.riverregionai.com/mcp). Related: [\`conventions://firebase-auth\`](https://mcp.riverregionai.com/mcp), [\`conventions://firestore-server\`](https://mcp.riverregionai.com/mcp).

Add project-specific overrides below as needed.
`;
}

function flutterInstructions(projectName: string): string {
  return `---
applyTo: '**/*.dart'
description: Flutter + Dart + Riverpod conventions for ${projectName}.
---

# Stack conventions — ${projectName}

> Stack rules (Riverpod with code generation, Dumb Widget Pattern, immutable state classes, context.mounted discipline, async/error handling) are in MCP resource [\`conventions://flutter\`](https://mcp.riverregionai.com/mcp). Related: [\`conventions://three-layer-architecture\`](https://mcp.riverregionai.com/mcp).

Add project-specific overrides below as needed.
`;
}

function nodejsInstructions(projectName: string): string {
  return `---
applyTo: '**/*.ts'
description: Node.js TypeScript CLI conventions for ${projectName}.
---

# Stack conventions — ${projectName}

> Stack rules (TypeScript strict mode, env-var validation at startup, stderr/stdout discipline, top-level error handling) are in MCP resource [\`conventions://nodejs-cli\`](https://mcp.riverregionai.com/mcp).

Add project-specific overrides below as needed.
`;
}

function agentsMd(projectName: string, stack: string, portalRepoName: string): string {
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
All decisions funnel to \`../${portalRepoName}/docs/notes/decisions.md\` (DEC-NNN sequential).
Changelog: \`../${portalRepoName}/docs/notes/CHANGELOG.md\`

## Before you PR
- Run linter / analyzer and resolve all warnings
- Update \`../${portalRepoName}/docs/notes/CHANGELOG.md\` if a feature shipped
- Update \`../${portalRepoName}/docs/notes/decisions.md\` if a meaningful architectural choice was made
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
        portalRepoName: z.string().optional().describe('Companion portal repo name used in cross-repo doc paths (default: ardeeportal)'),
      },
    },
    ({ projectName, stack, portalRepoName = 'ardeeportal' }) => {
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
${decisionCaptureInstructions(portalRepoName)}
\`\`\`

---
**File: .github/instructions/documentation.instructions.md**
\`\`\`
${documentationInstructions}
\`\`\`

---
**File: .github/instructions/error-capture.instructions.md**
\`\`\`
${errorCaptureInstructions(portalRepoName)}
\`\`\`

---
**File: .github/instructions/${stackFilename}**
\`\`\`
${stackInstructions}
\`\`\`

---
**File: AGENTS.md**
\`\`\`
${agentsMd(projectName, stack, portalRepoName)}
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
