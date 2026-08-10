# PLAN — Diffusion on a Dreaming Machine (Part 3, series finale)

Stage-2 skeleton. `DENSE_CORE.md` wins conflicts. The fact universe is
`articles/06-z1-compiler/RESEARCH.md` (CLOSED, 2026-08-06): Part 3 makes
**no new hardware claims** — every economic number is either a verified
constant from that ledger or arithmetic performed on one, and the
MEASURED-FACTS section below binds all prose exactly as Part 2's did.
Prereqs: Part 2 at Stage 3+ (split-meter, CostStrip, z1.ts, MixingDial
all BUILT and green as of the 2026-08-06 fleet session — the build
prereqs are already met; the *prose* prereq is Part 2 assembled enough
that Part 3 can open from its cost strip without re-teaching it).

Target: ~6,000–7,500 words, ~17 primary figure instances (estimate, not
quota — several are one component re-mounted one-delta). Five acts.

## Honesty rules DESIGNED INTO this plan (binding, restated from core)

1. **Modeled, never measured.** Every bill is a model built from verified
   paper constants (READOUT_ITERS = 300 within the verified 10²–10³ energy
   band; REFLASH = 91× readout per Appendix B Table IV; clamp priced like
   flashing per §II B 2). The confession is *chrome on the bill itself* —
   a standing "modeled rates" tag on every cost strip, not prose nearby.
2. **The no-blend energy rule, enforced on canvas.** Joules appear only as
   a labeled secondary conversion at §II B's ~3×10⁻¹⁰ J/iteration, cited
   as an estimate; Appendix B's 7.09 fJ/node@50MHz may be *named* once in
   prose as the refined per-node figure but never mixed into any number
   the reader watches accumulate. (CostStrip already implements this;
   every Part 3 bill inherits its constants from that one module — one
   source of truth, `src/sims/pbits/CostStrip.tsx` exports.)
3. **Scale claims by arithmetic from the 14k anchor only.** The ceiling
   figure derives everything from {14,000 p-bits per 8-bit 16×16 field,
   ~250,000 nodes}; no scale sentence may cite anything else.
4. **Iteration-equivalents first.** Every billed figure charges in Gibbs
   iteration-equivalents as the primary axis; joules are the dessert
   conversion. No figure leads with joules.
5. **Cheapness and honesty travel together.** Any figure showing a
   cheaper schedule shows the quality witness (exact KL at 4×4; the
   witness panel at 8×8) on the same canvas. No exceptions.
6. **Claims follow measurements.** Every number in prose traces to the
   MEASURED-FACTS section below, which starts as placeholders and BINDS
   prose once filled — if a measurement contradicts the planned
   narrative, the narrative changes (inherited working agreement).

## Persistent chrome

- Part 1's four-slot rail (TARGET → ENERGY → SAMPLER → SUBSTRATE); this
  article's figures sit on the last arrow with the price annotated.
- Part 2's **split-meter** wherever a compiled/chained thing runs
  (per-step KL beside trajectory/occupancy error at 4×4; at 8×8 the left
  pane becomes the fenced-patch conditional TV — its honest degradation,
  stated on the label).
- NEW: the **bill strip** — a thin persistent strip (extracted from
  CostStrip's meter block into `part3lib.ts`): line items sweeps /
  readouts / clamps / reflashes in iteration-equivalents, the
  once-per-second reflash-rate readout (error-red past 1/s), the joules
  conversion in small type with its "estimate, §II B" tag, and the
  standing "modeled rates" confession tag.

## Palette

Inherited: full Part 1 p-bits palette (sUp/sDn/ferro/anti/ghost/held/
meter) — unchanged, same hexes, same meanings. Additions:

- **`bill: '#db2777'`** (NEW) — the cost ink: every iteration-equivalent
  bar, line item, and prose span about the bill. Magenta is the one hue
  the p-bits family has not spent; the bill is the article's second
  protagonist and needs an unmistakable coat. (Approve at assembly.)
- **`visit: '#fb923c'`** — Part 2's pending promotion (currently a local
  const in part2lib.ts); promote to palette.ts when either article
  assembles. Part 3 uses it only if a context-glow moment survives
  (currently none planned).

