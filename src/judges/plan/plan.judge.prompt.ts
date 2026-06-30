import { planCriteria } from '@/judges/plan/plan.criteria';

export const planJudgePrompt = (direction: string, conventions: string, planA: string, planB: string): string => {
  const criteria: string = Object.entries(planCriteria)
    .map(([key, value]) => `• ${key}: ${value}`)
    .join('\n');

  return `You are the Judge. You are analysing two plans (PLAN A / PLAN B) that were generated
by a Planner agent that has a DIRECTION and CONVENTIONS to respect.

Your job: analyse both plans, reason through which is the best plan based on the DIRECTION,
the CONVENTIONS and the CRITERIA list, and chose a winner: 'A', 'B' or 'tie' if you reason
both plans are equally good or bad. In your reasoning, go through the CRITERIA one by one
for both plans before choosing. Be specific about which criteria separated them. Go through
each criterion in 1-2 sentences per plan, then decide.

Below you'll find:
- DIRECTION: the frontier set by the Director — a strategic intent for a specific
project that spans roughly weeks and contains MULTIPLE possible features.
- CONVENTIONS: project-specific conventions the plans must follow.
- CRITERIA: the list of criteria to use while analysing both plans. Use those in
your reasoning.

When you are done, deliver your evaluation by calling the submit_comparative_evaluation tool.

--- DIRECTION (the frontier, set by the Director) ---
${direction}

--- CONVENTIONS (project-specific conventions) ---
${conventions}

--- CRITERIA (the criteria, to analyse both plans) ---
${criteria}

--- PLAN A ('A') ---
${planA}

--- PLAN B ('B') ---
${planB}`;
};
