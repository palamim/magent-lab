export const magentUiConventions = `
# conventions.md

## 0. Stack

- Language: TypeScript 5, strict mode
- Framework: Next.js 16 (App Router), React 19
- Runtime: Browser + Node.js (Next.js server)
- Styling: Tailwind CSS v4 via \`@tailwindcss/postcss\`; design tokens as CSS custom properties in \`globals.css\`
- Key libraries: \`react-icons\` (fa6/vsc icon sets), \`@next/third-parties\` (Google Analytics)

---

## 1. Structure

\`\`\`
app/                  Next.js App Router root (layout, page, globals.css)
src/
  components/         Shared, reusable UI primitives used across modules
  core/
    api/              All API call functions and the shared fetch client
  hooks/              Custom React hooks
  lib/                Pure utility/helper functions (no React)
  model/              TypeScript types and enums for domain entities
  modules/            Feature-area UI; each sub-folder is one feature area
    main-panel/       Main content panel views and bars
    onboarding/       Connection/setup screens
    shell/            App chrome: sidebar, top bar, settings panel
  providers/          React context providers and gates
\`\`\`

**Placement rules:**

- Shared, multi-module components must live in \`src/components/\`.
- Single-use components that belong to one feature area must live inside that feature's \`src/modules/<area>/\` folder, not promoted to \`src/components/\`.
- Every API function must live in \`src/core/api/\`. No API calls may be made outside of \`src/core/api/\` files (except directly in provider/hook files calling the \`src/core/api/\` exports).
- Domain type definitions (interfaces, enums) must live in \`src/model/\`.
- Custom hooks must live in \`src/hooks/\`.
- Pure utility functions with no React dependency must live in \`src/lib/\`.
- Context providers must live in \`src/providers/\`.
- The Next.js \`app/\` directory must contain only routing files (\`layout.tsx\`, \`page.tsx\`, \`globals.css\`); all substantive component logic must live in \`src/\`.

---

## 2. Naming

- Source files must use \`kebab-case\`. ✅ \`chat-box.tsx\` ❌ \`ChatBox.tsx\`
- CSS variables must use \`var(--kebab-case)\`. ✅ \`var(--surface-raised)\` ❌ \`var(--SurfaceRaised)\`
- Component files must use the \`.tsx\` extension.
- Non-component TypeScript files must use the \`.ts\` extension.
- API module files must be named \`<domain>.api.ts\`. ✅ \`branch-diff.api.ts\` ❌ \`branchDiff.ts\`
- Hook files must be named \`<name>.hook.ts\` or \`<name>.hook.tsx\`. ✅ \`use-connection.hook.tsx\` ❌ \`useConnection.tsx\`
- Model files must be named \`<domain>.model.ts\`. ✅ \`execution.model.ts\` ❌ \`execution-types.ts\`
- View components (module-level main panel views) must be named with the \`.view.tsx\` suffix. ✅ \`plan.view.tsx\` ❌ \`plan.tsx\`
- React component names must be \`PascalCase\`. ✅ \`export const MainPanel\` ❌ \`export const mainPanel\`
- React hooks names must be \`camelCase\`. ✅ \`useMagent\` ❌ \`UseMagent\`
- Exported hook functions must be named with the \`use\` prefix in \`camelCase\`. ✅ \`useConnection\` ❌ \`connectionHook\`
- API functions must be named with the \`api\` prefix in \`camelCase\`. ✅ \`apiGetConfig\` ❌ \`getConfig\`
- TypeScript interfaces must be \`PascalCase\` without an \`I\` prefix. ✅ \`interface MagentState\` ❌ \`interface IMagentState\`
- TypeScript enums must be \`PascalCase\` with \`SCREAMING_SNAKE_CASE\` values. ✅ \`enum TaskStatus { PENDING = 'pending' }\` ❌ \`enum taskStatus { pending }\`
- Module-level private sub-components (used only within one file) must be \`PascalCase\` named constants defined in the same file, not exported. ✅ \`const TaskRow = (...)\` at file bottom ❌ exporting them or placing them in \`src/components/\`

---

## 3. File Rules

- Every file in \`src/\` that renders JSX and uses client-side React features (state, effects, event handlers, context) must have \`'use client';\` as its first line.
  ✅ \`'use client';\n\nimport { useState } from 'react';\`
  ❌ \`import { useState } from 'react';\` at top without the directive

- Files in \`src/components/\` that use only React props and no client-only APIs must not have \`'use client';\` unless they actually use client-only APIs.
  ✅ \`dev-badge.tsx\` and \`external-link.tsx\` have no \`'use client';\`
  ❌ Adding \`'use client';\` to a purely render-only component

- Every API file in \`src/core/api/\` must export only named exports (no default exports).
  ✅ \`export const apiGetConfig = ...\`
  ❌ \`export default apiGetConfig\`

- Every model file in \`src/model/\` must export only named exports (no default exports).

- Every component file must export its component as a named export (not default), **except** Next.js route files in \`app/\` which must use \`export default\`.
  ✅ \`export const ChatBox = ...\` in \`src/components/chat-box.tsx\`
  ✅ \`export default function Home()\` in \`app/page.tsx\`
  ❌ \`export default const ChatBox\` in \`src/components/\`

- Every \`src/core/api/*.api.ts\` file must import \`apiClient\` from \`@/core/api/client\` and use only \`apiClient.get\` or \`apiClient.post\`; no raw \`fetch\` calls are permitted in API files.
  ✅ \`apiClient.get('/plan-state?dir=...')\`
  ❌ \`fetch('/plan-state?dir=...')\`

---

## 4. Code Idioms

- Use the \`@/\` path alias for all imports from \`src/\` — never use relative paths that cross folder boundaries.
  ❌ \`import { useMagent } from '../../providers/magent.provider'\`
  ✅ \`import { useMagent } from '@/providers/magent.provider'\`

- Use CSS custom properties (e.g. \`var(--foreground)\`) via inline \`style\` props for all design-token colors — never use Tailwind color utilities for design-token values.
  ❌ \`className="text-gray-400"\`
  ✅ \`style={{ color: 'var(--foreground-muted)' }}\`

- Use Tailwind utility classes for layout/spacing/structural properties (flex, padding, margin, rounded, border, overflow, positioning) — never write inline styles for layout that Tailwind covers.
  ❌ \`style={{ display: 'flex', padding: '1rem' }}\`
  ✅ \`className="flex px-4 py-3"\`

- Use \`ApiError\` (from \`@/core/api/api-error\`) as the only thrown error type from \`apiClient\`; catch blocks in components must check \`err instanceof Error\` — never assume \`err\` is a string.
  ❌ \`setError(err as string)\`
  ✅ \`setError(err instanceof Error ? err.message : 'Fallback message')\`

- Use \`createContext\` / \`useContext\` with a \`null\` initial value and a throwing accessor hook for context — never export the context object directly for consumption.
  ❌ \`export const MagentContext = createContext<...>(...)\` consumed via \`useContext(MagentContext)\` outside its module
  ✅ \`export const useMagent = () => { const ctx = useContext(MagentContext); if (!ctx) throw new Error(...); return ctx; }\`

- Use \`interface\` for object-shape types — never use \`type\` aliases for plain object shapes.
  ❌ \`type ChatBoxProps = { placeholder: string; ... }\`
  ✅ \`interface ChatBoxProps { placeholder: string; ... }\`

- Use \`type\` aliases only for union types, discriminated unions, and type-level utilities.
  ✅ \`type Mode = 'build' | 'direct'\`
  ❌ \`interface Mode\` for a union

---

## 5. Enforced by Tooling

- TypeScript compiler (\`tsconfig.json\`): \`strict: true\` enforces strict null checks, no implicit any, strict function types.
- TypeScript compiler: \`noEmit: true\`; module resolution is \`bundler\`; path alias \`@/*\` → \`./src/*\`.
- ESLint (\`eslint-config-next\`): enforces Next.js rules including React hooks rules, no-unused-vars, and import hygiene.
- Next.js build: enforces that \`app/\` files follow App Router conventions (default exports for pages, etc.).

`;
