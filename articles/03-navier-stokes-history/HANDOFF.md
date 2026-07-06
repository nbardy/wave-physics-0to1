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

## Verification state (updated 2026-07-06, second pass)

Headless QA completed via a shimmed harness (the preview tabs run hidden with
rAF suspended; requestAnimationFrame + IntersectionObserver were shimmed in-page
so the real sim code ran): **all 22 figure canvases paint** (both Predict
reveals included), **all six TimelineHero eras render cleanly** through a full
era sweep, IdealFlow renders its field + meter, zero console errors throughout.
Both marquee drag meters verified by code reading: computed, never asserted
(IdealFlow via `pressureDrag()`; Loupe via Σ−p·n̂ₓ over mask faces). Stage-4/5
prose audit ran clean — zero fix-before-publish findings; its five judgment-call
trims are APPLIED (fork detonation defused, one aphorism cut, narrator
self-ranking removed ×3, "theory changes its mind").

Still owed a REAL browser (throttled timers make time-dependent behavior
untestable headlessly): the ReynoldsTube eruption above threshold (model wiring
verified in code — σ ≈ 4.2/s at the slider's top, erupts in ~2 s live), the
Loupe's rear-shoulder reversal (emerges from the solver; needs eyes), hero fps,
and the general feel pass. One human read-through before the publish flip.

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
5. **Decisions (made 2026-07-06, revisable)**:
   - Archival figures: STAYS all-interactive — the plan's ≤6 archival budget
     (deviation b) is retired unused. The figures already recreate what the
     archival images would show (Reynolds's plates = the tube sim; Leonardo's
     storm = the dye figure), rights friction buys nothing.
   - Hero wake quality: DEFERRED — the CPU street-ish wake is honest and the
     behavior (separation, unsteadiness) is real; wiring the GPU backend into
     TimelineHero is a nice-to-have, not a publish blocker.
   - §6 TermToggle reuse: ACCEPTED — a knowing replay of a lesson-01 finale
     figure; its 4 switches are the point of the callback.
6. Registry flip to `published` + README + AGENTS.md updates + deploy — reserved
   for the user (propose, don't surprise).

## Judgment calls reserved for the user

- Publishing. Archival images. GPU hero upgrade. Any section cuts.
