export type Verdict = 'A' | 'B' | 'tie';

export interface CriterionJudgment {
  criterion: string;
  reasoning: string;
  favors: Verdict;
}

export interface ComparativeEvaluation {
  criteria: CriterionJudgment[];
  holisticWinner: Verdict;
  summary: string;
}
