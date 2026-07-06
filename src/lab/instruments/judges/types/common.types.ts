export type GateAnswer = 'yes' | 'no';

export interface GateJudgment {
  criterion: string;
  reasoning: string;
  answer: GateAnswer;
}

export interface GateEvaluation {
  criteria: GateJudgment[];
}

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
