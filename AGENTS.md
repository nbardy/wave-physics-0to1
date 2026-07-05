# AGENTS.md

A self-study in wave physics, written as Ciechanowski-grade explorable explanations —
his pedagogy, plus the equations he deliberately omits. Before writing anything, read
in this order:

1. **`ESSENCE_OF_VOICE_AND_DESIGN.md`** — what the master actually does (measured from
   all 22 posts; corpus in `research/`). The rules of voice, design, and pedagogy.
2. **`METHODOLOGY.md`** — the essence inverted into our five-stage process:
   concept → skeleton → blocked content → final draft → polished post. Includes our
   four standing deviations (we cash out the math; prediction before reveal; waypoints;
   named solvers).
3. **`articles/01-navier-stokes/PLAN.md`** — the full-length plan for lesson 01.
4. **`articles/02-fiber-bundles/PLAN.md`** — the full-length plan for lesson 02 (waves as sections
   of bundles; the connection as the universal medium; seeded by the Weinstein tweet
   quoted at its top). Its subject-matter grounding — what the tweet technically
   refers to, the papers, the 1858→1986 history — is **`articles/02-fiber-bundles/RESEARCH.md`**;
   its distilled hook/payoff/insight ranking is **`articles/02-fiber-bundles/DENSE_CORE.md`**.

Article docs live in per-article subfolders: `articles/NN-slug/{DENSE_CORE,PLAN,RESEARCH}.md`
(DENSE_CORE = the compressed inspiration — thesis, hook, payoff, ranked insights —
written first; it wins conflicts with later drafts). Per-article handoff state lives
in `articles/NN-slug/HANDOFF.md`.

## Scale and style: heuristics, not rules

Ciechanowski's articles tend to run ~3,000–16,500 words and ~21–120 figures, with
density settling around one figure per ~85–180 words. We use none of these as rules
— they are heuristics. **Our article length matches the length of the story**: we
don't drone on, we don't cut short; we match the content of what we want to teach
and the blocks and layers it actually needs. Density is the same: we often arrive
near the corpus density on our own, but an article type that begs more prose, more
LaTeX, or full proofs is welcome to them, and an article that is visual through and
through settles figure-heavy. Plan-stage figure counts are feasibility estimates,
never quotas.

More generally: **we don't mechanistically copy the previous author's style.** We
study his style, recover the *philosophy* behind his decision-making, and work
forward from our own intuition and taste with guiding principles.

## The repo

Vite + React + TS · MDX lessons with KaTeX (`$…$`, `$$…$$`) · Canvas-2D sims ·
Cloudflare Pages. `<Sim>` and `<TeX>` are available in MDX without imports.
`bun run dev` / `bun run typecheck` / `bun run build`.

- A lesson is `src/lessons/lesson-NN-slug.mdx`, registered in `src/lessons/registry.ts`
  (status is a sum type: `planned → draft → published`).
- A figure is a `Stepper` — `step(dt)` / `draw(ctx, w, h)` — handed to
  `<Sim create={…}>`. The stepper owns its state; the shell owns the RAF loop and
  Play/Pause/Reset. Figure-specific controls are bespoke JSX passed as `<Sim>` children
  (a slider is an `<input type="range">` writing to a ref the stepper reads). Extract
  shared control components only after a pattern repeats across three figures.

## Honesty rules for sims (non-negotiable)

- **Fixed physics timestep, decoupled from frame rate** (the `acc`/`FIXED_DT` loop in
  `src/sims/ViscosityDemo.tsx` is the reference). RAF cadence must never change the
  physics.
- **State the scheme's stability condition in a comment beside the constants that
  satisfy it** — and prefer constructions where stability holds by construction (e.g.
  a slider mapped to the diffusion number, not to raw ν).
- `create` builds fresh state; Reset re-runs `create`; `draw` is pure.
- Never a pre-rendered clip standing in for a sim. If we can't simulate it honestly,
  we say so in prose (his move) — we don't fake it.

