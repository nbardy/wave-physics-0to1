# P-BIT SERIES HANDOFF — thread restart entry point

You are the next author of a three-part series on thermodynamic computing:
0 → 1 physics → Extropic's actual stack → training a diffusion model
in-browser on a simulator that IS the chip's contract. This document is
your map. Everything below was built and decided in one long thread
(2026-08-05); the working tree is canonical and NOTHING IS COMMITTED
except a concurrent session's WIP snapshot (f51c552) — committing is
Nick's call, never yours unprompted.

## Read in this order (do not skip; do not skim the voice docs)

1. `AGENTS.md` — repo mechanics, honesty rules for sims (non-negotiable),
   subagent cost tiers, and its reading order: ESSENCE_OF_VOICE_AND_DESIGN
   → NICKS_VOICE → SLOP → METHODOLOGY. The voice system is the product;
   read all four before writing a sentence of prose.
2. `articles/05-pbits/` — Part 1, "A Computer Made of Noise":
   DENSE_CORE (rev. 2, wins conflicts) → PLAN (rev. 2) → HANDOFF (state,
   findings, fact-hygiene log) → OUTLINES (the three candidate shapes +
   banked additions) → CRITIQUE (the six-way rubric that fixed the merge).
   Then read the article itself: `src/lessons/physics-02-pbits.mdx`,
   built end-to-end, live at `/lesson/pbits`, status `draft`.
3. `articles/06-z1-compiler/` — Part 2, "Compiling Into Heat":
   DENSE_CORE → PLAN (includes a MEASURED-FACTS section that BINDS §4
   prose) → RESEARCH (the claims-to-verify ledger — the single gate on
   all Part 2 prose).
4. `articles/07-ebm-diffusion/DENSE_CORE.md` — Part 3 seed.
5. Code: `src/sims/pbits/` (lib.ts is the shared core; z1.ts the exact
   fabric; walkCompile.ts the leakage lab). Checks:
   `bun run check:pbits` (5 suites, Part 1) and `bun run check:z1`
   (fabric + walk). ALL GREEN as handed off; keep them so.

## FLEET UPDATE (2026-08-06) — five-agent session, all landed green

- **RESEARCH.md is CLOSED against the primary papers** (opus researcher
  read both in full + THRML README): 11/11 checkbox lines VERIFIED with
  pointers; 3 DISCREPANCIES now binding on prose — (1) PAsymSwap is
  Thermalizers §IV A, not a Torx gate; (2) energy has TWO numbers, §II B
  ~3e-10 J estimate vs Appendix B 7.09 fJ/node@50MHz — never blend;
  (3) the meta-EBM target is SPARSE (18/66 pairs + 20 triples),
  "fully-connected" describes the compilation set, connectivity residual
  not simulated. Also: 269,568 NOT FOUND (scrub stands); Z1 boundary is a
  truncated grid, NOT a torus (our z1.ts torus = documented idealization);
  readout is an ENERGY ratio; flash ≈ 91× readout; reflash ≤ ~once/second;
  clamping priced like flashing; error floor cited as Eq (43); "TSU" is
  the hardware region's name; MET exemption "clamped spins do not enter
  this tradeoff" licenses the mixing dial. Softenings: Max-Cut "majority
  of runs"; Gaussian per-pick agreement weak (cite both or neither).
  **The Part 2 prose gate is OPEN.**
- **Part 1 Stage-4/5 polish DONE** (see 05 HANDOFF items 2/2b/3/6): seams
  swept, aphorism budget enforced, waypoints de-templated, §-refs
  resolved, one more fact catch, β-lock + StateGraph qualifier + mosaic
  mobile re-flow on canvas, Further Reading + Final Words in. Still owed:
  live scroll-through, perf/mobile pass, epigraph decision, publish flip.
