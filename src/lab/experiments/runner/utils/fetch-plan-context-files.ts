// src/lib/fetch-plan-context.ts
import type { Plan } from '@/lab/types/common.types';
import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

export interface FetchedFile {
  path: string;
  resolvedPath: string;
  found: boolean;
}

export interface PlanContextFiles {
  filesBlock: string;
  files: FetchedFile[];
}

const normalize = (path: string, projectRoot?: string): string => {
  if (isAbsolute(path)) return path;
  return projectRoot ? resolve(projectRoot, path) : resolve(path);
};

const collectPaths = (plan: Plan): string[] => {
  const paths = new Set<string>();
  for (const task of plan.tasks ?? []) {
    for (const f of task.targetFiles ?? []) paths.add(f);
    for (const f of task.contextFiles ?? []) paths.add(f);
  }
  return [...paths];
};

export const fetchPlanContextFiles = (plan: Plan, dir: string): PlanContextFiles => {
  const paths = collectPaths(plan);
  const files: FetchedFile[] = [];
  const parts: string[] = [];

  for (const path of paths) {
    const resolvedPath = normalize(path, dir);
    try {
      const content = readFileSync(resolvedPath, 'utf8');
      files.push({ path, resolvedPath, found: true });
      parts.push(`// ── ${path} ──\n${content}`);
    } catch {
      files.push({ path, resolvedPath, found: false });
      parts.push(`// ── ${path} ──\n// (file not found — likely created by an earlier task in this plan)`);
    }
  }

  return {
    filesBlock: parts.length ? parts.join('\n\n') : '(no files referenced by this plan)',
    files,
  };
};