No other additions. Noise levels t = 1..3 are NOT a palette entry — they
are labeled positions on the filmstrip axis, as in Part 1.

## Acts — the failure chain

Every section ends on a manufactured problem; the failure is simulated,
never described. Figure entries: **idea / knob / cheapest rendering /
check asserts / reuses**.

### Act I — The bill arrives (§1–§2)

Naive thing: run Part 1's finale exactly as built, on the fabric, priced.
Visible failure: the reflash line item dwarfs everything and the rate
readout burns red. Savior: schedules, next act.

- **F1 — HERO: The Billed Wall** (built last; returns as F17 config).
  Idea: Part 1's forty-chain mosaic on z1 patches with bill strip +
  split-meter; opens in the naive schedule, bill absurd, samples-per-joule
  slot printing the naive number in error-tint (not "—": the number
  exists, it is just terrible — the IOU is its final value).
  Knob: dreams-per-second demand (drives the rate readout red).
  Cheapest rendering: MosaicHero's wall layout + chain machinery
  unchanged; bill strip below; one fabric-patch inset (not 40 live
  fabric drawings — one representative patch renders, the rest are the
  4×4 cells as in Part 1, confessed in prose as the same model).
  Check asserts: naive bill total = N·(T·REFLASH + T·READOUT + clamp
  items + sweep items) exactly per the schedule model; rate readout red
  above 1 reflash/s; glyph cells still pass Part 1's mosaic legibility
  sample (same probe).
  Reuses: MosaicHero (layout, chains, paint-box hooks), CostStrip
  (constants), part2lib (split-meter), denoise.ts, pretrained.ts.

