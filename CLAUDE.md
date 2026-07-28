# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A research lab for measuring the quality of coding agents (Magent's ecosystem). Code quality is open-ended, so
the lab evaluates empirically: it runs controlled inputs through instrumented subjects (agent configs), records
every trial in Postgres, and reports the numbers.

The domain vocabulary matters — the whole codebase is organized around these primitives:

| Component      | What it is                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| **Fixture**    | Controlled, frozen input — independent variables held constant and labeled context.                     |
| **Subject**    | The thing under test — a coding agent configuration (`model` × `prompt`) or a Judge agent.               |
| **Instrument** | The measuring apparatus — LLM `judges`, cost/latency `metrics`, model `clients`.                          |
| **Criterion**  | The encoded definition of quality — versioned `gate` (pass/fail) or `comparative` (A-vs-B) standards.     |
| **Experiment** | The protocol — which subjects run against which fixtures, and how many replicates.                       |
| **Run**        | A single trial — one subject producing output over one fixture, with behavior, cost, and eval recorded.  |
| **Record**     | The lab notebook — Postgres-backed persistence (`db`) and `reports`.                                     |

## Commands

```bash
docker compose up -d          # start Postgres
npm install
npm run db:migrate            # apply Prisma schema (prisma migrate dev)
npm run db:generate           # regenerate Prisma client after schema changes
npm run db:studio             # inspect the DB visually
```

Requires a `.env` with `ANTHROPIC_API_KEY`, `DATABASE_URL`, and `PROJECTS_DIR` (the directory holding the real
projects that fixtures point at).

Run a single experiment directly with `tsx` (no build step):

```bash
tsx src/lab/experiments/definitions/0004-conventions-judge-regression.ts
```

Other entry points:

```bash
npm run generate:conventions        # run the architect agent against a repo (tsx .../generate-architect-run.ts <dir>)
npm run script:write-conventions    # persist architect-generated conventions.md into a target repo's dir
npm run report                      # serve src/lab/records/reports via `npx serve`
npm test                            # node's built-in test runner via `tsx --test` — no Vitest/Jest
```

Judge-regression analysis, offline over already-persisted data (require an `experimentId`, see below):

```bash
tsx src/lab/records/reports/judge-run-integrity.ts <experimentId>            # data-integrity gate
tsx src/lab/records/reports/judge-consistency-validity.ts <experimentId>     # split histogram, kappa, CP CIs, cluster bootstrap
tsx src/lab/records/reports/judge-reasoning-divergence.ts <experimentId>     # non-unanimous cells with reasoning side by side
tsx src/lab/records/reports/judge-study-export.ts <experimentId>             # writes reports/output/study-<id>.json
```

There is no lint/build tooling configured (no ESLint config, no `tsc` build script) — don't invent commands for
these. `npm test` exists but is narrowly scoped: it runs `node:test` (built-in, zero test-framework dependency)
over the pure statistics module and the JSON Schema validator, both DB-free by design — it does not touch Postgres
and is not a general test suite for the rest of the codebase.

## Architecture

### Directory map

```
src/lab/
  experiments/
    definitions/     # One file per experiment: NNNN-description.ts (e.g. 0004-conventions-judge-regression.ts)
    runner/          # run-judge-regression.ts, generate-architect-run.ts — orchestration only, no inline DB/LLM calls
    api/             # conventions.api.ts — thin wrapper that calls out to the architect agent
    run-experiment.ts  # experiment() wrapper — creates the Experiment row, ensures prisma.$disconnect()
  fixtures/
    labeled-diffs/     # Frozen, human-labeled code diffs used as judge-regression fixtures
      conventions/v1/, v2/  # One file per labeled diff + a shared _conventions.ts + index.ts barrel
      labeled-diff.types.ts
  instruments/
    judges/          # LLM judges (tool-calling with forced tool_choice for structured output)
      conventions/   # versioned criteria + prompt (criteria/*.v1.ts, *.v2.ts + prompt/*.v1.ts, *.v2.ts)
      tools/         # submit-gate-evaluation.tool.ts, submit-comparative-evaluation.tool.ts
      types/         # shared judge types (GateEvaluation, ComparativeEvaluation, Criterion, Verdict)
      run-judge.ts   # shared tool-calling harness for judge LLM calls
    metrics/         # cost.ts, agreement.ts, judge-stats.ts (+ .test.ts) — pure, offline, no I/O
    clients/         # anthropic.ts — single Anthropic client singleton
  records/
    db/              # Prisma client + one repo file per model still in use (judge-runs, agent-runs, experiments)
    reports/         # analysis scripts, writing JSON output alongside themselves (output/ is gitignored)
      schemas/       # JSON Schema for study exports + a hand-rolled validator (see below)
  subjects/          # Subject definitions (agent × model × prompt)
    judges/          # conventions-judge.subject.ts — judge subject configs (criteria/prompt version pairs)
  types/             # Shared enums (AgentType, TaskStatus) and type aliases
src/lib/             # General utilities: files.ts, projects.ts (repo-key resolution)
src/scripts/         # One-off runnable scripts (write-conventions.ts)
prisma/schema.prisma # Source of truth for the DB shape — JudgeRun, AgentRun, Experiment are the live models
```

### The experiment pipeline

Every experiment definition in `experiments/definitions/` wraps its body in `experiment()` (handles `Experiment`
row creation + `prisma.$disconnect()`). The current experiments are judge-regression runs (0004, 0005):

