# INVENTION A — the closure lane: model-form error

Written 2026-09-04 by a Fable 5.1 research pass on a clean context, following
PROBLEM.md §5 in order: first principles (§1 below), critique and kill (§2),
literature on the survivors (§3), gems (§4), verdict on parameters (§5). §1 and
§2 were written to disk before any search was run.

## 0. What this lane is, and what the site's solver can and cannot show

The closure is the rule for the effect of what the representation cannot hold
on what it can. The structural fact from PROBLEM.md §2 that every candidate
must respect: by Mori–Zwanzig, the exact effect of the unresolved scales on the
resolved ones is a Markov term (a function of the current resolved state), plus
a memory integral over the resolved history with a kernel, plus a term driven
by the unresolved initial data that is, from the resolved side, noise. A
closure that is deterministic, local and stateless has dropped two of the three
terms. No parameter count restores a dropped term.

The three questions for any candidate are therefore: what history does it see,
what neighborhood does it see, and is it stochastic. The house axiom adds a
fourth: what is it forbidden to do by construction. In this lane the
constructions available are conservation as an antisymmetric exchange (momentum
cannot be created if every closure force on cell i is an equal and opposite
force on a neighbor j), Galilean invariance (inputs are velocity differences,
never velocities), rotational invariance (outputs are built from a tensor basis
of the resolved gradient), realizability (a sub-grid stress that is a covariance
must be positive semi-definite; a sub-grid energy must be non-negative), and an
energy bound (the closure cannot hand the resolved field more energy than the
unresolved field holds).

What checks a closure while it runs. Nothing in this lane acquits. Conservation
convicts. An energy ledger convicts. An invariance test (run the same flow in a
moving frame; the exact sub-grid stress is unchanged) convicts. Statistics
against a finer run are offline. The one exception, for closures whose exact
form is an expensive but computable integral (the four-wave transfer in a
spectral wave model), is to compute the exact term on a sample in the loop;
that is the only acquitting meter this lane has, and it is candidate C16.

The site's cylinder-in-a-channel solver, stated once so each candidate can
refer to it. Fine run: `src/sims/lib/gpu/solver_gpu.ts`, 576×352 cells,
MacCormack-corrected semi-Lagrangian advection, multigrid pressure, disc
diameter D = 56 cells, Re slider 20–400. Coarse run: `src/sims/lib/solver.ts`,
144×88, first-order semi-Lagrangian, Gauss–Seidel pressure at 40 sweeps, D =
14 cells; the headless harness (`scripts/check-learned.ts`) runs the coarse
solver only, since Node has no WebGPU. At Re ≤ 400 in two dimensions the
cylinder wake is laminar and periodic; the boundary layer at Re 400 is about
D/√Re ≈ 2.8 fine cells thick and the wake vortices are of order D. There is no
cascade and nothing physically sub-grid: the fine run is, for this lane's
purposes, a direct simulation, and the whole coarse–fine gap is discretization
error (the first-order scheme's numerical diffusion, which the GPU file itself
measured to kill the Kármán street at 1×). A net trained on that gap and called
a closure is a discretization correction wearing a closure costume; the
relabeling challenge decides it. So for every turbulence candidate below the
honest statement is: the cylinder cannot show it, and the smallest experiment
that can is still two-dimensional and incompressible, just not the cylinder.

The box, defined once. A doubly periodic 2D domain with Kolmogorov forcing at
wavenumber k_f, a small viscosity, and a weak linear drag at the largest
scales so the inverse cascade has somewhere to go. Reference: pseudo-spectral
vorticity solver, 2/3 dealiasing, RK4, at 1024² (512² on a laptop). Coarse
run: the same pseudo-spectral scheme truncated to 64² (or 32²), so the coarse
solver's own discretization error is negligible on the scales it keeps and
whatever residual remains is the closure alone; this separation is the reason
the box uses a spectral coarse solver and not the site's. The exact target is
computable: filter the reference each step, form the sub-grid stress τ = ⟨uu⟩ −
⟨u⟩⟨u⟩, and its energy transfer Π = −τ:S̄, whose sign per cell is the
forward/backscatter split. Two settings. Box A: k_f = 4, resolved by the coarse
grid; the classical LES test, where the sub-grid part is the enstrophy cascade
with a backscatter fraction. Box B: k_f above the coarse cutoff (k_f = 40,
coarse keeps |k| ≤ 16); the coarse run then contains no forcing at all and
every unit of resolved energy arrived through the closure from below. In box B
an eddy viscosity of any coefficient produces a dead run, which makes it the
sharpest test of a stochastic or ledgered closure and the wrong test of a
dissipative one. Measured, in both: energy and enstrophy spectra, the spectral
flux Π(k) and its sub-grid part, the backscatter fraction, the vorticity PDF,
the decorrelation time, and long-rollout stability. Cost: a 512² reference for
10⁴ steps is minutes on a GPU and about an hour in NumPy; the coarse runs are
seconds. It could be written in this repo's TypeScript with a hand FFT at
256²/32², and that is the version a figure would use.

## 1. Candidates, from first principles

Each candidate states: the error bin; what the net sees (history,
neighborhood, stochastic or not); what it outputs; what it is forbidden from
doing by construction; what checks it in the loop; how it is trained; and the
smallest test.

