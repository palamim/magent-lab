import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Scenario } from '@/scenarios/scenario.types';

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(here, file), 'utf8');

export const feedbackLoopScenario: Scenario = {
  name: 'feedback-loop-v1-vs-v2',
  description:
    'Real Magent output: two plans for the "deepen the feedback loop" frontier. ' +
    'Plan A over-engineered (keyword categorizer + second JSONL the direction did not ask for). ' +
    'Plan B captures structured metadata at the source — better, simpler. Ground truth: B wins.',
  direction: read('direction.md'),
  conventions: read('conventions.md'),
  planA: read('plan-a.json'),
  planB: read('plan-b.json'),
  expectedWinner: 'B',
};
