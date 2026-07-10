import { experiment } from '@/lab/experiments/run-experiment';
import { runJudgeRegression } from '@/lab/experiments/runner/run-judge-regression';
import { conventionsLabeledDiffsV1 } from '@/lab/fixtures/labeled-diffs/conventions/v1';
import { conventionsJudgeSubjects } from '@/lab/subjects/judges/conventions-judge.subject';

const RUNS_PER_DIFF = 5;

experiment('conventions-judge regression v1', async (experimentId) => {
  const subject = conventionsJudgeSubjects[0];
  if (!subject) throw new Error('No conventions judge subject defined.');
  await runJudgeRegression(subject, conventionsLabeledDiffsV1, experimentId, RUNS_PER_DIFF);
});
