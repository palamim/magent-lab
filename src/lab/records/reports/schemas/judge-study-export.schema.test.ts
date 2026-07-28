import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { validateAgainstSchema, type JsonSchema } from '@/lab/records/reports/schemas/validate-json-schema';
import type { StudyExport } from '@/lab/records/reports/judge-study-export';

// Type-only import above has zero runtime footprint (erased by esbuild/tsx) — this test
// never touches Postgres, so it stays runnable without a live DB, same as judge-stats.test.ts.

const schema: JsonSchema = JSON.parse(
  readFileSync(new URL('./judge-study-export.schema.json', import.meta.url), 'utf8'),
);

const clone = <T>(value: T): T => structuredClone(value);

// A hand-built, structurally faithful sample — deliberately includes both branches of every
// oneOf in the schema (measurable + not-measurable rate, measurable + degenerate kappa) so a
// pass here means the schema's discriminated shapes are actually exercised, not just the happy path.
const validStudy: StudyExport = {
  studyId: 'conventions-judge-regression-test-experiment',
  generatedAt: '2026-07-27T00:00:00.000Z',
  experimentId: 'test-experiment',
  gitCommitSha: 'abc1234',
  hypothesis: [
    'The judge agrees with human ground-truth labels at a rate better than chance, for each criterion independently (validity).',
    'The judge is self-consistent across repeated evaluations of the same diff (consistency).',
  ],
  methodology: '20 labeled diffs, 5 replicates each, conventions-judge-v2 subject.',
  subject: {
    subjectKey: 'conventions-judge-v2',
    model: 'claude-haiku-4-5',
    modelPinned: false,
    criteriaVersion: 2,
    promptVersion: 2,
    temperature: null,
    temperatureNote: 'not recorded — API default applies and is itself unpinned',
  },
  dataset: {
    nDiffs: 20,
    replicatesPerDiff: 5,
    classBalance: [
      { criterion: 'Structure and Placement Rules', noCount: 9, yesCount: 11 },
      { criterion: 'Code Idioms', noCount: 0, yesCount: 20 },
    ],
  },
  consistency: {
    splitHistogram: { '5-0': 68, '4-1': 8, '3-2': 4 },
    perCriterion: [
      { criterion: 'Structure and Placement Rules', selfAgreementKappa: 0.96 },
      {
        criterion: 'Code Idioms',
        selfAgreementKappa: null,
        reason: 'marginal is degenerate (100% yes / 0% no across all diffs) — chance agreement is ~100%, kappa not measurable',
      },
    ],
  },
  validity: {
    perCriterion: [
      {
        criterion: 'Structure and Placement Rules',
        majorityVoteAccuracy: { value: 1, n: 20, method: 'clopper-pearson', ci: { low: 0.832, high: 1 } },
        sensitivity: { value: 1, n: 9, method: 'clopper-pearson', ci: { low: 0.664, high: 1 } },
        specificity: { value: 1, n: 11, method: 'clopper-pearson', ci: { low: 0.715, high: 1 } },
        clusterBootstrapAgreement: {
          estimate: 0.99,
          nClusters: 20,
          ci: { low: 0.97, high: 1 },
          method: 'cluster-bootstrap',
          seed: 42,
          iterations: 2000,
        },
      },
      {
        criterion: 'Code Idioms',
        majorityVoteAccuracy: { value: 1, n: 20, method: 'clopper-pearson', ci: { low: 0.832, high: 1 } },
        sensitivity: {
          value: null,
          n: 0,
          method: 'clopper-pearson',
          reason: 'not measurable — no diffs labeled "no" for this criterion',
        },
        specificity: { value: 1, n: 20, method: 'clopper-pearson', ci: { low: 0.832, high: 1 } },
        clusterBootstrapAgreement: {
          estimate: 0.96,
          nClusters: 20,
          ci: { low: 0.9, high: 1 },
          method: 'cluster-bootstrap',
          seed: 42,
          iterations: 2000,
        },
      },
    ],
  },
  divergentCells: [
    {
      diffKey: '0002-wrong-file-naming',
      criterion: 'Structure and Placement Rules',
      split: '4-1',
      groundTruth: 'yes',
      replicates: [
        { actual: 'yes', reasoning: 'The file remains in the correct directory.' },
        { actual: 'yes', reasoning: 'Directory placement is unaffected by the rename.' },
        { actual: 'yes', reasoning: 'Placement rule is satisfied; naming is a separate criterion.' },
        { actual: 'no', reasoning: 'The renamed file no longer matches the expected structure.' },
        { actual: 'yes', reasoning: 'Correct directory, so structure rule is respected.' },
      ],
    },
  ],
  limitations: [
    'Model identifier is a floating alias, not a pinned dated snapshot.',
    'Temperature/sampling parameters were never set or recorded by the judge call.',
  ],
};

describe('judge-study-export.schema.json', () => {
  test('declares draft 2020-12 and the expected top-level shape', () => {
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(schema.type, 'object');
    assert.deepEqual(
      new Set(schema.required as string[]),
      new Set([
        'studyId',
        'generatedAt',
        'experimentId',
        'gitCommitSha',
        'hypothesis',
        'methodology',
        'subject',
        'dataset',
        'consistency',
        'validity',
        'divergentCells',
        'limitations',
      ]),
    );
  });

  test('a structurally faithful sample validates with zero errors', () => {
    const errors = validateAgainstSchema(schema, validStudy);
    assert.deepEqual(errors, []);
  });

  test('rejects a missing required top-level field', () => {
    const broken = clone(validStudy) as Partial<StudyExport>;
    delete broken.gitCommitSha;
    const errors = validateAgainstSchema(schema, broken);
    assert.ok(errors.some((e) => e.includes('gitCommitSha')));
  });

  test('rejects a wrong-typed field (criteriaVersion as string)', () => {
    const broken = clone(validStudy) as unknown as { subject: Record<string, unknown> };
    broken.subject.criteriaVersion = 'two';
    const errors = validateAgainstSchema(schema, broken);
    assert.ok(errors.some((e) => e.includes('criteriaVersion')));
  });

  test('rejects a measurableRate that matches neither oneOf branch (value present but no ci)', () => {
    const broken = clone(validStudy);
    // @ts-expect-error deliberately malformed for the test
    delete broken.validity.perCriterion[0]!.sensitivity.ci;
    const errors = validateAgainstSchema(schema, broken);
    assert.ok(errors.some((e) => e.includes('sensitivity')));
  });

  test('rejects a divergentCell split that fails the pattern', () => {
    const broken = clone(validStudy);
    broken.divergentCells[0]!.split = 'five-one';
    const errors = validateAgainstSchema(schema, broken);
    assert.ok(errors.some((e) => e.includes('split')));
  });

  test('rejects an unexpected additional property', () => {
    const broken = clone(validStudy) as StudyExport & { extraneous?: string };
    broken.extraneous = 'not part of the schema';
    const errors = validateAgainstSchema(schema, broken);
    assert.ok(errors.some((e) => e.includes('extraneous')));
  });
});
