export type Verdict = 'A' | 'B' | 'tie';

export interface ComparativeEvaluation {
  winner: Verdict;
  reasoning: string;
}
