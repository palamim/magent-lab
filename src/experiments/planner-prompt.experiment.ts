import { anthropic } from '@/lib/anthropic';
import { computeCost } from '@/lib/cost';
import { getOrCreateFixture, recordPlanRun, recordComparison, getGateCriterionIds } from '@/db/records';
import { gate, compare } from '@/runner/run';
import type { FixtureInput } from '@/fixtures/fixtures.types';

const BRAIN_URL = 'http://localhost:7842/api';

interface PlannerConfig {
  name: string;
  promptVersion: string;
  model: string;
  buildPrompt: (direction: string, fileList: string, conventions: string) => string;
}

interface PlannerRunResult {
  plan: unknown;
  steps: number;
  toolCalls: number;
  readFileCalls: number;
  filesRead: string[];
  inputTokens: number;
  outputTokens: number;
}

interface GenOutcome {
  planRunId: string | null;
  planJson: string | null;
  gatePassed: boolean;
  failed: boolean;
}

const callGeneratePlan = async (dir: string, prompt: string, model: string): Promise<PlannerRunResult> => {
  const res = await fetch(`${BRAIN_URL}/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dir, prompt, model }),
  });
  if (!res.ok) throw new Error(`generate-plan failed: ${res.status} ${await res.text()}`);
  return res.json();
};

const generateAndRecord = async (
  config: PlannerConfig,
  fixture: FixtureInput,
  fixtureId: string,
  criterionIds: Record<string, string>, // ← passed in, fetched once
): Promise<GenOutcome> => {
  const t0 = Date.now();
  const prompt = config.buildPrompt(fixture.direction, fixture.fileList.join('\n'), fixture.conventions);

  let result: PlannerRunResult;
  try {
    result = await callGeneratePlan(fixture.projectRoot, prompt, config.model);
  } catch (err) {
    console.log(`  ⚠️  ${config.name} failed to generate: ${err instanceof Error ? err.message : err}`);
    return { planRunId: null, planJson: null, gatePassed: false, failed: true };
  }

  const latencyMs = Date.now() - t0;
  const planJson = JSON.stringify(result.plan);

  const gateOutcome = await gate(anthropic, fixture.direction, fixture.conventions, planJson, fixture.projectRoot);
  const allGatesPassed = gateOutcome.passed;

  const gateResults = gateOutcome.criteria.map((g) => {
    const criterionId = criterionIds[g.criterion];
    if (!criterionId) {
      throw new Error(
        `No seeded criterion matches judge output "${g.criterion}". Seeded: ${Object.keys(criterionIds).join(', ')}`,
      );
    }
    return { criterionId, passed: g.passed, reasoning: g.reasoning };
  });

  const planRunId = await recordPlanRun({
    configName: config.name,
    promptVersion: config.promptVersion,
    model: config.model,
    fixtureId,
    planJson: result.plan,
    allGatesPassed,
    latencyMs,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: computeCost(config.model, result.inputTokens, result.outputTokens),
    steps: result.steps,
    toolCalls: result.toolCalls,
    readFileCalls: result.readFileCalls,
    filesRead: result.filesRead,
    gateResults,
  });

  return { planRunId, planJson, gatePassed: allGatesPassed, failed: false };
};

export const runExperiment = async (
  configA: PlannerConfig,
  configB: PlannerConfig,
  fixtures: FixtureInput[],
  nPerFixture: number,
): Promise<void> => {
  const criterionIds = await getGateCriterionIds();

  for (const fixture of fixtures) {
    const fixtureId = await getOrCreateFixture({
      name: fixture.name,
      direction: fixture.direction,
      conventions: fixture.conventions,
      fileList: fixture.fileList,
    });

    for (let i = 0; i < nPerFixture; i++) {
      console.log(`\n[${fixture.name}] run ${i + 1}/${nPerFixture}`);

      const a = await generateAndRecord(configA, fixture, fixtureId, criterionIds);
      const b = await generateAndRecord(configB, fixture, fixtureId, criterionIds);

      // if either config failed to generate a plan, record that outcome and move on.
      if (a.failed || b.failed) {
        const winner = a.failed && b.failed ? 'tie' : a.failed ? 'B' : 'A';
        console.log(`  ⚠️  generation failure — A failed:${a.failed} B failed:${b.failed} → ${winner}`);
        // only record a comparison if at least one plan exists to reference
        if (a.planRunId && b.planRunId) {
          await recordComparison({
            fixtureName: fixture.name,
            planAId: a.planRunId,
            planBId: b.planRunId,
            winner,
            decidedBy: 'gate',
            positionBiased: false,
            reasoningJson: { note: 'generation failure', aFailed: a.failed, bFailed: b.failed },
          });
        }
        continue;
      }

      if (a.gatePassed && b.gatePassed) {
        const cmp = await compare(anthropic, fixture.direction, fixture.conventions, a.planJson!, b.planJson!);
        await recordComparison({
          fixtureName: fixture.name,
          planAId: a.planRunId!,
          planBId: b.planRunId!,
          winner: cmp.winner,
          decidedBy: 'comparison',
          positionBiased: cmp.positionBiased,
          reasoningJson: { forward: cmp.forward, swapped: cmp.swapped },
        });
        console.log(`  A gates:${a.gatePassed} B gates:${b.gatePassed} → winner ${cmp.winner}`);
      } else {
        const winner = a.gatePassed ? 'A' : b.gatePassed ? 'B' : 'tie';
        await recordComparison({
          fixtureName: fixture.name,
          planAId: a.planRunId!,
          planBId: b.planRunId!,
          winner,
          decidedBy: 'gate',
          positionBiased: false,
          reasoningJson: { note: 'decided by gate failure' },
        });
        console.log(`  A gates:${a.gatePassed} B gates:${b.gatePassed} → winner ${winner} (by gate)`);
      }
    }
  }
};
