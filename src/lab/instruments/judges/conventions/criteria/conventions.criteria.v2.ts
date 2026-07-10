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
    name: 'Structure and Placement Rules',
    description:
      'Does the code diff strictly place all new or modified files in the correct directories according to the exact placement rules in the Structure and Placement Rules section (e.g., database repos exclusively in src/lab/records/db/)?',
  },
  {
    name: 'Naming Conventions',
    description:
      'Do all file names (including exact role suffixes) and newly introduced code entities (interfaces, types, functions, constants) perfectly adhere to the casing and semantic rules defined in the Naming section?',
  },
  {
    name: 'File Rules',
    description:
      'Does every file in the diff comply with its specific per-file shape requirements from the File Rules section (e.g., required libs imports, strictly named exports, specific tool export structures)?',
  },
  {
    name: 'Code Idioms',
    description:
      'Does the code strictly use the mandated project idioms from the Code Idioms Section (e.g., @/ path aliases, type-level imports, process.env bracket notation, as const) and completely avoid the banned generic forms?',
  },
];

export const conventionsCriteriaV2: Criterion[] = rawConventionsCriteria.map((c) => ({
  ...c,
  category: CriterionCategory.PROJECT_CONVENTIONS,
}));
