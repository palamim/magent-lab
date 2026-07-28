import { prisma } from '@/lab/records/db/client';
import type { CriterionAgreement } from '@/lab/instruments/metrics/agreement';

export interface JudgeRunInput {
  experimentId: string;
  subjectKey: string;
  diffKey: string;
  model: string;
  criteriaVersion: number;
  promptVersion: number;
  gitCommitSha: string;
  latencyMs: number;
  allMatched: boolean;
  agreements: CriterionAgreement[];
}

export const recordJudgeRun = async (input: JudgeRunInput): Promise<string> => {
  const run = await prisma.judgeRun.create({
    data: {
      experimentId: input.experimentId,
      subjectKey: input.subjectKey,
      diffKey: input.diffKey,
      model: input.model,
      criteriaVersion: input.criteriaVersion,
      promptVersion: input.promptVersion,
      gitCommitSha: input.gitCommitSha,
      latencyMs: input.latencyMs,
      allMatched: input.allMatched,
      agreements: input.agreements as object,
    },
  });
  return run.id;
};
