import 'dotenv/config';

import { gateCriteria, comparativeCriteria } from '@/lab/instruments/judges/plan/plan.criteria';
import { prisma } from '@/lab/records/db/client';
import { persistCriterion } from '@/lab/records/db/criteria.repo';
import { AgentType } from '@/lab/types/common.types';

const seed = async () => {
  for (const [name, description] of Object.entries(gateCriteria)) {
    const id = await persistCriterion(name, description, 'gate', AgentType.PLANNER);
    console.log(`gate: ${name} → ${id}`);
  }
  for (const [name, description] of Object.entries(comparativeCriteria)) {
    const id = await persistCriterion(name, description, 'comparative', AgentType.PLANNER);
    console.log(`comparative: ${name} → ${id}`);
  }
  await prisma.$disconnect();
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
