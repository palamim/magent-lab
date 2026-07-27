import 'dotenv/config';

import { prisma } from '@/lab/records/db/client';
import { checkJudgeRunIntegrity } from '@/lab/records/reports/judge-run-integrity';
import {
  splitHistogram,
  fleissKappaSelfAgreement,
  criterionValidity,
  clusterBootstrapAgreement,
  type Answer,
  type CellReplicates,
  type MeasurableRate,
} from '@/lab/instruments/metrics/judge-stats';

interface StoredAgreement {
  criterion: string;
  expected: Answer;
  actual: Answer;
  matched: boolean;
}

export interface ConsistencyValidityReport {
  experimentId: string;
  subjectKey: string;
  nDiffs: number;
  replicatesPerDiff: number;
  splitHistogram: Record<string, number>;
  perCriterion: Array<{
    criterion: string;
    selfAgreementKappa: ReturnType<typeof fleissKappaSelfAgreement>;
    validity: ReturnType<typeof criterionValidity>;
    clusterBootstrap: ReturnType<typeof clusterBootstrapAgreement>;
  }>;
  notes: string[];
}

const ANALYSIS_NOTES = [
  `selfAgreementKappa chance-corrects against the judge's OWN marginal distribution, not an ` +
    `independent reference — this is circular by construction and only meaningful as a relative ` +
    `signal across criteria, not an absolute validity measure.`,
  `selfAgreementKappa is mathematically uninformative (its denominator collapses toward 0) wherever ` +
    `a criterion's marginal approaches all-yes or all-no; treat "not measurable" the same as a value ` +
    `computed right at the edge of a degenerate marginal — both deserve equal skepticism.`,
  `sensitivity/specificity are only as reliable as their own n — always check n before trusting a ` +
    `Clopper-Pearson interval. n=0 is reported as "not measurable", but a small nonzero n (single ` +
    `digits) still deserves the same scrutiny even though a number is produced.`,
];

export const runConsistencyValidityAnalysis = async (
  experimentId: string,
  options: { bootstrapSeed?: number; bootstrapIterations?: number; expectedRunsPerDiff?: number } = {},
): Promise<ConsistencyValidityReport> => {
  const { bootstrapSeed = 42, bootstrapIterations = 2000, expectedRunsPerDiff = 5 } = options;

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
    select: { diffKey: true, agreements: true },
  });

  const grouped = new Map<string, CellReplicates>();
  for (const row of rows) {
    const agreements = row.agreements as unknown as StoredAgreement[];
    for (const a of agreements) {
      const key = `${row.diffKey}::${a.criterion}`;
      const existing = grouped.get(key);
      if (existing) {
        if (existing.expected !== a.expected) {
          throw new Error(
            `Inconsistent ground truth for ${row.diffKey}/${a.criterion}: saw both "${existing.expected}" and "${a.expected}".`,
          );
        }
        existing.actuals.push(a.actual);
      } else {
        grouped.set(key, { diffKey: row.diffKey, criterion: a.criterion, expected: a.expected, actuals: [a.actual] });
      }
    }
  }

  const cells = [...grouped.values()];
  const criteria = [...new Set(cells.map((c) => c.criterion))];
  const diffKeys = new Set(cells.map((c) => c.diffKey));

  const perCriterion = criteria.map((criterion) => {
    const criterionCells = cells.filter((c) => c.criterion === criterion);
    return {
      criterion,
      selfAgreementKappa: fleissKappaSelfAgreement(criterionCells),
      validity: criterionValidity(criterionCells),
      clusterBootstrap: clusterBootstrapAgreement(criterionCells, bootstrapSeed, bootstrapIterations),
    };
  });

  return {
    experimentId,
    subjectKey: integrity.subjectKey,
    nDiffs: diffKeys.size,
    replicatesPerDiff: integrity.replicatesPerDiff,
    splitHistogram: splitHistogram(cells),
    perCriterion,
    notes: ANALYSIS_NOTES,
  };
};

// ═══ RUNNABLE SCRIPT ═══

const fmtRate = (r: MeasurableRate): string =>
  r.value === null
    ? `not measurable (${r.reason})`
    : `${(r.value * 100).toFixed(1)}% [${(r.ci.low * 100).toFixed(1)}%, ${(r.ci.high * 100).toFixed(1)}%] (n=${r.n})`;

const main = async () => {
  const experimentId = process.argv[2];
  if (!experimentId) {
    throw new Error('Usage: tsx src/lab/records/reports/judge-consistency-validity.ts <experimentId> [seed] [iterations]');
  }
  const bootstrapSeed = process.argv[3] ? Number(process.argv[3]) : 42;
  const bootstrapIterations = process.argv[4] ? Number(process.argv[4]) : 2000;

  const report = await runConsistencyValidityAnalysis(experimentId, { bootstrapSeed, bootstrapIterations });

  console.log(`\n═══ Consistency & validity — experiment ${report.experimentId} (${report.subjectKey}) ═══\n`);
  console.log(`  Diffs: ${report.nDiffs}\n`);
  console.log('  Split histogram (primary consistency statistic):');
  for (const [split, count] of Object.entries(report.splitHistogram).sort()) {
    console.log(`    ${split}: ${count}`);
  }
  console.log('');

  for (const c of report.perCriterion) {
    console.log(`  ── ${c.criterion} ──`);
    const kappa = c.selfAgreementKappa.value === null ? `not measurable (${c.selfAgreementKappa.reason})` : c.selfAgreementKappa.value.toFixed(3);
    console.log(`    self-agreement kappa (secondary, circular vs own marginal): ${kappa}`);
    console.log(`    majority-vote accuracy:        ${fmtRate(c.validity.majorityVoteAccuracy)}`);
    console.log(`    sensitivity (catch violations): ${fmtRate(c.validity.sensitivity)}`);
    console.log(`    specificity (recognize compliant): ${fmtRate(c.validity.specificity)}`);
    console.log(
      `    cluster bootstrap agreement:    ${(c.clusterBootstrap.estimate * 100).toFixed(1)}% ` +
        `[${(c.clusterBootstrap.ci.low * 100).toFixed(1)}%, ${(c.clusterBootstrap.ci.high * 100).toFixed(1)}%] ` +
        `(seed=${c.clusterBootstrap.seed}, n_clusters=${c.clusterBootstrap.nClusters})`,
    );
    console.log('');
  }

  console.log('  Notes:');
  for (const note of report.notes) console.log(`    - ${note}`);
  console.log('');

  await prisma.$disconnect();
};

if (process.argv[1] === import.meta.filename) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
