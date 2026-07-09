# magent-lab

A research lab for measuring the quality of coding agents. Code quality is
open-ended — many valid approaches for the same goal — so the lab evaluates
code empirically: it runs controlled inputs through instrumented subjects,
records every trial, and reports the numbers.

## Foundational components

The lab is organized around the primitives of an experiment. Everything in
`src/lab/` maps to one of them.

| Component      | What it is                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| **Fixture**    | Controlled, frozen input — independent variables held constant and labeled context.                           |
| **Subject**    | The thing under test — a coding agent configuration (`model` × `prompt`) or a Judge agent.                    |
| **Instrument** | The measuring apparatus — LLM `judges`, cost/latency `metrics`, model `clients`.                              |
| **Criterion**  | The encoded definition of quality — versioned `gate` (pass/fail) or `comparative` (A-vs-B) standards.         |
| **Experiment** | The protocol — which subjects run against which fixtures, and how many replicates.                            |
| **Run**        | A single trial — one subject producing output over one fixture, with behavior, cost, and evaluation recorded. |
| **Record**     | The lab notebook — Postgres-backed persistence (`db`), `seed`s, and `reports`.                                |

## Setup

```bash
docker compose up -d          # Postgres
npm install
npm run db:migrate            # apply schema
npm run seed                  # criteria, fixtures, subjects
```

Requires `.env` with `ANTHROPIC_API_KEY`, `DATABASE_URL`, and `PROJECTS_DIR`
(the directory holding the real projects fixtures point at).

## Running an experiment

Experiments are defined in `src/lab/experiments/definitions/`. Run one directly:

```bash
tsx src/lab/experiments/definitions/0001-baseline-vs-deliverables.ts
```

Every run, gate result, and comparison is persisted. Inspect the notebook with
`npm run db:studio`.
