import 'dotenv/config';

import { prisma } from '@/lab/records/db/client';
import { plannerSubjects } from '@/lab/subjects/planner/planner-subjects';
import { persistSubject } from '@/lab/records/db/subjects.repo';

const seedSubjects = async () => {
  try {
    for (const subject of plannerSubjects) {
      const id = await persistSubject(subject);
      console.log(`planner subject ${subject.key} → ${id}`);
    }
  } finally {
    await prisma.$disconnect();
  }
};

seedSubjects().catch((e) => {
  console.error(e);
  process.exit(1);
});
