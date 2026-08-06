# OUTLINES — p-bits / thermodynamic sampling, three candidate shapes

> **Superseded for the ship candidate:** the synthesis (A + C's meter +
> B's hand-compile + the CRITIQUE.md extractions) is now canonical in
> `DENSE_CORE.md` + `PLAN.md`. This doc remains the record of the three
> candidate shapes. **Variant B graduated (2026-08-05)** into the series'
> Part 2 — `articles/06-z1-compiler/` — grounded in the two 2026-08-04
> papers (exact fabric, context matching, mixing–expressivity, meta-EBM);
> Part 3 (EBM diffusion under the chip's economics) is seeded at
> `articles/07-ebm-diffusion/DENSE_CORE.md`. Banked Part-1 additions not
> yet built: the p-bit oscilloscope (telegraph dwell-ratio identity, §7
> candidate) and the clockless/staleness section (async Poisson clocks
> are exact with fresh reads; staleness is the continuous-time write
> conflict — §6.5 candidate).

Three Stage-1 + Stage-2 passes at the same material: Extropic-style p-bit
hardware, block-Gibbs sampling, the Torx → Thermalizers → THRML compile stack,
and a finale that trains a tiny generative model *in the reader's browser* on a
WebGPU block-Gibbs sampler. All three share one technical spine (bottom of this
doc). They differ in protagonist, failure chain, and what the article is
*about* — pick one, bank the other two in CONCEPT_BANK.

Source material: the two papers (arXiv:2608.01615, arXiv:2608.01612), the
public Z1 spec (269,568 p-bits, sparse degree-16 two-colorable fabric,
chromatic Gibbs in situ), and the sibling thread's pbit-metal-lab design
(reference CPU sampler + exact enumeration as oracle + chromatic GPU kernel).

Field: this doesn't sit cleanly in `physics` / `waves` / `maths`. It is the
strongest candidate yet for a fourth field — `computation` — but a first
article can ship under `physics` (it is statistical mechanics made touchable)
and migrate when a sibling exists.

---

## VARIANT A — "A Computer Made of Noise"

*Bottom-up. The physics-first telling: one noisy bit → a lattice that samples →
the chip's one constraint → a model that learns. The protagonist is a lattice
that grows.*

### Stage 1 — Concept

**Wonder gap.** Every computer the reader owns spends billions of transistors
and most of its wattage *fighting* noise — margining, error-correcting,
clocking it out of existence. A company just taped out a chip that runs on
under one watt because it does the opposite: it recruits the noise as the
compute. The gap: noise is the enemy of computation in everything you know,
and the working fluid of computation in this chip.

**Thesis (one breath).** A bit that flips at random is useless; a bit that
flips at random *with a probability set by its neighbors* is a sample from a
distribution you chose — and sampling from chosen distributions is a complete
model of computation: logic, optimization, and learning fall out of one update
rule plus a temperature.

**Persistent protagonist.** One lattice of p-bits, on screen from the first
figure to the last. It starts as a single coin, gains a bias knob, gains a
neighbor, gains a graph, gains colors, gets frozen into the Z1 topology, and
in the finale the *same lattice* is the negative-phase engine of a training
loop. The lattice accumulates; nothing is thrown away.

**Hero figure.** The full WGPU lattice (64×64, degree-16, two colors) running
thousands of sweeps per second — and *it is drawing a picture*. A clamped
boundary + trained couplings make a recognizable glyph emerge from the flicker,
dissolve, and re-emerge, never twice the same way. IOU as flat declarative:
every pixel of this is a coin being flipped; by the end the reader has set
every weight that biases the coins. The hero returns in the finale as the
sampler inside the training loop — the picture it draws is then one the
*reader taught it*.

**Misconception kill-list.**
- *Debunk:* "random flipping = simulated annealing = of course it finds low
  energy." The article's marquee failure (§5) shows a sampler that optimizes
  fine and samples completely wrong — optimization success is not sampling
  correctness.
- *Debunk:* "update everything at once, it's all random anyway." The
  synchronous-update pathology is shown live, with the exact answer as ghost.
- *Omit:* qubits entirely, except one flat sentence of amnesty ("no
  superposition anywhere in this article; these are classical coins"). The
  attractive wrong frame is quantum; we starve it.
- *Omit:* Ising-model physics history (Onsager, phase transitions) beyond one
  dessert number; this is a computation article, not a magnetism article.
- *Confess-and-retire:* our simulator is the *idealized* chip — real silicon
  has gain variation, offsets, timing skew; confessed in §7 with one
  nonideality slider, not modeled throughout.

**Math budget (earned, in order).**
1. $P(s_i{=}{+}1) = \sigma(2\beta(h_i + \textstyle\sum_j J_{ij} s_j))$ — the
   whole update rule, earned by §3 after the reader has *been* it by hand.
2. $E(s) = -\sum_{(i,j)} J_{ij} s_i s_j - \sum_i h_i s_i$ and
   $p(s) \propto e^{-\beta E(s)}$ — earned together in §4: the local rule and
   the global law are the same fact.
3. Total-variation distance $\tfrac12\sum_s |p(s) - q(s)|$ — earned in §5 as
   "the height of the mismatch you are looking at," not as a definition.
4. The contrastive-divergence update
   $\Delta J_{ij} \propto \langle s_i s_j\rangle_{\text{data}} - \langle s_i s_j\rangle_{\text{model}}$
   — earned in §8 where the reader has just clamped (data phase) and
   free-run (model phase) the same lattice by hand.

### Stage 2 — Skeleton (failure chain)

**§1 — The coin with a knob.** *Naive build:* a fair coin, flipped forever.
*Visible failure:* it computes nothing — the running histogram is flat no
matter what you want. *Savior:* give the coin an opinion. Figures: (1a) hero,
up front, unexplained; (1b) single p-bit as a flickering cell + live histogram
filling beside it; knob = bias $h$, and the histogram leans as you drag. The
sigmoid is drawn *by the histogram* — sweep the knob and the recorded means
trace the S-curve on screen before it is ever named. Math: $\sigma$ arrives as
the shape the reader just drew.

**§2 — Representation.** Teach the display before anything moves (METHODOLOGY
Stage-2 rule 2): cell = p-bit (two colors of ink for ±1), edge thickness =
$|J|$, edge hue = sign, halo = clamped. One static-but-pokeable figure; click
any cell to flip it and watch its neighbors' *probabilities* (shown as small
gauges) shift. This figure is reused-with-overlay for the rest of the article.

**§3 — Two coins that gossip.** *Naive:* two independent biased coins.
*Failure:* no setting of two separate knobs can make them *agree with each
other* (correlation meter pinned at 0 while the target says 0.9). *Savior:*
the coupling. Figures: pair of cells + $J$ knob + 2×2 outcome histogram vs
target ghost. Predict moment #1: "$J$ negative — before you drag, which two of
the four bars grow?" Math moment: eq. 1, now with the sum over one neighbor.

**§4 — The mountain range you can't see.** Energy landscape for 3–4 spins:
every state a column, height $e^{-\beta E}$, the sampler a token hopping
columns. Temperature slider = $\beta$; cold freezes it into the deepest
column, hot flattens everything. The Boltzmann distribution *is this figure* —
the interactive "Boltzmann distribution to visualize all mathematical
concepts" ask from the seed thread lives here. Waypoint after §4: you now hold
one rule (local sigmoid) and one law (global Boltzmann), and they are the same
object read locally vs globally.

**§5 — The marquee failure: everyone talks at once.** Scale to a 16×16 grid.
*Naive:* update every cell simultaneously each tick — it's embarrassingly
parallel! *Visible failure:* checkerboard oscillation artifacts on screen, and
the histogram-vs-exact ghost (on a small window of the lattice) shows the
sampled distribution diverging — TV meter climbs. Sequential updates (one cell
at a time) are correct but the sweep counter crawls. This is the section the
sibling thread's TV numbers ground: chromatic ≈ 9×10⁻⁴, synchronous ≈ 0.45 —
numbers as dessert *after* the reader has seen the checkerboard. Math: TV
distance as the mismatch height.

**§6 — The two-coloring rescue.** Red/black checkerboard overlay on the same
grid: freeze black, flash all red at once, then swap. Same parallelism,
correct distribution — TV meter falls back to the chromatic floor. The reader
toggles sequential / synchronous / chromatic on one figure and watches both
the speed counter and the TV meter. Then the reveal, stated flat: this is not
a simulation trick; it is the native instruction of the actual chip —
two-colorable degree-16 fabric, red half-sweep, black half-sweep, in silicon.
Predict moment #2 (before the toggle): "chromatic updates half the cells at
once — does the wrongness meter land near sequential's or near synchronous's?"

**§7 — What the chip cannot do.** Try to program a triangle (three mutually
coupled cells) onto the two-colorable fabric — the figure lets the reader
attempt the coloring and fail. Savior: embedding — an auxiliary chained spin,
with the cost shown (one logical variable = several physical cells, chain
penalty knob). One nonideality slider here (gain jitter) as the confessed
distortion. Waypoint: the chip is not a sea of free p-bits; it is one fixed
update rule on one fixed graph, and *programming it means shaping energy*.

**§8 — Finale: the lattice learns.** The training loop, in-browser, on the
WGPU sampler. Task: 8×8 binary glyphs (a tiny built-in set, plus a paint-box
so the reader can add their own). Clamp data → measure $\langle s_i
s_j\rangle$; free-run → measure again; nudge $J$ by the difference. Figures:
(8a) the two phases side by side on the same lattice, correlations
accumulating as heat-strips on the edges; (8b) the loss curve + samples
drawn every N epochs, arranged as a filmstrip — the model's dreams sharpening;
(8c) the hero returns: the opening figure, now with the reader's own trained
weights, drawing the reader's own glyph out of noise. Math: eq. 4, then one
flat paragraph naming this as the negative-phase role Extropic's stack assigns
the hardware — the chip is the dreaming half of the loop.

**Ending.** Land: noise, given neighbors, is a programmable distribution;
learning is two measurements and a subtraction. Re-enchant: the reader's own
laptop GPU just did what the one-watt chip does with thermal noise in
transistors — and the transistor version doesn't need the GPU's gigahertz
clock, because physics *is* the clock. Send back to the world: the thermal
flicker in every resistor around you is this article's working fluid, going
unused.

**Feasibility.** ~5,500–7,000 words, plan-stage ≈ 35–45 figures (diagnostic,
not quota). Everything before §5 is Canvas-2D closed-form (cheap). §5–§8 need
the WGPU sampler — one ping-pong kernel pair, far simpler than the fluid
solver. Highest-risk figure: 8b's training loop (CD on 8×8 glyphs is
well-conditioned; risk is UX pacing, not math). Hero requires trained weights
shipped as a constant — trained once offline by us, honestly disclosed.

**Why this variant wins:** the cleanest failure chain in the set; the lattice
protagonist gives maximal figure reuse-with-overlay; the marquee failure
(synchronous vs chromatic) is *visually* arresting and is the single most
load-bearing idea in the whole p-bit literature. **Why it loses:** the compile
stack (Torx/Thermalizers) gets only §7's gesture — the reader leaves without
the "it's a compiler target" frame that makes the company's bet legible.

---

## VARIANT B — "Compiling Into Heat"

*Top-down. The compiler-first telling: start from a stochastic program the
reader writes, and the article is the story of translating it, stage by stage,
onto hardware that can only do one thing. The protagonist is a program.*

### Stage 1 — Concept

**Wonder gap.** The reader has heard "new AI chip" a hundred times; every one
of those chips runs the same instruction — multiply-accumulate. This chip's
only instruction is *flip a coin whose bias your neighbors set*. The gap: how
does anything you'd recognize as a program — a random walk, a logic gate, a
diffusion model — run on a machine with one probabilistic instruction and a
frozen wiring diagram? Answer: the same way C runs on transistors — a compiler.
Nobody has shown the reader a compiler whose target language is *heat*.

**Thesis (one breath).** A stochastic program is a chain of conditional
distributions; an energy model with some pins clamped *is* a conditional
distribution; so compiling a program for this chip means finding couplings
whose clamped equilibrium matches each step of your program — the compiler's
output is not code but a landscape.

**Persistent protagonist.** One stochastic program: a walker on a small graph
(the Torx random-walk example, made visual — a token hopping nodes with
programmed probabilities). The article compiles *this same program* all the
way down: program → kernel table → energy model → embedded on the two-color
fabric → sampled by the WGPU engine. At each stage the walker's distribution
is re-measured against the top-level spec — the program survives translation
or the figure shows exactly where it leaks.

**Hero figure.** Split pane. Left: the walker program running as written — a
token hopping a five-node graph, occupancy histogram filling. Right: a lattice
of flickering p-bits with five cells haloed as outputs, its read-out histogram
filling beside the left one. The two histograms converge live. IOU, flat: the
right pane contains no walker, no rules about walking — only biases and
couplings; the distance between the panes is a compiler, and we are going to
build it.

**Misconception kill-list.**
- *Debunk:* "it's a general p-bit chip; you upload your algorithm." The whole
  article is the debunk — native instruction set shown as a five-row table in
  §2 (bias, couple, clamp, sweep; *nothing else*).
- *Debunk:* "compilation is exact." Thermalizers is trained, variational,
  approximate — the leak meter (TV between spec and compiled kernel) is on
  screen from §4 onward and never reads zero.
- *Omit:* quantum, annealing-race-with-D-Wave discourse, device physics.
- *Confess:* we compile with gradient descent in the browser on toy kernels;
  the paper's Thermalizers handles richer families — confessed where our §5
  trainer first runs.

**Math budget.** (1) Kernel as conditional table $K(y|x)$ — earned as the
walker's hop table. (2) Clamped-equilibrium conditional
$K_\phi(y|x) = \frac{\sum_w e^{-E_\phi(x,w,y)}}{\sum_{y',w} e^{-E_\phi(x,w,y')}}$
— earned in §4 by the one-bit noisy-copy example where it collapses to
$\sigma(2J)$ and the reader solves $J = \tfrac12\log\frac{0.9}{0.1}$ *by
dragging.* (3) Gibbs conditional (as in Variant A, but arriving as "the target
machine's semantics"). (4) The variational compile loss
$D(K \,\|\, K_\phi)$ minimized over $(h, J)$ — earned when the reader watches
the leak meter descend under training.

### Stage 2 — Skeleton (failure chain)

**§1 — A program that rolls dice.** Build the walker in a visible "program"
notation (boxes and arrows, not Python — code snippet in prose beside it,
Torx-shaped). Run it; occupancy histogram = the program's meaning. *Failure
driving forward:* none yet — this section is representation (the display
teach) plus the hero.

**§2 — The target machine's whole manual.** The five-instruction table, and a
bare fabric figure: a two-colored degree-16 patch where the reader can set a
bias, set a coupling, clamp, and step — and nothing else; every affordance the
reader reaches for that doesn't exist is *visibly absent.* *Failure:* the
walker cannot even be written down here. *Savior:* find the machine's native
math.

**§3 — What the machine actually computes.** Compressed Gibbs teaching (the
material Variant A spends §§1–6 on, at half depth): sigmoid rule, Boltzmann
law, chromatic sweep — three figures, one per idea, each with the exact-ghost
overlay. The synchronous pathology appears as *one* toggle-and-see figure,
not a full section. Waypoint: the machine is an equilibrium engine; programs
are non-equilibrium stories; the gap between those two sentences is the
compiler's job.

**§4 — Compile one instruction by hand.** The noisy-copy gate: spec says
"output = input, but flip 10% of the time." One coupling, clamped input; the
reader drags $J$ until the measured flip-rate meter hits 10% — they have
hand-compiled a stochastic instruction into a landscape. Then the closed form,
then the reveal that their hand-found $J$ matches $\tfrac12\log 9$. Predict
moment #1: "to make the copy *more* faithful, does $J$ go up or down?"
Follow-on figure: XOR needs a *hidden* p-bit — the reader tries two-bit
couplings, fails (the leak meter won't go below a floor), adds one hidden
cell, and the floor gives way. Hidden variables arrive as a *felt necessity*,
not an architecture choice.

**§5 — Compile by search.** The walker's five-way hop table is too rich for
hand-tuning. Build the trainer: gradient descent on $(h,J)$ against the leak
meter, running live. Filmstrip of the compiled kernel's distribution
converging on the spec. *Failure into next section:* the compiled model uses a
dense little graph — and the fabric is sparse and two-colored.

**§6 — Place and route on the freezer.** Embed the §5 model onto the fabric
patch: coloring conflicts, chain spins, the physical-cells-per-logical-bit
counter climbing. The reader drags cells to place them; illegal edges glow.
Waypoint: the compiler's output is couplings *and* a floor plan; the price of
one frozen wiring diagram is paid in extra spins, and Z1's published numbers
(269k p-bits, 216k couplings) are dessert here — how many *logical* variables
that buys depends on everything this section just showed.

**§7 — Finale: a program that is nothing but noise.** Discrete diffusion as
the limiting case: the forward process is *literally* the machine's native
act (add noise), so the learned reverse kernel is the one program this
machine was born to run. Train it in-browser: 8×8 glyphs, a small chain of
denoising kernels each compiled as a clamped energy model on the WGPU
sampler; the training loop is the §5 trainer scaled up. Closing figure: the
hero returns, but the left pane's "program" is now the denoising chain and
the right pane is drawing glyphs — spec and silicon-shaped sampler, matched.
Predict moment #2 before first sample: "we trained on these six glyphs —
will it draw one of the six, or something between?"

**Ending.** Land: a compiler whose object code is a landscape. Re-enchant:
every layer of translation the reader just performed — semantics, hand
compile, search, place-and-route — is the same ladder C took to transistors,
run again for a machine whose transistors are allowed to be wrong on purpose.
Send back: the next "new chip" headline the reader sees, they will ask the
only question that matters — *what is its one instruction, and what compiles
to it?*

**Feasibility.** ~6,000–7,500 words, plan-stage ≈ 30–40 figures. Riskiest in
the set: §5/§7's in-browser compile loop is a real trainer (small — dozens of
parameters — but pacing and convergence UX need care), and §6's place-and-route
figure is bespoke interaction design with no sibling in the repo. §3
compresses the material other variants make load-bearing — if the compression
fails for cold readers, this variant needs a prerequisite article (Variant A
§§1–6 as its own shorter lesson).

**Why this variant wins:** it is the only one that teaches the actual shape of
Extropic's bet (the stack, the approximation, the embedding tax) — the
untold-story claim is strongest here; nobody has popularized "compiler to
equilibrium." The protagonist-program device (one artifact re-measured at
every translation stage) is a genuinely novel ring. **Why it loses:** heaviest
prerequisite load; the Gibbs material compressed in §3 is itself a full
article; two bespoke high-risk figures.

