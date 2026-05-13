export const flutterConventions = `# Flutter + Dart + Riverpod Conventions

## State management: Riverpod + code generation

- Use \`@riverpod\` annotations with \`riverpod_annotation\` for all state management.
- Package: \`hooks_riverpod\` (includes \`flutter_riverpod\`).
- **Widget choice**: \`ConsumerWidget\` by default. Use \`HookConsumerWidget\` only when hooks are needed (\`useState\`, \`useEffect\`, \`useAnimationController\`).
- All providers have \`.g.dart\` counterparts — always include \`part 'filename.g.dart';\` directive.
- **Build command**: \`flutter pub run build_runner build --delete-conflicting-outputs\`
- **Riverpod 3.x breaking change**: \`.asData?.value\` is removed — use \`.value\` instead (returns \`null\` when loading or in error state). \`.valueOrNull\` is also removed.

### Provider pattern template

\`\`\`dart
part 'my_provider.g.dart';

@riverpod
class MyNotifier extends _$MyNotifier {
  static final _log = Logger('MyNotifier');

  Timer? _timer;
  StreamSubscription? _subscription;

  @override
  MyState build() {
    ref.onDispose(() {
      _log.fine('Disposing MyNotifier resources');
      _timer?.cancel();
      _subscription?.cancel();
      _timer = null;
      _subscription = null;
    });
    return MyState();
  }
}
\`\`\`

Always register disposal hooks in \`build()\` for timers, streams, and resources.

## Architecture

- Three-layer model (UI → State → Service), Dumb Widget Pattern, Mock/Real stub
  pattern, and the full 9-step widget refactor process are in
  \`conventions://three-layer-architecture\`.

## State classes

- All state classes must be \`@immutable\`: use \`copyWith()\`, override \`==\` and \`hashCode\`.
- Prefer Freezed for complex state classes when the boilerplate justifies it.
- Never mutate state directly — always produce a new instance via \`copyWith()\`.

## Logging convention

- Use \`package:logging\` throughout.
- **Class-level logger** (inside a class): \`static final _log = Logger('ClassName');\`
- **Top-level logger** (provider files with \`@riverpod\` functions): \`final _log = Logger('...');\`
- Log levels:
  - \`_log.severe()\` — errors (production-visible)
  - \`_log.warning()\` — warnings
  - \`_log.fine()\` — general flow (development)
  - \`_log.finest()\` — detailed traces (development)
- Replace \`print()\` with \`_log.fine()\` — never leave \`print()\` in committed code.

## Async & error handling

**Fire-and-forget async calls** (void return sites, e.g. \`onPressed\`):

\`\`\`dart
unawaited(() async {
  try {
    await someAsyncOperation();
  } catch (e, st) {
    _log.severe('Describe what failed', e, st);
  }
}());
\`\`\`

Do NOT discard a Future silently or use \`.catchError()\` (type-unsafe in Dart 3.x).

**Service methods (\`Future<T>\`)** — catch specific exception types, log with stack trace, rethrow:

\`\`\`dart
try {
  final snapshot = await _db.collection('...').get();
  return snapshot.docs.map(...).toList();
} on FirebaseException catch (e, st) {
  _log.severe('Failed to fetch ...', e, st);
  rethrow;
}
\`\`\`

**\`@riverpod Future<T>\` providers** — same pattern so Riverpod surfaces the error state:

\`\`\`dart
@riverpod
Future<List<String>> myList(Ref ref) async {
  try {
    return await ref.watch(myServiceProvider).getItems();
  } catch (e, st) {
    _log.severe('Failed to load items', e, st);
    rethrow;
  }
}
\`\`\`

**Stream error handling** — add \`.handleError\` before returning to Riverpod:

\`\`\`dart
return _db.collection('...').snapshots()
    .map((snap) => ...)
    .handleError((Object e, StackTrace st) {
      _log.severe('Stream error', e, st);
      Error.throwWithStackTrace(e, st);
    });
\`\`\`

**\`context.mounted\` after \`await\`** — always check before using \`context\`, \`ScaffoldMessenger\`, or \`Navigator\`:

\`\`\`dart
await someOperation();
if (!context.mounted) return;
ScaffoldMessenger.of(context).showSnackBar(...);
\`\`\`

## Image error handling

- \`Image\` / \`Image.network\` / \`Image.asset\` → use \`errorBuilder:\` returning a placeholder widget.
- \`DecorationImage\` → use \`onError: (e, st) => _log.warning(...)\` (\`DecorationImage\` has no \`errorBuilder\`).
- Any artwork/thumbnail URL → route through a helper that returns \`NetworkImage\` for http/https and \`AssetImage\` for local paths.

## Firebase

- All Firestore reads/writes go through service classes in \`lib/services/firebase/\`.
- Enable offline persistence at startup (already configured in \`main.dart\`).
- Auth state is managed via a dedicated auth service — never read \`FirebaseAuth\` directly in widgets.

## Navigation

- Use \`go_router\` for all navigation.
- Never use \`Navigator.push\` directly in new code.

## Performance best practices

- **Avoid polling timers** — use stream listeners instead of \`Timer.periodic\` for position or state tracking.
- Use \`player.positionStream.listen()\` instead of 1ms timers.
- Always dispose: track all \`Timer\` and \`StreamSubscription\` instances; cancel in \`ref.onDispose()\`.

## API & constant usage

- Use explicitly recommended APIs — when Flutter/Dart docs recommend one API over another, always use the recommended one.
- Do not use constants, methods, or classes the SDK explicitly warns against.
- Use \`kDebugMode\` (not \`kReleaseMode\`) to gate verbose logging.

## Dependency management

- Use caret (\`^\`) version ranges in \`pubspec.yaml\`; only pin exact versions if a specific version fix is required.
- Run \`flutter pub get\` after modifying dependencies.
- Check for platform-specific setup after adding plugins (Android \`build.gradle\`, iOS \`Podfile\`).

## Code style

- Prefer \`const\` constructors wherever possible.
- Use named parameters for widget constructors with more than 2 parameters.
- Keep \`build()\` methods lean — extract sub-widgets into separate classes when they grow.
`;
