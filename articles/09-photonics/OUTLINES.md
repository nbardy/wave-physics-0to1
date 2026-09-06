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
specimen-below-this-paragraph; these three: watch-the-object,
trained-artifact, double-fact). P2's first intro draft (streetlight-curtain
staging) was flagged by Nick 2026-08-26 — "the corniest fucking metaphors" —
and is the founding incident of SLOP family 21 (the greeting card); the
replacement below opens cold on the trained plates.

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
of the block — honestly O(N), growing by picoseconds per row where a
systolic array grows a thousandfold faster; the work inside a transit
follows N². Numbers as dessert, each bound to a ledger line: ~1 ps/mm; a
shipping 64×64 core cycling at 5 ns demonstrated / 3 ns projected,
round-trip including its electronics (Hua et al./Lightelligence, Nature
640 — an incoherent architecture, cited for timing only, never for
interference). Then the bills, one figure each:
1. **Silicon**: N-slider drives mesh area O(N²) on screen while the time
   readout crawls; N(N−1)/2 MZIs (per-MZI area/power figures pending
   their own sources — ledger GAP 7); McMahon's countable gap: a 64×64
   does >100× too few parallel ops to compete on throughput.
2. **Loss**: brightness decays layer by layer — the deep-mesh precision
   ceiling arrives visually (specific dB numbers pending ledger GAP 7).
3. **The slow knob**: weights load 100× slower than data streams —
   1 GHz data modulators against 10 MHz weight modulators on one chip
   (Hua) — a two-clock figure; the weight-stationary conclusion (load
   once, stream forever) stated as what the physics permits, not as a
   design choice.
4. **The edges**: the energy bar split into optics vs DAC/ADC conversion —
   in a Transformer-scale analysis the light is under 1% of the total
   (McMahon citing Anderson). The speed-of-light debunk lands here,
   flat, with its sharpest number: light in a silicon waveguide (0.4c)
   is slower than a signal on a PCB trace (0.43c).
Waypoint 2. Effective precision (4–8 bits, shot-noise floor) closes the act.

**Act IV — Sixty years of this, and where the money went.**
Shen 2017 as the restart: 56 MZIs, a 4×4 unitary, vowel recognition — and the
teachable gap, 76.7% on the chip vs 91.7% in its own simulation; our mesh
reproduces the *mechanism* of that gap with injected phase noise (our sim,
their numbers quoted as theirs). The arc compressed: 2017 → tensor cores 2021
→ on-chip backprop 2023 → Taichi 2024 → the Nature 640 pair 2025
(Lightelligence's PACE hardware + Lightmatter's quad-core systems paper;
"near-electronic precision for many workloads" is the honest wording —
never "32-bit precision," and no per-model digits until the paywalled
paper is read).
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
> transit in picoseconds, and it is the number on this page that the size
> of the matrix barely touches. Make the matrix four times larger and the mesh
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

