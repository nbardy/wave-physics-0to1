# HUMAN_PENDING_REVIEW.md — the batch queue

Everything in this repo that needs Nick's eyes, in one place. Rule: when a
thread produces a decision, read, or publish flip only Nick can make, it goes
here (checked box + date when done) instead of living in chat history.
Suggested batch order: reads (§1) → structural decisions (§2) → publish
gates (§3). Per-article state stays canonical in each `HANDOFF.md`; this file
carries only the ask and where to look.

## §1 Reads (short — do these first)

- [ ] **P-bits fourth paragraph** (Nick's draft, 2026-09-04): fix "this lesson
  builds" → machine-subject; pick which line gets to be the aphorism (the
  opener or the thesis — INTROS allows one, last). Thread verdict: ¶3 clean.
- [ ] **Lesson-04 v3 intro + ending + *Paint the bulge*** (`src/lessons/lesson-04-learned-solver.II.mdx`):
  judge v3 against the v2 baseline slop verdict (`articles/08-learned-solver/HANDOFF.md`
  remaining-work item 2), not the jacket copy.
- [ ] **Lesson-03 editorial read, per section** (`src/lessons/lesson-03-navier-stokes-history.mdx`):
  "does any moment need a figure it doesn't have?" — watch §11 (one figure,
  prosiest stretch). (`articles/03-navier-stokes-history/HANDOFF.md` item 2.)
- [ ] **Physics P2 editorial read** (`src/lessons/physics-02-einstein-grossmann.mdx`,
  live at `/lesson/einstein-grossmann`): voice markup (blunt — doubles as
  print-register ratification material); physics vetoes on the three
  confessions (spatial stand-in, toy operators, rescaled Mercury strengths);
  density call (~375 words/figure, above band by design).
  (`articles/physics/02-einstein-grossmann/HANDOFF.md`.)

## §2 Structural decisions (these unblock builds)

- [ ] **Lesson-03: tour vs paradox spine.** Standing plan: editorial read +
  Stage-4 voice pass + publish. Proposal: tour→paradox re-spine with cut list
  (worker synthesis 2026-09-04; checkpoint logged in `articles/03-navier-stokes-history/HANDOFF.md`
  judgments). No sections cut until decided.
- [ ] **Hero assignments (S3 freeze).** C owns the 144×88 cylinder (SolveDebt) +
  96×64 h1 (race); survey article reuses that pair + airfoil OOD (no new hero);
  03's disc/separation meter BLOCKED on a residual-gated solve. Confirm or
  redraw. (Logged in `articles/08-learned-solver/HANDOFF.md` item 6.)
- [ ] **Survey-article spine.** Proceed with "warm-start as smooth-mode
  preconditioner" (speedups only as gate+baseline+OOD triples), or cut/redirect
  the closure rung?
- [ ] **Sequencing.** Solver meter work, survey skeleton, or history voice pass
  first?
- [ ] **Version-III toggle** (open since 2026-09-03): which lessons get a III,
  and what it holds — my intros, a full third draft, or an empty shell?
  (Mechanics confirmed: `VersionSwitch` + `LessonView` already support N
  versions; adding one is a file + registry entry.)

## §3 Publish gates (per lesson, at ship time)

- [ ] **Browser QA + mobile pass, lesson-03** (real-device touch; deployed site
  predates ALL figure fixes — redeploy on publish flip).
- [ ] **Browser QA + mobile pass, lesson-04** (PaintTheBulge drag surface,
  WarmStartRace residual plot at height 350, three-pane figures <400px,
  SlowModes legend overlap).
- [ ] **Browser QA + mobile pass, physics P2** (MercuryGrade animation pace,
  FallTest loop timing, Predict veil/unveil, all figures <400px — headless
  380px block green, needs real-device touch).
- [ ] **Publish flip, physics P2** (`draft` → `published`; propose, don't
  surprise).
- [ ] **Print-register ratification** (voice system, open item 1): voice-sweep
  ONE lesson-01 section, Nick marks it up, then sweep everything.
- [ ] **Publish flips** (propose, don't surprise): 03, 04, others per registry
  status. Each flip: `git status` review first — the tree regularly holds other
  sessions' uncommitted work — then `bun run deploy` + push `main`.
- [ ] **Pre-publish figure audit** (`.claude/skills/figure-audit`): screenshot
  each figure as a reader, bind every prose claim to visible evidence, every
  knob to both ends.

## Resolved (date + one line — retire, don't delete)

- 2026-07-06: lesson-02 epigraph verified against live tweet (verbatim, dated).
- 2026-07-06: lesson 01 published keeping Final Words → lesson 02 owes ending rewrite.