House code style (one clean path, types as control flow) applies to sim code; see the
global CLAUDE.md. Registry dispatches on `status.kind` exhaustively — no default
branches.

## Where things stand

- **Lesson 01 is built end-to-end** (Stage 4 of METHODOLOGY): all 13 sections, 32 live
  figures, ~4,900 words (153 w/fig — inside the corpus band), 9 earned equations,
  2 Predict widgets, 2 Waypoints, verified in-browser at 60 fps. Status: `draft`.
- Infrastructure: palette contract (`sims/lib/palette.ts`), `<C>`/`<Waypoint>`/`<Predict>`
  prose components, field-renderer kit (`sims/lib/field.ts`), CPU Stable Fluids solver
  with term toggles (`sims/lib/solver.ts`), 16 sim components. `<Sim>` freezes
  off-screen figures via IntersectionObserver (perf: 8 → 61 fps).
- **WebGPU compute solver** (`sims/lib/gpu/` — see `PLAN_GPU_SOLVER.md`): WGSL port of
  the Stable Fluids scheme with MacCormack-corrected advection and a multigrid
  pressure solve, running the hero (`CylinderFlow`) at 4× grid resolution with typed
  CPU fallback. This resolves the "waver, not a Kármán street" Stage-5 debt on
  WebGPU-capable browsers: the street self-starts and sustains (kick-test σ ratio
  1.23 at 1.45 ms/step; both MacCormack and multigrid are load-bearing — see the
  PLAN's measurement table). Live invariant checks on `/stack-check`. CPU-fallback
  browsers still get the v1 waver.
- **Lesson 02 (fiber bundles) is built end-to-end** (Stage 4, audited): 11 sections,
  39 figure instances from 14 components (~188 w/fig), 7,349 words, 8 earned
  equations each with a boundary check, 2 Predicts, 2 Waypoints, browser-verified
  (all canvases paint, zero console errors). The plan passed a 38-finding
  multi-critic gate before building; a 4-lens Stage-5 audit produced ~24 prose
  findings, all applied (voice imperatives → permissive; positional
  figure/section counting removed; Dirac 1931 made conditional; transversality
  claim softened to "demonstrated"; θ color-bound at its christening; Herbert
  (not Jeremy) Bernstein; epigraph = three sentences; thesis/inversion
  exactly-once vows re-verified). Status: `draft`.
- **Lesson 02 Stage-5 debts** (before `published`): an editorial read per section —
  "does any moment here need a figure it doesn't have?" (plan counts are estimates,
  not quotas; see METHODOLOGY's rhythm-audit note). The four `{/* fig gap: … */}`
  comments in the MDX mark planned-but-unbuilt figures judged worth building:
  railway-towns anchor, dictionary row replays
  beyond the one built, which-force gallery, linked vortex rings; the §6→§7 and
  §11-coda droughts that those figures would break; epigraph tweet wording is
  UNVERIFIED against the live tweet (X blocks anonymous reads — needs a logged-in
  check of candidate status 1077751816400433152, then add the year to the
  attribution); mobile/touch pass; the lesson-01-style caption inconsistency
  (ESSENCE bans captions, some sims render hint text) needs a global decision.
- **Lesson 01 Stage-5 debts** (before `published`): the same editorial read — lesson
  01 is rhythm-correct at 32 figures (plan estimated ~80; publish at whatever length
  teaches best, adding a figure only where a specific moment wants one);
  real-device mobile pass. (Static-fallback sentences: requirement dropped 2026-07 —
  the figures are the argument.) Resolved 2026-07: the Kármán street (WebGPU solver, above);
  mobile layout overflow (control rows now wrap; was 146px of horizontal scroll at
  375px) and touch drags (`.sim-stir` wrapper sets `touch-action: none` on the three
  pointer-interactive figures, so stirring no longer scrolls the page). Known
  limitation: `<Sim>` sizes its canvas once at mount — device rotation stretches the
  figure instead of re-laying it out.
