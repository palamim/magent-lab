import 'dotenv/config';

import { prisma } from '@/lab/records/db/client';
import { checkJudgeRunIntegrity } from '@/lab/records/reports/judge-run-integrity';
import type { Answer } from '@/lab/instruments/metrics/judge-stats';

interface StoredAgreement {
  criterion: string;
  expected: Answer;
  actual: Answer;
  matched: boolean;
  reasoning: string;
}

export interface ReplicateEntry {
  actual: Answer;
  reasoning: string;
  createdAt: Date;
}

export interface DivergentCell {
  diffKey: string;
  criterion: string;
  expected: Answer;
  split: string; // "4-1" or "3-2" — never "5-0", those are excluded
  replicates: ReplicateEntry[]; // ordered by createdAt (best available proxy for replicate order — see judge-run-integrity notes)
}

/**
 * Finds every (diffKey, criterion) cell where the judge's 5 replicate answers were
 * NOT unanimous, and returns each replicate's answer + reasoning side by side.
 * Read-only — reads already-persisted JudgeRun rows, writes nothing.
 */
export const findDivergentCells = async (
  experimentId: string,
  expectedRunsPerDiff = 5,
): Promise<{ subjectKey: string; totalCells: number; divergentCells: DivergentCell[] }> => {
  const integrity = await checkJudgeRunIntegrity(experimentId, expectedRunsPerDiff);
  if (!integrity.ok) {
    const detail = integrity.failures
      .map((f) => `${f.diffKey}/${f.criterion} (${f.reason}: expected ${f.expected}, got ${f.actual})`)
      .join('; ');
    throw new Error(
      `Refusing to analyze experiment "${experimentId}" — integrity check failed with ${integrity.failures.length} cell(s): ${detail}`,
    );
  }

  const rows = await prisma.judgeRun.findMany({
    where: { experimentId },
    select: { diffKey: true, agreements: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = new Map<
    string,
    { diffKey: string; criterion: string; expected: Answer; replicates: ReplicateEntry[] }
  >();

  for (const row of rows) {
    const agreements = row.agreements as unknown as StoredAgreement[];
    for (const a of agreements) {
      const key = `${row.diffKey}::${a.criterion}`;
      const entry: ReplicateEntry = { actual: a.actual, reasoning: a.reasoning, createdAt: row.createdAt };
      const existing = grouped.get(key);
      if (existing) {
        existing.replicates.push(entry);
      } else {
        grouped.set(key, { diffKey: row.diffKey, criterion: a.criterion, expected: a.expected, replicates: [entry] });
      }
    }
  }

  const divergentCells: DivergentCell[] = [];
  for (const cell of grouped.values()) {
    const yes = cell.replicates.filter((r) => r.actual === 'yes').length;
    const no = cell.replicates.length - yes;
    if (yes === 0 || no === 0) continue; // unanimous (5-0) — not a divergence
    divergentCells.push({
      diffKey: cell.diffKey,
      criterion: cell.criterion,
      expected: cell.expected,
      split: `${Math.max(yes, no)}-${Math.min(yes, no)}`,
      replicates: cell.replicates,
    });
  }

  divergentCells.sort((a, b) => a.diffKey.localeCompare(b.diffKey) || a.criterion.localeCompare(b.criterion));

  return { subjectKey: integrity.subjectKey, totalCells: grouped.size, divergentCells };
};

// ═══ RUNNABLE SCRIPT ═══

const main = async () => {
  const experimentId = process.argv[2];
  if (!experimentId) {
    throw new Error('Usage: tsx src/lab/records/reports/judge-reasoning-divergence.ts <experimentId>');
  }

  const { subjectKey, totalCells, divergentCells } = await findDivergentCells(experimentId);

  console.log(`\n═══ Reasoning divergence — experiment ${experimentId} (${subjectKey}) ═══\n`);
  console.log(`  ${divergentCells.length} of ${totalCells} cells are non-unanimous.\n`);

  for (const cell of divergentCells) {
    console.log(`  ── ${cell.diffKey} / ${cell.criterion} ──`);
    console.log(`    split: ${cell.split}   ground truth: ${cell.expected}\n`);
    cell.replicates.forEach((r, i) => {
      console.log(`    [${i + 1}] actual: ${r.actual}`);
      console.log(`        reasoning: ${r.reasoning}`);
    });
    console.log('');
  }

  await prisma.$disconnect();
};

if (process.argv[1] === import.meta.filename) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
