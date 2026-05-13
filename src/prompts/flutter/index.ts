import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerFlutterPrompts(server: McpServer): void {

  server.registerPrompt(
    'new-riverpod-provider',
    {
      description: 'Scaffold a Riverpod @riverpod AsyncNotifier or Notifier with code generation.',
      argsSchema: {
        name: z.string().describe('Provider name in PascalCase, e.g. "UserProfile"'),
        type: z.enum(['AsyncNotifier', 'Notifier']).describe('AsyncNotifier for async/Firebase data, Notifier for sync state'),
        stateType: z.string().describe('The state type, e.g. "List<Song>", "UserProfile?", "bool"'),
        description: z.string().describe('What this provider manages'),
      },
    },
    ({ name, type, stateType, description }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Read conventions://flutter first.

Scaffold a Riverpod provider:

Name: ${name}
Type: ${type}
State type: ${stateType}
Purpose: ${description}

Requirements:
- Use @riverpod annotation (code generation pattern)
- ${type === 'AsyncNotifier' ? 'Extend AsyncNotifier<' + stateType + '>' : 'Extend Notifier<' + stateType + '>'}
- Implement the build() method
- ${type === 'AsyncNotifier' ? 'Return Future<' + stateType + '> from build()' : 'Return initial state from build()'}
- For any async operations in methods: check context.mounted after every async gap before using context
- Add meaningful error handling — log errors, don't swallow them
- Place file in \`lib/providers/\` in the appropriate sub-folder
- After creating this file, remind the user to run:
  \`flutter pub run build_runner build --delete-conflicting-outputs\``,
        },
      }],
    })
  );

  server.registerPrompt(
    'new-flutter-widget',
    {
      description: 'Scaffold a Flutter widget using the Dumb Widget Pattern — typed props, no Riverpod in leaf widgets.',
      argsSchema: {
        name: z.string().describe('Widget class name in PascalCase, e.g. "SongCard"'),
        props: z.string().describe('Comma-separated props with types, e.g. "String title, String artist, VoidCallback onTap"'),
        description: z.string().describe('What this widget displays or does'),
      },
    },
    ({ name, props, description }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Read conventions://flutter first.

Scaffold a Flutter widget following the Dumb Widget Pattern:

Name: ${name}
Props: ${props}
Purpose: ${description}

Requirements:
- StatelessWidget (or StatefulWidget only if local ephemeral state is genuinely needed)
- Constructor accepts only typed props — NO Riverpod ref, NO context.read(), NO provider consumption
- All data must be passed in via constructor
- Use const constructor where possible
- If displaying a network image: always include an errorBuilder that shows a fallback icon
- Keep build() method lean — extract sub-widgets into separate build methods or classes if > ~50 lines
- Place file in \`lib/widgets/\``,
        },
      }],
    })
  );

  server.registerPrompt(
    'new-flutter-service',
    {
      description: 'Scaffold a Flutter Firebase service using the Mock/Real pattern with context.mounted checks.',
      argsSchema: {
        name: z.string().describe('Service name in PascalCase, e.g. "SongService"'),
        entity: z.string().describe('The Firestore entity/collection this service operates on'),
        operations: z.string().describe('Operations to implement, e.g. "getAll, getById, create, update, delete"'),
      },
    },
    ({ name, entity, operations }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Read conventions://flutter first.

Scaffold a Flutter Firebase service:

Name: ${name}
Entity/Collection: ${entity}
Operations: ${operations}

Requirements:
- Create an abstract interface: \`abstract class ${name}\`
- Create a mock implementation: \`class Mock${name} implements ${name}\` (returns hardcoded test data)
- Create a real Firebase implementation: \`class Firebase${name} implements ${name}\`
- The real implementation uses Firestore from \`lib/services/firebase/\`
- All async methods: check context.mounted after every async gap before using context (if context is involved)
- Log errors with the project logger — don't swallow exceptions
- Place in \`lib/services/firebase/\`
- Wire via Riverpod provider that returns Mock${name} or Firebase${name} based on a flag`,
        },
      }],
    })
  );
}
