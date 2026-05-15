import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFlutterBootstrapPrompt } from './flutter-app.js';
import { registerNextjsBootstrapPrompt } from './nextjs-app.js';
import { registerProjectPairPrompt } from './project-pair.js';
import { registerFirebaseProjectPrompt } from './firebase-project.js';

export function registerBootstrapPrompts(server: McpServer): void {
  registerFlutterBootstrapPrompt(server);
  registerNextjsBootstrapPrompt(server);
  registerProjectPairPrompt(server);
  registerFirebaseProjectPrompt(server);
}
