# PLAN — Teaching a Solver to Guess (waves 04)

**2026-08-25 expansion:** Nick's verdict on the first build was that it under-served
the storyboard's map — the zip proposed the whole timestep, seam by seam, and v1
built one seam. v2 adds the map act and a SECOND trained experiment (the advection
seam), and the article's spine sharpened into *a tour of checks in descending
strength*: sufficient (residual) → necessary-only (conservation) → none (closure,
surrogate). Sections below updated to match.

Read `DENSE_CORE.md` first; it wins conflicts. Source storyboard preserved
verbatim under `source/`.

## Placement

`field: waves`, `order: 4`. The banked 3-D drag/turbulence concept
(`articles/04-drag-and-turbulence/`) is not in the registry and is week-scale
away; a visible gap in printed lesson numbers is worse than a renumber later.
**Revisable** — if drag ships first, this becomes 05 and only `registry.ts`
changes.

## Palette

No new inks. The lesson-01 contract carries the whole article, which is the
point — the reader already knows what these colors mean, and "who computed it"
is answered by line style, never by hue (storyboard's rule, adopted):

| ink | role here |
|---|---|
| `div` violet | the divergence `b`, every residual, every meter |
| `pHi` / `pLo` red-cyan | pressure, in both panes, cold and warm alike |
| `vel` blue | velocity, and the classical solver's line |
| `visc` green | the accepted result — a gate that opened |
| `dye` amber | the network's proposal, and only ever the proposal |
| `wall` gray | obstacles, and the reference ghost |

Line style carries provenance: **solid** = classical operation, **dashed** =
learned proposal. Amber appears in exactly one role in this lesson and it is not
"a thing we watch" — it is "the thing the network said". That is a deliberate
break from the series' amber convention, declared in prose at first use.

## Figures

Ten components, thirteen slots (`WarmStartRace` twice — hero, then knobs exposed;
`OneStepDrift` twice — the failure alone, then both losses). Every one is live;
nothing here is a diagram of a pipeline. The planned coda re-run of the hero was
dropped as redundant once the sabotage figure turned out to end the pressure act.

| # | component | what it must show in one frame |
|---|---|---|
| 1 | `WarmStartRace` (hero) | cold pressure crawling out of nothing beside warm pressure already formed; two sweep counters; one shared gate |
| 2 | `SolveDebt` | live wake + rolling plot: sweeps the projection *would* need vs. the 40 it is *given*. The gap is the iterative error, and it is never zero |
| 3 | `SlowModes` | one smooth error mode and one rough one, swept side by side; rough dies in ~5 sweeps, smooth is still there at 500 |
| 4 | `ProposalAnatomy` | `b` → 12×8 restriction → network → prolonged `p₀` → true `p*`, with BOTH meters printed: field error 0.11, residual 2.27 |
| 5 | `WarmStartRace` (full) | case selector across held-out and out-of-distribution fields; the speedup shrinking as the case gets stranger |
| 6 | `FourWays` | GS-cold, GS-warm, CG-cold, CG-warm to one gate, four live counters. Cold CG must be seen finishing before warm GS |
| 7 | `ImpulseResponse` | the network's response to a single-cell spike beside the true Green's function. They do not match, and the prose says why |
| 8 | `UngatedRollout` | two live flows from the same net: proposal accepted directly vs. proposal used as a warm start. Divergence meter on both |
| 9 | `SabotageGate` | noise slider on the weights: field error ↑, sweeps ↑, accepted answer flat to tolerance |
| 10 | `SmearRace` | fine vs coarse semi-Lagrangian, same swirl and seed; resolution knob 2×/4×/8×; the error meter is the discretization row live |
| 11 | `OneStepDrift` (failure) | the one-step-trained flux correction detonating beside the ghost, training loss ~10⁻⁶ notwithstanding |
| 12 | `OneStepDrift` (both) | same architecture and data, two losses: one lane wreckage, one tracking the ghost |
| 13 | `FluxRollout` | plain / corrected / ghost over a self-steered rollout; case knob reaches out-of-distribution; strength knob past 100% shows negative dye with a zero mass ledger |


Knob obligations (AGENTS.md): every slider moves a quantity the prose claim
depends on, across its whole range. The sabotage slider must reach a noise level
where the warm start is *worse than cold* — an accelerator that has become a
decelerator, with the answer still correct. If it cannot reach that, the figure
is furniture.

## Sections

1. **A network is running below this paragraph** — hero, and the contract it is
   under. (fig 1)
2. **The seam** — where a timestep spends its life; why the projection is the
   only stage with a checkable answer. (fig 2)
3. **Why sweeping is slow** — the spectral asymmetry, measured. (fig 3)
4. **So learn the smooth half** — architecture as a frequency statement; 809
   parameters; the two symmetries built in rather than learned. (fig 4)
5. **Where the data came from** — `solver.div`, conjugate-gradient targets, and
   why the loss is on the field and not on the residual.
6. **The race** — held-out and out-of-distribution. (fig 5)
7. **Name the baseline** — `<Predict>` first, then the four-way. (fig 6)
8. **What it actually learned** — impulse response vs. Green's function. (fig 7)
9. **The gate is the whole architecture** — ungated rollout, then sabotage.
   (figs 8, 9)
10. **The map of the machine** — every seam of the timestep, its learnable piece,
    its error row, and its check; the check-strength ladder that organizes the
    rest of the article.
11. **What averaging steals** — the discretization error live. (fig 10)
12. **A correction that cannot cheat** — flux-form architecture (conservation by
    construction), one-step training, and its measured detonation. (fig 11)
13. **The solver in the loss** — solver-in-the-loop repair via the exact SL
    adjoint; two-loss comparison; rollout, OOD, and the overdrive knob that shows
    a necessary check passing while the flow is wrong. (figs 12, 13)
14. **The rungs below** — closure, surrogate, controller; the cross-field table.
15. **Final words** — two networks, the old parts carrying the safety, the three
    questions for the next headline.

## Checks

`scripts/check-learned.ts`, run by `bun run check:learned`. Beyond pixels: every
number the prose quotes must be recomputed from the shipped weights and asserted
against the manifest, so a retrain that changes the story fails the build rather
than quietly making the prose false.

## Standing deviations from the storyboard

- No persistent equation dock (see DENSE_CORE §Standing risk).
- No static diagram figures. The four supplied PNGs are design sources, not page
  assets; the cross-field panel becomes an MDX table because it is a table.
- ~~Learned advection out of scope~~ — reversed in v2: the advection seam is the
  second trained experiment (storyboard §4 + §9, fused: the correction is real AND
  its one-step-trained variant supplies the "physics-informed ≠ verified" failure).
- Learned closure and the whole-solver surrogate remain prose; the surrogate still
  appears only via the ungated pressure pane.
