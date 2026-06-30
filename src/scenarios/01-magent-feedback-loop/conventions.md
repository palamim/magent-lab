# conventions.md

## Language and runtime

- TypeScript, ESM modules (`"type": "module"` in package.json). All files use `.ts`.
- Node.js. No browser code in this repo — this is the local server brain.
- Run with `tsx` (no compile step in dev). Production-equivalent: `tsx watch src/server/server.ts`.

## Project structure

```
src/
  agents/         # The three agents: director, planner, executor. Each has its own subdirectory.
    tools/        # Shared tool definitions (read-file, submit-*, dispatch)
    types/        # Shared types across agents (common.types.ts)
    models.ts     # Model name constants
  lib/            # Pure utilities: git, files, paths, verification, text-diff, inspect
  project/        # Project-state I/O: read/write direction, conventions, plan, task, feedback, config
  server/         # Express server
    controllers/  # One file per endpoint, thin — delegates to services
    routes/       # Express routers, one per domain
  services/       # Business logic: run-execution, keep/discard/refine, finish/abandon plan
    run-verified-execution/  # Broken into focused modules (build-prompt, apply, commit, etc.)
```

## Imports

- Use the `@/` path alias (maps to `src/`). Never use relative `../../` imports.
- Import types with `import type` where the import is type-only.

## Naming

- Files: `kebab-case.ts`
- Types/interfaces: `PascalCase`
- Functions and variables: `camelCase`
- Enums: `PascalCase` members in `PascalCase`
- Constants (module-level, truly constant): `SCREAMING_SNAKE_CASE`

## Functions

- Prefer named exports over default exports.
- Keep functions small and focused. Extract helpers rather than letting a function grow.
- Pure utility functions go in `src/lib/`. Stateful project I/O goes in `src/project/`. Agent logic stays in `src/agents/`.

## Error handling

- Throw `Error` with a clear human-readable message. Don't swallow errors silently.
- In git operations (`src/lib/git.ts`), use `try/catch` only when a failure is expected and recoverable (e.g. branch-existence checks). Let unexpected errors propagate.
- In agent loops, hitting `MAX_STEPS` is always an `Error` — never a silent return.

## Agent patterns

- Each agent is a loop: send messages, receive tool calls, dispatch, repeat until the agent calls its submit tool.
- `MAX_STEPS` and `MAX_TOKENS` are module-level constants in each agent file.
- Tool dispatch lives in `src/agents/tools/dispatch.ts` — add new tools there, not inline.
- Prompts live in dedicated `*.prompt.ts` files, not inline in agent files.
- Types for agent inputs/outputs live in `*.types.ts` files adjacent to the agent.

## Models

- Model names are constants in `src/agents/models.ts`. Never hard-code model strings elsewhere.
- Director and Executor use `CLAUDE_SONNET_4_6`. Planner uses `CLAUDE_HAIKU_4_5`.

## Verification

- The only automated gate today is TypeScript typecheck (`npx tsc --noEmit`). Verification lives in `src/lib/verification.ts`.
- When adding new verification gates (lint, tests, etc.), add them to `verification.ts` and call them in `run-verified-execution/index.ts` in sequence.

## File I/O

- All project-state reads/writes go through `src/project/`. Don't scatter `readFileSync`/`writeFileSync` into services or agents.
- `src/lib/files.ts` for generic file utilities; `src/project/` for Magent-specific state.

## Style

- No semicolons at end of lines — wait, the codebase uses no trailing semicolons in some files and does in others. **Follow the existing file's style when editing; prefer no trailing semicolons in new files** (the executor prompts and most lib files omit them; the project/ files include them — match the file you're editing).
- Actually: looking at the code, semicolons ARE used consistently throughout. **Always use semicolons.**
- Single quotes for strings.
- 2-space indentation.
- No unused imports. No `any` types unless genuinely unavoidable (document why with a comment if used).

## Testing

- No test framework is currently set up. Do not add one as a side-effect of a feature. If a feature requires tests, that is its own task.

## Git

- Magent manages its own branch lifecycle (`src/lib/git.ts`). Don't add git operations outside that file.
- Branch naming: `{type}/{slug}` (e.g. `feat/add-lint-gate`).
