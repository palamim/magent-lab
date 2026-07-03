import 'dotenv/config';
import { anthropic } from '@/lib/anthropic';
import { runScenario } from '@/runner/run';
import type { RunResult } from '@/runner/run';
import { feedbackLoopScenario } from '@/scenarios/01-magent-feedback-loop/scenario';
import { directionReviewScenario } from '@/scenarios/02-magentui-direction-review/scenario';
import { directionTieScenario } from '@/scenarios/03-magentui-direction-tie/scenario';
import { directionDegradedContextScenario } from '@/scenarios/04-magentui-direction-degraded-context/scenario';
import { newPlannerPromptScenario } from '@/scenarios/05-magentui-new-planner-prompt/scenario';
import type { CriterionJudgment, GateJudgment } from '@/judges/types/common.types';
import type { FetchedFile } from './lib/fetch-plan-context';

const scenarios = [
  feedbackLoopScenario,
  directionReviewScenario,
  directionTieScenario,
  directionDegradedContextScenario,
  newPlannerPromptScenario,
];

const formatGates = (criteria: GateJudgment[]): string =>
  criteria.map((c) => `      [${c.answer === 'yes' ? '✓' : '✗'}] ${c.criterion} — ${c.reasoning}`).join('\n');

const formatComparative = (criteria: CriterionJudgment[]): string =>
  criteria.map((c) => `      [${c.favors}] ${c.criterion} — ${c.reasoning}`).join('\n');

const VERBOSE = true; // flip to false for quick scoreboard-only runs

const printResult = (r: RunResult): void => {
  console.log(`\n🧪 ${r.scenario}`);
  console.log('─'.repeat(64));
  const fmtFiles = (files: FetchedFile[]): string =>
    files.map((f) => `      ${f.found ? '✓' : '✗'} ${f.path}${f.found ? '' : '  → NOT FOUND'}`).join('\n');

  console.log(
    `   Plan A context (${r.planAGate.files.filter((f) => f.found).length}/${r.planAGate.files.length} found):`,
  );
  console.log(fmtFiles(r.planAGate.files));

  console.log(
    `   Plan B context (${r.planBGate.files.filter((f) => f.found).length}/${r.planBGate.files.length} found):`,
  );
  console.log(fmtFiles(r.planBGate.files));
  console.log('─'.repeat(64));
  console.log(`   Plan A gates: ${r.planAGate.passed ? 'PASSED' : `FAILED (${r.planAGate.failedGates.join(', ')})`}`);
  console.log(`   Plan B gates: ${r.planBGate.passed ? 'PASSED' : `FAILED (${r.planBGate.failedGates.join(', ')})`}`);

  if (VERBOSE) {
    console.log(`\n   Plan A gate reasoning:\n${formatGates(r.planAGate.gate.criteria)}`);
    console.log(`\n   Plan B gate reasoning:\n${formatGates(r.planBGate.gate.criteria)}`);
  }

  if (r.decidedBy === 'gate') {
    console.log(`   → decided by GATE`);
  } else {
    console.log(`   → both passed gates, decided by COMPARISON`);
    console.log(
      `     forward=${r.forwardWinner}  swapped=${r.swappedWinner}  ${r.positionBiased ? '(BIASED → tie)' : '(consistent)'}`,
    );
    if (VERBOSE && r.forwardComparison && r.swappedComparison) {
      console.log(`\n   Comparison (forward):\n${formatComparative(r.forwardComparison.criteria)}`);
      console.log(`\n   Comparison (swapped):\n${formatComparative(r.swappedComparison.criteria)}`);
    }
  }

  console.log(`\n   ⚖️  Verdict: ${r.winner}`);
  if (r.expectedWinner) {
    console.log(`   📌 Expected: ${r.expectedWinner}  ${r.agreedWithExpected ? '✅' : '❌'}`);
  }
};

const main = async () => {
  const results: RunResult[] = [];
  for (const scenario of scenarios) {
    const r = await runScenario(anthropic, scenario);
    results.push(r);
    printResult(r);
  }

  // scoreboard
  console.log(`\n${'═'.repeat(64)}\n SCOREBOARD`);
  for (const r of results) {
    const mark = r.agreedWithExpected === undefined ? '—' : r.agreedWithExpected ? '✅' : '❌';
    console.log(`   ${mark}  ${r.scenario}: ${r.winner} (expected ${r.expectedWinner ?? '—'}, by ${r.decidedBy})`);
  }
  console.log('');
};

main().catch((err) => {
  console.error('Run failed:', err);
  process.exit(1);
});
