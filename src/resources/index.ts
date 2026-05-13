import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { nextjsConventions } from './nextjs.js';
import { flutterConventions } from './flutter.js';
import { cloudFunctionsConventions } from './cloud-functions.js';
import { nodejsCliConventions } from './nodejs-cli.js';
import { firebaseAuthConventions } from './firebase-auth.js';
import { firestoreServerConventions } from './firestore-server.js';
import { threeLayerArchitectureConventions } from './three-layer-architecture.js';
import { documentationStandardsConventions } from './documentation-standards.js';
import { decisionCaptureConventions } from './decision-capture.js';
import { nodejsMcpServerConventions } from './nodejs-mcp-server.js';
import { errorCaptureConventions } from './error-capture.js';
import { stubPatternConventions } from './stub-pattern.js';
import { securityReviewConventions } from './security-review.js';
import { manifestResource } from './manifest.js';

export function registerResources(server: McpServer): void {
  server.registerResource(
    'conventions-nextjs',
    'conventions://nextjs',
    { description: 'Next.js 15 App Router conventions for this project suite', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://nextjs', text: nextjsConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-flutter',
    'conventions://flutter',
    { description: 'Flutter + Dart + Riverpod conventions for this project suite', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://flutter', text: flutterConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-cloud-functions',
    'conventions://cloud-functions',
    { description: 'Firebase Cloud Functions 2nd-gen conventions', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://cloud-functions', text: cloudFunctionsConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-nodejs-cli',
    'conventions://nodejs-cli',
    { description: 'Node.js / TypeScript CLI conventions', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://nodejs-cli', text: nodejsCliConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-firebase-auth',
    'conventions://firebase-auth',
    { description: 'Firebase Auth session-cookie pattern, client/admin SDK boundary, and middleware protection', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://firebase-auth', text: firebaseAuthConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-firestore-server',
    'conventions://firestore-server',
    { description: 'Firestore server-side patterns: adminDb helpers, query shape, validation, and security rules', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://firestore-server', text: firestoreServerConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-three-layer-architecture',
    'conventions://three-layer-architecture',
    { description: 'Three-layer architecture (UI / State / Service) for Flutter + Riverpod', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://three-layer-architecture', text: threeLayerArchitectureConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-documentation-standards',
    'conventions://documentation-standards',
    { description: 'Documentation standards: Key concepts format, doc-worthy triggers, Manual fallback requirements', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://documentation-standards', text: documentationStandardsConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-decision-capture',
    'conventions://decision-capture',
    { description: 'Decision capture process: DEC-NNN interview, entry format, changelog, and linkback comments', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://decision-capture', text: decisionCaptureConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-nodejs-mcp-server',
    'conventions://nodejs-mcp-server',
    { description: 'Node.js TypeScript MCP server patterns: McpServer architecture, resource/tool/prompt registration, dual transport, auth, Firebase Admin', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://nodejs-mcp-server', text: nodejsMcpServerConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-error-capture',
    'conventions://error-capture',
    { description: 'Error capture process: when to document, dedup rule, H3 entry format, section structure, and lookup steps', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://error-capture', text: errorCaptureConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-stub-pattern',
    'conventions://stub-pattern',
    { description: 'Mock/Real stub pattern for swappable service implementations (Flutter + Portal)', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://stub-pattern', text: stubPatternConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-security-review',
    'conventions://security-review',
    { description: 'Security review checklist: auth, Firestore rules, API routes, Cloud Functions, env, headers, OWASP Top 10', mimeType: 'text/plain' },
    async () => ({ contents: [{ uri: 'conventions://security-review', text: securityReviewConventions, mimeType: 'text/plain' }] })
  );

  server.registerResource(
    'conventions-manifest',
    'conventions://manifest',
    { description: 'Manifest of all convention resources with content hashes for drift detection', mimeType: 'application/json' },
    async () => ({ contents: [{ uri: 'conventions://manifest', text: JSON.stringify(manifestResource(), null, 2), mimeType: 'application/json' }] })
  );
}
