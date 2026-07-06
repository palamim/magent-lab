import { ANTHROPIC_MODELS } from '@/lab/types/models.types';

const RATES: Record<string, { input: number; output: number }> = {
  [ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5]: { input: 1.0, output: 5.0 }, // ← confirm current Haiku pricing
  [ANTHROPIC_MODELS.CLAUDE_SONNET_4_6]: { input: 3.0, output: 15.0 }, // ← confirm current Sonnet pricing
};

export const computeCost = (model: string, inputTokens: number, outputTokens: number): number => {
  const rate = RATES[model];
  if (!rate) throw new Error(`No cost rate for model: ${model}`);
  return (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
};
