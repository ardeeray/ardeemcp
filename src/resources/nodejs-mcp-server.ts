export const nodejsMcpServerConventions = `# Node.js TypeScript MCP Server Conventions

## Project setup

- TypeScript strict mode (\`strict: true\` in tsconfig)
- ESM modules (\`"type": "module"\` in package.json, \`NodeNext\` module resolution)
- Validate ALL env vars at startup — throw (or exit 1) if missing — never silently ignore

## MCP server architecture

- **One \`McpServer\` per session** — create a new instance per authenticated connection.
- **Dual transport**: \`StreamableHTTPServerTransport\` for HTTP/SSE (production), \`StdioServerTransport\` for local dev (\`--transport=stdio\` flag).
- Register resources, tools, and prompts by calling registration functions on the server instance:

\`\`\`ts
const server = new McpServer({ name: "my-server", version: "1.0.0" });
registerResources(server);
registerTools(server, projectId);
registerPrompts(server);
\`\`\`

## Resources

- URI scheme: \`conventions://<name>\`
- Each resource is a plain string export in its own file, registered via:

\`\`\`ts
server.registerResource(
  "name",
  "conventions://name",
  { title: "Display Name", description: "...", mimeType: "text/plain" },
  async () => ({ contents: [{ uri: "conventions://name", text: resourceContent }] })
);
\`\`\`

## Tools

- Define input shape with Zod schema:

\`\`\`ts
server.registerTool(
  "tool_name",
  { title: "...", description: "...", inputSchema: z.object({ prompt: z.string() }) },
  async ({ prompt }) => {
    return { content: [{ type: "text", text: result }] };
  }
);
\`\`\`

- Validate all inputs with Zod — never trust raw input.
- Return \`{ content: [{ type: "text", text: "..." }] }\` for text results.
- Return \`{ content: [{ type: "image", data: base64, mimeType: "image/..." }] }\` for images.
- \`isError: true\` in the return value signals a tool error to the client.

## Prompts

- Register via \`server.registerPrompt()\` with a Zod input schema.
- Return \`{ messages: [{ role: "user", content: { type: "text", text: "..." } }] }\`.

## Authentication

- Extract \`projectId\` from the bearer token map only — never from request body or URL params.
- Bearer token middleware must run before any MCP handler.
- Never log bearer tokens.

## Firebase Admin

- Initialize lazily via an \`initFirebase()\` guard — call before any Admin SDK usage.
- All Firebase Admin credentials come from env vars (never hard-coded).
- Keep Firebase init in a dedicated \`src/lib/firebase.ts\` module.

## Security

- \`projectId\` from auth token only — never accept it from the caller.
- Sanitize all inputs before using in storage paths or Firestore queries.
- All Firebase Admin credentials via env vars.
`;
