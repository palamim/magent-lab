export type ExpectedAnswer = 'yes' | 'no';

export interface LabeledDiff {
  key: string; // '0001-wrong-folder'
  description: string; // what this diff tests
  diff: string; // the code diff
  conventions: string; // the conventions.md to judge against
  expected: Record<string, ExpectedAnswer>; // { 'Architectural Compliance': 'no', 'Naming Conventions': 'yes', ... }
}
