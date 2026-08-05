# HANDOFF — maths/01: The Jacobian and the Hessian

Canonical per-article state. Updated 2026-07-31 (thread closing). This file is
the guide for the NEXT VERSION; read it with DENSE_CORE.md (v1, restored) and
the postmortem at the bottom of STORY_CANDIDATES.md before touching prose.

## Where things stand right now

- **Live article = v1 (zoom-lattice) at its best state**, restored from
  `3a38766` and deployed (`e230b2b` on main; gh-pages current). It carries ALL
  fixes: the 2026-07-30 reader-pass repairs (anisotropic landscape → real
  eigen-axes/tilt, crossing contour at the pass, Newton meter ordering,
  DetFold/WarpStamp label fixes) plus the concurrent session's upgrades
  (GradField loupe with H-columns as visible motions + measured
  centered-difference meters, loupe grid alignment, voice pass, `animated`
  Sim prop). Status `draft`.
- **The map rewrite ("Every Map Lies") is retired.** Built end-to-end, then
  killed by Nick on sight: "everyone has done a scaling map visual… more about
  flattening spheres than jacobians and hessians." Its prose lives at
  `f51c552`; its sims stay on disk unregistered (`carto.ts`, `geo.ts`,
  `MapLies/TissotLoupe/TissotTrio/ProjectionDuel/CurvatureMap/TerrainField`,
  `terrain.ts`); salvage inventory in `articles/CONCEPT_BANK.md`. Do not
  resurrect it as this article's spine.
- Benched v1-era files also on disk: nothing — v1's sims ARE the registered
  set (WarpLoupe, ZoomLine, WarpStamp, DetFold, GradField, CriticalZoom,
  NewtonRace).

## The brief for the next version (direction agreed 2026-07-31)

Nick's standing complaint about v1: thesis/presentation not strong — the
article reads as a definition unfolded; the swirl is anonymous; the matrices
do nothing until §8. The scope is **refine, not replace**: keep the figure
set and the math budget; swap the narrative engine.

**Chosen direction — "Newton's One Idea" spine with the site-native opening:**

1. **Hook (fluid freight)**: open by confessing the swirl immediately as
   lesson 01's fluid mid-stir. Plant two claims on page one: the solver drags
   four numbers along every particle path, and one ancient algorithm — guess,
   linearize, invert, repeat — needs exactly those four numbers to do
   anything. The article assembles that machine.
2. **Act 1 = grinding the lens**: ZoomLine and the loupe sections become
   "building the linearizer" (zoom is an act with a purpose, not a
   definition). Landing report as before. **DetFold becomes the place Newton
   dies** — det J = 0 is where "invert" fails; the needle moment carries the
   algorithm's life-or-death stakes, not a curiosity.
3. **Hinge**: descending a landscape IS solving ∇f = 0 — so H = J of ∇f
   arrives as the plot twist the structure was waiting for, not a remark.
4. **Act 2 unchanged in figures** (GradField, CriticalZoom, NewtonRace), with
   NewtonRace as the machine finally switched on. Flow-map coda survives.
5. **One possible new figure**: a small root-hunt / blind-descent pane in the
   opening so the tension exists before the first zoom (or a NewtonRace
   pre-echo). Everything else is re-hinging prose — roughly a quarter of the
   words move.

**Process rule (non-negotiable, from the postmortem): the hook paragraphs +
re-hinged section ladder go to Nick for a considered read BEFORE any build.**
A "sounds good" buried in a longer exchange does not count; label the
checkpoint "this re-hinges the article — confirm." Memory file
`novel-hero-over-familiar` carries the same rule.

## Taste constraints learned the hard way (apply to all future story work)

- Familiarity of a hero is a COST, not a wonder-gap asset — "everyone has
  seen X" kills a candidate on this site.
- The specimen serves the operator: if most words go to the specimen's own
  physics, it's a host, not a lens.
- Scope fixes to the complaint: thesis doubts license opening/pacing work,
  not spine transplants.

## Verification tooling (for the next reader pass)

- Hidden-tab harness recipe: figure-audit skill. Hard-won addendum from this
  thread: **never call `scrollTo` in the hidden tab, even once during harness
  install** — it froze the compositor and produced convincing stale
  screenshots that misdiagnosed a healthy figure; a `getImageData` probe
  settled it. Pin figures `position:fixed; top:0` instead; reset and pump in
  SEPARATE evals (React commits land between evals, not within one).
- `bun run typecheck` currently fails only in the concurrent session's
  `src/sims/pbits/denoise.ts` (Int8Array/SharedArrayBuffer nit) — not this
  article's problem, but don't let it mask new errors: filter with
  `| rg -v pbits`.
- Deploy: `bun run deploy` (local build → gh-pages, no Actions). Deliberate
  act — do not automate on commit.

## Pre-publish gates (unchanged, still open)

1. Nick's read of the refined version — the commission is that HE finally
   feels the two objects; nothing else closes it.
2. Mobile/touch pass (all drag figures).
3. Second slop scan + sibling audit (lessons 01–03 open side by side).
4. Predict copy check; fact-check any historical claims that survive.
5. Then propose the `published` flip — never flip it unprompted.
