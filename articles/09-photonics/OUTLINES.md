# OUTLINES — the photonics series (P1 intro + two follow-ups)

Written 2026-08-26, after the voice-doc reading order (ESSENCE → NICKS_VOICE →
SLOP → METHODOLOGY) and against `RESEARCH.md` (ledger OPEN — every factual
claim below traces to a VERIFIED ledger line; PRESS-level facts are marked).
Spine decision confirmed by Nick at the checkpoint: **claim-audit hero for P1**,
lens/D2NN follow-up, Ising-bridge follow-up. Figure counts and word counts
below are feasibility estimates, never quotas.

Intros are DRAFT PROSE at Stage-1/2 fidelity — written to set register and
hook, expecting revision when their hero figures exist. Each uses a different
hook move than its siblings (p-bits P1: regime contrast; learned-solver:
specimen-below-this-paragraph; these three: watch-the-object, world-anchor,
double-fact).

Series-level engineering risks, in order: (1) the WebGPU FDTD core (P1's
workhorse; de-risk with a bench spike + double-slit fringe check λL/d before
committing P1's figure list); (2) angular-spectrum propagation for P2 (needs a
WGSL FFT or an FD-BPM fallback); (3) P3's sims are ODE-scale, no risk.
Prose gates per article, from the ledger's GAPS: P1 needs the McMahon and
Lightmatter (Hua via PMC + Ahmed) full reads; P2's core claims are already
VERIFIED (Lin 2018, Pai 2023, Goodman); P3 needs Tiunov 1901.08927 + the CIM
survey 2507.14489.

---

# P1 — "The Multiply Made of Light" (working title)

**Thesis.** The sentence "photonics does matrix multiplication in O(1)" is
true, and every word of it is load-bearing: one transit of a programmed
interferometer mesh performs all N² multiply-accumulates at once, while the
silicon grows as O(N²), the weights load at a hundred-thousandth of the data
rate, and the energy is spent at the electrical edges. The article makes the
claim precise, then prices it.

**Hero figure.** A 4×4 interferometer mesh as a live wave field (WebGPU FDTD),
dual-pane: left pane is the field — four input beams whose brightness encodes
a vector, interference inside the mesh, four output beams carrying Mx; right
pane is the arithmetic it equals — the matrix, the vector, the product, each
output number lighting up as its beam arrives. One knob: drag the input
values. The IOU: a transit-time readout in picoseconds that the reader cannot
yet interpret; it returns in Act III as the entire point.

**Protagonist.** The mesh — one artifact accumulating understanding: a single
crossing of two beams → one beamsplitter → one MZI → the 4×4 mesh → the mesh
with its electrical edges attached. Palette contract: input amplitudes one
color throughout, phase-shifter settings (the weights) a second, output/readout
a third; the weight color later becomes the color of everything slow.

