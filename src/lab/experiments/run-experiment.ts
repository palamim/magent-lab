import { prisma } from '@/lab/records/db/client';
import { createExperiment } from '@/lab/records/db/experiments.repo';

export const experiment = async (description: string, body: (experimentId: string) => Promise<void>) => {
  const experimentId = await createExperiment(description);
  try {
    await body(experimentId);
    console.log(`Experiment ${experimentId} complete.`);
  } finally {
    await prisma.$disconnect();
  }
};
