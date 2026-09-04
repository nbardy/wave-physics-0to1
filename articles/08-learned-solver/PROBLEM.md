# PROBLEM — where a fluid simulation is wrong, and what a learned model could fix

Written 2026-09-04 as the shared context for an invention pass and a landscape
article. Fable main loop, from first principles; the state-of-the-art section at
the end is from memory and is marked as such. Read the whole thing before doing
anything; §5 is the task.

## 1. What is actually being solved

A simulation is five things, and error enters at each:

1. **The equations.** Navier–Stokes for a single incompressible fluid; free-surface
   Navier–Stokes with two phases for breaking waves; the wave-action balance for
   spectral wave models, where the state is a spectrum and the physics lives in
   source terms. The equations are exact for what they describe and silent about
   what they leave out.
2. **The representation.** A grid, a mesh, particles, or spectral bins, at a
   resolution Δx and a timestep Δt. Anything smaller than Δx does not exist in the
   representation.
3. **The closure.** A rule for the effect of what the representation cannot hold
   on what it can. Sub-grid turbulent stress. Breaking dissipation. Four-wave
   transfer. Bottom friction. Air entrainment. Every closure in use is a formula
   with tuned constants, fit once, decades ago, to a few experiments.
4. **The inputs.** Initial state, boundary conditions, forcing (wind), geometry
   (bathymetry). Measured badly, or not at all.
5. **The solver.** The arithmetic that advances the representation one step:
   advection, diffusion, pressure projection, source terms, each with its own
   numerical error and its own stopping rule.

"We have to solve something" means: we solve the resolved equations plus the
closure, on the representation, from the inputs, with the solver. The word
*model* covers all five. A learned component can replace or correct any one of
them, and the question "can deep learning make the model better" is five
different questions with five different answers.

## 2. The error bins, with mechanism and size

**Model-form error (the closure is wrong).** The largest and least fixable
classically. Direct numerical simulation of turbulence needs on the order of
Re^(9/4) grid cells, so every engineering or geophysical flow is under-resolved by
orders of magnitude, permanently; the compute wall is a law, not a budget. The
missing scales feed back on the resolved ones (the energy cascade, and backscatter
from small to large). Algebraic closures (Smagorinsky 1963, k–ε, SST) are known to
fail in exactly the cases that matter: separation, adverse pressure gradients,
rotation, transition. For waves: whitecapping dissipation is a tuned formula;
the four-wave nonlinear transfer, the term that shapes the whole spectrum, is
computed in every operational model by the discrete interaction approximation
(Hasselmann et al. 1985) because the exact integral is roughly a thousand times too
expensive; wind input, bottom friction, wave–current interaction are all
parameterized. In phase-resolving breaking, air entrainment and the sub-grid
interface are closures too.

A structural fact about closures that any invention must respect: the exact
effect of unresolved scales on resolved ones is **not a function of the current
resolved state alone.** Mori–Zwanzig projection says it is a memory integral over
the resolved history plus a noise term. A deterministic, local, stateless closure
(which is what every classical closure and most learned ones are) is therefore
wrong in form, not merely in constants, and no number of parameters fixes a wrong
form. The questions for a learned closure are: what history does it see, what
neighborhood does it see, and is it stochastic.

**Discretization error (the representation smears).** Numerical diffusion from
advection schemes kills vortices and damps waves; numerical dispersion changes
wave speed; time-stepping error; grid anisotropy. This site's own graphics-grade
solver measured it: semi-Lagrangian advection leaked 35–46% of a dye's mass over
one figure window (lesson 04 v2), and its vortices die of numerics long before
viscosity. In ocean models, spurious diapycnal mixing from the advection scheme is
a first-order error in the deep circulation. Discretization error shrinks with
resolution at a known rate; it is the one bin where "run it finer" is a correct
answer, and the one bin where a learned correction has a clean teacher (the same
model, run finer).

**Iterative error (the solver stopped early).** Unconverged pressure solves,
loose tolerances. This site's solver leaves 28% of the divergence after its forty
sweeps. The smallest bin, fully fixable classically (multigrid, conjugate
gradients), and the only bin with a meter that can *acquit* an answer (the
residual). Lesson 04 version II is entirely about this bin, which is why it found
a 3.4× speedup and no accuracy.

**Input error (the state was never right).** Initial conditions, boundaries,
forcing, geometry. In weather, initial-condition error is the dominant error and
chaos amplifies it to the predictability limit of roughly two weeks. In wave
forecasting, the wind forcing is the dominant error; a wave model is as good as
the wind it is given. Data assimilation (blending model and observations) is where
most of the skill gained in forty years of operational forecasting came from.

**Outcome error (the statistics were fine and the event was the point).** Rogue
waves, the breaking wave that hit the deck, the separation that stalled the wing.
A model tuned to the mean can be right on average and wrong where it matters.

**Chaos changes what "error" means.** For turbulent flow, pointwise prediction
beyond a Lyapunov time is impossible for any model, learned or not. Only
statistics (spectra, distributions, correlations) are meaningful targets. A
learned model trained on pointwise mean-squared error regresses to the mean and
smooths; that is the mechanism behind every "blurry surrogate." The right meter
is statistical, and a model that is pointwise wrong and statistically right may be
the correct one.

## 3. Could a bigger learned model fix it

More parameters help only where there is signal to fit them to, and where the
model's form can express the answer.