---

## VARIANT C — "The Wrongness Meter"

*Correctness-first. The sampler-science telling: the article's spine is not
the chip but the oracle — exact enumeration and a total-variation meter that
never leaves the screen. Every section makes the sampler faster or more
hardware-like, and the meter says what that move cost. The protagonist is the
meter itself.*

### Stage 1 — Concept

**Wonder gap.** A sampler can be spectacularly fast and completely wrong, and
*nothing on its output shows it.* The stream of states looks random either
way; low energies show up either way. The gap: randomness is the one output a
human eye cannot audit — and the entire p-bit industry rests on machines whose
only product is randomness. How would you ever know the chip isn't lying?

**Thesis (one breath).** For small systems the truth is computable — sum all
$2^n$ states — so every claim about a sampler can be turned into a single
number, the distance between what it produced and what it should have
produced; carry that number with you and speed claims become honest, schedule
bugs become visible, and "hardware nonidealities" become measured costs
instead of vibes.

**Persistent protagonist.** The meter: a two-histogram instrument — exact
Boltzmann bars as a fixed ghost, live sampled bars filling over them, TV
distance as one number beneath. Introduced in §1 on a system small enough to
trust, it is present in *every subsequent figure* (reuse-with-overlay taken
literally: the article is one instrument pointed at successively worse
samplers). This is the house's "named solvers" deviation promoted to
protagonist — the simulation is the subject matter.

