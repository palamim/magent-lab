import type { Criterion } from '@/lab/instruments/judges/types/common.types';
import { CriterionCategory } from '@/lab/records/db/generated/prisma/client';

/**
 * CRITERIA: How agents are actually evaluated.
 *
 * KEY: Since LLMs are judging LLMs, the key is making the evaluation criteria as concrete, boolean,
 * and unambiguous as possible to prevent the judge from hallucinating or being overly lenient.
 */

const rawCodeQualityCriteria: Omit<Criterion, 'category'>[] = [
  {
    name: "DRY (Don't Repeat Yourself)",
    description:
      'Did the agent duplicate existing logic instead of extracting it into a reusable function or referencing an existing utility?',
    version: 1,
  },
  {
    name: 'Hardcoded Values',
    description:
      'Did the agent hardcode "magic numbers" or strings instead of using constants, environment variables, or configuration files?',
    version: 1,
  },
];

export const codeQualityCriteria: Criterion[] = rawCodeQualityCriteria.map((c) => ({
  ...c,
  category: CriterionCategory.CODE_QUALITY,
}));
