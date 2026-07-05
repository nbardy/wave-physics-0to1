# HANDOFF — Lesson 03: The History of Navier–Stokes

**State: Stages 1–2 complete (research + plan, `planned`; only a stub MDX exists).
Mission of this thread: write DENSE_CORE.md, then execute Stage 3 (build) → Stage 4
(prose) → Stage 5 (polish).** This is the partner to lesson 01: the same equation,
the same cylinder, the same palette — built again in the order history built it,
with names and birthdays attached. The heavy lifting is still ahead; it is also the
cheapest big article in the repo because roughly half its figures reuse lesson 01's
already-built (and GPU-accelerated) sim family.

## Read first, in this order

1. `AGENTS.md` — repo rules, sim honesty rules, and **"Scale and style: heuristics,
   not rules"** (the plan's ~72 figures / ~10,500 words are feasibility estimates;
   the article's real length matches the length of the story — and this story is
   long because it's good, not because a number says so).
2. `ESSENCE_OF_VOICE_AND_DESIGN.md` and `METHODOLOGY.md`.
3. `articles/03-navier-stokes-history/RESEARCH.md` — the verified content base.
   §1–11 = chronology (who built what, when); §12 = where the mathematical
   sub-blocks came from; §13 = the who-met-whom network; §14 = the gaps ledger;
   §15 = collected story assets; §16 = sources. Dates here were verified against
   the historical literature (Darrigol, Eckert, Anderson, Bistafa) — treat them as
   load-bearing; re-verify anything you add.
4. `articles/03-navier-stokes-history/PLAN.md` — Stage 1–2: concept, 13-section
   skeleton with per-section figure sketches, the Stage-2 addendum threading the
   lineage/network/gaps layers into sections, palette contract, production notes,
   per-lesson deviations.
5. `articles/01-navier-stokes/PLAN.md` + the built lesson
   (`src/lessons/lesson-01-navier-stokes.mdx`) — this article mirrors lesson 01
   deliberately; know what it's mirroring.

## The design in one paragraph

Protagonist: the equation itself, staged on lesson 01's gray cylinder; the scene
never changes, the *theory rendering it* does (corpuscle hail → ideal flow with a
drag meter stuck at 0.000 → viscous flow → boundary layer → live solver). Hero
figure: "two centuries in one slider" — a year scrubber that swaps the physics while
the equation accumulates terms underneath, each stamped with a name and year in its
lesson-01 color (Navier's nameplate is green *because* viscosity has been green
since lesson 01 §6). History supplies the failure chain: d'Alembert's zero (§5)
stands on screen, dated, until Prandtl pays it (§10). Four per-lesson deviations are
declared in the PLAN (past tense licensed for narrative; ≤6 confessed archival
images; names aren't jargon; math is re-encountered, not re-earned).

## What is left (in order)

1. **Write `DENSE_CORE.md` first** (house convention: thesis, hook, payoff, ranked
   insights — it wins conflicts with later drafts). Distill from RESEARCH §15's
   story assets + the plan's Stage 1. Candidate thesis: *the pedagogical order of
   lesson 01 and the historical order are nearly the same walk, because both
   advanced by watching the current theory fail visibly.* Rank the ironies (five
   discoveries / two strangers in the name; right term from fictional molecules;
   152-year paradox killed in ten minutes; the equation older than its own
   notation).
2. **Stage 3 — build, in the PLAN's order** (see PLAN "Production notes"):
   - Shared chrome first: **nameplate/term-stack component** + timeline-scrubber
     wrapper (used by hero and §6–§8).
   - **The honest drag meter is the critical path** — it gates both Predict
     moments. §5's 0.000 must be genuine: use the analytic potential-flow solution
     for the ideal case (exact, cheap) rather than asking the numerical solver to
     cancel to zero; confess the swap if both ever share a figure.
   - New Canvas sims (~12, all small): statics toys (crown, barometer, Pascal's
     mountain), corpuscle hail, sound-race tube, molecular springs, stress cube,
     falling sphere (Stokes drag), Poiseuille pipe (r⁴ readout), **Reynolds tube**
     (transition must be genuinely disturbance-sensitive — seeded noise, auto-reseed
     guard rail, not scripted), boundary-layer loupe, whorls cascade.
   - Reuse from lesson 01: field kit, two-plate shear, dye advection, pressure
     landscape, `CylinderFlow`/solver family.
   - **Archival assets** (≤6): Leonardo water study, Bernoulli title pages, Pont
     des Invalides etching, Reynolds 1883 plate, forecast-factory illustration —
     **verify rights** (public domain likely for most; fall back to a drawn homage,
     confessed, if not).
   - All sims obey AGENTS.md honesty rules (fixed timestep, stability comment,
     `create` fresh, `draw` pure).
3. **Stage 3/4 — prose**, blocked per section as figures land (setup → figure →
   readout), then the voice pass. Extra audit for this lesson: **tense** — past for
   people, present for water, never blended in one sentence carelessly.
4. **Stage 5** — the standard audits (rhythm as smell test, palette, ledger,
   anti-checklist) plus this lesson's own:
   - the §5 paradox ledger is *visibly* paid in §10 (the meter moves);
   - every nameplate filled by §12 except the deliberately blank end of the
     timeline;
   - **no inline citations in prose** — this is the highest-risk anti-checklist item
     for a history article; sources live only in Further Reading;
   - the anecdotes (bridge collapse, the Bernoulli theft) stay subordinated to the
     physics thread — if a section reads as trivia-listicle, cut or re-anchor it to
     the cylinder.
5. Registry: flip `planned` → `draft` once real sections ship; keep
   `bun run typecheck && bun run build` green throughout; update AGENTS.md
   "where things stand" and the README table as status changes.

## Known risks (watch these specifically)

- **Text-heavy drift**: history invites prose droughts. The persistent cylinder is
  the guard — if three paragraphs pass without the reader's hands doing something,
  the section needs a figure or a cut.
- **Scripted-feeling physics**: the two marquee readings (0.000 in §5, first
  nonzero drag in §10) carry the whole article's honesty. If they're faked, the
  lesson is hollow.
- **Date drift**: don't introduce new historical claims from memory; RESEARCH.md's
  claims were verified — new ones need the same treatment (WebSearch against the
  sources in RESEARCH §16).
- Mobile: the timeline scrubber needs coarse snap-points (the ~13 dated events) so
  touch users land on eras.

## Judgment calls reserved for the user

- Final section count / cuts if the story wants to be shorter than the 13-section
  skeleton (per the scale philosophy, that's a fine outcome — but it's an editorial
  pivot worth surfacing).
- Archival-image substitutions if rights are unclear.
