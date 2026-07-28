# HANDOFF — Lesson 01: Building the Navier–Stokes Equations

**State: PUBLISHED 2026-07-06.** 5,240 words, 31 figures, 9 earned equations.
Final numbers from the Stage-5 close-out: "known as" ×2, banned filler ×0,
exclamations ×0, zero family-16/17 slop findings on the second full scan; both
rhythm droughts resolved by prose unification (not new figures, Nick's call); the
air-viscosity plant tied off in §7; hero pre-rolls 480 steps so the first painted
frame is alive. Decisions recorded at publish: lesson 02 owes the Final Words
rewrite (01 keeps the shape); KelvinHelmholtz stays benched; shipped with the
known device-rotation stretch limitation and the CPU-fallback waver (confessed in
§12's fair warnings).

## Post-publish fixes, 2026-07-06 (play-test found two figures lying)

Nick play-tested the live article and found the hero slider "doesn't really do
anything" and the advection figure "doesn't teach much". Both were real defects,
not taste — and both had been shipped:

1. **Implicit diffusion was ~80% unconverged at high viscosity.** The solve
   (I − a∇²)u = uⁿ is Jacobi with convergence factor 4a/(1+4a); a fixed 12
   sweeps delivered about a FIFTH of the requested ν at the honey end (measured:
   velocity top-hat spread to σ 14.6 cells in 1 s where theory says 31.6). The
   dial printed Re 20 while the fluid behaved like Re ≈ 100, so the slider's
   whole lower half was inert. Sweeps now scale with a (σ 30.8 vs 31.6). The
   **pure-diffusion check is the regression test**: seed a velocity top-hat,
   run 1 s, σ_measured must track sqrt(2νt) at BOTH ends of every viscosity
   slider. Slider floors moved to the lowest Re each solver honestly serves
   (wing 40, cylinder 20 — measured glassy, ~4 ms/step). Dye decay 0.9995 →
   0.997 because a 35 s streakline half-life outlived any reader's patience.
2. **AdvectionSchemes' unstable scheme never blew up.** Measured on the
   published build: |dye| ≤ 1.01 for ten seconds, zero negative cells, while the
   prose promised a scheme tearing itself apart — a smooth Gaussian carries no
   grid-scale energy for centered differences to amplify, and the |dye| > 8
   reset could never fire. Now seeded with a sharp disc (violet at 0.08 s,
   8% of the grid ruined by 7.7 s, which is the loop trigger) and both schemes
   run side by side from one seed instead of behind a mode toggle that hid the
   comparison. DyeCarry now loops instead of emptying and sitting blank.
3. **Prose**: design-rationale narration cut (arrow-spacing "courtesy", the
   staging paragraph's self-justification, "Two things are worth noticing").
4. **Captions**: all 7 lesson-01 `caption=` props removed, per the caption
   policy recorded in AGENTS.md — each only restated adjacent prose. Lesson
   02/03 still pass 5 (`ConnectionWave`, `ConnectionTuner`, `GlobeTransport`,
   `HopfMonopole`, `StringWaveDemo`) — sibling thread's call; the `caption` prop
   itself is still on `<Sim>` for them.

**Verification gap to close:** the Browser pane reported `visibilityState:
hidden` and 0 RAF ticks all session, so nothing could be watched in motion —
every claim above is from stepping solvers explicitly plus typecheck/build.
The two rebuilt figures (AdvectionSchemes, DyeCarry) still want one human look
in a real window. Note for future sessions: **if a sim looks frozen or a
screenshot comes back blank, check `document.visibilityState` before believing
any of it** — several intermediate readings this session were photographs of
stale frames.

**Hanging work, in priority order (thread closed 2026-07-06):**
1. Run `/figure-audit` on lesson 01 in a session with a visible Browser pane —
   it operationalizes exactly what this session's play-test caught (reader
   questions, prose↔figure binding, every knob to both ends). Priority
   figures: AdvectionSchemes and DyeCarry (rebuilt blind), WingFlow hero
   (drag down AND back up), CylinderFlow regime.
2. Automate the pure-diffusion check as a /stack-check invariant
   (GpuParityCheck check D): velocity top-hat, 1 s, σ vs sqrt(2νt) at both
   ends of each slider's ν range. It would have caught the diffusion bug
   before publish, and guards every future viscosity slider.
3. Real-device mobile pass (shipped limitation: rotation stretches canvases).
4. Sibling-thread items unchanged: lesson 02/03 captions call, lesson 02
   Final Words rewrite, lesson 03 browser QA.

Everything below is the pre-publish state, kept for archaeology.

---

**State: Stage 4 complete (built end-to-end, `draft`). Mission of this thread:
finish Stage 5 and publish.** This is the closest lesson to done; publishing one
genuinely finished article calibrates the bar for the other two.

## Read first, in this order

1. `AGENTS.md` — repo rules, sim honesty rules, and **"Scale and style: heuristics,
   not rules"** (load-bearing for this thread: the plan's ~80 figures is an
   estimate, NOT a target; the article publishes at whatever length teaches best).
2. `ESSENCE_OF_VOICE_AND_DESIGN.md` **and `NICKS_VOICE.md`** — the two poles of the
   voice (read ESSENCE's new preamble: it is a measurement, not a recipe; blend
   rule: structure → ESSENCE wins, prose temperature → NICKS_VOICE wins).
3. `METHODOLOGY.md` — Stage 5 gate (rhythm/palette/ledger audits, anti-checklist).
4. `articles/01-navier-stokes/PLAN.md` — the skeleton this was built from.
5. `src/lessons/lesson-01-navier-stokes.mdx` — the article itself. Read it end to
   end in the browser before touching anything.

## Current state (measured 2026-07-05)

- 13 sections, 32 live figures, ~4,900 words (153 w/fig), 9 earned equations,
  2 `<Predict>` widgets, 2 `<Waypoint>`s. Verified in-browser at 60 fps.
- **Hero swapped 2026-07-05 (evening): the wing.** The intro is now the 1822 /
  million-dollar-wager opening ("The wing flies anyway."), and the hero/finale is
  `WingFlow.tsx` — a level NACA airfoil with two dye currents (amber above,
  rose below — new `dye2` palette key) braiding into a Kármán street,
  mystery-Re slider preserved (min 20, max 600, default 500; braid alive ≥ ~350,
  glassy ooze at the honey end — all measured, see WingFlow header). Ledger
  rewires that came with it: §6 now *introduces* the cylinder ("simplest obstacle
  there is"); §7 confesses the hero wing is "aerodynamically a moth"; §11's
  Millennium confession is a CALLBACK to the intro's wager (no longer a cold
  reveal); §12 finale returns the wing (Re revealed + stir). A tilt-to-stall
  slider was built first and CUT after play-testing — confined-channel blockage
  locks the tilted wake steady, and the inclined staircase mask drives a spurious
  ~7×U wall-jet; the honest write-up is in `WingFlow.tsx`'s header comment.
- Two solver bugs found and fixed during the swap (comments at both sites):
  multigrid restrict/prolong kernel-cache labels lacked NY (two grids sharing a
  width poisoned each other), and sub-cell-thin obstacle tails are near-singular
  for the Neumann pressure stencil (`airfoil.ts` floors thickness in chord units
  and despeckles the mask).
- `KelvinHelmholtz.tsx` is built and tuned (two-color billow train, one shear
  knob, trip-wire confession in the header) but NOT placed in the MDX — an
  editorial decision for the user: candidate slots are §5 (after ShearBlend) or
  §6; or leave it for a later lesson.
- Hero (`CylinderFlow`, §7 regime + §9 broken) runs on the WebGPU compute solver
  (`src/sims/lib/gpu/`, see `PLAN_GPU_SOLVER.md`) with a real self-sustaining
  Kármán street at 4× grid; CPU-fallback browsers get the older "waver" version
  (the wing's CPU fallback is likewise softer — same documented pattern).
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
   little" — 31 figures at this rhythm is a legitimate finished article.
   The 2026-07-06 full-article slop scan (all 17 SLOP.md families + rhythm +
   ledger; 6 micro-findings fixed, zero family-16/17 hits) pre-identified the only
   two hands-idle stretches: the §2→§3 boundary and §3's material-derivative math
   stretch. RESOLVED 2026-07-06 by unification, not new figures (Nick's call): the
   material-derivative idea was stated 3× (Predict payoff, two-questions list,
   christening ¶ — now once each with the christening folded into the list); the
   molecules→field bridge said "leave the molecules behind" twice; the steady-
   stream setup said "steady" three ways. ~100 words cut; droughts now 4 blocks
   with the equation inside them. Still open, one soft ledger end: §5 plants
   "air's ≈0.02 … will matter more than you'd think," §7 pays it only implicitly
   through the 747's Re — decide explicit tie-off vs. accept.
2. **Real-device mobile pass.** Known limitation: `<Sim>` sizes its canvas once at
   mount, so device rotation stretches figures — decide fix vs. accept-and-document.
3. ~~CPU-fallback honesty check~~ DONE 2026-07-06: confessed in §12 fair-warnings
   ("on a browser without WebGPU the whole thing runs at a quarter of the
   resolution, where the street softens into a gentle waver").
   Also done 2026-07-06: hero pre-roll (WingFlow runs 480 fixed steps at GPU
   creation, so the first painted frame is already braided — verified in-browser);
   slider-drag robustness measured (Re 500→20→500 ramp: max|vel| 1.7×U, no NaN;
   street re-grows to σ 0.21 within ~16 s of returning — same timescale as its
   original formation, no locked state).
4. **Stage 5 audits**, per METHODOLOGY:
   - *Rhythm*: no >3-paragraph droughts; ≤1 knob per figure except the flagged §11
     term-toggle finale; figure-adjacent-to-figure ≈ never.
   - *Palette*: every quantity keeps its `palette.ts` color in every figure and
     every `<C>` span; no orphan colors.
   - *Ledger*: every plant pays off — fig 2's honey/water redeemed in §6–7; the
     unexplained Re slider named in §7; the hero returns understood in §12; the
     Millennium confession lands in §11.
   - *Voice*: essence pass DONE 2026-07-06 (this thread). Measured after:
     "…is known as" 10→3 (kept for material derivative / Reynolds / pressure);
     clearly/simply/obviously 6→0; exclamations 1→0 ("This is clearly wrong!" →
     "This is just wrong." — blunt-verdict blend rule); meta-narration cut
     ("Here is the question that unlocks…", "It's time to ask what, exactly…",
     "And of course the instruments stack:" + the combo figure it introduced);
     §10 "by hand and by eye…without a hand" collision fixed; §11 callback
     tightened; stale "ten thousand cells" fixed at both sites (Jacobi ¶ and
     fair-warnings); CPU-fallback confession added to fair-warnings. Words
     5,335. Fork-question hinges: both drafts REJECTED by Nick as manufactured
     cleverness — the incident and rules are now SLOP.md families 16–17 ("the X
     is just the Y" rebrand; staged suspects). Lesson 01 ships with NO fork
     hinges; the device stays reserved for genuinely live forks.
   - *Sibling audit* ⚠ cross-thread: lessons 01 and 02 currently share their Final
     Words skeleton beat-for-beat ("The next time you… / I find it… / and now
     you…"). One of the two endings must be rewritten from its own material —
     coordinate with the lesson-02 thread on which article keeps the current shape.
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
