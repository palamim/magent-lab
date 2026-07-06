import 'dotenv/config';

import { plannerFixtures } from '@/lab/fixtures/planner/planner-fixtures';
import { generatePlannerFixtures } from '@/lab/fixtures/planner/planner-fixtures-generator';
import { persistFixture } from '@/lab/records/db/fixtures.repo';
import { prisma } from '@/lab/records/db/client';

const seedFixtures = async () => {
  try {
    for (const fixture of plannerFixtures) {
      const plannerFixture = generatePlannerFixtures(fixture);
      const id = await persistFixture(plannerFixture);
      console.log(`planner fixture ${fixture.key} → ${id}`);
    }
  } finally {
    await prisma.$disconnect();
  }
};

seedFixtures().catch((e) => {
  console.error(e);
  process.exit(1);
});