**Hero figure.** Two lattices racing, identical flicker, identical energy
traces — and the meter reads 0.0009 under one, 0.45 under the other. IOU,
flat: one of these is a sampler and one is a very fast random-pattern
generator; every visible statistic you'd think to check agrees between them;
the number under each pane is the only witness, and building that witness is
the article.

**Misconception kill-list.**
- *Debunk (marquee):* "it found the minimum, so it works." §5 stages an
  optimization race the broken sampler *wins* while its meter reads 0.4.
- *Debunk:* "more updates per second = better sampler." §6's autocorrelation
  figure shows a billion correlated updates losing to a million independent
  ones — effective samples per second as the honest speed.
- *Omit:* the compile stack entirely (one forward-pointing sentence); quantum.
- *Confess:* the oracle dies at ~20 spins — stated the moment it happens
  (§6), which is itself the section's point: past the oracle's edge you keep
  the *instruments* (autocorrelation, ESS) and lose the ground truth,
  and that is the actual epistemic situation of everyone who buys this chip.

**Math budget.** (1) Boltzmann law + sigmoid rule (compressed, §§1–2). (2) TV
distance — earned first of the majors, §1, as the meter's read. (3) Detailed
balance $p(s)P(s{\to}s') = p(s')P(s'{\to}s)$ — earned in §4 as "the bookkeeping
identity the synchronous update breaks," with a two-state ledger figure the
reader balances by hand. (4) Integrated autocorrelation time and
ESS = $N/(1+2\tau)$ — earned in §6 from a figure the reader has just misread
(a beautiful low-variance trace that is secretly one sample repeated).
(5) CD update, finale, as in Variant A.

### Stage 2 — Skeleton (failure chain)

**§1 — Build the witness.** Four frustrated spins, all 16 states enumerable.
Build the meter on screen: bars for each state from brute-force summation
(the code snippet in prose is the honest nested loop), then a naive
single-site sampler filling live bars over the ghost. Watch TV fall as
$1/\sqrt{N}$-ish. Representation section and protagonist-forging in one.
Predict #1: "double the sampling time — where does the meter land?" (The
reader who guesses "half" meets the square root; first dessert number.)

