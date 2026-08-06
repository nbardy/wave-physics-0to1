# DENSE CORE — A Computer Made of Noise

The compressed inspiration of the article: hook, payoff, ranked insights,
each in its sharpest form. Companions: `PLAN.md` (the skeleton this core
unfolds into), `OUTLINES.md` (the three candidate shapes this synthesis
merged — A's spine, C's meter, one B figure), `CRITIQUE.md` (the six-way
comparison that fixed the merge list). If a draft sentence ever conflicts
with this document, this document wins.

## The seed

Extropic's Z1: ~250,000 p-bits on a sparse, mostly-regular degree-16
two-colorable fabric, running chromatic block-Gibbs in silicon at an
estimated ~3×10⁻¹⁰ J per Gibbs iteration, 10⁶–10⁷ iterations/second
(arXiv:2608.01615, arXiv:2608.01612 — numbers per the papers' own
estimates; the once-circulated "269,568" figure and any total-wattage
claim are NOT paper facts and were scrubbed from prose 2026-08-05). Every computer the reader owns spends
most of its transistors and watts *fighting* noise — margining it,
clocking it out, correcting it away. This chip recruits the noise as the
compute. The sibling exploration thread (pbit-metal-lab) supplied the
article's two hardest-won numbers: a correct chromatic sampler sits ~9×10⁻⁴
from the exact distribution; the obvious all-at-once parallel update sits
~0.45 — and *nothing visible on its output shows it*.

## The thesis (one breath)

**A bit that flips at random is useless; a bit whose flip probability is
set by its neighbors is a sample from a distribution you chose — and
sampling chosen distributions is a complete form of computation. But
randomness is the one output the eye cannot audit, so the article builds
two things in parallel: the machine, and the witness that catches it
lying.**

## The hook

Cold open on the wonder gap: noise as computation's oldest enemy versus a
chip whose working fluid it is. Then the hero figure (rev. 2 — the mosaic):
a wall of dozens of independent little 4×4 lattices, each flickering
through its own dream, glyphs condensing out of static across the
population — never the same glyph twice, never in the same place, but
recognizably *from one family*. The machine's product is visibly a
distribution, not a picture. IOU as flat declarative: every cell is a p-bit
being flipped; the weights were trained, and by the end the reader will
have trained their own and watched their own glyph spread across this wall.
(Confessed on the spot: the hero ships pretrained; the finale retrains live
at the same 4×4 scale — the hero and the finale are the SAME model, which
is the point of the mosaic.)

## The payoff

The reader doesn't receive the answer; they perform it:

1. They lean a single coin with a bias knob and watch its histogram trace
   the sigmoid before the sigmoid is ever named.
2. They fail to make two independent coins agree, then wire them together
   and succeed — coupling as felt necessity.
3. They forge the witness: exact enumeration as ghost bars, the live
   sampler filling against them, total variation as one number.
4. They watch the obvious parallelization *win an optimization race while
   sampling a completely wrong distribution* — the meter as the only
   witness — then rescue it with a two-coloring and watch the meter fall
   back to the floor. Then the flat reveal: that schedule is the chip.
5. They hand-compile one instruction: drag a single coupling until a
   noisy-copy gate's flip-rate meter reads 10%, and meet ½·log 9 as the
   number their own hand found.
6. They train the lattice on glyphs they painted: clamp (data phase),
   free-run (dream phase), subtract — and the hero returns drawing *their*
   glyph with *their* weights.

Closing benediction: the thermal flicker in every resistor around the
reader is this article's working fluid, going unused.

## The insights, ranked (each must survive into the final draft)

1. **One rule, one law, same fact.** The local update
   $P(s_i{=}{+}1)=\sigma(2\beta(h_i+\sum_j J_{ij}s_j))$ and the global law
   $p(s)\propto e^{-\beta E(s)}$ are the same object read locally versus
   globally. Noise plus neighbors equals a programmable distribution.
2. **Optimization success is not sampling correctness — and only an
   instrument can tell them apart.** A broken sampler finds low energies
   fine; its states look random either way. For small systems the truth is
   computable ($2^n$ terms), so every claim becomes one number: the
   distance between produced and intended. This is the rarest instinct in
   the field and the article's second protagonist.
3. **All-at-once parallelism samples the wrong law; coloring is the exact
   repair.** Update everything simultaneously and adjacent cells decide on
   each other's stale values — checkerboard artifacts, TV ≈ 0.45. Freeze
   black, flash red, swap: every red cell is conditionally independent
   given black, so the parallel update is *exactly* Gibbs. TV ≈ 9×10⁻⁴.
   Same parallelism, correct distribution.
4. **The chip is a Gibbs machine, not a sea of free p-bits.** Its whole
   instruction set: set biases, set couplings, clamp, sweep red/black.
   Programming it means shaping energy; a triangle doesn't fit a
   two-colorable fabric and costs auxiliary spins to embed. (The
   capability boundary, made pokeable — affordances visibly absent.)
