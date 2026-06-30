import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Scenario } from '@/scenarios/scenario.types';

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(here, file), 'utf8');

export const feedbackLoopScenario: Scenario = {
  name: '01-magent-feedback-loop',
  description:
    'Real Magent output: two plans for the "deepen the feedback loop" frontier. ' +
    'Plan A is over-engineered (keyword categorizer + a second derived JSONL the direction never asked for); ' +
    'Plan B captures structured metadata at the source — simpler, denser signal. ' +
    'A clear, objective difference (over-engineering vs. clean capture). Ground truth: B.',
  direction: read('direction.md'),
  conventions: read('conventions.md'),
  planA: read('plan-a.json'),
  planB: read('plan-b.json'),
  expectedWinner: 'B',
};
