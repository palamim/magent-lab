import 'dotenv/config';

import { runExperiment } from '@/experiments/planner-prompt.experiment';
import { freshPlanPromptBaseline, freshPlanPromptCurrent } from '@/experiments/planner-prompts';
import { liveMagentFixture } from '@/fixtures/live-magent';

const main = async () => {
  await runExperiment(
    {
      name: 'baseline',
      promptVersion: 'planner-v0-1to3files',
      model: 'claude-haiku-4-5',
      buildPrompt: (d, f, c) => freshPlanPromptBaseline(d, f, c),
    },
    {
      name: 'distinct-deliverables',
      promptVersion: 'planner-v1-deliverables',
      model: 'claude-haiku-4-5',
      buildPrompt: (d, f, c) => freshPlanPromptCurrent(d, f, c),
    },
    [liveMagentFixture()],
    1, // N per fixture
  );
  console.log('\n✅ Experiment complete. Query the DB for results.');
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
