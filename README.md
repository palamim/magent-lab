# magent-lab

A research lab for measuring the quality of Magent's agents (more in the end). Plan quality is
open-ended — many valid plans exist — so the lab evaluates agents empirically:
it runs controlled inputs through instrumented subjects, records every trial,
and reports the numbers that answer _"is this configuration better?"_

## Foundational components

The lab is organized around the primitives of an experiment. Everything in
`src/lab/` maps to one of them.

| Component      | What it is                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| **Fixture**    | Controlled, frozen input — independent variable held constant.                                                |
| **Subject**    | The thing under test — an agent configuration (`agentType` × `model` × `prompt`).                             |
| **Instrument** | The measuring apparatus — LLM `judges`, cost/latency `metrics`, model `clients`.                              |
| **Criterion**  | The encoded definition of quality — versioned `gate` (pass/fail) or `comparative` (A-vs-B) standards.         |
| **Experiment** | The protocol — which subjects run against which fixtures, and how many replicates.                            |
| **Run**        | A single trial — one subject producing output over one fixture, with behavior, cost, and evaluation recorded. |
| **Record**     | The lab notebook — Postgres-backed persistence (`db`), `seed`s, and `reports`.                                |

## Method

Each replicate of an experiment moves a subject through three phases:

1. **Generate** — the subject agent runs against a fixture and produces output (a
   plan, for example). The run captures behavior (steps, tool calls, files read), cost,
   latency, and tokens.
2. **Gate** — a Judge agent scores the output against each **gate criterion**
   (grounded, executable, on-altitude, …). A run passes only if it clears every
   gate. Gates catch objective flaws.
3. **Compare** — two passing runs go head-to-head on the **comparative
   criteria**. To control for position bias the judge evaluates both orderings
   (A,B) and (B,A); if the winner flips, the comparison is `positionBiased` and
   resolves to `tie`. If either run failed its gates, the comparison is decided
   by gate instead of by judge.

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

## Magent

**The direction layer for agentic coding.**

[Magent](https://www.getmagent.com/) is the direction layer for AI coding. It proposes the
direction your project should move toward and orchestrates agents that build it, while you
supervise, approving, sharpening, and giving feedback the agents learn from.
