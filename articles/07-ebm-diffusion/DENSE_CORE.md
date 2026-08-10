# DENSE CORE — Diffusion on a Dreaming Machine (Part 3)

Full Stage-1 core, expanded 2026-08-10 from the seed (thesis and scale
anchors decided in the seed are preserved verbatim in substance; this
document wins conflicts with later drafts). Companions: `PLAN.md` (the
Stage-2 skeleton), `articles/06-z1-compiler/RESEARCH.md` (the closed,
VERIFIED claims ledger — the fact universe for every hardware number in
this article; Part 3 adds no new hardware claims, only arithmetic on
verified ones), `articles/PBITS_SERIES_HANDOFF.md` (series state).

Series position: Part 1 built the physics and a true conditional-diffusion
finale at toy scale; Part 2 built the compiler and made the chip's three
taxes (embedding, context, mixing) visible and payable. Part 3 is the
payoff both were saving: **train and run an EBM diffusion model under the
chip's actual economics** — and, in doing so, close the series' ring.

## Thesis (one breath — decided, unchanged)

Diffusion is a *sequence* of conditional kernels, and that word "sequence"
is where the chip's real costs live: every noise level is a kernel, every
kernel is a reflash, every sample is a readout — so designing a diffusion
model for a Gibbs machine is not "make each denoiser accurate" but
"minimize reflashes, amortize readouts, and spend coupling strength where
the mixing budget allows," and the article trains one honestly under that
bill.

## The hook

Part 1 ended on a wall of forty dreaming lattices and a benediction about
resistors. Part 2 ended holding a cost strip whose reflash line item is
91× its readout line item, with a hard rule printed beside it: reflash no
more than about once per second. Cold open here: the same wall of dreams,
re-hosted — every chain now a patch of the real Z1 fabric — with one new
instrument bolted on: **a running bill**, charged in Gibbs-iteration
equivalents, every sweep and readout and reflash ticking it upward. Run
the wall the obvious way (each dream descends its three noise levels, each
level is its own kernel, each kernel swap is a reflash) and the bill is
absurd on sight: the reflash line item devours everything else on the
strip, and the once-per-second rate readout burns red before the second
dream finishes. The IOU, flat: the dreams on this wall are the same dreams
Part 1 trained in front of you — nothing about their *correctness* is in
question, and the split-meter beside the bill will keep proving it. What
is in question is the price. This wall returns at the end running the
identical model, dreams indistinguishable, bill cut by a factor the
article measures — and a samples-per-joule number, computed live from
verified constants, printed where the IOU used to be.

## The hero (closes the SERIES' ring, not just this article's)

**The Billed Wall**: Part 1's mosaic hero — the same forty-chain wall, the
same glyph family, the same reverse-diffusion loop — carried across all
three parts and now wearing the full stack it was always secretly running
on: fabric patches from Part 2's z1.ts underneath, Part 2's split-meter
proving per-step and trajectory honesty beside it, and Part 3's bill strip
pricing every operation in iteration-equivalents first, joules second.
Part 1's hero shipped its weights on credit and paid that debt by training
them in front of the reader. Part 2's hero was a program that lied in a
way one histogram couldn't see. Part 3's hero owes nothing about
correctness — every witness that can still speak already agrees — and
instead opens owing *money*: the ring the whole series terminates on is
the wall, dreaming the same dreams, at a price the reader can now read,
reduce, and defend. The final figure is the first figure of Part 1,
understood three levels deep: distribution, compiler, bill.

## The payoff, performed

The reader doesn't receive the answer; they perform it:

1. They re-run Part 1's dream chain with the bill attached and watch the
   reflash line item bury sweeps and readouts — then predict which line
   dominates before the composition bars reveal it.
2. They reorder the loops themselves (knob: batch size): all samples
   through level 3 before any kernel swap — and watch cost-per-sample fall
   toward a floor that no batch size can pierce.
3. They train ONE conditioned kernel — the noise level entering as extra
   clamped spins, the σ_t-embedding trick in EBM form — and check it
   against three specialists on the exact oracle, per level, before
   trusting it with the wall.
4. They price the conditioned schedule honestly and meet the bill's true
   floor: clamping is flash-priced, and you cannot dream without clamping
   the evidence — the floor of the bill is the clamps.