**Misconceptions.** DEBUNK flatly: "computes at the speed of light" (McMahon:
optical vs electrical signal velocity differs by ≲5×; the win is doing all N²
at once — the ledger's canonical statement). DEBUNK by one-sentence
distinction: photonic *quantum* computing (Xanadu, PsiQuantum) is a different
subject that happens to share a material. OMIT: wavelength-multiplexed
schemes, frequency combs, crossbars (the mesh is one honest architecture told
fully; the alternatives get one Further-Reading sentence each).

**Math budget** (earned in this order): complex amplitude addition (re-taught
from the wave-particle lesson's phasors, self-contained); the beamsplitter as
a 2×2 matrix, with unitarity forced by energy conservation; an N×N unitary as
a planned product of 2×2s (Reck/Clements — demonstrated by routing, stated
not proven); A = UΣV† to escape unitarity; transit time τ = nL/c; and the
energy ledger as arithmetic (per-MAC optical energy vs per-conversion edge
energy), not as a display equation.

## Act ladder (failure chain)

**Act I — Reading the field, and one crossing.**
Representation first: the field pane (brightness = amplitude, hue = phase),
taught on an empty pane with one source before anything computes. Then two
beams cross: amplitudes add. The reader plays inverse-solver at a beamsplitter
with two phase knobs — the task is to steer all the light out one port. After
they have done it by hand: what the two knobs were setting is a 2×2 matrix,
and this two-input two-output device is a Mach–Zehnder interferometer.
Failure driving out: our 2×2 cannot touch beams that don't meet — mixing four
inputs needs a *plan* for who crosses whom.
Figures: field-pane primer, two-beam crossing (phase knob), beamsplitter
port-steering game, MZI with both knobs + its 2×2 matrix pane.

**Act II — Tiling into any matrix.**
The mesh plan (Clements rectangle shown as a routing diagram the reader can
trace; the FDTD pane zooms one junction — same protagonist, new overlay).
Reader routes a 4×4; the arithmetic pane assembles the product of 2×2s.
Failure: program a matrix that *amplifies* — the mesh refuses; passive optics
cannot exceed unity (energy conservation, felt not cited). Savior: SVD — two
meshes with a row of attenuators between them; any matrix at the price of
loss. Waypoint 1.
Figures: routing diagram + traced permutation, 4×4 programming figure,
the amplification refusal (a knob that saturates), UΣV† triptych.

**Act III — The stopwatch, and the four bills.**
Predict moment (committed guess before the reveal): the mesh doubles from
4×4 to 8×8 — what happens to the transit-time readout? Then the reveal: the
time readout barely moves (the path got a few layers deeper) while the
multiply count quadrupled. The claim stated exactly: time follows the *depth*
of the block, picoseconds per millimeter; the work inside a transit follows
N². Numbers as dessert, each bound to a ledger line: ~1 ps/mm; a 128×128
commercial core at 3 ns per cycle (Hua et al., Nature 640). Then the bills,
one figure each:
1. **Silicon**: N-slider drives mesh area O(N²) on screen while the time
   readout holds; N(N−1)/2 MZIs, ~10⁴ μm² each.
2. **Loss**: brightness decays layer by layer (~0.25 dB each; ≈13 dB by
   16×16) — the deep-mesh precision ceiling arrives visually.
3. **The slow knob**: thermal phase shifters at kHz–ms against GHz data — a
   two-clock figure; the weight-stationary conclusion (load once, stream
   forever) stated as what the physics permits, not as a design choice.
4. **The edges**: the energy bar split into optics vs DAC/ADC conversion —
   edges dominate by up to ~10×. The speed-of-light debunk lands here,
   flat.
Waypoint 2. Effective precision (4–8 bits, shot-noise floor) closes the act.

**Act IV — Sixty years of this, and where the money went.**
Shen 2017 as the restart: 56 MZIs, a 4×4 unitary, vowel recognition — and the
teachable gap, 76.7% on the chip vs 91.7% in its own simulation; our mesh
reproduces the *mechanism* of that gap with injected phase noise (our sim,
their numbers quoted as theirs). The arc compressed: 2017 → tensor cores 2021
→ on-chip backprop 2023 → Taichi 2024 → the two Lightmatter Nature papers
2025 (ABFP: <1% task-accuracy loss vs FP32 — never "32-bit precision").
Then the landscape, honest: the copper wall, ~30% of cluster energy in data
movement, co-packaged optics shipping (Broadcom, NVIDIA — PRESS-level details
kept coarse), Celestial→Marvell, and Lightmatter selling interconnect while
publishing compute. The mesh did not lose to physics; it is waiting on its
own edges.
**Ending jobs**: hero returns understood (the reader now reads the ps
readout); re-enchant by ancestry — the oldest O(1) optical computer is a
piece of glass that has been computing Fourier transforms since before
anyone asked it to, which is the doorway to P2. Further Reading: McMahon
2023 (the article's spine source), Shen 2017, Hua/Ahmed 2025, Ambs'
60-year history.

**Scale estimate.** ~6,500–8,000 words, ~22–28 figures (FDTD family ~8,
schematic/canvas ~14, energy/timeline ~4). Checks: fringe-spacing λL/d,
energy conservation through the mesh to tolerance, 2×2 unitarity of the
programmed junction, transit-readout honesty (readout computed from grid
constants, not scripted).

## P1 intro (draft prose)

> Below this paragraph, a matrix is multiplying a vector.
>
> The pane on the left is not a diagram. It is a wave field — the same
> leapfrog scheme this site uses for water, run on a grid of glass and air,
> and I have slowed it by roughly ten orders of magnitude, because at true
> speed the whole event is over in a few picoseconds. Four beams enter on the
> left, carrying four numbers as their brightness. Inside the block they
> split, cross, and interfere, and the four beams that leave on the right
> carry the product of a matrix and a vector — every multiply and every add
> performed by interference, none of it by arithmetic. The right pane keeps
> the books: the same matrix, the same four inputs, and each output number
> lighting up as its beam arrives. You can drag the input values and watch
> both panes agree.
>
> The stopwatch under the field pane is the strange part. It reads the
> transit in picoseconds, and it is the one number on this page that does not
> care how big the matrix is. Make the matrix four times larger and the mesh
> grows to hold it — more glass, more junctions, a slightly longer walk for
> the light — but the count of multiplications inside one walk grows sixteen
> times faster than the walk does. Chip companies compress this into a
> slogan: matrix multiplication in O(1). The slogan is true. The price of it
> is written in everything around the stopwatch — in how fast the glass
> grows, in how dim the light gets, in which parts of this machine are
> allowed to change quickly and which are not — and that price is the rest
> of the article.
>
> First the arithmetic itself, because it is not obvious that ripples can
> multiply.

---

# P2 — "Glass That Learned" (working title)

**Thesis.** Propagation is a computation you can shape: a lens performs a
Fourier transform because of what glass thickness does to phase, a mask in
the right plane performs convolution, and a stack of masks can be *trained*
— learning frozen into geometry, inference at zero marginal energy. The wall
it all runs into is nonlinearity, and the wall is structural.

**Hero figure.** A trained three-mask diffractive stack. The reader sketches
a digit in the input pane; the field propagates through three frosted-looking
phase masks and piles its energy onto one of ten detector patches. IOU: the
masks look like noise; the reader trains a stack like them before the end.

**Protagonist.** One optical table — source, planes, masks — held for the
whole article, gaining overlays (a lens profile, a Fourier plane, learned
masks, a detector row).

**Misconceptions.** DEBUNK: "optical neural networks think at light speed"
(inference yes, learning no — training happened elsewhere, in gradient
descent). OMIT: holography-adjacent lore. CONFESS structurally: our
propagation is scalar and paraxial where the scheme demands it — named
solver, stated validity limits (deviation #4).

**Math budget.** Phase = optical path length (the one mechanism the whole
article spends); the quadratic phase of a lens; the convolution theorem
operationally (mask in the Fourier plane ↔ kernel); angular-spectrum
propagation (named, with its sampling condition beside the constants);
backprop through propagation = conjugate propagation (the adjoint is the
same operator run backwards — P2's payoff equation); the linear-collapse
identity M₃M₂M₁ = M.

## Act ladder

**Act I — The curtain and the lens.** World-anchor open (below). Field-pane
representation carries over from P1 (re-taught in two figures, not linked).
The reader plays inverse-solver: given a target — focus this beam — they
paint a phase mask by hand and fail informatively; the mask that works is
quadratic, and it is a lens. The focal plane holds the input's Fourier
transform, demonstrated on patterns with knowable spectra (a grid, a slit,
the curtain's weave). Failure out: a lens computes only the one transform.
**Act II — The 4f machine.** Two lenses back to back; a mask between them
multiplies the spectrum — convolution by glass. Reader swaps kernels
(edge-finder, blur, matched filter) and watches a live image convolved at
transit speed. Vander Lugt and the 1960s correlator get their history beat.
Failure out: we can *design* kernels; the kernels we want for recognition
nobody knows how to design. Savior: learn them.
**Act III — Training glass.** The D2NN move: masks as parameters, propagation
as forward pass, conjugate propagation as backward pass — the reader trains
a small stack live (in-page gradient descent, the series' train-in-browser
signature earned honestly here). Lin 2018 as dessert: 3D-printed masks,
inference at 0.4 THz, 91.75% on MNIST, passive. Then the wall, demonstrated:
stack three masks with no nonlinearity between them and train against a task
linear classifiers cannot do — the stack fails exactly as one mask fails,
because the product of linear layers *is* one layer. The fork (live, then
adjudicated): where can a nonlinearity come from — detection-and-remodulation
(works; pays the conversion tax every layer), saturable materials (fast;
power-hungry; hard to cascade), measurement feedback. Verdict: today's deep
optical networks are hybrids — optics gifts the linear layer, electronics
tolls the nonlinear one.
**Ending jobs**: the trained stack returns, now legible mask by mask;
re-enchant through the world-anchor — the curtain, the squint, out-of-focus
lights: passive computers everywhere, running whether or not anyone reads
the output. Further Reading: Goodman, Lin 2018, Pai 2023, Wetzstein 2020.

**Scale estimate.** ~5,000–6,500 words, ~18–22 figures. Engineering gate:
WGSL FFT or FD-BPM; check targets: lens-FT of a Gaussian (analytic width),
Parseval energy balance, adjoint test ⟨Ax,y⟩=⟨x,A†y⟩ to tolerance,
linear-collapse equivalence to machine precision.

## P2 intro (draft prose)

> Some evening, look at a distant streetlight through a sheer curtain. The
> point of light spreads into a neat cross of spikes — one arm for each
> thread direction of the weave, spaced wider the finer the fabric. The
> curtain is not decorating the light. It is transforming it: that cross is
> the two-dimensional Fourier transform of the curtain's own weave, computed
> by nothing but propagation, finished before the light crosses the room.
>
> The figure below runs the same physics with more ambition. Sketch a digit
> — any of the ten — in the left pane. The field passes through three plates
> that look like frosted noise, and by the right pane its energy has piled
> onto one of ten patches: the stack's answer. At run time nothing computes;
> the classification is over the moment the light lands. The plates earned
> their frost — they were trained, by gradient descent, and before this
> article ends you train a stack like them yourself.
>
> Between the curtain and the classifier there is one mechanism: glass
> changes the phase of light in proportion to its thickness, and propagation
> turns patterns of phase into patterns of arrival. Everything in this
> article — the lens, the sixty-year-old convolution machine, the trained
> plates, and the one thing none of them can do — is that sentence, rearranged.

---

# P3 — "Waves That Anneal" (working title)

**Thesis.** A pulse of light in a pumped fiber loop is forced to choose one
of two phases — a spin, decided by noise. Couple two thousand of them and the
collective settling minimizes an Ising energy: the photonic sibling of the
p-bit machine, with quantum noise where the p-bit had heat. And the machine
carries its own cautionary tale: a GPU simulating the machine's equations
beat the machine, which sharpens — not spoils — what a physical annealer
must be for.

**Hero figure.** The loop: pulses circulating as dots on a ring, each
colored by its phase choice, a coupling matrix on one side and the Ising
energy trace falling as the pump ramps. Dual-pane with the p-bit lattice
from the thermo series solving the same small max-cut — same Hamiltonian,
different noise, different clock.

**Protagonist.** One max-cut instance, held the whole article — solved by
the loop, by the p-bit lattice, and finally by the GPU simulating the loop.

**Misconceptions.** DEBUNK flatly: "the quantum optical computer" framing of
CIMs (measurement-feedback CIMs are classical dynamics seeded by quantum
noise — kept exactly as careful as the ledger allows). OMIT: none of
substance; this article exists to include the rebuttal.

**Math budget.** The Ising energy re-taught in one figure (self-contained,
lighter than T1's treatment); the DOPO's pitchfork — below threshold noise,
above threshold two phases (bifurcation diagram with the pump knob);
measurement-feedback coupling as the update rule; the annealing schedule as
pump ramp. No new formalism beyond T1's.

## Act ladder

**Act I — A coin made of light.** One pumped oscillator; pump knob sweeps
through threshold; the phase settles 0 or π, rerun lands the other way.
The p-bit sits beside it flipping thermally — two coins, two noises.
**Act II — The loop.** Time-multiplexing: thousands of spins as pulses in
one fiber, coupled by measure-multiply-feedback (the FPGA in the loop shown
honestly — the coupling is electronic, and that matters later). The machine
anneals the held max-cut instance; energy trace falls; Inagaki 2016 as
dessert: 2,048 pulses, a 2000-node cut in under a tenth of a millisecond.
**Act III — The audit.** The double fact from the intro paid in full:
Tiunov 2019 simulated the loop's own equations on a GPU and got better cuts,
faster. Demonstrated in-page: our third solver IS the simulation, and it
wins on the held instance. What survives the audit, stated as a verdict:
the loop's claim to the future rests on physics the simulation must pay for
in FLOPs (optical bandwidth, energy per pulse) and on problem classes where
the noise is the feature — and as of the ledger's sources, that case is
open, not closed. Ending jobs: the held instance solved three ways side by
side; re-enchant on the two-noises observation — heat and quantum
fluctuation, both drafted into arithmetic; the series' machines differ in
everything but their faith in noise. Further Reading: Inagaki 2016, Tiunov
2019, the 2025 CIM survey, the photonic p-bits paper (s42005-025-01953-1).

**Scale estimate.** ~4,000–5,000 words, ~12–15 figures, all ODE/CPU-scale.
Check targets: pitchfork bifurcation point vs analytic threshold, energy
trace monotonicity under zero-noise anneal, cut-value agreement between loop
sim and direct Ising evaluation.

## P3 intro (draft prose)

> In 2016, a loop of optical fiber cut a two-thousand-node graph into two
> halves — a good cut, found in less than a tenth of a millisecond — using
> nothing but two thousand pulses of light, an amplifier, and a measuring
> device that nudged each pulse according to what the others were doing. In
> 2019, a graphics card running a plain simulation of that same loop — its
> equations, unchanged — found better cuts, faster.
>
> Both results are real, both are in the ledgered record, and neither one
> cancels the other. Between them sits most of what is worth knowing about
> machines that compute by settling, and this article holds both ends: it
> builds the loop, runs it, and then stages the rematch on this page — loop
> against its own simulation, on the same problem, where you can watch.
>
> The pulse itself comes first, because the loop's whole trick is inside
> one of them: light in a pumped amplifier that is forced, as the pump
> rises, to pick one of exactly two phases. A coin — but a different coin
> than the thermal one this site has flipped before, and the difference is
> where the story starts.

---

## What this document is not

Not DENSE_COREs (those get written per-article once Nick reacts to these
shapes, and they win conflicts thereafter), not figure lists at Stage-2
fidelity, and not a substitute for the ledger's owed full reads — P1 prose
stays gated on McMahon + the Lightmatter pair, P3 prose on Tiunov + the CIM
survey.
