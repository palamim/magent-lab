/**
 * Pure, offline statistics for judge-regression analysis. No I/O, no model calls —
 * everything here operates on already-persisted (diffKey, criterion) replicate data.
 */

export type Answer = 'yes' | 'no';

export interface CellReplicates {
  diffKey: string;
  criterion: string;
  expected: Answer;
  actuals: Answer[]; // one per replicate run, order-independent
}

export interface Interval {
  low: number;
  high: number;
}

export type MeasurableRate =
  | { value: number; n: number; method: 'clopper-pearson'; ci: Interval }
  | { value: null; n: number; method: 'clopper-pearson'; reason: string };

export type KappaResult = { value: number } | { value: null; reason: string };

// ─────────────────────────────────────────────────────────────────────────
// Majority vote / split histogram
// ─────────────────────────────────────────────────────────────────────────

export const majorityVote = (actuals: Answer[]): Answer => {
  const yes = actuals.filter((a) => a === 'yes').length;
  const no = actuals.length - yes;
  if (yes === no) {
    throw new Error(`majorityVote: tie (${yes}/${no}) — an even replicate count has no majority`);
  }
  return yes > no ? 'yes' : 'no';
};

/** Bucket each cell by its "<majority count>-<minority count>" split, e.g. "5-0", "4-1", "3-2". */
export const splitHistogram = (cells: CellReplicates[]): Record<string, number> => {
  const histogram: Record<string, number> = {};
  for (const cell of cells) {
    const yes = cell.actuals.filter((a) => a === 'yes').length;
    const no = cell.actuals.length - yes;
    const key = `${Math.max(yes, no)}-${Math.min(yes, no)}`;
    histogram[key] = (histogram[key] ?? 0) + 1;
  }
  return histogram;
};

// ─────────────────────────────────────────────────────────────────────────
// Regularized incomplete beta function + Clopper-Pearson exact binomial CI
// (Numerical Recipes' betai/betacf algorithm — continued fraction + bisection,
// no external stats dependency.)
// ─────────────────────────────────────────────────────────────────────────

const MAX_ITER = 200;
const CF_EPS = 3e-9;
const FPMIN = 1e-300;

const LANCZOS_G = 7;
const LANCZOS_COEFFICIENTS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

const logGamma = (x: number): number => {
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  const xx = x - 1;
  let a = LANCZOS_COEFFICIENTS[0]!;
  const t = xx + LANCZOS_G + 0.5;
  for (let i = 1; i < LANCZOS_G + 2; i++) a += LANCZOS_COEFFICIENTS[i]! / (xx + i);
  return 0.5 * Math.log(2 * Math.PI) + (xx + 0.5) * Math.log(t) - t + Math.log(a);
};

const betaContinuedFraction = (a: number, b: number, x: number): number => {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX_ITER; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < CF_EPS) break;
  }
  return h;
};

/** Regularized incomplete beta function I_x(a, b). */
export const regularizedIncompleteBeta = (x: number, a: number, b: number): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const logBt = logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const bt = Math.exp(logBt);
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(a, b, x)) / a;
  }
  return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
};

