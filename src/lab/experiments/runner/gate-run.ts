import type Anthropic from '@anthropic-ai/sdk';

import { judgePlan } from '@/lab/instruments/judges/plan/plan.judge';
import { persistGateResults, getGateCriterionIds } from '@/lab/records/db/gates.repo';
import { setRunGatesPassed } from '@/lab/records/db/runs.repo';
import { fetchPlanContextFiles } from '@/lab/experiments/runner/utils/fetch-plan-context-files';
import { AgentType } from '@/lab/types/common.types';
import type { GeneratedRun } from '@/lab/experiments/runner/generate-run';

export const gatePlannerRun = async (client: Anthropic, run: GeneratedRun): Promise<boolean> => {
  const { filesBlock } = fetchPlanContextFiles(run.plan as any, run.dir);
  const stringifiedPlan = JSON.stringify(run.plan);

  const evaluation = await judgePlan(client, run.input.direction, run.input.conventions, stringifiedPlan, filesBlock);

  const criterionIds = await getGateCriterionIds(AgentType.PLANNER);
  const results = evaluation.criteria.map((c) => {
    const criterionId = criterionIds[c.criterion];
    if (!criterionId) {
      throw new Error(`No seeded planner criterion "${c.criterion}". Seeded: ${Object.keys(criterionIds).join(', ')}`);
    }
    return { criterionId, passed: c.answer === 'yes', reasoning: c.reasoning };
  });

  await persistGateResults(run.runId, results);

  const passed = results.every((r) => r.passed);
  await setRunGatesPassed(run.runId, passed);
  return passed;
};
