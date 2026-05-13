export const documentationStandardsConventions = `# Documentation Standards

## Key concepts section format

When writing docs for a non-trivial feature, include a "Key concepts" section
near the top with 3–5 Q&A pairs:

\`\`\`markdown
## Key concepts

**Q: [Short question about the most confusing part?]**
A: [Direct answer in 1–3 sentences.]

**Q: [Why does X work this way?]**
A: [Explain the design decision, not just the mechanics.]
\`\`\`

Only include concepts that are genuinely surprising or that have burned
developers before. Skip obvious facts.

---

## Doc-worthy triggers

Ask at the end of a task if any of these apply:

- New feature, screen, or top-level UI surface
- New or changed API route, service, or notable code pattern
- New or changed schema: collection, field, renamed field, changed security rule
- New environment variable or required config
- Breaking refactor that changes how other features should be built
- A concept that required a mid-task clarification (not obvious from existing docs)

**Not doc-worthy:** bug fixes, copy/style tweaks, dependency bumps, test-only
changes, internal refactors with no API surface change.

---

## Manual fallback section requirements

When a task produces a runbook, migration, or ops script, include a
**Manual fallback** section that covers:

1. **When to use** — specific trigger condition (e.g. "if the automated
   migration script fails at step 3")
2. **Inline steps vs. standalone script** — use inline steps when ≤ 5 shell
   commands or ≤ 20 lines total; write a standalone script otherwise
3. **Destructive steps** — add this banner above any irreversible step:
   \`> ⚠️ This step is irreversible — confirm you have a backup before proceeding.\`
4. **Env vars** — list every variable the script needs; never hard-code values:
   \`\`\`bash
   # Required env vars
   export VAR_NAME=<your-value-here>
   \`\`\`
5. **IAM / permissions** — any roles or service accounts required
6. **Rollback** — what to do if the step fails
7. **Expected output** — the terminal output a successful run should produce

---

## Script file header template

\`\`\`bash
#!/usr/bin/env bash
# Script: scripts/<category>/<slug>.sh
# Purpose: <one-line description>
# Usage: <command with flags>
# Required env vars: VAR_ONE, VAR_TWO
# Safe to re-run: yes | no — <reason>
\`\`\`

---

## Security note

Never document credentials, secrets, or environment variable values anywhere
other than \`.env*\` files (which are in \`.gitignore\`). When env vars are
referenced in docs, show only the variable name, never the value.

---

## Runbook quality bar

Every runbook must be usable by a developer arriving with zero prior context:

1. **Prerequisites** — exact tools, versions, env vars, IAM roles, and any one-time setup required before step 1
2. **Copy-pasteable commands** — no ambiguous prose steps; every shell command must be runnable verbatim
3. **Expected output** — 1–10 lines of real terminal output the reader should see to confirm success
4. **Deviation notes** — when actual tool/framework behaviour differs from what it claims, add a \`> ⚠️ DEVIATION\` callout
5. **Rollback** — concrete steps to undo the operation if something goes wrong
6. **\`## Manual fallback\` section** — steps that work without an AI agent

---

## Status stamps

Every phase or step in a runbook must have a **Status** line:

\`\`\`
**Status: complete (YYYY-MM-DD)**
**Status: in progress**
**Status: scaffolding pending**
**Status: deferred**
\`\`\`

This lets a new developer immediately see what is done without reading the
entire doc.

---

## Index docs must be updated when

- A new major feature, screen, or subsystem lands
- A new Firestore collection is introduced
- A new required env var or config file is added
- A new Cloud Function with a public signature is deployed

Index docs to update: \`ONBOARDING.md\` and the relevant \`overview.md\` in
the affected category folder.

---

## Cross-links are mandatory

Every doc must link to related docs and affected source files with
workspace-relative markdown paths (e.g. \`[songs.ts](../../src/lib/firestore/songs.ts)\`).

---

## Destructive helper scripts

When a script writes or deletes data it must include:
1. A \`⚠️\` warning banner at the top
2. A \`--dry-run\` flag (or \`DRY_RUN=1\` env var) that prints what would happen without executing
3. Required IAM roles in a file header comment
4. Env-var placeholders only — never hard-code project IDs or secrets
5. Expected output snippet so the operator can verify success

---

## Doc structure conventions

- Use H2 (\`##\`) for top-level sections, H3 (\`###\`) for subsections.
- Lead with the "why", follow with the "how".
- Prefer tables over bullet lists when comparing options or listing fields.
- Code blocks must specify the language (\`\`\`ts, \`\`\`dart, \`\`\`bash, etc.).
- One blank line between sections.
- Sentences end with periods. Headers do not.
`;