5. They spend fabric instead of reflashes: T kernels flashed once onto
   disjoint fabric regions, alternated by schedule — and watch the
   footprint counter price the trade the other way.
6. They allocate a fixed sweep budget across noise levels with one knob
   and watch where coherence is actually bought — Part 2's mixing dial
   returned as a *schedule decision*.
7. They hang a 64-pixel glyph on one color class of the real fabric and
   watch the hidden layers appear by BFS — architecture nobody designed —
   then train it fabric-native, past the oracle's edge, judged by the
   hierarchy of witnesses Part 1's ending promised.
8. They read the final number — samples per joule, modeled from verified
   constants, every idealization confessed on the same canvas — off the
   wall they met in Part 1's second paragraph.

## The insights, ranked (each must survive into the final draft)

1. **The sequence is the price.** The chip's headline is per-iteration
   energy; the bill is set by the *schedule* — reflashes (91× readout),
   readouts (10²–10³ iterations of energy each), clamps (flash-priced),
   and only then sweeps. An algorithm for this machine is a schedule
   first and a model second. This is the article's marquee claim and the
   reflash wall is its demonstration.
2. **Amortization is loop reordering plus conditioning — and the
   divergence ends in a verdict.** Batch-per-level reorders the loops
   (T reflashes total, not T per sample); the conditioned kernel shares
   parameters across levels (the level index becomes clamped input spins
   — one flash, ever); disjoint-region alternation spends fabric to buy
   zero reflashes. Three repairs, one comparison strip, one winner chosen
   for the finale with reasons (batched + conditioned), one deferred with
   its regime named (disjoint regions win when T is small and fabric is
   idle).
3. **The bill has a floor, and the floor is the clamps.** Clamping is
   priced like flashing (verified, §II B 2). Every reverse step must
   clamp the evidence x_t; no schedule escapes it. The amortizations
   don't abolish the bill — they strip it down to the part that *is* the
   algorithm.
4. **Mixing budget is a per-level schedule decision — and conditioning is
   free while coherence is not.** MET's verified exemption ("clamped
   spins do not enter this tradeoff") splits the trained model down the
   middle: the input couplings U ride the clamped side at no mixing cost;
   the hidden-to-output couplings W — the machinery that makes sixteen
   pixels conspire — are what autocorrelation taxes. Sweeps should go
   where the W's are sharp. Measured per level, then allocated by knob.
