import 'dotenv/config';

import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { prisma } from '@/lab/records/db/client';
import { runConsistencyValidityAnalysis } from '@/lab/records/reports/judge-consistency-validity';
import { findDivergentCells } from '@/lab/records/reports/judge-reasoning-divergence';
import type { Answer, MeasurableRate, ClusterBootstrapResult } from '@/lab/instruments/metrics/judge-stats';

// Authored by the study's builder, not derived from any analysis module — same status as
// STUDY_LIMITATIONS below.
const STUDY_HYPOTHESIS: string[] = [
  'The judge agrees with human ground-truth labels at a rate better than chance, for each criterion independently (validity).',
  'The judge is self-consistent across repeated evaluations of the same diff — repeated judgments of an unchanged input converge on the same answer (consistency).',
];

// Interpolates the subject/dataset facts (subject key, model, criteria & prompt version, diff/replicate
// counts, criteria names, bootstrap params) so this stays accurate whichever experimentId/subject is
// exported — the narrative prose is authored, but the facts inside it are never hardcoded.
const buildStudyMethodology = (
  subjectKey: string,
  model: string,
  criteriaVersion: number,
  promptVersion: number,
  nDiffs: number,
  replicatesPerDiff: number,
  criteria: string[],
  bootstrapSeed: number,
  bootstrapIterations: number,
): string => {
  const setup =
    `One base code diff was tweaked to produce ${nDiffs} variants, simulating a coding agent producing the same ` +
    `change with small variations. Each variant was then hand-labeled with the expected yes/no answer per ` +
    `criterion, producing ${nDiffs} labeled diffs (fixtures). Each labeled diff was judged by subject ` +
    `"${subjectKey}" (model: ${model}, criteria v${criteriaVersion}, prompt v${promptVersion}) ` +
    `against ${criteria.length} criteria (${criteria.join('; ')}), ${replicatesPerDiff} times each — ` +
    `${nDiffs * replicatesPerDiff} judge calls total (${nDiffs} diffs × ${replicatesPerDiff} replicates).`;

  const validity =
    `Validity is measured against the human labels via majority-vote accuracy, sensitivity, and specificity — ` +
    `each computed from a majority-vote verdict extracted per (diff, criterion) cell from its ${replicatesPerDiff} ` +
    `replicates, all reported with Clopper-Pearson exact confidence intervals. Validity is also measured via a ` +
    `cluster-bootstrap agreement estimate (seed=${bootstrapSeed}, ${bootstrapIterations} iterations) that treats ` +
    `the ${replicatesPerDiff} replicates of one diff as correlated, not independent.`;

  const consistency =
    `Consistency is measured via a split histogram of how unanimous the judge was across the ${replicatesPerDiff} ` +
    `replicates, for each of the ${nDiffs * criteria.length} cells (${nDiffs} diffs × ${criteria.length} criteria), ` +
    `alongside Fleiss' kappa to compress self-agreement into one chance-corrected number per criterion.`;

  return [setup, validity, consistency].join('\n\n');
};

// Descriptive, non-numeric provenance notes — these document what the schema does NOT
// record, they are not measurements and are not derived from any analysis module.
const STUDY_LIMITATIONS: string[] = [
  'All 20 labeled diffs are variants of a single base diff on a single project, hand-labeled by a single person ' +
    '(the study author) — there is no inter-rater reliability check, and the dataset does not sample across ' +
    'different projects, diff styles, or authors. Validity numbers reflect agreement with one person’s judgment ' +
    'on one code change, not a general notion of ground truth.',
  'majorityVoteAccuracy/sensitivity/specificity assume the diffs are independent draws (Clopper-Pearson); ' +
    'clusterBootstrapAgreement is the cluster-aware alternative and should be preferred wherever within-diff ' +
    'correlation is a concern.',
  'Model identifier is a floating alias, not a pinned dated snapshot (see subject.modelPinned) — the exact ' +
    'underlying model version at run time is not recoverable from stored data.',
  'Temperature/sampling parameters were never set or recorded by the judge call (see subject.temperatureNote) — ' +
    'consistency results reflect whatever the API default sampling behavior was at run time, which is itself unpinned.',
  'Replicate order within divergentCells reflects insertion order (createdAt), not an explicit replicate-index ' +
    'column. In practice this is reliable — the runner calls the judge sequentially, not in parallel — but no ' +
    'reported statistic (majority vote, kappa, cluster bootstrap) depends on replicate order regardless: all ' +
    "three treat the 5 replicates as an unordered set. The judge has no memory between calls, so there is nothing " +
    'for order to reveal even where it is guaranteed accurate — do not read a narrative into which position said what.',
  "selfAgreementKappa chance-corrects against the judge's own marginal distribution, not an independent " +
    'reference — this is circular by construction and only meaningful as a relative signal across criteria.',
  "selfAgreementKappa is reported as null with an explanatory reason only when the judge's OWN observed answer " +
    "marginal (not the ground-truth label marginal) is exactly degenerate (all-yes or all-no). A criterion whose " +
    'ground truth is one-sided can still get a real, low, and misleadingly-looking-bad kappa if the judge itself ' +
    "produced even one dissenting answer — e.g. Code Idioms' ground truth is 100% \"yes\", but the judge's actual " +
    'answers were 96%/4%, not exactly degenerate, so it reports a real kappa (0.22) instead of null. Treat any ' +
    'kappa near that boundary with the same skepticism as an explicit null.',
  'A criterion with zero diffs in one ground-truth class (e.g. Code Idioms has no "no" labels in this dataset) ' +
    'reports that side as value:null rather than folding it into an average — check n before trusting any rate.',
  'No token/cost accounting exists for judge runs in this schema; this export cannot report what the study cost to run.',
  'Labeled diffs are not stored in the database, but gitCommitSha (captured per run) makes their content ' +
    'reconstructable — `git show <gitCommitSha>:<path>` shows exactly what a fixture contained when a given ' +
    'JudgeRun was generated. The one gap this does not cover: an uncommitted local edit to a fixture at the ' +
    'moment an experiment ran would be invisible, since gitCommitSha only reflects the last commit, not ' +
    'working-tree state.',
];

