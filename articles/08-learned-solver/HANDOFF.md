# HANDOFF — Teaching a Solver to Guess (waves 04)

**State: v3 WRITTEN FROM SCRATCH 2026-09-02, `draft`.** One network, one story,
~2,650 body words plus ~200 of Further Reading, ten figure slots from eight components
(one of them new), the 809-weight pressure warm start shipped with its manifest,
106 assertions green via `bun run check:learned`, every one of which guards a
number the prose prints or a contrast a figure has to show.

**v3 (2026-09-02, Fable):** Nick's verdict on v2 was that the prose was bad and
the story a tour. v3 is a rewrite from the outline in
`redrafts/fable-2026-09-02/learned-solver/REIMAGINE.md` Part 2, under the sentence
law of `redrafts/fable-2026-09-02/00_VOICE_DOCS_CRITIQUE.md` §4. The v2 article is
preserved at `redrafts/fable-2026-09-02/learned-solver/lesson-04-v2-previous.mdx`
(and in git at 4ed3ad5). The second network — the advection flux correction, its
one-step detonation and its solver-in-the-loop repair — is CUT from this article
and banked as its own future article in `articles/CONCEPT_BANK.md` ("The advection
seam"); its code, weights, figures and training script all stay on disk untouched.

**v2 (2026-08-25):** two seams, the map act, ~6,050 words, 13 slots.
**v1 (2026-08-20):** ~4,300 words, 9 slots, the pressure seam only.

Reading order for a restart: `DENSE_CORE.md` (the hook and the ranked insights
still hold; its "tour of checks in descending strength" spine is v2's and is
retired) → this file → the REIMAGINE outline → `PLAN.md` (v2's figure table;
historical) → `source/VISUAL_STORYBOARD.md` (the external proposal, verbatim).

## What v3 is

Hero: `WarmStartRace` with one knob, the gate. Thesis: the meter reads the error
through the Laplacian, so it is nearly blind to the smooth error that costs
thousands of sweeps and loud about the rough error that costs a dozen — a guess
that supplies only the smooth part reads as worse than nothing, saves most of the
work, and cannot corrupt the answer.

Sections, each a naive build whose failure is on screen and drives the next:

| § | title | built | fails into |
|---|---|---|---|
| 0 | intro + hero | the race, gate knob | lesson 01's projection has no meter and stops at forty |
| 1 | Forty sweeps | `SolveDebt` — lesson 01's `project`, sweep budget knob | 0.28 of the defect survives forty sweeps; 240 does not finish what 40 started — the leftover has two speeds |
| 2 | The shape of the leftover | `SlowModes` + residual overlay | ripple gone in 12 sweeps, bulge a third there at 600; the meter follows the ripple — the expensive error is smooth and needs few numbers |
| 3 | Paint the bulge | `PaintTheBulge` (NEW) — the reader paints a 12 × 8 guess | field error falls while the meter rises; the seams; the meter's floor along the way is 0.91 — a hand takes a minute |
| 4 | The network paints | `ProposalAnatomy`, `WarmStartRace` (case knob), `ImpulseResponse` | 92% / 2.42 on the hero field; airfoil 26% / 1.9×; the impulse response is a wake prior, not the operator — the bill is still 792 sweeps |
| 5 | Take the guess | `UngatedRollout` | 0.70 → 84 in eight steps, blocks eight cells across — the meter stays, as the finish line |
| 6 | The gate | `SabotageGate` | worst drift 1.24% at 20% noise, under the 1.24% bound ‖d‖ < 2ε‖b‖/λ_min — the network can only move the sweep counter, a ratio with a denominator |
| 7 | The denominator | `Predict` + `FourWays` | cold CG (420 passes) beats warm sweeps (792); 3.4× against sweeps, 1.1× against CG; multigrid not run |
| 8 | The opening frame, read | `WarmStartRace` + residual-vs-sweeps plot, gate knob | the reader draws the curves before they run; the lead stops growing, so the ratio falls with the gate |
| — | Behind the gate | — | the ending: the meter's blindness is its guarantee; the last image is the sabotage slider at its right end |

Figures: `WarmStartRace` REUSE ×3 (props split: `gate`, `cases`, `plot`);
`SolveDebt` REUSE (+ headless `solveDebtReading`); `SlowModes` OVERLAY (third
trace: ‖A e‖ relative to its start, in violet; the rough mode recolored to
pressure red so violet stays the meter's ink); `PaintTheBulge` NEW (drag surface,
~200 lines; `paintReading`/`bestPainting` probes); `ProposalAnatomy`,
`ImpulseResponse`, `UngatedRollout`, `SabotageGate`, `FourWays` REUSE. Cut from
the page: `SmearRace`, `OneStepDrift`, `FluxRollout` (files kept).

## The measured numbers (this is the article)

All on the hero's field `h1` (`HELD_OUT_CASES[0]`, `buildCase` warm-up) at a gate
of 10⁻³ unless stated; all asserted in `scripts/check-learned.ts`.

| number | value | where |
|---|---|---|
| unknowns on the hero's channel | 5,631 | intro |
| proposal residual / field error | 2.42 / 8.5% missing (anatomy prints 92% right) | intro, §4 |
| sweeps to the gate, cold / warm | 2,679 / 792 (3.4×) | §0, §7, §8 |
| agreement of the accepted fields, max-norm / peak | 0.24% at 10⁻³; 6.0% at 10⁻²; 0.003% at 10⁻⁴ | §0, §6, §8 |
| ratio at 10⁻² / 10⁻⁴ | 8.3× / 2.1× | §0, §8 |
| lead in sweeps at 10⁻² / 10⁻³ / 10⁻⁴ | 1,246 / 1,887 / 2,037 | §8 |
| warm curve drops under cold | sweep 5 | §8 |
| late slope, both curves | 0.08 decades per 100 sweeps; warm 41× lower at sweep 2000 | §8 |
| leftover after forty sweeps, cold / warm | 0.236 / 0.041 | §4 |
| FourWays passes | 2,679 / 792 / 420 (140 it.) / 378 (126 it.); cold CG at 53% of warm GS; 6.4× GS→CG | §7 |
| √(λ_max/λ_min) on the hero grid | 47 (λ_min 0.00366 by inverse iteration, λ_max 7.99) | §7 |
| sabotage σ = 10 / 20 / 80 / 200 % | 18% wrong, 760 sw. / 76%, 2,326 / 162%, 2,714 / 258%, 3,059 | §6 |
| worst accepted drift | 1.24% at σ = 20%; bound 2ε‖b‖/(λ_min‖p‖) = 1.24%; 7.4 × 10⁻⁶ at σ = 200% | §6, ending |
| bound at 10⁻² | 12.4% (measured 6% of peak) | §6 |
| held-out sixteen fields (recomputed) | 2,330 → 840; 89% right; residual 2.27 | §4 |
| case knob (figure's own fields) | h2 22% / 1.4×; airfoil 26% / 1.9×; two discs 20% / 2.0×; open channel 41% / 1.2× | §4 |
| impulse response | 35–45% wrong for pokes at 10–90% of the channel; 90% / 127% at the ends | §4 |
| forward pass | 76,032 multiply-adds ≈ 2.7 sweeps of 5 flops × 5,631 cells | §4 |
| SolveDebt (144 × 88 cylinder, Re 500) | 0.28 at 40 sweeps (283× the gate); 0.77 at 4; 0.087 at 240 | §1 |
| SlowModes (empty 96 × 64) | λ: bulge 0.0036, 63-cell 0.020, 14-cell 0.41, 7-cell 1.63, checkerboard 8.0 (ratio 2,234); sweeps to 10%: 1,287 / 233 / 12 / 3; sweeps × λ = 4.61–4.90; meter 0.94% at 30 sweeps with 67% error left; bulge 34% at 600 | §2 |
| PaintTheBulge | one block ≥ half peak: residual 1.10–1.35, ≥ 96% missing; best painting 11% / 2.68; meter > 1 at 30% of the way (0.93 at 20%); floor 0.912 at 14%; 99.3% of ‖A p₀‖² on the seam lines; 915 sweeps from the best painting | §3 |
| UngatedRollout | 0.70, 0.90, 1.35, 2.60, 6.45, 17.3, 44.6, 83.6 over 8 steps vs 0.43 gated; 20 sweeps hold (0.53 at 60); 10 sweeps dead at step 11 | §5 |

The manifest (`weights.ts`) is now re-measured by the harness, not just compared
against: the sixteen held-out fields are rebuilt and re-solved on every run
(~10 s). Hard-coded string still in a component: `ImpulseResponse` prints "on a
wake it was 11%" — the held-out average; asserted to round to 11.

## Figure gaps declined

- **Seams overlay on `UngatedRollout`** (outline §5): not built. The divergence
  view already shows the eight-cell blocks; the prose names them. A block-lattice
  overlay would be a few lines if the reader cannot see them — check in a browser
  first.
- **A residual-field pane on `ProposalAnatomy`** (the network's seams, as
  `PaintTheBulge` shows the hand's): not built. Measured in this session's scratch
  run (94% of ‖b − A p₀‖² for the network's field sits on the same lines) but not
  printed and not asserted. Cheap to add as a fifth pane if wanted; assert it then.
- **Multigrid runner on `FourWays`** (Brandt 1977): not built; the ending names
  it as the race this article owes. A two-level V-cycle on `poisson.ts` is a
  half-day and would make the strongest possible denominator.

## Non-obvious things this build learned the hard way

- **The gate bound is tight.** ‖d‖₂ ≤ 2ε‖b‖₂/λ_min with λ_min from inverse
  iteration on the hero's grid (0.00366; the empty rectangle's is 0.00358) gives
  1.243%; the worst measured drift across the damage slider is 1.239%, at σ =
  20%. The noise there landed on the smoothest mode from the far side. Any prose
  that says "the bound is loose" at 10⁻³ is wrong on this field; it is loose at
  10⁻² (12.4% allowed, 6% seen). Assert with the grid's own λ_min and the same
  norm on both sides, or the check fails by 0.4% for a reason that has nothing
  to do with the physics.
- **The airfoil's two accepted fields differ by 1.4% of peak** at the same gate
  where the hero's differ by 0.24%. That is a different grid with a different
  λ_min; the prose does not state OOD agreement numbers for that reason, and a
  future sentence that does must measure λ_min on that grid first.
- **`prolong` kinks sit at block centres, not block edges.** The coarse samples
  are at fine index 8c + 3.5, so A p₀ is nonzero on the lines i ≡ 3, 4 (mod 8) and
  j ≡ 3, 4 (mod 8), plus the border rows. "Seams along the coarse-grid lines" is
  right only if the lines are through the centres; the harness measures 99.3% of
  ‖A p₀‖² there.
- **A residual-trained network would learn to propose a seventh of the bulge.**
  Along t · (best 12 × 8 painting) the residual has its minimum at t = 0.14
  (0.912) and exceeds 1 at t = 0.28. This is the measured reason the loss is on
  the field; the v2 prose asserted it.
- **Gauss–Seidel's sweeps-to-10% is 4.6/λ on every pattern**, i.e. 2 ln 10 / λ,
  with the GS factor ≈ (1 − λ/4)². Measured 4.61, 4.61, 4.90, 4.89 on the four
  slider patterns. The wavelength law is per-axis: λ ≈ (2π/L_x)² + (2π/L_y)²;
  for the (1,1) bulge the 64-cell height sets most of λ.
- **The sabotage figure's drift is NOT monotone in σ,** and it peaks at 1.24% (σ =
  20%), not at the extremes; at σ = 200% it is 7 × 10⁻⁶. The check sweeps eleven
  damage levels and asserts the worst and where it is.
- **The ungated rollout has to be seeded from a GATED warm-up** (120 steps at 40
  sweeps). From a healthy flow the collapse runs 0.70 → 83.6 over eight steps.
  Ten correction sweeps are called dead (divergence > 3) at step 11; fifteen
  survive sixty steps at 1.8; twenty at 0.53.
- **Float32 conjugate gradients stagnates around 5·10⁻⁵ on this grid.** The
  reference solve runs in Float64 internally; `poisson.ts` is precision-generic
  for that reason.
- **`clearRect` versus the check harness.** `render()` composites onto white
  AFTER drawing; a white fill first is wiped to transparent black, which reads to
  a hue probe as a perfect gray. Note is in `scripts/check-learned.ts`.
- **Hue tolerance 35 lets the faint blue-gray gridlines read as the gate green;**
  curve-presence probes in a plot want tol ≤ 20. Legend text in a curve's colour
  sits inside the plot box on `SlowModes` — probe regions must skip it.
- **Nine figures building at mount froze the page for ~4 s;** `lazyStepper`
  (figlib) defers construction to first step or draw.
- **96 × 64 will not shed a vortex street;** `SolveDebt` uses lesson 01's own 144
  × 88 cylinder because it is the one figure that does not touch the network.
- **`PaintTheBulge` has no `<Sim>`-level pointer support** — the drag surface is
  a wrapper `<div className="sim-stir">` around `<Sim>` reading the canvas rect,
  as `WingFlow` and `RegaugeBrush` do, with the stepper publishing its pane
  geometry through the shared ref. Reset re-runs `create`, which zeroes the ref.

## Decisions taken, revisable

- **`field: waves`, `order: 4`.** If the banked drag/turbulence lesson ships
  first this becomes 05 and only `registry.ts` changes.
- **Lesson file stays `lesson-04-learned-solver.mdx`** (legacy `lesson-NN-`
  prefix, matching the other waves lessons).
- **Amber is the network's field and nothing else**; solid border = classical,
  dashed = learned. The palette is no longer declared in prose — the pane labels
  carry it.
- **Further Reading keeps the pressure-side sources** (Tompson 2017, Kaneda 2023,
  Shewchuk 1994, Briggs, Brandt 1977) and adds Hestenes–Stiefel 1952 without a
  link (not verified this session). Um 2020 and Kochkov 2021 moved to the banked
  advection article.
- **`remark-gfm` stays** (added in v1); v3 has no tables in the body, but other
  lessons may use them.

## Remaining work before publish

1. **Browser QA and a mobile pass — STILL NOT DONE** (owed since v2; the preview
   pane was `visibilityState === 'hidden'` in both earlier sessions and was not
   used in this one). Nothing in v3 has been seen animating in a real browser.
   Specifically unverified: the `PaintTheBulge` drag surface (pointer capture,
   touch, the block-to-pointer mapping, whether dragging the full pane height is
   the right sensitivity); the residual plot under the closing `WarmStartRace` at
   height 350 (label collisions with the ledger, the plot band's height on narrow
   canvases); the three-pane figures under 400 px; the two `sim-seg` control rows
   on the case-knob race wrapping on a phone; the `SlowModes` legend now three
   lines tall over the plot's top-right corner.
2. **Nick's read.** The intro (rewritten after a judge failed the draft), the
   length (~2,650 body words against an outline estimate of 4,000–5,000 — the
   story is complete at this length; nothing was padded), the ending, and
   whether *Paint the bulge* earns its place as the article's only NEW figure.
3. **Reader-ToM review** (two simulated readers, line-anchored) has not been
   run on v3.
4. **Hestenes–Stiefel link** — add once verified.
5. **Consider `check:learned` in a combined script** — the repo has no aggregate
   check command.
