# DENSE CORE (seed) — Diffusion on a Dreaming Machine (Part 3)

Series position: Part 1 built the physics and a true conditional-diffusion
finale at toy scale; Part 2 built the compiler and the chip's taxes. Part 3
is the payoff both were saving: **train and run an EBM diffusion model
under the chip's actual economics.** Seed-stage only — expand to full
DENSE_CORE + PLAN when Part 2 reaches Stage 3.

## Thesis (one breath)

Diffusion is a *sequence* of conditional kernels, and that word "sequence"
is where the chip's real costs live: every noise level is a kernel, every
kernel is a reflash, every sample is a readout — so designing a diffusion
model for a Gibbs machine is not "make each denoiser accurate" but
"minimize reflashes, amortize readouts, and spend coupling strength where
the mixing budget allows," and the article trains one honestly under that
bill.

## The spine (candidate)

1. Reprise Part 1's glyph chain — now billed: a running energy/time meter
   charges every sweep, readout, and reflash at the (verified) Z1 rates.
2. The reflash wall: T noise levels = T kernel swaps per sample the naive
   way; amortizations — batch all samples per level; share parameters
   across levels (one conditioned kernel vs T kernels — the σ_t-embedding
   trick in EBM form); place two levels on disjoint fabric regions and
   alternate without reflashing.
3. Mixing budget per level: cold levels need strong couplings (Part 2's
   expressivity–mixing dial returns as a *per-level* schedule decision).
4. Scale one honest notch: 8×8 glyphs on the real fabric topology via
   Part 2's embedding, hidden layers as the fabric's own
   deep-Boltzmann layering (Part 2 F4 pays off structurally).
5. Finale: the wall of dreams, billed — samples/joule as the headline
   meter beside the split-meter; the number that decides whether any of
   this beats a GPU, computed in front of the reader at toy scale with
   every idealization confessed.

## Kill-list (seed)

Debunk: "diffusion on chip = run the UNet on p-bits" (nothing UNet-shaped
survives; the reverse kernel IS the energy model). Debunk: "more p-bits =
bigger images" (embedding + mixing set the real limit). Omit: continuous
diffusion/score matching (binary/discrete only, one amnesty sentence).
Confess: all economics are modeled rates from Part 2's RESEARCH ledger,
not measurements of physical hardware.

## Scale anchors (third pull, corroborated-detailed — VERIFY before prose)

The papers' own Gaussian-circuit demo sets the honest ceiling: signed
fixed-point spin registers, an 8-bit embedding costing ~14,000 p-bits,
so a 250k-p-bit array reaches roughly 32×32–48×48 grids — and their
compiled posterior matched exact inference (RMSE 0.259 vs 0.260) where
random sampling sat at 0.305. Part 3's glyph scale (4×4 → 8×8 binary) is
comfortably inside that ceiling, which is the article's license to say
"this would fit" with arithmetic instead of hope. Their discrete-diffusion
demo (τ-leaping reverse as independent PNOTs + a few PCNOTs to restore
local correlations, measured on binary MNIST) is the direct ancestor of
our factorized-vs-coupled beat — cite once, then show ours.

## Dependencies

Part 2's z1.ts + embedding + split-meter + verified cost numbers; Part 1's
denoise.ts trainer (reuse, conditioned-kernel variant is new work);
Part 2's REINFORCE estimator (spec now in RESEARCH — negative-phase-only
clamping, reward-shaped for per-site occupancy targets).