- **F2 — The billed chain.** Idea: Part 1's DreamChain (one dream
  descending three levels) with every operation ticking the bill —
  clamp x_t (priced), sweeps (priced), readout (priced), kernel swap
  (reflash, priced); composition bars accumulate by line item in `bill`
  ink. Predict #1 sits immediately before the composition reveal.
  Knob: sweeps-per-level (Part 1's own knob, now with a price tag —
  the reader's old instrument re-armed).
  Cheapest rendering: DreamChain + the bill strip; composition bars are
  four rects.
  Check asserts: line-item totals match the schedule model closed-form;
  reflash share > 90% at default sweeps (compute exact figure, put in
  MEASURED-FACTS); knob to both ends changes sweep item linearly and
  reflash item not at all.
  Reuses: DreamChain, CostStrip constants, denoise.ts.

Waypoint 1: what you now hold — the bill's four line items and which one
owns the naive total. Section-final problem: T kernels per sample × one
reflash each ≤ once per second means this wall dreams slower than you
read. This is where scheduling comes in.

### Act II — The reflash wall and its amortizations (§3–§5)

Three repairs, one verdict. Naive → batched → conditioned → disjoint,
each a one-delta re-mount of one timeline component.

- **F3 — The op-timeline, naive vs level-batched.** Idea: the schedule
  as a visible object — a strip of priced operations; reorder the loops
  (all samples through level 3 before any swap) and reflashes drop from
  N·T to T. Knob: batch size N (1 → 64); readout: cost-per-sample curve
  falling as 1/N onto a drawn floor (sweeps + readouts + clamps).
  Cheapest rendering: NEW small component `OpTimeline` — schedule is a
  sum type {naive | batched | conditioned}, one row of priced op glyphs
  per schedule, cost-per-sample meter; no simulation, pure arithmetic on
  the schedule model (the figure is honest because the model is the
  claim). Check asserts: cost/sample(N) matches closed form at N=1 and
  N→64; floor value equals the no-reflash sub-bill exactly.
  Reuses: CostStrip constants; new component.

- **F4 — The conditioned kernel.** Idea: one energy, all levels — the
  noise level enters as extra *clamped* spins (2-spin binary code for
  t ∈ {1,2,3}), E_θ(x_t, τ_t, w, y); the σ_t-embedding trick in EBM
  form, and formally just a thermodynamic kernel with a wider clamp set
  (Part 2's formalism doing new work, said in one sentence). Two panes:
  three specialists vs one conditioned kernel, dreaming side-by-side on
  the same seeds; under each, per-level exact-oracle KL (4×4, oracle
  alive). Predict #2 immediately before the KL readout.
  Knob: level selector (shows the conditioned kernel's per-level
  conditional against that level's specialist and the exact reverse).
  Cheapest rendering: DreamCompare's two-strip pattern + PhaseTrainer's
  meter row; trainer is the NEW `denoiseCond.ts`.
  Check asserts: conditioned-kernel per-level KL within the measured
  factor of specialists (MEASURED-FACTS #2 — the claimable relation is
  whatever is measured); τ spins verified clamped (never sampled) in
  both phases; with τ code held fixed the model reduces to a specialist
  (boundary check).
  Reuses: denoise.ts (fields, CD machinery, exactConditional extended),
  DreamCompare/PhaseTrainer chrome, glyphs.
  NEW: denoiseCond.ts.

- **F5 — The floor is the clamps.** Idea: price the conditioned schedule
  honestly on the timeline — the third schedule variant. Reflashes: one,
  ever (amortized to ~0/sample). But clamping is flash-priced (verified
  §II B 2), x_t must be re-clamped every level of every sample, and the
  τ spins ride along marginally — the bill's floor emerges and is named.
  Knob: none (this is the timeline's third row appearing — one-delta).
  Cheapest rendering: OpTimeline third variant; the floor line from F3
  re-drawn now decomposed (clamps vs sweeps vs readouts).
  Check asserts: conditioned cost/sample = clamp + sweep + readout items
  only; clamp item = per-node clamp price × nodes re-clamped × levels
  (the model's stated basis — see Cost-model decisions below).
  Reuses: OpTimeline, CostStrip constants.

- **F6 — Disjoint-region alternation.** Idea: spend fabric instead —
  T kernels flashed once onto disjoint z1 patches; generation alternates
  regions with zero reflashes; the footprint counter prices the trade in
  p-bits. Knob: T (2 → 4 levels); footprint grows linearly, reflash item
  stays zero, and the 14k-anchor arithmetic (previewed in one line,
  fully cashed in Act IV) says which resource runs out first at image
  scale. Cheapest rendering: one z1 patch map (z1Graph + the ChipFabric/
  Z1Layers drawing vocabulary), regions tinted, active region lit in
  turn; bill strip + footprint counter.
  Check asserts: regions are vertex-disjoint on the real graph
  (including each kernel's hidden/chain nodes); reflash count 0 after
  setup; footprint = Σ per-kernel node counts exactly.
  Reuses: z1.ts, Z1Layers drawing code, CostStrip embedding sketch.
  NEW: region-placement helper (small, in part3lib).

- **F7 — The verdict strip.** Idea: the three amortizations on one
  canvas — cost-per-sample vs fabric footprint, the two axes of the
  trade; the article picks batched + conditioned for its finale and says
  why; disjoint regions deferred with its regime named (small T, idle
  fabric) — divergence ends in a verdict, not a survey.
  Knob: batch size N (moves the batched and conditioned points, not the
  naive one). Cheapest rendering: one scatter/bar panel, computed from
  the schedule model. Check asserts: plotted values equal the model's
  closed forms; ordering of schedules stable across the knob's range.
  Reuses: schedule model; trivially new panel.

Waypoint 2. Section-final problem: the bill now counts sweeps honestly —
so how many sweeps does a dream actually *need*, and where? The dial
returns.

### Act III — The mixing budget as a schedule decision (§6)

Naive thing: split the sweep budget evenly across levels. Visible
failure: measured per-level mixing says the levels are not equal — and
quality at fixed bill moves when the split does (IF measured; see
MEASURED-FACTS #4/#5 — if the effect is below figure scale at 4×4, the
act demonstrates on the honest sharpened variant and confesses, or the
act shrinks to one figure stating the measured null; the narrative
follows the measurement).

- **F8 — Where the stiffness lives.** Idea: MET's verified exemption
  made visible on the trained diffusion model itself — per level, the
  clamped-side couplings U (conditioning, mixing-free) vs the free-side
  couplings W (coherence machinery, mixing-taxed), alongside measured
  autocorrelation time τ_t of that level's (y,w) chain. The claim the
  figure must show in one frame: τ tracks the free-side stiffness, not
  the clamped-side (measure first; prose binds to what is found).
  Knob: level selector t = 1..3.
  Cheapest rendering: two norm bars + one τ readout per level; reuse
  MixingDial's measureMixing on denoise models.
  Check asserts: τ_t values reproduce (seeded); the U-vs-W contrast has
  the measured sign at every level; clamped-exemption probe — scaling U
  by 2 leaves measured τ within noise, scaling W by 2 does not
  (the falsifiable version of the verified MET line, run in the check
  harness, not on canvas).
  Reuses: MixingDial (measureMixing), denoise.ts / denoiseCond.ts.

- **F9 — The allocation knob.** Idea: fixed total sweep budget S; one
  knob morphs the per-level split from uniform to τ-proportional; two
  wall strips dream at the same *identical bill* and the quality
  witnesses (per-level exact KL + stray-rate) sit beneath each — the
  schedule as the last free parameter, priced at zero.
  Knob: allocation blend (one slider, uniform ↔ measured-τ-weighted).
  Cheapest rendering: DreamCompare pattern (two strips, same seeds),
  bill strip showing the totals equal.
  Check asserts: both branches' bills equal to the iteration; quality
  delta between endpoints has the measured sign and magnitude (or the
  measured null is asserted — the check encodes whichever fact is true).
  Reuses: DreamCompare, denoiseCond, schedule model.

Waypoint 3. Section-final problem: everything so far is sixteen pixels —
the oracle's last home. The machine is a quarter-million. One honest
notch up.

### Act IV — One honest scale notch (§7–§8)

Naive thing: "just add pixels." Visible failure: the exact ghost cannot
come — 2⁶⁴ states — and dense 64-pixel coupling doesn't exist on this
fabric anyway. Savior: placement (the fabric's own layering) and the
witness hierarchy.

- **F10 — Hanging the glyph on the fabric.** Idea: 64 visible pixels
  chosen on ONE color class of a z1 patch (Part 2's one-color condition,
  now load-bearing); planar ↔ layered toggle re-hangs the patch by BFS
  distance and the hidden layers appear — nobody designed a deep model;
  the placement did. Knob: the toggle (+ optional visible-set reroll).
  Cheapest rendering: Z1Layers with the visible set = the glyph's
  pixels; glyph ink on layer 0.
  Check asserts: layering theorem holds on the chosen set (adjacent-layer
  edges only); visible set is one-colored; layer populations reported
  (they become the hidden budget in MEASURED-FACTS #6).
  Reuses: z1.ts (layersFromVisible), Z1Layers.

- **F11 — 8×8 dreams, witnessed.** Idea: the fabric-native conditioned
  trainer at 8×8 — couplings only on real z1 edges within the patch,
  hidden spins = layers 1..L — dreaming beside its witness panel: a
  fenced 2×2-patch exact conditional (computable, Part 1's move), the
  pairwise-correlation error strip, and known-glyph recovery rate. The
  oracle's absence is stated on the canvas where the ghost bars used to
  be. This is the series' epistemic spine landing as apparatus.
  Knob: sweeps-per-level (the coherence knob, one last time, at the
  scale where it visibly matters).
  Cheapest rendering: DreamChain visual at 8×8 + a three-witness meter
  row; model ships pretrained (offline training run's facts recorded in
  MEASURED-FACTS #6), live paint-box NOT offered at 8×8 (confessed;
  the 4×4 wall keeps that job).
  Check asserts: fenced-patch conditional TV under the recorded
  threshold; correlation error under recorded threshold; recovery rate
  at recorded value ± tolerance; all three knobs-to-both-ends move the
  witnesses the measured way.
  Reuses: denoise.ts core (fields generalize to sparse U/W masks —
  extend, don't fork, if clean; else a sibling module), z1.ts, glyphs
  (NEW 8×8 glyph set), part2lib witnesses vocabulary.
  NEW: denoiseFabric.ts (sparse-topology trainer) + glyphs8 + offline
  training script.

- **F12 — The ceiling, by arithmetic.** Idea: the only scale figure the
  honesty rules permit — p-bits required vs image side at 1/4/8 bits per
  pixel, every curve derived on canvas from the verified 14k anchor,
  ceiling line at ~250k; our 8×8 dot far inside; the papers' 32×32–48×48
  band emerging where the 8-bit curve crosses the line. Numbers as
  dessert: the reader has just *felt* 8×8. Predict #4 (how big at
  8-bit?) immediately before.
  Knob: bits per pixel.
  Cheapest rendering: computed line chart, no simulation.
  Check asserts: 8-bit curve reproduces the anchor (≈14k at 16×16);
  crossing sits inside the verified 32–48 band; 1-bit 8×8 value equals
  F11's actual footprint (self-consistency).
  Reuses: nothing needed; trivial new panel.

Waypoint 4. Section-final problem: every piece exists — priced schedule,
conditioned kernel, honest scale, witnesses. Assemble it and read the
number.

### Act V — The billed wall of dreams (§9)

- **F13 = F1 returns — the finale config.** Idea: the wall, final
  schedule (batched + conditioned + measured allocation), bill cut by
  the measured factor from F1's opening config, **samples-per-joule as
  the headline meter beside the split-meter** — the number computed live
  from the bill under the stated model, idealizations listed in the
  figure's own margin (modeled rates; contract-not-chip; torus;
  pretrained hero). Flagged multi-knob finale (batch size, allocation,
  dreams-per-second — sliders galore, the one sanctioned knob splurge).
  Check asserts: samples/joule = (samples emitted)/(bill × J-per-iter
  estimate) to rounding; naive-vs-final bill ratio equals MEASURED-FACTS
  #7's recorded factor; split-meter panes at 4×4 match Part 1's trained
  quality (the wall never got worse while getting cheaper).
  Reuses: everything above.

Ending: Further Reading (inherit Part 1's four entries' *sources* but
write fresh sentences — sibling audit; add Thermalizers §IV E/App. K and
§IV C as "where the toy goes when it grows up," one sentence each, with
the market simulator's own hedge preserved). Final Words: three jobs from
this article's own material — the series ring closes on the wall; wonder
re-enchanted through the bill (knowing the price of a dream deepens
rather than deflates it); send the reader back to the papers and the
public code. MUST be written fresh against both siblings' endings.

## Predicts (one per act, fork rule — candidates named, adjudicated in-section)

1. **Act I (before F2's composition reveal):** one dream's bill has four
   line items — sweeps (there are thousands), readouts, clamps,
   reflashes (there are three). Which owns the total? Live fork: volume
   vs unit price; the composition bars call it.
2. **Act II (before F4's KL readout):** one shared kernel serving all
   three levels vs three specialists — does sharing cost accuracy
   everywhere, or nearly nothing? (Predict's honest answer is
   MEASURED-FACTS #2; write the options after measuring, per the
   fork-rule requirement that candidates be live.)
3. **Act III (before F9's reveal):** the sweep budget — does the noisy
   first step (soft, multimodal target) or the nearly-clean last step
   (sharp couplings) need them more? Both candidates have a physical
   claim; the measured τ calls it.
4. **Act IV (before F12):** at 8 bits per pixel, how big an image fits
   on a quarter-million p-bits? (Options bracket the verified 32–48
   band; the arithmetic reveals it.)

## Waypoints

Four act-boundary waypoints as marked, each two sentences, inventorying
what the reader can now *do* (price a schedule; amortize one; allocate a
budget; place a model). **The final Waypoint is the SERIES' waypoint** —
see §Series ring below for what it owes.

## MEASURED FACTS — placeholders that BIND prose (fill before Stage 4)

No prose may claim any item below before the measurement exists in a
check script; each becomes binding once filled, exactly as Part 2's §4
block. Placeholders:

1. **The naive bill** — exact iteration-equivalent totals and line-item
   shares for F1/F2's default config (N, T=3, k sweeps, patch sizes),
   from the schedule model. (Arithmetic, but it must be computed by the
   harness and quoted, never re-derived in prose by hand.)
2. **Conditioned vs specialists** — per-level exact KL for both, same
   seeds/budget, 4×4. The claimable sentence is whatever relation holds
   (near-parity / measured factor worse / better) — Predict #2's options
   are written from this number.
3. **The clamp floor** — conditioned-schedule cost/sample decomposition;
   the clamp item's share at default config (the "floor is the clamps"
   sentence needs its measured percentage).
4. **Per-level mixing** — τ_t (and ESS) for each trained level model;
   the U-vs-W stiffness contrast and the clamped-exemption probe result.
5. **Allocation effect size** — quality delta (per-level KL, stray rate)
   between uniform and τ-weighted splits at equal bill. If below figure
   scale: the act's honest narrative is the null + the confessed
   sharpened variant, or the act shrinks. Decide from the number.
6. **The 8×8 run** — layer populations (hidden budget), training
   wall-clock, fenced-patch conditional TV, correlation error, recovery
   rate, and the footprint in p-bits (feeds F12's self-consistency).
7. **The headline** — naive-vs-final bill ratio and the final
   samples-per-joule figure at the finale's default knobs (with its
   sensitivity to batch size stated).
8. **Frame budget** — hero and F11 per-frame cost on a mid-tier phone
   profile (feeds the WGPU decision gate below).

## Cost-model decisions (stated once, sourced, then frozen)

- Readout charged at 300 iteration-equivalents (inside the verified
  10²–10³ *energy* band; CostStrip's existing choice — keep).
- Reflash charged at 91 × 300 = 27,300 per kernel-swap event
  (CostStrip's existing choice from Appendix B's per-node ratio — keep,
  and state the simplification: the paper's figure is per-node; we
  charge per swap event at the ratio. **Refinement candidate:** price
  reflash per affected node (edges' endpoints) — decide at build; if
  adopted, clamp and reflash use the same per-node basis and the model
  gets cleaner. Flag for a one-line RESEARCH addendum: confirm Appendix
  B Table IV gives no separate clamp energy line — if it does, use it.)
- Clamping priced like flashing (verified §II B 2), charged per clamped
  node per change under the per-node basis above.
- Sweeps charged per patch-node Gibbs update (a patch sweep of n nodes =
  n/250,000 of a chip iteration — or charged in raw node-updates;
  decide at build, state on the strip, keep one convention everywhere).
- Joules: §II B estimate only, labeled "estimate"; Appendix B named in
  prose once, never in a computed number. (No-blend, rule 2.)

## WGPU decision — criteria and verdict

**Verdict: not needed for this figure set; do not build it up front.**
Workloads, sized: the 4×4 trainers and the 40-chain wall already run
CPU-live in Part 1; the conditioned trainer adds 2 clamped spins
(negligible); the 8×8 fabric-native model is ~64 visible + a few hundred
hidden sparse-degree-16 spins — per-sweep cost ~10³–10⁴ ops, and it
ships pretrained with only *generation* live (~tens of sweeps/frame).
All measurement-heavy work (τ sweeps, allocation sweeps, training) is
offline in the check harness, which stays CPU/deterministic regardless
(headless-check rule).

**Adopt WGPU only if, measured at Stage 3 (MEASURED-FACTS #8):** (a) the
hero or F11 exceeds ~8 ms/frame on the mid-tier mobile profile with the
IntersectionObserver freeze already active, or (b) a live 8×8 retrain
becomes a wanted feature and exceeds ~3 s. If triggered: port only the
block-Gibbs sweep kernel using the banked `sims/lib/gpu/` pattern
(PLAN_GPU_SOLVER.md), keep the trainer and all checks CPU, and validate
the GPU sweep against the CPU sweep on the 4×4 oracle before any figure
uses it. Scope stops there.

## REUSE map

| Existing asset | Where it goes in Part 3 | Mode |
|---|---|---|
| `denoise.ts` (CD trainer, exact oracle, witnesses) | F2, F4 base, F8, F11 witnesses | extend (sparse masks, τ clamps) |
| `glyphs.ts` / `pretrained.ts` | all dream figures / hero ships pretrained | reuse / pattern-reuse |
| `MosaicHero.tsx` | F1/F13 hero wall | extend (bill strip, fabric inset) |
| `DreamChain.tsx` | F2 billed chain | extend (bill hooks) |
| `DreamCompare.tsx` | F4, F9 two-strip comparisons | pattern-reuse |
| `PhaseTrainer.tsx` chrome | F4 meter rows | pattern-reuse |
| `CostStrip.tsx` (constants, rate readout, embedding, fmtEnergy) | every bill; F6 footprint | reuse constants verbatim (one source of truth) |
| `part2lib.ts` (split-meter, drawVisitGlow) | every chained figure's honesty pane | reuse |
| `MixingDial.tsx` (measureMixing τ/ESS) | F8, MEASURED-FACTS #4/#5 | reuse functions |
| `z1.ts` (graph, chromatic, layersFromVisible) | F6, F10, F11 | reuse |
| `Z1Layers.tsx` | F10 (visible set = glyph pixels) | extend |
| `walkCompile.ts` REINFORCE | deferred (see Risks #6) | none planned |
| `scripts/check-*` harness pattern | `check:part3` suite | pattern-reuse |

## New builds (the honest list)

1. **`part3lib.ts`** — schedule sum type {naive | batched | conditioned |
   disjoint} → op sequence → bill (pure arithmetic, the article's cost
   model in one place); bill-strip renderer; region-placement helper.
   Small, and it is the module the checks lean on hardest.
2. **`denoiseCond.ts`** — conditioned-kernel trainer (τ-code clamped
   inputs over denoise.ts machinery). Small-medium.
3. **`OpTimeline.tsx`** — F3/F5/F7 family (one component, schedule
   variants). Small.
4. **Disjoint-region figure** (F6) over z1 rendering. Small.
5. **`denoiseFabric.ts` + `glyphs8.ts` + offline train script** — the
   8×8 fabric-native trainer and its pretrained weights. **The long
   pole.** WGPU: no (see verdict).
6. **Ceiling chart** (F12). Trivial.
7. **BilledWall hero** (F1/F13) — assembly of existing parts + bill.
   Medium, built last.

## Series ring — what Part 3 pays off, and what the final Waypoint owes

Planted debts this article must redeem BY NAME (ledger-audited):

From Part 1:
- **The wall on credit** — the mosaic hero shipped pretrained weights,
  paid once by live training; Part 3 is the *third and last* appearance:
  same wall, now placed, priced, and witnessed. The series' first figure
  and last figure are the same object (ring rule).
- **"That schedule is the chip"** (§6's reveal) — Part 3 completes it:
  the schedule is also the *bill*; what the chip runs and what the chip
  charges are the same object read twice.
- **The hierarchy of witnesses** (Part 1's closing paragraphs promised
  the oracle "degrades into a hierarchy of witnesses… still on duty at
  full scale") — F11 is that promise operational: the fenced patch, the
  pinned moments, the known-answer probe doing real work at 8×8.
- **The capability boundary / embedding cost** (§7's triangle) — the
  ceiling figure is that beat grown up, by verified arithmetic.

From Part 2:
- **The split-meter** — carried to the finale unchanged in meaning; its
  honest degradation at 8×8 (fenced-patch pane) is the instrument's
  final form, foreshadowed in Part 1's ending.
- **CostStrip's constants and the once-per-second readout** — Act I is
  built directly on them; Part 2 priced one kernel swap, Part 3 prices
  an algorithm.
- **MET's clamped-spin exemption** — quoted once in Part 2, load-bearing
  in Act III (U free, W taxed).
- **The deep-BM layering (F4)** — decorative reveal in Part 2, the
  architecture itself in F10/F11.
- **The thermodynamic-kernel formalism** — the conditioned kernel is one
  sentence of new formalism ("a kernel with a wider clamp set"), which
  is the payoff of having earned the formalism properly in Part 2.
- **The floor δ̃ ≤ ε̄/(1−ρ)** — re-invoked (not re-derived) as the
  chain's warranty when the 8×8 chain runs; one sentence, one pointer.
- **The τ-leaping ancestor** (Torx §V.2) — cited once as lineage, then
  ours shown (kill-list rule).

**What the series' final Waypoint owes:** one held object, three parts —
the update rule that made noise compute (P1), the compiler that made a
fixed fabric universal at a price (P2), the schedule that makes the
price legible and payable (P3). It must inventory capabilities ("you can
now price a dream and defend the price"), not summarize; and it must be
written from this article's material, passing the sibling audit against
both prior endings (no shared skeleton — Part 1 ended on resistors in
the room, Part 2 plans "every fixed machine is a universal sampler one
compiler away"; Part 3's ending must be its own).

## Ledger (debts planted IN this article — all paid on-page)

- F1's terrible samples-per-joule number → F13 pays it (the measured
  ratio). Planted as a fact, not a schedule.
- F3's undecomposed floor line → F5 decomposes it (the clamps).
- F6's one-line fabric-arithmetic preview → F12 cashes it fully.
- Act III's τ table → F13's allocation default cites it.
- No debt crosses the article boundary; the series' remaining debts all
  terminate here (checked against both siblings' ledgers at Stage 5).

## Build order

1. `part3lib.ts` schedule/bill model + `check:part3` seed suite (the
   cost model's closed forms — checks before figures).
2. OpTimeline family (F3/F5/F7) — pure-arithmetic figures land early.
3. `denoiseCond.ts` + measurements (#2) → F4.
4. F2 billed chain (DreamChain + bill).
5. Mixing measurements (#4/#5) → F8/F9 (act shape decided by the data).
6. F6 disjoint regions; F12 ceiling chart.
7. `denoiseFabric.ts` + glyphs8 + offline training (#6) → F10/F11 — the
   long pole, start early in parallel, ships behind `draft` last if
   needed.
8. Hero F1/F13 assembly (built last, per house rule).
9. Prose per act (gate: MEASURED-FACTS filled for that act).

## Risks, ranked

1. **8×8 dream quality** — the fabric-native model may dream mush at the
   available hidden budget. Mitigation: measure first (#6); fallbacks in
   order: richer level count (T=4 gentler steps), 6×6 confessed, or the
   act's claim retreats to structure + witnesses with quality stated
   plainly. The act's load-bearing claim is placement + witnesses, not
   beauty.
2. **Cost-model overreach** — clamp/reflash per-node vs per-event basis
   is our modeling choice layered on verified constants; if stated
   sloppily it reads as a hardware claim. Mitigation: the Cost-model
   decisions block above is frozen at build, printed on the strip, and
   the RESEARCH addendum line (clamp energy in Table IV?) is resolved
   before Stage 4.
3. **Allocation act may measure a null** at 4×4 (fast mixing). Accepted
   by design: MEASURED-FACTS #5 decides the act's shape; the null is a
   publishable, honest beat ("at this size the schedule forgives you —
   the sharpened variant shows what scale will not").
4. **Hero overload** — wall + bill + split-meter + rate readout on one
   canvas; mobile legibility. Mitigation: the bill strip is the ONLY
   always-on instrument; split-meter appears in the hero's expanded
   state; mosaic mobile re-flow already exists from Part 1's pass.
5. **GPU-comparison temptation** — samples-per-joule invites "vs an
   H100" sentences we cannot verify. Fenced: the finale prints our
   modeled number and states what a comparison would require; no GPU
   number appears unless Nick commissions a research line (open
   question #1).
6. **Scope creep: REINFORCE post-training of the chain** — available
   (walkCompile) and tempting as a fourth act. Deferred: Part 2 owns
   that beat; here it is one sentence in Further Reading territory
   unless a measured quality gap at 8×8 begs for it, in which case it
   returns as ONE figure with its Part 2 split-meter warning intact.

## Open questions for Nick

1. **GPU comparison line**: keep the finale self-referential (modeled
   samples/joule, comparison left as stated arithmetic) — recommended —
   or commission a verified GPU J/sample research item for a direct bar?
2. **Palette**: approve `bill: '#db2777'` and the `visit` promotion at
   assembly.
3. **Scale notch**: confirm 8×8 (not 16×16) as the one honest notch;
   6×6 pre-approved as the confessed fallback if #6 measures poorly?
4. **Hero opening state**: naive bill shown absurd-but-computed
   (recommended) vs samples-per-joule withheld until the finale?
5. **Field/registry**: Part 3 slug + the pending `computation` field
   decision — same status as Part 2; fine to inherit `physics`?
6. **Cost basis refinement**: per-node reflash pricing (cleaner, unifies
   with clamps) vs CostStrip's current flat 27,300 per swap (already
   shipped in Part 2's figure) — if we refine here, Part 2's strip
   should follow at its assembly so the two articles never print
   different bills for the same act.
