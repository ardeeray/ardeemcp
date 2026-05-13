import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'crypto';
import 'dotenv/config';

import { authMiddleware, type AuthenticatedRequest } from './middleware/auth.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';
import { registerTools } from './tools/index.js';

const transport = process.argv.includes('--transport=stdio') ? 'stdio' : 'sse';

function createMcpServer(projectId = 'local'): McpServer {
  const server = new McpServer({
    name: 'ardeemcp',
    version: '1.0.0',
  });

  registerResources(server);
  registerPrompts(server);
  registerTools(server, projectId);

  return server;
}

async function startStdio(): Promise<void> {
  const server = createMcpServer();
  const t = new StdioServerTransport();
  await server.connect(t);
  process.stderr.write('ardeemcp running on stdio\n');
}

async function startSse(): Promise<void> {
  const app = express();
  app.use(express.json());
  app.use(authMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });

// Session store: maps sessionId → { transport, projectId }
  const sessions = new Map<string, { transport: StreamableHTTPServerTransport; projectId: string }>();

  app.all('/mcp', async (req: AuthenticatedRequest, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const projectId = req.projectId ?? 'unknown';

    if (req.method === 'POST' && !sessionId) {
      // New session
      const t = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });
      const server = createMcpServer(projectId);

      t.onclose = () => {
        if (t.sessionId) sessions.delete(t.sessionId);
      };

      await server.connect(t);
      if (t.sessionId) sessions.set(t.sessionId, { transport: t, projectId });
      await t.handleRequest(req, res, req.body);
      return;
    }

    if (sessionId) {
      const session = sessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      await session.transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({ error: 'Missing mcp-session-id header for non-init request' });
  });

  const port = parseInt(process.env.PORT ?? '3000', 10);
  app.listen(port, '0.0.0.0', () => {
    process.stderr.write(`ardeemcp running on port ${port}\n`);
  });
}

if (transport === 'stdio') {
  await startStdio();
} else {
  await startSse();
}
