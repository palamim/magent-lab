import 'dotenv/config';
import { join } from 'node:path';

const PROJECTS_ROOT = process.env.PROJECTS_ROOT;
if (!PROJECTS_ROOT) throw new Error('PROJECTS_ROOT not set in .env');

export const projectRoot = (repo: string): string => join(PROJECTS_ROOT, repo);

export const ROOTS = {
  magentBrain: projectRoot('magent-target'),
  magentUi: projectRoot('magent-ui'),
} as const;
