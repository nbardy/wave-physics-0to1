# HANDOFF — cad/01: Basis, Cage, and Boundary

Canonical per-article state. Created 2026-08-16, when the `cad` field was opened.
Read `source/README.md` first: this article did not come through the five-stage
process, it came in as a finished external artifact and was ported.

## Provenance

The article is a port of `cad-primitives-explainer`, a standalone dependency-free
site (vanilla ES modules, raw WebGPU with a Canvas-2D fallback, six scenes)
delivered as a zip. The whole original project is preserved verbatim under
`source/` — including its own `QA.md`, whose recorded numbers the port is checked
against rather than checked against itself:

- one Catmull–Clark step on a closed cube → 26 vertices, 24 quads;
- four steps → 1,538 vertices, 1,536 quads;
- one knot insertion preserves the curve below `1e-11` (source measured ~6.75e-16;
  the port measures 3.5e-16).

The source deliberately excluded a "Gauged Fiber Volume" proposal that appeared
later in its originating thread. That exclusion is carried forward — nothing in
this article claims a novel primitive.

## What was ported, and how

Nothing of the original runtime survives. The renderer, scene graph, connector
UI, guided-tour dialog and CSS were all dropped; this repo has its own figure
contract. What was ported is the mathematics and the pedagogy:

| source | here |
| --- | --- |
| `src/math/bspline.js` | `src/sims/cad/spline.ts` — plus `Curve` as a sum type and `Refinement` replacing an `inserted: boolean` |
| `src/math/subdivision.js` | `src/sims/cad/mesh.ts` — plus the orthographic camera and `facing()` |
| `src/scenes/brep-scene.js` | `src/sims/cad/brep.ts` — plus `counts()` and the Euler–Poincaré balance, which the source did not compute |
| six WebGPU scenes | seven Canvas-2D `Stepper` figures in `src/sims/cad/` |
| `scripts/check.mjs` | `scripts/check-cad.ts` (`bun run check:cad`) — 65 assertions: math, pixels, and both layouts |

Figures, in article order: `OneObject` (hero), `BasisLocality`, `KnotInsert`,
`WeightPull`, `RefineLocal`, `CageLimit`, `BrepStack`.

## Where things stand

- **`draft` in the registry**, first lesson of the new `cad` field (prefix `C`).
- ~2,900 words, 7 figures, `bun run check:cad` green, `bun run typecheck` clean.
- Two things the port *added* that the source did not have, both because a claim
  needed a meter: the polynomial-cannot-be-a-circle argument is now cashed out in
  two lines of prose **and** measured live against the same three control points
  (rational 2.2e-16, polynomial 6.1e-2), and the B-rep panel computes
  V − E + F − R = 2(S − G) rather than asserting a hierarchy.
- The T-spline figure is a **support/refinement diagram**, not an evaluator. That
  limit is stated in prose, as the source insisted it be. Do not quietly upgrade
  the claim without building an actual analysis-suitable evaluator.

## Remaining work

1. **Voice pass (METHODOLOGY stages 4–5).** The prose is clear and the maths is
   honest, but it has not been through a slop scan or a rhythm pass, and it has
   not been read against `NICKS_VOICE.md`. This is the main thing standing
   between `draft` and `published`.
2. **Reader-ToM review.** Nothing has simulated a reader through this yet.
3. **Hook check.** IN PROGRESS 2026-08-17 — a hero-candidate pass is running
   against the suspicion that the cube hero is an anti-hook (a subdividing cube
   may be the most familiar image in computer graphics; Nick's rule is that
   "everyone has seen X" kills a candidate). Output lands in
   `STORY_CANDIDATES.md` beside this file and ends at a checkpoint — **a hero
   swap is Nick's call, not the agent's.** Do the voice pass AFTER this
   resolves; a swap would rewrite the opening the prose is built around.

## Done since the port

- **Mobile pass, 2026-08-17.** The site has no width media queries at all — the
  responsive strategy is a fluid column and `width: 100%` canvases — so the
  breakpoint had to live in the figures. `src/sims/cad/layout.ts` holds it
  (`STACK_BELOW = 520` px of *canvas* width, measured off the canvas by
  `ResizeObserver` rather than derived from `window.innerWidth`, which would put
  a copy of the column's padding arithmetic in TypeScript). The three two-pane
  figures now stack below it and take a taller `<Sim height>`; state survives the
  remount because every CAD figure keeps its state in a ref outside the stepper.
  Verified, not assumed: `check:cad` re-renders all three at 340 px (the canvas
  width a 390 px phone leaves) and asserts the same inks. 65 assertions green.
  The T-mesh comparison reads *better* stacked — the two support footprints line
  up vertically.

  **Known limitation, pre-existing and repo-wide:** `<Sim>` recomputes its canvas
  backing store only on `[resetKey, height]`, so a width-only resize leaves every
  figure in every lesson stretched until something remounts it. Crossing this
  breakpoint happens to remount and self-correct; resizing within a band does
  not. Fixing it means adding a `ResizeObserver` to `src/components/Sim.tsx`,
  which is shared by all seven lessons — deliberately not done here while the
  p-bit session is live in the same tree.

## Field notes worth keeping

- `facing()` in `mesh.ts` exists because the back-face sign was wrong in two
  figures at once and the symptom looked like a lighting bug, not a normals bug.
  One function, one derivation, one comment.
- The basis figure originally used 7 control points. At degree 3 that makes the
  middle basis function's support the *entire* domain — the locality the figure
  exists to demonstrate was true and invisible. It uses 10 now.
- Canvas text must use an ASCII hyphen, not U+2212: the headless checker's font
  has no glyph for the true minus and paints tofu boxes.
