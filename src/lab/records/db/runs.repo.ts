import { prisma } from '@/lab/records/db/client';

export interface RunInput {
  fixtureId: string;
  subjectId: string;
  experimentId: string;
  prompt: string;
  model: string;
  output: unknown;
  steps: number;
  toolCalls: number;
  readFileCalls: number;
  filesRead: string[];
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export const persistRun = async (input: RunInput): Promise<string> => {
  const run = await prisma.run.create({
    data: {
      fixtureId: input.fixtureId,
      subjectId: input.subjectId,
      experimentId: input.experimentId,
      prompt: input.prompt,
      model: input.model,
      output: input.output as object,
      steps: input.steps,
      toolCalls: input.toolCalls,
      readFileCalls: input.readFileCalls,
      filesRead: input.filesRead,
      latencyMs: input.latencyMs,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      costUsd: input.costUsd,
      allGatesPassed: false,
    },
  });
  return run.id;
};

export const setRunGatesPassed = async (runId: string, passed: boolean): Promise<void> => {
  await prisma.run.update({ where: { id: runId }, data: { allGatesPassed: passed } });
};
