import 'dotenv/config';
import { join } from 'node:path';

const PROJECTS_DIR = process.env.PROJECTS_DIR;
if (!PROJECTS_DIR) throw new Error('PROJECTS_DIR not set in .env');

export const dir = (repo: string): string => join(PROJECTS_DIR, repo);

export const DIRS = {
  magentBrain: dir('magent'),
  magentUi: dir('magent-ui'),
} as const;
