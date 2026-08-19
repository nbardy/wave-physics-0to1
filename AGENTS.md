# AGENTS.md

**Nick's Visual Math Lessons** — explorable explanations at Ciechanowski grade: his
pedagogy, plus the equations he deliberately omits. It began as a wave-physics
self-study and that spine is still here, now as one **field** among several. A
lesson belongs to exactly one field (`physics` · `waves` · `maths` · `cad`,
ordered per field) and carries **tags** that cut across all of them; both are
closed unions in
`src/lessons/registry.ts`, so a typo is a compile error rather than an orphan chip.
Add a tag only when a second lesson would carry it.

Before writing anything, read in this order:

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
in `articles/NN-slug/HANDOFF.md`. Fully-designed ideas that lost to a better
candidate go to `articles/CONCEPT_BANK.md` — check it before inventing a hook or
hero from scratch.

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
`bun run dev` / `bun run typecheck` / `bun run build` / `bun run check:figures`
(per-lesson check scripts: `check:figures` `check:pbits` `check:z1` `check:part2`
`check:cad` `check:learned` — there is no aggregate).
**Display math stays on one line** — remark-math needs the closing `$$` at a
line start, so a two-line `$$eq … eq$$` silently swallows the rest of the
document (measured: it truncated two sections of physics-02, 2026-08-05).

- A lesson is `src/lessons/<field>-NN-slug.mdx`, registered in `src/lessons/registry.ts`
  (status is a sum type: `planned → draft → published`; `field` and `tags` are closed
  unions). `/` groups by field, `/all` filters by tag.
- A figure is a `Stepper` — `step(dt)` / `draw(ctx, w, h)` — handed to
  `<Sim create={…}>`. The stepper owns its state; the shell owns the RAF loop and
  Play/Pause/Reset. Figure-specific controls are bespoke JSX passed as `<Sim>` children
  (a slider is an `<input type="range">` writing to a ref the stepper reads). Extract
  shared control components only after a pattern repeats across three figures.

## Subagent model tiers (cost policy)

Subagents inherit the top-level model (Fable) unless overridden — so override, by tier:

- **haiku** — mechanical retrieval: file/grep sweeps, fact lookups, single-source
  fetches, list-building. Anything where the answer is *what/where*, not *why*.
  (`.claude/agents/scout.md` is pre-wired to haiku — prefer `subagent_type: "scout"`.)
- **opus** — judgment research: multi-source web research, source-quality calls,
  exploration docs, synthesizing scout results into structured reports.
  (`.claude/agents/researcher.md` is pre-wired to opus.)
- **fable** (inherit, no override) — reasoning-heavy math, article prose, anything in
  the voice system's register. **All prose Nick reads — final messages, lesson text,
  deck copy — is written by the Fable main loop, never delegated to a subagent.**

Workflows: pass `model:`/`agentType:` per `agent()` call by the same tiers.

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
- **A figure must show the contrast its prose claims, in one frame.** If the sentence
  says *X causes Y*, *X differs from Z*, or *Y scales as Rⁿ*, the reader has to see
  both sides at once — a live counterfactual, a second specimen, or a frozen "before"
  ghost — never a single state plus a printed number. And every knob must change
  something the claim depends on across its whole range, or it is furniture pretending
  to be an instrument. (Earned the hard way, 2026-07-06: a reader asked "why isn't the
  disc getting pushed downstream?" of a meter reading 0.000, and the same disease was
  then found in a dozen sibling figures — a power law shown with one specimen, a
  toggle that mutated an already-ruined state, a cascade whose eddies never moved.)
- **Verify figures by what they teach, not by whether they painted.** Counting
  non-transparent pixels is worthless: a background wash makes an empty pane read as
  100% painted. That false negative shipped three blank hero eras. Sample for the
  specific thing the figure must show (dye color, arrow row-span, column height,
  meter text) and exercise every knob to both ends.
- **Sample one quantity's own colour, not "any ink".** Extension of the rule above,
  earned 2026-07-31: the first three measurements written for the physics-01 harness
  each read a decoy that shared the column — a dashed reference line, a ghost
  outline, a fixed guide circle. Each produced a *passing-looking* number that was
  independent of the knob. Match the palette hex of the thing being measured, and
  distrust any check whose answer does not move when the slider does.
- **The check can run headlessly.** `scripts/check-physics-figures.ts` renders a
  stepper into `@napi-rs/canvas` and asserts against the pixels — no browser, no
  rAF, deterministic. Export the `create*` factory next to the component to make a
  figure checkable. This matters beyond convenience: a preview pane whose
  `document.visibilityState` is `hidden` suspends rAF, so every `<Sim>` freezes and
  browser-side pixel probes silently measure a blank canvas.

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
- **Fields and tags landed 2026-07-31**: the site is now Nick's Visual Math Lessons,
  `Track` became `Field` with `physics` added, every lesson carries tags, `/all`
  filters by them, and `sims/maths/lib.ts`'s pane vocabulary moved to
  `sims/lib/chrome.ts` (re-exported, so maths figures are untouched).
