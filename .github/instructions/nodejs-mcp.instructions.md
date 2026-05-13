---
applyTo: '**/*.ts'
description: Node.js TypeScript server conventions for ardeemcp.
---

# Stack conventions — ardeemcp (Node.js TypeScript MCP Server)

> Full MCP SDK patterns (server architecture, resource/tool/prompt registration, auth, Firebase Admin, Zod validation, dual transport) are in MCP resource `conventions://nodejs-mcp-server`.

## ardeemcp file layout

```
src/
├── lib/
│   └── firebase.ts          # Firebase Admin init
├── middleware/
│   └── auth.ts              # Bearer token auth, injects projectId
├── prompts/
│   ├── index.ts             # registerPrompts()
│   ├── nextjs/index.ts
│   ├── flutter/index.ts
│   ├── nodejs/index.ts
│   └── setup/index.ts
├── resources/
│   ├── index.ts             # registerResources()
│   ├── nextjs.ts
│   ├── flutter.ts
│   ├── cloud-functions.ts
│   ├── nodejs-cli.ts
│   └── manifest.ts
├── tools/
│   ├── index.ts             # registerTools(server, projectId)
│   └── generate-image.ts
└── server.ts                # Entry point, dual transport
```

## Security (project-specific invariants)

- Never log bearer tokens.
- `projectId` from auth token only — never from request body or URL params.
- All Firebase Admin credentials via env vars (never hard-coded).
