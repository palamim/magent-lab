import type Anthropic from '@anthropic-ai/sdk';

import { ANTHROPIC_MODELS } from '@/lab/types/models.types';
import {
  executeSubmitGateEvaluation,
  submitGateEvaluationTool,
} from '@/lab/instruments/judges/tools/submit-gate-evaluation.tool';
import type { GateEvaluation } from '@/lab/instruments/judges/types/common.types';

const MAX_JUDGE_TOKENS = 4096;

type CheapModel = typeof ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5;

export const runJudge = async (
  client: Anthropic,
  prompt: string,
  model: CheapModel = ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5,
): Promise<GateEvaluation> => {
  const message = await client.messages.create({
    max_tokens: MAX_JUDGE_TOKENS,
    model,
    tools: [submitGateEvaluationTool],
    tool_choice: { type: 'tool', name: 'submit_gate_evaluation' },
    messages: [{ role: 'user', content: prompt }],
  });
  const block = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_gate_evaluation',
  );
  if (!block) throw new Error('Judge did not call submit_gate_evaluation.');
  return executeSubmitGateEvaluation(block.input);
};
