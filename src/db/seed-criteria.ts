import 'dotenv/config';

import { gateCriteria, comparativeCriteria } from '@/judges/plan/plan.criteria';
import { getOrCreateCriterion } from '@/db/records';
import { prisma } from '@/db/client';

const seed = async () => {
  for (const [name, description] of Object.entries(gateCriteria)) {
    const id = await getOrCreateCriterion(name, description, 'gate');
    console.log(`gate: ${name} → ${id}`);
  }
  for (const [name, description] of Object.entries(comparativeCriteria)) {
    const id = await getOrCreateCriterion(name, description, 'comparative');
    console.log(`comparative: ${name} → ${id}`);
  }
  await prisma.$disconnect();
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
