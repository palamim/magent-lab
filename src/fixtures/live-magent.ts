// src/fixtures/live-magent.ts — build a fixture from the REAL current repo state
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOTS } from '@/lib/projects';
import type { FixtureInput } from '@/fixtures/fixtures.types';

// walk the repo for a file list (mirrors what the brain's collectProjectFiles does)
const walk = (root: string, dir: string, acc: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.git', '.next', 'dist', '.magent'].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(root, full, acc);
    else acc.push(relative(root, full));
  }
  return acc;
};

export const liveMagentFixture = (): FixtureInput => {
  const root = ROOTS.magentBrain;
  return {
    name: 'magent-brain-live',
    direction: readFileSync(join(root, '.magent/planner', 'direction.md'), 'utf8'),
    conventions: readFileSync(join(root, '.magent/executor', 'conventions.md'), 'utf8'),
    fileList: walk(root, root),
    projectRoot: root,
  };
};
