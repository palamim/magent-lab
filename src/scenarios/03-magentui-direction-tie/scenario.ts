import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Scenario } from '@/scenarios/scenario.types';
import { ROOTS } from '@/lib/projects';

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(here, file), 'utf8');

export const directionTieScenario: Scenario = {
  name: '03-magentui-direction-tie',
  description:
    'Two genuinely good plans for the same DirectionView direction, by different valid decompositions. ' +
    'Plan A: three tasks (restructure, build component, wire in). Plan B: two tasks (header+rationale, then ' +
    'component+wiring together). Both bounded, both sound, neither clearly better. Ground truth: B. ' +
    'Tests whether the judge correctly recognizes equivalence instead of manufacturing a winner.' +
    'The initial intent was to fake a tie, but the judge correctly pointed Plan B as genuinely better',
  direction: read('direction.md'),
  conventions: read('conventions.md'),
  planA: read('plan-a.json'),
  planB: read('plan-b.json'),
  projectRoot: ROOTS.magentUi,
  expectedWinner: 'B',
};
