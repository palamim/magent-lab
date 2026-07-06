import { prisma } from '@/lab/records/db/client';
import type { Verdict, DecidedBy } from '@/lab/records/db/generated/prisma/client';

export interface ComparisonInput {
  runAId: string;
  runBId: string;
  winner: Verdict;
  decidedBy: DecidedBy;
  positionBiased: boolean;
  reasoning: unknown;
}

export const persistComparison = async (input: ComparisonInput): Promise<string> => {
  const c = await prisma.comparison.create({
    data: {
      runAId: input.runAId,
      runBId: input.runBId,
      winner: input.winner,
      decidedBy: input.decidedBy,
      positionBiased: input.positionBiased,
      reasoning: input.reasoning as object,
    },
  });
  return c.id;
};
