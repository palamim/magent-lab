// src/lab/records/reports/queries.ts — the analytical questions, as functions
import { prisma } from '@/lab/records/db/client';

const num = (v: unknown): number => (v == null ? 0 : Number(v));

// per-SUBJECT summary within one experiment: gate-pass-rate, cost, latency, exploration
export const subjectSummary = async (experimentId: string) => {
  const rows = await prisma.$queryRaw<
    {
      subject_key: string;
      model: string;
      n: bigint;
      pass_rate: number;
      avg_latency_ms: number;
      avg_cost_usd: number;
      avg_read_file_calls: number;
      avg_steps: number;
    }[]
  >`
    SELECT
      s.key                        AS subject_key,
      s.model                      AS model,
      COUNT(*)                     AS n,
      AVG(r."allGatesPassed"::int) AS pass_rate,
      AVG(r."latencyMs")           AS avg_latency_ms,
      AVG(r."costUsd")             AS avg_cost_usd,
      AVG(r."readFileCalls")       AS avg_read_file_calls,
      AVG(r.steps)                 AS avg_steps
    FROM "Run" r
    JOIN "Subject" s ON s.id = r."subjectId"
    WHERE r."experimentId" = ${experimentId}
    GROUP BY s.key, s.model
    ORDER BY pass_rate DESC
  `;
  return rows.map((r) => ({
    subject: r.subject_key,
    model: r.model,
    n: num(r.n),
    passRate: num(r.pass_rate),
    avgLatencyMs: num(r.avg_latency_ms),
    avgCostUsd: num(r.avg_cost_usd),
    avgReadFileCalls: num(r.avg_read_file_calls),
    avgSteps: num(r.avg_steps),
  }));
};

// which gate criteria fail most, within one experiment, per subject
export const gateFailuresBySubject = async (experimentId: string) => {
  const rows = await prisma.$queryRaw<
    {
      subject_key: string;
      criterion: string;
      failures: bigint;
    }[]
  >`
    SELECT s.key AS subject_key, c.name AS criterion, COUNT(*) AS failures
    FROM "GateResult" gr
    JOIN "Run" r       ON r.id = gr."runId"
    JOIN "Subject" s   ON s.id = r."subjectId"
    JOIN "Criterion" c ON c.id = gr."criterionId"
    WHERE gr.passed = false AND r."experimentId" = ${experimentId}
    GROUP BY s.key, c.name
    ORDER BY failures DESC
  `;
  return rows.map((r) => ({ subject: r.subject_key, criterion: r.criterion, failures: num(r.failures) }));
};

// head-to-head: which subject won, within one experiment
// (winner is 'A'/'B'/'tie' — map back to subject keys via the runs)
export const headToHead = async (experimentId: string) => {
  const rows = await prisma.$queryRaw<
    {
      winner: string;
      decided_by: string;
      count: bigint;
    }[]
  >`
    SELECT winner, "decidedBy" AS decided_by, COUNT(*) AS count
    FROM "Comparison" cmp
    JOIN "Run" ra ON ra.id = cmp."runAId"
    WHERE ra."experimentId" = ${experimentId}
    GROUP BY winner, "decidedBy"
    ORDER BY count DESC
  `;
  return rows.map((r) => ({ winner: r.winner, decidedBy: r.decided_by, count: num(r.count) }));
};
