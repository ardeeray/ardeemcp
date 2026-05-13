import { Request, Response, NextFunction } from 'express';

interface TokenConfig {
  projectId: string;
  token: string;
}

interface AuthenticatedRequest extends Request {
  projectId?: string;
}

function parseTokens(): Map<string, string> {
  const raw = process.env.MCP_TOKENS;
  if (!raw) throw new Error('MCP_TOKENS env var is required');

  const map = new Map<string, string>();
  for (const pair of raw.split(',')) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) throw new Error(`Invalid MCP_TOKENS entry: "${pair}". Expected format: projectId:token`);
    const projectId = pair.slice(0, colonIdx).trim();
    const token = pair.slice(colonIdx + 1).trim();
    if (!projectId || !token) throw new Error(`Invalid MCP_TOKENS entry: "${pair}"`);
    map.set(token, projectId);
  }
  return map;
}

// Parse once at module load — fails fast if env var is missing or malformed
const tokenMap = parseTokens();

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Health check — no auth required
  if (req.path === '/health') {
    next();
    return;
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const projectId = tokenMap.get(token);

  if (!projectId) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Inject projectId — derived from token only, never from caller
  req.projectId = projectId;
  next();
}

export type { AuthenticatedRequest, TokenConfig };