**C1. The exchange closure: antisymmetric face fluxes from relative
velocities.** Bin: model-form. Sees, at the current step only, a stencil of
radius r cells around each face: the velocity differences u_j − u_i across the
stencil (never a velocity), and the invariants of the resolved gradient at the
two cells (in 2D: strain magnitude, vorticity, and their product's sign, the
Okubo–Weiss parameter). Deterministic. Outputs, for every face between cells i
and j, a momentum flux F_ij with F_ji = −F_ij, applied as u_i += Σ_j F_ij.
Forbidden: changing the domain's total momentum (identically zero by
antisymmetry); depending on the frame (differences only, so a uniform boost
changes no input); depending on orientation (the flux is a learned scalar
coefficient on each member of the gradient tensor basis, which in 2D has two
members, so the output rotates with the flow). Check in the loop: total
momentum is exact and therefore not a check; the check is the closure's work on
the resolved field, Σ_faces F_ij·(u_i − u_j), logged per step as the closure's
dissipation and compared with forcing input minus molecular dissipation over a
window; a run whose closure is a net source of resolved energy over a window is
convicted. Training: a priori from the filtered reference, where the target is
unique on faces (the filtered momentum flux through the face, ⟨uu⟩·n −
⟨u⟩⟨u⟩·n), then a posteriori through the differentiable coarse solver on a
statistical loss (spectrum and Π(k)). Test: box A. The cylinder cannot show
it.

**C2. Realizable stress by construction.** Bin: model-form. Same inputs as C1.
Outputs a lower-triangular L per cell and takes τ = LLᵀ, so the sub-grid stress
is positive semi-definite by construction; the face flux is the face average of
τ. Forbidden: an unrealizable stress (a negative sub-grid normal stress, or a
shear stress exceeding the geometric mean of the normals). Check: none beyond
C1's. Training: a priori. Test: box A. Note for the kill pass: positive
semi-definiteness of τ says nothing about the sign of −τ:S̄, so this forbids
nothing about energy, and it is stateless.

**C3. Eddy viscosity with a learned coefficient.** Bin: model-form, attacked at
the constants only. Sees the local gradient invariants. Outputs ν_t ≥ 0 per
cell (a softplus), possibly with a hyperviscous partner. Forbidden:
backscatter, because ν_t ≥ 0 means the closure's work on the resolved field is
never positive. Check: the dissipation sign, which is a tautology. Training: a
priori against the filtered reference's dissipation, or a posteriori. Test: box
A, where it will be stable and will over-dissipate; box B, where it produces a
dead run by construction. The cylinder cannot show it.

**C4. Eulerian history window.** Bin: model-form, attacking the memory term.
C1's inputs plus the last K coarse states at the same cells (a stack of frames,
or a recurrent cell per grid point). Deterministic. Outputs C1's fluxes.
Forbidden: what C1 forbids, and nothing more. Check: C1's. Training: a
posteriori through the differentiable solver, since the memory has no per-step
target. Test: box A, as C1 with K > 1. Note for the kill pass: the history at a
fixed cell under a uniform boost is the history of different fluid, while the
exact sub-grid stress is invariant under the boost; the frames are relative
velocities within each frame but the sequence across frames is not.

**C5. Lagrangian memory: the closure's memory rides with the fluid.** Bin:
model-form, attacking the memory term in the frame where it is invariant. Add M
scalar fields m_1..m_M that are advected with the resolved velocity exactly as
dye is (the site's own semi-Lagrangian backtrace does this natively: sample the
memory where the parcel was), and after advection are updated per cell by a
learned map m ← g(m, local invariants, local differences). The flux net of C1
then sees (differences, invariants, m). M advected fields with a learned
one-step update are a Prony-type approximation to the memory integral along
pathlines, with M poles. Deterministic. Outputs C1's antisymmetric fluxes.
Forbidden: momentum creation (flux form); frame-dependent memory (the memory
moves with the fluid, so a uniform boost moves it too and the inputs are
unchanged); orientation dependence (tensor basis). Check in the loop, beyond
C1's energy log: the boost test, which the periodic box makes exact. Run the
same coarse initial condition twice, once with a uniform velocity U added, and
compare the closure's output after a shift by Ut; any difference convicts a
leak of absolute velocity into the closure. Training: a posteriori through the
differentiable coarse solver, with a diagnostic first: from reference particle
trajectories, measure how much of the exact sub-grid flux's variance the
current resolved state explains, then how much the state plus its Lagrangian
history explains; if the gain is nil at the coarse Δt, M = 0 is the honest
answer and C5 collapses to C1. Test: box A for the diagnostic and the closure,
with the boost test as the in-loop meter. On the cylinder the mechanism is
implementable in about twenty lines (a memory field is a dye with a learned
decay), but there is no sub-grid term there to learn.

