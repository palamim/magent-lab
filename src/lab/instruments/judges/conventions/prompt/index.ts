import { conventionsPromptV1 } from '@/lab/instruments/judges/conventions/prompt/conventions.prompt.v1';
import { conventionsPromptV2 } from '@/lab/instruments/judges/conventions/prompt/conventions.prompt.v2';

export const conventionsPrompt: Record<number, (conventions: string, codeDiff: string, criteria: string) => string> = {
  1: conventionsPromptV1,
  2: conventionsPromptV2,
} as const;
