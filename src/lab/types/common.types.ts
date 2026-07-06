export enum AgentType {
  DIRECTOR = 'director',
  EXECUTOR = 'executor',
  PLANNER = 'planner',
}

export enum TaskStatus {
  PENDING = 'pending',
  DONE = 'done',
}

export interface Task {
  id: number;
  slug: string;
  type: string;
  description: string;
  instructions: string;
  targetFiles: string[];
  contextFiles: string[];
  status: TaskStatus;
}

export interface Plan {
  frontier: string; // the slice of direction.md this plan serves (so we know when to replan)
  goal: string; // one-line: what this whole plan achieves
  type: string; // feat/fix/etc for the eventual commits
  slug: string; // kebab, for branch/commit naming
  dependencies: string[]; // npm packages installed before execution
  tasks: Task[];
}

export interface PlannerRunResult {
  plan: Plan;
  steps: number;
  toolCalls: number;
  readFileCalls: number;
  filesRead: string[];
  inputTokens: number;
  outputTokens: number;
}
