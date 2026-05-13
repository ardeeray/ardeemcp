export const errorCaptureConventions = `# Error Capture Conventions

## When to document

Only write an error entry when the user **explicitly asks** to record the error.
Do not create entries proactively.

---

## Dedup rule

Before creating a new entry, scan the errors file for an existing entry with
the same title or a highly similar error message. If a match is found, **update
the existing entry** rather than creating a duplicate.

---

## Entry format

Write each error as an H3 heading:

\`\`\`markdown
### Error title (short, searchable)

**Quick fix:** One-line command or code change to resolve the error immediately.

**Full error:**
\`\`\`
Paste the exact error message or stack trace here.
\`\`\`

**Fix steps:**
1. Step one
2. Step two
3. …
\`\`\`

---

## Section structure

Group entries under H2 category headings when the file grows large
(e.g. \`## Firebase\`, \`## Build\`, \`## Dart\`, \`## Auth\`).
For small files, flat H3 entries are fine.

---

## Looking up an error

When a user references a known error or says "check the errors file for X":

1. Read the project's errors file (path defined in the project's instruction file).
2. Scan for an H3 heading that matches the error title or contains the error text.
3. Return the full entry (quick fix + steps).
`;
