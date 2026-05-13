import { createHash } from 'crypto';
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

function hash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 12);
}

export interface ConventionEntry {
  uri: string;
  name: string;
  hash: string;
}

export function manifestResource(): { version: string; conventions: ConventionEntry[] } {
  return {
    version: '1.0.0',
    conventions: [
      { uri: 'conventions://nextjs', name: 'Next.js 15 App Router', hash: hash(nextjsConventions) },
      { uri: 'conventions://flutter', name: 'Flutter + Dart + Riverpod', hash: hash(flutterConventions) },
      { uri: 'conventions://cloud-functions', name: 'Firebase Cloud Functions 2nd-gen', hash: hash(cloudFunctionsConventions) },
      { uri: 'conventions://nodejs-cli', name: 'Node.js / TypeScript CLI', hash: hash(nodejsCliConventions) },
      { uri: 'conventions://firebase-auth', name: 'Firebase Auth — Session Cookie Pattern', hash: hash(firebaseAuthConventions) },
      { uri: 'conventions://firestore-server', name: 'Firestore — Server-Side Patterns', hash: hash(firestoreServerConventions) },
      { uri: 'conventions://three-layer-architecture', name: 'Three-Layer Architecture (Flutter + Riverpod)', hash: hash(threeLayerArchitectureConventions) },
      { uri: 'conventions://documentation-standards', name: 'Documentation Standards', hash: hash(documentationStandardsConventions) },
      { uri: 'conventions://decision-capture', name: 'Decision Capture Process (DEC-NNN)', hash: hash(decisionCaptureConventions) },
      { uri: 'conventions://nodejs-mcp-server', name: 'Node.js TypeScript MCP Server', hash: hash(nodejsMcpServerConventions) },
      { uri: 'conventions://error-capture', name: 'Error Capture Process', hash: hash(errorCaptureConventions) },
      { uri: 'conventions://stub-pattern', name: 'Mock/Real Stub Pattern (Flutter + Portal)', hash: hash(stubPatternConventions) },
      { uri: 'conventions://security-review', name: 'Security Review Checklist', hash: hash(securityReviewConventions) },
    ],
  };
}
