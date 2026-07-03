// src/fixtures/magent-ui.ts
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOTS } from '@/lib/projects'; // your PROJECTS_ROOT helper

export interface FixtureInput {
  name: string;
  direction: string;
  conventions: string;
  fileList: string[]; // paths only — the Planner's starting map
  projectRoot: string; // real repo for read_file + judge fetch
}

// read a fixture's direction/conventions from the existing scenario folders
const scenarioDir = (n: string) => join(dirname(fileURLToPath(import.meta.url)), '..', 'scenarios', n);
const readFrom = (n: string, f: string) => readFileSync(join(scenarioDir(n), f), 'utf8');

// The fileList the Planner sees — a directory listing of the ui repo.
// Generate it once (see note below) or hardcode the relevant paths.
const uiFileList: string[] = [
  'src/modules/main-panel/direction.view.tsx',
  'src/modules/main-panel/plan.view.tsx',
  'src/modules/main-panel/task.view.tsx',
  'src/model/direction.model.ts',
  'src/providers/magent.provider.tsx',
  'app/globals.css',
  // ... the real listing — see note
];

export const magentUiFixtures: FixtureInput[] = [
  {
    name: 'direction-review',
    direction: readFrom('02-magentui-direction-review', 'direction.md'),
    conventions: readFrom('02-magentui-direction-review', 'conventions.md'),
    fileList: uiFileList,
    projectRoot: ROOTS.magentUi,
  },
  // ... your other ui directions
];
