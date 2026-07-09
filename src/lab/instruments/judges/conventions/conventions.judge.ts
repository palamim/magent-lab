import type Anthropic from '@anthropic-ai/sdk';

import { ANTHROPIC_MODELS } from '@/lab/types/models.types';
import type { GateEvaluation } from '@/lab/instruments/judges/types/common.types';
import { conventionsPrompt } from '@/lab/instruments/judges/conventions/conventions.prompt';
import { runJudge } from '@/lab/instruments/judges/run-judge';
import { conventionsCriteria } from './criteria';

export const runConventionsJudge = async (
  client: Anthropic,
  conventions: string,
  codeDiff: string,
  criteriaVersion: number,
): Promise<GateEvaluation> => {
  if (!conventionsCriteria[criteriaVersion]) {
    throw new Error(`Criteria version ${criteriaVersion} not defined in conventionsCriteria`);
  }
  const versionedCriteria = conventionsCriteria[criteriaVersion];
  const criteria = versionedCriteria.map((c, i) => `${i + 1}. [${c.name}]\n   ${c.description}`).join('\n\n');
  const prompt = conventionsPrompt(conventions, codeDiff, criteria);
  return await runJudge(client, prompt, ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5);
};
