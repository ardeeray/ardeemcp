export const decisionCaptureConventions = `# Decision Capture Process (DEC-NNN)

## Purpose

Record *why* a technical choice was made, not just *what* was chosen.
Decisions that lack documented rationale get relitigated, reversed by accident,
or repeated. A light log entry is better than a perfect one written never.

---

## Mid-task — detect decision signals

Watch for these signals during any task. When one fires, probe **immediately**
— one question at a time, do not wait until the end of the task:

- Developer says "I don't want to use X" / "let's not do Y"
- Developer says "should we use X or Y?"
- A choice between two or more libraries/approaches is visible in the code
- A file or feature is being deleted or removed rather than changed
- Message contains "because" or "since" explaining a choice

---

## Deep interview (sequential — one question at a time)

Present context-aware suggested answers inferred from the current task.
Always include a "Something else — I'll describe it" option. Wait for the
response before asking the next question.

1. **"What alternatives did you consider?"**
   — suggest the most likely competing libraries or approaches given the context

2. **For each rejected alternative:** "Why did you reject [X]?"
   — suggest 3–4 rejection reasons tailored to that specific option
   — loop through all rejected options before moving to Q3

3. **"Are there any risks you're accepting with this choice?"**
   — suggest plausible risks based on the chosen approach

4. **"Is there a condition that would make you revisit this?"**
   — suggest realistic trigger conditions (e.g. scaling threshold, dependency
   drops support, competitor ships a feature)

---

## When to write a decision entry vs. a changelog entry

**Decision entry** — when rationale is worth preserving:
- Choosing one library/framework/pattern over a viable alternative
- Permanently removing or deferring a planned feature
- Changing an established architectural pattern
- Security policy choice
- Cross-system contract design (field naming, schema, shared types, API shape)

**Changelog entry** — every notable change, regardless of whether there is a
decision entry:
- Any feature that ships (complete, not stubbed)
- Any feature that is permanently removed or deferred
- Notable technical change: library swap, architectural shift, major dependency bump

---

## Decision entry format

\`\`\`markdown
## DEC-NNN [YYYY-MM-DD] Short title
**Category**: Architecture | Feature scope | Library | Security | Cross-system contract
**Context**: Why this decision came up
**Decision**: What was decided
**Alternatives considered**: Option A (rejected: reason); Option B (rejected: reason)
**Rationale**: Why this choice over the alternatives
**Risks accepted**: Known downsides being lived with
**Revisit when**: Condition that would change this decision
**Affected**: path/to/file.ts, path/to/other.dart
\`\`\`

**Numbering**: Read existing \`## DEC-NNN\` headings in the decisions file to
find the next available number. Newest entry goes at the top of the file.

---

## Changelog entry format

\`\`\`markdown
## [YYYY-MM-DD] Short summary
**Type**: Feature | Technical | Removal | Deferral
**Summary**: One-liner description of the change
**Related decision**: DEC-NNN (omit if none)
\`\`\`

---

## Linkback comments

After writing a decision entry, add a comment near the relevant code pointing
back to the entry.

| Language | Format |
|----------|--------|
| TypeScript / JavaScript / Dart / Java / Swift | \`// Decision: DEC-NNN <path-to-decisions-file>#dec-nnn\` |
| Python / Shell / YAML / TOML | \`# Decision: DEC-NNN <path-to-decisions-file>#dec-nnn\` |
| HTML / XML / Markdown | \`<!-- Decision: DEC-NNN <path-to-decisions-file>#dec-nnn -->\` |

Anchor format: heading \`## DEC-001 [...]\` → anchor \`#dec-001\`
(lowercase, spaces to hyphens, strip brackets and other punctuation).

---

## End-of-task checklist

After completing any task where a decision was made:

1. Draft a decision entry and ask: *Should I add this to the decisions log?*
2. If a feature shipped or a notable technical change was made, ask separately:
   *Should I add a changelog entry?*
3. For source files touched by the decision, propose a linkback comment.
`;
