import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Scenario } from '@/scenarios/scenario.types';
import { ROOTS } from '@/lib/projects';

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(here, file), 'utf8');

export const newPlannerPromptScenario: Scenario = {
  name: '05-magentui-new-planner-prompt',
  description: '...',
  direction: read('direction.md'),
  conventions: read('conventions.md'),
  planA: read('plan-a.json'),
  planB: read('plan-b.json'),
  expectedWinner: 'B',
  projectRoot: ROOTS.magentUi,
};
