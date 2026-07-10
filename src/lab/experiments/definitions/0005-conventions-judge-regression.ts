import { experiment } from '@/lab/experiments/run-experiment';
import { runJudgeRegression } from '@/lab/experiments/runner/run-judge-regression';
import { conventionsLabeledDiffsV2 } from '@/lab/fixtures/labeled-diffs/conventions/v2';
import { conventionsJudgeSubjects } from '@/lab/subjects/judges/conventions-judge.subject';

const RUNS_PER_DIFF = 5;

experiment('conventions-judge regression v2', async (experimentId) => {
  const subjectKey = 'conventions-judge-v2';
  const subject = conventionsJudgeSubjects.find((judge) => judge.key === subjectKey);
  if (!subject) throw new Error(`No conventions judge subject defined for the key ${subjectKey}.`);
  await runJudgeRegression(subject, conventionsLabeledDiffsV2, experimentId, RUNS_PER_DIFF);
});
