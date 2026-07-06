import { anthropic } from '@/lab/instruments/clients/anthropic';
import { generatePlannerRun } from '@/lab/experiments/runner/generate-run';
import { gatePlannerRun } from '@/lab/experiments/runner/gate-run';
import { comparePlannerRuns } from '@/lab/experiments/runner/compare-runs';
import { experiment } from '@/lab/experiments/run-experiment';

const RUNS = 20;
const FIXTURE_KEYS = ['0001-magent', '0002-magent-ui'];

experiment('baseline vs distinct-deliverables', async (experimentId: string) => {
  console.log(`Experiment ${experimentId} started.`);
  for (const fixtureKey of FIXTURE_KEYS) {
    console.log(` ⋱  Running fixture ${fixtureKey}.`);
    for (let i = 0; i < RUNS; i++) {
      const runA = await generatePlannerRun(fixtureKey, 'baseline', experimentId);
      console.log(` ⋱  Planner A ran.`);
      const runB = await generatePlannerRun(fixtureKey, 'distinct-deliverables', experimentId);
      console.log(` ⋱  Planner B ran.`);
      const aPassed = await gatePlannerRun(anthropic, runA);
      console.log(` ⋱  Planner A gated.`);
      const bPassed = await gatePlannerRun(anthropic, runB);
      console.log(` ⋱  Planner B gated.`);
      await comparePlannerRuns(anthropic, runA, runB, aPassed, bPassed);
      console.log(` ⋱  Planners compared on ${fixtureKey} run ${i + 1}/${RUNS}.`);
    }
  }
});
