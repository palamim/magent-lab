// src/runner/run.ts
import type Anthropic from '@anthropic-ai/sdk';
import { judgePlans } from '@/judges/plan/plan.judge';
import type { Scenario } from '@/scenarios/scenario.types';
import type { Verdict } from '@/judges/types/common.types';

export interface RunResult {
  scenario: string;
  forwardWinner: Verdict; // judged A=planA, B=planB
  swappedWinner: Verdict; // judged A=planB, B=planA (positions swapped)
  consistentWinner: Verdict; // the real verdict after correcting for position bias
  positionBiased: boolean; // true if the judge flipped when swapped
  expectedWinner?: Verdict | undefined;
  agreedWithExpected?: boolean | undefined;
  forwardReasoning: string;
  swappedReasoning: string;
}

// map a swapped-run verdict back to the original plan labels
const unswap = (v: Verdict): Verdict => (v === 'A' ? 'B' : v === 'B' ? 'A' : 'tie');

export const runScenario = async (client: Anthropic, scenario: Scenario): Promise<RunResult> => {
  // forward: A=planA, B=planB
  const forward = await judgePlans(client, scenario.direction, scenario.conventions, scenario.planA, scenario.planB);

  // swapped: A=planB, B=planA  (to detect position bias)
  const swapped = await judgePlans(client, scenario.direction, scenario.conventions, scenario.planB, scenario.planA);
  const swappedAsOriginal = unswap(swapped.winner); // translate back to original labels

  // consistent verdict: if both runs agree (after unswapping), trust it; if they disagree, it's a tie (just position bias)
  const positionBiased = forward.winner !== swappedAsOriginal;
  const consistentWinner: Verdict = positionBiased ? 'tie' : forward.winner;

  return {
    scenario: scenario.name,
    forwardWinner: forward.winner,
    swappedWinner: swappedAsOriginal,
    consistentWinner,
    positionBiased,
    expectedWinner: scenario.expectedWinner,
    agreedWithExpected: scenario.expectedWinner ? consistentWinner === scenario.expectedWinner : undefined,
    forwardReasoning: forward.reasoning,
    swappedReasoning: swapped.reasoning,
  };
};
