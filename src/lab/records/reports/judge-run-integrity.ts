import 'dotenv/config';

import { prisma } from '@/lab/records/db/client';
import { conventionsLabeledDiffsV1 } from '@/lab/fixtures/labeled-diffs/conventions/v1';
import { conventionsLabeledDiffsV2 } from '@/lab/fixtures/labeled-diffs/conventions/v2';
import { conventionsCriteria } from '@/lab/instruments/judges/conventions/criteria';

export interface IntegrityFailure {
  diffKey: string;
  criterion: string;
  expected: number;
  actual: number;
  reason: 'missing_rows' | 'extra_rows' | 'unexpected_pair';
}

export interface IntegrityReport {
  experimentId: string;
  subjectKey: string;
  expectedCells: number;
  replicatesPerDiff: number;
  failures: IntegrityFailure[];
  ok: boolean;
}

type CellCountRow = { diffKey: string; criterion: string; cnt: bigint };

// Which labeled-diff set and criteria version each judge subject is exercised against.
// Mirrors the wiring in experiments/definitions/0004-*.ts and 0005-*.ts — not derivable
// from JudgeSubject alone, since it has no diffSetVersion field.
const SUBJECT_FIXTURE_MAP: Record<string, { diffKeys: string[]; criteria: string[] }> = {
  'conventions-judge-v1': {
    diffKeys: conventionsLabeledDiffsV1.map((d) => d.key),
    criteria: (conventionsCriteria[1] ?? []).map((c) => c.name),
  },
  'conventions-judge-v2': {
    diffKeys: conventionsLabeledDiffsV2.map((d) => d.key),
    criteria: (conventionsCriteria[2] ?? []).map((c) => c.name),
  },
};

export const checkJudgeRunIntegrity = async (
  experimentId: string,
  expectedRunsPerDiff = 5,
): Promise<IntegrityReport> => {
  const subjectRows = await prisma.$queryRaw<{ subjectKey: string }[]>`
    SELECT DISTINCT "subjectKey" FROM "JudgeRun" WHERE "experimentId" = ${experimentId}
  `;
  if (subjectRows.length === 0) {
    throw new Error(`No JudgeRun rows found for experiment "${experimentId}".`);
  }
  if (subjectRows.length > 1) {
    throw new Error(
      `Experiment "${experimentId}" mixes multiple subjectKeys (${subjectRows.map((r) => r.subjectKey).join(', ')}) — expected exactly one.`,
    );
  }

  const subjectKey = subjectRows[0]!.subjectKey;
  const fixture = SUBJECT_FIXTURE_MAP[subjectKey];
  if (!fixture) {
    throw new Error(`No known diff/criteria mapping for subjectKey "${subjectKey}".`);
  }

  const rows = await prisma.$queryRaw<CellCountRow[]>`
    SELECT jr."diffKey" AS "diffKey", elem->>'criterion' AS criterion, COUNT(*) AS cnt
    FROM "JudgeRun" jr, jsonb_array_elements(jr.agreements) elem
    WHERE jr."experimentId" = ${experimentId}
    GROUP BY jr."diffKey", elem->>'criterion'
  `;

  const actual = new Map<string, number>();
  for (const row of rows) {
    actual.set(`${row.diffKey}::${row.criterion}`, Number(row.cnt));
  }

  const expectedCellKeys = new Set<string>();
  const failures: IntegrityFailure[] = [];

  for (const diffKey of fixture.diffKeys) {
    for (const criterion of fixture.criteria) {
      const cellKey = `${diffKey}::${criterion}`;
      expectedCellKeys.add(cellKey);
      const count = actual.get(cellKey) ?? 0;
      if (count !== expectedRunsPerDiff) {
        failures.push({
          diffKey,
          criterion,
          expected: expectedRunsPerDiff,
          actual: count,
          reason: count > expectedRunsPerDiff ? 'extra_rows' : 'missing_rows',
        });
      }
    }
  }

  // (diffKey, criterion) pairs present in the DB that fall outside the known fixture/criteria set —
  // e.g. a judge that hallucinated a criterion name, or a diffKey that no longer exists in source.
  for (const row of rows) {
    const cellKey = `${row.diffKey}::${row.criterion}`;
    if (!expectedCellKeys.has(cellKey)) {
      failures.push({
        diffKey: row.diffKey,
        criterion: row.criterion,
        expected: 0,
        actual: Number(row.cnt),
        reason: 'unexpected_pair',
      });
    }
  }

  return {
    experimentId,
    subjectKey,
    expectedCells: fixture.diffKeys.length * fixture.criteria.length,
    replicatesPerDiff: expectedRunsPerDiff,
    failures,
    ok: failures.length === 0,
  };
};

// ═══ RUNNABLE SCRIPT ═══
const main = async () => {
  const experimentId = process.argv[2];
  if (!experimentId) {
    throw new Error('Usage: tsx src/lab/records/reports/judge-run-integrity.ts <experimentId> [expectedRunsPerDiff=5]');
  }
  const expectedRunsPerDiff = process.argv[3] ? Number(process.argv[3]) : 5;

  const report = await checkJudgeRunIntegrity(experimentId, expectedRunsPerDiff);

  console.log(`\n═══ Judge run integrity — experiment ${report.experimentId} (${report.subjectKey}) ═══\n`);
  console.log(`  Expected cells: ${report.expectedCells} (diffs × criteria, ${expectedRunsPerDiff} runs each)\n`);

  if (report.ok) {
    console.log(`  ✅ All cells have exactly ${expectedRunsPerDiff} JudgeRun rows.\n`);
  } else {
    console.log(`  ❌ ${report.failures.length} cell(s) failed:\n`);
    for (const f of report.failures) {
      console.log(`    [${f.reason}] ${f.diffKey} / ${f.criterion} — expected ${f.expected}, got ${f.actual}`);
    }
    console.log('');
  }

  await prisma.$disconnect();
  process.exit(report.ok ? 0 : 1);
};

if (process.argv[1] === import.meta.filename) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
