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
| **Record**     | The lab notebook — Postgres-backed persistence (`db`), `seed`s, and `reports`.                            |

## Commands

```bash
docker compose up -d          # start Postgres
npm install
npm run db:migrate            # apply Prisma schema (prisma migrate dev)
npm run db:generate           # regenerate Prisma client after schema changes
npm run seed                  # seed criteria, then fixtures, then subjects (order matters)
npm run db:studio             # inspect the DB visually
```

Requires a `.env` with `ANTHROPIC_API_KEY`, `DATABASE_URL`, and `PROJECTS_DIR` (the directory holding the real
projects that fixtures point at).

Run a single experiment directly with `tsx` (no build step):

```bash
tsx src/lab/experiments/definitions/0001-baseline-vs-deliverables.ts
```

Other entry points:

```bash
npm run generate:conventions        # run the architect agent against a repo (tsx .../generate-architect-run.ts <dir>)
npm run script:write-conventions    # persist architect-generated conventions.md into a target repo's dir
npm run report                      # serve src/lab/records/reports via `npx serve`
```

There is no lint/test/build tooling configured (no ESLint/Vitest/Jest config, no `tsc` build script) — don't
invent commands for these.

## Architecture

### Directory map

```
src/lab/
  experiments/
    definitions/     # One file per experiment: NNNN-description.ts (e.g. 0001-baseline-vs-deliverables.ts)
    runner/          # generate-run, gate-run, compare-runs — orchestration only, no inline DB/LLM calls
    api/             # Thin wrappers that call out to actual agent generation (planner, architect)
    run-experiment.ts  # experiment() wrapper — creates the Experiment row, ensures prisma.$disconnect()
  fixtures/          # Fixture types + generators; frozen snapshots of real project state at seed time
    planner/         # Planner-specific fixture definitions
  instruments/
    judges/          # LLM judges (tool-calling with forced tool_choice for structured output)
      conventions/   # versioned criteria + prompt (criteria/*.v1.ts, *.v2.ts + prompt/*.v1.ts, *.v2.ts)
      plan/          # plan.judge.ts, plan.criteria.ts, plan.judge.prompt.ts
      tools/         # submit-gate-evaluation.tool.ts, submit-comparative-evaluation.tool.ts
    metrics/         # cost.ts, agreement.ts
    clients/         # anthropic.ts — single Anthropic client singleton
  records/
    db/              # Prisma client + one repo file per model (named *.repo.ts, functions not classes)
    seed/            # seed-criteria.ts, seed-fixtures.ts, seed-subjects.ts (run in that order via `npm run seed`)
    reports/         # analysis scripts, writing JSON output alongside themselves
  subjects/          # Subject definitions (agent × model × prompt)
    planner/
      prompts/       # One file per prompt variant: NNN-slug.prompt.ts
  types/             # Shared enums (AgentType, TaskStatus) and type aliases
src/lib/             # General utilities: files.ts, projects.ts (repo-key resolution)
src/scripts/         # One-off runnable scripts (write-conventions.ts)
prisma/schema.prisma # Source of truth for the DB shape — see model comments for the Fixture/Subject/Run/etc mapping
```

### The experiment pipeline

Every experiment definition in `experiments/definitions/` follows the same shape: wrap the body in `experiment()`
(handles `Experiment` row creation + `prisma.$disconnect()`), then for each fixture/subject combination:

1. **`generate*Run`** (`runner/generate-run.ts`) — loads the fixture + subject from DB, builds the prompt via
   `buildPrompt()` (replaces `{{variableName}}` template vars), calls the agent, persists a `Run` row with full
   behavior/cost/latency metrics.
2. **`gate*Run`** (`runner/gate-run.ts`) — runs a judge against the output, maps judge answers to seeded
   `Criterion` ids, persists `GateResult` rows, and flips `Run.allGatesPassed`.
3. **`compare*Runs`** (`runner/compare-runs.ts`) — for comparative evaluation, runs the judge twice (forward and
   swapped A/B order) to detect position bias; if either side failed its gate, the comparison is decided by gate
   rather than by judge.

Fixtures and subjects are **not** constructed inline in experiment files — they're string keys (`fixtureKey`,
`subjectKey`) resolved against DB rows that were populated by the seed scripts. This keeps experiment definitions
declarative and makes runs reproducible from seeded state.

### Judges

Judges are LLM calls forced into structured output via `tool_choice: { type: 'tool', name: '...' }`. Criteria
definitions are versioned and kept separate from prompts (e.g. `conventions.criteria.v1.ts` vs
`conventions.criteria.v2.ts`, `conventions.prompt.v1.ts` vs `v2.ts`) so criteria/prompt changes can be evaluated
against each other via judge-regression experiments (`run-judge-regression.ts` + labeled diffs in
`fixtures/labeled-diffs/`). Judge model is `claude-haiku-4-5` — don't upgrade without an experiment justifying it.

### Database conventions

- One repo file per Prisma model under `src/lab/records/db/`, named exports only, no classes.
- Use `prisma.$queryRaw` for aggregate/GROUP BY queries Prisma's builder can't express; normalize any `BigInt`
  results to `Number` before serializing to JSON.
- Always call `prisma.$disconnect()` in top-level scripts (seeds, experiment entry points) — the `experiment()`
  wrapper already does this for experiment definitions.
- The `AgentType` enum (`director`, `executor`, `planner`, `architect`) is the discriminator threaded through
  `Fixture`, `Subject`, and `Criterion` — most repo queries filter or key on it.

### Style

- ESM throughout (`"type": "module"`), `.ts` everywhere, run via `tsx` — no build step for scripts.
- Named exports only, no default exports; functions over classes.
- `import type` for type-only imports; `@/*` path alias maps to `src/*`.
- Keep runner orchestration (`generate-run.ts`, `gate-run.ts`, `compare-runs.ts`) free of inline DB/LLM calls —
  route through repos and instrument modules instead.
- This is a research tool: prefer explicit, readable code over clever abstraction or DRY-ness for its own sake.
