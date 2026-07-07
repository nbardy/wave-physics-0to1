# AGENTS.md

A self-study in wave physics, written as Ciechanowski-grade explorable explanations —
his pedagogy, plus the equations he deliberately omits. Before writing anything, read
in this order:

1. **`ESSENCE_OF_VOICE_AND_DESIGN.md`** — what the master actually does (measured from
   all 22 posts; corpus in `research/`). The rules of voice, design, and pedagogy.
2. **`NICKS_VOICE.md`** — the other pole: Nick's own voice, measured from ~7,200 of his
   prompts, and the blend rule the articles are written in (Ciechanowski's discipline,
   Nick's blood; prose temperature → NICKS_VOICE wins, structure → ESSENCE wins).
3. **`SLOP.md`** — the detector: the slop families and the four tests (topic-swap,
   delete, who's-talking, the Nick test). Judgment calls, never grep gates. (Count
   deliberately not stated here — it grows; the doc is canonical.)
4. **`METHODOLOGY.md`** — the essence inverted into our five-stage process:
   concept → skeleton → blocked content → final draft → polished post. Includes our
   four standing deviations (we cash out the math; prediction before reveal; waypoints;
   named solvers).
5. **`articles/01-navier-stokes/PLAN.md`** — the full-length plan for lesson 01.
6. **`articles/02-fiber-bundles/PLAN.md`** — the full-length plan for lesson 02 (waves as sections
   of bundles; the connection as the universal medium; seeded by the Weinstein tweet
   quoted at its top). Its subject-matter grounding — what the tweet technically
   refers to, the papers, the 1858→1986 history — is **`articles/02-fiber-bundles/RESEARCH.md`**;
   its distilled hook/payoff/insight ranking is **`articles/02-fiber-bundles/DENSE_CORE.md`**.

Article docs live in per-article subfolders: `articles/NN-slug/{DENSE_CORE,PLAN,RESEARCH}.md`
(DENSE_CORE = the compressed inspiration — thesis, hook, payoff, ranked insights —
written first; it wins conflicts with later drafts). Per-article handoff state lives
in `articles/NN-slug/HANDOFF.md`.

**Each doc owns one thing; principles live in exactly one home.** AGENTS = repo
mechanics, doc map, cross-thread state. METHODOLOGY = the process and its audits.
ESSENCE / NICKS_VOICE / SLOP = the voice poles and the detector. HANDOFF = per-article
state (canonical — never duplicate it here). If two docs disagree on a principle,
METHODOLOGY wins and the other doc becomes a pointer. And the anti-accretion rule,
which applies to these docs as much as to prose: **a new rule should usually replace
a worse one, not stack on it** — when adding guidance, look for what it retires.

## Scale and style: heuristics, not rules

Ciechanowski's articles tend to run ~3,000–16,500 words and ~21–120 figures, with
density settling around one figure per ~85–180 words. We use none of these as rules
— they are heuristics. **Our article length matches the length of the story**: we
don't drone on, we don't cut short; we match the content of what we want to teach
and the blocks and layers it actually needs. Density is the same: we often arrive
near the corpus density on our own, but an article type that begs more prose, more
LaTeX, or full proofs is welcome to them, and an article that is visual through and
through settles figure-heavy. Plan-stage figure counts are feasibility estimates,
never quotas.

More generally: **we don't mechanistically copy the previous author's style.** We
study his style, recover the *philosophy* behind his decision-making, and work
forward from our own intuition and taste with guiding principles.

## The repo

Vite + React + TS · MDX lessons with KaTeX (`$…$`, `$$…$$`) · Canvas-2D sims ·
Cloudflare Pages. `<Sim>` and `<TeX>` are available in MDX without imports.
`bun run dev` / `bun run typecheck` / `bun run build`.

- A lesson is `src/lessons/lesson-NN-slug.mdx`, registered in `src/lessons/registry.ts`
  (status is a sum type: `planned → draft → published`).
- A figure is a `Stepper` — `step(dt)` / `draw(ctx, w, h)` — handed to
  `<Sim create={…}>`. The stepper owns its state; the shell owns the RAF loop and
  Play/Pause/Reset. Figure-specific controls are bespoke JSX passed as `<Sim>` children
  (a slider is an `<input type="range">` writing to a ref the stepper reads). Extract
  shared control components only after a pattern repeats across three figures.

## Honesty rules for sims (non-negotiable)

- **Fixed physics timestep, decoupled from frame rate** (the `acc`/`FIXED_DT` loop in
  `src/sims/ViscosityDemo.tsx` is the reference). RAF cadence must never change the
  physics.
- **State the scheme's stability condition in a comment beside the constants that
  satisfy it** — and prefer constructions where stability holds by construction (e.g.
  a slider mapped to the diffusion number, not to raw ν).
- `create` builds fresh state; Reset re-runs `create`; `draw` is pure.
- Never a pre-rendered clip standing in for a sim. If we can't simulate it honestly,
  we say so in prose (his move) — we don't fake it.

House code style (one clean path, types as control flow) applies to sim code; see the
global CLAUDE.md. Registry dispatches on `status.kind` exhaustively — no default
branches.

## Where things stand

- **Voice system complete (2026-07-06)**: `NICKS_VOICE.md` (fingerprint measured from
  ~7,200 of Nick's prompts + the world-tubes ChatGPT distillation archived in
  `research/voice/`) and `SLOP.md` (families + 4 tests), wired into the reading
  order and METHODOLOGY Stages 4–5. **Open voice items**: (1) the *print register*
  (NICKS_VOICE §6–§7) has exactly one ground-truth sample (Nick's lesson-01 intro
  markup) — ratify it by voice-sweeping ONE lesson-01 section and having Nick mark it
  up before sweeping everything; (2) pending editorial decision: a visible question
  layer (`<Q>` interjections in Nick's voice at section hinges) vs. the fully fused
  blend — recommendation on record: no two-voice Socratic dialogue in main lessons
  (the reader is the second voice; Q/A word-count would ghettoize Nick's voice into
  question lines); if a true dialogue article is ever wanted, lesson 03 (history) is
  the natural host — real interlocutors, real wrong physics (d'Alembert's paradox);
  (3) after ratification, full voice sweep of lessons 01–02; (4) more ChatGPT-thread
  voice sources expected — fold into NICKS_VOICE provenance on arrival, and re-weigh
  its §4 (old blog voice is disavowed; probated devices: escalate-then-deflate,
  aphorism budget).
- **Per-lesson state lives in the HANDOFFs, not here** — one line each:
  - **Lesson 01** (Navier–Stokes): **PUBLISHED 2026-07-06** (Stage 5 complete: slop
    scan ×2, rhythm compression, ledger closed, hero pre-roll, hysteresis measured);
    hero is the two-color wing → `articles/01-navier-stokes/HANDOFF.md`.
  - **Lesson 02** (fiber bundles): Stage 4 complete + audited, `draft`; figure gaps
    closed, ending rewritten, epigraph verified 2026-07-06; a mobile/feel pass is
    all that remains before publish → `articles/02-fiber-bundles/HANDOFF.md`.
  - **Lesson 03** (NS history): BUILT end-to-end 2026-07-06 (`draft`) — ~5,800 words,
    20 figures, 16 new sims, computed drag meters; browser QA incomplete (preview
    env wedged) → `articles/03-navier-stokes-history/HANDOFF.md`.
  - **Lesson 04** (drag & turbulence, ordering unclaimed): CONCEPT banked
    2026-07-06 — 3D wind-tunnel hero (car + offset colored streamtubes; where
    lesson 01's "flows here are two dimensional" confession flips into the
    thesis). Week-scale solver+renderer work, scoped honestly in
    `articles/04-drag-and-turbulence/DENSE_CORE.md`. Not in the registry.
- **Cross-thread decision queue**: the remaining publish flips (propose, don't
  surprise). RESOLVED 2026-07-06: the lesson-02 epigraph is verified against the
  live tweet (Nick supplied it; wording verbatim, attribution dated). DECIDED 2026-07-06 (Nick): lesson 01 published keeping its
  Final Words shape, so **lesson 02 owes the ending rewrite**; `KelvinHelmholtz.tsx`
  stays benched. DECIDED 2026-07-06 (Claude, revisable): **caption policy** —
  in-canvas figure furniture (knob labels, meter/readout labels, year chrome) is
  part of the figure and stays; the `<Sim>` caption prop and any explanatory
  sentence rendered inside or under a canvas are captions and banned — explanation
  lives in prose (setup above, readout below); sims rendering explanatory hint text
  shed it at their lesson's next editing pass. DECIDED 2026-07-06 (Claude,
  revisable): **no `<Q>` second-voice layer** — question energy lives in Predicts,
  adjudicated in-prose forks, and quoted historical questions; a visible Q-box
  would ghettoize the voice (rationale in the voice bullet above).
- Infrastructure: palette contract (`sims/lib/palette.ts`), `<C>`/`<Waypoint>`/`<Predict>`
  prose components, field-renderer kit (`sims/lib/field.ts`), CPU Stable Fluids solver
  with term toggles + two dye species + split inflow (`sims/lib/solver.ts`),
  `sims/lib/airfoil.ts` mask stamping. `<Sim>` freezes off-screen figures via
  IntersectionObserver.
- **WebGPU compute solver** (`sims/lib/gpu/` — see `PLAN_GPU_SOLVER.md`): WGSL port
  of the Stable Fluids scheme, MacCormack advection + multigrid pressure, 4× grid,
  typed CPU fallback (which still shows the softer "waver"). Live invariant checks
  on `/stack-check`; measurements in the PLAN's table.
