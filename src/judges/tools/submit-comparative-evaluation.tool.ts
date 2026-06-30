import type Anthropic from '@anthropic-ai/sdk';
import type { ComparativeEvaluation } from '@/judges/types/common.types';

// ── declaration (faces the model) ──
export const submitComparativeEvaluationTool: Anthropic.Tool = {
  name: 'submit_comparative_evaluation',
  description:
    'Submit the comparative evaluation. Use `winner` to return the winner plan (or tie) and use `reasoning` to say why. Call this exactly once with your evaluation.',
  input_schema: {
    type: 'object',
    properties: {
      reasoning: {
        type: 'string',
        description:
          'Your full per-criterion comparison. Reason through all criteria for BOTH plans FIRST. Go through each criterion in 1-2 sentences per plan, then decide',
      },
      winner: {
        type: 'string',
        enum: ['A', 'B', 'tie'],
        description: 'The winner, following directly from your reasoning above.',
      },
    },
    required: ['reasoning', 'winner'], // reasoning BEFORE winner in the order
  },
};

// ── execution (faces the machine) ──
export const executeSubmitComparativeEvaluation = (raw: unknown): ComparativeEvaluation => {
  const input = raw as Partial<ComparativeEvaluation>;
  if (input.winner !== 'A' && input.winner !== 'B' && input.winner !== 'tie') {
    throw new Error(`Judge returned invalid winner: ${JSON.stringify(input.winner)}`);
  }
  if (!input.reasoning) {
    throw new Error('Judge returned no reasoning.');
  }
  return { winner: input.winner, reasoning: input.reasoning };
};
