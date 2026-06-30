# direction.md

## The frontier: make every human decision point legible and trustworthy

The product's loop is wired. The connection gate, the onboarding, the Build/Direct modes, the plan/task/execution/diff flow, the direction proposal — all of it works. The architecture is sound: transport layer, central provider, module views, clean separation between brain and UI. That's done.

What isn't done is the thing the product is *for*.

Magent's thesis is that the direction layer — the human-in-the-loop deciding what to build and approving every step — is the real differentiation. The product earns trust by making every consequential action legible: what will this do, why, what will change. Right now the loop is functional but thin. The wiring is there; the surfaces don't yet deliver the experience.

**The heading is: make the key human decision moments in the loop feel deliberate, informative, and trustworthy — not just functional.**

There are four decision points a user passes through in every loop:

1. **Direction review** — the user is deciding whether to accept a proposed direction for their project. Currently the DirectionView renders only a `rationale` in a raw `<pre>` block. The direction and conventions documents are accessible as sidebar items but the view itself doesn't orient the user to what they're looking at, what they're approving, or what the documents will change. This is the highest-stakes decision in the loop and the surface is the weakest.

2. **Task briefing** — before running a task, the user is the last checkpoint before an agent touches their code. The TaskView shows the task's instructions in a `<pre>` block with a "Run this" button. This is the trust moment: what files will be touched, what exactly will happen, why this task matters in the plan. It should feel like a clear brief, not a raw dump.

3. **Execution review (keep/discard)** — after the agent commits, the user reviews a diff and decides. The diff viewer is solid. But the deciding moment lacks weight: keep/discard controls live in a distant top bar, disconnected from the diff the user is looking at. There's no summary of what changed, no sense of the decision being deliberate. The highest-trust moment in the loop should feel like a real approval, not an afterthought.

4. **Entry points (empty states)** — the first thing a new user sees in Build mode and Direct mode. Currently minimal and not orienting. These are the opening move: they should quickly tell the user what's about to happen and invite them in with confidence.

Work in this direction will touch all four moments over weeks, making each clearer, more informative, and more worthy of the trust the product asks for. This is not a cosmetic pass — it's the product's core differentiator made real. Every concrete feature the Planner mines from here should make a decision moment feel more deliberate: richer layouts, better information hierarchy, more explicit state communication, stronger context before consequential actions.

**What NOT to pursue right now:**

- Structural refactors of the provider, routing, or API layer — those are sound and don't need to change.
- New features that add surface area (settings expansion, new config options, new inspect tools).
- Performance or build tooling work.
- Anything in the onboarding/connection gate — that's already well-done.
- Accessibility or mobile concerns — this is a desktop developer tool first.

The architecture earns nothing until the surfaces make the loop feel trustworthy. That's the work.
