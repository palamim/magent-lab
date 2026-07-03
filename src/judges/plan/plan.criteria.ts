export const gateCriteria = {
  Altitude:
    'The plan is one feature-sized slice of the direction, not an attempt to accomplish the entire frontier in a single plan.',

  Conventions:
    'The plan follows the architectural conventions — folder structure, file placement, naming, and stated patterns. It does not prematurely abstract (e.g. promoting a component used in only one place).',

  Direction: 'The plan serves the direction and its frontier, rather than drifting into trivia or work below it.',

  Executable:
    'Each task can be completed in a single run: it touches roughly 1-3 files AND asks for a bounded number of concrete changes, not a single task bundling many distinct sub-goals that would overload one run.',

  Functional:
    'The plan does not leave broken or half-wired work — a half-rendered component, or a function called before it exists. Work that is complete but wired up in a later task is fine; actively broken work is not.',

  Grounded:
    'Given the provided codebase context (the real files the executor will see), every field, type, and API the plan references actually exists, and each task has enough context — the right targetFiles and contextFiles — to be executed correctly without guessing. A plan that references nonexistent fields, or that lacks the files an executor would need, is not grounded.',
};

export const comparativeCriteria = {
  Intent:
    "Both plans technically address the direction. Which plan's APPROACH genuinely achieves what the direction is FOR? A plan can address the direction superficially — adding machinery, files, or abstractions that look relevant but do not advance the real goal — or substantively, with an approach that actually delivers the intent. Favor the plan whose approach is substantively better, not merely more elaborate.",
};
