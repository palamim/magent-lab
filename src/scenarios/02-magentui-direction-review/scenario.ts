import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Scenario } from '@/scenarios/scenario.types';

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(here, file), 'utf8');

export const magentUiDirectionReviewScenario: Scenario = {
  name: 'feedback-loop-v1-vs-v2',
  description:
    'Two real Planner re-runs on the DirectionView legibility/trust direction. ' +
    'Both share flaws (abstract HOW, hallucinated goal/frontier fields) ' +
    'Plan A splits into redesign + a premature component-extraction task (over-engineering, first-use abstraction); ' +
    'Plan B is one focused redesign. Ground truth: B ' +
    `A's unrequested second task outweighs B's density` +
    `(Originally mis-judged as A; the judge caught the over-engineering in A's task 2.)`,
  direction: read('direction.md'),
  conventions: read('conventions.md'),
  planA: read('plan-a.json'),
  planB: read('plan-b.json'),
  expectedWinner: 'B', //
};
