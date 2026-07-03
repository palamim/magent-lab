import type { Verdict } from '@/judges/types/common.types';

export interface Scenario {
  name: string;
  description: string;
  direction: string;
  conventions: string;
  planA: string;
  planB: string;
  projectRoot: string;
  expectedWinner?: Verdict;
}
