import type { AnthropicModel } from '@/lab/types/models.types';
import type { AgentType } from '@/lab/types/common.types';

/**
 * SUBJECTS: The component that's being tested.
 */
export interface Subject {
  key: string;
  agentType: AgentType;
  model: AnthropicModel;
  prompt: string;
  description?: string;
}
