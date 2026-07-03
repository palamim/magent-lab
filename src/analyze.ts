import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { prisma } from '@/db/client';
import { configSummary, gateFailuresByCriterion } from '@/db/records';

const main = async () => {
  // 1. per-config summary (gate-pass-rate, cost, latency, exploration)
  const summary = await configSummary();

  // 2. which gates fail plans most
  const gateFailures = await gateFailuresByCriterion();

  // 3. head-to-head winner tally from comparisons
  const winnerRows = await prisma.comparison.groupBy({
    by: ['winner'],
    _count: { winner: true },
  });

  // 4. decidedBy breakdown (how many resolved by gate vs comparison)
  const decidedRows = await prisma.comparison.groupBy({
    by: ['decidedBy'],
    _count: { decidedBy: true },
  });

  // normalize BigInt → Number (Postgres COUNT/AVG return BigInt/Decimal)
  const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

  const results = {
    summary: summary.map((r) => ({
      config: r.config_name,
      n: num(r.n),
      passRate: num(r.pass_rate),
      avgLatencyMs: num(r.avg_latency_ms),
      avgCostUsd: num(r.avg_cost_usd),
      avgReadFileCalls: num(r.avg_read_file_calls),
    })),
    gateFailures: gateFailures.map((r) => ({
      criterion: r.criterion,
      failures: num(r.failures),
    })),
    winners: winnerRows.map((r) => ({ winner: r.winner, count: r._count.winner })),
    decidedBy: decidedRows.map((r) => ({ decidedBy: r.decidedBy, count: r._count.decidedBy })),
    generatedAt: new Date().toISOString(),
  };

  writeFileSync('results.json', JSON.stringify(results, null, 2));
  console.log('Wrote results.json:\n', JSON.stringify(results, null, 2));

  await prisma.$disconnect();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
