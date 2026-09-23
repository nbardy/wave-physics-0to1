# Construction IV — story options and review

Working revision, 22 September 2026. I, II, and III remain reading baselines;
history remains a separate article. This document holds the concept, sketches,
choices, and editorial findings for IV. Implementation state belongs in HANDOFF.

## Brief and dense core

**Question:** how does a computer turn a field of numbers into moving fluid, and
which tests distinguish a believable animation from a calculation we can trust?

**Protagonist:** two patches of dye on a small grid. First their motion is given;
later the grid must calculate its own velocity. No wing, chronology, or prize.

**Payoff:** the reader can inspect where a dye value came from, identify smoothing
introduced by interpolation, distinguish it from viscosity, balance a cell,
understand a pressure solve, and trace those operations through one timestep.
Passing one of these tests does not imply passing the others.

**Ranked insights:**
1. Reversing a prescribed movement need not undo the numerical update. Interpolation
   can lose a pattern even when the exact trajectories return.
2. Dye is carried by velocity; calculating that velocity is a separate problem.
3. Incompressibility constrains neighbouring velocity updates together. Pressure
   supplies a correction, rather than an independently animated heat map.
4. Stability, conservation, and accuracy answer different questions. A stable dye
   update can conserve its total and still erase its shape.
5. The displayed equation becomes a sequence of finite operations. Their order,
   spacing, and stopping conditions are part of the answer the computer produces.

## Alternatives, before selecting a build

| Option | Opening experiment and interaction | Strength | Critical objection | Decision |
| --- | --- | --- | --- | --- |
| A. A valve with no moving parts | Matched forward/reverse channels; vary viscosity; compare pressure drop | A concrete engineering prediction, visibly distinct from history | Existing 300×52 feasibility run gives only 1.05 diodicity at Re 1000. The 2021 experiment uses a specific geometry and three-dimensional flow; its result cannot be borrowed for this solver | Keep as a separate research candidate. Do not tune a picture to an unmeasured claim |
| B. Put the dye back | Apply several horizontal/vertical shears, then their inverses; compare exact transport with a grid | A large, inspectable numerical error with an independent answer; immediately about computing | Could be mistaken for physical irreversibility, or a lesson only about image interpolation | Prototype. State prescribed motion and zero molecular diffusion before inference; transition explicitly to calculating velocity |
| C. Repair a broken flow | Drag a push into paired grids; vary pressure correction, see deformation and imbalance | Direct intervention, genuine solver, good final workbench | Opens on an abstract diagnostic before a reader knows what violet means; repeats history's pressure-removed comparison | Use in the numerical middle/end, not as the opening |
| D. Stir a cup | Finger as spoon, with a fixed comparison | Familiar and fun | Nick explicitly rejected the coffee opening; a nicer cup would preserve the same weak premise and offer no accuracy reference | Reject for this revision |

### Sketch A — valve

    forward geometry → same flow rate → pressure drop
    reverse geometry → same flow rate → pressure drop
    viscosity: creeping-flow equality ↔ direction-dependent resistance

Retain the failed measurement as evidence. A proper geometry plus resolution and
steady-state checks is a research project, not a prerequisite for writing IV.
Source: Nguyen, Abouezzi & Ristroph (2021),
https://www.nature.com/articles/s41467-021-23009-y .

### Sketch B — return experiment

    exact paths                       values resampled on a grid
    two distinct dye patches          identical starting patches
    stretch → fold → inverse motion   stretch → fold → inverse motion
    original shapes return           lost contrast remains lost

    [start] ─── [most stretched] ─── [returned]

Both states remain visible. A progress scrubber selects precomputed states from
one experiment; dragging backward selects the recorded state, while the second
half of the experiment actually applies inverse motion. These are different
operations and must not be described as the same thing. A later return to this
figure exposes grid resolution, after the interpolation mechanism is understood.

**Feasibility gates:** exact map composes with its inverse to roundoff; the grid
scheme stays bounded; the returned dye visibly differs; refinement improves a
measured error over the chosen configurations. Use the same domain and elapsed
time at every resolution. No molecular diffusion or hidden decay multiplier.

### Sketch C — inspect an update

    before push / proposed velocities | corrected velocities
    same arrows and cell faces        | pressure + measured net flux
    correction: 0% ── balanced ── too much

The correction can overshoot. The value on the meter must be measured from the
displayed velocity, not a percentage calculated from the slider alone.

## Skeleton and figure briefs

