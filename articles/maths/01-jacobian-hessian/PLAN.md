# PLAN — maths/01: The Jacobian and the Hessian

Companion to DENSE_CORE.md (which wins conflicts). Skeleton = failure chain; every
section ends on a manufactured problem. Figure counts are feasibility estimates,
never quotas (AGENTS.md "Scale and style").

## Palette contract (fixed at first appearance)

Role-rhyme with lessons 01–02: amber is still "the thing we watch," blue "the thing
that acts," violet "the derived meter," red/cyan "high/low."

| key    | hex      | quantity |
|--------|----------|----------|
| stamp  | #d97706  | the stamp — the amber square we watch, and its image |
| ex     | #2563eb  | the east unit arrow ê₁ and its landing (J's first column) |
| ey     | #059669  | the north unit arrow ê₂ and its landing (J's second column) |
| area   | #7c3aed  | the determinant / area receipt / eigen readouts (derived meters) |
| grad   | #db2777  | the gradient arrow(s) on the landscape |
| hi     | #dc2626  | high ground on the landscape |
| lo     | #0891b2  | low ground on the landscape |

## Section ladder (failure → savior)

1. **(cold open + hero)** — the swirl warp with the loupe. Failure planted: the grid
   is mangled beyond description in the large; under the loupe, at every point, a
   clean parallelogram lattice. IOU: four numbers per point, two of them hiding a
   second object. Palette amnesty sentence.
2. **One Number Was Enough** — 1-D zoom recap: curve → line, slope = the one number,
   f(a+h) ≈ f(a) + f′(a)h. *Failure out:* our functions now move points in the
   plane; where a line through a point needed one number, the flattened thing we
   just saw in the hero needs four. One number has no chance.
3. **Maps, Not Graphs** — representation section. How to see ℝ² → ℝ²: no graph fits
   in the world (4-D); instead, before/after — the warp of a grid, plus the stamp.
   Naive attempt made honest: a single "stretch meter" on the stamp. *Visible
   failure:* the same map stretches the stamp east–west at one probe point,
   squashes it north–south at another, shears it at a third; the one-number meter
   reads the same "1.0×" area while the shapes differ wildly. Savior: stop asking
   for a number; ask where *arrows* land.
4. **The Landing Report** — the loupe again, now with the two unit arrows riding the
   stamp. Where does <ex>east</ex> land, where does <ey>north</ey> land: two arrows,
   four numbers, filed as columns → the Jacobian. Entries revealed as the partials
   (the box was a filing system all along). Linear impostor formula + boundary
   checks (identity, pure rotation). Preset knob: identity / rotate / shear / swirl.
5. **The Area Receipt** — det J as the stamp's area ratio, sign as the flip. Playable
   failure: a fold slider drives det through zero — the stamp thins to a needle,
   then comes out mirrored; the meter crosses zero and goes negative. Cash out
   |det J| in change of variables on polar in one line (the r in r dr dθ).
   **Waypoint** (end of Act 1). *Predict before the fold reveal:* when the map
   folds, does the area meter stop at zero or go through it?
6. **A Field of Arrows** — new object: a landscape f (color map, hi/lo), its
   gradient as an arrow field. The hinge, stated flat: point ↦ arrow is itself a
   map ℝ² → ℝ², so it has a Jacobian. That Jacobian has its own name: the Hessian.
   Loupe on the *arrow field*: step east, watch the arrow change; step north, watch
   it change; four numbers again — and this time the box is symmetric (mixed
   partials agree; one honest sentence, no proof).
7. **The Shape Left Behind** — at summits, pits, and passes the arrows die; the
   linear impostor is blank there (∇f = 0 says "flat"), so zoom again: the contours
   become perfect ellipses (bowl) or crossing hyperbolas (saddle) — the quadratic
   impostor ½hᵀHh. Eigenvectors = the quadric's axes, eigenvalues = curvatures
   along them; second-derivative test = reading signs; det H < 0 ⇔ saddle (the
   area receipt returns: the "area" of a saddle's curvature pair is negative).
   *Predict before the pass:* nested rings, or crossing lines?
8. **Stepping Downhill** — finale, sliders galore. An anisotropic tilted valley;
   gradient descent zig-zags (it only knows the arrow); the Newton step multiplies
   by H⁻¹ and walks straight to the bottom: the Hessian as the lens that
   un-stretches the valley. Knobs: anisotropy, rotation, step size.
9. **The Flow Map (coda)** — hero returns wearing its matrix and det meter; the
   swirl confessed as a fluid flow map; lesson 01 tie: incompressible = det J = 1
   forever. **Waypoint** (end of Act 2) folded in just before Final Words.
10. **Further Reading + Final Words.**

## Figure list (component · knob · cheapest honest rendering)

| # | component | section | the one idea | knob |
|---|-----------|---------|--------------|------|
| 1 | `WarpLoupe mode="plant"` | 1 | mangled grid → parallelogram lattice under zoom | zoom slider + draggable probe |
| 2 | `ZoomLine` | 2 | curve flattens to its tangent line; slope readout | zoom slider + draggable point |
| 3 | `WarpStamp stage="meter"` | 3 | one-number meter fails: same area, wildly different shapes at 3 probe points | draggable stamp |
| 4 | `WarpLoupe mode="arrows"` | 4 | ê₁/ê₂ landings, live matrix as colored columns | preset select (identity/rotate/shear/swirl) + probe |
| 5 | `DetFold` | 5 | stamp area receipt; fold drives det through 0, mirror beyond | fold slider |
| 6 | `GradField` | 6 | landscape + gradient arrows; loupe on the arrow field shows the four rates | draggable probe |
| 7 | `CriticalZoom` | 7 | contours at pit/summit/pass become quadrics; eigen axes + curvature readouts | critical-point selector + zoom |
| 8 | `NewtonRace` | 8 | zig-zag vs straight; H⁻¹ un-stretches | anisotropy, rotation, step size (finale, flagged) |
| 9 | `WarpLoupe mode="return"` | 9 | hero + matrix + det meter + flow-map confession | same as 1 |

Reuse-with-overlay: 1, 4, 9 are one component in three overlay configurations;
3 and 5 share the warp/stamp lib. Density lands near ~1 figure / 350 words — below
the corpus band, deliberately: this is a maths article, prose+LaTeX carry more of
the load (AGENTS.md: an article type that begs more LaTeX is welcome to it).

## Solver honesty

Nothing here integrates a PDE. The warp is closed-form (swirl: rotation by angle
θ(r) with smooth falloff), gradients and Hessians are analytic, contours are
marching-dot iso-lines (PressureLandscape's technique). NewtonRace steps its two
walkers with a fixed dt accumulator (AGENTS.md rule) even though each step is
algebraic, so RAF cadence never changes the race. Stated in-post where the race
runs.

## Ledger

- Plant (hero): four numbers per point; "two of them are hiding a second object"
  → paid in §5 (det = the two-numbers-in-one: area+flip) and §7 (det H calls the
  saddle).
- Plant (§3): the stamp's dot (orientation) → paid at the mirror flip in §5.
- Plant (§6): symmetry of H → paid in §7 (symmetric ⇒ real eigenvalues,
  perpendicular axes — one sentence, honest).
- Hero returns understood in §9; flow-map confession pays the "why a swirl, of all
  maps" oddity.
