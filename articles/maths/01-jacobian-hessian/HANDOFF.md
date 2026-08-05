# HANDOFF — maths/01: Every Map Lies (the Jacobian and the Hessian)

Canonical per-article state. Updated 2026-07-31.

## Status: REBUILT around the v2 story, `draft`

Nick rejected the v1 "zoom → lattice" thesis ("not sure it's a great thesis, or
great presentation"). Ten candidate stories were branched and critiqued in
`STORY_CANDIDATES.md`; Nick approved the GEM — **#2, Every Map Lies** — and the
article was rebuilt around it the same day. DENSE_CORE and PLAN are v2; the v1
diagnosis (no wonder gap, stakes in §8 of 9, definition-as-story) is recorded at
the top of STORY_CANDIDATES.md.

- ~3,600 words, 11 figures, title **"Every Map Lies: the Jacobian and the
  Hessian"**.
- Act 1 (projections): `MapLies` hero (drag Greenland — true sphere rotation,
  measured receipts), `TissotLoupe` blob/matrix (geodesic circles sampled on
  the sphere, ground Jacobians), `TissotTrio`, `DetFold` (kept from v1 as the
  paper-fold interlude), `ProjectionDuel` (Mercator vs sinusoidal, measured
  roundness + receipt).
- Act 2 (terrain): `TerrainField` (hypsometric island, carries the improved
  ghost-arrow loupe from the post-feedback GradField), `CriticalZoom`
  (relabeled basin/summit/pass), `CurvatureMap` (new: levelness × curvature
  survey), `NewtonRace` (kept, fog framing).
- Kit: `carto.ts` (projections with exact inverses + ground Jacobians,
  geodesic circles, Rodrigues sphere rotation, spherical/planar shoelace),
  `terrain.ts` (hypsometric tints, contour dots), `geo.ts` (Natural Earth 110m
  coastline + Greenland, public domain, compacted 71 KB; regeneration script
  archived as `compact-geo-script.ts` beside this file).
- Benched from v1, files kept unregistered: `WarpLoupe`, `ZoomLine`,
  `WarpStamp`, `GradField` (superseded by `TerrainField`).

## Reader pass (2026-07-31, hidden-tab harness)

All 11 figures screenshotted, knobs driven, claims bound. Found and fixed:

1. **Blob mode ran on Mercator** — conformal, so every small circle lands as a
   circle and the "always an ellipse" emergence had no eccentric specimen.
   Moved to the naive grid (plate carrée); "potato" prose softened to the
   lopsided egg the figure actually shows.
2. **Hero numbers**: measured whole-outline receipt is ×15.0 vs pointwise
   sec²(72°) ≈ 10.5 — prose now teaches the gap (det is a pointwise rate;
   a coastline integrates it) instead of contradicting the meter.
3. **CurvatureMap washed the sheet violet** (two cuts): midland saddle
   curvature is as strong as the critical points', so eigen-magnitude cannot
   gate the glow. Rebuilt as levelness² × curvedness — the honest DEM-detector
   gate — which also surfaced the terrain's **twin pass**; it is now marked
   and the prose owns it.
4. Duplicate overlapping receipts on the un-dragged hero; "center −0°";
   ProjectionDuel roundness-1.00 prose claim vs measured 1.16 (finite circle);
   TerrainField default probe on a flat spot. All fixed.

Harness note, relearned the hard way: **never `scrollTo` in the hidden tab,
even once during setup** — it froze the compositor and produced convincing
stale screenshots that misdiagnosed a correct figure (the getImageData probe
settled it). The figure-audit skill already says this; it now has a second
scar to point at.

## What remains before `published`

- Nick's read: does the map story land where the zoom story didn't?
- Predict copy check; mobile/touch pass (drags: hero, Tissot ×2, trio, duel,
  terrain).
- Optional polish: hero could label Africa at ×1 for the fourteen-fold claim;
  sinusoidal pane's interrupted look at high |lon| is honest but worth a
  glance on a phone.
- The solver tie (det J = 1) is prose-only in the coda; a figure exists in
  benched `WarpLoupe mode="return"` if Nick wants it back.

## Known judgment calls (revisable)

- Terrain is an invented backcountry sheet (analytic landF), confessed in
  prose; a real DEM was rejected to keep exact derivatives.
- Mercator clipped at 82° with an in-figure confession line.
- Greenland drag capped at 70° center latitude so the outline stays printable.
- ZoomLine's 1-D recap is cut entirely — the blob→ellipse emergence carries
  the differentiability idea with stakes attached.