- **Per-lesson state lives in the HANDOFFs, not here** — one line each:
  - **Physics P1** (wave–particle duality, first of the broad-physics field): BUILT
    end-to-end 2026-07-31 (`draft`) — ~3,100 words, 6 figures, exact Fresnel optics
    plus Monte-Carlo photon arrivals in `src/sims/physics/`; 20 headless figure
    checks green, which found two real figure bugs; awaits Nick's read and a mobile
    pass → `articles/physics/01-wave-particle/HANDOFF.md`.
  - **The p-bit SERIES** (field `thermo`, “Thermodynamic computing” — split out of
    `physics` 2026-08-20 so the broad-physics field stays standalone lessons; the
    series is T1/T2/T3, read in order):
    Part 1 "A Computer Made of Noise" BUILT end-to-end 2026-08-05 (`draft`,
    ~8,500 words, 28 figures, ~180 checks green via `bun run check:pbits`);
    Part 2 "Compiling Into Heat" (Extropic stack) skeleton + core infra built
    (`bun run check:z1`); Part 3 (EBM diffusion on the chip's economics)
    seeded. **Thread-restart entry point: `articles/PBITS_SERIES_HANDOFF.md`**
    — reading order, state, remaining work, and the thread's insights ledger.
    Per-article state: `articles/05-pbits/HANDOFF.md`; Part 2 prose is GATED
    on `articles/06-z1-compiler/RESEARCH.md` closing against the primary
    papers. Process note for future big builds: four parallel Fable agents
    with disjoint file ownership + frozen shared lib + main-thread assembly
    shipped four acts in one session, zero conflicts.
  - **Lesson 01** (Navier–Stokes): **PUBLISHED 2026-07-06** (Stage 5 complete: slop
    scan ×2, rhythm compression, ledger closed, hero pre-roll, hysteresis measured);
    hero is the two-color wing → `articles/01-navier-stokes/HANDOFF.md`.
  - **Lesson 02** (fiber bundles): Stage 4 complete + audited, `draft`; figure gaps
    closed, ending rewritten, epigraph verified 2026-07-06; a mobile/feel pass is
    all that remains before publish → `articles/02-fiber-bundles/HANDOFF.md`.
  - **Lesson 03** (NS history): BUILT end-to-end 2026-07-06 (`draft`) — ~5,800 words,
    20 figures, 16 new sims, computed drag meters; browser QA incomplete (preview
    env wedged) → `articles/03-navier-stokes-history/HANDOFF.md`.
  - **Maths M1** (Jacobian & Hessian): v1 zoom-lattice article RESTORED and live
    (`draft`) after the 2026-07-31 map rewrite was built and retired on Nick's
    verdict (familiar hero = anti-hook; postmortem in its STORY_CANDIDATES.md,
    map build banked in CONCEPT_BANK.md). Next version agreed in direction —
    "Newton's One Idea" spine, fluid-freight opening — with a MANDATORY hook
    checkpoint before any build → `articles/maths/01-jacobian-hessian/HANDOFF.md`.
  - **CAD C1** (Basis, Cage, and Boundary — first lesson of the `cad` field,
    opened 2026-08-16): PORTED end-to-end (`draft`) from an external
    standalone explainer (vanilla ES modules + raw WebGPU) delivered as a zip.
    ~2,900 words, 7 figures, the maths rebuilt in `src/sims/cad/`
    (Cox–de Boor, Boehm insertion, rational NURBS, Catmull–Clark, a B-rep plate
    with its Euler–Poincaré balance); 54 assertions green via `bun run check:cad`.
    The original project is preserved verbatim under
    `articles/cad/01-cad-primitives/source/` and the port is checked against ITS
    recorded numbers, not against itself. Voice pass, reader-ToM review, and a
    mobile pass are the remaining work →
    `articles/cad/01-cad-primitives/HANDOFF.md`.
  - **Lesson 04** (learned solver — *Teaching a Solver to Guess*): BUILT end-to-end
    2026-08-20 (`draft`) from an external visual storyboard Nick supplied as a zip
    (preserved verbatim under `articles/08-learned-solver/source/`). ~4,300 words,
    9 figure slots from 7 live components, and the repo's first genuinely TRAINED
    model: 809 parameters that warm-start the pressure projection, trained by
    `scripts/train-pressure-net.ts` on the lesson-01 solver's own divergence
    fields, shipped as `src/sims/learned/weights.ts` with its measurement manifest.
    50 assertions green via `bun run check:learned` — which guards the prose's
    numbers, not just the pixels. Browser QA and mobile pass NOT done (the preview
    pane was visibility-hidden all session, which suspends rAF and blanks every
    canvas) → `articles/08-learned-solver/HANDOFF.md`. Two repo-wide changes rode
    along: `remark-gfm` + table styling (first tables in the repo), and
    `lazyStepper` in `sims/learned/figlib.ts` for lessons whose figures are
    expensive to construct. **Ordering note:** it took waves `order: 4`, which the
    banked drag/turbulence concept below had informally claimed; if drag ships
    first, this becomes 05 and only `registry.ts` changes.
  - **Lesson 04-or-05** (drag & turbulence, ordering unclaimed): CONCEPT banked
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
