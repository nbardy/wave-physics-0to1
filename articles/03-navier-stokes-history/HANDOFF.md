# HANDOFF — Lesson 03: The History of Navier–Stokes

**State: BUILT END-TO-END (2026-07-06). Stages 1–3 complete plus full prose at
near-final quality; status `draft` in the registry. Mission of the next thread:
real-browser QA, the Stage-4 voice pass, Stage-5 audits, then publish.**

What exists: `DENSE_CORE.md` (thesis/hook/payoff/ranked insights — wins conflicts),
`RESEARCH.md` (verified chronology/network/gaps), `PLAN.md` (13-section skeleton),
and the article itself — `src/lessons/lesson-03-navier-stokes-history.mdx`:
~5,800 words, 14 sections, 20 live figure instances (22 counting the two Predict
reveals), 2 Predicts, 3 Waypoints, past-for-people / present-for-water tense
regime, no inline citations, ending skeleton deliberately distinct from lessons
01/02.

## What was built (2026-07-06, four parallel subagent batches + hand-written core)

New shared code:
- `src/sims/lib/potential.ts` — analytic potential flow (velocity, surface Cp,
  numerical drag quadrature). Hand-written; the honesty spine of §5.
- `src/components/TermStack.tsx` — the equation-with-birthdays display
  (`items: StackItem[]`, term/sep discriminated union), used twice in prose.

New sims (all Canvas-2D, fixed-timestep, one knob, seeded PRNG, sepia `#78716c`
history furniture): `IdealFlow` (drag meter COMPUTES ∮p·n̂ via potential.ts —
genuine 0.000), `CorpuscleHail` (Newton's model, deliberately wrong, empty shadow
wedge, sibling drag meter), `BuoyancyCrown`, `Barometer` (tilt-invariant height),
`PascalMountain`, `SoundRace` (√γ ratio exact), `BernoulliPipe` (observation-only,
principle untaught), `MolecularSprings` (the "ε (units: ?)" joke slider),
`StressCube` (4 draggable faces, σxy=σyx enforced+explained), `FallingSphere`
(exact linear-drag update, v_t ∝ R²), `PoiseuillePipe` (Q ∝ R⁴), `ReynoldsTube`
(CONFESSED phenomenological instability cartoon, Re_c=2000, seeded, auto-reinject
guard), `WhorlsCascade` (confessed cartoon), `BoundaryLayerLoupe` (real FluidSolver;
loupe shows no-slip profile + rear-shoulder reversal EMERGING from the solver; drag
coefficient integrated from solver.p over mask boundary, EMA-smoothed — the meter
that finally moves), `TimelineHero` (6-era discrete year scrubber, era sum-type
dispatch; era→Re mapping: 1822→Re 4, 1883→Re 45, 1904/1999→Re 140 on a 132×80 CPU
grid; term strip with filling nameplates + permanent blank "smoothness — open").

Reused from lessons 01/02: FlowVis(arrows), DyeCarry(vortex), ShearBlend,
TermToggle, StringSection(string), SolverXray.

`bun run typecheck` and `bun run build` green. Zero console errors with all 20
figures mounted.

## Verification state — READ THIS FIRST

Browser QA is INCOMPLETE, for an environmental reason, not a code one: the
preview tabs went `visibilityState: hidden` with rAF suspended mid-session (0×0
viewport wedge; sims only draw inside rAF). Verified before the wedge: **hero
paints correctly** (screenshot: corpuscles, disc, year chrome), **IdealFlow
paints** (pixel probe: 28% coverage, 48 colors), FlowVis paints, all figures
mount error-free. Verified by code reading: both marquee drag meters COMPUTE
(IdealFlow via `pressureDrag()`; Loupe via Σ−p·n̂ₓ over mask faces) — never
asserted. NOT yet seen running: Barometer, PascalMountain, SoundRace,
BernoulliPipe, MolecularSprings, StressCube, FallingSphere, PoiseuillePipe,
ReynoldsTube, WhorlsCascade, BoundaryLayerLoupe, TimelineHero era-switching, the
Predict reveals, the TermStack rendering. **First task of the next thread: open
the article in a real browser and play-test every figure top to bottom.**
Specifically watch: ReynoldsTube transition sharpness around the threshold; the
Loupe's rear-shoulder reversal and a plausible nonzero drag value; TimelineHero
era switches (state rebuilds cleanly, term strip fills correctly); hero fps.

## What is left (in order)

1. **Real-browser QA pass** (above). Fix what play-testing breaks; lesson 01's
   tilt-to-stall cut is the precedent for letting figures lose to reality.
2. **Editorial read per section** — "does any moment here need a figure it
   doesn't have?" Watch the §11 (Open Question) stretch: it is the proseiest
   section (one figure). Scale rules are heuristics; judge, don't count.
3. **Stage-4 voice pass** against NICKS_VOICE/SLOP/ESSENCE. Known risk spots:
   the §9→§10 hinge ends on a genuine fork (ideal-theory-nearly-right vs.
   drag-hides-in-a-sliver) — check it reads live, not staged (SLOP family 17);
   fork-hinge drafts go to Nick for taste-testing per standing practice; the
   sibling audit (hooks/waypoints/ending must not rhyme with lessons 01/02 —
   the ending was written to a new skeleton: verify).
4. **Stage-5 audits**: palette (sepia never used for physics; term colors match
   lesson 01's), ledger (the §5 zero is visibly paid in §10; every nameplate
   filled by §12 except the blank end; the fluxions plant §3 → Stokes payoff §8;
   Navier's slip plant §7 → §8 microfluidics payoff), tense audit, anti-checklist
   (no inline citations — highest-risk item for a history article).
5. **Decisions deliberately left open**:
   - Archival figures: built with ZERO of the plan's ≤6 (all-interactive instead).
     Decide whether Leonardo/Reynolds-plate images earn their place (rights check
     needed) or the confessed-drawn-homage route, or keep as-is.
   - Hero wake quality: at Re 140 on the CPU grid the 1904/1999 eras separate and
     go unsteady but the street is milder than lesson 01's GPU hero (semi-Lagrangian
     diffusion — same documented limitation). Wiring the GPU backend into
     TimelineHero is possible but was out of scope. Judgment call.
   - §6 reuses lesson 01's TermToggle (4 switches — over the one-knob budget;
     it's a knowing replay of a lesson-01 finale figure; flag or accept).
6. Registry flip to `published` + README + AGENTS.md updates + deploy — reserved
   for the user (propose, don't surprise).

## Judgment calls reserved for the user

- Publishing. Archival images. GPU hero upgrade. Any section cuts.
