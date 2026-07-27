import 'dotenv/config';

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { prisma } from '@/lab/records/db/client';
import { runConsistencyValidityAnalysis } from '@/lab/records/reports/judge-consistency-validity';
import { findDivergentCells } from '@/lab/records/reports/judge-reasoning-divergence';
import { conventionsJudgeSubjects } from '@/lab/subjects/judges/conventions-judge.subject';
import type { Answer, MeasurableRate, ClusterBootstrapResult } from '@/lab/instruments/metrics/judge-stats';

// Descriptive, non-numeric provenance notes — these document what the schema does NOT
// record, they are not measurements and are not derived from any analysis module.
const STUDY_LIMITATIONS: string[] = [
  'Model identifier is a floating alias, not a pinned dated snapshot (see subject.modelPinned) — the exact ' +
    'underlying model version at run time is not recoverable from stored data.',
  'Temperature/sampling parameters were never set or recorded by the judge call (see subject.temperatureNote) — ' +
    'consistency results reflect whatever the API default sampling behavior was at run time, which is itself unpinned.',
  'criteriaVersion/promptVersion are resolved from the current conventionsJudgeSubjects source array by subjectKey, ' +
    'not stored on JudgeRun itself — if that array is edited later, re-exporting this same experimentId would ' +
    'silently report different values with no record of the change.',
  'gitCommitSha reflects the repository state at export time, not necessarily the commit under which these ' +
    'JudgeRun rows were originally generated — there is no code-revision column on JudgeRun.',
  'Replicate order within divergentCells is inferred from createdAt, not an explicit replicate-index column; ' +
    'ties or retried runs could reorder silently.',
  "selfAgreementKappa chance-corrects against the judge's own marginal distribution, not an independent " +
    'reference — this is circular by construction and only meaningful as a relative signal across criteria.',
  'selfAgreementKappa is reported as null with an explanatory reason wherever a criterion\'s marginal is ' +
    'degenerate (all-yes or all-no) — treat values close to that boundary with the same skepticism.',
  'majorityVoteAccuracy/sensitivity/specificity assume the diffs are independent draws (Clopper-Pearson); ' +
    'clusterBootstrapAgreement is the cluster-aware alternative and should be preferred wherever within-diff ' +
    'correlation is a concern.',
  'A criterion with zero diffs in one ground-truth class (e.g. Code Idioms has no "no" labels in this dataset) ' +
    'reports that side as value:null rather than folding it into an average — check n before trusting any rate.',
  'No token/cost accounting exists for judge runs in this schema; this export cannot report what the study cost to run.',
  'Labeled diffs are not stored in the database and are not content-hashed in this export; editing ' +
    'fixtures/labeled-diffs/conventions/v2/*.ts without bumping a version would not be reflected here.',
];

export interface StudyExport {
  studyId: string;
  generatedAt: string;
  experimentId: string;
  gitCommitSha: string;
  subject: {
    subjectKey: string;
    model: string;
    modelPinned: boolean;
    criteriaVersion: number;
    promptVersion: number;
    temperature: null;
    temperatureNote: string;
  };
  dataset: {
    nDiffs: number;
    replicatesPerDiff: number;
    classBalance: { criterion: string; noCount: number; yesCount: number }[];
  };
  consistency: {
    splitHistogram: Record<string, number>;
    perCriterion: ({ criterion: string; selfAgreementKappa: number } | {
      criterion: string;
      selfAgreementKappa: null;
      reason: string;
    })[];
  };
  validity: {
    perCriterion: {
      criterion: string;
      majorityVoteAccuracy: MeasurableRate;
      sensitivity: MeasurableRate;
      specificity: MeasurableRate;
      clusterBootstrapAgreement: ClusterBootstrapResult;
    }[];
  };
  divergentCells: {
    diffKey: string;
    criterion: string;
    split: string;
    groundTruth: Answer;
    replicates: { actual: Answer; reasoning: string }[];
  }[];
  limitations: string[];
}

const getGitCommitSha = (): string => {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};

/** True if the model string carries a dated snapshot suffix (e.g. gpt-5.4-2026-03-05), false for floating aliases. */
const looksPinned = (model: string): boolean => /\d{4}-\d{2}-\d{2}/.test(model);

