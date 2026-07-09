import type Anthropic from '@anthropic-ai/sdk';

import { ANTHROPIC_MODELS } from '@/lab/types/models.types';
import type { GateEvaluation } from '@/lab/instruments/judges/types/common.types';
import { conventionsPrompt } from '@/lab/instruments/judges/conventions/conventions.prompt';
import { runJudge } from '@/lab/instruments/judges/run-judge';

export const runConventionsJudge = async (
  client: Anthropic,
  conventions: string,
  codeDiff: string,
): Promise<GateEvaluation> => {
  const prompt = conventionsPrompt(conventions, codeDiff);
  return await runJudge(client, prompt, ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5);
};
