import type Anthropic from '@anthropic-ai/sdk';
import { comparePlans } from '@/lab/instruments/judges/plan/plan.judge';
import { persistComparison } from '@/lab/records/db/comparisons.repo';
import type { GeneratedRun } from '@/lab/experiments/runner/generate-run';
import type { Verdict } from '@/lab/instruments/judges/types/common.types';

const unswap = (v: 'A' | 'B' | 'tie'): 'A' | 'B' | 'tie' => (v === 'A' ? 'B' : v === 'B' ? 'A' : 'tie');

export const comparePlannerRuns = async (
  client: Anthropic,
  runA: GeneratedRun,
  runB: GeneratedRun,
  aPassed: boolean,
  bPassed: boolean,
): Promise<{ winner: Verdict }> => {
  if (!aPassed || !bPassed) {
    const winner = aPassed && bPassed ? 'tie' : aPassed ? 'A' : bPassed ? 'B' : 'tie';
    await persistComparison({
      runAId: runA.runId,
      runBId: runB.runId,
      winner,
      decidedBy: 'gate',
      positionBiased: false,
      reasoning: { note: 'decided by gate — one or both plans failed gates', aPassed, bPassed },
    });
    return { winner };
  }

  const planA = JSON.stringify(runA.plan);
  const planB = JSON.stringify(runB.plan);
  const [forward, swapped] = await Promise.all([
    comparePlans(client, runA.input.direction, runA.input.conventions, planA, planB),
    comparePlans(client, runA.input.direction, runA.input.conventions, planB, planA),
  ]);

  const forwardWinner = forward.holisticWinner;
  const swappedWinner = unswap(swapped.holisticWinner);
  const positionBiased = forwardWinner !== swappedWinner;
  const winner = positionBiased ? 'tie' : forwardWinner;

  await persistComparison({
    runAId: runA.runId,
    runBId: runB.runId,
    winner,
    decidedBy: 'comparison',
    positionBiased,
    reasoning: { forward, swapped },
  });

  return { winner };
};
