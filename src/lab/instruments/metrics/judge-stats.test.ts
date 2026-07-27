import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  majorityVote,
  splitHistogram,
  clopperPearsonInterval,
  fleissKappaSelfAgreement,
  criterionValidity,
  clusterBootstrapAgreement,
  mulberry32,
  type CellReplicates,
  type Answer,
} from '@/lab/instruments/metrics/judge-stats';

const cell = (diffKey: string, expected: 'yes' | 'no', actuals: ('yes' | 'no')[]): CellReplicates => ({
  diffKey,
  criterion: 'Test Criterion',
  expected,
  actuals,
});

describe('majorityVote', () => {
  test('picks the majority answer', () => {
    assert.equal(majorityVote(['yes', 'yes', 'yes', 'no', 'no']), 'yes');
    assert.equal(majorityVote(['no', 'no', 'no', 'yes', 'yes']), 'no');
  });

  test('throws on an even-length tie', () => {
    assert.throws(() => majorityVote(['yes', 'yes', 'no', 'no']));
  });
});

describe('splitHistogram', () => {
  test('buckets by majority-minority split', () => {
    const cells = [
      cell('d1', 'yes', ['yes', 'yes', 'yes', 'yes', 'yes']), // 5-0
      cell('d2', 'yes', ['yes', 'yes', 'yes', 'yes', 'no']), // 4-1
      cell('d3', 'no', ['no', 'no', 'no', 'yes', 'yes']), // 3-2
      cell('d4', 'no', ['no', 'no', 'no', 'no', 'no']), // 5-0
    ];
    assert.deepEqual(splitHistogram(cells), { '5-0': 2, '4-1': 1, '3-2': 1 });
  });
});

describe('clopperPearsonInterval', () => {
  // Hand-derivable closed forms: when successes = n, I_x(n, 1) = x^n, so the
  // lower bound solves x^n = alpha/2 exactly, i.e. x = (alpha/2)^(1/n).
  // For n=20, alpha=0.05: (0.025)^(1/20) ≈ 0.83156.
  test('all successes (n=20, k=20) matches the closed-form power-law bound', () => {
    const { low, high } = clopperPearsonInterval(20, 20);
    const expectedLow = Math.pow(0.025, 1 / 20);
    assert.ok(Math.abs(low - expectedLow) < 1e-6, `low=${low} expected≈${expectedLow}`);
    assert.equal(high, 1);
  });

  // Symmetric case: zero successes. Upper bound solves (1-x)^n = alpha/2,
  // i.e. x = 1 - (alpha/2)^(1/n).
  test('all failures (n=20, k=0) matches the closed-form power-law bound', () => {
    const { low, high } = clopperPearsonInterval(0, 20);
    const expectedHigh = 1 - Math.pow(0.025, 1 / 20);
    assert.equal(low, 0);
    assert.ok(Math.abs(high - expectedHigh) < 1e-6, `high=${high} expected≈${expectedHigh}`);
  });

  test('interval widens as n shrinks for the same observed rate', () => {
    const wide = clopperPearsonInterval(3, 4);
    const narrow = clopperPearsonInterval(15, 20);
    assert.ok(wide.high - wide.low > narrow.high - narrow.low);
  });

  // Reference values, 95% two-sided exact (Clopper-Pearson) interval, n=20, to 1e-6.
  test('matches published reference intervals at n=20', () => {
    const references: [k: number, low: number, high: number][] = [
      [1, 0.001265, 0.248733],
      [5, 0.086571, 0.491046],
      [7, 0.153909, 0.592189],
      [10, 0.271958, 0.728042],
      [13, 0.407811, 0.846091],
      [15, 0.508954, 0.913429],
    ];
    for (const [k, refLow, refHigh] of references) {
      const { low, high } = clopperPearsonInterval(k, 20);
      assert.ok(Math.abs(low - refLow) < 1e-6, `k=${k}: low=${low}, expected ${refLow}`);
      assert.ok(Math.abs(high - refHigh) < 1e-6, `k=${k}: high=${high}, expected ${refHigh}`);
    }
  });
});

