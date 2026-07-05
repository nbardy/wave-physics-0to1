# HANDOFF — Lesson 02: Fiber Bundles, the Universal Medium

**State: Stage 4 complete and prose-audited (`draft`). Mission of this thread:
build the four judged-worthy missing figures, close the named debts, run Stage 5,
publish.** This lesson already passed a 38-finding multi-critic plan gate and a
4-lens prose audit (~24 findings, all applied) — respect that work; don't re-litigate
settled structure without strong cause.

## Read first, in this order

1. `AGENTS.md` — repo rules, sim honesty rules, and **"Scale and style: heuristics,
   not rules"** (figure counts are estimates, not quotas — this article is math-heavy
   by nature and is *allowed* to be prose/LaTeX-rich; density is judged by the story).
2. `ESSENCE_OF_VOICE_AND_DESIGN.md` and `METHODOLOGY.md` (Stage 5 gate).
3. `articles/02-fiber-bundles/DENSE_CORE.md` — the thesis/hook/payoff ranking.
   **House rule: DENSE_CORE wins conflicts with later drafts.**
4. `articles/02-fiber-bundles/PLAN.md` and `RESEARCH.md` — skeleton + grounding
   (Weinstein tweet, Wu–Yang dictionary, the 1858→1986 history).
5. `src/lessons/lesson-02-fiber-bundles.mdx` — read end to end in the browser first.

## Current state (measured 2026-07-05)

- 11 sections, 39 figure instances from 14 sim components, ~7,350 words (~188
  w/fig), 8 earned equations each with a boundary check, 2 `<Predict>`s,
  2 `<Waypoint>`s. Browser-verified: all canvases paint, zero console errors.
- Section spine: Möbius §3 · loop-vs-curvature split §7/§8 · Wu–Yang reveal §9 ·
  the wave §10 · Universal Wave Machine finale §11.
- Shared kits: `src/sims/lib/clocks.ts` (clock rendering), `src/sims/lib/awave.ts`
  (1-D connection-wave leapfrog, absorbing ends).
- Prose-audit fixes already applied include: imperatives → permissive voice,
  positional figure counting removed, Dirac 1931 conditional, Herbert (not Jeremy)
  Bernstein, θ color-bound at christening, epigraph = three sentences.

## What is left (in recommended order)

1. **Build the four `{/* fig gap: … */}` figures.** Search the MDX for `fig gap` —
   these were *judged* worth building (not count-chasing):
   - the **railway-towns anchor** (household anchor figure),
   - additional **dictionary-row replays** beyond the one built (Wu–Yang table rows
     replayed live),
   - the **which-force gallery**,
   - **linked vortex rings**.
   Two of these were chosen specifically to break the **§6→§7 drought** and the
   **§11-coda drought** — verify the droughts actually close.
2. **Editorial read** after those land: section by section, "does any moment need a
   figure it doesn't have?" This article is allowed to settle prose-heavy where the
   math wants prose — judge by the story, not by the 67-figure plan estimate or the
   188 w/fig number.
3. **Verify the epigraph tweet wording** against the live tweet (candidate: X status
   `1077751816400433152`). X blocks anonymous reads — this likely needs the user
   logged in, or the claude-in-chrome browser tools with the user's session. If
   verified, add the year to the attribution; if unverifiable, tell the user and
   decide together (do NOT silently keep unverified wording in a published article).
4. **Mobile/touch pass** on real device: drags on the holonomy/transport figures,
   control-row wrapping, canvas rotation behavior.
5. **Caption-policy coordination** ⚠ cross-thread: ESSENCE bans captions; some sims
   render hint text. ONE global decision shared with the lesson-01 thread — check
   AGENTS.md for a recorded decision first; record the outcome there.
6. **Stage 5 audits** (METHODOLOGY): rhythm (droughts, ≤1 knob except the flagged
   UWM finale), palette (every quantity keeps its color; θ especially), ledger
   (RopeCircle's planted energy meter pays off; the Möbius plant; the Wu–Yang
   reveal earns its §3–§8 setup; hero `HeroEMWave` returns understood), voice pass,
   anti-checklist (no captions, no rhetorical questions, no inline citations —
   sources quarantined to Further Reading).
7. **Remove the temporary `/stack-check` smoke-test section** for lesson-02 sims if
   it still exists (AGENTS.md flagged it) — but keep the WebGPU invariant checks
   that lesson 01 relies on. Verify what `/stack-check` currently contains before
   deleting anything.
8. **Flip to `published`** in `src/lessons/registry.ts`; update README curriculum
   table + AGENTS.md "where things stand"; deploy
   (`bun run build && bunx wrangler pages deploy dist --project-name wave-physics-0to1`).

## How to verify

- `bun run typecheck && bun run build` green after every change.
- `bun run dev` / preview tools (`.claude/launch.json` → `dev`).
- New sims obey AGENTS.md honesty rules: fixed timestep decoupled from RAF,
  stability condition in a comment, `create` = fresh state, pure `draw`, failure
  regimes reachable on purpose.

## Judgment calls reserved for the user

- The epigraph verification path (needs their X login) and what to do if it fails.
- Publishing (the status flip) — propose, don't surprise.
