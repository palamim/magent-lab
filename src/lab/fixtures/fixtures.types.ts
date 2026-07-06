import type { AgentType } from '@/lab/types/common.types';

/**
 * FIXTURES: Controlled (frozen) inputs.
 */
export interface Fixture<Input = unknown> {
  key: string; // Ex: "0001-magent"
  agentType: AgentType;
  description?: string; // Optional context of why this context exists
  dir: string; // Local path of the project root folder — Ex: "/Users/user/Documents/projects/project-name"
  input: Input; // Object of the frozen context data — Ex: "{ direction: string; conventions: string }"
}

export type AgentInputMap = {
  [AgentType.PLANNER]: PlannerInput;
};

export interface PlannerInput {
  direction: string;
  conventions: string;
  fileList: string;
}
