# direction.md

## Frontier: Make the feedback loop compound — so Magent gets meaningfully better with use

Magent's core bet is that human-supervised AI coding is more valuable than autonomous AI coding. The supervisor stays in the loop, approving direction, plans, and individual executions, and that oversight is what makes the output trustworthy. But supervision only compounds into something durable if the system actually _learns_ from it. Right now, it doesn't — not really.

The feedback layer exists: agents receive JSONL feedback as flat text. But the signal is thin. The Executor gets a list of approved and discarded submissions, with comments. The Planner sees which plans were refined or abandoned. The Director sees its own past directions. None of this is structured for learning — it is structured for recitation. Agents get a wall of past decisions and are expected to infer taste from it. That works acceptably on session one; it degrades or stagnates as feedback accumulates.

The verification layer has the same problem. TypeScript typecheck is the only automated gate. If the Executor produces code that compiles but is logically wrong, imports something that doesn't exist at runtime, or breaks a test suite, nothing catches it — the bad commit lands on the branch and the human has to catch it on review. This makes the human a debugging layer rather than a supervisory layer, which is the opposite of what Magent should do.

**The frontier is: deepen the quality of the loop so that the system gets smarter with use, not just bigger.** This means: the feedback agents receive should be more signal-dense and actionable, not just longer; the verification gates should catch more real errors, not just type errors; and the project's own identity (MAGENT.md, conventions) should be legible to the agents that are supposed to act on it. Every feature the Planner mines from this frontier should make one of those three things meaningfully better.

This is the right priority now because the loop is functional but shallow. Adding more agents or more UI would compound on a weak foundation. Deepening the loop first means every subsequent improvement builds on something solid.

### What not to pursue right now

Do not pursue: new agent types (e.g. a "reviewer" agent, a "test writer" agent), UI or UX changes to the hosted web app, infrastructure changes (remote execution, multi-machine support, cloud storage of feedback), or any architectural refactor that isn't motivated by a concrete loop quality problem. Don't add features that make Magent feel bigger without making the loop sharper. The Planner should mine this frontier for features that make individual agent runs more accurate, more recoverable, or better-informed — not features that expand the surface area of the product.
