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

## Verification state (updated 2026-07-29 — READER PASS, screenshots + eyes)

Run per `.claude/skills/figure-audit` with a deterministic pump harness
(rAF callbacks queued and driven with synthetic timestamps; IO stub fires via
queueMicrotask — setTimeout is useless in a >5-min-hidden tab, Chrome coalesces
its timers to ~1/min; figure under audit pinned `position:fixed` because JS
scrolling desyncs the hidden compositor; queue purged around every remount or
zombie loops multiply the step cost ~30× and fake blank canvases — TWO false
blanks were chased to this harness artifact before any real verdicts).

VERIFIED WITH EYES (fd14a83 fixes confirmed on screen):
- **TimelineHero, all six eras, distinct signatures**: 1687 corpuscles + disc;
  1757 markers parting around the disc; 1822 honey ooze (dye diffusing, no
  eddies); 1883 persistent stripes, mild wake; 1904 hard separation, wake never
  closes, `wake survey · C_d ≈ 0.43` + dashed survey line; 1999 the eight-row
  street look. WEAK (recorded, not blocking): 1822 vs 1883 read as "more/less
  ooze" — qualitatively distinct regimes only to a careful eye.
- **IdealFlow (the §5 marquee)**: mirrored red lobes nose AND tail, cyan
  shoulders, red press-arrows + cyan suction-fans on the rim, and the ledger —
  `downstream +1.000 / upstream −1.000 / net 0.000` with mirrored balance bars.
  The cancellation is now on screen, not asserted.
- **FallingSphere race**: at ×2 the small ball lands EXACTLY on the drawn ¼
  gridline as the big one touches the floor trailing 7 even strobe rungs;
  weight-∝R³ vs drag-∝R bars carry the why; `size ×2.0 → speed ×4.0` computed.

- **PressureOff panes**: contrast VERIFIED — upper stripes bow around the disc,
  lower stripes drive straight through into a huge violet plume. But reading
  the meters caught a REAL INVERSION: the honest pane reported 6.5% of cells
  vs the broken pane's 3.3% — the fraction-over-floor statistic measures
  SPREAD (diffuse Jacobi residual trips it in more cells than the concentrated
  plume). FIXED same day: meter now reports mean |∇·u| per fluid cell ("% of a
  cell's volume each second"), which orders correctly by magnitude; wreck
  threshold re-based (WRECK_MEAN 0.06). Ordering re-verify owed on screen.

NOT YET EYEBALLED (classifier outage interrupted the pass — resume here):
PressureOff meter ordering after the metric fix, BoundaryLayerLoupe (profile +
rear-shoulder reversal + nonzero drag), PoiseuillePipe (two pipes, 16:1
columns), ReynoldsTube (Re_c tick + direct/sinuous lamp + eruption within ~2 s),
PascalMountain (air column aligned to mercury; ~85 mm at 1465 m), BuoyancyCrown
(arrows persist at rest), BernoulliPipe (bulge gauge rises), CorpuscleHail (no
upstream strays; 1687 shadow-wedge emptiness also still unconfirmed),
WhorlsCascade (children RIDE the parent ring), MolecularSprings (kick cycle +
bond strokes), SoundRace, TermStack muted-unborn state, and knob-to-both-ends
on everything listed. Then the editorial read, then publish.

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
