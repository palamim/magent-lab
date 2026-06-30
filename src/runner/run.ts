import type Anthropic from '@anthropic-ai/sdk';
import { judgePlans } from '@/judges/plan/plan.judge';
import type { Scenario } from '@/scenarios/scenario.types';
import type { ComparativeEvaluation, Verdict } from '@/judges/types/common.types';

interface SingleJudgement {
  holistic: Verdict; // the model's holistic winner
  tally: Verdict; // computed from per-criterion favors
  agreed: boolean; // holistic === tally
  evaluation: ComparativeEvaluation;
}

export interface RunResult {
  scenario: string;

  // forward + swapped, each in original plan labels
  forwardWinner: Verdict;
  swappedWinner: Verdict;

  // position-bias check (on the holistic winner)
  consistentWinner: Verdict;
  positionBiased: boolean;

  // tally cross-check
  forwardTally: Verdict;
  swappedTally: Verdict;
  contested: boolean; // holistic disagreed with its own tally in either run

  expectedWinner: Verdict | undefined;
  agreedWithExpected: boolean | undefined;

  forward: SingleJudgement;
  swapped: SingleJudgement;
}

const unswap = (v: Verdict): Verdict => (v === 'A' ? 'B' : v === 'B' ? 'A' : 'tie');

const computeTally = (evaluation: ComparativeEvaluation): Verdict => {
  const counts: Record<Verdict, number> = { A: 0, B: 0, tie: 0 };
  for (const c of evaluation.criteria) counts[c.favors]++;
  if (counts.A > counts.B) return 'A';
  if (counts.B > counts.A) return 'B';
  return 'tie';
};

const judge = async (
  client: Anthropic,
  direction: string,
  conventions: string,
  planA: string,
  planB: string,
): Promise<SingleJudgement> => {
  const evaluation = await judgePlans(client, direction, conventions, planA, planB);
  const holistic = evaluation.holisticWinner;
  const tally = computeTally(evaluation);
  return { holistic, tally, agreed: holistic === tally, evaluation };
};

export const runScenario = async (client: Anthropic, scenario: Scenario): Promise<RunResult> => {
  // forward: position A = planA, position B = planB
  const forward = await judge(client, scenario.direction, scenario.conventions, scenario.planA, scenario.planB);

  // swapped: position A = planB, position B = planA
  const swappedRaw = await judge(client, scenario.direction, scenario.conventions, scenario.planB, scenario.planA);

  // translate the swapped run's verdicts back to original plan labels
  const swappedHolistic = unswap(swappedRaw.holistic);
  const swappedTally = unswap(swappedRaw.tally);

  // position bias check on the holistic winner
  const positionBiased = forward.holistic !== swappedHolistic;
  const consistentWinner: Verdict = positionBiased ? 'tie' : forward.holistic;

  // contested if, in EITHER run, the model's holistic call disagreed with its own per-criterion tally
  const contested = !forward.agreed || !swappedRaw.agreed;

  return {
    scenario: scenario.name,
    forwardWinner: forward.holistic,
    swappedWinner: swappedHolistic,
    consistentWinner,
    positionBiased,
    forwardTally: forward.tally,
    swappedTally,
    contested,
    expectedWinner: scenario.expectedWinner,
    agreedWithExpected: scenario.expectedWinner ? consistentWinner === scenario.expectedWinner : undefined,
    forward,
    swapped: { ...swappedRaw, holistic: swappedHolistic, tally: swappedTally },
  };
};