// Authored by the study's builder after reviewing the results — same status as STUDY_HYPOTHESIS/STUDY_LIMITATIONS,
// not derived from any analysis module. Placeholder until filled in with the real conclusions.
const STUDY_CONCLUSIONS: string[] = [
  'Validity: the judge is descriptively more sensitive to File Rules violations (100%, n=5) than Naming ' +
    'Conventions violations (77%, n=13), and descriptively more specific about Naming Conventions compliance ' +
    '(100%, n=7) than File Rules compliance (93%, n=15) — but at these sample sizes the Clopper-Pearson ' +
    'intervals overlap substantially (e.g. File Rules sensitivity: [48%, 100%]), so neither comparison should ' +
    'be read as a confident difference.',
  'Validity: File Rules sensitivity is the most under-tested number in this study — a perfect point estimate ' +
    'resting on only 5 violation-labeled diffs, with a confidence interval wide enough to not rule out missing ' +
    'roughly half of real violations. More labeled File Rules violations are needed before trusting this number.',
  "Consistency: the judge is mostly stable across repeated calls — 68 of 80 (diff, criterion) cells (85%) were " +
    'perfectly unanimous across all 5 replicates.',
  "Consistency: Fleiss' kappa shows Code Idioms has not actually been stress-tested — it aligns with all 20 " +
    'fixtures being labeled "yes" for this criterion. This traces to how the dataset evolved: Code Idioms was ' +
    'added in criteria v2 (it does not exist in v1), and the v2 labeled diffs reused the same underlying code ' +
    'diffs as v1 — none were modified to introduce a genuine Code Idioms violation, so the criterion has zero ' +
    'negative examples.',
  "Consistency: hand-reading the non-unanimous cells' reasoning shows real criterion-boundary ambiguity — e.g. " +
    "diff 0020's `UseMagent()` hook-naming bug is labeled a Naming Conventions violation, but several judge " +
    'replicates instead flagged it under Code Idioms or File Rules, producing split verdicts there too. This is ' +
    "a likely source of Code Idioms' and File Rules' lower kappa specifically — it does not explain Naming " +
    "Conventions' own sensitivity shortfall, since all 3 of its non-unanimous cells were majority-correct; its " +
    'actual 3 misses were unanimous wrong verdicts, which have no reasoning captured in this export (only ' +
    'non-unanimous cells are exported with replicate reasoning).',
];

export interface StudyExport {
  studyId: string;
  generatedAt: string;
  experimentId: string;
  gitCommitSha: string;
  hypothesis: string[];
  methodology: string;
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
    perCriterion: (
      | { criterion: string; selfAgreementKappa: number }
      | {
          criterion: string;
          selfAgreementKappa: null;
          reason: string;
        }
    )[];
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
  conclusions: string[];
}

/** True if the model string carries a dated snapshot suffix (e.g. gpt-5.4-2026-03-05), false for floating aliases. */
const looksPinned = (model: string): boolean => /\d{4}-\d{2}-\d{2}/.test(model);

export const buildStudyExport = async (
  experimentId: string,
  options: { bootstrapSeed?: number; bootstrapIterations?: number; expectedRunsPerDiff?: number } = {},
): Promise<StudyExport> => {
  const bootstrapSeed = options.bootstrapSeed ?? 42;
  const bootstrapIterations = options.bootstrapIterations ?? 2000;
  const analysis = await runConsistencyValidityAnalysis(experimentId, options);
  const { divergentCells } = await findDivergentCells(experimentId, options.expectedRunsPerDiff ?? 5);

  // Provenance (model, criteria/prompt version, git commit) is read straight from the JudgeRun rows
  // themselves — captured at insert time by runJudgeRegression — not re-derived from current code
  // state, so it can't silently drift if the subjects array or checked-out commit changes later.
  const runRow = await prisma.judgeRun.findFirst({
    where: { experimentId },
    select: { model: true, criteriaVersion: true, promptVersion: true, gitCommitSha: true },
  });
  if (!runRow) throw new Error(`No JudgeRun rows found for experiment "${experimentId}".`);

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
    gitCommitSha: runRow.gitCommitSha,
    hypothesis: [...STUDY_HYPOTHESIS],
    methodology: buildStudyMethodology(
      analysis.subjectKey,
      runRow.model,
      runRow.criteriaVersion,
      runRow.promptVersion,
      analysis.nDiffs,
      analysis.replicatesPerDiff,
      analysis.perCriterion.map((c) => c.criterion),
      bootstrapSeed,
      bootstrapIterations,
    ),
    subject: {
      subjectKey: analysis.subjectKey,
      model: runRow.model,
      modelPinned: looksPinned(runRow.model),
      criteriaVersion: runRow.criteriaVersion,
      promptVersion: runRow.promptVersion,
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
    conclusions: [...STUDY_CONCLUSIONS],
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
