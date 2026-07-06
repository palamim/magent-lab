import { prisma } from '@/lab/records/db/client';
import { AgentType } from '@/lab/types/common.types';
import type { Subject } from '@/lab/subjects/subjects.types';

export const persistSubject = async (s: Subject): Promise<string> => {
  const existing = await prisma.subject.findUnique({
    where: { key_agentType: { key: s.key, agentType: s.agentType } },
  });
  if (existing) return existing.id;
  const created = await prisma.subject.create({
    data: {
      key: s.key,
      agentType: s.agentType,
      model: s.model,
      prompt: s.prompt,
      description: s.description ?? null,
    },
  });
  return created.id;
};

export const getSubjectByKey = async (key: string, agentType: AgentType) => {
  const row = await prisma.subject.findUnique({
    where: { key_agentType: { key, agentType } },
  });
  if (!row) throw new Error(`No ${agentType} subject with key: ${key}`);
  return row;
};

export const getPlannerSubject = async (key: string) => {
  return await getSubjectByKey(key, AgentType.PLANNER);
};
