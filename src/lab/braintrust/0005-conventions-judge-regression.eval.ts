import { Eval, initDataset } from 'braintrust';

import { anthropic } from '@/lab/instruments/clients/anthropic';
import { runConventionsJudge } from '@/lab/instruments/judges/conventions/conventions.judge';
import { checkAgreement } from '@/lab/instruments/metrics/agreement';
import { magentUiConventions } from '@/lab/fixtures/labeled-diffs/conventions/v2/_conventions';
import type { ExpectedAnswer } from '@/lab/fixtures/labeled-diffs/labeled-diff.types';
import type { GateEvaluation } from '@/lab/instruments/judges/types/common.types';

// Mirrors src/lab/experiments/definitions/0005-conventions-judge-regression.ts —
// same subject (conventions-judge-v2: criteria v2 + prompt v2), same conventions.md,
// just run against the "V2 Diffs Dataset" in Braintrust instead of Postgres.
const CRITERIA_VERSION = 2;
const PROMPT_VERSION = 2;

const criterionAgreement = ({
  output,
  expected,
}: {
  output: GateEvaluation;
  expected: Record<string, ExpectedAnswer>;
}) => {
  const agreements = checkAgreement(output, expected);
  const matched = agreements.filter((a) => a.matched).length;

  return [
    { name: 'Criterion Agreement', score: matched / agreements.length },
    { name: 'All Criteria Matched', score: agreements.every((a) => a.matched) ? 1 : 0 },
  ];
};

Eval<string, GateEvaluation, Record<string, ExpectedAnswer>>('My Project', {
  data: initDataset('My Project', { dataset: 'V2 Diffs Dataset' }),
  task: async (diff: string): Promise<GateEvaluation> => {
    return runConventionsJudge(anthropic, magentUiConventions, diff, CRITERIA_VERSION, PROMPT_VERSION);
  },
  scores: [criterionAgreement],
  experimentName: 'conventions-judge-v2 5x (sdk)',
  trialCount: 5,
  maxConcurrency: 5,
});