- **`runJudgeRegression`** (`runner/run-judge-regression.ts`) — for each labeled diff × `runsPerDiff` replicates,
  runs the conventions judge (`runConventionsJudge`) against the diff, checks the judge's answers against the
  diff's human-labeled `expected` outcome (`checkAgreement`), and persists one `JudgeRun` row per replicate.

Fixtures (`fixtures/labeled-diffs/`) and subjects (`subjects/judges/conventions-judge.subject.ts`) are **not**
DB-backed — they're plain in-code arrays/objects imported directly into the experiment definition. `JudgeRun`
only stores their `diffKey`/`subjectKey` as strings, so nothing needs seeding before a judge-regression experiment
can run. `0003-code-diff.ts` is a similar but one-off, unpersisted script — it runs a single judge call and prints
the result, without wrapping in `experiment()` or writing to the DB.

Separately, `generateArchitectRun` (`runner/generate-architect-run.ts`, driven by `npm run generate:conventions`)
runs the architect agent against a real repo and persists an `AgentRun` row — it doesn't go through `experiment()`
or touch `Fixture`/`Subject`/`Criterion` at all.

### Judges

Judges are LLM calls forced into structured output via `tool_choice: { type: 'tool', name: '...' }`. Criteria
definitions are versioned and kept separate from prompts (e.g. `conventions.criteria.v1.ts` vs
`conventions.criteria.v2.ts`, `conventions.prompt.v1.ts` vs `v2.ts`) so criteria/prompt changes can be evaluated
against each other via judge-regression experiments (`run-judge-regression.ts` + labeled diffs in
`fixtures/labeled-diffs/`). Judge model is `claude-haiku-4-5` — don't upgrade without an experiment justifying it.

### Judge-regression analysis pipeline

Analyzing a completed judge-regression experiment (5 replicate `JudgeRun` rows per labeled diff × criterion cell)
is a separate, layered pipeline under `records/reports/`, built to be safe to run against real study data:

1. **`judge-run-integrity.ts`** (`checkJudgeRunIntegrity`) — verifies every `(diffKey, criterion)` cell for a
   given `experimentId` has exactly the expected replicate count, cross-checked against the actual fixture/criteria
   source (not just whatever rows happen to exist in the DB, so a fully-missing diff is caught, not silently
   skipped). **Every downstream analysis or report script gates on this and throws/refuses rather than analyzing
   partial data** — never bypass or soften this gate to "just get a number out."
2. **`judge-stats.ts`** (`instruments/metrics/`) — pure, offline statistics, no I/O: split-histogram consistency,
   Fleiss' kappa self-agreement (explicit implementation, not a library — see its `KappaResult`'s `reason` field
   for why it's `null`/uninformative near degenerate all-yes/all-no marginals), Clopper-Pearson exact binomial CIs
   (implemented from scratch via the classic continued-fraction incomplete-beta algorithm — no stats dependency),
   majority-vote validity (accuracy/sensitivity/specificity, each reporting `value: null` + a `reason` rather than
   a coerced number when a ground-truth class has zero support), and a cluster bootstrap over `diffKey` (seeded
   `mulberry32` PRNG, fully reproducible) that resamples whole diffs rather than individual runs, since the 5
   replicates of one diff are correlated, not independent observations.
3. **`judge-consistency-validity.ts`** / **`judge-reasoning-divergence.ts`** / **`judge-study-export.ts`** — thin
   orchestration over `judge-stats.ts` + Prisma. `judge-study-export.ts` assembles a full study JSON (schema in
   `reports/schemas/judge-study-export.schema.json`) — every number in it is a passthrough from `judge-stats.ts`
   or `judge-consistency-validity.ts`, never recomputed or hardcoded in the exporter; only descriptive fields
   (`limitations`, `temperatureNote`) are authored text.
4. **`reports/schemas/validate-json-schema.ts`** — a minimal, hand-rolled JSON Schema (draft 2020-12 subset)
   validator. `ajv` is present in `node_modules` only as an undeclared transitive dependency (via prisma tooling)
   — don't import it directly, it can disappear on an unrelated dependency bump. Extend this validator rather
   than reaching for a declared `ajv` dependency unless the schema's needs genuinely outgrow it.

If you add a new `records/reports/*.ts` script that reads `JudgeRun` data, follow the same pattern: require
`experimentId` as a parameter, gate on `checkJudgeRunIntegrity`, and keep any new pure math in `judge-stats.ts`
(with hand-verified unit tests) rather than inline in the report script.

### Database conventions

- One repo file per Prisma model under `src/lab/records/db/`, named exports only, no classes.
- Use `prisma.$queryRaw` for aggregate/GROUP BY queries Prisma's builder can't express; normalize any `BigInt`
  results to `Number` before serializing to JSON.
- Always call `prisma.$disconnect()` in top-level scripts (experiment entry points, one-off scripts) — the `experiment()`
  wrapper already does this for experiment definitions.
- The `AgentType` enum (`director`, `executor`, `planner`, `architect`) is a shared discriminator type; in the DB
  it's currently only stored on `AgentRun.agentType`.

### Style

- ESM throughout (`"type": "module"`), `.ts` everywhere, run via `tsx` — no build step for scripts.
- Named exports only, no default exports; functions over classes.
- `import type` for type-only imports; `@/*` path alias maps to `src/*`.
- Keep runner orchestration (`generate-run.ts`, `gate-run.ts`, `compare-runs.ts`) free of inline DB/LLM calls —
  route through repos and instrument modules instead.
- This is a research tool: prefer explicit, readable code over clever abstraction or DRY-ness for its own sake.
