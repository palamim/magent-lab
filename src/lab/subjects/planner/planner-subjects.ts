import type { Subject } from '@/lab/subjects/subjects.types';
import { AgentType } from '@/lab/types/common.types';
import { ANTHROPIC_MODELS } from '@/lab/types/models.types';
import { baselinePrompt } from '@/lab/subjects/planner/prompts/001-baseline.prompt';
import { distinctDeliverablesPrompt } from '@/lab/subjects/planner/prompts/002-distinct-deliverables.prompt';

const basePlannerSubjects: Omit<Subject, 'agentType'>[] = [
  {
    key: 'baseline',
    model: ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5,
    prompt: baselinePrompt,
    description: 'Baseline',
  },
  {
    key: 'distinct-deliverables',
    model: ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5,
    prompt: distinctDeliverablesPrompt,
    description: 'Prompt is more precise on the tasks size and distinct deliverables',
  },
  {
    key: 'baseline-sonnet',
    model: ANTHROPIC_MODELS.CLAUDE_SONNET_4_6,
    prompt: baselinePrompt,
    description: 'Baseline Prompt with Sonnet Model',
  },
];

export const plannerSubjects: Subject[] = basePlannerSubjects.map((subject) => ({
  ...subject,
  agentType: AgentType.PLANNER,
}));
