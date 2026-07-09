import { conventionsCriteriaV1 } from '@/lab/instruments/judges/conventions/criteria/conventions.criteria.v1';
import { conventionsCriteriaV2 } from '@/lab/instruments/judges/conventions/criteria/conventions.criteria.v2';
import type { Criterion } from '../../types/common.types';

export const conventionsCriteria: Record<number, Criterion[]> = {
  1: conventionsCriteriaV1,
  2: conventionsCriteriaV2,
} as const;
