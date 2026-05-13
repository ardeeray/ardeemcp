import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerNextjsPrompts(server: McpServer): void {

  server.registerPrompt(
    'new-api-route',
    {
      description: 'Scaffold a typed Next.js 15 App Router API route handler with Zod validation and auth check.',
      argsSchema: {
        resource: z.string().describe('Resource name, e.g. "songs"'),
        methods: z.string().describe('HTTP methods to implement, e.g. "GET POST"'),
        auth: z.enum(['public', 'user', 'admin']).describe('Auth requirement'),
      },
    },
    ({ resource, methods, auth }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Read conventions://nextjs first.

Create a new Next.js 15 App Router API route at \`src/app/api/${resource}/route.ts\`.

Methods to implement: ${methods}
Auth requirement: ${auth}

Requirements:
- Validate all inputs with Zod (define schema at top of file)
- Auth check: ${auth === 'public' ? 'no auth required' : auth === 'admin' ? 'verify admin role via session cookie' : 'verify ardeej_session cookie is valid'}
- Use adminDb helper from \`src/lib/firestore/${resource}.ts\` for data access (create the helper too if it doesn't exist)
- Return NextResponse.json() with appropriate status codes
- Handle errors: 400 for bad input, 401 for unauth, 404 for not found, 500 for server errors
- No Firebase Admin imports — all server access goes through adminDb helpers`,
        },
      }],
    })
  );

  server.registerPrompt(
    'new-firestore-helper',
    {
      description: 'Scaffold an adminDb server helper in src/lib/firestore/ for a Firestore collection.',
      argsSchema: {
        collection: z.string().describe('Exact Firestore collection name, e.g. "songs"'),
        operations: z.string().describe('Operations to implement, e.g. "getAll getById create update"'),
      },
    },
    ({ collection, operations }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Read conventions://nextjs first.

Create a Firestore server helper at \`src/lib/firestore/${collection}.ts\`.

Collection: \`${collection}\`
Operations: ${operations}

Requirements:
- Import adminDb from \`src/lib/firebase/admin.ts\`
- Define a Zod schema for the document shape at the top of the file
- Export a TypeScript type derived from the Zod schema
- Implement each requested operation as a named export
- All functions must be async and return typed results
- Never expose this file to client components — server-only
- Handle Firestore errors and return null / throw with context`,
        },
      }],
    })
  );

  server.registerPrompt(
    'new-cloud-function',
    {
      description: 'Scaffold a 2nd-gen Firebase Cloud Function (callable, scheduled, or Firestore trigger).',
      argsSchema: {
        name: z.string().describe('Function name in camelCase, e.g. "generatePlaylistSummary"'),
        trigger: z.enum(['onCall', 'onSchedule', 'onDocumentWritten', 'onDocumentCreated', 'onDocumentUpdated']).describe('Trigger type'),
        description: z.string().describe('What this function does'),
      },
    },
    ({ name, trigger, description }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Read conventions://cloud-functions first.

Scaffold a 2nd-gen Firebase Cloud Function:

Name: ${name}
Trigger: ${trigger}
Purpose: ${description}

Requirements:
- Use firebase-functions v4+ (2nd-gen) imports only
- For onCall: check request.auth before any data access, throw HttpsError for auth/input errors
- For onSchedule: use the schedule string format, no auth check needed
- For document triggers: type the before/after snapshots, handle both create and delete cases
- Validate all inputs with Zod (for callable functions)
- Log errors with logger.error() before throwing
- Never hard-code project IDs or credentials — use defineString params
- Export the function from \`functions/src/index.ts\`
- Region: us-central1`,
        },
      }],
    })
  );

  server.registerPrompt(
    'new-mui-form',
    {
      description: 'Scaffold a MUI v7 + React Hook Form + Zod form component.',
      argsSchema: {
        formName: z.string().describe('Form component name in PascalCase, e.g. "InvestorEditor"'),
        submitTarget: z.string().describe('Submit target, e.g. "PUT /api/admin/investors"'),
        fields: z.string().describe('Comma-separated field names, e.g. "name, email, role"'),
      },
    },
    ({ formName, submitTarget, fields }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Read conventions://nextjs first.

Scaffold a form component: \`${formName}\`

Submit target: ${submitTarget}
Fields: ${fields}

Requirements:
- 'use client' directive at top (form is interactive)
- Define Zod schema for all fields at the top of the file
- Use React Hook Form with zodResolver
- Use MUI v7 components: TextField, Button, Stack, Alert for errors
- Submit via fetch() to ${submitTarget}
- Show loading state on submit button
- Show server error message in an Alert on failure
- Show success state after successful submission
- Export as default named component
- Props: pass in default values for edit mode (undefined for create mode)
- TypeScript: all props and state fully typed`,
        },
      }],
    })
  );
}
