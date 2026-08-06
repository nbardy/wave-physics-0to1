# DENSE CORE — Compiling Into Heat (Part 2 of the p-bit series)

The Extropic-specific sequel to `articles/05-pbits/` (Part 1, "A Computer
Made of Noise"). Part 1 taught the physics on a deliberately generic
substrate and revealed the chip; this article is about *their actual stack*:
Torx → Thermalizers → THRML → Z1, with the real topology, the real cost
model, and the compiler's real failure modes. Companions: `PLAN.md` (the
skeleton), `RESEARCH.md` (claims-to-verify ledger — REQUIRED reading: most
hardware numbers below arrived via a second-hand paper summary and must be
verified against arXiv:2608.01612 (Torx) and arXiv:2608.01615
(Thermalizers) before any prose ships).

## The seed

Two papers, published 2026-08-04. Torx: Parametrized Stochastic Circuits —
typed local stochastic kernels composing over explicit wires (`pbit` /
`pdit` / `pmode`), a gate-based IR for stochastic programs. Thermalizers:
compile each factor of a Directed Factor Graph into a hardware-native
Energy-Based Model — the **thermodynamic kernel**: partition the spins
$V = V_{\text{in}} \cup V_{\text{hid}} \cup V_{\text{out}}$, clamp the
input, marginalize the hidden, normalize over the output:
$P^F(y|x) = \tfrac{1}{Z^F(x)}\sum_w e^{-E(x,w,y)}$. Z1: a sparse,
locally-connected, two-colorable graph, mostly regular of degree 16 —
node $(x,y)$ couples to $(x{+}a,y{+}b),(x{-}b,y{+}a),(x{-}a,y{-}b),(x{+}b,y{-}a)$
for $(a,b)\in\{(1,0),(2,1),(2,3),(4,1)\}$ — ~250k nodes, **two couplings
per edge** (directional), $10^6$–$10^7$ Gibbs iterations/second at
~$3\times10^{-10}$ J per iteration; readout costs 100–1000 iterations;
reflashing couplings is expensive. The economics, not just the physics.

## The thesis (one breath)

**A stochastic program is a wiring of conditional kernels; this chip runs
exactly one thing — Gibbs sweeps on a fixed sparse landscape — so a
compiler must re-express every kernel as a clamped, hidden-augmented
energy model and pay three taxes to place it: an embedding tax (spins),
a context tax (a kernel trained on inputs its program never sends is
fitted to a lie), and a mixing tax (expressivity bought with strong
couplings is repaid in autocorrelation). This article makes all three
taxes visible and pays them on the real fabric.**

## The hook

Part 1 ended holding a trained thermodynamic kernel and a stack diagram.
Cold open here: the reader's random walk — five nodes, a token hopping
with programmed probabilities (Torx's own first example, PSWAP/PNOT
gates) — running as written on the left; on the right, the same walk
allegedly compiled onto a patch of the *actual* Z1 graph. The two
occupancy histograms match. Then the hero's IOU, flat: the right pane is
lying in a way the histogram cannot see — run the walk for a hundred
steps instead of one and the compiled version *leaks*, mass drifting to
places the program never goes. The distance between one-step-perfect and
trajectory-honest is this whole article.

## The payoff

1. The reader generates the real Z1 fabric from its four offset rules and
   discovers the two facts hiding in them: every offset has odd parity, so
   the checkerboard coloring survives — and hanging the graph by a few
   chosen visible nodes re-layers it into a deep Boltzmann machine
   (planar ↔ layered, one toggle; strictly no same-layer edges, which is
   the bipartite proof drawn rather than stated).
2. They compile the walk kernel-by-kernel and watch isolated compilation
   fail at trajectory scale (the leakage lab): uniform-context training →
   error pooled exactly where the program lives; visitation-weighted
   training → the leak seals. $\mathcal L = \sum_x q(x)\,D_{\mathrm{KL}}(K\|\tilde K)$
   with $q$ painted as glow on the input axis.
3. The λ-shift deep cut: two energies with the *same* forward kernel and
   different priors — forward-invariant, backward-different. What the
   compiler fixes is not unique, and what it leaves free matters the
   moment anything runs in reverse.
4. The mixing-expressivity dial (their Appendix L, made touchable): raise
   the coupling cap and KL-to-target falls while autocorrelation explodes
   — Part 1's meter and dashboard reunited on one knob.
5. Meta-EBM finale: a 12-spin fully-connected model — a graph the fabric
   *cannot host* — compiled as thermodynamic kernels and sampled through
   the Z1 patch anyway: the chip Gibbs-sampling a machine it cannot
   natively express. The hero returns trajectory-honest.

## Misconception kill-list

- *Debunk (marquee):* "each kernel compiled well ⇒ the program compiled
  well." Per-kernel KL is a lie at trajectory scale; the leakage lab is
  the debunk.
- *Debunk:* "the fabric is a grid." It is four strange knight-moves that
  happen to stay bipartite; the layered view shows what it really is.
- *Debunk:* "250k p-bits = 250k variables for your problem." Embedding +
  hidden spins + readout/reflash economics say otherwise (numbers as
  dessert, after the taxes are felt).
- *Omit:* device physics beyond Part 1's microscope; quantum (amnesty
  inherited); financial/ecology demos (named once as the papers' own,
  not built).
- *Confess:* our sampler is the idealized contract (THRML-style block
  Gibbs); asymmetric two-coupling mode breaks detailed balance and is
  shown once as a fenced curiosity, not modeled throughout.

## Register

House voice, four standing deviations, Part 1's palette contract and rail
inherited verbatim (TARGET → ENERGY → SAMPLER → SUBSTRATE — this article
lives mostly on the first arrow). New-to-this-article device: the
**program/trajectory split-meter** — every compiled figure carries two
numbers, per-step KL and trajectory-occupancy TV, and the article's story
is the gap between them. Field `physics` (P3) pending the `computation`
field decision; the two papers are the epigraph-grade primary sources and
Further Reading anchors.
