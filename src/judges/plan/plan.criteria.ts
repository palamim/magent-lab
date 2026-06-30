export const planCriteria = {
  'Respects the direction':
    'The plan serves the DIRECTION. Its goal and tasks advance the frontier set by the Director, rather than drifting into trivia or unrelated work below it.',

  'Respects conventions':
    "The plan follows the project CONVENTIONS — structure, naming, file organization, and stated patterns. It works with the codebase's grain, not against it.",

  'Is appropriately scoped':
    'The plan solves the direction with the simplest approach that works. It does not introduce machinery, abstractions, files, or steps the direction did not call for. Over-engineering — adding complexity beyond what the goal requires — is a flaw.',

  'Has the right altitude':
    'The plan is one feature-sized slice of the direction, not an attempt to accomplish the entire weeks-scale frontier in a single plan.',

  'Has enough context':
    'Each task names targetFiles and contextFiles that, together with its description and instructions, give the executor enough to execute it correctly without guessing.',

  'Is executable':
    'Each task can be completed in a single executor run, touching roughly 1-3 files. No task is so large or vague that an executor would fail or stall on it.',

  'Is functional':
    'The plan does not leave broken or half-wired work — a half-rendered component, or a function called before it exists. Work that is complete but not yet used (because it is wired up in a later task) is fine; work that is actively broken is not.',

  'No git or package operations':
    'No task instructs the executor to install packages or run git operations. Dependencies and branch lifecycle are handled outside the executor.',
};
