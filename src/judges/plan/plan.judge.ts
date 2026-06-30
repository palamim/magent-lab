import type Anthropic from '@anthropic-ai/sdk';

import { planJudgePrompt } from '@/judges/plan/plan.judge.prompt';
import { ANTHROPIC_MODELS } from '@/judges/models';
import {
  executeSubmitComparativeEvaluation,
  submitComparativeEvaluationTool,
} from '@/judges/tools/submit-comparative-evaluation.tool';
import type { ComparativeEvaluation } from '@/judges/types/common.types';

const MAX_JUDGE_TOKENS = 4096;

export const judgePlans = async (
  client: Anthropic,
  direction: string,
  conventions: string,
  planA: string,
  planB: string,
): Promise<ComparativeEvaluation> => {
  let comparativeEvaluation: ComparativeEvaluation | null = null;

  const prompt = planJudgePrompt(direction, conventions, planA, planB);

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];
  const message = await client.messages.create({
    max_tokens: MAX_JUDGE_TOKENS,
    model: ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5,
    tools: [submitComparativeEvaluationTool],
    tool_choice: { type: 'tool', name: 'submit_comparative_evaluation' },
    messages,
  });

  const submitBlock = message.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === 'submit_comparative_evaluation',
  );
  if (submitBlock) {
    comparativeEvaluation = executeSubmitComparativeEvaluation(submitBlock.input);
  }

  if (!comparativeEvaluation) {
    throw new Error('Judge answered without using submit_comparative_evaluation.');
  }

  return comparativeEvaluation;
};
