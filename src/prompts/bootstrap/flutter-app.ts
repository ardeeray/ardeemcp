import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerFlutterBootstrapPrompt(server: McpServer): void {
  server.registerPrompt(
    'bootstrap-flutter-app',
    {
      description:
        'Scaffold a full Flutter app skeleton with the three-layer architecture (models/providers/services/screens/widgets), Riverpod code-gen, Firebase init, and the complete .github/instructions/ kit. Always pairs with a companion Next.js portal.',
      argsSchema: {
        projectName: z.string().describe('Flutter project name in snake_case, e.g. "my_app"'),
        portalRepoName: z
          .string()
          .optional()
          .describe('Companion portal repo name (default: [projectName]-portal)'),
        primaryDomain: z
          .string()
          .optional()
          .describe('Primary domain name for the seed service trio, e.g. "catalog" (default: catalog)'),
      },
    },
    ({ projectName, portalRepoName, primaryDomain = 'catalog' }) => {
      const portal = portalRepoName ?? `${projectName}-portal`;
      const displayName = projectName
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const domain = primaryDomain;
      const DomainPascal = domain.charAt(0).toUpperCase() + domain.slice(1);

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Scaffold a new Flutter app called **${projectName}** (companion portal: **${portal}**).

Follow the three-layer architecture from \`conventions://three-layer-architecture\` and all coding rules from \`conventions://flutter\`.

---

## Step 1 — Create the project

Run:
\`\`\`bash
flutter create ${projectName} --org com.example
cd ${projectName}
\`\`\`

---

## Step 2 — Replace pubspec.yaml

Overwrite \`pubspec.yaml\` with:

\`\`\`yaml
name: ${projectName}
description: "${displayName} — a Flutter application."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.7.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  # State management
  hooks_riverpod: any
  riverpod_annotation: any
  flutter_hooks: any
  # Firebase
  firebase_core: any
  firebase_auth: any
  cloud_firestore: any
  firebase_analytics: any
  cloud_functions: any
  google_sign_in: any
  # Utilities
  logging: any
  flutter_dotenv: any
  google_fonts: any
  uuid: any
  http: any
  flutter_secure_storage: any
  rxdart: any

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: any
  riverpod_generator: any
  build_runner: any

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/mock_data/
    - assets/songs/
    - .env
    - .env.staging
\`\`\`

After writing the file run:
\`\`\`bash
flutter pub get
\`\`\`

---

## Step 3 — Replace analysis_options.yaml

\`\`\`yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    avoid_print: true
    prefer_single_quotes: true
\`\`\`

---

## Step 4 — Create asset directories and stub files

\`\`\`bash
mkdir -p assets/images assets/mock_data assets/songs
touch assets/images/.gitkeep assets/mock_data/.gitkeep assets/songs/.gitkeep
\`\`\`

---

## Step 5 — Create .env and .env.staging stubs

**File: .env**
\`\`\`
# Firebase project config — fill in after running terraform apply + generate-env.sh
FIREBASE_PROJECT_ID=
\`\`\`

**File: .env.staging**
\`\`\`
# Staging environment overrides
FIREBASE_PROJECT_ID=
\`\`\`

---

## Step 6 — Replace lib/main.dart

\`\`\`dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logging/logging.dart';

// TODO: add your generated firebase_options.dart here
// import 'config/firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  await dotenv.load(fileName: '.env');

  // Configure logger — output to console in debug, silent in release
  Logger.root.level = Level.ALL;
  Logger.root.onRecord.listen((record) {
    // ignore: avoid_print
    debugPrint('\${record.level.name}: \${record.loggerName}: \${record.message}');
  });

  // Initialize Firebase
  // TODO: uncomment after adding firebase_options.dart
  // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await Firebase.initializeApp();

  // Enable Firestore offline persistence
  FirebaseFirestore.instance.settings = const Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );

  runApp(const ProviderScope(child: ${displayName.replaceAll(' ', '')}App()));
}

class ${displayName.replaceAll(' ', '')}App extends StatelessWidget {
  const ${displayName.replaceAll(' ', '')}App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${displayName}',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const Scaffold(
        body: Center(child: Text('${displayName}')),
      ),
    );
  }
}
\`\`\`

---

## Step 7 — Create lib/ directory structure

Create these empty directories (add a \`.gitkeep\` in each leaf):

\`\`\`
lib/
  config/         # auto-generated Firebase options
  models/
    ${domain}/
  providers/
    ${domain}Providers/
  screens/
  services/
    ${domain}/
  widgets/
  _oldfiles/      # archived/deprecated code — check before re-implementing
\`\`\`

---

## Step 8 — Create lib/ARCHITECTURE.md

\`\`\`markdown
# ${displayName} — mobile architecture

> Cross-repo onboarding: [\`../../${portal}/docs/ONBOARDING.md\`](../../${portal}/docs/ONBOARDING.md)
> Firestore schema source of truth: [\`../../${portal}/docs/firestore/schema.md\`](../../${portal}/docs/firestore/schema.md)

## Three-layer model

\\\`\\\`\\\`
UI layer      →  lib/screens/  lib/widgets/
State layer   →  lib/providers/  (Riverpod, code-generated)
Service layer →  lib/services/  (abstract interface + Real* + Mock*)
\\\`\\\`\\\`

**Rule:** UI never reads from a service directly — always via a provider.
Providers never call Firebase directly — always via a service.

## Build runner

Run after touching any \\\`@riverpod\\\`-annotated file:

\\\`\\\`\\\`bash
flutter pub run build_runner build --delete-conflicting-outputs
\\\`\\\`\\\`

## Directories

| Path | Purpose |
|---|---|
| \\\`lib/config/\\\` | Auto-generated Firebase options |
| \\\`lib/models/\\\` | Data classes, organised by domain |
| \\\`lib/providers/\\\` | Riverpod notifiers, grouped by feature |
| \\\`lib/screens/\\\` | One file per full-page screen |
| \\\`lib/services/\\\` | Abstract + Real + Mock, grouped by domain |
| \\\`lib/widgets/\\\` | Reusable widgets, grouped by feature |
| \\\`lib/_oldfiles/\\\` | Archived/deprecated code — check before re-implementing |
\`\`\`

---

## Step 9 — Create the seed service trio

Create **lib/services/${domain}/${domain}_service.dart** with this exact pattern
(see \`conventions://stub-pattern\` for full details):

\`\`\`dart
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/services.dart';
import 'package:logging/logging.dart';
import '../../models/${domain}/${domain}_item.dart';

// ---------------------------------------------------------------------------
// Abstract interface
// ---------------------------------------------------------------------------
abstract class ${DomainPascal}Service {
  Future<List<${DomainPascal}Item>> getItems();
}

// ---------------------------------------------------------------------------
// Mock implementation — reads from assets/mock_data/${domain}_items.json
// ---------------------------------------------------------------------------
class Mock${DomainPascal}Service implements ${DomainPascal}Service {
  @override
  Future<List<${DomainPascal}Item>> getItems() async {
    final jsonString =
        await rootBundle.loadString('assets/mock_data/${domain}_items.json');
    final List<dynamic> data = json.decode(jsonString) as List<dynamic>;
    return data
        .map((e) => ${DomainPascal}Item.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

// ---------------------------------------------------------------------------
// Real implementation — Firestore
// ---------------------------------------------------------------------------
class Real${DomainPascal}Service implements ${DomainPascal}Service {
  static final _log = Logger('Real${DomainPascal}Service');
  final _db = FirebaseFirestore.instance;

  @override
  Future<List<${DomainPascal}Item>> getItems() async {
    try {
      final snap = await _db.collection('${domain}Items').get();
      return snap.docs
          .map((d) => ${DomainPascal}Item.fromJson({...d.data(), 'id': d.id}))
          .toList();
    } catch (e, st) {
      _log.severe('getItems failed', e, st);
      rethrow;
    }
  }
}
\`\`\`

Create **lib/models/${domain}/${domain}_item.dart**:

\`\`\`dart
class ${DomainPascal}Item {
  final String id;
  final String name;

  const ${DomainPascal}Item({required this.id, required this.name});

  factory ${DomainPascal}Item.fromJson(Map<String, dynamic> json) {
    return ${DomainPascal}Item(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}
\`\`\`

Create **assets/mock_data/${domain}_items.json** with a stub array:
\`\`\`json
[
  { "id": "1", "name": "Sample item" }
]
\`\`\`

---

## Step 10 — Create the seed provider

Create **lib/providers/${domain}Providers/${domain}_provider.dart**:

\`\`\`dart
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../models/${domain}/${domain}_item.dart';
import '../../services/${domain}/${domain}_service.dart';

part '${domain}_provider.g.dart';

// Wire to Real or Mock by swapping the implementation here.
@riverpod
${DomainPascal}Service ${domain}Service(${DomainPascal}ServiceRef ref) {
  return Real${DomainPascal}Service(); // swap to Mock${DomainPascal}Service() for offline dev
}

@riverpod
Future<List<${DomainPascal}Item>> ${domain}Items(${DomainPascal}ItemsRef ref) async {
  final service = ref.watch(${domain}ServiceProvider);
  return service.getItems();
}
\`\`\`

Then run build_runner to generate the \`.g.dart\` file:
\`\`\`bash
flutter pub run build_runner build --delete-conflicting-outputs
\`\`\`

---

## Step 11 — Run setup-project to create the instructions kit

Use the \`setup-project\` MCP prompt with:
- \`projectName\`: ${projectName}
- \`stack\`: flutter
- \`portalRepoName\`: ${portal}

This creates \`.github/instructions/\`, \`AGENTS.md\`, and \`CLAUDE.md\`.

---

## Step 12 — Verification checklist

- [ ] \`flutter pub get\` succeeds
- [ ] \`flutter analyze\` returns no errors
- [ ] \`flutter pub run build_runner build --delete-conflicting-outputs\` generates \`${domain}_provider.g.dart\`
- [ ] \`.github/instructions/\` contains flutter-firebase + decision-capture + documentation + error-capture files
- [ ] Paths in decision-capture.instructions.md reference \`../${portal}/docs/notes/\`

---

## Next steps (after Firebase project is ready)

1. Add \`google-services.json\` to \`android/app/\`
2. Add \`GoogleService-Info.plist\` to \`ios/Runner/\`
3. Add \`firebase_app_id_file.json\` to \`ios/\` and \`macos/\`
4. Run \`flutterfire configure\` to regenerate \`lib/config/firebase_options.dart\`
5. Fill in \`.env\` with \`FIREBASE_PROJECT_ID\`
6. Uncomment Firebase options import in \`main.dart\`
`,
            },
          },
        ],
      };
    },
  );
}
