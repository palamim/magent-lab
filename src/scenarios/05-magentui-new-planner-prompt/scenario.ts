import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Scenario } from '@/scenarios/scenario.types';

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(here, file), 'utf8');

export const newPlannerPromptCvA: Scenario = {
  name: '05-magentui-new-planner-prompt',
  description:
    'Two real Planner runs on the DirectionView legibility/trust direction. ' +
    'Both share flaws (abstract HOW). Plan A shows hallucinated goal/frontier fields, splits into a redesign ' +
    'plus a premature component-extraction task; Plan B is one denser redesign. The plans are genuinely close. ' +
    'Ground truth: B.',
  direction: read('direction.md'),
  conventions: read('conventions.md'),
  planA: read('plan-a.json'),
  planB: read('plan-b.json'),
  expectedWinner: 'B',
};
