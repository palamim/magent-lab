import { prisma } from '@/lab/records/db/client';
import { AgentType } from '@/lab/types/common.types';

export interface AgentRunInput {
  agentType: AgentType;
  model: string;
  prompt: string;
  steps: number;
  toolCalls: number;
  readFileCalls: number;
  filesRead: string[];
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  purpose: string;
  repoKey: string;
  output: Record<string, unknown>;
}

export const recordAgentRun = async (input: AgentRunInput): Promise<string> => {
  const run = await prisma.agentRun.create({
    data: {
      agentType: input.agentType,
      model: input.model,
      prompt: input.prompt,
      steps: input.steps,
      toolCalls: input.toolCalls,
      readFileCalls: input.readFileCalls,
      filesRead: input.filesRead,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      latencyMs: input.latencyMs,
      costUsd: input.costUsd,
      purpose: input.purpose,
      repoKey: input.repoKey,
      output: input.output as object,
    },
  });
  return run.id;
};

export const getArchitectRunByRepoKey = async (repoKey: string) => {
  const row = await prisma.agentRun.findFirst({
    where: { repoKey: repoKey, agentType: AgentType.ARCHITECT },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) throw new Error(`No architect run with repo key: ${repoKey}`);
  return row;
};
