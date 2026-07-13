import { getPlannerFixture } from '@/lab/records/db/fixtures.repo';
import { getPlannerSubject } from '@/lab/records/db/subjects.repo';
import { persistRun } from '@/lab/records/db/runs.repo';
import { buildPrompt } from '@/lab/experiments/runner/utils/build-prompt.utils';
import { generatePlan } from '@/lab/experiments/api/generate-plan.api';
import { computeCost } from '@/lab/instruments/metrics/cost';
import type { PlannerInput } from '@/lab/fixtures/fixtures.types';

export interface GeneratedRun {
  runId: string;
  plan: unknown;
  dir: string;
  input: PlannerInput;
}

export const generatePlannerRun = async (
  fixtureKey: string,
  subjectKey: string,
  experimentId: string,
): Promise<GeneratedRun> => {
  const fixture = await getPlannerFixture(fixtureKey);
  const subject = await getPlannerSubject(subjectKey);

  const prompt = buildPrompt(subject.prompt, fixture.input as unknown as Record<string, string>);

  const t0 = Date.now();
  const result = await generatePlan(fixture.dir, prompt, subject.model);
  const latencyMs = Date.now() - t0;

  const runId = await persistRun({
    fixtureId: fixture.id,
    subjectId: subject.id,
    experimentId,
    prompt,
    model: subject.model,
    output: result.plan,
    steps: result.steps,
    toolCalls: result.toolCalls,
    readFileCalls: result.readFileCalls,
    filesRead: result.filesRead,
    latencyMs,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: computeCost(subject.model, result.inputTokens, result.outputTokens),
  });

  return { runId, plan: result.plan, dir: fixture.dir, input: fixture.input };
};
