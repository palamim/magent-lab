import { prisma } from '@/lab/records/db/client';
import type { Fixture, PlannerInput } from '@/lab/fixtures/fixtures.types';
import { AgentType } from '@/lab/types/common.types';

export const persistFixture = async (f: Fixture): Promise<string> => {
  const existing = await prisma.fixture.findUnique({
    where: { key_agentType: { key: f.key, agentType: f.agentType } },
  });
  if (existing) return existing.id;
  const created = await prisma.fixture.create({
    data: {
      key: f.key,
      agentType: f.agentType,
      description: f.description ?? null,
      dir: f.dir,
      input: f.input as object,
    },
  });
  return created.id;
};

export const getFixtureByKey = async (key: string, agentType: AgentType) => {
  const row = await prisma.fixture.findUnique({
    where: { key_agentType: { key, agentType } },
  });
  if (!row) throw new Error(`No ${agentType} fixture with key: ${key}`);
  return row;
};

export const getPlannerFixture = async (key: string) => {
  const row = await getFixtureByKey(key, AgentType.PLANNER);
  return { ...row, input: row.input as unknown as PlannerInput };
};
