import { prisma } from '@/lab/records/db/client';

export const createExperiment = async (description: string) => {
  const created = await prisma.experiment.create({
    data: {
      description: description,
    },
  });
  return created.id;
};
