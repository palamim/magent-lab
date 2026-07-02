import type Anthropic from '@anthropic-ai/sdk';

import type { ComparativeEvaluation, CriterionJudgment, Verdict } from '@/judges/types/common.types';

const VERDICTS: Verdict[] = ['A', 'B', 'tie'];
const isVerdict = (v: unknown): v is Verdict => VERDICTS.includes(v as Verdict);

// ── declaration (faces the model) ──
export const submitComparativeEvaluationTool: Anthropic.Tool = {
  name: 'submit_comparative_evaluation',
  description:
    'Submit the comparative evaluation. First judge BOTH plans on EACH criterion individually (which plan that single criterion favors), then give your holistic winner. Call this exactly once.',
  input_schema: {
    type: 'object',
    properties: {
      criteria: {
        type: 'array',
        description:
          'One entry per criterion, in the order given. For each, compare both plans on THAT criterion only.',
        items: {
          type: 'object',
          properties: {
            criterion: {
              type: 'string',
              description: 'The name of the criterion being judged.',
            },
            reasoning: {
              type: 'string',
              description: 'Compare both plans on THIS criterion only, in 1-2 sentences.',
            },
            favors: {
              type: 'string',
              enum: ['A', 'B', 'tie'],
              description: 'Which plan this single criterion favors: A, B, or tie.',
            },
          },
          required: ['criterion', 'reasoning', 'favors'],
        },
      },
      holisticWinner: {
        type: 'string',
        enum: ['A', 'B', 'tie'],
        description:
          'Your overall winner, weighing the criteria above by importance (a single decisive flaw can outweigh several minor advantages). This follows from your per-criterion judgments but is your holistic call.',
      },
      summary: {
        type: 'string',
        description: 'One sentence naming the decisive factor behind your holistic winner.',
      },
    },
    required: ['criteria', 'holisticWinner', 'summary'],
  },
};

// ── execution (faces the machine) — fail loud, never fabricate ──
export const executeSubmitComparativeEvaluation = (raw: unknown): ComparativeEvaluation => {
  const input = raw as Partial<ComparativeEvaluation>;

  if (!Array.isArray(input.criteria) || input.criteria.length === 0) {
    throw new Error('Judge returned no per-criterion judgments.');
  }

  const criteria = input.criteria.map((c, i) => {
    const entry = c as Partial<CriterionJudgment>;
    if (!entry.criterion || !entry.reasoning) {
      throw new Error(`Criterion judgment ${i} is missing criterion or reasoning.`);
    }
    if (!isVerdict(entry.favors)) {
      throw new Error(`Criterion judgment ${i} has invalid favors: ${JSON.stringify(entry.favors)}`);
    }
    return { criterion: entry.criterion, reasoning: entry.reasoning, favors: entry.favors };
  });

  if (!isVerdict(input.holisticWinner)) {
    throw new Error(`Judge returned invalid holisticWinner: ${JSON.stringify(input.holisticWinner)}`);
  }
  if (!input.summary || typeof input.summary !== 'string') {
    throw new Error('Judge returned no summary.');
  }

  return { criteria, holisticWinner: input.holisticWinner, summary: input.summary };
};
