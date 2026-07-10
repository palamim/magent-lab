import { wrongFileNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v1/0002-wrong-file-naming';
import { magentUiConventions } from '@/lab/fixtures/labeled-diffs/conventions/v2/_conventions';
import { anthropic } from '@/lab/instruments/clients/anthropic';
import { runConventionsJudge } from '@/lab/instruments/judges/conventions/conventions.judge';

// Fixtures & Subjects
const conventions = magentUiConventions;
const codeDiff = wrongFileNamingDiff.diff;
const CRITERIA_VERSION = 2;
const PROMPT_VERSION = 2;

const main = async () => {
  console.log('Experiment 0003-code-diff started.');
  const startTime = performance.now();

  const judgement = await runConventionsJudge(anthropic, conventions, codeDiff, CRITERIA_VERSION, PROMPT_VERSION);

  const endTime = performance.now();
  const timeTakenMs = endTime - startTime;
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
