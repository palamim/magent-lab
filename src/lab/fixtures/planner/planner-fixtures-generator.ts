import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { generateFixtures, type FixturesOptions } from '@/lab/fixtures/fixtures-generator';
import type { Fixture, PlannerInput } from '@/lab/fixtures/fixtures.types';
import { collectProjectFiles } from '@/lib/files';
import { AgentType } from '@/lab/types/common.types';

export const generatePlannerFixtures = (options: FixturesOptions): Fixture<PlannerInput> => {
  const plannerInputFactory = (dir: string): PlannerInput => {
    const directionPath = join(dir, '.magent', 'planner', 'direction.md');
    const conventionsPath = join(dir, '.magent', 'executor', 'conventions.md');

    const direction = readFileSync(directionPath, 'utf-8');
    const conventions = readFileSync(conventionsPath, 'utf-8');

    const files = collectProjectFiles(dir);
    const fileList = files.join('\n');

    return {
      direction,
      conventions,
      fileList,
    };
  };
  const agentType = AgentType.PLANNER;

  return generateFixtures<PlannerInput>(options, agentType, plannerInputFactory);
};
