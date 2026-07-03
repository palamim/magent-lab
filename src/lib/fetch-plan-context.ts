// src/lib/fetch-plan-context.ts
import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

interface PlanTask {
  targetFiles?: string[];
  contextFiles?: string[];
}
interface PlanShape {
  tasks?: PlanTask[];
}

export interface FetchedFile {
  path: string; // the path as written in the plan
  resolvedPath: string; // what we actually tried to read
  found: boolean;
}

export interface PlanContext {
  block: string; // formatted for the prompt
  files: FetchedFile[]; // for logging / inspection
}

// If a project root is given, relative paths resolve against it (the real repo),
// NOT against process.cwd() (which is magent-lab). Absolute paths are used as-is.
const normalize = (path: string, projectRoot?: string): string => {
  if (isAbsolute(path)) return path;
  return projectRoot ? resolve(projectRoot, path) : resolve(path);
};

const collectPaths = (planJson: string): string[] => {
  let plan: PlanShape;
  try {
    plan = JSON.parse(planJson) as PlanShape;
  } catch {
    return [];
  }
  const paths = new Set<string>();
  for (const task of plan.tasks ?? []) {
    for (const f of task.targetFiles ?? []) paths.add(f);
    for (const f of task.contextFiles ?? []) paths.add(f);
  }
  return [...paths];
};

export const fetchPlanContext = (planJson: string, projectRoot?: string): PlanContext => {
  const paths = collectPaths(planJson);
  const files: FetchedFile[] = [];
  const parts: string[] = [];

  for (const path of paths) {
    const resolvedPath = normalize(path, projectRoot);
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
    block: parts.length ? parts.join('\n\n') : '(no files referenced by this plan)',
    files,
  };
};