describe('fleissKappaSelfAgreement', () => {
  test('perfect agreement (every item unanimous) is exactly 1, regardless of marginal skew', () => {
    const cells = [
      cell('d1', 'yes', ['yes', 'yes', 'yes', 'yes', 'yes']),
      cell('d2', 'no', ['no', 'no', 'no', 'no', 'no']),
      cell('d3', 'yes', ['yes', 'yes', 'yes', 'yes', 'yes']),
    ];
    const result = fleissKappaSelfAgreement(cells);
    assert.ok(result.value !== null);
    assert.ok(Math.abs(result.value - 1) < 1e-9);
  });

  // Hand-derived chance-level construction (see analysis write-up): 4 items with
  // splits (2,3) (3,2) (1,4) (4,1) give overall marginal 50/50 and
  // P_bar = P_bar_e = 0.5 exactly, so kappa = 0.
  test('constructed chance-level case gives kappa ≈ 0', () => {
    const cells = [
      cell('d1', 'yes', ['yes', 'yes', 'no', 'no', 'no']), // 2 yes, 3 no
      cell('d2', 'yes', ['yes', 'yes', 'yes', 'no', 'no']), // 3 yes, 2 no
      cell('d3', 'yes', ['yes', 'no', 'no', 'no', 'no']), // 1 yes, 4 no
      cell('d4', 'yes', ['yes', 'yes', 'yes', 'yes', 'no']), // 4 yes, 1 no
    ];
    const result = fleissKappaSelfAgreement(cells);
    assert.ok(result.value !== null);
    assert.ok(Math.abs(result.value - 0) < 1e-9, `expected ≈0, got ${result.value}`);
  });

  test('degenerate all-one-class marginal is "not measurable", not NaN/Infinity', () => {
    const cells = Array.from({ length: 20 }, (_, i) =>
      cell(`d${i}`, 'yes', ['yes', 'yes', 'yes', 'yes', 'yes']),
    );
    const result = fleissKappaSelfAgreement(cells);
    assert.equal(result.value, null);
    assert.ok('reason' in result && result.reason.includes('not measurable'));
  });
});

describe('criterionValidity', () => {
  test('computes accuracy/sensitivity/specificity with correct n each', () => {
    const cells = [
      // 2 violation diffs, judge catches both -> sensitivity 2/2
      cell('d1', 'no', ['no', 'no', 'no', 'no', 'no']),
      cell('d2', 'no', ['no', 'no', 'no', 'yes', 'no']),
      // 3 compliant diffs, judge wrongly flags one -> specificity 2/3
      cell('d3', 'yes', ['yes', 'yes', 'yes', 'yes', 'yes']),
      cell('d4', 'yes', ['yes', 'yes', 'yes', 'no', 'yes']),
      cell('d5', 'yes', ['no', 'no', 'no', 'yes', 'no']),
    ];
    const result = criterionValidity(cells);
    assert.equal(result.n, 5);
    assert.ok(result.sensitivity.value !== null && Math.abs(result.sensitivity.value - 1) < 1e-9);
    assert.equal(result.sensitivity.n, 2);
    assert.ok(result.specificity.value !== null && Math.abs(result.specificity.value - 2 / 3) < 1e-9);
    assert.equal(result.specificity.n, 3);
    assert.ok(
      result.majorityVoteAccuracy.value !== null && Math.abs(result.majorityVoteAccuracy.value - 4 / 5) < 1e-9,
    );
  });

  test('reports "not measurable" when a class has zero support', () => {
    const cells = [
      cell('d1', 'yes', ['yes', 'yes', 'yes', 'yes', 'yes']),
      cell('d2', 'yes', ['yes', 'yes', 'yes', 'yes', 'no']),
    ];
    const result = criterionValidity(cells);
    assert.equal(result.sensitivity.value, null);
    assert.equal(result.sensitivity.n, 0);
    assert.ok('reason' in result.sensitivity && result.sensitivity.reason.includes('not measurable'));
  });
});

