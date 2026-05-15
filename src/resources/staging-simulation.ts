export const stagingSimulationConventions = `# Staging Simulation Patterns

How to drive realistic load against a staging environment with synthetic users while keeping cleanup safe and the simulator code path identical to production.

---

## The two-step auth dance

Synthetic users authenticate in two steps; never bypass either:

\`\`\`
1. Admin (operator) ──► mintSimToken({ targetUid }) ──► Cloud Function
                                                          ──► Firebase custom token
                                                          (server-side only — Admin SDK)

2. Sim user ──► signInWithCustomToken(token) ──► Firebase Auth
                                                  ──► ID token (used in REST calls)
\`\`\`

**Why two steps:** custom tokens can only be minted by the Admin SDK. The mint-token callable is the security gate — it applies project-allowlist, email-allowlist, App Check, and a custom claim check (e.g. \`isSimUser: true\`) before issuing the token.

**Rules:**
- The mint-token function must verify a project-environment gate (\`assertStaging()\`) and refuse to run in production.
- The custom claim that authorizes a sim user is written by the Admin SDK only — never by the client.
- Never call \`createCustomToken\` from anything other than the official mint endpoint.

---

## The SimWriter invariant

**Every Firestore write inside the simulator MUST go through a single \`SimWriter\` abstraction** that stamps two fields on every document:

\`\`\`
"isSimulated": true,
"simRunId": "<uuid generated at simulator startup>",
\`\`\`

This is what makes cleanup safe and atomic.

**Cleanup pattern (mark-and-sweep):**

\`\`\`
db.collection('<any>').where('simRunId', '==', runId).get()
  → delete each doc + subcollections
\`\`\`

A single field-equality query reaches every document the run produced, regardless of which collection or subcollection it landed in. No cross-collection bookkeeping required.

**Rules:**
- Never call \`db.collection(...).add(...)\` or \`.doc(...).set(...)\` directly inside simulator code. Always go through \`SimWriter\`.
- Code review must reject any bypass — there is no acceptable reason to write a sim doc without the two stamp fields.
- Security rules should require \`request.resource.data.isSimulated == true\` for any write made by a user with the sim claim, and \`false\` for non-sim users. Cross-contamination becomes a rule violation, not a logic bug.

---

## Concurrency model

Use language-native isolates / workers / processes with separate heaps — not shared-memory threads — so the simulator exercises real network and serialization paths:

\`\`\`
main ─► spawn worker A (users  1– 50)
     ─► spawn worker B (users 51–100)
     ─► spawn worker C (users 101–150)
     ─► spawn worker D (users 151–200)

Each worker:
  for each user in slice:
    authenticate (mintSimToken → signInWithCustomToken)
    run ScenarioRunner(user)
      └─ Poisson-dispatched actions every ~Ns:
           pick scenario → act() → write via SimWriter
\`\`\`

The main process collects per-worker metrics at shutdown via message ports.

---

## Code-path identity rule

The simulator must use the **same** models, services, and REST helpers that the real app ships. If the sim has its own copy of \`AudioMetadata\` or its own Firestore wrapper, the sim is no longer testing what production runs.

**Allowed exceptions** (must be explicitly documented):
- Auth bootstrap (sim uses \`signInWithCustomToken\` — real users use email/Google).
- Transport: if the production client uses a framework SDK that requires the framework runtime (e.g. FlutterFire requires Flutter), the sim may use the platform's REST SDK directly. All other code must be shared.

---

## Scenarios

Each sim user is assigned one scenario for the duration of the run. Scenarios are stateless functions that receive the user context and produce an \`act()\` method called on a Poisson schedule. Keep scenarios narrow ("requester user", "browser user", "DJ user") so traffic-mix percentages are tunable.

---

## What the sim must NOT do

- ❌ Write to production. The mint-token gate plus an env-flag check at startup are both required.
- ❌ Use a fixed run ID. Every run mints a fresh UUID so cleanup never affects prior runs.
- ❌ Skip the cleanup step at shutdown. Even if the run crashes mid-flight, the operator must be able to run \`cleanup --runId <id>\` and recover.
- ❌ Authenticate sim users with real passwords. The custom-token flow is the only sanctioned path.
- ❌ Bypass App Check. The mint-token endpoint must require an App Check token like any other privileged call.

---

## Recommended runbook structure

Every simulator project should ship four runbooks:

1. **Setup** — bootstrap the staging project, create allowlist, deploy the mint-token function, create the cleanup script.
2. **Runtime** — start a run, monitor progress, stop early, read live metrics.
3. **Observability** — where logs/metrics/traces land and how to query them.
4. **Run results reference** — what fields appear in the per-run summary doc and how to interpret them.

A separate **mental model** doc should explain *why* the design is shaped this way (concurrency choice, REST-vs-SDK choice, the SimWriter invariant). Keep operational steps and design rationale in different files.
`;
