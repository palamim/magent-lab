# magent-lab

A research lab for evaluating Magent's agents. The first instrument is a
comparative judge for the Planner: given a direction, conventions, and two
plans, it decides which plan is better — or whether they're a tie.

## Why

The Planner is Magent's bottleneck: it drifts from the frontier, over-engineers,
or produces tasks the Executor can't finish. To improve it without guessing, you
need to _measure_ plan quality. Plan quality is open-ended (many valid plans), so
the lab uses **comparative** evaluation (A vs. B) rather than absolute scoring.

## How it works

A plan comparison runs through a Haiku **judge** that scores both plans on each
of eight criteria (in `judges/plan/plan.criteria.ts` — the encoded definition of
a good plan), emits a per-criterion winner plus a holistic winner, and a summary.

The **runner** wraps the judge in two rigor checks:

- **Position swap** — judges forward (A,B) and swapped (B,A). If the holistic
  winner flips, the result is `BIASED` and resolves to `tie` (the judge can't
  hold a stable opinion → the plans are too close to separate).
- **Tally cross-check** — computes a winner from the per-criterion favors and
  flags `contested` if it disagrees with the holistic call (catches the judge's
  verdict desyncing from its own reasoning).

A result is **clean** when it's neither biased nor contested. Trust clean
verdicts; read `BIASED` as "too close to call."

## Scenarios

Test cases live in `scenarios/NN-name/` as real files (`direction.md`,
`conventions.md`, `plan-a.json`, `plan-b.json`, `scenario.ts`) with a known
`expectedWinner`. The suite spans the difficulty range — clear winners (objective
flaws like over-engineering or missing context) and genuine ties (close,
equally-good plans) — so the judge is validated both on picking real differences
and refraining on close calls.

## Run

```bash
npm run lab
```

Runs every scenario and prints, per scenario: the verdict, the expected winner,
agreement, and whether the result was clean or shaky.

## Finding

Most plan pairs from a decent Planner are close. The lab's highest-value use is
**detecting objective flaws** (missing context, overloaded tasks, hallucinated
fields, over-engineering) — where the judge is clean and confident — not
holistic winner-picking on near-ties.
