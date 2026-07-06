import { prisma } from '@/lab/records/db/client';
import type { CriterionKind } from '@/lab/records/db/generated/prisma/client';
import type { AgentType } from '@/lab/types/common.types';

export const persistCriterion = async (
  name: string,
  description: string,
  kind: CriterionKind,
  agentType: AgentType,
): Promise<string> => {
  const latest = await prisma.criterion.findFirst({
    where: { name: name, agentType: agentType },
    orderBy: { version: 'desc' },
  });

  if (latest && latest.description === description && latest.kind === kind) {
    return latest.id;
  }

  const nextVersion = latest ? latest.version + 1 : 1;
  const created = await prisma.criterion.create({
    data: { name, description, kind, version: nextVersion, agentType: agentType },
  });
  return created.id;
};