5. **The fabric's layers are the architecture.** Choose which physical
   p-bits are your pixels and the hidden layers are not designed — they
   are where the rest of the graph hangs, by BFS distance from the
   visible set (Part 2's F4, paying off structurally). Deep models on
   this chip are a *placement decision*.
6. **The oracle's death is survivable — the witnesses take over.** At
   8×8 the exact ghost is gone (2⁶⁴ states) and Part 1's closing promise
   becomes operational: fenced-patch exact conditionals, pinned moments,
   correlation meters, known-answer probes — every instrument built at
   toy scale, on duty past the edge. The series' epistemic spine lands
   here, doing real work.
7. **Scale is arithmetic, not hope.** The verified anchor — an 8-bit
   embedding costs ~14,000 p-bits, so 250k reaches 32×32–48×48 — turns
   every "could this fit" sentence into a computation the reader watches.
   Our 8×8 binary glyphs sit far inside the ceiling; the article says so
   by arithmetic and never by enthusiasm.
8. **Samples-per-joule is the honest headline — modeled, confessed,
   and computed in front of the reader.** One number, derived live from
   the verified constants under the article's stated cost model, with the
   no-blend energy rule enforced on canvas (the §II B estimate and the
   Appendix B per-node figure never averaged, never mixed).

## Misconception kill-list

- **Debunk (marquee): "the chip's energy advantage is its per-op
  energy."** Per-iteration joules are the seed of the advantage, not the
  advantage. A sequence-structured workload pays reflash, readout, and
  clamp; schedule badly and the 91× line item erases the headline number.
  Act I–II are the debunk.
- **Debunk: "diffusion on chip = run the UNet on p-bits."** Nothing
  UNet-shaped survives compilation; the reverse kernel IS the energy
  model — clamp, marginalize, normalize. One flat sentence early, then
  the conditioned kernel shows what the σ_t embedding actually becomes
  (clamped spins, not feature maps).
- **Debunk: "more p-bits = bigger images."** Embedding (p-bits per
  logical variable) and mixing (sweeps per usable sample) set the real
  limit; the ceiling figure computes it from the verified anchor.
- **Omit: continuous diffusion / score matching.** Binary/discrete only;
  one amnesty sentence, then never again.
- **Cite-once, then ours: the papers' τ-leaping discrete-diffusion demo**
  (independent PNOTs + K=50 PCNOTs on binary MNIST, BER 0.114 → 0.113,
  41% of the FID gap closed — Torx §V.2, VERIFIED) is the acknowledged
  ancestor of our factorized-vs-coupled beat. Named once as lineage; our
  chain is conditional-EBM, not τ-leaping, and the article shows its own.
- **Confess (standing, on-canvas): every economic number is a modeled
  rate from verified paper constants — nothing on any bill is a
  measurement of physical hardware.** The confession is chrome on the
  bill itself, not a footnote.
- **Confess: the browser simulates the chip's contract, not the chip** —
  THRML-style chromatic block Gibbs on the published topology; z1.ts is
  a torus where the die is a truncated grid (documented idealization,
  Part 2).
- **Confess: the hero ships pretrained** (Part 1's own device, third
  use — the wall retrains live at 4×4 where the oracle audits; the 8×8
  notch trains offline with its training run's facts stated).

## Scale anchors (VERIFIED — RESEARCH.md, Thermalizers §IV E / Appendix K)

The papers' own Gaussian-circuit demo sets the honest ceiling: fixed-point
spin registers via minor-embedded chains, an 8-bit embedding costing
~14,000 p-bits, so a 250,000-p-bit Z1 array reaches roughly **32×32 to
48×48** fine grids — verbatim-verified. Their compiled posterior matched
exact inference (RMSE 0.259 ± 0.005 vs 0.260 ± 0.006, random placement
0.305 ± 0.008) — with the binding softening: per-pick agreement is weak
(top-1 35%, top-3 63%); prose cites both or neither. Part 3's glyph scale
(4×4 → 8×8 binary) is comfortably inside that ceiling, which is the
article's license to say "this would fit" with arithmetic instead of
hope. Every scale claim in this article is derived on canvas from the
14,000-p-bit anchor and the 250k node count; no other scale source is
admitted.

## Register

House voice, four standing deviations, Part 1's palette contract and the
TARGET → ENERGY → SAMPLER → SUBSTRATE rail inherited verbatim (this
article lives on the SAMPLER → SUBSTRATE arrow and adds the price of
walking it). Part 2's split-meter carries over as the standing honesty
instrument; it is never the story here — it is the *witness that the
story never traded honesty for money*. New-to-this-article device: **the
bill** — every figure that runs the machine carries a cost strip charging
iteration-equivalents first, joules as a labeled secondary conversion
under the no-blend rule. The bill is this article's persistent second
protagonist the way the meter was Part 1's. Its color is new to the
palette (see PLAN §Palette). One vow, this article's own: **no billed
figure may show a cheaper schedule without showing, on the same canvas,
the witness that quality did not silently pay for it.** Cheapness claims
and honesty claims travel together or not at all.

Field `physics` (P4 in sequence) pending the `computation` field decision
(same status as Part 2). The two papers remain the epigraph-grade primary
sources; Further Reading inherits and extends Part 1's entries with the
Gaussian-circuit appendix and the market-simulator section as "where the
toy goes when it grows up."

## Dependencies

Part 2's z1.ts (fabric, layering) + CostStrip (verified cost constants,
once-per-second readout, embedding sketch) + split-meter (part2lib) +
MixingDial (τ/ESS measurement) + closed RESEARCH ledger; Part 1's
denoise.ts trainer + glyphs + DreamChain/DreamCompare/MosaicHero +
pretrained-weights pattern. New work: the conditioned-kernel trainer, the
schedule/bill model, the fabric-native 8×8 trainer, and the figures named
in PLAN §New builds. Part 2's REINFORCE estimator is available
(walkCompile, exact, gradient-verified) if a post-training beat earns its
place — currently deferred, see PLAN §Risks.
