# HANDOFF — Teaching a Solver to Guess (waves 04)

**State: BUILT end-to-end 2026-08-20, `draft`.** ~4,300 words, 9 figure slots from 7
live components, one genuinely trained network shipped with its manifest, 50
assertions green via `bun run check:learned`.

Reading order for a restart: `DENSE_CORE.md` (wins conflicts) → `PLAN.md` →
`source/VISUAL_STORYBOARD.md` (the external proposal this came from, preserved
verbatim) → this file.

## Where it came from

Nick supplied `wave_physics_deep_learning_visuals.zip` on 2026-08-19: four static
diagram scaffolds (equation atlas, solver timestep, error budget, cross-field
hybrids) plus a full story spine under the working title *The Learned Solver*. The
storyboard's spine, its palette discipline, and its figure-audit obligations were
adopted. Its scope was not — it asked for learned advection, a learned closure, a
whole-solver surrogate and a persistent equation dock. This article learns one thing
and learns it for real. See `PLAN.md §Standing deviations` for the list.

The four PNGs are design sources, not page assets. No figure in the lesson is a
diagram of a pipeline.

## What actually got built

`src/sims/learned/`

| file | what it is |
|---|---|
| `poisson.ts` | the pressure system lifted out of `sims/lib/solver.ts` — same stencil, same BCs — plus residual-gated Gauss–Seidel and a conjugate-gradient baseline |
| `net.ts` | the model: restrict 8× → three 3×3 convs → prolong. 809 parameters, forward pass only |
| `cases.ts` | training / held-out / out-of-distribution divergence fields, all read from `solver.div` after real timesteps |
| `weights.ts` | GENERATED. Weights + `MANIFEST` (dates, sample counts, and the measured scores) |
| `figlib.ts` | shared painting, case memoization, `lazyStepper` |
| 7 `.tsx` | the figures |

`scripts/train-pressure-net.ts` — data generation, conjugate-gradient targets, manual
backprop, Adam, a finite-difference gradient check that runs before the first step,
and the evaluation that writes the manifest. ~60 s end to end on a laptop. Re-run it
and `weights.ts` is rewritten.

`scripts/check-learned.ts` — `bun run check:learned`.

## The measured result (this is the article)

Held out, sixteen fields: Gauss–Seidel sweeps to a relative residual of 10⁻³ fall
2330 → 840 (**2.77×**). On conjugate gradients the same weights buy **1.14×**. And
cold conjugate gradients (420 grid passes) beats warm Gauss–Seidel (792) outright.
The proposal is 89% of the field and scores **2.27** on the residual meter, where a
cold start scores 1.00.

Out of distribution: field error 0.106 → 0.318, speedup 2.77× → 1.57×, and the
accepted answer is unchanged.

## Non-obvious things this build learned the hard way

- **The residual is not the error, and that is the article.** A smooth guess is 89%
  right and scores *worse than an empty grid* on the residual, because the residual
  weights the roughest modes hardest. Found by measuring, not by design.
- **The sabotage figure's drift is NOT monotone in σ,** and it peaks at 1.24% (σ =
  20%), not at the extremes — an early draft of the prose claimed "within a
  hundredth of a percent" from sampling only the two ends. The check now sweeps
  nine damage levels and asserts the worst. The right framing is that the bound
  comes from the gate, not from the weights.
- **The ungated rollout has to be seeded from a GATED warm-up.** Warming up ungated
  measures a channel that was destroyed before the clock started; from a healthy
  flow the collapse runs 0.70 → 0.90 → 1.35 → 2.60 → 17.3 → 83.6 on the divergence
  meter over eight timesteps, against a flat 0.42 for the gated channel. Both the
  figure and `rolloutDivergence` now do it this way.
- **The headline speedup is a function of the tolerance.** 8.3× at 10⁻², 3.4× at
  10⁻³, 2.1× at 10⁻⁴ on the same field. So is the agreement between the two answers:
  6% of peak pressure at 10⁻², 0.24% at 10⁻³. The gate's number is the contract's
  strength, and a speedup quoted without its tolerance is quoting nothing.
- **Float32 conjugate gradients stagnates around 5·10⁻⁵ on this grid.** The reference
  solve runs in Float64 internally and writes back; `poisson.ts` is
  precision-generic for that reason and the note is at the type.
