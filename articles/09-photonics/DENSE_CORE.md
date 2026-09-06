# DENSE CORE — The Multiply Made of Light (P1 of the photonics series)

First article of the photonics series (P2 "Glass That Learned," P3 "Waves
That Anneal" — shapes in `OUTLINES.md`). Spine confirmed by Nick at the
2026-08-26 checkpoint: the claim-audit hero — the sentence "photonics does
matmuls in O(1)" made precise, then priced. Companions: `RESEARCH.md` (the
claims ledger — REQUIRED; OPEN until the McMahon + Lightmatter full reads
land; every number below traces to a ledger line), `OUTLINES.md` (act
ladder + draft intro). Anchor sources: McMahon NRP 2023 (arXiv:2308.00088),
Shen et al. Nat. Photon. 2017, Hua + Ahmed Nature 640 (2025).

## The seed

Interference is arithmetic: where two coherent beams meet, complex
amplitudes add, and a beamsplitter with phase control is a 2×2 unitary
applied to two beams. Reck/Clements: N(N−1)/2 such junctions compose any
N×N unitary; A = UΣV† buys any matrix at the price of loss. One transit
of the programmed mesh performs all N² multiply-accumulates at once, and
the transit grows only with the depth of the glass — picoseconds per row,
where a systolic array grows a thousandfold faster (Hua et al.; latency
is honestly O(N) with a picosecond constant, and the ledger's rev-2
one-sentence version is binding). Demonstrated anchor: 5 ns per full
loop on Lightelligence's shipping 64×64 core, 3 ns projected — the cycle
includes its electronics. Everything else scales against you: O(N²)
MZIs (per-device area/power/loss numbers are scout-level — own sources
owed before prose), weights loading 100× slower than data streams
(1 GHz data vs 10 MHz weights on one chip — weight-stationary or
nothing), and the conversion tax at the edges: in a Transformer-scale
analysis the light is under 1% of system energy. McMahon's crossover
(throughput/energy only, latency exempt): N ≳ 10⁴. The field's own
verdict: compute papers in Nature, interconnect products in revenue.

## The thesis (one breath)

**"Matrix multiplication in O(1)" is true and narrow: one light-transit
does all N² MACs by interference, so latency follows the depth of the
glass instead of the count of the arithmetic — while silicon area, loss,
and weight-loading all grow with the matrix, and the energy is spent at
the electrical edges, not in the light. This article builds the multiplier
from one crossing up, times it, pays its four bills in order, and ends
where the industry did: with the light carrying data between processors
rather than replacing them.**

## The hook

A matrix multiplying a vector, live: left pane the FDTD wave field — four
beams in, interference in the mesh, four beams out — right pane the same
multiply as arithmetic, each output number lighting as its beam arrives;
drag the inputs and both panes agree. The IOU is the stopwatch under the
field pane, reading the transit in picoseconds: the number on the page
that the size of the matrix barely touches. Time slowed ~10 orders of
magnitude, confessed in the first breath.

## The payoff

1. The reader steers light fully out one port of a beamsplitter using two
   phase knobs, by trial — then learns the knobs they were turning are the
   four entries of a 2×2 unitary. They were the matrix before it was named.
2. Tiling: route a 4×4 mesh junction by junction while the arithmetic pane
   assembles the product of 2×2s. Energy conservation felt as unitarity —
   the mesh flatly refuses a matrix that amplifies — and SVD (mesh,
   attenuator row, mesh) buys arbitrariness at the price of loss.
3. The stopwatch reveal (Predict moment): mesh doubles 4×4 → 8×8; the
   transit readout barely moves while the multiply count quadruples.
   The slogan lands exactly here, with its exact boundaries.
4. The four bills, one figure each: silicon O(N²) growing on screen under
   a frozen stopwatch; brightness dying layer by layer; the two-clock
   figure (weights kHz, data GHz — weight-stationary as physics, not
   preference); the energy bar where the electrical edges dwarf the
   optics. McMahon's speed-of-light debunk lands flat inside this act.
5. Shen-gap finale: phase noise injected into our own mesh drags its
   accuracy from simulation-clean toward chip-real — the mechanism behind
   Shen 2017's 76.7% experimental vs 91.7% simulated, quoted as their
   numbers. Then the landscape as epilogue: the copper wall, co-packaged
   optics shipping, Celestial→Marvell, Lightmatter publishing compute
   while selling Passage. The mesh did not lose to physics; it waits on
   its edges. Hero returns with the stopwatch legible.

## Misconception kill-list

- *Debunk (marquee):* "it computes at the speed of light." Light in
  silicon vs signals in copper differ ≲5× (McMahon: the framing is
  "neat, plausible, and wrong" — verify quote in full read before print).
  The win is all-N²-at-once, not faster travel.
- *Debunk:* "O(1) ⇒ beats GPUs." The four bills plus the N ≳ 10⁴
  crossover; 4–8 effective bits; weight-stationary only.
- *Debunk (one sentence):* photonic quantum computing (Xanadu, PsiQuantum)
  is a different subject sharing a material.
- *Never write:* "near-32-bit precision" for Lightmatter — ABFP is a
  numerics wrapper over a 6–8-bit analog core; the paper's own claim is
  "near-electronic precision for many workloads" (ledger claim 2). No
  per-model accuracy digits until the paywalled Ahmed PDF is read.
- *Never write:* Hua/PACE as an interference mesh (it is incoherent
  intensity modulation — Lightelligence's, not Lightmatter's) or its
  3 ns as demonstrated (5 ns demonstrated, 3 ns projected).
- *Omit:* WDM/frequency-comb tensor cores, PCM crossbars, free-space
  schemes (one Further-Reading sentence each); holography; Ising machines
  (P3's subject).
- *Confess:* 2D scalar TM field, not a 3D chip; teaching-scale meshes
  (4×4–8×8) with big-N figures schematic; time slowed ~10¹⁰×; boundary
  scheme named (Mur for the spike, PML if upgraded).

## Register

House voice, four standing deviations. Palette contract: input-amplitude
color, weight/phase color, readout color — the weight color becomes the
color of everything slow when the two-clock figure arrives. New-to-article
device: the **transit stopwatch** — a persistent per-figure readout
computed from grid constants (path length × n/c), never scripted; it is
the article's protagonist number and must survive the honesty checks.
Field/registry: undecided — `physics` vs a new series field (like thermo's
split); Nick's call at registration, flagged in the decision queue.
Build gates: FDTD spike green (double-slit λL/d, energy, dispersion
checks); prose gated on RESEARCH.md closing (McMahon + Lightmatter reads).
