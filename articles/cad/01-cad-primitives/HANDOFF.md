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

Figures, in article order: `OneObject` (hero — the pierced plate since
2026-08-18), `BasisLocality`, `KnotInsert`, `WeightPull`, `RefineLocal`,
`CageLimit` (keeps the cube deliberately: it is the extraordinary-vertex
specimen the plate is contrasted against), `BrepStack`.

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

1. **Reader-ToM review.** Nothing has simulated a felt reader through this yet
   (the 4-stage chain: journey → moves → slop → redraft). The main remaining
   gate before proposing `published`.
2. **Nick's read.** The hero swap and voice pass were decided and executed on
   his delegation ("answer it yourself") — he has not yet read the result. Both
   are revisable on his verdict.

## Resolved

- **Hook check → hero swap, 2026-08-18.** The cube hero died on two verified
  structural grounds (its topology layer was the trivial case of the article's
  own Euler meter; its surface layer was weakest on an all-extraordinary cage),
  plus the recorded familiarity rule. Replaced by the pierced plate
  (`plateCage()`, 32 vertices, all valence 4, genus 1): the one shape whose
  Catmull–Clark skin is bicubic B-spline everywhere, which turned the hero from
  the thesis's weakest specimen into its strongest. Decision record and
  candidate postmortems: `STORY_CANDIDATES.md`.
- **Voice pass (Stage 4), 2026-08-18.** Run AFTER the four voice docs were read
  in the AGENTS.md order, same session as the swap. What changed: the three
  equation-before-figure violations reordered (B-spline sum, rational division,
  CC vertex rule now each arrive as the formalization of a figure already
  touched); the reading-itinerary line cut; "this figure is honest about being"
  and "the article's own vocabulary" de-metaed (SLOP family 18); one decorative
  question declarativized; pane references made position-neutral so stacked
  mobile layouts don't contradict the prose; a coda added with a different
  shape from lesson 01's ending (sibling audit); references expanded to earned
  specific praise. The opening now plants "nothing rounded them" as a flat
  debt, paid in the SubD section by the all-regular clincher, which itself
  plants the Euler balance, cashed in the B-rep section — the ring closes.

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
