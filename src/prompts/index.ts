import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerNextjsPrompts } from './nextjs/index.js';
import { registerFlutterPrompts } from './flutter/index.js';
import { registerNodejsPrompts } from './nodejs/index.js';
import { registerSetupPrompts } from './setup/index.js';
import { registerSharedPrompts } from './shared/index.js';
import { registerBootstrapPrompts } from './bootstrap/index.js';

export function registerPrompts(server: McpServer): void {
  registerSharedPrompts(server);
  registerNextjsPrompts(server);
  registerFlutterPrompts(server);
  registerNodejsPrompts(server);
  registerSetupPrompts(server);
  registerBootstrapPrompts(server);
}
