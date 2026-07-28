import { execSync } from 'node:child_process';

export const getGitCommitSha = (): string => {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};
