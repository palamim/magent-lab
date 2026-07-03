import { prisma } from '@/db/client';
import type { CriterionKind, Verdict, DecidedBy } from '@/generated/prisma/client';

// ── Criteria: version-safe. Reword = new version, never mutate history. ──

/**
 * Returns the criterion id for this (name, description, kind).
 * If the latest version has the SAME description, reuse it.
 * If the description differs (a reword), insert a NEW version — old runs keep pointing at the old wording.
 */
export const getOrCreateCriterion = async (name: string, description: string, kind: CriterionKind): Promise<string> => {
  const latest = await prisma.criterion.findFirst({
    where: { name },
    orderBy: { version: 'desc' },
  });

  if (latest && latest.description === description && latest.kind === kind) {
    return latest.id; // unchanged — reuse
  }

  const nextVersion = latest ? latest.version + 1 : 1;
  const created = await prisma.criterion.create({
    data: { name, description, kind, version: nextVersion },
  });
  return created.id;
};

// ── Fixtures: version-safe pattern. Editing a direction = new version. ──

export const getOrCreateFixture = async (input: {
  name: string;
  direction: string;
  conventions: string;
  fileList: string[]; // paths only — the Planner's starting map
}): Promise<string> => {
  const latest = await prisma.fixture.findFirst({
    where: { name: input.name },
    orderBy: { version: 'desc' },
  });

  const unchanged =
    latest &&
    latest.direction === input.direction &&
    latest.conventions === input.conventions &&
    JSON.stringify(latest.fileList) === JSON.stringify(input.fileList);

  if (unchanged) return latest.id;

  const nextVersion = latest ? latest.version + 1 : 1;
  const created = await prisma.fixture.create({
    data: {
      name: input.name,
      version: nextVersion,
      direction: input.direction,
      conventions: input.conventions,
      fileList: input.fileList,
    },
  });
  return created.id;
};

// ── Plan runs: the plan + cost + behavior + its per-criterion gate results, atomically. ──

export interface GateResultInput {
  criterionId: string;
  passed: boolean;
  reasoning: string;
}

export interface PlanRunInput {
  configName: string;
  promptVersion: string;
  model: string;
  fixtureId: string;
  planJson: unknown;
  allGatesPassed: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  steps: number;
  toolCalls: number;
  readFileCalls: number;
  filesRead: string[];
  gateResults: GateResultInput[];
}

/**
 * Insert a plan run and all its gate results in ONE transaction.
 * If any gate-result insert fails, the whole thing rolls back — no orphaned plan_runs.
 */
export const recordPlanRun = async (input: PlanRunInput): Promise<string> => {
  const run = await prisma.planRun.create({
    data: {
      configName: input.configName,
      promptVersion: input.promptVersion,
      model: input.model,
      fixtureId: input.fixtureId,
      planJson: input.planJson as object,
      allGatesPassed: input.allGatesPassed,
      latencyMs: input.latencyMs,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      costUsd: input.costUsd,
      steps: input.steps,
      toolCalls: input.toolCalls,
      readFileCalls: input.readFileCalls,
      filesRead: input.filesRead,
      gateResults: {
        create: input.gateResults.map((g) => ({
          criterionId: g.criterionId,
          passed: g.passed,
          reasoning: g.reasoning,
        })),
      },
    },
  });
  return run.id;
};

// ── Comparisons: head-to-head result. ──

export const recordComparison = async (input: {
  fixtureName: string;
  planAId: string;
  planBId: string;
  winner: Verdict;
  decidedBy: DecidedBy;
  positionBiased: boolean;
  reasoningJson: unknown;
}): Promise<string> => {
  const created = await prisma.comparison.create({
    data: {
      fixtureName: input.fixtureName,
      planAId: input.planAId,
      planBId: input.planBId,
      winner: input.winner,
      decidedBy: input.decidedBy,
      positionBiased: input.positionBiased,
      reasoningJson: input.reasoningJson as object,
    },
  });
  return created.id;
};

// ── Analytics: raw SQL for the questions Prisma's API handles awkwardly. ──

/** Which criteria fail plans most often? */
export const gateFailuresByCriterion = async (): Promise<{ criterion: string; failures: bigint }[]> => {
  return prisma.$queryRaw`
    SELECT c.name AS criterion, COUNT(*) AS failures
    FROM "GateResult" gr
    JOIN "Criterion" c ON c.id = gr."criterionId"
    WHERE gr.passed = false
    GROUP BY c.name
    ORDER BY failures DESC
  `;
};

/** Gate-pass-rate + avg cost/latency by config — the "is the new prompt better" numbers. */
export const configSummary = async (): Promise<
  {
    config_name: string;
    n: bigint;
    pass_rate: number;
    avg_latency_ms: number;
    avg_cost_usd: number;
    avg_read_file_calls: number;
  }[]
> => {
  return prisma.$queryRaw`
    SELECT
      "configName"       AS config_name,
      COUNT(*)           AS n,
      AVG("allGatesPassed"::int)  AS pass_rate,
      AVG("latencyMs")   AS avg_latency_ms,
      AVG("costUsd")     AS avg_cost_usd,
      AVG("readFileCalls") AS avg_read_file_calls
    FROM "PlanRun"
    GROUP BY "configName"
  `;
};

// records.ts — map each gate criterion NAME to its latest-version id, for gate_results FK
export const getGateCriterionIds = async (): Promise<Record<string, string>> => {
  const rows = await prisma.criterion.findMany({
    where: { kind: 'gate' },
    orderBy: { version: 'desc' },
  });
  // keep the highest version per name (first seen, since ordered desc)
  const byName: Record<string, string> = {};
  for (const r of rows) {
    if (!(r.name in byName)) byName[r.name] = r.id;
  }
  return byName;
};
