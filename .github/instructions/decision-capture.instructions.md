---
applyTo: '**'
description: Process for capturing architectural decisions (DEC-NNN) and changelog entries with mid-task signal detection.
---

# Decision capture

> Full process (mid-task signals, interview sequence, entry formats, linkback syntax) is in MCP resource `conventions://decision-capture`.

## ardeemcp defaults

| Setting | Value |
|---|---|
| **Decisions file** | `../ardeeportal/docs/notes/decisions.md` |
| **Changelog file** | `../ardeeportal/docs/notes/CHANGELOG.md` |

## Additional entry field

Add **`Repos: ardeemcp | ardeeportal | both`** to every decision entry.

## Linkback comment syntax (TypeScript)

```ts
// Decision: DEC-NNN ../ardeeportal/docs/notes/decisions.md#dec-nnn
```
