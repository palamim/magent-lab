import 'dotenv/config';

import { prisma } from '@/lab/records/db/client';
import { agreementByCriterion } from '@/lab/records/reports/judge-agreement';

const num = (v: unknown) => (v == null ? 0 : Number(v));

const main = async () => {
  const experimentId = process.argv[2];
  if (!experimentId) throw new Error('Usage: tsx judge-report.ts <experimentId>');

  const rows = await agreementByCriterion(experimentId);

  console.log(`\n═══ Judge agreement — experiment ${experimentId} ═══\n`);
  for (const r of rows) {
    const pct = num(r.agreement_pct);
    const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20);
    console.log(`  ${r.criterion.padEnd(28)} ${bar} ${pct}%  (${num(r.matched)}/${num(r.total)})`);
  }
  console.log('');

  await prisma.$disconnect();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