/** Solves regularizedIncompleteBeta(x, a, b) = p for x, by bisection (I_x is monotonic increasing in x). */
const invRegularizedIncompleteBeta = (p: number, a: number, b: number): number => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (regularizedIncompleteBeta(mid, a, b) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

/** Exact (Clopper-Pearson) binomial confidence interval for `successes` out of `n` trials. */
export const clopperPearsonInterval = (successes: number, n: number, confidence = 0.95): Interval => {
  if (n <= 0) throw new Error('clopperPearsonInterval: n must be > 0');
  if (successes < 0 || successes > n) throw new Error('clopperPearsonInterval: successes must be within [0, n]');
  const alpha = 1 - confidence;
  const low = successes === 0 ? 0 : invRegularizedIncompleteBeta(alpha / 2, successes, n - successes + 1);
  const high = successes === n ? 1 : invRegularizedIncompleteBeta(1 - alpha / 2, successes + 1, n - successes);
  return { low, high };
};

// ─────────────────────────────────────────────────────────────────────────
// Fleiss' kappa, treating the 5 replicate calls as if they were 5 raters
// scoring the same item (diff × criterion). Chance-corrects against the
// judge's OWN observed marginal — see caller-level notes on why that's
// circular, and why it collapses near 0%/100% marginals.
// ─────────────────────────────────────────────────────────────────────────

export const fleissKappaSelfAgreement = (cells: CellReplicates[]): KappaResult => {
  if (cells.length === 0) throw new Error('fleissKappaSelfAgreement: no cells provided');
  const m = cells[0]!.actuals.length;
  if (cells.some((c) => c.actuals.length !== m)) {
    throw new Error('fleissKappaSelfAgreement: all cells must have the same replicate count');
  }
  if (m < 2) throw new Error('fleissKappaSelfAgreement: need at least 2 replicates per cell');

  const N = cells.length;
  let yesTotal = 0;
  let noTotal = 0;
  let sumPi = 0;

  for (const cell of cells) {
    const yes = cell.actuals.filter((a) => a === 'yes').length;
    const no = m - yes;
    yesTotal += yes;
    noTotal += no;
    sumPi += (yes * yes + no * no - m) / (m * (m - 1));
  }

  const pBar = sumPi / N;
  const total = N * m;
  const pYes = yesTotal / total;
  const pNo = noTotal / total;
  const pBarE = pYes * pYes + pNo * pNo;

  const denom = 1 - pBarE;
  if (Math.abs(denom) < 1e-9) {
    return {
      value: null,
      reason: `marginal is degenerate (${(pYes * 100).toFixed(0)}% yes / ${(pNo * 100).toFixed(0)}% no across all diffs) — chance agreement is ~100%, kappa not measurable`,
    };
  }
  return { value: (pBar - pBarE) / denom };
};

// ─────────────────────────────────────────────────────────────────────────
// Validity: majority-vote accuracy + sensitivity/specificity, each with its
// own Clopper-Pearson CI and its own n. Zero-support classes report
// "not measurable" instead of a number.
// ─────────────────────────────────────────────────────────────────────────

export interface CriterionValidity {
  criterion: string;
  n: number;
  majorityVoteAccuracy: MeasurableRate;
  sensitivity: MeasurableRate; // recall on expected = 'no' (violation) diffs
  specificity: MeasurableRate; // recall on expected = 'yes' (compliant) diffs
}

export const criterionValidity = (cells: CellReplicates[]): CriterionValidity => {
  const criterion = cells[0]?.criterion;
  if (!criterion) throw new Error('criterionValidity: no cells provided');
  if (cells.some((c) => c.criterion !== criterion)) {
    throw new Error('criterionValidity: all cells must share the same criterion');
  }

  const decisions = cells.map((c) => ({ expected: c.expected, majority: majorityVote(c.actuals) }));
  const violations = decisions.filter((d) => d.expected === 'no');
  const compliant = decisions.filter((d) => d.expected === 'yes');

  const rate = (matched: number, n: number, emptyLabel: string): MeasurableRate =>
    n === 0
      ? {
          value: null,
          n: 0,
          method: 'clopper-pearson',
          reason: `not measurable — no diffs labeled "${emptyLabel}" for this criterion`,
        }
      : { value: matched / n, n, method: 'clopper-pearson', ci: clopperPearsonInterval(matched, n) };

  return {
    criterion,
    n: cells.length,
    majorityVoteAccuracy: rate(
      decisions.filter((d) => d.majority === d.expected).length,
      decisions.length,
      'yes/no',
    ),
    sensitivity: rate(violations.filter((d) => d.majority === 'no').length, violations.length, 'no'),
    specificity: rate(compliant.filter((d) => d.majority === 'yes').length, compliant.length, 'yes'),
  };
};

// ─────────────────────────────────────────────────────────────────────────
// Cluster bootstrap over diffKey: resamples whole diffs (with all their
// replicates) rather than individual runs, so within-diff correlation is
// preserved instead of assumed away.
// ─────────────────────────────────────────────────────────────────────────

/** Tiny deterministic PRNG (mulberry32) — seeded, reproducible, no dependency. */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export interface ClusterBootstrapResult {
  estimate: number;
  ci: Interval;
  method: 'cluster-bootstrap';
  seed: number;
  iterations: number;
  nClusters: number;
}

const clusterMatchedRate = (cell: CellReplicates): number =>
  cell.actuals.filter((a) => a === cell.expected).length / cell.actuals.length;

export const clusterBootstrapAgreement = (
  cells: CellReplicates[],
  seed: number,
  iterations = 2000,
): ClusterBootstrapResult => {
  if (cells.length === 0) throw new Error('clusterBootstrapAgreement: no cells provided');

  const n = cells.length;
  const observed = cells.reduce((sum, c) => sum + clusterMatchedRate(c), 0) / n;

  const rng = mulberry32(seed);
  const draws: number[] = [];
  for (let b = 0; b < iterations; b++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(rng() * n);
      sum += clusterMatchedRate(cells[idx]!);
    }
    draws.push(sum / n);
  }
  draws.sort((a, b) => a - b);
  const lowIdx = Math.floor(0.025 * iterations);
  const highIdx = Math.min(iterations - 1, Math.ceil(0.975 * iterations) - 1);

  return {
    estimate: observed,
    ci: { low: draws[lowIdx]!, high: draws[highIdx]! },
    method: 'cluster-bootstrap',
    seed,
    iterations,
    nClusters: n,
  };
};
