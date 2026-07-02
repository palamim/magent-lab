# conventions.md

## Project conventions

### Stack
- **Next.js App Router** (client-heavy; almost all components are `'use client'`)
- **TypeScript** — strict, no `any`
- **Tailwind CSS v4** — utility classes for layout/spacing; design tokens as CSS variables for all colors and surfaces
- **React Icons** (`react-icons/fa6`, `react-icons/vsc`) for icons

### File layout
```
app/              — routes and layout only (thin, no logic)
src/
  core/api/       — transport layer only; one file per resource; components never fetch directly
  providers/      — shared state (MagentProvider) and gates (ConnectionGate)
  modules/        — feature UI, organized by region (main-panel/, shell/, onboarding/)
  components/     — generic primitives, promoted only on second use
  hooks/          — standalone reusable hooks
  model/          — shared TypeScript types, mirroring the brain's shapes
  lib/            — pure utility functions (no React)
```

### Components
- **`'use client'`** at the top of every interactive component (the whole app is client-side)
- Components consume state via `useMagent()` — they do not fetch directly or hold business logic
- Props are typed inline or with a local interface at the top of the file
- Keep components focused; extract sub-components within the same file if they are only used there
- Promote to `src/components/` only when a component is genuinely reused in two or more places

### Styling
- All colors and surface values come from CSS variables defined in `globals.css` — never hardcode color values
- Use Tailwind utilities for layout, spacing, flex, grid, overflow, transitions
- Use inline `style={{}}` for anything that references a CSS variable: `style={{ color: 'var(--foreground-muted)' }}`
- The design language: full dark, layered near-black surfaces, off-white text, restraint over decoration
- State colors carry meaning and must be used consistently:
  - `--positive` (green) — approve / merge / additions
  - `--negative` (red) — discard / removals / errors
  - `--running` (amber) — in-progress / pending
  - `--magent` / `--magent-bright` — brand accent, used sparingly
  - `--accent` — neutral interactive bright (active items, primary buttons on neutral surfaces)
- The code/diff area uses `--code-bg` (the darkest surface)
- Depth comes from surface elevation (`--background` → `--surface` → `--surface-raised`), not heavy borders or shadows

### State management
- All shared state lives in `MagentProvider` (`src/providers/magent.provider.tsx`)
- Components read state and call actions via `useMagent()` — no local copies of shared state
- Local UI state (open/closed, hover, form text) lives in the component with `useState`
- Side effects that load data on mount go in `useEffect` inside the provider, not in components

### API layer
- `src/core/api/client.ts` — base `get` / `post` with error unwrapping; all API calls go through it
- Per-resource modules (`plan.api.ts`, `execution.api.ts`, etc.) are the only place that calls `apiClient`
- Error messages surface through the provider's `error` state; components render `error` but don't handle it

### Trust conventions (product-level)
- Every consequential action (merge, discard, delete branch) must state what it will do before doing it — use `ConfirmModal` for destructive actions
- State colors must be semantically correct — never use green for a destructive action, never use red for a safe one
- Loading/acting states must be reflected immediately — disable buttons, show progress copy
- Never leave a user uncertain about whether an action is in flight

### TypeScript
- Use `interface` for object shapes, `type` for unions and aliases
- Enums for fixed value sets (e.g., `TaskStatus`)
- No `any` — use `unknown` and narrow, or model the type properly
- Shared types that mirror brain shapes go in `src/model/`

### Naming
- Files: `kebab-case.tsx` / `kebab-case.ts`
- Components: `PascalCase`
- Hooks: `useXxx` in `use-xxx.hook.ts`
- API modules: `resource.api.ts` with named exports `apiVerbNoun`
- CSS variables: `--kebab-case`

### What to avoid
- No file access, git, or model calls in the browser — that is the brain's job
- No logic in `app/` routes — routes render module components only
- No direct `fetch` in components — always go through the API layer
- No premature abstraction — promote to shared only on real second use
- No structural changes (new routes, provider restructure) without clear need
