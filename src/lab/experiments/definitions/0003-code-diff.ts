import { wrongFileNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v1/0002-wrong-file-naming';
import { magentUiConventions } from '@/lab/fixtures/labeled-diffs/conventions/v1/_conventions';
import { anthropic } from '@/lab/instruments/clients/anthropic';
import { runConventionsJudge } from '@/lab/instruments/judges/conventions/conventions.judge';

const conventions = magentUiConventions;
const codeDiff = wrongFileNamingDiff.diff;

const main = async () => {
  console.log('Experiment 0003-code-diffs started.');

  // 1. Capture start time
  const startTime = performance.now();

  // 2. Judge
  const judgement = await runConventionsJudge(anthropic, conventions, codeDiff);

  // 3. Capture end time and calculate difference
  const endTime = performance.now();
  const timeTakenMs = endTime - startTime;

  // 4. Math out the seconds and milliseconds
  const seconds = Math.floor(timeTakenMs / 1000);
  const milliseconds = Math.round(timeTakenMs % 1000);

  console.log(`⏱️ Judge execution time: ${seconds}s ${milliseconds}ms\n`);

  judgement.criteria.map((criterion) => {
    console.log(`Criterion: ${criterion.criterion}`);
    console.log(` ⋱ Answer: ${criterion.answer}`);
    console.log(` ⋱ Reasoning: ${criterion.reasoning}`);
    console.log('');
  });
};

main();
