export const threeLayerArchitectureConventions = `# Three-Layer Architecture (Flutter + Riverpod)

## Mental model

\`\`\`
┌─────────────────────────────────────────────────────────┐
│ UI layer        screens/  widgets/                      │
│                 ConsumerWidget · HookConsumerWidget      │
└────────────────────────┬────────────────────────────────┘
                         │  ref.watch(someProvider)
┌────────────────────────▼────────────────────────────────┐
│ State layer     providers/  (Riverpod, code-generated)  │
│                 build_runner produces .g.dart files     │
└────────────────────────┬────────────────────────────────┘
                         │  abstract Service interfaces
┌────────────────────────▼────────────────────────────────┐
│ Service layer   services/                               │
│                 Real* → Firebase / HTTP                 │
│                 Mock* → assets/mock_data/*.json         │
└─────────────────────────────────────────────────────────┘
\`\`\`

## The three rules

1. **UI never reads from a service directly** — always via a provider.
2. **Providers never call Firebase / HTTP directly** — always via a service
   interface (dependency injected via Riverpod).
3. **Services are swappable** — \`MockSongService\` and \`RealSongService\`
   implement the same abstract \`SongService\`; swap by changing the provider.

## Mock/Real stub pattern

See \`conventions://stub-pattern\` for the full pattern (anatomy, lifecycle,
rules, anti-patterns) covering both Flutter and Portal implementations.

## Code generation

Any file with a \`@riverpod\` annotation requires build_runner. Run after every
change to an annotated file:

\`\`\`bash
flutter pub run build_runner build --delete-conflicting-outputs
\`\`\`

Watch mode for active development:

\`\`\`bash
flutter pub run build_runner watch --delete-conflicting-outputs
\`\`\`

Generated files (\`.g.dart\`) are committed to source control — they must exist
for the project to compile.

## Dumb Widget Pattern

Widgets are presentation-only. They receive typed props and emit callbacks —
they do not contain business logic or call providers.

\`\`\`dart
// Good — dumb widget
class SongCard extends StatelessWidget {
  final Song song;
  final VoidCallback onTap;
  const SongCard({required this.song, required this.onTap, super.key});
}

// Bad — smart widget (knows about providers)
class SongCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final song = ref.watch(selectedSongProvider); // ❌ widget fetching its own data
  }
}
\`\`\`

**Consume providers at screen level.** Pass the data down as props.

## Immutable state classes

Use \`@freezed\` or plain \`const\` classes with \`copyWith\` for all state.
Never mutate state in place — always produce a new instance.

\`\`\`dart
@freezed
class PlayerState with _$PlayerState {
  const factory PlayerState({
    required Song? currentSong,
    @Default(false) bool isPlaying,
    @Default(Duration.zero) Duration position,
  }) = _PlayerState;
}
\`\`\`

## Async state pattern

Use \`AsyncValue<T>\` for any async data. Always handle all three states in the
UI:

\`\`\`dart
final songs = ref.watch(songsProvider);
return songs.when(
  data: (list) => SongList(songs: list),
  loading: () => const CircularProgressIndicator(),
  error: (e, st) => ErrorView(message: e.toString()),
);
\`\`\`

## Error handling

- Catch errors at the provider/notifier level; surface them via \`AsyncValue.error\`.
- Never use \`try/catch\` in widgets.
- Log errors with the project logger before rethrowing or converting to
  \`AsyncValue.error\`.

## Logging

- Use the project logger (never \`print()\` or \`debugPrint()\` in production code).
- Log level: \`debug\` for state changes, \`info\` for service calls, \`warning\`
  for recoverable errors, \`error\` for unhandled failures.

## context.mounted guard

Always check \`context.mounted\` before using \`context\` after any \`await\`:

\`\`\`dart
await someAsyncCall();
if (!context.mounted) return;
Navigator.of(context).pop();
\`\`\`
`;
