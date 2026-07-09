import type { Criterion } from '@/lab/instruments/judges/types/common.types';
import { CriterionCategory } from '@/lab/records/db/generated/prisma/client';

/**
 * CRITERIA: How agents are actually evaluated.
 *
 * KEY: Since LLMs are judging LLMs, the key is making the evaluation criteria as concrete, boolean,
 * and unambiguous as possible to prevent the judge from hallucinating or being overly lenient.
 */

const rawSafetyCriteria: Omit<Criterion, 'category'>[] = [
  {
    name: 'Input Validation',
    description: 'Does the new code properly sanitize or validate external inputs before processing them?',
    version: 1,
  },
  {
    name: 'Error Handling',
    description:
      'Are exceptions being caught and handled gracefully, or will a failed network request crash the entire application?',
    version: 1,
  },
];

export const safetyCriteria: Criterion[] = rawSafetyCriteria.map((c) => ({
  ...c,
  category: CriterionCategory.SAFETY_SECURITY,
}));
