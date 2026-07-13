import 'dotenv/config';

import { computeCost } from '@/lab/instruments/metrics/cost';
import { generateConventions } from '@/lab/experiments/api/conventions.api';
import { AgentType, type ArchitectRunResult } from '@/lab/types/common.types';
import { recordAgentRun } from '@/lab/records/db/agent-runs.repo';
import { getRepoKey } from '@/lib/projects';

export interface GeneratedArchitectRun {
  runId: string;
  conventions: string;
}

export const generateArchitectRun = async (dir: string): Promise<GeneratedArchitectRun> => {
  const t0 = Date.now();
  const result: ArchitectRunResult = await generateConventions(dir);
  const latencyMs = Date.now() - t0;
  const repoKey = getRepoKey(dir) ?? dir;

  const runId = await recordAgentRun({
    agentType: AgentType.ARCHITECT,
    model: result.model,
    prompt: result.prompt,
    steps: result.steps,
    toolCalls: result.toolCalls,
    readFileCalls: result.readFileCalls,
    filesRead: result.filesRead,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: latencyMs,
    costUsd: computeCost(result.model, result.inputTokens, result.outputTokens),
    purpose: 'Generating conventions.md doc',
    repoKey: repoKey,
    output: {
      conventions: result.conventions,
    },
  });

  return { runId, conventions: result.conventions };
};

// ═══ RUNNABLE SCRIPT ═══
const main = async () => {
  const dir = process.argv[2];
  if (!dir) {
    throw new Error('Usage: tsx src/lab/experiments/runner/generate-architect-run.ts <directory_path>');
  }

  console.log(`Running Architect Agent on directory: "${dir}"...`);

  const run = await generateArchitectRun(dir);

  console.log(`\n✅ Architect run completed successfully!`);
  console.log(`  ⋱ Run ID: ${run.runId}`);
  console.log(`  ⋱ Conventions generated (${run.conventions.length} characters)`);
};

// Only execute main if the file is run directly via CLI
if (process.argv[1] === import.meta.filename) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
