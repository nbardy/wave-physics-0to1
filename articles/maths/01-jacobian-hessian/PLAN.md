# PLAN — maths/01: Every Map Lies (the Jacobian and the Hessian)

v2, 2026-07-31, built on DENSE_CORE v2 (which wins conflicts). Section ladder =
failure chain; figure counts are feasibility estimates, never quotas.

## Palette contract

Unchanged keys from v1 where the quantity survives; the probe circle inherits
amber (it replaces the stamp as "the thing we watch").

| key    | hex      | quantity |
|--------|----------|----------|
| stamp  | #d97706  | the probe circle / dragged Greenland — the amber thing we watch |
| ex     | #2563eb  | the east ground arrow and its landing (J column 1) |
| ey     | #059669  | the north ground arrow and its landing (J column 2) |
| area   | #7c3aed  | area receipts, det, eigen/curvature readouts |
| grad   | #db2777  | gradient arrows on terrain |
| hi     | #dc2626  | above-the-critical-level wash (CriticalZoom), dome class |
| lo     | #0891b2  | below-level wash, bowl class |

Terrain canvases use hypsometric tints (sea blue → lowland green → upland brown
→ summit pale) — those are the *specimen's* real colors, like the coastline is a
real coastline; palette keys bind the *quantities* drawn on top.

## Section ladder (failure → savior)

1. **(cold open + hero `MapLies`)** — Greenland vs Africa on the wall map; drag
   Greenland to the equator and watch it deflate; violet receipt counts down.
   Flat declaratives: the lie is mandatory (a sphere and a plane disagree about
   distance — Gauss proved there is no fix), so every map chooses a lie. IOU:
   the receipt's machinery. Palette amnesty.
2. **The Circle That Confesses (`TissotLoupe` blob mode)** — probe circle drawn
   on the ground, seen through the projection. Big circle: a bent blob — no
   single description. Shrink it: a perfect ellipse emerges, every time,
   anywhere. The lie is local and linear; the ellipse is the whole local truth.
   (v1's zoom-emergence, with stakes.) Savior hook: an ellipse is four numbers —
   which four?
3. **The Landing Report (`TissotLoupe` matrix mode)** — east and north ground
   arrows (the cos φ fact earned here), their landings as colored columns, J
   named, F(p+h) ≈ F(p)+J·h. Tissot's name and 1859 as etymology-reward.
   Boundary check: equator of the plate carrée (J = I, circle lands as circle).
4. **The Area Receipt (`TissotTrio`, then `DetFold`)** — three same-size ground
   circles at three latitudes on Mercator: receipts ×1.0 / ×2.0 / ×5-ish in one
   frame; sec²φ; Greenland's number pays the hero's debt. Change of variables in
   one line (r dr dθ). Then the paper-fold interlude: **Predict** (meter stops
   at zero vs crosses) → `DetFold` → needle, mirror, undoable-only-where-det≠0.
5. **Choose Your Lie (`ProjectionDuel`)** — same probe on Mercator and on an
   equal-area map side by side: circular-but-inflated vs area-true-but-sheared.
   Shape × size; conformal vs equal-area; you cannot have both (insight 1
   cashed). **Waypoint 1.**
6. **The Other Map in the Atlas (`TerrainField`)** — the island (invented,
   confessed); contours; gradient arrows ⊥ contours; the arrow loupe: stepping
   east/north moves the arrowhead — four numbers, symmetric — H = J of ∇f.
7. **Summit, Basin, Pass (`CriticalZoom`)** — **Predict** (pass contours: rings
   vs crossing) → zoom the col; eigen axes as principal curvature directions;
   second-derivative test as sign reading; det H < 0 ⇔ pass. The determinant's
   second job.
8. **The Automatic Surveyor (`CurvatureMap`)** — classify every island point by
   eigen-signs (dome red / bowl cyan / saddle violet); peaks, basins, and cols
   light up unattended; SIFT/DEM dessert numbers.
9. **Downhill in Fog (`NewtonRace`)** — descending the terrain blind; arrow-only
   zig-zag vs H⁻¹ lens; boldness edge reachable. **Waypoint 2.**
10. **Coda (hero returns)** — `MapLies` with Tissot ellipses inked on it and the
    receipt formula; one paragraph tying det J = 1 to the site's fluid solver.
11. **Further Reading + Final Words.**

## Figure list

| # | component | knob(s) | reuse |
|---|-----------|---------|-------|
| 1 | `MapLies mode="plant"` | drag Greenland | NEW (geo asset + sphere rotation) |
| 2 | `TissotLoupe mode="blob"` | circle-size slider + draggable center | NEW, reuses lib view/matrix kit |
| 3 | `TissotLoupe mode="matrix"` | projection select + probe | same component |
| 4 | `TissotTrio` | none (one-frame contrast) | pattern from WarpStamp |
| 5 | `DetFold` | fold slider | v1 as-is, prose reframed (paper map) |
| 6 | `ProjectionDuel` | shared probe drag | NEW, assembled from lib |
| 7 | `TerrainField` | draggable probe | GradField reskin (hypsometric) |
| 8 | `CriticalZoom` | point select + zoom | v1 as-is (terrain framing) |
| 9 | `CurvatureMap` | classification opacity slider | NEW, cheap (per-pixel eigsign) |
| 10 | `NewtonRace` | narrowness + boldness | v1 as-is (fog framing) |
| 11 | `MapLies mode="return"` | drag + Tissot overlay | hero + overlay |

Benched from v1: `WarpLoupe` (all three modes — swirl specimen retired; its
loupe/matrix mechanics live on inside TissotLoupe), `ZoomLine` (1-D recap cut:
stakes-first structure; the blob→ellipse emergence carries the zoom idea),
`WarpStamp` (superseded by TissotTrio). Files stay on disk, unregistered.

## Geometry honesty rules

- Projections are closed-form charts (λ, φ) → (x, y) with **ground Jacobians**:
  J_chart · diag(1/cos φ, 1), so columns are per-unit-*ground*-distance — the
  only honest comparison, and the cos φ fact is taught, not hidden.
- Tissot blobs are **geodesic circles sampled on the sphere and pushed through
  the projection point by point** — never an ellipse drawn from J. The ellipse
  emerges as the circle shrinks; at large radius the blob's bentness is real.
- Area receipts are shoelace measurements of the drawn polygon over the true
  spherical cap area — measured from pixels' worth of samples, not printed from
  the formula.
- Greenland's drag is a true rigid rotation of the sphere (axis = c × t),
  reprojected — the same algorithm as thetruesize.com.
- The island terrain is invented and confessed; its gradient/Hessian are
  analytic (v1's landscape, re-dressed). No numerical differentiation anywhere.
- Coastline: Natural Earth 110m (public domain), decimated and coordinate-
  rounded; provenance comment in geo.ts.

## Ledger

- Hero plants the receipt number → paid §4 (sec²φ at Greenland's latitude).
- §2 plants "which four numbers" → paid §3 (columns).
- §4's det-catches-folds → echoed §7 (det catches cols) — planned rhyme, one
  sentence each, not a refrain.
- §6 plants symmetry → paid §7 (perpendicular principal axes).
- Hero returns §10 wearing the instrument; solver tie closes the site loop.