The first question is how to move stored dye without inventing concentrations.
After that is answered, a further question follows: where do its velocities come
from? This is an explicit change of problem, not a pretend failure of advection.

| Section | What changes in the reader's model | Figure / action | Evidence and limit |
| --- | --- | --- | --- |
| Opening | Running a numerical update backward can fail to restore a pattern | B: scrub the forward/return experiment | Exact and grid dye side by side; prescribed current, no molecular diffusion |
| What a cell stores | A cell holds a few numbers, not a little movie | Inspect a selected cell and its face velocities | Same patch with cell boundaries and concentration; scalar centres versus velocity faces |
| Moving the values | Follow arriving fluid backward to its old position | Existing BacktraceLab | Two interpolation weights and the resulting value, including integer-cell shifts |
| A method that survives | A plausible centred slope update produces impossible concentrations | Existing TransportErrors | Negative values/overshoot versus bounded backtracing; fixed scales |
| What was lost | Stability does not guarantee pattern recovery | B again, resolution unlocked | Matched coarse/fine returned patterns and measured error; distinguish cell spacing from screen pixels |
| Calculating motion | A travelling parcel can accelerate in a steady field | Existing ParcelAcceleration from II | Fixed probe and moving parcel traces; this is a prescribed narrowing flow |
| Neighbours exchange momentum | Viscosity changes velocities, not merely dye sharpness | Existing DiffusionLab | Before/after, fixed two seconds; ν named and unit stated |
| A cell cannot accumulate water | Four face flows must balance | Existing CellFlux | Solve one imbalance by hand; distinguish dye concentration from water volume |
| Pressure couples cells | A correction must satisfy every cell simultaneously | Existing ProjectionLab, then sweeps | Under/overcorrection and residual from displayed fields; derive Poisson rather than waive it away |
| One timestep | The terms operate on a common stored state | Existing SolverCycle and TermExperiment | Successive states and matched omissions; distinguish numerical omission from a new physical fluid |
| Let it run | Velocity now evolves instead of being supplied | Existing LiveSolverLab, refined if reader review finds a concrete defect | Dye injection changes dye; dragging changes velocity; pause remains inspectable |
| Closing check | A small pressure residual does not recover lost dye detail | Opening experiment's result interpreted through the completed solver | No claim that a return test validates Navier–Stokes as a whole |

Keep the useful numerical figures; remove the repeated creek/molecules/wing tour,
the Reynolds gallery, pressure marbles, and wave coda from IV. They survive in the
other reading copies. Reuse is earned by a figure's role, not by its availability.

## Review plan

1. Numerical feasibility and rendered prototype; choose the hero on evidence.
2. Block the complete argument around working figures; audit every transition.
3. Draft opening alternatives, judge their factual content and reader demand.
4. Full prose pass, with SLOP's four judgment tests and the history alongside it.
5. Technical claims/source pass; independent checks for new numerical claims.
6. Reader pass: non-specialist and numerical practitioner, explicitly editorial
   perspectives rather than invented external feedback. Record accepted and
   declined findings with reasons.
7. Desktop/narrow-browser interactions, screenshots of every mounted figure,
   keyboard, return trips, pause/reset, and route/version checks.