describe('clusterBootstrapAgreement', () => {
  test('is deterministic for a given seed', () => {
    const cells = [
      cell('d1', 'yes', ['yes', 'yes', 'yes', 'no', 'no']),
      cell('d2', 'no', ['no', 'no', 'yes', 'yes', 'no']),
      cell('d3', 'yes', ['yes', 'yes', 'yes', 'yes', 'no']),
    ];
    const a = clusterBootstrapAgreement(cells, 42, 500);
    const b = clusterBootstrapAgreement(cells, 42, 500);
    assert.deepEqual(a, b);
  });

  test('degenerate case: identical per-diff rates collapse the bootstrap CI to the point estimate', () => {
    // Every diff has exactly 4/5 matched -> every resample average is exactly 0.8,
    // so low === high === estimate, hand-verifiable exactly.
    const cells = Array.from({ length: 10 }, (_, i) =>
      cell(`d${i}`, 'yes', ['yes', 'yes', 'yes', 'yes', 'no']),
    );
    const result = clusterBootstrapAgreement(cells, 7, 200);
    assert.ok(Math.abs(result.estimate - 0.8) < 1e-9);
    assert.ok(Math.abs(result.ci.low - 0.8) < 1e-9);
    assert.ok(Math.abs(result.ci.high - 0.8) < 1e-9);
  });

  test('different seeds may explore different resamples but stay within [0, 1]', () => {
    const cells = [
      cell('d1', 'yes', ['yes', 'no', 'yes', 'no', 'yes']),
      cell('d2', 'no', ['no', 'no', 'yes', 'yes', 'no']),
      cell('d3', 'yes', ['yes', 'yes', 'no', 'yes', 'no']),
      cell('d4', 'no', ['no', 'yes', 'no', 'no', 'no']),
    ];
    const result = clusterBootstrapAgreement(cells, 123, 1000);
    assert.ok(result.ci.low >= 0 && result.ci.high <= 1 && result.ci.low <= result.ci.high);
  });

  // A naive bootstrap that ignores cluster structure entirely: it pools every
  // individual replicate observation across all diffs and resamples from that
  // flat pool, exactly what agreementByCriterion's raw-pooled-count approach
  // implicitly assumes is valid. This is deliberately NOT exported from
  // judge-stats.ts — it exists here only as the "wrong" baseline to contrast
  // against, not as a real analysis option.
  const naiveRunLevelBootstrap = (cells: CellReplicates[], seed: number, iterations: number) => {
    const observations = cells.flatMap((c) => c.actuals.map((a) => (a === c.expected ? 1 : 0)));
    const n = observations.length;
    const rng = mulberry32(seed);
    const draws: number[] = [];
    for (let b = 0; b < iterations; b++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += observations[Math.floor(rng() * n)]!;
      draws.push(sum / n);
    }
    draws.sort((a, b) => a - b);
    const lowIdx = Math.floor(0.025 * iterations);
    const highIdx = Math.min(iterations - 1, Math.ceil(0.975 * iterations) - 1);
    return { low: draws[lowIdx]!, high: draws[highIdx]! };
  };

  test('cluster bootstrap is strictly wider than a naive run-level bootstrap under strong within-diff correlation', () => {
    // 12 diffs where all 5 replicates agree with ground truth, 8 where all 5 disagree —
    // zero within-diff variance, all of it is between diffs. The pooled matched rate is
    // 60% either way you slice it (60/100 individual runs, and 12/20 diff-level means),
    // but the two bootstraps disagree sharply on how much to trust that 60%: the naive
    // one sees "100 independent draws at p=0.6" and reports a tight interval; the cluster
    // bootstrap correctly sees "20 independent draws at p=0.6" and reports a much wider one.
    const AGREE: Answer[] = ['yes', 'yes', 'yes', 'yes', 'yes'];
    const DISAGREE: Answer[] = ['no', 'no', 'no', 'no', 'no'];
    const cells = [
      ...Array.from({ length: 12 }, (_, i) => cell(`agree-${i}`, 'yes', AGREE)),
      ...Array.from({ length: 8 }, (_, i) => cell(`disagree-${i}`, 'yes', DISAGREE)),
    ];

    const clustered = clusterBootstrapAgreement(cells, 42, 5000);
    const naive = naiveRunLevelBootstrap(cells, 42, 5000);

    const clusteredWidth = clustered.ci.high - clustered.ci.low;
    const naiveWidth = naive.high - naive.low;

    assert.ok(
      clusteredWidth > naiveWidth,
      `expected cluster-bootstrap width (${clusteredWidth}) > naive run-level width (${naiveWidth})`,
    );
  });
});
