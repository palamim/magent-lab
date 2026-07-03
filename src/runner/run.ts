import type Anthropic from '@anthropic-ai/sdk';
import { comparePlans, judgePlan } from '@/judges/plan/plan.judge';
import type { Scenario } from '@/scenarios/scenario.types';
import type { ComparativeEvaluation, GateEvaluation, Verdict } from '@/judges/types/common.types';
import { fetchPlanContext, type FetchedFile } from '@/lib/fetch-plan-context';

interface GatedPlan {
  gate: GateEvaluation;
  failedGates: string[];
  passed: boolean;
  files: FetchedFile[];
}

export interface RunResult {
  scenario: string;

  winner: Verdict;
  decidedBy: 'gate' | 'comparison';

  // gate phase (each plan judged once, independently)
  planAGate: GatedPlan;
  planBGate: GatedPlan;

  // comparison phase — only populated when both plans passed all gates
  forwardWinner?: Verdict;
  swappedWinner?: Verdict;
  positionBiased?: boolean;
  forwardComparison?: ComparativeEvaluation;
  swappedComparison?: ComparativeEvaluation;

  expectedWinner: Verdict | undefined;
  agreedWithExpected: boolean | undefined;
}

const unswap = (v: Verdict): Verdict => (v === 'A' ? 'B' : v === 'B' ? 'A' : 'tie');

const gatePlan = async (
  client: Anthropic,
  direction: string,
  conventions: string,
  plan: string,
  projectRoot: string | undefined,
): Promise<GatedPlan> => {
  const { block, files } = fetchPlanContext(plan, projectRoot);
  const gate = await judgePlan(client, direction, conventions, plan, block);
  const failedGates = gate.criteria.filter((c) => c.answer === 'no').map((c) => c.criterion);
  return { gate, files, failedGates, passed: failedGates.length === 0 };
};

export const runScenario = async (client: Anthropic, scenario: Scenario): Promise<RunResult> => {
  const { direction, conventions, planA, planB, projectRoot } = scenario;

  // ── GATE PHASE — each plan judged once, independently ──
  const [planAGate, planBGate] = await Promise.all([
    gatePlan(client, direction, conventions, planA, projectRoot),
    gatePlan(client, direction, conventions, planB, projectRoot),
  ]);

  const base = {
    scenario: scenario.name,
    planAGate,
    planBGate,
    expectedWinner: scenario.expectedWinner,
  };

  // ── GATE RESOLUTION — a failed gate disqualifies the plan ──
  if (!planAGate.passed || !planBGate.passed) {
    const winner: Verdict = planAGate.passed ? 'A' : planBGate.passed ? 'B' : 'tie';
    return {
      ...base,
      winner,
      decidedBy: 'gate',
      agreedWithExpected: scenario.expectedWinner ? winner === scenario.expectedWinner : undefined,
    };
  }

  // ── COMPARISON PHASE — both plans valid; compare with position-swap ──
  const [forward, swapped] = await Promise.all([
    comparePlans(client, direction, conventions, planA, planB),
    comparePlans(client, direction, conventions, planB, planA),
  ]);

  const forwardWinner = forward.holisticWinner;
  const swappedWinner = unswap(swapped.holisticWinner);
  const positionBiased = forwardWinner !== swappedWinner;
  const winner: Verdict = positionBiased ? 'tie' : forwardWinner;

  return {
    ...base,
    winner,
    decidedBy: 'comparison',
    forwardWinner,
    swappedWinner,
    positionBiased,
    forwardComparison: forward,
    swappedComparison: swapped,
    agreedWithExpected: scenario.expectedWinner ? winner === scenario.expectedWinner : undefined,
  };
};

// runner/run.ts — add these two exported functions (keep runScenario as-is for regression)

export interface GateOutcome {
  passed: boolean;
  criteria: { criterion: string; passed: boolean; reasoning: string }[];
  files: FetchedFile[];
}

// Gate a SINGLE plan. Returns per-criterion pass/fail + reasoning (for recording).
export const gate = async (
  client: Anthropic,
  direction: string,
  conventions: string,
  plan: string,
  projectRoot: string | undefined,
): Promise<GateOutcome> => {
  const { block, files } = fetchPlanContext(plan, projectRoot);
  const gateEval = await judgePlan(client, direction, conventions, plan, block);
  const criteria = gateEval.criteria.map((c) => ({
    criterion: c.criterion,
    passed: c.answer === 'yes',
    reasoning: c.reasoning,
  }));
  return { passed: criteria.every((c) => c.passed), criteria, files };
};

export interface CompareOutcome {
  winner: Verdict;
  positionBiased: boolean;
  forward: ComparativeEvaluation;
  swapped: ComparativeEvaluation;
}

// Compare TWO plans (assumes both already passed gates). Position-swap corrected.
export const compare = async (
  client: Anthropic,
  direction: string,
  conventions: string,
  planA: string,
  planB: string,
): Promise<CompareOutcome> => {
  const [forward, swapped] = await Promise.all([
    comparePlans(client, direction, conventions, planA, planB),
    comparePlans(client, direction, conventions, planB, planA),
  ]);
  const forwardWinner = forward.holisticWinner;
  const swappedWinner = unswap(swapped.holisticWinner);
  const positionBiased = forwardWinner !== swappedWinner;
  return {
    winner: positionBiased ? 'tie' : forwardWinner,
    positionBiased,
    forward,
    swapped,
  };
};
