import type Anthropic from '@anthropic-ai/sdk';

import { ANTHROPIC_MODELS } from '@/lab/types/models.types';
import type { GateEvaluation } from '@/lab/instruments/judges/types/common.types';
import { runJudge } from '@/lab/instruments/judges/run-judge';
import { conventionsCriteria } from '@/lab/instruments/judges/conventions/criteria';
import { conventionsPrompt } from './prompt';

export const runConventionsJudge = async (
  client: Anthropic,
  conventions: string,
  codeDiff: string,
  criteriaVersion: number,
  promptVersion: number,
): Promise<GateEvaluation> => {
  if (!conventionsCriteria[criteriaVersion] || !conventionsPrompt[promptVersion]) {
    throw new Error(`[Criteria version — ${criteriaVersion}] or [Prompt version — ${promptVersion}] not defined.`);
  }

  const versionedCriteria = conventionsCriteria[criteriaVersion];
  const criteria = versionedCriteria.map((c, i) => `${i + 1}. [${c.name}]\n   ${c.description}`).join('\n\n');

  const versionedPrompt = conventionsPrompt[promptVersion];
  const prompt = versionedPrompt(conventions, codeDiff, criteria);
  return await runJudge(client, prompt, ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5);
};
