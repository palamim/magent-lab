import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Scenario } from '@/scenarios/scenario.types';

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(here, file), 'utf8');

export const directionTieScenario: Scenario = {
  name: '03-magentui-direction-tie',
  description:
    'Two genuinely good plans for the same DirectionView direction, by different valid decompositions. ' +
    'Plan A: three tasks (restructure, build component, wire in). Plan B: two tasks (header+rationale, then ' +
    'component+wiring together). Both bounded, both sound, neither clearly better. Ground truth: tie. ' +
    'Tests whether the judge correctly recognizes equivalence instead of manufacturing a winner.',
  direction: read('direction.md'),
  conventions: read('conventions.md'),
  planA: read('plan-a.json'),
  planB: read('plan-b.json'),
  expectedWinner: 'tie',
};
