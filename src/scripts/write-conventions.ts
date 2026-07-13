import 'dotenv/config';

import { approveConventions } from '@/lab/experiments/api/conventions.api';
import { getArchitectRunByRepoKey } from '@/lab/records/db/agent-runs.repo';
import { getRepoKey } from '@/lib/projects';

interface WriteConventionsResult {
  written: boolean;
}

export const writeConventions = async (dir: string): Promise<WriteConventionsResult> => {
  const repoKey = getRepoKey(dir) ?? dir;
  const architectRun = await getArchitectRunByRepoKey(repoKey);
  const output = architectRun.output as unknown as { conventions: string };
  const conventions = output.conventions;
  return await approveConventions(dir, conventions);
};

// ═══ RUNNABLE SCRIPT ═══
const main = async () => {
  const dir = process.argv[2];
  if (!dir) {
    throw new Error('Usage: tsx src/scripts/write-conventions.ts <directory_path>');
  }

  console.log(`Running Write Conventions on directory: "${dir}"...`);

  const run = await writeConventions(dir);

  console.log(`\n✅ Write Conventions completed!`);
  console.log(`  ⋱ Written: ${run.written}`);
};

// Only execute main if the file is run directly via CLI
if (process.argv[1] === import.meta.filename) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