5. **Compilation, taught (rev. 2 — a compact real act, not one figure):**
   a stochastic instruction is a kernel table $K(y|x)$; a single coupling
   compiles noisy-copy exactly ($J=\tfrac{1}{2\beta}\log 9$, β locked at 1
   on screen, the reader's hand finding it first); noisy-XOR *cannot*
   compile without a hidden p-bit, and the reader watches the error floor
   refuse and then collapse when one is added — that trained conditional
   energy model is a thermodynamic kernel, the object **Thermalizers**
   fits, represented in **THRML** terms (biases, couplings, blocks,
   clamps), specified in **Torx** terms (kernels and circuits). The full
   composition/context/place-and-route story stays the sequel (OUTLINES
   variant B), planted as one flat sentence on the stack figure.
6. **Learning is two measurements and a subtraction — and the finale is
   honestly conditional (rev. 2).** Positive phase: clamp the noisy input
   $x_t$ AND the cleaner output $y$, sample hidden spins. Negative phase:
   clamp only $x_t$; sample $w, y$ by block Gibbs. Nudge each wire by the
   disagreement. Per noise level this trains a true reverse kernel
   $K_{\theta_t}(x_{t-1}|x_t)$ — a diffusion denoising chain, not an
   unconditional Boltzmann machine wearing diffusion's clothes (the flaw
   the review caught in rev. 1). The sampler is the dreaming half of the
   loop; that is the job the real stack assigns the hardware. And the
   forward corruption is a *simple stochastic program*, not "the machine's
   native act" — the native act is Gibbs on a programmed landscape, which
   is exactly what learns to run the corruption backwards.
7. **Independence fails visibly before coupling is allowed to succeed.**
   The factorized reverse model trains in seconds and its dreams are
   recognizably wrong — per-pixel right, jointly incoherent. Correlations
   as felt necessity, in learning as in §3's two coins.
8. **The pipeline, never blurred: TARGET → ENERGY → SAMPLER → SUBSTRATE.**
   The distribution you want is not the (h, J) landscape that encodes it;
   the landscape is not the schedule that samples it; the schedule is not
   the silicon that runs it. A persistent four-slot rail on every figure
   keeps the reader oriented — and Thermalizers is *the arrow* from TARGET
   to ENERGY, which the §8 stack figure says in exactly those words.
   (Rev. 2: the rail names transformations, not disciplines.)
8b. **The hardware dictionary (physical ⇄ mathematical, Nick's demand).**
   A p-bit is a noisy comparator: thermal noise supplies the dice, a bias
   DAC supplies h, neighbors feed weighted currents through programmable
   conductances — that current sum IS the local field, and the comparator's
   transfer curve IS the sigmoid. The wire is not a metaphor; it is a
   conductance, and σ is what a noisy threshold does. Taught in §2, drawn
   as a circuit in §7 (F17).
9. **Stationarity is visible — and the parallelism discriminator is write
   conflicts, not move arity (rev. 2).** For n ≤ 5 the whole state space
   fits on screen: states as nodes, single-flip transitions as edges, the
   chain a dot whose visit frequencies converge on the node sizes. The
   teleport display contrasts sequential vs synchronous ONLY — a chromatic
   half-sweep also flips many spins at once, so multi-bit moves prove
   nothing against it. What separates legal from illegal parallelism is
   whether any two simultaneously *written* spins share an edge: sequential
   1 writer/0 conflicts, chromatic many writers/0 conflicts (hence
   $p(s_R|s_B) = \prod_{i\in R} p(s_i|s_B)$, exactly), synchronous many
   writers/many conflicts. The write-conflict panel (F12) is the honest
   proof.

## Misconception kill-list

- **Omit (starve): quantum.** One flat amnesty sentence — no superposition
  anywhere in this article; these are classical coins — then never again.
  The attractive wrong frame gets no oxygen.
- **Debunk (marquee): "it found the minimum, so it works."** §5 stages the
  race the broken sampler wins. Insight 2 is the debunk.
- **Debunk: "more updates per second = better."** Correlated samples;
  effective-samples-per-second as the honest speed, shown on the §6
  dashboard beside raw updates/sec.
- **Debunk: "it's a general p-bit chip; you upload your algorithm."** §7's
  pokeable capability boundary.
- **Confess-and-retire: the idealized chip.** Real silicon has gain
  variation, offsets, timing skew — confessed in §7 with one nonideality
  knob whose cost the meter prices, not modeled throughout.
- **Confess: the oracle dies at ~20 spins.** Enumeration is the article's
  ground truth and it does not scale; stated the moment the lattice
  outgrows it, with the local-window check as the honest survivor.
- **Confess: the hero ships pre-trained**; the finale retrains live at
  4×4–5×5 where enumeration still audits single steps.

## Register

Ciechanowski craft plus our four standing deviations (math cashed out;
prediction before reveal; waypoints; named solvers — here the named solver
is the *schedule itself*: chromatic Gibbs, counter-based RNG, one dispatch
per color, correctness condition stated by construction). This article's
own two vows: **(a)** every figure that makes a distributional claim
carries the exact ghost or names why it can't (past the oracle's edge);
**(b)** the thesis's two halves — noise computes, and only an instrument
can prove it — each land exactly once at full load, §6's reveal and §5's
race respectively, and are not diluted by repetition.

Field: `physics` (statistical mechanics made touchable); revisit a
`computation` field when the B-sequel exists. Status: `planned` until
Stage 3 opens.
