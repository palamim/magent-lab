export interface JudgeSubject {
  key: string;
  model: string;
  promptVersion: number;
  criteriaVersion: number;
}

export const conventionsJudgeSubjects: JudgeSubject[] = [
  { key: 'conventions-judge-v1', promptVersion: 1, model: 'claude-haiku-4-5', criteriaVersion: 1 },
  { key: 'conventions-judge-v2', promptVersion: 2, model: 'claude-haiku-4-5', criteriaVersion: 2 },
];
