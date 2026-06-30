import 'dotenv/config';
import { anthropic } from '@/lib/anthropic';
import { runScenario } from '@/runner/run';
import type { CriterionJudgment } from '@/judges/types/common.types';
import { magentUiDirectionReviewScenario } from './scenarios/02-magentui-direction-review/scenario';

const formatCriteria = (criteria: CriterionJudgment[]): string =>
  criteria.map((c) => `   [${c.favors}] ${c.criterion} — ${c.reasoning}`).join('\n');

const main = async () => {
  const scenario = magentUiDirectionReviewScenario;
  console.log(`\n🧪 Running scenario: ${scenario.name}\n`);
  console.log(scenario.description, '\n');

  const result = await runScenario(anthropic, scenario);

  console.log('─'.repeat(64));
  console.log(`Forward  (A=planA, B=planB):  holistic=${result.forwardWinner}  tally=${result.forwardTally}`);
  console.log(
    `Swapped  (A=planB, B=planA):  holistic=${result.swappedWinner}  tally=${result.swappedTally}  (translated back)`,
  );
  console.log(`Position biased? ${result.positionBiased ? 'YES — holistic flipped on swap' : 'no — consistent'}`);
  console.log(
    `Contested? ${result.contested ? 'YES — holistic disagreed with its own tally' : 'no — holistic and tally agree'}`,
  );
  console.log('─'.repeat(64));

  console.log(`\n⚖️  Consistent verdict: ${result.consistentWinner}`);
  if (result.expectedWinner) {
    console.log(`📌 Ground truth: ${result.expectedWinner}`);
    console.log(
      result.agreedWithExpected ? '✅ Judge AGREED with ground truth' : '❌ Judge DISAGREED with ground truth',
    );
  }

  console.log(`\n── Forward per-criterion ──\n${formatCriteria(result.forward.evaluation.criteria)}`);
  console.log(`\n   Summary: ${result.forward.evaluation.summary}`);
  console.log(`\n── Swapped per-criterion ──\n${formatCriteria(result.swapped.evaluation.criteria)}`);
  console.log(`\n   Summary: ${result.swapped.evaluation.summary}\n`);
};

main().catch((err) => {
  console.error('Run failed:', err);
  process.exit(1);
});