**Act I — The lens, built by hand.** Cold open on the trained plates (below).
Field-pane representation carries over from P1 (re-taught in two figures, not
linked). The reader plays inverse-solver: given a target — focus this beam —
they paint a phase mask by hand and fail informatively; the mask that works
is quadratic, and it is a lens. The focal plane holds the input's Fourier
transform, demonstrated on patterns with knowable spectra (a grid, a slit, a
woven mesh — and the one-sentence world check, stated flat: a streetlight
seen through sheer curtain fabric spikes into the weave's transform).
Failure out: a lens computes only the one transform.
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
re-enchant on the passive-computation fact stated cold — the diffraction
patterns in everyday optics are this article's figures running unattended.
Further Reading: Goodman, Lin 2018, Pai 2023, Wetzstein 2020.

**Scale estimate.** ~5,000–6,500 words, ~18–22 figures. Engineering gate:
WGSL FFT or FD-BPM; check targets: lens-FT of a Gaussian (analytic width),
Parseval energy balance, adjoint test ⟨Ax,y⟩=⟨x,A†y⟩ to tolerance,
linear-collapse equivalence to machine precision.

## P2 intro (draft prose — rewrite 2, after the family-21 flag)

> The three plates in the figure below were trained by gradient descent,
> and that was the last computation anyone will ever run on them. You can
> sketch a digit in the left pane; the wave crosses the plates and arrives
> with its energy piled onto one of ten patches, and that patch is the
> stack's answer. Nothing executed. There are no weights to fetch and no
> multiplies to schedule, because the weights are the thicknesses of the
> glass, and the multiply happened when light went through it.
>
> One mechanism carries everything here: glass delays the phase of a wave
> in proportion to its thickness, and propagation turns patterns of phase
> into patterns of arrival. A lens is the special case with a quadratic
> profile — the one optical computer everyone already owns. The machines
> that convolved images optically in the 1960s were the general case,
> designed by hand; the plates above are the general case, found by
> training. What none of them can be is deep. The obstruction is
> structural, not an engineering gap, and the demonstration — three
> trained plates failing in exactly the way a single plate fails — is the
> last act's job.
>
> The lens comes first, built by hand.

---

# P3 — "Waves That Anneal" (working title)

**Thesis.** A pulse of light in a pumped fiber loop is forced to choose one
of two phases — a spin, decided by noise. Couple two thousand of them and the
collective settling minimizes an Ising energy: the photonic sibling of the
p-bit machine, with quantum noise where the p-bit had heat. And the machine
carries its own cautionary tale, twice over: two independent GPUs — one
running textbook annealing, one simulating the loop's own equations —
matched or beat it on its own benchmarks, because the expensive step, the
matrix–vector multiply, is digital in the physical machine too. The
electrical edges eat the advantage here exactly as they do in P1 — the
same law, in an unrelated architecture — which sharpens, not spoils, what
a physical annealer must be for.

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
one fiber, coupled by measure-multiply-feedback — and the multiply is the
FPGA's, shown honestly: the coupling arithmetic is electronic, and 2,808
of the cavity's 5,056 pulse slots exist solely to stall while it computes
(the plant for Act III). The machine anneals the held max-cut instance;
energy trace falls; Inagaki 2016 as dessert: 2,048 pulses, a 1-km cavity,
a 2000-node cut in 5.0 milliseconds — with its authors' own disclosures
attached (timing excludes data transfer; success rates post-selected).
**Act III — The audit.** The triple fact from the intro paid in full,
in order: King 2018 (plain mean-field annealing, equal cuts, ~20×
faster), then Tiunov 2019 (SimCIM — the loop's equations minus the
nonlinear loss — better cuts at comparable speed; "comparable" is their
own word and the honest one). The mechanism named flat: the optics
stores spins and adds noise; it never multiplies — and the 1 ns FPGA
deadline forces couplings to 0 and ±1, so the hardware is less
expressive than its own simulator. Demonstrated in-page: our third
solver IS the simulation, and it wins on the held instance. Then the
2026-grade energy accounting: the measurement-feedback machine spends
10.45 of its 15.69 watts on converters and transceivers while an
all-digital solver does everything on 4.09 — the conversion tax alone
outweighs the whole rival. What survives, stated as a verdict: the
fully-optical variant's estimated ~100× time-to-solution edge is a
prefactor, not a scaling law, at toy sizes, on a machine that does not
yet exist at scale — and the field's own critics conclude the fix is
more optics, not less. Ending jobs: the held instance solved three ways
side by side; re-enchant on the two-noises observation — heat and
quantum fluctuation, both drafted into arithmetic; the series' machines
differ in everything but their faith in noise. Further Reading: Inagaki
2016, King 2018, Tiunov 2019, Khosravi et al. 2025 (the
Langevin-reframe energy audit), the photonic p-bits paper
(s42005-025-01953-1). Gate: read Leleu 2021 (chaotic amplitude control
— the CIM camp's strongest live counter) before this act's prose ships.

**Scale estimate.** ~4,000–5,000 words, ~12–15 figures, all ODE/CPU-scale.
Check targets: pitchfork bifurcation point vs analytic threshold, energy
trace monotonicity under zero-noise anneal, cut-value agreement between loop
sim and direct Ising evaluation.

## P3 intro (draft prose — rev. 2, corrected against full-read pass 2)

> In 2016, a kilometre-long loop of optical fiber cut a two-thousand-node
> graph into two good halves in five milliseconds. Its spins were two
> thousand pulses of light circulating the loop, each pinned to one of
> two phases; a measuring instrument read them out each lap, and a
> processor nudged every pulse according to what the others were doing.
> In 2018, a graphics card running textbook annealing matched the
> machine's cuts on its own benchmark graphs, twenty times faster. In
> 2019, a second graphics card — this one simulating the loop's own
> equations of motion — beat its solution quality outright.
>
> Every one of those results is real, and none of them cancels the
> others. Between them sits most of what is worth knowing about machines
> that compute by settling, and this article holds both ends: it builds
> the loop, runs it, and then stages the rematch on this page — the loop
> against a simulation of itself, on the same problem, where you can
> watch.
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
