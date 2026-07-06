import type Anthropic from '@anthropic-ai/sdk';

import type { GateAnswer, GateEvaluation, GateJudgment } from '@/lab/instruments/judges/types/common.types';

const GATE_VERDICTS: GateAnswer[] = ['yes', 'no'];
const isGate = (g: unknown): g is GateAnswer => GATE_VERDICTS.includes(g as GateAnswer);

// ── declaration (faces the model) ──
export const submitGateEvaluationTool: Anthropic.Tool = {
  name: 'submit_gate_evaluation',
  description:
    'Submit the gate evaluation. Judge the plan on EACH criterion individually, then give your reasoning and your yes/no answer. Call this exactly once.',
  input_schema: {
    type: 'object',
    properties: {
      criteria: {
        type: 'array',
        description: 'One entry per criterion, in the order given. For each, judge the plan on THAT criterion only.',
        items: {
          type: 'object',
          properties: {
            criterion: {
              type: 'string',
              description: 'The name of the criterion being judged.',
            },
            reasoning: {
              type: 'string',
              description: 'Judge the plan on THIS criterion only, in 1-2 sentences.',
            },
            answer: {
              type: 'string',
              enum: ['yes', 'no'],
              description: 'If the plan respects this single criterion.',
            },
          },
          required: ['criterion', 'reasoning', 'answer'],
        },
      },
    },
    required: ['criteria'],
  },
};

// ── execution (faces the machine) — fail loud, never fabricate ──
export const executeSubmitGateEvaluation = (raw: unknown): GateEvaluation => {
  const input = raw as Partial<GateEvaluation>;

  if (!Array.isArray(input.criteria) || input.criteria.length === 0) {
    throw new Error('Judge returned no per-criterion judgments.');
  }

  const criteria = input.criteria.map((c, i) => {
    const entry = c as Partial<GateJudgment>;
    if (!entry.criterion || !entry.reasoning) {
      throw new Error(`Criterion judgment ${i} is missing criterion or reasoning.`);
    }
    if (!isGate(entry.answer)) {
      throw new Error(`Criterion judgment ${i} has invalid answer: ${JSON.stringify(entry.answer)}`);
    }
    return { criterion: entry.criterion, reasoning: entry.reasoning, answer: entry.answer };
  });

  return { criteria };
};
