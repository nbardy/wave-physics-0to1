# HANDOFF — maths/01: The Jacobian and the Hessian

Canonical per-article state. Updated 2026-07-30.

## Status: BUILT end-to-end, `draft`

First article of the **maths track** (new; registry gained `track: 'waves' | 'maths'`,
Home renders one group per track with `M`-prefixed numbers). Commissioned by Nick
verbatim: the Jacobian and the Hessian are "the two things here I have never felt
like I understood."

- ~3,300 words, 9 figures (7 components; `WarpLoupe` serves 3 configurations:
  plant / arrows / return).
- Sims live in `src/sims/maths/` with shared kit `src/sims/maths/lib.ts` — all
  closed-form (maps carry exact Jacobians and exact inverses; landscape carries
  analytic gradient + Hessian). Nothing integrates a PDE; the only stepped thing
  is NewtonRace's walker clock (fixed-dt accumulator).
- Palette: `stamp/ex/ey/area/grad/hi/lo` added to `sims/lib/palette.ts`, role-rhyme
  with lessons 01–02 (amber watched thing, blue actor, violet derived meter).
- Article docs: `articles/maths/01-jacobian-hessian/{DENSE_CORE,PLAN}.md`.

## Reader pass (2026-07-30, hidden-tab harness per figure-audit skill)

All 9 figures screenshotted, three reader questions answered, knobs driven to both
ends. Findings found AND fixed in the same session:

1. **Isotropic pit** — original landscape (`VSCALE = 1`) gave λ₁ = λ₂ at pit/peak:
   circular contours, degenerate eigen-axes, and the "tilt comes from the mixed
   term" prose had no evidence. Fixed: `VSCALE = 0.45` → λ = (±2.0, ±0.9), true
   tilted ellipses, long axis along the gentler dashed eigenvector (comment in
   lib.ts warns against reintroducing).
2. **Missing crossing at the pass** — contour levels skipped the critical value,
   so the Predict's promised crossing lines didn't exist. Fixed: level `fc`
   included (at the pit it honestly marks the flat bottom as a dot blob).
3. **NewtonRace meter ordering** (figure-audit §2b) — at η = 0.14 the arrow-only
   walker's distance beat the lens walker's, arguing against the prose. Fixed:
   η defaults to 0.16 (just under GD's stability edge 2/κ) and meters report
   "at the bottom in N steps" once home.
4. DetFold's "0" tick was clipped; WarpStamp's far ghost was not "nearly square"
   and its receipt clipped at the pane edge. Both fixed.

Prose slop sweep same session: removed family-18 lines ("the debt the article
carries longest", "the article's one figure with sliders galore", "hinge of the
whole article"), one decorative question, "honest accounting".

## What remains before `published`

- Nick's read (voice + the two-objects-finally-understood test — the article
  exists for exactly that feeling).
- Mobile/touch pass (drags are pointer-based and `.sim-stir` blocks scroll-touch,
  but nobody has held it on a phone).
- Predict copy sanity-check with fresh eyes (both currently commit before reveal).
- Optional: verify WarpLoupe `arrows` presets identity/rotate on screen (shear and
  swirl were verified visually; identity/rotate are trivially J = I / rotation
  matrix by construction).

## Known judgment calls (revisable)

- Figure density ~1 per 350 words — below the corpus band, deliberate for a maths
  article (AGENTS "Scale and style": LaTeX carries more load here).
- The loupe re-inks the stamp at each zoom level (confessed in prose as "I reprint
  the stamp smaller as we zoom" — actually phrased as the loupe keeping it
  visible); alternative (true fixed stamp vanishing under zoom) rejected as
  unteachable.
- Track numbering on Home: waves keep `01…`, maths use `M1…`.
