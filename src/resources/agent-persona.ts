export const agentPersonaConventions = `# Agent Persona Files (\`.github/agents/*.agent.md\`)

A persona file defines a specialist sub-agent that the main coding agent can delegate to. Each persona scopes its expertise to one domain (Cloud Functions, Firestore schema, deployment, etc.) and enforces project-specific rules that would otherwise get lost in the noise of a general-purpose agent.

VS Code surfaces persona files as selectable agents in the chat picker.

---

## File location & discovery

Persona files live at \`.github/agents/<slug>.agent.md\` in the workspace root. The filename slug becomes part of the agent identifier; the human-readable name is in the frontmatter.

---

## Required frontmatter

\`\`\`yaml
---
name: Cloud Function Engineer
description: Use when creating, modifying, or debugging Firebase Cloud Functions. Handles 2nd-gen callable and scheduled functions, deployment, environment config, and the functions catalogue docs.
---
\`\`\`

- **\`name\`** — Title-Cased role label shown in the agent picker.
- **\`description\`** — Single sentence starting with "Use when…". This is the only signal the main agent has when deciding whether to delegate. Be specific about triggers.

---

## Required body sections (in order)

### 1. Opening paragraph

One short paragraph stating who the persona is, what platform/stack it owns, and where the canonical sources of truth for that domain live.

> Example: "You are a Firebase Cloud Functions expert for the ardeej platform. All functions use the Firebase Functions SDK v2 (2nd-gen). Functions live in \`functions/\` and the catalogue is documented at \`docs/functions/overview.md\`."

### 2. \`## Your responsibilities\`

A bulleted list, 4–8 items, of what this persona will and will not handle. Use action verbs (Scaffold, Review, Manage, Advise). If the persona should refuse a category of request, list it explicitly here.

### 3. \`## Key files to read before any <X> work\`

Numbered list of the 3–6 files the persona must consult before producing output. These are the project-specific knowledge anchors that the main agent might miss. Always include the canonical schema, catalogue, or interface doc for the domain.

### 4. \`## <Domain-specific scaffold patterns>\` (optional but recommended)

Code blocks showing the canonical shape of the artifacts the persona produces (function signatures, model classes, route handlers, etc.). Include the boilerplate the persona must always emit.

### 5. \`## Rules you must enforce\`

Bulleted list of hard rules — the things that, if violated, the work must be rejected. These are typically security or contract invariants (no hard-coded secrets, no client-side admin SDK, no schema changes without checking the cross-repo contract, etc.).

### 6. \`## Output format\`

Numbered list specifying exactly what artifacts the persona returns for a typical request: which files to write/edit, which catalogue entries to update, which env vars to surface to the operator. Without this section, the persona's output drifts.

### 7. \`## Decision capture\`

One short paragraph stating which category of work in this domain is **automatically** decision-worthy (logged to the project's \`decisions.md\`) and what \`Category:\` field it should use. This makes the persona an active participant in the decision-capture process rather than a passive consumer.

---

## Style rules

- Write in second person ("You are…", "You must…", "You will…"). The persona is being addressed, not described.
- Imperative voice for rules ("Never hard-code secrets" — not "Secrets should not be hard-coded").
- Cite file paths with backticks; prefer workspace-relative paths.
- Never include credentials, secret values, or live URLs to staging/prod resources.
- Keep the file under ~150 lines. If it grows larger, the persona is doing too much — split it.

---

## Anti-patterns

- ❌ Personas without a \`description\` starting with "Use when…" — the main agent cannot route to them.
- ❌ Personas that duplicate stack-level conventions already in a \`conventions://...\` MCP resource. Reference the resource instead.
- ❌ Personas that span multiple unrelated domains ("Backend Engineer"). Split into one-per-domain.
- ❌ Personas that emit code without a \`## Rules you must enforce\` section. Rules are the whole point.
- ❌ Personas with no \`## Decision capture\` section in projects that have a decisions log. The persona then silently bypasses the capture process.

---

## Linkbacks

Persona files reference \`conventions://...\` MCP resources for stack-level rules. They contain only the project-specific overrides and the operational discipline (responsibilities, output format, decision capture) that are unique to that role.
`;
