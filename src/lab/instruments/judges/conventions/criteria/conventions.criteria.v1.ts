import type { Criterion } from '@/lab/instruments/judges/types/common.types';
import { CriterionCategory } from '@/lab/records/db/generated/prisma/client';

/**
 * CRITERIA: How agents are actually evaluated.
 *
 * KEY: Since LLMs are judging LLMs, the key is making the evaluation criteria as concrete, boolean,
 * and unambiguous as possible to prevent the judge from hallucinating or being overly lenient.
 */

const rawConventionsCriteria: Omit<Criterion, 'category'>[] = [
  {
    name: 'Architectural Compliance',
    description: 'Did the agent place files in the correct directories according to the project folder structure?',
  },
  {
    name: 'Naming Conventions',
    description: "Are variables, functions, and classes adhering to the project's semantic naming standards?",
  },
  {
    name: 'Pattern Adherence',
    description: "Is the code using the project's standard libraries and internal utilities?",
  },
];

export const conventionsCriteriaV1: Criterion[] = rawConventionsCriteria.map((c) => ({
  ...c,
  category: CriterionCategory.PROJECT_CONVENTIONS,
}));
