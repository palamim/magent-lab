import { DIRS } from '@/lib/projects';
import type { FixturesOptions } from '@/lab/fixtures/fixtures-generator';

export const plannerFixtures: FixturesOptions[] = [
  {
    key: '0001-magent',
    description: 'Magent brain repo - directions, conventions, fileList',
    dir: DIRS.magentBrain,
  },
];
