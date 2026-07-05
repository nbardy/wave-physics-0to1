# HANDOFF — Lesson 01: Building the Navier–Stokes Equations

**State: Stage 4 complete (built end-to-end, `draft`). Mission of this thread:
finish Stage 5 and publish.** This is the closest lesson to done; publishing one
genuinely finished article calibrates the bar for the other two.

## Read first, in this order

1. `AGENTS.md` — repo rules, sim honesty rules, and **"Scale and style: heuristics,
   not rules"** (load-bearing for this thread: the plan's ~80 figures is an
   estimate, NOT a target; the article publishes at whatever length teaches best).
2. `ESSENCE_OF_VOICE_AND_DESIGN.md` — the voice/design rules the audits check against.
3. `METHODOLOGY.md` — Stage 5 gate (rhythm/palette/ledger audits, anti-checklist).
4. `articles/01-navier-stokes/PLAN.md` — the skeleton this was built from.
5. `src/lessons/lesson-01-navier-stokes.mdx` — the article itself. Read it end to
   end in the browser before touching anything.

## Current state (measured 2026-07-05)

- 13 sections, 32 live figures, ~4,900 words (153 w/fig), 9 earned equations,
  2 `<Predict>` widgets, 2 `<Waypoint>`s. Verified in-browser at 60 fps.
- Hero (`CylinderFlow`) runs on the WebGPU compute solver (`src/sims/lib/gpu/`,
  see `PLAN_GPU_SOLVER.md`) with a real self-sustaining Kármán street at 4× grid;
  CPU-fallback browsers get the older "waver" version.
- Infrastructure: palette contract in `src/sims/lib/palette.ts`; `<C>` colored-term
  component; field kit `src/sims/lib/field.ts`; CPU solver `src/sims/lib/solver.ts`.
- Already resolved: mobile control-row overflow, touch drags (`.sim-stir`,
  `touch-action: none`).

## What is left (in recommended order)

1. **The editorial read** (the main event). Go section by section in the browser
   asking one question: *does any moment here need a figure it doesn't have?* Look
   for: stretches where the reader's hands go idle >3 paragraphs; places where prose
   describes something a one-delta overlay could show; marquee moments served by a
   single figure where the plan sketched a sequence. Build only what a specific
   moment asks for. It is a fully acceptable outcome that the answer is "very
   little" — 32 figures at this rhythm is a legitimate finished article.
2. **Real-device mobile pass.** Known limitation: `<Sim>` sizes its canvas once at
   mount, so device rotation stretches figures — decide fix vs. accept-and-document.
3. **CPU-fallback honesty check**: browsers without WebGPU see a wake that never
   becomes a true vortex street. The honesty rules (AGENTS.md) suggest a one-line
   confession in prose or a rendered hint. Decide and implement.
4. **Stage 5 audits**, per METHODOLOGY:
   - *Rhythm*: no >3-paragraph droughts; ≤1 knob per figure except the flagged §11
     term-toggle finale; figure-adjacent-to-figure ≈ never.
   - *Palette*: every quantity keeps its `palette.ts` color in every figure and
     every `<C>` span; no orphan colors.
   - *Ledger*: every plant pays off — fig 2's honey/water redeemed in §6–7; the
     unexplained Re slider named in §7; the hero returns understood in §12; the
     Millennium confession lands in §11.
   - *Voice* (re-run even though Stage 4 ran): we-builds/you-touches/I-confesses;
     phenomenon-first jargon; "Unfortunately/Thankfully/However" as the plot
     devices; zero rhetorical questions; ≤2 exclamations; boundary check after
     every formula.
   - *Anti-checklist*: no numbered figure references, no captions, no
     "obviously/simply/clearly", no inline citations, no unresolved plants.
5. **Caption-policy coordination** ⚠ cross-thread: some sims render hint text;
   ESSENCE bans captions. This needs ONE global decision shared with the lesson-02
   thread. Check `AGENTS.md` for a decision recorded there before deciding
   unilaterally; record whatever is decided.
6. **Flip `status` to `{ kind: 'published' }`** in `src/lessons/registry.ts`, update
   the README curriculum table and AGENTS.md "where things stand", deploy
   (`bun run build && bunx wrangler pages deploy dist --project-name wave-physics-0to1`).

## How to verify

- `bun run typecheck && bun run build` must stay green after every change.
- Dev server: `bun run dev` (or the preview tools; `.claude/launch.json` has a
  `dev` config). Solver invariant checks live on `/stack-check`.
- For sim changes, obey the honesty rules in AGENTS.md (fixed timestep, stability
  condition stated in a comment, `create` = fresh state, pure `draw`).

## Judgment calls reserved for the user

- Publishing itself (the status flip) — propose, don't surprise.
- Any scope growth beyond the editorial read's findings (e.g. "grow §5 to plan
  scale") — present the case, let the user choose.
