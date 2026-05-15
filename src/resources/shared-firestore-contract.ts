export const sharedFirestoreContractConventions = `# Shared Firestore Contract — Two Clients, One Database

The pattern: **two (or more) independently-deployed clients write to and read from the same Firestore project.** Common shapes are mobile + web, mobile + admin portal, or two services owned by different teams.

This is the cheapest way to share state — and the easiest place to break things silently.

---

## What breaks silently

Firestore has **no schema enforcement at the database layer**. The only contracts are:

1. Security rules (allow/deny — but they cannot constrain field names or types).
2. The mental model in each client's data layer.

When two clients diverge on field names, types, or required fields, the symptoms appear as:

- A field renamed in client A → client B silently writes \`null\` or omits the field → A's queries return empty.
- A required field added in client A → B's existing writes are missing it → A's deserialization throws or returns junk.
- A field type changed (string → array, number → string) → B keeps writing the old type → A's reads partially fail in ways that don't surface in tests.
- A new collection added in client A → B's security rules deny reads → cross-client features break only for B's users.

None of these produce a build error in either repo. They surface as data-shaped bugs in production.

---

## Schema doc as the contract

There must be **one canonical schema doc** that lives in the repo most likely to own the data model long-term. Both clients reference it. It must contain, for every collection:

- Document path (with placeholders for IDs).
- Every field name, type, required/optional, default value if any.
- Cross-references to security rule clauses.
- Notes on which client(s) write each field.

If the schema doc isn't updated as part of the same PR that changes the field, the change is broken.

---

## camelCase mandate

Pick one casing convention for field names and never deviate. \`camelCase\` is the safest because:

- It survives JSON round-trips through every SDK without transformation.
- It matches the default field-naming convention in JavaScript / TypeScript / Dart / Swift / Kotlin.
- It avoids the SQL-shaped trap of \`snake_case\` field names that look right but break ORM helpers in some SDKs.

Reject any PR that introduces \`snake_case\`, \`PascalCase\`, or \`kebab-case\` field names. Mixing casings is worse than picking the "wrong" one.

---

## Manual type sync

If the two clients are written in different languages (TypeScript + Dart, TypeScript + Swift, etc.), there is no shared type generation by default. Options:

1. **Manual sync** — keep the model classes in lockstep by hand, with the schema doc as the single source of truth. Lowest tooling cost, highest discipline cost.
2. **Codegen from a shared schema** — pick a neutral source (Zod, JSON Schema, Protobuf) and generate the model classes for both targets. Higher tooling cost, lower drift risk.

Manual sync is acceptable for small schemas with one engineer touching both repos. Codegen becomes mandatory once a team grows past two engineers or the schema exceeds ~20 collections.

Either way, the **schema-doc-as-contract** rule still applies — the doc is what humans read; the codegen output is what machines emit.

---

## The 6-step schema-change workflow

Any change to the shape of shared Firestore data must go through these steps in order. Skipping any step is how silent breakage starts.

1. **Update the canonical schema doc first.** PRs that change the doc are reviewed by both clients' owners.
2. **Update security rules** in the same PR if the change affects access patterns. Test rules locally with the emulator.
3. **Update the model class in the writing client.** Deploy is gated on this.
4. **Update the model class in the reading client.** Deploy is gated on this.
5. **Backfill or migration** if existing documents need to be brought into compliance. Run as a one-off Admin SDK script with dry-run support.
6. **Update both clients' integration tests** that exercise the changed collection. CI must catch a re-divergence.

Field renames must be done as add-then-deprecate-then-remove across at least three deployments. Direct renames are forbidden because the two clients deploy on independent cadences.

---

## Backward-compat windows

Because the two clients deploy independently, **every schema change has a window where one client is on the old shape and the other is on the new shape.** Plan for this:

- New fields must be optional with a sensible default until both clients have shipped reading them.
- Removed fields must be marked deprecated in the schema doc for at least one release before deletion.
- Type changes are not allowed — model the change as "add new field, deprecate old field, remove old field" across three releases.

---

## Cross-repo audit checklist

Once a quarter, run this check across both client repos:

1. Diff each model class against the schema doc. Drift indicates the doc is out of date OR the model is out of date — either is a bug.
2. Grep both repos for direct \`.collection(...)\` and \`.doc(...)\` calls; verify each path appears in the schema doc.
3. Diff the actual Firestore document shape (sample 10 docs per collection via a script) against the schema doc. Production drift is the most expensive kind to find.

The audit finding the smallest number of mismatches wins. Track the count over time.
`;
