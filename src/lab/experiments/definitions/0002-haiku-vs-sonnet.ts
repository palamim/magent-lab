import { anthropic } from '@/lab/instruments/clients/anthropic';
import { generatePlannerRun } from '@/lab/experiments/runner/generate-run';
import { gatePlannerRun } from '@/lab/experiments/runner/gate-run';
import { comparePlannerRuns } from '@/lab/experiments/runner/compare-runs';
import { experiment } from '@/lab/experiments/run-experiment';

const RUNS = 20;
const FIXTURES = ['0001-magent', '0002-magent-ui'];
const SUBJECT_A = 'baseline'; // Haiku
const SUBJECT_B = 'baseline-sonnet'; // Sonnet

experiment(`${SUBJECT_A} vs ${SUBJECT_B}`, async (experimentId) => {
  const started = Date.now();
  const total = FIXTURES.length * RUNS;
  let done = 0;
  const tally = { A: 0, B: 0, tie: 0 };

  console.log(`\n🧪 ${SUBJECT_A} vs ${SUBJECT_B}  —  ${total} comparisons (${FIXTURES.length} fixtures × ${RUNS})\n`);

  for (const fixtureKey of FIXTURES) {
    console.log(`─── fixture: ${fixtureKey} ───`);
    for (let i = 0; i < RUNS; i++) {
      const t0 = Date.now();

      const runA = await generatePlannerRun(fixtureKey, SUBJECT_A, experimentId);
      const runB = await generatePlannerRun(fixtureKey, SUBJECT_B, experimentId);
      const aPassed = await gatePlannerRun(anthropic, runA);
      const bPassed = await gatePlannerRun(anthropic, runB);
      const result = await comparePlannerRuns(anthropic, runA, runB, aPassed, bPassed);

      done++;
      const winner = result?.winner ?? '?';
      if (winner in tally) tally[winner as keyof typeof tally]++;

      const secs = ((Date.now() - t0) / 1000).toFixed(0);
      const gates = `A:${aPassed ? '✓' : '✗'} B:${bPassed ? '✓' : '✗'}`;
      console.log(
        `  [${String(done).padStart(2)}/${total}] ${fixtureKey} #${i + 1}  ${gates}  → ${winner}` +
          `   (${secs}s)  running tally A:${tally.A} B:${tally.B} tie:${tally.tie}`,
      );
    }
  }

  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(
    `\n✅ done in ${mins}min — final tally  A(${SUBJECT_A}):${tally.A}  B(${SUBJECT_B}):${tally.B}  tie:${tally.tie}`,
  );
  console.log(
    `   experiment id: ${experimentId}  →  report with: tsx src/lab/records/reports/report.ts ${experimentId}\n`,
  );
});