**C6. The sub-grid energy ledger with ledger-bounded stochastic backscatter.**
Bin: model-form, attacking the noise term and the energy bound together. Add a
field e(x) ≥ 0, the sub-grid kinetic energy per cell, advected with the flow.
The net sees C1's inputs plus e and outputs three non-negative rates per cell:
a drain (resolved → e, realized as C1-type dissipative fluxes whose work is
deposited into e), a deterministic return (e → resolved, realized as fluxes with
the opposite sign of work), and an amplitude for a random forcing that is
divergence-free (a random stream function, so it can create no divergence),
correlated at the coarse cutoff scale, multiplicative in √e, and whose expected
energy injection per step is withdrawn from e. A fourth rate, the ledger's own
loss to molecular dissipation, is the only true sink and is learned; unresolved
forcing, if any, is a known source. Stochastic, because the Mori–Zwanzig noise
term is by definition the part of the sub-grid effect that the resolved history
does not determine, and a deterministic return rate can only represent its
mean. Forbidden: energy creation (resolved KE plus Σe changes only by forcing
and molecular loss, by construction of the exchanges); backscatter from an
empty ledger (every withdrawal is capped at e/dt, so e ≥ 0 always); divergent
noise. Check in the loop: the two-account budget every step, resolved KE + Σe
against the integrated forcing minus molecular loss, which convicts a bug or a
bound violation; and, offline, an ensemble of coarse runs against an ensemble
of references, as a rank histogram, which convicts noise of the wrong
amplitude. Training: the ledger's exact value and exact transfer are measurable
from the filtered reference (e_exact = ½ tr τ, Π = −τ:S̄), so the rates are
trained a priori; the noise amplitude has no per-step target and is trained a
posteriori through the differentiable solver on the spectrum and the PDF of Π.
Test: box B, where the ledger closure must sustain the resolved inverse cascade
at the reference's rate with no resolved forcing, and eddy viscosity cannot.
The cylinder cannot show it.

**C7. Pure noise, zero mean, learned covariance.** Bin: model-form, the noise
term alone. Sees the resolved state; outputs a divergence-free random forcing
whose covariance is learned. Forbidden: any deterministic drift, which forbids
the net from being a surrogate. Check: divergence-free by construction. Note
for the kill pass: by Itô, the mean energy injection of a state-independent or
multiplicative noise is ½ tr Q ≥ 0, so this closure can only feed the resolved
field and never drain it; it is not a closure but half of one.

**C8. Measured kernel, learned gain.** Bin: model-form, the memory term with
its form measured rather than learned. From reference trajectories, estimate
the kernel K(s) as the lagged covariance between the exact sub-grid flux and
the resolved strain along pathlines. The net learns only a state-dependent
scalar gain on a fixed-shape convolution of the strain history with K.
Forbidden: any kernel but the measured one. Check: the kernel's time scale
τ_mem against the coarse Δt; if τ_mem < Δt the memory is below the time
representation and the candidate reduces to C1, which is a result. Training: a
priori. Test: box A. Note for the kill pass: this is C5's diagnostic step with
the poles fixed by measurement instead of learned.

**C9. A wide neighborhood: the local spectrum as input.** Bin: model-form, the
neighborhood question. C1 with the stencil replaced by a windowed spectrum of
the resolved field, on the argument that sub-grid transfer in 2D couples scales
that are not adjacent. Forbids nothing beyond C1. Note for the kill pass: an
input choice, not a mechanism.

**C10. The four-wave transfer emulated from the exact integral, with
conservation by projection.** Bin: the closure's computation error (the DIA
replacing the Hasselmann integral), which PROBLEM.md §2 places in this lane.
Sees the current directional spectrum F(k, θ) and nothing else; under the
random-phase hypothesis S_nl is a function of the current spectrum, so no
history is owed and the term is deterministic. Outputs S_nl on the spectral
grid, then projected onto the linear manifold where the discrete sums of
action, energy and momentum change are zero (a rank-3 correction, tiny if the
emulator is good). Forbidden: creating or destroying action, energy or
momentum. Check in the loop: the three sums, which are exact after projection
and therefore not a check; the check is C16. Training: against the exact
Webb–Resio–Tracy integral, an exact and expensive teacher. Gain: accuracy at
fixed compute, admissible under §5 because the exact term at DIA cost is a
point no classical setting reaches. Test: not on this site; a spectral wave
model with a WRT implementation on a single grid point, duration-limited
growth, measured against the exact integral run to convergence.

**C11. The non-Markovian four-wave correction.** Bin: model-form, at the level
of the Hasselmann equation itself, which is a closure in form: resonant-only
and Markovian in the spectrum. The correction is a memory term over the
spectrum's recent history, trained against ensembles of phase-resolved
simulations of the Zakharov equation, where the sub-grid variable is the phase.
Sees the spectrum and its last K states; deterministic in the mean, with a
stochastic term whose need is an open question this candidate would settle.
Outputs an increment to S_nl, projected as in C10. Forbidden: conservation
violation. Check: C16 does not apply (the exact term is the phase-resolved
ensemble, not computable in the loop), so the checks are conservation and
offline comparison. Training: from the phase-resolved teacher. Test: not on
this site; a one-dimensional Zakharov ensemble against a kinetic-equation run
of a rapidly changing spectrum (a turning wind), where the Markovian form is
known to be worst.

**C12. Observation-trained dissipation.** Bin: model-form, the whitecapping
sink. Sees the spectrum; outputs S_ds ≤ 0. Forbidden: a positive sink.
Training: by adjoint through the wave model against buoy spectra. Note for the
kill pass: the teacher is observations, which are shaped by the wind input
error PROBLEM.md §2 names as dominant; a sink fitted to buoys learns the wind
bias. And the only forbidden thing is a sign.

