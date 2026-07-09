import { conventionsCriteria } from '@/lab/instruments/judges/conventions/conventions.criteria';

const buildCriteria = () =>
  conventionsCriteria.map((c, i) => `${i + 1}. [${c.name}]\n   ${c.description}`).join('\n\n');

export const conventionsPrompt = (conventions: string, codeDiff: string): string => {
  const criteria = buildCriteria();

  return `You are the Judge. You judge a generated code under CONVENTIONS.
You have a list of CRITERIA, each framed as a yes/no question.

Your job: Judge the code on EACH criterion individually. For each criterion in the CRITERIA list,
reason if the code respects it, being objective, concise and specific, then finally, answer the yes/no
question for the specific criterion you're analyzing.

Deliver everything by calling submit_gate_evaluation exactly once: the per-criterion judgments,
the yes/no for each. When you submit each judgment, the criterion field must be EXACTLY the
bracketed name (e.g. 'Architectural Compliance'), not the description.

--- CONVENTIONS (project-specific conventions) ---
${conventions}

--- CRITERIA (judge each one individually) ---
${criteria}

--- CODE DIFF (the real code diff produced) ---
${codeDiff}`;
};
