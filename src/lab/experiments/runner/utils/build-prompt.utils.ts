export const buildPrompt = (promptTemplate: string, input: Record<string, string>): string => {
  return promptTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) => input[key] ?? match);
};
