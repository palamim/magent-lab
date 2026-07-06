import { readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.vscode', '.astro']);
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json', '.astro']);
const MAX_FILE_BYTES = 50_000;

export const collectProjectFiles = (dir: string, acc: string[] = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) collectProjectFiles(full, acc);
    } else if (SOURCE_EXTS.has(extname(entry)) && stats.size <= MAX_FILE_BYTES) {
      acc.push(full);
    }
  }
  return acc;
};
