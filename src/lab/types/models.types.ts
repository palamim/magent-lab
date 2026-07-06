export type AnthropicModel = (typeof ANTHROPIC_MODELS)[keyof typeof ANTHROPIC_MODELS];

export const ANTHROPIC_MODELS = {
  CLAUDE_HAIKU_4_5: 'claude-haiku-4-5',
  CLAUDE_SONNET_4_6: 'claude-sonnet-4-6',
} as const;
