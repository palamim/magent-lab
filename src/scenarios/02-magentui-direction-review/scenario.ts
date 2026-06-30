import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Scenario } from '@/scenarios/scenario.types';

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(here, file), 'utf8');

export const directionReviewScenario: Scenario = {
  name: '02-magentui-direction-review',
  description:
    'Two real Planner re-runs on the DirectionView legibility/trust direction. ' +
    'Both share flaws (abstract HOW, hallucinated goal/frontier fields). Plan A splits into a redesign ' +
    'plus a premature component-extraction task; Plan B is one denser redesign. Each has a roughly ' +
    'equal-and-opposite weakness (A over-engineers, B overloads), so the plans are genuinely close. ' +
    'Ground truth: tie. (Hand-judged A, then B across two passes before settling on tie — the back-and-forth ' +
    'is itself the evidence these are near-equal.) The judge flagging this BIASED/tie is correct behavior on a close pair.',
  direction: read('direction.md'),
  conventions: read('conventions.md'),
  planA: read('plan-a.json'),
  planB: read('plan-b.json'),
  expectedWinner: 'tie',
};
