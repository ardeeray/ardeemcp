export const stubPatternConventions = `# Mock/Real Stub Pattern (Flutter + Portal)

A single seam pattern for swapping fake data ↔ real backend at every external IO boundary
(Firestore, REST APIs, third-party SDKs). Used in both ardeej (Flutter) and ardeeportal
(Next.js). Lets features ship UI-first with mock data, then wire to real backends without
touching call sites.

## When to use

Use the stub pattern at every IO seam:

- Firestore reads/writes
- HTTP calls to external APIs (Tidal, Spotify, payment gateways, AI services)
- Third-party SDKs (analytics, storage, crash reporting)
- Cloud Functions calls

Do **not** use it for:

- Pure functions or in-process logic
- UI-only state (use Riverpod / React state directly)
- Configuration / env values

## Anatomy

Three pieces, regardless of platform:

1. **Abstract interface** — defines the shape; both implementations conform
2. **\`MockX\`** — returns hard-coded or JSON-loaded data; zero network calls
3. **\`RealX\`** — calls the actual backend; the only place backend SDKs are imported

Plus **one swap point** — a single line of code that selects which implementation
is wired into the app. Grep-friendly: should be a single uncommented line so the
active wiring is obvious.

## Lifecycle

1. **Scaffold Mock first** — ship the feature with \`MockX\` returning realistic test data
2. **Build the UI + state layer** against the abstract interface; never reference \`MockX\` directly
3. **Wire Real** — implement \`RealX\`, swap the provider/export
4. **Comment out Mock — do not delete** — keeps it available for offline dev and tests
5. **Mark resolved** — update \`docs/notes/feature-status.md\` (or repo equivalent)

## Rules

- **Same interface, both sides.** \`MockX\` and \`RealX\` return the same types. Never
  let \`MockX\` return a richer or simpler shape than \`RealX\`.
- **Single swap point.** Exactly one uncommented line picks the implementation. The
  inactive one is commented above/below it. Never use a runtime flag — keep the
  swap visible at compile time.
- **No cross-talk.** \`RealX\` never imports \`MockX\` or vice versa. They are
  parallel implementations.
- **Backend imports stay in \`RealX\`.** The interface file imports zero SDKs. The
  Mock file imports zero SDKs. Only \`RealX\` touches Firestore / fetch / etc.
- **Mock data lives in a known location.** Flutter: \`assets/mock_data/<name>.json\`
  declared in \`pubspec.yaml\`. Portal: \`shared/data/<project>/<name>.ts\` exported
  as a typed const.

---

## Flutter pattern (Riverpod)

\`\`\`dart
// lib/services/song_service.dart

abstract class SongService {
  Future<List<Song>> fetchSongs();
  Future<Song?> fetchSongById(String id);
}

class RealSongService implements SongService {
  final _db = FirebaseFirestore.instance;
  static final _log = Logger('RealSongService');

  @override
  Future<List<Song>> fetchSongs() async {
    try {
      final snap = await _db.collection('songs').where('isActive', isEqualTo: true).get();
      return snap.docs.map(Song.fromFirestore).toList();
    } on FirebaseException catch (e, st) {
      _log.severe('fetchSongs failed', e, st);
      rethrow;
    }
  }

  @override
  Future<Song?> fetchSongById(String id) async {
    final doc = await _db.collection('songs').doc(id).get();
    return doc.exists ? Song.fromFirestore(doc) : null;
  }
}

class MockSongService implements SongService {
  @override
  Future<List<Song>> fetchSongs() async {
    final json = await rootBundle.loadString('assets/mock_data/songs.json');
    final list = jsonDecode(json) as List;
    return list.map((e) => Song.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<Song?> fetchSongById(String id) async {
    final all = await fetchSongs();
    return all.firstWhereOrNull((s) => s.id == id);
  }
}
\`\`\`

\`\`\`dart
// lib/providers/songProvider/song_service_provider.dart
@riverpod
SongService songService(Ref ref) {
  // return MockSongService();   // ← uncomment for offline dev
  return RealSongService();      // ← active wiring
}
\`\`\`

After editing the provider, regenerate:

\`\`\`bash
flutter pub run build_runner build --delete-conflicting-outputs
\`\`\`

Mock data file:

\`\`\`json
// assets/mock_data/songs.json
[
  { "id": "song1", "title": "Demo Track", "artistName": "Test Artist", "isActive": true }
]
\`\`\`

Declare in \`pubspec.yaml\`:

\`\`\`yaml
flutter:
  assets:
    - assets/mock_data/songs.json
\`\`\`

---

## Portal pattern (Next.js + TypeScript)

No DI container — use named exports and pick the active implementation at the
re-export site.

\`\`\`typescript
// src/lib/firestore/songs.ts
import type { Song } from '@/shared/models/ardeej/song';

export interface SongService {
  getAll(): Promise<Song[]>;
  getById(id: string): Promise<Song | null>;
}

export class RealSongService implements SongService {
  async getAll(): Promise<Song[]> {
    const { adminDb } = await import('@/lib/firebase/admin');
    const snap = await adminDb.collection('songs').where('isActive', '==', true).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Song, 'id'>) }));
  }

  async getById(id: string): Promise<Song | null> {
    const { adminDb } = await import('@/lib/firebase/admin');
    const doc = await adminDb.collection('songs').doc(id).get();
    return doc.exists ? ({ id: doc.id, ...(doc.data() as Omit<Song, 'id'>) }) : null;
  }
}

export class MockSongService implements SongService {
  async getAll(): Promise<Song[]> {
    const { mockSongs } = await import('@/shared/data/ardeej/mockSongs');
    return mockSongs;
  }

  async getById(id: string): Promise<Song | null> {
    const { mockSongs } = await import('@/shared/data/ardeej/mockSongs');
    return mockSongs.find((s) => s.id === id) ?? null;
  }
}
\`\`\`

\`\`\`typescript
// src/lib/firestore/songService.ts — the swap point
// import { MockSongService } from './songs';   // ← uncomment for offline dev
import { RealSongService } from './songs';      // ← active wiring

export const songService = new RealSongService();
\`\`\`

Mock data file:

\`\`\`typescript
// shared/data/ardeej/mockSongs.ts
import type { Song } from '@/shared/models/ardeej/song';

export const mockSongs: Song[] = [
  { id: 'song1', title: 'Demo Track', artistName: 'Test Artist', isActive: true },
];
\`\`\`

Server Components and Route Handlers import \`songService\` (the swap point), never
the implementation classes directly.

---

## When wiring Real (the unwire-stub task)

1. Read the schema doc for the collection (\`docs/firestore/schema.md\` in portal,
   \`FIRESTORE_CATALOG_SCHEMA.md\` in ardeej — both point to the portal as source of truth).
2. Confirm field names match what the **other client** writes (Flutter ↔ Portal share
   one Firestore — see \`docs/architecture/cross-repo-contract.md\`).
3. Implement \`RealX\` with the same method signatures as \`MockX\`.
4. Swap the active line; comment out the Mock line.
5. Run code generation (Flutter only).
6. Test against staging data (\`flutter run --dart-define=ENV=staging\` or
   \`npm run dev:staging\`).
7. Update \`docs/notes/feature-status.md\` — mark stub as resolved.
8. Verify in DevTools / Firestore console that reads/writes hit real docs.

## Anti-patterns

- ❌ Calling \`RealX\` from \`MockX\` to "fall back" — defeats offline dev
- ❌ Conditional logic inside \`RealX\` to read from JSON when offline — use the swap
- ❌ Deleting \`MockX\` after wiring \`RealX\` — keep for tests and offline dev
- ❌ Two active lines (uncommented) at the swap point — only one implementation wins
- ❌ Importing \`Real*\` in widgets / components / pages — always go through the
  provider (Flutter) or service export (Portal)
- ❌ Letting \`MockX\` return a different shape than \`RealX\` — type drift bugs
`;
