# ardeemcp — AI Agent Instructions

## What this is
`ardeemcp` is the hosted MCP (Model Context Protocol) server for the ardeej ecosystem. It provides:
- **Resources** — conventions reference for Next.js, Flutter, Cloud Functions, Node.js CLI
- **Prompts** — slash commands for scaffolding routes, widgets, providers, cloud functions, and new project kits
- **Tools** — `generate_image` (Imagen 3 → Firebase Storage → Firestore)

Deployed at `https://mcp.riverregionai.com/mcp` on GCP Cloud Run (`us-central1`).

## Read these first

1. `README.md` — setup & local dev
2. `.github/instructions/nodejs-mcp.instructions.md` — stack conventions, file layout, auth pattern
3. `src/server.ts` — dual transport entry point (SSE + stdio)
4. `src/middleware/auth.ts` — per-project token auth

## Tech stack

- Node.js 20, TypeScript (strict, ESM, NodeNext)
- `@modelcontextprotocol/sdk` — `McpServer`, `StreamableHTTPServerTransport`, `StdioServerTransport`
- Express — HTTP server wrapper for SSE transport
- `@google/genai` — Imagen 3 image generation
- `firebase-admin` — Firestore + Storage writes
- Zod — all input validation

## Key architectural rules

1. **One McpServer per session** — `createMcpServer(projectId)` in server.ts
2. **projectId from token only** — NEVER accept it from request body/URL
3. **Tools receive projectId via closure** — `registerTools(server, projectId)`
4. **Firebase init is lazy** — call `initFirebase()` before any Admin SDK usage
5. **Dual transport** — `--transport=stdio` flag for local dev, SSE for production

## Decisions & changelog

All decisions: `../ardeeportal/docs/notes/decisions.md` (DEC-NNN sequential)  
Changelog: `../ardeeportal/docs/notes/CHANGELOG.md`

## Before you PR

- `npm run build` must pass without errors
- `npm run lint` must pass
- Update `../ardeeportal/docs/notes/CHANGELOG.md` if a feature shipped
- Update `../ardeeportal/docs/notes/decisions.md` if an architectural choice was made