export const buildStudyExport = async (
  experimentId: string,
  options: { bootstrapSeed?: number; bootstrapIterations?: number; expectedRunsPerDiff?: number } = {},
): Promise<StudyExport> => {
  const analysis = await runConsistencyValidityAnalysis(experimentId, options);
  const { divergentCells } = await findDivergentCells(experimentId, options.expectedRunsPerDiff ?? 5);

  const modelRow = await prisma.judgeRun.findFirst({ where: { experimentId }, select: { model: true } });
  if (!modelRow) throw new Error(`No JudgeRun rows found for experiment "${experimentId}".`);

  const subjectConfig = conventionsJudgeSubjects.find((s) => s.key === analysis.subjectKey);
  if (!subjectConfig) {
    throw new Error(
      `No known JudgeSubject config for subjectKey "${analysis.subjectKey}" — cannot resolve criteriaVersion/promptVersion.`,
    );
  }

  const classBalance = analysis.perCriterion.map((c) => ({
    criterion: c.criterion,
    noCount: c.validity.sensitivity.n,
    yesCount: c.validity.specificity.n,
  }));

  const consistencyPerCriterion: StudyExport['consistency']['perCriterion'] = analysis.perCriterion.map((c) => {
    const kappa = c.selfAgreementKappa;
    if (kappa.value === null) {
      return { criterion: c.criterion, selfAgreementKappa: null, reason: kappa.reason };
    }
    return { criterion: c.criterion, selfAgreementKappa: kappa.value };
  });

  const validityPerCriterion = analysis.perCriterion.map((c) => ({
    criterion: c.criterion,
    majorityVoteAccuracy: c.validity.majorityVoteAccuracy,
    sensitivity: c.validity.sensitivity,
    specificity: c.validity.specificity,
    clusterBootstrapAgreement: c.clusterBootstrap,
  }));

  return {
    studyId: `conventions-judge-regression-${experimentId}`,
    generatedAt: new Date().toISOString(),
    experimentId,
    gitCommitSha: getGitCommitSha(),
    subject: {
      subjectKey: analysis.subjectKey,
      model: modelRow.model,
      modelPinned: looksPinned(modelRow.model),
      criteriaVersion: subjectConfig.criteriaVersion,
      promptVersion: subjectConfig.promptVersion,
      temperature: null,
      temperatureNote:
        'not recorded — runJudge() does not set a temperature parameter on the Anthropic call; the API default applies and is itself unpinned',
    },
    dataset: {
      nDiffs: analysis.nDiffs,
      replicatesPerDiff: analysis.replicatesPerDiff,
      classBalance,
    },
    consistency: {
      splitHistogram: analysis.splitHistogram,
      perCriterion: consistencyPerCriterion,
    },
    validity: {
      perCriterion: validityPerCriterion,
    },
    divergentCells: divergentCells.map((cell) => ({
      diffKey: cell.diffKey,
      criterion: cell.criterion,
      split: cell.split,
      groundTruth: cell.expected,
      replicates: cell.replicates.map((r) => ({ actual: r.actual, reasoning: r.reasoning })),
    })),
    limitations: [...STUDY_LIMITATIONS],
  };
};

// ═══ RUNNABLE SCRIPT ═══

const main = async () => {
  const experimentId = process.argv[2];
  if (!experimentId) {
    throw new Error(
      'Usage: tsx src/lab/records/reports/judge-study-export.ts <experimentId> [outputPath] [seed] [iterations]',
    );
  }
  const outputPath = process.argv[3] ?? path.join('src/lab/records/reports/output', `study-${experimentId}.json`);
  const bootstrapSeed = process.argv[4] ? Number(process.argv[4]) : 42;
  const bootstrapIterations = process.argv[5] ? Number(process.argv[5]) : 2000;

  const study = await buildStudyExport(experimentId, { bootstrapSeed, bootstrapIterations });

  writeFileSync(outputPath, JSON.stringify(study, null, 2) + '\n');
  console.log(`Wrote study export to ${outputPath}`);

  await prisma.$disconnect();
};

if (process.argv[1] === import.meta.filename) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
