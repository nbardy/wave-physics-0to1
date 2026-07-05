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
written first; it wins conflicts with later drafts).

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
- **Lesson 02 (fiber bundles) is in Stage 3 (building)**: the plan passed a
  38-finding multi-critic gate (5 lenses, adversarially verified) and was rewritten
  accordingly — now 11 sections / 67 figures; Möbius is §3, §7/§8 split
  loop-vs-curvature, §9 the Wu–Yang reveal, §10 the wave, §11 the Universal Wave
  Machine finale. Built and browser-verified so far: `sims/lib/clocks.ts` (clock kit),
  `sims/lib/awave.ts` (shared 1-D connection-wave leapfrog, absorbing ends),
  `StringSection`, `MobiusComb`, `RopeCircle` (with the planted energy meter),
  `TransportNeedle`, `HeroEMWave` (in-phase E/B per the plan's misconception spec).
  Remaining sims (RegaugeBrush, ConnectionTuner, HolonomyLoop, GlobeTransport,
  ABInterference, HopfMonopole, ConnectionWave, UniversalWaveMachine) are being
  built against the PLAN's per-figure specs. Smoke-test harness: `/stack-check`
  (temporary section — remove when the lesson MDX lands). Then: MDX prose
  (Stage 3 blocking + Stage 4 voice), registry → `draft`, Stage 5 audits.
- **Stage 5 debts** (before `published`): densify figures toward the plan's ~80
  (currently 32, rhythm-correct but sections lean); static-fallback sentences;
  real-device mobile pass. Resolved 2026-07: the Kármán street (WebGPU solver, above);
  mobile layout overflow (control rows now wrap; was 146px of horizontal scroll at
  375px) and touch drags (`.sim-stir` wrapper sets `touch-action: none` on the three
  pointer-interactive figures, so stirring no longer scrolls the page). Known
  limitation: `<Sim>` sizes its canvas once at mount — device rotation stretches the
  figure instead of re-laying it out.