- **`clearRect` versus the check harness.** `render()` used to fill white *before*
  calling `draw`, and every stepper opens `draw` with `clearRect` — so unpainted
  pixels were transparent black, which reads to a hue probe as a perfect gray. A
  "is the gray curve here?" check matched exactly 30060 of 30060 pixels in its box
  and passed. Compositing onto white *after* drawing is the fix; the note is in
  `scripts/check-learned.ts`. **Worth propagating to the other check scripts** — none
  of them fill white at all, so any gray/neutral-ink probe in
  `check-physics-figures.ts` and friends deserves the same suspicion.
- **Hue tolerance 35 lets the faint blue-gray gridlines read as the gate green.**
  Curve-presence probes in a plot want tol ≤ 20.
- **Nine figures building at mount froze the page for ~4 s.** `<Sim>` constructs every
  stepper on mount and only steps the visible ones, so `lazyStepper` (figlib) defers
  construction to the first step or draw. Any future lesson whose figures are
  expensive to construct wants this.
- **96 × 64 will not shed a vortex street** with this scheme; `SolveDebt` uses lesson
  01's own 144 × 88 cylinder because it is the one figure that does not touch the
  network. Re 500, steady wake, and the sweep-budget knob still visibly changes the
  flow.

## Decisions taken, revisable

- **`field: waves`, `order: 4`.** The banked 3-D drag/turbulence concept
  (`articles/04-drag-and-turbulence/`) is not in the registry and is week-scale away;
  a visible gap in printed lesson numbers seemed worse than a renumber later. If drag
  ships first this becomes 05 and only `registry.ts` changes.
- **Article folder is `articles/08-learned-solver/`** — the next free number on the
  repo's global counter, matching 05/06/07 practice.
- **The lesson file is `lesson-04-learned-solver.mdx`**, not `waves-04-…`. AGENTS.md
  documents `<field>-NN-slug.mdx`, but all three existing waves lessons use the legacy
  `lesson-NN-` prefix, and a fourth one named differently reads as a mistake.
  Renaming all four is a separate cleanup.
- **Amber is redeclared.** In every other lesson amber is the thing we watch; here it
  is the network's proposal and nothing else, so hue answers *who computed this* and
  line style (solid = classical, dashed = learned) reinforces it. The break is
  declared in prose at first use.
- **`remark-gfm` added to `vite.config.ts`,** with table styling in `index.css`. Three
  things in this lesson genuinely are tables and base MDX renders pipe syntax as
  literal text. Every URL in every existing lesson already lives inside a proper
  `[text](url)`, so GFM's autolinking changes nothing that shipped. First tables in
  the repo.

## Remaining work

1. **Nick's read.** Especially the hook (the opening contradiction) and the
   *Name the Baseline* section, which is the article's argument and the part most
   likely to want a different temperature.
2. **Voice sweep.** Written in the blend but never swept against `SLOP.md`'s four
   tests. Suspect spots: the `<Waypoint>` after *Name the Baseline*, and the two
   aphorisms (the bolded gate sentence, and the last line of *Final Words*) — two may
   be one over budget.
3. **Browser QA and a mobile pass — NOT DONE.** The preview pane was
   `document.visibilityState === 'hidden'` for this whole session, which suspends rAF
   and blanks every canvas, so no figure has been seen animating in a real browser.
   The headless suite covers what each figure *teaches*; it does not cover layout.
   Specifically unverified: canvas widths under 400 px (the three-pane race and the
   four-pane anatomy are the ones at risk), the two new `sim-seg` control rows on the
   race figure wrapping on a phone, and the three tables' horizontal scroll.
4. **Reading-list links are verified** (Tompson ICML 2017, Kaneda ICML 2023, Um
   NeurIPS 2020, Shewchuk 1994, Brandt 1977) — all four searched and confirmed
   2026-08-20. Briggs' *A Multigrid Tutorial* is cited without a link.
5. **Consider `check:learned` in a combined script** — the repo has no aggregate
   check command and now has six.

## What this article deliberately does not do

Learned advection, learned closure, and the whole-solver surrogate are discussed in
prose and demonstrated only in the surrogate's failure mode (`UngatedRollout`), which
is the part that can be built honestly with one small model. The storyboard's
persistent equation dock is banked in `articles/CONCEPT_BANK.md` — it is a good idea
for a lesson that genuinely spans all five terms of the equation, and this one spans
one seam.
