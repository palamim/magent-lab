import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Scenario } from '@/scenarios/scenario.types';

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(here, file), 'utf8');

export const directionDegradedContextScenario: Scenario = {
  name: '04-magentui-direction-degraded-context',
  description:
    'Plan A is the good three-task plan (Plan C). Plan B is identical EXCEPT every task has empty ' +
    'contextFiles — the executor would have to guess the data model, CSS tokens, and provider API. ' +
    'One flaw isolated. Ground truth: A. Tests whether "Has enough context" fires when context is stripped.',
  direction: read('direction.md'),
  conventions: read('conventions.md'),
  planA: read('plan-a.json'),
  planB: read('plan-b.json'),
  expectedWinner: 'A',
};