**C13. The sub-grid interface: entrainment as a two-phase exchange.** Bin:
model-form in phase-resolving breaking. Sees the resolved interface's curvature
and normal velocity, the local rate of resolved energy loss, and the
interface's Lagrangian history (the memory moves with the interface). Outputs an
entrainment flux exchanged between the water-fraction field and an entrained-air
field, and a return (degassing) flux, each phase's mass conserved by the
exchange. Forbidden: mass creation for either phase; entrainment where the
resolved interface is not steepening (a gate on curvature growth). Check: the
two mass sums per step. Training: against two-phase direct simulations of
breaking. Test: cannot be tested here; the site's solver is single-phase with
no free surface. The smallest honest test is a 2D breaking-wave two-phase
reference at two resolutions, measuring entrained volume against time.

**C14. Where, not what: nested fine patches placed by a learned monitor.**
Bin: model-form, attacked by replacing the closure locally with the resolved
physics. The net sees the coarse state and outputs only a placement (which
cells get a nested fine solve this step, at a fixed budget); the closure term
in those cells is the fine patch's own flux, and elsewhere a classical
closure. Forbidden: the net never writes to the state. Check: the fine patch's
own conservation; the monitor's error is the gap between patch flux and
classical flux where patches were not placed. Training: the monitor is trained
to maximize accuracy at fixed compute against a full fine run. Test: on the
cylinder, yes, coarse 144×88 with 4× patches; but the gain there is
discretization, and the mechanism is lane-agnostic. Box A also.

**C15. Field inversion with a learned multiplier.** Bin: model-form, at the
constants. Invert a spatial multiplier on an existing closure against fine-run
statistics by adjoint, then learn a map from resolved features to the
multiplier. Forbidden: nothing beyond the base closure's. Note for the kill
pass: stateless, retains the base closure's form, and known.

**C16. The audited emulator: exact term sampled in the loop.** Bin: not a
closure; the check this lane otherwise lacks. For any closure whose exact form
is an expensive but computable integral (S_nl), evaluate the exact term on a
random subset of spectral bins each step, or on all bins every Nth step. The
gap between emulator and exact on the sample is a running error meter with a
known sampling variance; over a window it can acquit the emulator, which no
other meter in this lane can do. Used as a control variate, the sampled exact
values also correct the emulator (S_nl ≈ emulator + interpolated sampled
residual), so the audit buys accuracy as well. Forbidden: nothing on its own.
Test: waves only; turbulence has no exact term computable in the loop.

**C17. Ensemble-calibrated spread as the objective.** Train a stochastic
closure so that an ensemble of coarse runs has the spread the reference
ensemble has (rank histogram flat). Note for the kill pass: an objective and a
check, not a mechanism; it belongs inside C6.

## 2. Kill ledger

One line per kill, with the relabeling and the reason.

- C2 killed: relabels as a realizable tensor-basis closure; stateless, and PSD
  τ forbids nothing about the sign of energy transfer; the constraint is
  absorbed into C1 as an option.
- C3 killed: relabels as dynamic Smagorinsky with a learned coefficient; wrong
  in form (local, stateless), and it forbids the one thing 2D requires.
- C4 killed: relabels as a ConvLSTM closure; its memory at a fixed cell is not
  Galilean invariant, so it violates an invariance the exact term has, and it
  forbids nothing C1 does not; superseded by C5.
- C7 killed: half a closure; noise with zero mean can inject energy on average
  but never drain it; absorbed into C6 as the stochastic return.
- C8 merged into C5 as its diagnostic step; not a separate mechanism.
- C9 merged into C1 as an input choice; forbids nothing.
- C12 killed: relabels as field inversion for S_ds; forbids only a sign, and
  its teacher carries the wind-input error, so it learns the wrong bin's bias.
- C15 killed: field inversion and machine learning, an existing method;
  stateless and retains the base form.
- C17 merged into C6 as its offline check and training objective.

Survivors to the literature check: C1, C5, C6, C10, C11, C13, C14, C16.

## 3. Literature check on the survivors

Searched 2026-09-04 after §2 was on disk. Each entry: what exists, with the
paper, and where it stops short of the candidate. "From memory" marks a claim
I could not fetch in this session.