- A **closure** has a true target (sub-grid stress measured from DNS, the exact
  transfer integral), so capacity helps up to the data. But if the net is
  stateless and local, its form is wrong (§2) and capacity saturates. Give it
  history and a stochastic term and the ceiling moves.
- A **discretization correction** has a clean teacher and a small target (the gap
  between coarse and fine); capacity is rarely the limit, rollout stability is.
- A **surrogate** for the whole operator scales with data in-distribution (weather
  foundation models improve with size) and does not generalize out of it by
  getting bigger, because generalization to new physics comes from structure
  (conservation, symmetry, the physics kept in the loop), not from parameters.
- **Inputs** are limited by observations, not parameters.

So the honest answer to "with more params?" is: only in the closure bin, and only
after the closure's inputs are right. Everywhere else the lever is structure.

## 4. What a learned component is allowed to touch

The ranking that decides whether an insertion is trustworthy is what can check it
while it runs:

| what checks it | verdict it can give | which insertions have it |
|---|---|---|
| the residual of a linear system | acquits: the answer is right to tolerance whatever produced it | warm starts, preconditioners |
| conservation (mass, momentum, energy, action) | convicts only: a violation proves wrong, obedience proves nothing | advection corrections, fluxes, transfer terms |
| statistics against a finer run | offline, hours per verdict | closures, discretization corrections |
| observations | offline, sparse, and themselves uncertain | assimilation, surrogates |
| nothing | the checker was replaced along with the physics | whole-model surrogates |

The house axiom, stated once: **a learned component earns its place by what it is
forbidden to do.** A closure that cannot violate conservation because it is
written as an antisymmetric exchange. A correction that cannot create mass because
it predicts fluxes. A net that cannot corrupt the state because it only decides
where compute is spent. If a proposal forbids nothing, it is a surrogate wearing a
costume, and the relabeling challenge applies: what is it, underneath, and what
degree of freedom did the new name remove?

## 5. The task

Propose ways a learned component makes a fluid or wave simulation **more right**,
not faster. Speed is admissible only as accuracy at fixed compute (a point on the
error-versus-compute curve no classical setting reaches).

Method, in this order, and do not skip the order:

1. **First principles first.** Do not open the literature yet. From §1–§4, branch
   wide: at least ten candidates. For each, state in one paragraph: the error bin
   it attacks; what the net sees (including history and neighborhood, and whether
   it is stochastic); what it outputs; what it is forbidden from doing, by
   construction; what checks it in the loop; how it is trained (through a
   differentiable solver, from a finer run, from observations, from an exact but
   expensive term); and what it would cost to test on a 2D incompressible solver
   with a cylinder in a channel, or a statement that it cannot be tested there and
   why.
2. **Critique and kill.** Run the relabeling challenge on every candidate: is
   this an old idea with a new name? What does it forbid? Kill anything that
   forbids nothing, anything whose teacher is the thing it claims to improve on,
   and anything whose only gain is speed.
3. **Then the literature.** Web search is allowed now, to check each survivor for
   prior art. Cite what you find. A survivor that turns out to exist is reported
   as existing, with the paper, and is not claimed as new. Note where prior art
   stops short of the proposal.
4. **Surface the gem.** One to three survivors, ranked, each with: the claim, the
   forbidden thing, the check, the experiment on this site's solver or the
   smallest honest experiment elsewhere, and the way it would fail.

Write plainly. No adjectives asserting quality. A proposal is a mechanism, a
constraint, a check, and an experiment. If nothing survives, say so; a report of
zero gems with the kill reasons is a complete result.

## 6. State of the art, from memory (read only after step 1)

Unverified in this session; check before citing. Whole-operator surrogates:
FourCastNet (2022), Pangu-Weather and GraphCast (2023), GenCast (diffusion
ensembles, 2024), Aurora (2024), ECMWF's AIFS in operations (2025); PDE foundation
models (MPP 2023, Poseidon 2024, The Well dataset 2024); rollout-stability fixes
(noise injection, pushforward training, PDE-Refiner 2023). Hybrid corrections:
Bar-Sinai 2019 learned discretizations; Um et al. 2020 solver-in-the-loop; Kochkov
et al. 2021 learned interpolation, roughly 8× coarser at equal accuracy in 2D
turbulence; Dresdner 2022 spectral. Closures: Ling 2016 tensor-basis network;
Duraisamy field inversion; Novati and Koumoutsakos 2021 reinforcement-learned LES
closure in the loop; Zanna and Bolton 2020 stochastic ocean eddy parameterization;
NeuralGCM (Kochkov et al. 2024): classical differentiable dynamical core with
learned physics, trained end to end on reanalysis, stable at climate length, the
strongest existing answer to "better, not faster." From observations with no
teacher simulation: Aardvark Weather (2025). Structure by construction:
equivariant networks, Hamiltonian and Lagrangian networks, divergence-free
outputs via stream functions or fluxes, Clifford networks (Brandstetter 2022).
Equation discovery: SINDy (Brunton 2016) and descendants. Waves: spectral models
(WAM, WAVEWATCH III) still run the 1985 DIA; learned emulators of the exact
four-wave term and learned bias corrections exist in the literature and are not
operational; phase-resolving breaking has no learned closure in wide use.
Differentiable solvers that make in-the-loop training possible: JAX-CFD, PhiFlow,
Warp, DiffTaichi.
