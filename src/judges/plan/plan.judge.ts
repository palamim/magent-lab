import type Anthropic from '@anthropic-ai/sdk';

import { comparePlansPrompt, judgePlanPrompt } from '@/judges/plan/plan.judge.prompt';
import { ANTHROPIC_MODELS } from '@/judges/models';
import {
  executeSubmitComparativeEvaluation,
  submitComparativeEvaluationTool,
} from '@/judges/tools/submit-comparative-evaluation.tool';
import { executeSubmitGateEvaluation, submitGateEvaluationTool } from '@/judges/tools/submit-gate-evaluation.tool';
import type { ComparativeEvaluation, GateEvaluation } from '@/judges/types/common.types';

const MAX_JUDGE_TOKENS = 4096;

export const judgePlan = async (
  client: Anthropic,
  direction: string,
  conventions: string,
  plan: string,
  contextFiles: string | undefined,
): Promise<GateEvaluation> => {
  const prompt = judgePlanPrompt(direction, conventions, plan, contextFiles);
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];

  const message = await client.messages.create({
    max_tokens: MAX_JUDGE_TOKENS,
    model: ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5,
    tools: [submitGateEvaluationTool],
    tool_choice: { type: 'tool', name: 'submit_gate_evaluation' },
    messages,
  });

  const submitBlock = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === 'submit_gate_evaluation',
  );

  if (!submitBlock) {
    throw new Error('Judge did not call submit_gate_evaluation.');
  }

  return executeSubmitGateEvaluation(submitBlock.input);
};

export const comparePlans = async (
  client: Anthropic,
  direction: string,
  conventions: string,
  planA: string,
  planB: string,
): Promise<ComparativeEvaluation> => {
  const prompt = comparePlansPrompt(direction, conventions, planA, planB);
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

  if (!submitBlock) {
    throw new Error('Judge did not call submit_comparative_evaluation.');
  }

  return executeSubmitComparativeEvaluation(submitBlock.input);
};
