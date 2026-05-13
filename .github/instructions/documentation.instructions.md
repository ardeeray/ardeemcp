---
applyTo: '**'
description: Documentation standards — Key concepts Q&A format, doc-worthy triggers, and Manual fallback section requirements.
---

# Documentation standards

> Generic standards (Key concepts Q&A format, Manual fallback requirements, runbook quality bar, script header template, status stamps, destructive script rules, doc structure, security note) are in MCP resource `conventions://documentation-standards`.

## Doc-worthy triggers (ardeemcp-specific)

Ask at end of task if any apply:
- New MCP resource, tool, or prompt
- New or changed auth pattern or token format
- New environment variable or required config
- Breaking change to server transport or session handling
- A concept that required mid-task clarification

**Not doc-worthy:** bug fixes, copy tweaks, dependency bumps, test-only changes.

## Doc store

| Change type | Default store |
|---|---|
| Architecture, transport, auth | Repo (`../ardeeportal/docs/architecture/`) |
| Runbooks, ops, deployment | Firestore `adminDocs` or repo `../ardeeportal/docs/deploy/` |
