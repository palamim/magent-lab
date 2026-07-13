import 'dotenv/config';

import type { ArchitectRunResult } from '@/lab/types/common.types';

export const generateConventions = async (dir: string): Promise<ArchitectRunResult> => {
  const res = await fetch(`${process.env.BRAIN_API_URL}/conventions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dir }),
  });
  if (!res.ok) throw new Error(`conventions failed: ${res.status} ${await res.text()}`);
  return res.json();
};

export const approveConventions = async (dir: string, conventions: string) => {
  const res = await fetch(`${process.env.BRAIN_API_URL}/approve-conventions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dir, conventions }),
  });
  if (!res.ok) throw new Error(`approve-conventions failed: ${res.status} ${await res.text()}`);
  return res.json();
};
