import 'dotenv/config';

import type { PlannerRunResult } from '@/lab/types/common.types';

export const generatePlan = async (dir: string, prompt: string, model: string): Promise<PlannerRunResult> => {
  const res = await fetch(`${process.env.BRAIN_API_URL}/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dir, prompt, model }),
  });
  if (!res.ok) throw new Error(`generate-plan failed: ${res.status} ${await res.text()}`);
  return res.json();
};