**§2 — The rule under the flicker.** Sigmoid conditional + temperature, on the
same four spins, meter running. Cold/hot sweep: the meter shows the sampler
*staying correct* while the distribution itself changes shape — separating
"the target moved" from "we missed it," the distinction the whole article
turns on. Waypoint: two different things can now be read off any sampler —
where it aims and whether it hits — and they need different instruments.

**§3 — Go parallel, go wrong.** Scale to 16 spins (65,536 states — enumerable
with a progress bar; the cost is shown, planting §6's cliff). Synchronous
update: meter jumps to ~0.45 and *stays*; energy trace looks fine; the
optimization race is staged and the broken sampler wins it. This is the
article's marquee moment and it is the meter's proof-of-worth: nothing else
on screen catches the lie.

**§4 — Why it broke, and the ledger.** Detailed-balance as a two-state
transaction ledger the reader balances; the synchronous update's stale reads
shown as a literal race: two adjacent cells each deciding off the other's
*old* value, the impossible checkerboard bursting out. Savior: independence —
freeze half, flash half. Chromatic sweep; meter falls to the floor. The chip
reveal lands here (this is silicon's native schedule), kept to one paragraph
— in this variant the chip is a *guest*, not the subject.

**§5 — Make it hardware-shaped, pay the meter.** One figure, five nonideality
knobs, one at a time (one-knob rule preserved by tabbing): weight
quantization to 8 bits → meter cost; gain variation → cost; offset → cost;
stale/delayed reads → cost; sticky bits → cost. Each knob's price is a
measured number, not an adjective. Dessert: the published sub-1W / 50MHz
figures, immediately re-framed by the meter's question — MHz *of what
quality*? Waypoint: "hardware-realistic" is not one thing; it is five priced
line-items, and you have now priced them.

**§6 — Past the oracle's edge.** 64×64 WGPU lattice: enumeration is now
$2^{4096}$ — the ghost bars wink out, confessed on screen. What survives:
autocorrelation time (the trace that fooled the reader), ESS/sec as the
honest speed, and the exact small-window check (enumerate an 8-spin patch
conditioned on its frozen boundary — the oracle lives on locally). The
"billion correlated updates vs million independent ones" race runs here.
Predict #2: "raise the temperature — does the autocorrelation time rise or
fall?"

**§7 — Finale: the meter becomes the loss.** The training loop (same
technical build as Variant A §8: glyphs, CD, WGPU negative phase) — but
framed as the meter's apotheosis: the difference-of-correlations *is* a
wrongness measure between data and dream, and descending it is learning.
The hero returns: two lattices racing again, but now the reader can say in
one sentence which is which, and the closing move re-runs the §3 race with
the trained model — the broken schedule doesn't just mis-sample, it
*mis-learns*, and the filmstrips of the two models' dreams diverge on screen.

**Ending.** Land: one number stands between a stochastic computer and an
expensive noise machine, and the reader can now compute it. Re-enchant: the
oracle dies at twenty spins forever — no future computer escapes that
$2^n$ — so all trust in machines like Z1 will rest on exactly the
instruments the reader just built; they hold the actual state of the art.
Send back: the next benchmark headline — "50 million samples per second" —
now reads as a question, and the reader knows it.

**Feasibility.** ~4,500–6,000 words, plan-stage ≈ 25–35 figures — the *leanest
build in the set* because the meter amortizes: one instrument component, one
CPU enumerator (trivial), one WGPU sampler, and most figures are the same
scene with one changed schedule or knob. Also the most headlessly checkable —
every figure's claim is literally a number the check script can assert
(the repo's check-figures harness fits this article like a glove). Risk:
tone — five sections of measurement could go dry; the optimization-race
theater in §3/§7 and the ledger-balancing in §4 are the counterweights.

**Why this variant wins:** most house-shaped — "named solvers" and the
honesty rules aren't compliance here, they're the plot; cheapest to build;
the marquee debunk (§3) is the single most valuable instinct anyone entering
this field can own, and no popular telling has it. **Why it loses:** the chip
and the learning story are guests rather than subjects — a reader who came
for "explain Extropic" gets an epistemology article (a *great* one, but
that's a bet); least wonder-forward hook of the three.

---

## Shared technical spine (all variants)

**The WGPU block-Gibbs stepper** — fits `sims/lib/gpu/` as built:

- Buffers: `spins: u32[chains × n]` (±1 packed as 0/1), `J: f32[n × 16]` +
  `neighbors: u32[n × 16]` (ELLPACK, degree-16), `h: f32[n]`,
  `clampMask/clampVal`, `color: u32[n]`. Ping-pong via the existing
  `FieldPair`; one dispatch per color per sweep (command ordering *is* the
  barrier — same reasoning as the fluid solver's pass split).
- RNG: counter-based hash of `(chain, site, sweep, color, seed)` — PCG/xxhash
  mix in WGSL. Determinism is an honesty rule here, not a convenience:
  Reset must re-run `create` to an identical trajectory.
- Kernel body is five lines: gather neighbor spins → field = h + Σ J·s →
  p = 1/(1+exp(−2βfield)) → u = hash() → write ±1. State the schedule's
  correctness condition in a comment beside the color tables (the analog of
  the solver's stability-condition comments): *no intra-dispatch edge — the
  coloring guarantees it by construction.*
- CPU reference sampler + exact enumerator (n ≤ 20) live beside it as the
  parity oracle — same pattern as `GpuParityCheck.tsx`, and the TV number is
  the parity metric. This gives every variant its headless figure checks
  for free.
- Observables accumulate on-device (means, pair-correlations, energy
  histogram); read back summaries every N sweeps, never full states per frame.

**The in-browser training finale** (variants A §8, B §7, C §7): 8×8 binary
glyphs (built-in set + reader paint-box), visible-only Boltzmann machine or
one-hidden-layer RBM on the degree-16 fabric, CD-1 with the WGPU sampler as
negative phase, parameter updates on CPU from read-back correlation sums
(dozens of milliseconds per epoch at this size — comfortably live). Ship a
pre-trained fallback state so the finale is never blank on slow devices;
disclose it.

**Palette contract sketch (fixed at first appearance, per house rule):**
spin-up ink vs spin-down ink (the two-state pair, highest-contrast slot);
ferro/antiferro coupling hues (red/blue family); *exact/ghost always the
same gray in every figure of the article*; clamp halo; meter/readout color
reserved as in existing lessons.

**What the sibling thread got right that we keep:** exact enumeration as
oracle; TV as the headline correctness number; synchronous-vs-chromatic as
the load-bearing demonstration; counter-based RNG; ELLPACK degree-16;
"optimization success ≠ sampling correctness." **What we do differently:**
no Metal/MLX (browser WGPU on the repo's existing GPU kit); figures are the
argument per house rules (no notebook-style examples); the math is *earned*
on the methodology's protocol rather than stated; and the story is one of
the three rings above rather than a curriculum list.

## Recommendation

Build **A** first — it is the sound pedagogical spine and its §§1–6 are
prerequisite to B's compressed §3 anyway. **C's meter is too good to lose:**
fold its protagonist-instrument *into* A (the exact-ghost + TV readout as
A's persistent overlay from §3 on — the skeletons are compatible), which
captures C's marquee debunk inside A's failure chain at near-zero extra
figure cost. Bank **B** whole in CONCEPT_BANK as the natural sequel — it
becomes buildable and better once A exists to point back to.
