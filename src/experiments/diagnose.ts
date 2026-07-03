import 'dotenv/config';
import { liveMagentFixture } from '@/fixtures/live-magent';
import { freshPlanPromptBaseline, freshPlanPromptCurrent } from '@/experiments/planner-prompts';

const BRAIN_URL = 'http://localhost:7842/api';

const callGeneratePlan = async (dir: string, prompt: string, model: string) => {
  const res = await fetch(`${BRAIN_URL}/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dir, prompt, model }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
};

const main = async () => {
  const fixture = liveMagentFixture();
  const dir = fixture.projectRoot;
  const fileList = fixture.fileList.join('\n');
  const model = 'claude-haiku-4-5';

  // run each prompt 3 times to see if failure is consistent or a flake
  for (const [label, build] of [
    ['baseline', freshPlanPromptBaseline],
    ['current', freshPlanPromptCurrent],
  ] as const) {
    console.log(`\n=== ${label} ===`);
    for (let i = 1; i <= 3; i++) {
      const prompt = build(fixture.direction, fileList, fixture.conventions);
      try {
        const r = await callGeneratePlan(dir, prompt, model);
        console.log(
          `  run ${i}: OK — steps=${r.steps}, readFileCalls=${r.readFileCalls}, tasks=${r.plan?.tasks?.length}`,
        );
      } catch (e) {
        console.log(`  run ${i}: FAILED — ${e instanceof Error ? e.message : e}`);
      }
    }
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
