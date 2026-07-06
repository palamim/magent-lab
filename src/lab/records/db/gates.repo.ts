import { prisma } from '@/lab/records/db/client';
import type { AgentType } from '@/lab/types/common.types';

export interface GateResultInput {
  criterionId: string;
  passed: boolean;
  reasoning: string;
}

export const persistGateResults = async (runId: string, results: GateResultInput[]): Promise<void> => {
  await prisma.gateResult.createMany({
    data: results.map((r) => ({
      runId,
      criterionId: r.criterionId,
      passed: r.passed,
      reasoning: r.reasoning,
    })),
  });
};

export const getGateCriterionIds = async (agentType: AgentType): Promise<Record<string, string>> => {
  const rows = await prisma.criterion.findMany({
    where: { kind: 'gate', agentType },
    orderBy: { version: 'desc' },
  });
  const byName: Record<string, string> = {};
  for (const r of rows) {
    if (!(r.name in byName)) byName[r.name] = r.id;
  }
  return byName;
};
