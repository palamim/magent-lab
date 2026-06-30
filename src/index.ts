// src/index.ts
import 'dotenv/config';
import { anthropic } from '@/lib/anthropic';
import { runScenario } from '@/runner/run';
import { feedbackLoopScenario } from '@/scenarios/feedback-loop-v1-vs-v2/scenario';

const main = async () => {
  console.log(`\n🧪 Running scenario: ${feedbackLoopScenario.name}\n`);
  console.log(feedbackLoopScenario.description, '\n');

  const result = await runScenario(anthropic, feedbackLoopScenario);

  console.log('─'.repeat(60));
  console.log(`Forward run  (A=planA, B=planB):  winner = ${result.forwardWinner}`);
  console.log(`Swapped run  (A=planB, B=planA):  winner = ${result.swappedWinner} (translated back)`);
  console.log(`Position biased? ${result.positionBiased ? 'YES — judge flipped on swap' : 'no — consistent'}`);
  console.log('─'.repeat(60));
  console.log(`\n⚖️  Consistent verdict: ${result.consistentWinner}`);
  if (result.expectedWinner) {
    console.log(`📌 Expected (ground truth): ${result.expectedWinner}`);
    console.log(
      `${result.agreedWithExpected ? '✅ Judge AGREED with ground truth' : '❌ Judge DISAGREED with ground truth'}`,
    );
  }
  console.log(`\n--- Forward reasoning ---\n${result.forwardReasoning}`);
  console.log(`\n--- Swapped reasoning ---\n${result.swappedReasoning}\n`);
};

main().catch((err) => {
  console.error('Run failed:', err);
  process.exit(1);
});