- **Part 2 figure families BUILT AND GREEN** (`bun run check:part2`):
  split-meter + visitation glow + WalkLeak + WalkLadder + WalkFloor
  (REINFORCE exact, gradient identity to 5e-10; ladder 0.662→0.491→0.144;
  MEASURED TRADE: REINFORCE raises per-step KL 0.414→1.917 while crushing
  trajectory TV — the split-meter panes move in opposite directions, a
  guarded fact); LambdaShift (forward panes pixel-frozen across the knob);
  MixingDial (KL 1.119→0 while τ 1.7→194 sweeps); CostStrip (verified
  91× flash ratio, once-per-second limit as live readout, no-blend rule
  at the constants); MetaImpossible + SoftProduct + MetaEbmChain (sparse
  target; residual decay e^{−4.00a} vs theory −4; δ̃ floor 0.0385 at
  J_max 2.5, 63% by sweep 3; **finding: Eq 42's gate needs the hidden
  bias in its input field or its bilinear content is identically zero —
  derivation in metaEbm.ts**).
- Measured-facts additions live in 06 PLAN; the `visit` color awaits
  palette promotion at assembly.

**Part 2 remaining:** F1 hero (walk-as-written vs on-fabric), F2/F3
fabric figures (F4 built), F5 asymmetric fenced curiosity, F6 partition
figure, then PROSE per act (gate now open; write against RESEARCH.md
VERIFIED lines and the PLAN's measured-facts sections only), assembly,
reader+voice pass. Then Part 3 design unlock.

## Where the series stands

**Part 1 — BUILT, draft.** ~8,500 words, 10 sections, 28 figures, four
acts (distribution → sampler → machine+compiler → learner), mosaic hero
ring, ~180 assertions green. Built by four parallel Fable subagents from
PLAN rev. 2 with disjoint file ownership; assembled and bridged by the
main thread. Fact-hygiene pass applied (see its HANDOFF).

**Part 2 — SKELETON + CORE INFRA.** Docs complete. Built and green:
z1.ts (exact offset topology, bipartite + layering theorems checked,
chromatic Gibbs floor verified on the real fabric), Z1Layers.tsx (F4),
walkCompile.ts (exact thermodynamic-kernel fits, tied-ring capacity,
trajectory propagation, model-visited q) with its measured-facts ledger.

**Part 3 — SEED.** Thesis, spine candidates, scale anchors, dependencies.

## What is left to write/build (priority order)

### Part 1 → published
1. Live-pane reader pass, Acts III–IV especially (this thread's pane kept
   going `visibilityState: hidden` — the known rAF trap; `_figure_check/`
   PNGs are the fallback eyes, but a real scroll-through is still owed).
2. Stage-4 voice pass over the assembled whole: the four acts were voiced
   by four different agents — hunt seam repetition, run the sibling audit
   (Act III flagged its one aphorism-weight sentence: "One spin you will
   never read…"), SLOP tests, fork-rule check on all four Predicts.
3. Further Reading (the two papers + THRML/Torx repos + one classical
   Gibbs source, 2–3 earned sentences each) and a front epigraph if one
   is wanted.
4. Mobile/touch + performance pass (28 live figures; IntersectionObserver
   already freezes off-screen ones).
5. Stage-5 audits (rhythm, palette, ledger, anti-checklist), then PROPOSE
   the publish flip to Nick — never surprise him with it.

### Part 2 → built
1. **GATE FIRST: read arXiv:2608.01612 and 2608.01615 yourself and close
   RESEARCH.md** (flip corroborated → VERIFIED line by line, with section
   pointers). Three external "Muse Spark" pulls supplied equation-level
   quotes; treat them as corroborated-detailed, never as verification.
   No Part 2 prose ships numbers before this.
2. Build the §4 figures over walkCompile: split-meter component (per-step
   KL beside trajectory TV — the series' signature instrument), visitation
   glow, the three-stage ladder (uniform → context-matched → REINFORCE;
   reproduction target: the papers' 5.64 → 0.30 → 0.08 shape).
3. Build the REINFORCE estimator in walkCompile (spec in RESEARCH: needs
   only negative-phase clamping; reward-shaped for occupancy targets).
4. §4b floor figure: trajectory error saturating at δ̃ ≤ ε̄/(1−ρ), ρ
   measured from the chain.
5. Remaining acts per PLAN: λ-shift, mixing–expressivity dial, embedding
   + iteration-equivalent cost strip, meta-EBM with the soft-product-gate
   figure (F15b — the highest-value single figure left in the series),
   asymmetric-coupling fenced curiosity, hero.
6. Prose per act (Fable main loop or Fable subagents with the same
   disjoint-ownership pattern — it worked; see Working agreements).

### Part 3 → designed then built
Expand seed → full DENSE_CORE + PLAN only after Part 2 reaches Stage 3.
Needs: conditioned-kernel trainer variant of denoise.ts, placement of
denoiser kernels on the z1 fabric, the billed economics meters, probably
WGPU (`sims/lib/gpu/` pattern is banked) for many fabric-patch chains.

## Insights ledger — everything this thread learned, with homes

Process (recorded here; AGENTS.md carries the short version):
- **Four parallel Fable agents with disjoint file ownership + frozen
  shared lib + MDX fragments assembled by the main thread** built a
  4-act article in one session without a single merge conflict. The
  ownership list and "add, don't remove; existing exports must compile"
  rule are what made it work.
- **Checks-before-figures caught ~10 real bugs this thread**, each now a
  comment at its code site: the cheatable two-coins target (PairCoupler);
  exp overflow → log-space normalization, stale-base FD gradient
  divergence, zero-init hidden-spin saddle, private-capacity nullifying
  context weighting (all walkCompile); the one-color condition on the
  layering theorem (z1); the pane-hidden rAF trap (environment, not
  code); the remark-math multi-line `$$` swallowing half the document
  (repo rule now: display math on one line); title/rail collision
  (Z1Layers).
- **Claims follow measurements, not folklore**: "no free lunch" did NOT
  appear (cold contexts improved 0.66 → 0.60 under tied capacity);
  trajectory error "exceeds any single step's" (1.28×), it does not
  "dwarf"; on 16×16 glasses synchronous LOSES energy races (the 4×4
  certified race is the honest staging). Each is a binding prose
  constraint in its PLAN.
- **Fact hygiene**: "269,568" and "under one watt" were scrubbed —
  papers say ~250k and give only per-iteration energy estimates. The
  RESEARCH ledger pattern (UNVERIFIED → corroborated → VERIFIED-with-
  pointer) is the mechanism; keep using it.
- **External-review triangulation works**: three progressively deeper
  outside pulls (an unknown model, "Muse Spark") converged with our
  independent measurements — their papers' edge-tiled-vs-chromatic TV
  (0.402 vs 0.052) matches the shape of our own 0.46-vs-0.004 result,
  and their "conservation leakage" is the phenomenon walkCompile
  measured before we knew its name. Convergence is evidence; it is
  still not primary verification.

Design (recorded in the per-article docs; short index):
- The transformation rail TARGET → ENERGY → SAMPLER → SUBSTRATE (not
  disciplines) — Thermalizers is the first arrow; the §8 stack figure
  says so on canvas.
- The meter (exact ghost + TV) as persistent second protagonist, and its
  honest degradation into a hierarchy of witnesses at scale — the series'
  epistemic spine and its ending.
- Write conflicts, not move arity, discriminate legal parallelism.
- The hero must be the same model as the finale (mosaic of 4×4 chains).
- The three-layer confusion (math/algorithm/substrate) is the reader's
  root confusion; every figure answers it.

## Final external figure audit (fourth Muse pull, 2026-08-05)

A figure-by-figure external audit against the papers' own figures closed
the thread. Verdict: Part 1's figure set is faithful as built ("if you
ship Part 1 with the visuals above + the ~250k fix, you are faithful" —
the fix is already in). Its actionable residue, all absorbed below:

**Part 1 polish items (add to the Stage-4/5 pass, all small):**
- BitFlicker / §3: put "β = 1 (locked)" on-canvas where the update rule
  first runs, not only in prose.
- StateGraph: annotate on-canvas that chromatic ALSO makes multi-spin
  moves — the figure must never read as validating chromatic (prose
  already says it; the canvas should too).
- KernelTable prose: name Torx's gate vocabulary (PSWAP / PNOT / PSC)
  once — currently absent from the MDX.
- Microscope: optional X0 ↔ Z1 toggle on the figure itself (prose bridge
  exists; a toggle would show software-defined vs hardwired topology).
- MosaicHero: verify glyph legibility at mobile widths (cells ≳ 12 px)
  during the mobile pass.
- Race: keep the faint-instantaneous vs bold-best-so-far trace split
  (built that way; preserve through polish).
- **Decision candidate for Nick:** promote the exact-fabric Z1Layers
  figure (built, green) into Part 1's §6 chip reveal, alongside or
  replacing the proxy ChipFabric patch — the reviewer argues the
  planar → layered view belongs at first contact with the chip.

**Part 2 requirement confirmed:** the audit's five "must-add or it reads
generic" visuals are exactly PLAN's F8 (context glow q(x), now with the
Eq-17 inflation-bound chain displayed), F10 (λ-shift fwd/bwd panes),
F11 (mixing–expressivity dial), F2/F4 (exact fabric, built), F15b
(soft-product gate). No new figures were requested that the PLAN lacks —
build the PLAN and Part 2 speaks Torx natively.

## Working agreements (inherited, binding)

- Figures before prose; checks before trusting figures; every check
  samples one quantity's own palette ink and drives knobs to both ends.
- All prose Nick reads is written at Fable tier (main loop or Fable
  subagents); scouts/researchers for retrieval and research only.
- Display math on one line. β is always inverse temperature in labels.
- Measured-facts sections in PLANs BIND prose; when a measurement
  contradicts the planned narrative, the narrative changes.
- Propose publish flips; never surprise. Never commit unprompted.

## AUDIT ROUND CLOSE-OUT (2026-08-11)

Part 2 assembled, registered (`/lesson/z1-compiler`, `draft`), and audited
end-to-end. Three-agent audit fleet all landed: (1) hero healed — revealed
mode climbs the full ladder live; measured override recorded (histogram
IMPROVES 0.265→0.140 while conditionals worsen — aggregates cannot see the
warp; now in 06 PLAN's binding facts); (2) full Stage-4/5 voice pass on
Part 2 (18 fixes incl. the "act"-vocabulary leak, aphorism budget, PAsymSwap
attribution; Further Reading written w/ Levin & Peres; complete fact-trace —
nothing untraceable); (3) figure audit of all 44 instances with evidence
(17 files gained mobile-360 layouts; DreamChain crash guarded; Filmstrip
last step pinned at ½; split-meter label fix; torus/truncated prose
corrected; Race prose de-brittled). ALL SUITES GREEN. Remaining: the small
open items + palette decisions listed at the end of 06 PLAN's audit-facts
section; Nick's standing decision queue (Part 1 publish flip, Z1Layers
promotion, Microscope toggle, epigraphs, Part 3's six open questions);
Part 3 build (design complete, awaiting Nick's read). Nothing committed.

## VISUAL PERFECTION ROUND — COMPLETE (2026-08-17, d087102, deployed)

All nine decided items landed across three passes (one agent stalled, one
hit a session limit; main thread finished directly): healed instant hero +
retrain button, palette promotion (visit/hid), split-meter narrow fixes,
all mobile clips, DreamChain nearest-glyph readout, Z1Layers promoted into
Part 1's chip reveal (confession reconciled), PhaseTrainer prose scoped to
measured per-level behavior, and the new SplitMeterTeach figure (per-step
pane depth-blind at KL 0.568, trajectory pane 0.268→0.634 with visible
saturation; scripts/check-teach.ts). Declined and recorded: Microscope
toggle, fabric-class recolor. All suites green; live on gh-pages.
Remaining for the series: Nick's human read-through, publish flips,
Part 3 build (design approved-pending-read; six open questions in its PLAN).

## SERIES COMPLETE (2026-08-17, a8930f5, deployed)

All three parts PUBLISHED and live: /lesson/pbits, /lesson/z1-compiler,
/lesson/ebm-diffusion (thermo field T1–T3). Part 3 built in two fleet
rounds from the approved design + six coordinator decisions (recorded in
its PLAN): bill library (schedule sum type; clamp priced per-node off the
shared reflash constant), conditioned trainer (sharing costs ×1.2–7.5 KL,
stated as the trade), OpTimeline/AmortizeStrip/ClampFloor/MixBudget (the
allocation NULL kept as an honest finding), fabric-native 8×8 (zero
pixel–pixel wires, hidden = BFS layers, witnesses named where the joint
oracle dies; 6×6 fallback NOT needed), CeilingChart (naive crossing 67.6
ABOVE the papers' band — gap named on canvas), and the BilledWall ring-
closer (60 dreams bit-identical across schedules; wall 0px diff, strip
thousands; 36,264 → 287,801 samples/J, all computed never typed). Prose
in two halves + main-thread assembly (hook re-bound to the built canvas:
20 chains, shipped weights, witness row). The series aphorism landed:
"the schedule and the bill are one object read twice." ~5,200 words,
8 figures, ~196 new assertions, every suite green.

Editorial note for Nick: Sohl-Dickstein 2015 added to Part 3's Further
Reading (the diffusion ancestor; qualitative only, outside the RESEARCH
ledger). Remaining forever-item: Nick's own phone/desktop read of all
three, now that the trilogy is live.

## ADVERSARIAL-REVIEW CORRECTIONS (2026-08-25, correctness only, uncommitted)

Seventeen findings (F1–F17) applied across the three lessons; no style or
structure changes. The load-bearing ones: (F1) the finale's bit-identity
claim re-scoped to what is measured — a loop-reordering fact on the same
specialist weights; the conditioned kernel is BILLED, never run (scope now
documented in BilledWall.tsx's header + on-canvas basis line, and in
check-billedwall's header); (F2) the 16-px-vs-64-px clamp-basis
idealization confessed in the finale's prose (64-px pricing: 119,218 /
27,963 samples/J, amortization ~×3, floor >97%); (F3) Part 1's "flip any
single p-bit → ΔE = 4" false universal fixed (disagree-wire ends slide at
ΔE = 0 — frustration itself) and check-pbit-act1's rung test now pins BOTH
spin classes; (F6) the conditioned-sharing gloss now states near-parity is
the MIDDLE level (×1.20), the copy-like gentle end pays ×4.0, and at t=3
trained-shared (1.886) is worse than untrained (0.896); (F7) "matching
Part 1's trained quality" replaced by the k=6 witness truth (11.38 px /
30-of-60 / TV 0.398) plus the sweeps-are-0.16%-of-the-bill observation.
Smaller: ρ softened to motivated-not-theorem with the ρ vs ρ₀ flag (F4),
hero-reveal tied-vs-untied capacity flag (F5), Race waypoint third→half
(F8), "chip"→"compiled sampler" at the meta-EBM victory (F9), papers'
ladder hedged kindred (F10), PhaseTrainer 0.82→0.32 at the default level
(F11), meta-EBM floor stated as 0.0385→1.4e-5 (F12), 45 s → "about a
minute on a laptop" (F13), wall count forty→twenty acknowledged (F14),
PairCoupler target defined in ⟨s₁s₂⟩ units at the 0.9 mark (F15), "mostly
sixteen neighbors" (F16), DreamChain contrast re-bound to the measured
third-of-a-pixel readout (F17). All suites green after; nothing committed.