**C1, the exchange closure.** Exists, in pieces and in one near-complete form.
van Gastelen, Edeling and Sanderse 2025, "Energy-conserving neural network
closure model for long-time accurate and stable 2D LES"
([arXiv:2504.05868](https://arxiv.org/abs/2504.05868), Computers & Fluids
2026): the closure is written as (K − Kᵀ)ū − QᵀQū, a skew-symmetric
redistribution plus a negative-definite dissipation, on a face-averaging
filter so mass and momentum are conserved by the discretization; the closure's
total work on the resolved field is ≤ 0 by construction; tested on decaying 2D
turbulence and Kolmogorov flow, 2048² coarse-grained to 32²–128², rollouts to
t = 500; no memory, no stochastic term, no discussion of Galilean invariance;
stable everywhere "at the cost of increased dissipation." Pawar, San, Rasheed
and Vedula 2022, "Frame invariant neural network closures for Kraichnan
turbulence" ([arXiv:2201.02928](https://arxiv.org/abs/2201.02928), Physica A):
translation, Galilean and rotation invariance built into CNN layers, 2D
decaying turbulence, no conservation structure, no memory. Zanna and Bolton
2020 ([GRL](https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2020GL088376)):
a closure with the conservation law embedded as a final divergence layer. Guan,
Chattopadhyay, Subel and Hassanzadeh 2022
([arXiv:2102.11400](https://arxiv.org/abs/2102.11400), JCP): the 2D reference
result that a plain CNN captures backscatter a priori and can be made stable a
posteriori, without structural guarantees. Where prior art stops: no one
combines antisymmetric fluxes, relative-velocity-only inputs and a tensor-basis
output in one closure, and van Gastelen's construction forbids net backscatter,
which is the wrong prohibition for box B. C1 is reported as existing. It is the
substrate on which C5 and C6 are built, not a gem.

**C5, Lagrangian memory.** The mechanism exists in a form that forbids nothing,
and the invariant form exists for particles but not for a grid closure. Schulz,
Jouan, Berger, Gavranovic and Hartmann 2025, "Transported Memory Networks
accelerating Computational Fluid Dynamics"
([arXiv:2502.18591](https://arxiv.org/abs/2502.18591)): a cell-wise hidden
state updated as H_i = up(U_i, H_{i−1}) inside a solver-in-the-loop correction
on 2D Kolmogorov flow, 64² against 2048², Re 1000 and 4000; the authors report
the hidden state "is effectively transported with the flow" by the learned
update and correlates with vorticity, and that "explicit transport of H
negatively impacts performance"; inputs are absolute velocities, there is no
conservation structure, no stochastic term, no boost test. Freitas, de Wit,
Gabbana, Woodward, Toschi, Lin and Livescu 2026, "Learning turbulent transport
via Mori–Zwanzig graph neural networks"
([arXiv:2606.14918](https://arxiv.org/abs/2606.14918)): a finite-memory
expansion over present and delayed particle-neighborhood graphs, Galilean and
rotation invariant by construction, for Lagrangian tracer statistics, not for
a grid closure. Xue, Ooi, Ge, Leong, Li and Kang 2025
([arXiv:2511.21369](https://arxiv.org/abs/2511.21369)): a non-Markovian
closure whose hidden state is Eulerian at grid points, deterministic,
unconstrained, on scalar transport. Charalampopoulos and Sapsis 2021
([arXiv:2102.07639](https://arxiv.org/abs/2102.07639)): history at Eulerian
points with an energy-conservation constraint on the advective form. The
classical ancestor: Meneveau, Lund and Cabot 1996, "A Lagrangian dynamic
subgrid-scale model of turbulence" (J. Fluid Mech. 319, 353), which averages
the dynamic coefficient along pathlines with a fixed exponential kernel, the
one-pole, one-scalar version of C5's memory. Supporting the boost test as a
meter: a 2025 plasma paper on embedding symmetries by data augmentation
([arXiv:2506.14048](https://arxiv.org/abs/2506.14048)) reports that
lab-frame datasets produce spurious non-invariant terms that Galilean-boosted
augmentation removes; and Freitas, Um, Desbrun, Buzzicotti and Biferale 2025
([arXiv:2504.03870](https://arxiv.org/abs/2504.03870)) find that a closure
trained a posteriori through a differentiable shell-model solver breaks the
scale invariance of multipliers near the cutoff, that is, capacity and
in-the-loop training did not buy a symmetry that was not built in. Where prior
art stops: no grid closure carries an explicitly advected learned memory with
relative-velocity inputs and flux-form outputs, and the one paper that tried
explicit transport found it hurt without testing whether the Eulerian hidden
state was learning something frame-dependent (in Kolmogorov flow the forcing is
fixed in the Eulerian frame, so an Eulerian memory can learn where the forcing
is, which a boost exposes). C5 survives with that open question as its first
experiment.

**C6, the ledger with bounded noise.** The ledger exists, hand-built and
tuned; the learned stochastic closure exists, unbounded and documented as
failing for that reason; the two have not been joined. Ghosal, Lund, Moin and
Akselvoll 1995, "A dynamic localization model for large-eddy simulation of
turbulent flows" (J. Fluid Mech. 286, 229): backscatter limited by a sub-grid
kinetic-energy transport equation, the LES-side ancestor. Jansen and Held 2014,
"Parameterizing subgrid-scale eddy effects using energetically consistent
backscatter" (Ocean Modelling 80, 36): a negative Laplacian viscosity whose
amplitude is regulated by an explicit sub-grid kinetic-energy budget. Juricke,
Danilov, Koldunov, Oliver and Sidorenko 2020
([JAMES](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2019MS001855))
in FESOM2, and Bagaeva, Danilov, Oliver and Juricke 2024, "Advancing eddy
parameterizations: dynamic energy backscatter and the role of subgrid energy
advection and stochastic forcing"
([JAMES](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2023MS003972)):
the unresolved-kinetic-energy budget is advected by the resolved flow and given
a stochastic source, hand-built, constants tuned. Shutts 2005 (Q. J. R.
Meteorol. Soc.) and Berner et al. 2009 (J. Atmos. Sci.): SKEBS, a random
stream-function forcing whose amplitude is the square root of a local
dissipation-rate estimate, operational at ECMWF; the noise is bounded by
dissipation, not by a carried ledger. Perezhogin, Zanna and Fernandez-Granda
2023, "Generative data-driven approaches for stochastic subgrid
parameterizations in an idealized ocean model"
([arXiv:2302.07984](https://arxiv.org/abs/2302.07984), JAMES): GAN and VAE
closures that reproduce the sub-grid forcing distribution and the large-scale
backscatter; the text reports unstable runs at 96² in which "an eddy emerges
which is constantly amplified by the parameterization" and states the cause:
"we do not control the amplitude of the parameterization as it is usually done
in energetically-consistent physical parameterizations of backscatter (Jansen &
Held, 2014)." The same paper notes that white noise sampled per step injects
energy that vanishes as Δt → 0, so a stochastic term with non-vanishing input
needs temporal correlation or memory. Chekroun and McWilliams 2026
([arXiv:2608.06606](https://arxiv.org/abs/2608.06606)): an analytical
closure theory for 2D flow with a hidden reservoir of unresolved degrees of
freedom exchanging with the resolved flow under a constraint that conserves an
augmented enstrophy; not learned, and it says that in 2D the reservoir must
carry enstrophy as well as energy. Where prior art stops: no closure learns the
exchange rates on a carried, advected ledger with the noise's energy withdrawn
from the ledger and e ≥ 0 enforced by a cap; the learned side is unbounded and
the bounded side is hand-tuned; and no 2D ledger closure carries enstrophy so
that the return scale is pinned. C6 survives.

**C10, the projected S_nl emulator.** Exists without the projection. Tolman
and Krasitskii 2004 and Tolman 2009–2010 (NOAA/NCEP; Ocean Modelling 8, 2005),
the Neural Network Interaction Approximation: EOF-based networks mapping
spectra to exact interactions, more accurate than the DIA on single-peaked
spectra; later work reports that the NNIA accumulates noise during integration
and destabilizes the model. Ikuyajolu, Van Roekel, Brus and Thomas 2026,
"NLML: a deep neural network emulator for the exact nonlinear interactions in
a wind wave model" ([JGR: Machine Learning and
Computation](https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2025JH000699)):
a WRT emulator inside WAVEWATCH III, 136× faster than WRT and 1.04× the cost of
the DIA, twice the DIA's accuracy in global spectral energy and mean parameters,
stable through a year-long global run "without requiring additional
constraints." Where prior art stops: no conservation is enforced (the abstract
says so), so the emulator's action, energy and momentum errors are whatever the
network leaves, and there is no in-loop meter. The projection is three linear
constraints and costs nothing. C10 is reported as existing, with the projection
and C16 as the addition.

**C11, the non-Markovian S_nl correction.** The premise is measured small
where the models run. Liu, Gramstad and Babanin 2021, "Kinetic equations in a
third-generation spectral wave model" (J. Fluid Mech.): after correcting the
discretization of the generalized kinetic equation in WAVEWATCH III, the GKE
"does not give rise to significant deviation" from the Hasselmann equation
"provided that the wave spectra are fairly smooth and the directionality is
sufficiently broad," and both evolve on the same fast timescale for peak
downshift. Annenkov and Shrira (J. Fluid Mech. 2006, 2018; Ocean Dynamics 2016)
established the GKE against phase-resolved Zakharov simulations and found the
differences confined to fast transients and narrow spectra. No learned GKE
correction was found. Verdict: the model-form error C11 attacks is small in
the operational regime, and its teacher is expensive; a net trained to it would
fit the residual of the discretization. Dropped after the literature check.

**C13, entrainment as a two-phase exchange.** No learned entrainment closure
was found in two searches. Hand-built sub-grid entrainment models exist: Moraga
et al. 2008, "A sub-grid air entrainment model for breaking bow waves and naval
surface ships" (Computers & Fluids), which locates the bubble source from a
void-fraction criterion; Ma, Shi and Kirby 2011 (Ocean Modelling, from memory),
which sets entrainment proportional to the resolved turbulent dissipation; and
the scaling laws of Deike, Melville and Popinet 2016 (J. Fluid Mech.) for
entrained volume against breaking strength, from resolved two-phase
simulations. Where prior art stops: none is learned, and none carries the
interface's history. C13 survives as open, cannot be tested on this site, and
is not ranked.

**C14, where not what.** The placement lane exists for a single solver's mesh:
Yang et al. 2023, "Reinforcement learning for adaptive mesh refinement"
([arXiv:2103.01342](https://arxiv.org/abs/2103.01342), AISTATS); Foucart,
Charous and Lermusiaux 2023, "Deep reinforcement learning for adaptive mesh
refinement" ([arXiv:2209.12351](https://arxiv.org/abs/2209.12351), JCP);
Freymuth et al. 2023, "Swarm reinforcement learning for adaptive mesh
refinement" (NeurIPS). A learned placement of embedded resolved physics as the
closure (a scheduled super-parameterization) was not found. Verdict: the
mechanism belongs to the compute-placement lane; on the cylinder its gain is
discretization; in this lane it is a way to buy a local exact closure and is
not ranked here.

**C16, the audited emulator.** The nearest prior art is Krasnopolsky,
Fox-Rabinovitz and Belochitski 2008, "Neural network approach for robust and
fast calculation of physical processes in numerical environmental models:
compound parameterization with a quality control of larger errors" (Neural
Networks 21; the mechanism from memory, the text was not fetchable): a quality
control flags outputs whose emulation error is predicted to be large and calls
the original parameterization for those points. Where it stops: the trigger is
a predicted error, not a sampled exact evaluation, so it cannot acquit; there
is no known sampling variance, no windowed statistic, and no control-variate
correction. C16 survives as the check attached to C10.

## 4. Gems, ranked

**Gem 1. The learned ledger: a sub-grid energy (and, in 2D, enstrophy) account
carried with the flow, with every exchange a withdrawal or deposit and the
noise paid for from the account.**

Claim. A closure whose three exchange rates (drain, deterministic return,
stochastic return) and one sink (molecular loss) are learned functions of the
resolved invariants, the relative velocities in the stencil and the local
ledger, with the ledger advected by the resolved flow, reproduces the reference
spectrum and the sub-grid transfer PDF at coarse resolution and stays stable at
any rollout length, in the setting where an eddy viscosity produces a dead run
and an unbounded learned stochastic closure produces a runaway eddy.

Forbidden. Energy creation: resolved kinetic energy plus the ledger's sum
changes only by forcing and molecular loss, because every closure term is
written as an exchange between the two accounts. Backscatter from an empty
ledger: each step's total withdrawal (deterministic return plus the expected
injection of the noise) is capped at e/Δt, so e ≥ 0 always. Divergent noise:
the random forcing is the curl of a random stream function. A frame: inputs
are differences and invariants. In 2D, a second account z for sub-grid
enstrophy, drained and returned alongside e, pins the wavenumber of the return
(a return of ΔE must carry ΔZ = k²ΔE, so the noise's spectral centroid is
√(z/e)), which forbids returning energy at the wrong scale. The noise is an
AR(1) process in time with a learned decorrelation time, because white noise
per step injects energy that vanishes with Δt (Perezhogin et al. 2023,
Alvelius 1999) and the ledger's withdrawal must be the injection actually
delivered.

Check. In the loop, every step: the two-account budget, resolved KE + Σe
against ∫(forcing − molecular loss), which convicts a bound violation or a
coding error, and the enstrophy account likewise; both are exact identities
when the code is right, so a nonzero residual is a conviction. Offline: an
ensemble of coarse runs against an ensemble of references, as a rank histogram
of resolved energy, which convicts noise of the wrong amplitude or the wrong
correlation time.

Experiment. Box B: reference 1024² pseudo-spectral, forcing at k_f = 40,
coarse pseudo-spectral 32² keeping |k| ≤ 16, so the coarse run has no forcing
and every unit of resolved energy must come from below. The ledger's source is
the known injection rate. A priori: the ledger's exact value (½ tr τ) and
exact transfer (−τ:S̄) from the filtered reference train the drain and the
deterministic return; the sink is fitted to the reference's sub-grid
dissipation. A posteriori: the noise amplitude and decorrelation time through
the differentiable 32² solver on the resolved spectrum and the PDF of Π.
Baselines: Smagorinsky (dead run), the same net without the ledger cap and
without the withdrawal (the Perezhogin failure mode, expected to reproduce
it), the hand-tuned Jansen–Held ledger. Measured: resolved E(k) against the
filtered reference; the inverse-cascade flux; time to statistical steady
state; the two budgets' residuals (must be zero to round-off); the rank
histogram. Cost: a 1024² reference for 10⁴ steps in minutes on a GPU; the
coarse runs in seconds; the whole experiment fits in a JAX notebook, and a
256²/32² version fits in this repo's TypeScript with a hand FFT for a figure.
The cylinder cannot show it.

How it fails. The ledger is a one-pole memory of the sub-grid state; if the
sub-grid energy's own dynamics are faster than Δt or nonlocal in a way that
advection of a scalar cannot carry, the learned rates will fit the mean and the
stochastic term will carry the rest, and the rank histogram will be U-shaped
(under-dispersive) with no fix short of more accounts. The enstrophy pin may
be too tight: real sub-grid return is not at a single wavenumber, and pinning
the centroid while the reference returns energy over a band would show as a
bump in E(k) at √(z/e). And in box A, where the coarse grid resolves the
forcing, the ledger closure may buy nothing over van Gastelen's dissipative
construction, which would mean the mechanism matters only when the cutoff sits
below the injection scale, a result worth having.

**Gem 2. Memory that rides with the fluid: an advected learned memory with
frame-invariant inputs and flux-form outputs, with the boost test as the
meter.**

Claim. The part of the sub-grid flux that the current resolved state does not
explain is explained, in part, by the resolved strain history along pathlines
and not by the history at fixed cells; a closure with M advected memory fields
and relative-velocity inputs recovers that part, is invariant under a uniform
boost to round-off, and does not degrade when transport is explicit, whereas
an Eulerian hidden state of the same size fails the boost and, in Kolmogorov
flow, learns the fixed position of the forcing.

Forbidden. Momentum creation (antisymmetric face fluxes). Frame dependence: no
absolute velocity enters anywhere; the memory fields are advected by the
resolved velocity with the same semi-Lagrangian backtrace the site's solver
uses for dye, so a boost moves them with the fluid. Orientation dependence:
fluxes are scalar coefficients on the 2D tensor basis of the resolved
gradient. The memory update g(m, invariants, differences) sees no coordinates
and no time index.

Check. The boost test, exact in a periodic box: two coarse runs from the same
initial condition, one with a uniform U added; after n steps, shift the second
by nUΔt and compare the closure outputs; any difference above interpolation
error convicts a leak of absolute velocity. Run it in the loop at intervals as
a regression tripwire. And the C1 energy log per step.

Experiment. A diagnostic first, then the closure. Diagnostic, on the box A
reference (1024², k_f = 4, coarse 64²): seed tracer particles, record along
each trajectory the filtered strain and the exact sub-grid flux at the filter
scale; fit, by any regressor, the flux from (a) the current filtered state,
(b) the current state plus its Lagrangian history over K coarse steps, (c) the
current state plus the Eulerian history at the particle's current cell; report
the residual variance of each. If (b) does not beat (a), memory at this Δt is
below the time representation, C5 collapses to C1, and the lane's memory
question is answered in the negative for this Δ and Re; that is a result.
Closure, if (b) wins: M ∈ {1, 2, 4} advected fields with learned one-step
updates, flux net of C1, trained a posteriori through the differentiable 64²
solver on spectrum and Π(k); the ablations are explicit versus implicit
transport of m (the Transported Memory Networks finding), relative versus
absolute velocity inputs, with the boost test run on each. Measured: E(k),
Π(k), the vorticity-correlation time against the reference, and the boost
residual. Cost: the diagnostic is an afternoon on a laptop; the closure a day
on one GPU. On the cylinder the advected memory is twenty lines (a dye with a
learned decay) and there is nothing sub-grid for it to remember.

How it fails. The residual variance after conditioning on Lagrangian history
may be nearly all of it, which is the Mori–Zwanzig noise term telling you the
memory is not where the information is; then Gem 1's stochastic term is the
answer and Gem 2 is a null result. Advected memory with feedback can grow: a
memory field that the update rule amplifies along a converging pathline is a
new instability with no classical analogue, and the energy log would catch it
late. And the semi-Lagrangian advection of m is itself diffusive at the coarse
grid, which smears the memory at exactly the scale where it matters.

**Gem 3. The projected, audited S_nl: an emulator of the exact four-wave
integral that cannot create action, energy or momentum, and is checked in the
loop against the exact term on a sample.**

Claim. NLML-class accuracy at DIA cost, with the three conserved sums
identically zero after a rank-3 projection, and with a running error meter
built from exact WRT evaluations on a random subset of spectral bins each step
whose sampling variance is known, so that over a window the emulator can be
acquitted, which is the only acquitting meter in this lane.

Forbidden. Any change of total action, energy or momentum by S_nl (projection
onto the three linear constraints). Silent drift: the sampled exact residual is
a control variate, S_nl = emulator + interpolated (exact − emulator) on the
sample, so a drifting emulator is corrected in proportion to the sample size
and the drift is logged.

Check. Per step, the sampled residual's mean and variance against the
emulator's training error; over a window, a test that the residual's mean is
zero within sampling error acquits; a rejection triggers a full exact
evaluation for that step. The three conserved sums are exact after projection
and therefore not a check.

Experiment. Not on this site. A single-point WAVEWATCH III run
(duration-limited growth, then a turning wind) with WRT available, comparing
DIA, the emulator, the projected emulator, and the projected-and-audited
emulator at 1%, 5% and 20% sampled bins, against WRT run every step; measured:
spectral energy, peak period, mean direction, and the three sums; cost: the
WRT at 1% sampling adds 1% of a WRT step, and a projection is negligible.

How it fails. The projection can spread a local emulator error across the
spectrum (a rank-3 correction has no locality), so a good global sum may hide
a wrong spectral tail; the audit sees this only if the sample covers the tail,
which argues for stratified rather than uniform sampling of bins. And the
premise that the DIA is the dominant closure error in operational wave models
is not settled; if wind input dominates (PROBLEM.md §2), the gain is real but
not where the forecast error is.

## 5. Whether more parameters help in this lane

They help, and only here, under conditions that are all about form and none
about size.

The form conditions. The closure's outputs are exchanges (fluxes between
cells, transfers between accounts), so conservation is structural and no
capacity is spent learning it. The inputs are invariant (differences,
gradient invariants, quantities advected with the fluid), so no capacity is
spent learning the frame, and the boost test convicts any leak. The closure
carries state (a ledger, memory fields) advected with the flow, so it is
Markovian in an extended state, which is the only way a finite network
represents the Mori–Zwanzig memory integral; a stateless net of any size is
fitting the Markov term and aliasing the rest. It has a stochastic term whose
energy is paid from the ledger and whose temporal correlation is a parameter,
so the part of the sub-grid effect that no history determines is represented
as what it is. It is trained on the exact target where one exists (the
filtered reference's flux and energy, the exact transfer integral) and on
statistics through a differentiable solver where none does, never on pointwise
rollouts, since pointwise loss beyond a Lyapunov time regresses to the mean.
And the coarse cutoff sits inside a cascade range, so there is a sub-grid term
to learn at all.

Under those conditions the parameters model one thing, the conditional
distribution of the sub-grid exchange given the resolved history, and capacity
helps up to the data. The ceiling is measurable before training: the residual
variance of the exact flux after conditioning on the resolved history (Gem 2's
diagnostic) is the noise term's variance, and no parameter reduces it; a
closure that reaches it is done, and a bigger one fits the reference's
particular realization. Without the conditions, parameters buy instability
first, in the recorded forms: the amplified eddy of an unbounded stochastic
closure, the accumulated noise of an unconstrained emulator, the broken
symmetry near the cutoff of an a posteriori-trained net that was never told
the symmetry. On this site's cylinder at Re ≤ 400 they buy nothing at any
size, because there is no sub-grid physics on that grid and the gap a net
would close is numerics, which is the neighboring lane's problem and has a
cleaner teacher there.
