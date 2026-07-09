export type AnthropicModel = (typeof ANTHROPIC_MODELS)[keyof typeof ANTHROPIC_MODELS];

export const ANTHROPIC_MODELS = {
  CLAUDE_HAIKU_4_5: 'claude-haiku-4-5',
  CLAUDE_SONNET_4_6: 'claude-sonnet-4-6',
} as const;

export const OPENAI_MODELS = {
  GPT_5_4_MINI: 'gpt-5.4-mini-2026-03-17',
  GPT_5_4: 'gpt-5.4-2026-03-05',
} as const;

export const ALL_MODELS = {
  ...ANTHROPIC_MODELS,
  ...OPENAI_MODELS,
} as const;

export type Model = (typeof ALL_MODELS)[keyof typeof ALL_MODELS];

export const CHEAPEST_MODELS = [ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5, OPENAI_MODELS.GPT_5_4_MINI] as const;

export type CheapestModels = (typeof CHEAPEST_MODELS)[number];
