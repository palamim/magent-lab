import type { Criterion } from '@/lab/instruments/judges/types/common.types';
import { CriterionCategory } from '@/lab/records/db/generated/prisma/client';

/**
 * CRITERIA: How agents are actually evaluated.
 *
 * KEY: Since LLMs are judging LLMs, the key is making the evaluation criteria as concrete, boolean,
 * and unambiguous as possible to prevent the judge from hallucinating or being overly lenient.
 */

const rawFunctionalCorrectnessCriteria: Omit<Criterion, 'category'>[] = [
  {
    name: 'Requirement Fulfillment',
    description:
      'Does the code actually solve the core problem or implement the requested feature without leaving placeholders like // TODO: implement this?',
    version: 1,
  },
  {
    name: 'Scope Containment',
    description:
      'Did the agent stay within the bounds of the request, or did it aggressively refactor unrelated files or introduce out-of-scope features?',
    version: 1,
  },
];

export const functionalCorrectnessCriteria: Criterion[] = rawFunctionalCorrectnessCriteria.map((c) => ({
  ...c,
  category: CriterionCategory.FUNCTIONAL_CORRECTNESS,
}));
