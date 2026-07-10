import type { GateEvaluation } from '@/lab/instruments/judges/types/common.types';
import type { ExpectedAnswer } from '@/lab/fixtures/labeled-diffs/labeled-diff.types';

export interface CriterionAgreement {
  criterion: string;
  expected: ExpectedAnswer;
  actual: ExpectedAnswer;
  matched: boolean;
  reasoning: string;
}

export const checkAgreement = (
  evaluation: GateEvaluation,
  expected: Record<string, ExpectedAnswer>,
): CriterionAgreement[] => {
  return evaluation.criteria.map((c) => {
    const exp = expected[c.criterion];
    if (exp === undefined) {
      throw new Error(
        `Judge returned criterion "${c.criterion}" with no ground-truth label. Labels: ${Object.keys(expected).join(', ')}`,
      );
    }
    return {
      criterion: c.criterion,
      expected: exp,
      actual: c.answer,
      matched: c.answer === exp,
      reasoning: c.reasoning,
    };
  });
};