Primary implementation references: Stam's 1999 *Stable Fluids*
(https://graphics.stanford.edu/courses/cs468-05-fall/Papers/p121-stam.pdf) and
Bridson's course notes (https://www.cs.ubc.ca/~rbridson/fluidsimulation/).
The shear experiment is a manufactured advection test, derived and checked here;
it is not presented as a reproduction of Taylor's physical unmixing experiment.

## Prototype decision

The return experiment passed independent trajectory inversion, concentration
bounds, and dye-sum checks. After the same six seconds, overlap with the initial
pattern is 9%, 16%, and 38% on 24², 48², and 96² grids; exact transport returns
100%. A 192² check reaches 57%. These are measurements of this manufactured
experiment, not convergence rates or claims about arbitrary flows. All runs use
288 updates, zero physical diffusion, and identical prescribed velocities.

Rendered at 720px and 340px: the exact strips visibly survive at maximum stretch;
the returned grid has broad, faded patches. Stacked mobile comparisons remain
legible. The storage figure is functional, but its blue dots must be introduced
as storage locations, not measured arrows. Select B; its mechanism and its error
are both visible without asking a meter to carry the entire explanation.

## Opening alternatives

1. **Physical stirring:** “Reverse a stir and the dye should come home.” Rejected:
   this is false without very specific assumptions about the motion and diffusion.
   It also invites the coffee story back under a different noun.
2. **An Undo key:** “A computer can undo a brushstroke, but cannot undo this flow.”
   Rejected: restoring saved state and inverting a numerical update are different
   operations. The analogy would create a misconception immediately.
3. **A measured route:** move a patch along known paths, reverse those paths, then
   compare two calculations of the same trip. Selected: the reference answer is
   supplied by geometry; the discrepancy creates a question about representation
   and interpolation. State the prescribed current and absent molecular diffusion
   before interpreting the result. No suggestion that the left pane solves the
   full Navier–Stokes equations exactly.

## Completed passes — 22 September 2026

### Argument and pacing

IV is a complete ~3,400-word reading draft with 13 figure slots, including two
uses of the new return experiment. Its two problems are explicit: transport a
quantity when velocity is supplied, then calculate velocity when forces and a
volume constraint determine it. The first problem is resolved before the second
begins; the ending does not pretend the opening required the whole equation.

The construction story no longer shares the history article's opening object,
chronology, or discovery sequence. The repeated equation is necessary common
subject matter. Its role here is to specify a finite update and identify its
errors. Existing I–III and the history MDX files were not edited. Existing shared
figures were reused without changing their behaviour.

The pass retained the numerical middle, cut the additional molecule/creek/Reynolds
tour from this version, and moved the formal overlap definition out of the opening
to the refinement experiment. Prediction prompts now precede trying the finer
grid and overcorrecting pressure; the existing result is a reference for the guess.
The comparison between stability, conservation, and accuracy is the first act's
consolidation. The timestep then gathers the second act's operations into one
stored state.

### Reader pass: every rendered figure

These are editorial readings from two perspectives, not feedback attributed to
external readers. The full page was rendered in Chrome at 1280px and 390px;
every canvas was inspected visually at both widths.

| Figure | What am I looking at? | Why does it do that? | What would expose a wrong figure? |
| --- | --- | --- | --- |
| Return experiment | The same prescribed trip evaluated by exact paths and a dye grid | Repeated interpolation spreads colour; the inverse path does not invert those averages | Exact patches must regain their shapes; coarse dye must remain distributed after return. Both are visibly present, not only reported by bars |
| Stored cell | Dye samples on a 12² grid, with one selected cell and face locations | A fixed cell receives different fluid rather than moving with a parcel | Selection moves to clear/coloured cells and the concentration follows; the centre dot must remain visible inside full amber |
| Backtrace | Before/after concentrations with a selected arrival and its departure | A fractional departure mixes two neighbouring samples | Integer shifts copy one sample; fractional shifts expose the two weights and their weighted result |
| Transport errors | Two updates carrying the same block beside an exact reference | Centred forward-time transport amplifies errors; backtracing averages them | Violet crosses zero/one and grows; amber stays bounded but softens. Fixed plot bounds do not silently clip the stored values |
| Refined return | The same experiment repeated with more stored samples | Smaller cells resolve more of the stretched strips | 24²/48²/96² must change the returned pattern and overlap, at the same observation time. Returning to a resolution restores the same picture |
| Parcel acceleration | A moving parcel and a fixed probe in a steady narrowing current | The parcel reaches faster parts of an unchanging field | Amber speed and curve rise while the gray probe remains at 2.20 m/s |
| Diffusion | Initial and two-second velocity profiles on a common scale | Momentum is exchanged between layers, with stationary walls | Zero viscosity preserves the profile; strong viscosity broadens the jet and smooths stripes. This figure changes arrows, not a dye opacity |
| Cell flux | Four face flow rates for an already full cell | Net volume flow must vanish | Right outflow 1 balances 1.5 in against 1.5 out; the arrow and signed net readout change together |
| Pressure correction | Proposed velocities and a scaled pressure correction | A coupled pressure field changes shared face velocities | 100% nearly eliminates measured divergence; 150% reintroduces it. No substitution of the slider percentage for the measured field |
| Pressure sweeps | Corrections from progressively more iterations on the same proposal | Neighbour updates propagate through the pressure field | Violet diminishes across the field; the measured residual, including the slower broad error, decreases |
| Solver cycle | Input/output states from one actual timestep | Each button advances to the next operation on the stored fields | Push adds imbalance, viscosity loses energy, projection removes imbalance, and final dye transport changes colour without changing velocity |
| Omitted operations | Complete solver beside one omission at equal time | Each velocity operation contributes something the others do not replace | Removing pressure leaves violet; removing viscosity retains more energy; removing velocity transport alters the carried pattern while dye transport still runs |
| Live grid | A periodic velocity field transporting two passive dyes | The complete update repeats after external impulses | Dye injection changes colour without force; pushes change arrows; pause freezes motion, reset restores the initial state, and future viscosity changes appear after resuming |

### Accepted criticism and changes

- **The selected centre was invisible in full amber.** The centre marker now has a
  white fill and contrasting outline. It was found in the rendered figure, not by
  a passing concentration-array test.
- **The exact reference's thin strips showed raster jaggies.** Its display now
  samples the analytic paths on a 512² raster, independently of the numerical
  grid control. Cancelled inverse strokes are omitted from that evaluation to
  avoid unnecessary work. The grid calculation still runs every forward and
  reverse update; its measured loss is unchanged.
- **“Exact” might imply an exact fluid solver.** The opening names prescribed
  motion and absent molecular diffusion. The momentum problem begins separately.
- **Dye leaving the square could look like leakage.** Joined opposite edges are
  explained before the first figure, rather than introduced only near pressure.
- **The first read demanded a definition before it created interest.** The opening
  now describes overlap in plain terms; its calculation is given when refinement
  makes the measurement useful.
- **The conservation claim was too easy to generalise.** The text limits it to
  uniform row/column shifts on the periodic square. General semi-Lagrangian
  advection is explicitly not guaranteed conservative.
- **“Near roundoff” overstated the pressure result.** The measured residual ratio
  is 5.996×10⁻¹⁰, so the prose now says below one billionth, not machine precision.
  It also explains the stored pressure's Δt/ρ scaling and relative colour scale.
- **A direction-only browser check could miss the old slider failure.** Two
  continuous pointer drags now traverse 0→18→36→54→72→54→36→18→0 without release
  in the middle. Both work. Home, End, and ArrowRight also work.

### Suggestions declined

- **Replace the weak valve result with a more dramatic-looking animation:** no;
  the engineering claim still needs a better geometry and converged measurement.
- **Call the opening physical unmixing or demonstrate time reversal of full
  Navier–Stokes:** no; prescribed inverse shears establish neither claim.
- **Add a new figure for every operator or rebuild every old control:** no; the
  existing matched comparisons already answer the numerical questions. Their
  reuse makes this revision smaller and keeps the old readings stable.
- **Make viscosity redraw a paused live flow immediately:** no; changing a
  parameter should affect future evolution. The paused state stays intact.
- **Add a molecular prologue or a Reynolds detour:** not in this version. They
  would repeat the other readings before reaching the numerical question.

### Technical and interaction evidence

- `bun run check:construction-v4`: assertions grouped around inverse-map
  recovery, bounded concentrations, dye sums, refinement, rendered dye colours,
  control return trips, and text bounds. The renderer check samples the dye's
  own colours inside the two squares, excluding bars and labels.
- `bun run check:construction`: 142 existing solver-construction checks pass.
- `bun run check:publication`: reader/editor, IV exclusion, versions, RSS, and
  promotion checks pass. Browser reader mode shows **No such version** for IV;
  editor mode renders the complete article with 13 figures and no KaTeX errors.
- TypeScript and production build pass. Existing large-bundle and mixed
  static/dynamic-import warnings remain; they do not originate in this revision.
- All twelve range controls were exercised min→max→min→initial at both widths.
  The paused live viscosity control correctly leaves the current picture alone;
  the other experiment controls change their displayed states and return exactly.
- All diffusion profiles, timestep stages, omissions, refinement options, and
  velocity-difference toggle were exercised. Paused dye, button and pointer
  impulses, reset, play, and pause all pass. Browser error log is empty.
- Local evidence is under `_figure_check/construction-v4/`: numerical measurements,
  headless renders, browser screenshots of every figure and its controls, plus
  `browser/review.json` and `browser/interactions.json`. These generated files are
  ignored by Git; `check:construction-v4` regenerates the numerical evidence.

### Boundaries of completion

Built and checked locally, not committed or deployed by this task. I remains the
published default. The browser's 390px layout and mouse/keyboard tests are not a
physical-phone touch pass. Nick's reading is the remaining editorial decision
before choosing a default; the Tesla experiment and learned-solver dependency
repairs remain separate work with their existing owners.

The useful methodological result is specific: a small reference problem can
carry a stronger opening than an ambitious effect that barely registers. Its
accuracy test must target the quantity the story follows, and its answer may be
complete before the full physical model is introduced. Mark that change of
question explicitly instead of stretching the original mystery across the post.
