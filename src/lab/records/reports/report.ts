import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { prisma } from '@/lab/records/db/client';
import { subjectSummary, gateFailuresBySubject, headToHead } from '@/lab/records/reports/queries';

const REPORTS_DIR = 'src/lab/records/reports/output';

const main = async () => {
  const experimentId = process.argv[2];
  if (!experimentId) throw new Error('Usage: tsx report.ts <experimentId>');

  const [summary, gateFailures, h2h] = await Promise.all([
    subjectSummary(experimentId),
    gateFailuresBySubject(experimentId),
    headToHead(experimentId),
  ]);

  const report = { experimentId, summary, gateFailures, headToHead: h2h, generatedAt: new Date().toISOString() };

  mkdirSync(REPORTS_DIR, { recursive: true });
  const path = join(REPORTS_DIR, `${experimentId}.json`);
  writeFileSync(path, JSON.stringify(report, null, 2));
  writeFileSync(join(REPORTS_DIR, 'latest.json'), JSON.stringify(report, null, 2));

  // also print a readable summary to console — lab-flavored
  console.log(`\n═══ Experiment ${experimentId} ═══\n`);
  console.log('SUBJECT SUMMARY');
  for (const s of summary) {
    console.log(
      `  ${s.subject} (${s.model}): pass ${(s.passRate * 100).toFixed(0)}% | ${s.avgReadFileCalls.toFixed(1)} reads | ${s.avgSteps.toFixed(1)} steps | $${s.avgCostUsd.toFixed(5)} | ${Math.round(s.avgLatencyMs)}ms | n=${s.n}`,
    );
  }
  console.log('\nHEAD-TO-HEAD');
  for (const h of h2h) console.log(`  ${h.winner} (${h.decidedBy}): ${h.count}`);
  console.log('\nTOP GATE FAILURES');
  for (const g of gateFailures.slice(0, 8)) console.log(`  ${g.subject} — ${g.criterion}: ${g.failures}`);
  console.log('');

  await prisma.$disconnect();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
