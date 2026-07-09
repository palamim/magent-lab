export interface JudgeSubject {
  key: string;
  promptVersion: string;
  model: string;
  criteriaVersion: number;
}

export const conventionsJudgeSubjects: JudgeSubject[] = [
  { key: 'conventions-judge-v1', promptVersion: 'conv-v1', model: 'claude-haiku-4-5', criteriaVersion: 1 },
];
