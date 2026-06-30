import 'dotenv/config';
import { anthropic } from '@/lib/anthropic';
import { runScenario } from '@/runner/run';
import { feedbackLoopScenario } from '@/scenarios/01-magent-feedback-loop/scenario';
import { directionReviewScenario } from '@/scenarios/02-magentui-direction-review/scenario';
import { directionTieScenario } from '@/scenarios/03-magentui-direction-tie/scenario';
import { directionDegradedContextScenario } from '@/scenarios/04-magentui-direction-degraded-context/scenario';
import type { CriterionJudgment } from '@/judges/types/common.types';

const scenarios = [
  feedbackLoopScenario,
  directionReviewScenario,
  directionTieScenario,
  directionDegradedContextScenario,
];

const formatCriteria = (criteria: CriterionJudgment[]): string =>
  criteria.map((c) => `   [${c.favors}] ${c.criterion}`).join('\n');

const main = async () => {
  for (const scenario of scenarios) {
    console.log(`\n🧪 ${scenario.name}`);
    const r = await runScenario(anthropic, scenario);
    const clean = !r.positionBiased && !r.contested;
    console.log(
      `   verdict=${r.consistentWinner}  expected=${r.expectedWinner ?? '—'}  ` +
        `${r.agreedWithExpected === undefined ? '' : r.agreedWithExpected ? '✅' : '❌'}  ` +
        `[${clean ? 'clean' : `${r.positionBiased ? 'BIASED ' : ''}${r.contested ? 'CONTESTED' : ''}`}]`,
    );
  }
};

main().catch((err) => {
  console.error('Run failed:', err);
  process.exit(1);
});
