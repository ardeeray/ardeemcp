import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerNodejsPrompts(server: McpServer): void {

  server.registerPrompt(
    'new-cli-command',
    {
      description: 'Scaffold a Node.js / TypeScript CLI command with env validation and error handling.',
      argsSchema: {
        name: z.string().describe('Command name in kebab-case, e.g. "export-data"'),
        description: z.string().describe('What this command does'),
        args: z.string().optional().describe('Arguments/options, e.g. "--output <path>, --dry-run"'),
      },
    },
    ({ name, description, args }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Read conventions://nodejs-cli first.

Scaffold a CLI command:

Name: ${name}
Purpose: ${description}
${args ? `Arguments/options: ${args}` : ''}

Requirements:
- TypeScript strict mode
- Validate ALL required env vars at the top of the file using a validateEnv() function — exit(1) if missing
- Use process.stderr for logs/status output, process.stdout for data output (pipeable)
- Wrap main logic in async main() with try/catch — process.exit(1) on error
- If using commander or yargs, define the command with typed options
- All env vars read once at startup and passed as config — never access process.env in business logic
- Place in \`src/commands/${name}.ts\``,
        },
      }],
    })
  );
}
