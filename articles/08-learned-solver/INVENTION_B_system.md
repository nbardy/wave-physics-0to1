# INVENTION B — the system: where a learned component sits in the loop, and what it is allowed to touch

Written 2026-09-04 against PROBLEM.md, in the order §5 prescribes: candidates from
first principles, then the kill pass, then the literature on survivors, then the
gems. Lane: the architecture around every learned part, not the closure's
internals. The code under `src/sims/learned/` was read; the older article docs
in this folder were not.

## 0. What the site's solver fixes in advance

Everything below is constrained by measured facts in the repo, so they are
stated once.

- The channel solver (`src/sims/lib/solver.ts`) is Stable Fluids on a 96×64
  collocated grid: implicit diffusion, semi-Lagrangian bilinear advection, then
  a pressure projection of 40 Gauss–Seidel sweeps from a cold start. The
  residual meter (`relResidual` in `poisson.ts`) reads 0.19–0.24 after those 40
  sweeps on the training and held-out families (`weights.ts` MANIFEST), which is
  the "28%" of PROBLEM.md §2. Conjugate gradients on the same matrix reach 10⁻³
  in about 134 iterations cold; multigrid would do it in a handful of cycles.
  This bin is closed classically, on this site as everywhere.
- The 809-weight pressure net (`net.ts`) sees the divergence restricted 8× to a
  12×8 grid plus a solid-fraction channel, and proposes a warm start. Behind the
  residual gate it cuts Gauss–Seidel sweeps-to-tolerance from ~2600 to ~560
  (train) and ~2330 to ~840 (held out); it barely moves CG (134 → 109). Without
  the gate (`UngatedRollout.tsx`) the loop detonates in about eight steps. With
  the gate and sabotaged weights (`SabotageGate.tsx`) the accepted answer does
  not move. These two figures already exist and are the reference point for
  every "gated" candidate below.
- The 954-weight advection net (`advect.ts`) is a flux-form correction on a
  frozen analytic swirl, trained at coarsening factor 4 only (`advectRun.ts`
  throws otherwise). Its manifest is the number that governs this whole lane:
  trained one step ahead it destroys the rollout (relative error 57× plain at
  step 300); trained through a 16-step unroll it reaches 0.49 on held-out
  against 0.375 for the uncorrected coarse scheme, and 0.42 against 0.56 out of
  distribution. Its effective-resolution score at factor 4 (0.47) does not beat
  plain factor 4 (0.456) and is nowhere near plain factor 2 (0.26). The
  site's own discretization correction, with mass conservation in the wiring,
  is not yet more right than doing nothing, and running 2× finer beats it.
- The exact adjoint in `advect.ts` is the adjoint of the semi-Lagrangian gather
  with respect to the transported field, for a frozen velocity. It is not the
  derivative with respect to the velocity; that derivative (the spatial gradient
  of the bilinear interpolant at the backtraced point) is about forty lines and
  is needed by candidate 4.
- The cylinder flows are laminar at the site's inflows and viscosities. There
  is no closure in the loop, so the model-form bin does not exist on this
  solver. Any candidate that needs a "run with more physics" as a teacher has
  to manufacture one.

## 1. Candidates, from first principles

Each: the bin; what the net sees (neighborhood, history, whether stochastic);
what it outputs; what it is forbidden from doing by construction; what checks it
in the loop; how it is trained; what it costs to test here.

**C1. Split-teacher corrections, each net tagged with its own scaling.** Bins:
discretization and model-form, separated. Two nets on the coarse grid. The
D-net sees the post-advection state and the local Courant numbers in a 3×3 to
5×5 cell neighborhood, one step of history (pre- and post-step fields), and is
deterministic; its label is (fine run of the same scheme, restricted) minus
(coarse step). The M-net sees the same state over a neighborhood fixed in
physical length rather than in cells, with a memory of several steps, and may
be stochastic; its label is (fine run with the extra physics, restricted) minus
(fine run of the same scheme, restricted), a quantity in which the coarse
discretization error does not appear at all. Both output face fluxes, so
neither can create mass. The constraint that separates them is in the scaling:
the D-net's flux is written as a bounded learned coefficient times a discrete
difference of the state across the face, so its divergence inherits the
scheme's truncation order and must vanish as Δx^p under refinement whatever the
weights say; the M-net's output is a rate with no Δx in it and must be
invariant under refinement. The check is a refinement sweep run with fixed
weights: apply the same weights at factors 2, 4, 8 of the same flow and measure
the correction's magnitude per step. A D-net whose correction does not fall at
the scheme's rate has learned something that is not discretization error and is
convicted; an M-net whose restricted effect changes with factor has absorbed
discretization error and is convicted. Trained through the differentiable
solver with an unroll, as the site's net already is. Cost here: the frozen-swirl
lane already has factors 2, 4, 8 of one fine flow; the D-net is a rewrite of
the last layer of `advectCorrection`; the M-net needs a synthetic extra physics
in the fine teacher (a resolved diffusivity, or a source term) because the
solver has no closure; two training runs of minutes each in the existing
harness, plus the sweep.

**C2. A read-only auditor that allocates compute.** Bins: discretization
(locally) and model-form (where an exact but expensive term exists). The net
sees a 5×5 neighborhood of the state, the local Courant number, the previous
step's allocation map and the previous step's audit reading (so it has one step
of history), and is deterministic. It outputs a per-cell score; the top-B cells
by score get the expensive branch (a higher-order backtrace interpolant, a
sub-step, extra local work, or the exact physics term), the rest get the cheap
classical branch. It cannot write to u, v, p, or dye; every branch it can
select is a valid solver step, so the worst it can do is spend the budget in
the wrong places. What checks it in the loop is a random audit: on a fraction f
of the cells it marked "cheap is fine," the expensive branch is computed anyway
and not applied, and the gap between the two is recorded. That gap is an
unbiased estimate of the error the auditor is leaving behind, at cost f times
the expensive branch; it bounds the auditor's unseen error, and when it drifts
above a threshold the allocation falls back to a classical indicator or the
weights are retrained. Trained from the fine run (label: the local coarse-vs-fine
gap) or self-supervised from the audit signal itself (label: the cheap-vs-
expensive gap, which the net is asked to predict without computing). Cost here:
a bicubic backtrace interpolant (~50 lines), the audit loop, four baselines at
equal budget; one to two days.

**C3. Gate with classical fallback.** Bins: any bin with a check that can
convict. The net proposes a step; a physical check runs on the proposal; on
failure the classical rule runs instead. For pressure the check acquits (the
residual) and this is the site's existing warm start. For advection the flux
form makes mass automatic, so mass cannot gate; the check that can convict is
boundedness: the transported scalar may not leave the range of the values it
was interpolated from. The step-level version compares the proposal against
that bound and reverts the whole step. The per-cell continuous version is a
limiter: the net's flux is the anti-diffusive flux and a flux-corrected-
transport limiter clips it face by face so no cell exceeds its local bound.
Forbidden: new extrema. Checks itself every cell every step. Trained through
the limiter (piecewise differentiable). Cost here: a Zalesak limiter after
`advectCorrection` (~60 lines), retrain, rerun `FluxRollout`; a day.

**C4. Inputs from observations, the net confined to what observations cannot
see.** Bin: input error. The net sees a window of sparse observations (dye
images at two times, a few velocity probes, a surface-elevation track) and
outputs a proposal for the unknown input (initial velocity, inflow profile,
forcing); the classical solver evolves it, so the net cannot touch the
dynamics. The constraint is stronger than "only inputs": the observation
operator through the solver has a null space (the directions the data cannot
see), and the net is only allowed to fill that null space; the observable part
is solved classically by minimizing misfit with the exact adjoint, and the net
cannot override it. For dye, the null space is flow along the dye's own
isolines; for waves, the deep-water bottom and anything below the surface's
reach. The check is the misfit at held-out observations (a velocity probe the
net never saw), offline but cheap. Trained on flow statistics (a prior over
swirls, or reanalysis), not on a teacher simulation of the case at hand. Cost
here: the velocity-derivative of the bilinear gather (~40 lines), a Gauss–Newton
loop using the existing adjoint, a null-space projector; two days.

**C5. Geometry and forcing from observations.** Same mechanism as C4 with a
static unknown: the solid mask or bathymetry, the inflow profile, the wind. The
net sees observations of the wake or the surface over a window and outputs the
static field; the solver runs on it. Forbidden: state writes. Check: forward
misfit at held-out probes. Trained through the differentiable solver, which
needs the projection to be differentiable in a soft solid fraction (the
pressure net already takes solid fraction as an input channel). Cost here:
moderate; the cylinder's position and radius from a dye image is a two-
parameter inverse and could be done by finite differences without any adjoint.

**C6. Resolution allocation as the learned quantity.** Bin: discretization. The
net sees the state and the last refinement map and outputs a refinement map
(which blocks run at 2×) or a monitor function for a moving mesh; classical
dynamics run on the chosen representation; the transfer between resolutions is
a conservative restriction. Forbidden: state writes; it moves the grid, not the
fluid. Check: the conservative remap (mass exact) and a classical a-posteriori
indicator. Trained from the fine run's error map, or through the solver when
the mesh choice is continuous. Cost here: a two-level grid inside the swirl
lane and the interface remap; days.

**C7. Statistical meters for chaotic flow.** Bin: chaos and outcome. A learned
discriminator sees windows of the coarse run and windows of the fine run and
outputs whether they are distinguishable; used as a training loss or as the
acceptance test. Alternatives that are not learned: the shedding spectrum's
peak and width, the lift and drag distributions, the recirculation length, the
spread–skill relation of an ensemble. Writes nothing. Trained on fine-run
samples. Cost here: the wake sheds at the site's higher inflows, so a Strouhal
meter is an afternoon; a learned discriminator is a day and its own
verification problem.

**C8. The warm start behind the residual gate.** Bin: iterative. The site's
existing net. Sees the restricted divergence and solid fraction, outputs p₀,
forbidden nothing by itself; the residual acquits whatever the solver produces
after it. Trained on the exact solve. Already built; zero cost.

**C9. A learned preconditioner or smoother.** Bin: iterative. The net sees the
current residual (not the right-hand side) and outputs an approximate inverse
applied to it inside each iteration. Forbidden: changing the fixed point (the
residual still acquits). Trained to minimize the residual after k iterations
through the solver. Cost here: a day.

**C10. Learned outflow boundary from a longer-domain teacher.** Bin: input
(boundary). The net sees the interior near the outflow over a few steps of
history and outputs the boundary layer's values; the teacher is the same solver
on a channel twice as long, restricted to the short channel's boundary.
Forbidden: writes only to the boundary cells, never the interior. Check: mass
flux through the outflow must equal the inflow flux (conservation, convicts);
the interior-vs-long-domain misfit offline. Cost here: a second solver instance
at 192×64, a small net, a day.

**C11. A stochastic correction with an energy ledger.** Bin: model-form. The
net outputs a distribution over face fluxes; samples enter through a
conservative antisymmetric exchange so they cannot create mass or energy; the
noise amplitude is set by a budget the coarse run measures (the resolved
energy's deficit against the fine run). Check: the spread–skill relation of an
ensemble against perturbed fine runs. Trained with a proper scoring rule
against fine-run samples. Cost here: needs a shedding wake and an ensemble of
fine runs; days.

**C12. A classical indicator masks the learned correction.** Bin:
discretization. The correction from C1 or C3 is multiplied by a classical
truncation-error indicator (the local second difference of the transported
field) and is therefore zero wherever the scheme is already accurate.
Forbidden: correcting a smooth region, which is where a rollout-trained net
learns to inject stabilizing terms that are not discretization error. Check:
the indicator is the check. Cost: a line, once C1 exists.

**C13. A learned stopping rule for the pressure solve.** Bin: iterative. The
net predicts how many sweeps this step needs from the divergence field.
Forbidden nothing. Check: the residual. Cost: trivial.

**C14. An error-attribution net that only reports.** Bin: all. The net
estimates the local discretization error from the coarse state and reports it;
no allocation, no writes. The read-only half of C2.

## 2. Kill ledger

- C3 (step-level gate with whole-step fallback): killed — with mass automatic
  and bound violations rare, the gate is either always open or flips whole steps
  to classical, which makes the rollout and the training signal discontinuous;
  the per-cell limiter form survives as C3′.
- C5: merged into C4 — same mechanism with a static unknown; kept as a
  sub-experiment.
- C6: merged into C2 — an error estimator that chooses the representation is
  the same net as one that chooses the compute; kept as C2's refinement branch.
- C7: killed as a component — it forbids nothing about the state, and a
  learned checker is the "nothing checks it" row of §4 wearing a costume;
  retained as the instrument C1 and C11 need for chaotic targets.
- C8: killed — only gain is speed; the residual acquits the classical solver's
  answer, not the net's; already built.
- C9: killed — multigrid reaches every point on the error-versus-compute curve a
  learned preconditioner can, so the only gain is speed over a soft baseline;
  PROBLEM.md §2 says this bin is closed classically and the site's own CG
  number confirms it.
- C11: killed for this lane — the fence (conservative exchange) is C1's, the
  meter is C7's, and the rest is the closure's internals, which is the other
  scientist's lane.
- C12: merged into C1 — writing the D-net as a coefficient times a difference
  operator gives the mask for free.
- C13: killed — the residual meter is already the exact stopping rule; a net
  predicting it forbids nothing and can only be wrong.
- C14: merged into C2 — the report without the decision is a subset.

Survivors: C1, C2, C3′, C4 (with C5), C10.

## 3. Literature check per survivor

**C1 — split teachers with a scaling tag.** The fence that forces a learned
stencil to keep a known order exists: Bar-Sinai, Hoyer, Hickey and Brenner
(PNAS 116:15344, 2019) layer "a fixed affine transformation" so that
"approximation errors decay as O(Δx^m)", and Kochkov et al. (PNAS 2021,
arXiv:2102.01010) constrain their learned interpolation coefficients to sum to
one, "which guarantees that the interpolation is at least first order accurate."
Neither splits the label by teacher: Bar-Sinai trains on the resolved
equation's own fine solution (a pure discretization teacher, no closure) and
Kochkov trains on filtered DNS at one coarsening and retrains "for 2× coarser
or 2× finer coarse-graining"; neither reports a grid-convergence test of the
learned term. The opposite move is the current state of the art in closures:
Agdestein and Sanderse (J. Comput. Phys. 2024, arXiv:2403.18088) discretize
first and filter next precisely so that "the LES discretization error is
included in the learning process, [and] the closure models can learn to account
for the discretization"; a single network learns the combined commutator, and
"a closure model parameter set θ is only used for testing on the same coarse
grid and same filter type that it was trained for." Sirignano, MacArt and
Freund's DPM (J. Comput. Phys. 2020, arXiv:1911.09145) likewise learns the
total unclosed term of the coarse discretization as one function. Gupta and
Lermusiaux (Sci. Rep. 2023, arXiv:2301.06198) get generalization across grid
resolution by giving the closure the resolution as an input, a learned
dependence rather than a forced one. Where prior art stops: no one gives the
discretization correction and the physics correction different teachers and
different scaling fences, and no one runs the refinement sweep with fixed
weights as the test that convicts a net of having learned the other bin's
error. The parts are known; the split and the sweep as a check are not.

**C2 — the audited auditor.** Learned mesh refinement exists: Foucart, Charous
and Lermusiaux (J. Comput. Phys. 2023, arXiv:2209.12351) treat AMR as a
partially observable MDP whose policy observes local solution jumps and the
resource budget, acts only with {coarsen, do nothing, refine}, never writes to
the solution, and is rewarded by the change in the solution upon refinement,
so "the training process does not require an exact solution or a high-fidelity
ground truth"; there is no online verification, the guarantee being the finite-
element fact that error "decreases or remains the same upon any refinement."
Yang et al. (AISTATS 2023, PMLR v206; AAMAS 2023) and Freymuth et al. (NeurIPS
2023) extend it to global and swarm policies. Uncertainty-triggered expensive
calls exist in molecular dynamics: FLARE (Vandermause et al., npj Comput.
Mater. 2020) calls DFT "if the predictive standard deviation on a force
component rises above a chosen multiple of the optimized noise parameter"; the
trigger is the model's own uncertainty, self-reported, not an independent
sample. The unbiased-estimate-from-few-expensive-calls idea is multifidelity
Monte Carlo (Peherstorfer, Willcox and Gunzburger, SIAM J. Sci. Comput. 2016;
SIAM Review 2018): a surrogate as control variate with "recourse to the
high-fidelity model to establish accuracy and/or convergence guarantees," used
for offline uncertainty propagation. In wave modeling the exact four-wave term
has a learned emulator, NLML (Ikuyajolu et al., JGR: Machine Learning and
Computation 2026, doi:10.1029/2025JH000699; full text was not reachable in this
session, the following is from the abstract and summaries): it replaces DIA
with an emulator of WRT everywhere, at about 1.04× DIA's cost and "2× the
accuracy of DIA in global wave spectral energy"; nothing in the accessible text
describes selective invocation or an in-loop check. Where prior art stops: no
one allocates an exact-but-expensive term selectively with a learned auditor
and bounds the auditor's unseen error by random audits in the loop; the AMR
policies are unaudited because their setting has a monotonicity theorem, and
the emulators are unaudited because they replace the term rather than choose
where to call it.

**C3′ — limiter on a learned anti-diffusive flux.** Exists, in several forms.
Learned TVD limiters trained through differentiable solvers (arXiv:2503.09625)
represent "the limiter as a pointwise convex linear combination of the Minmod
and Superbee limiters," which keeps second order and TVD by construction;
Nguyen-Fotiadis et al., "Machine learning changes the rules for flux limiters"
(Phys. Fluids 2022, arXiv:2108.11864); and closest to the proposal, Kuzmin's
group on the shallow-water equations (Appl. Math. Comput. 2025,
arXiv:2407.17214) uses "neural networks as generators of subgrid fluxes" with
"the monolithic convex limiting procedure integrated into flux-corrected coarse-
mesh discretization." That is C3′ as written. Where it stops short: it is on
flux-form finite-volume schemes; the site's scheme is semi-Lagrangian with the
learned flux as an additive correction, and the limiter would bound the
correction, not the scheme. Reported as existing; it is the repair the site's
advection net should get, not a gem.

**C4 — null-space-confined inputs from observations.** The fence exists as an
inverse-problems result: Schwab, Antholzer and Haltmeier (Inverse Problems
35:025008, 2019, arXiv:1806.06137) define null-space networks that add only
components in the null space of the forward operator, so data consistency is
preserved, and prove they are a regularization method with convergence rates.
Learned components inside variational assimilation exist: Frerix et al. (ICML
2021) learn the inverse observation operator to initialize 4D-Var, with the
dynamics classical and the final estimate unconstrained by the net; neural
incremental DA (arXiv:2406.15076) learns coarse-to-fine priors; 4D-VarNet
replaces the dynamical prior with a trained one. The unobservable direction
for scalar transport is the aperture problem of optical-flow velocimetry
("only motion perpendicular to brightness gradient contours can be
determined"; review in Meas. Sci. Technol. 2025, doi:10.1088/1361-6501/adafcf).
Where prior art stops: null-space networks have been placed on static imaging
operators, not on the operator that is the observation composed with a time
integration through a differentiable solver, where the null space moves with
the state; and no assimilation paper states the observability limit as the
design rule for what the learned prior is allowed to supply.

**C10 — learned outflow from a longer-domain teacher.** Exists, at least for
lattice Boltzmann: arXiv:2506.05293 (Phys. Fluids 38:015122, 2026) feeds "nine
local distribution functions at the penultimate lattice layer" to a net that
writes three outgoing distributions at the boundary, trained on a converged
cylinder flow at Re = 200 by supervised prediction of layer x from layer x−1,
and recovers literature drag and Strouhal number with the outflow at 28 D and a
NACA0012 with the outflow 0.5 chords behind the trailing edge. No conservation
check and no fallback are reported; the teacher is a single snapshot with no
history. Where it stops short: the checks. Reported as existing; not a gem.

## 4. Gems, ranked

### Gem 1. Two teachers, two fences, one sweep

**Claim.** A learned discretization correction and a learned physics correction
can be separated by construction and told apart by a test, if each is given
the label from its own teacher and the scaling of its own bin: the
discretization net's output carries Δx^p in its wiring and must vanish under
refinement, the physics net's output carries no Δx and must not change under
refinement, and a refinement sweep with fixed weights convicts whichever net has
learned the other's error. Without the fences and the sweep, a correction
trained on the total gap (the current practice in Agdestein–Sanderse, Kochkov,
DPM) is a single function that is free to be discretization error at the
training resolution and physics at any other, and no one can say which.

**Forbidden thing.** The D-net cannot emit a correction that survives
refinement: its flux is a bounded coefficient times a face difference of the
state, so its divergence is a second difference and scales as the scheme's
truncation term does. It therefore also cannot correct a smooth region (C12
for free). The M-net cannot emit anything that depends on the grid: its inputs
are sampled on a neighborhood fixed in physical length, not in cells, and its
output is a rate.

**Check.** The refinement sweep, offline, per net, minutes: run the same weights
at factors 8, 4, 2 of the same fine flow and plot the per-step correction
magnitude against Δx on log axes. The D-net's slope must be the scheme's
observed order p (measured on the uncorrected scheme first, on the same seeds,
because on the site's sharp-edged discs and stripes the bilinear scheme is not
at its smooth-field order and p must be read, not assumed). The M-net's
restricted effect must be flat in Δx to within the fine-grid truncation. Mass
conservation stays in the wiring for both. Inside the rollout nothing new
checks either net; this gem's check is the offline sweep and it convicts only.

**Experiment on this site.** In the swirl lane of `advect.ts`, which already
holds one fine 96×64 flow and its factor-2, -4, -8 coarsenings: (i) lift the
factor-4 guard in `CoarseLane` and run the shipped in-the-loop weights at
factors 2 and 8 to record what an unfenced net does under refinement (the
prediction is that its correction does not fall, because its bound is
`FLUX_SCALE · RMS(dye)` with no Δx in it); (ii) rewrite the last layer so the
face flux is `tanh(net) · (c_R − c_L)` with the same tanh bound, retrain with
the existing 16-step unroll, and rerun the sweep; (iii) add a resolved
diffusivity to the fine teacher only, train an M-net on the difference of the
two fine runs with a neighborhood of fixed physical size, and run both sweeps;
(iv) as the control, train one unsplit net on the total gap with the D fence
and show the sweep leaves a residual that does not shrink, which is the
physics it was forbidden to express. The score that matters is the one the
manifest already reports: relative error at step 300 on held out against plain
factor 4 (0.375) and plain factor 2 (0.26). Two days.

**How it fails.** The fine teacher may not be fine enough: the M-net's label is
contaminated at O(Δx_fine^p), which for a first-order-behaving scheme on
discontinuities is not small at 96×64. The order p may be seed-dependent, so
one fence does not fit all regions and the sweep has to be read locally. A
correction fenced to vanish may be too weak to do the stabilizing work the
site's unroll-trained net was doing, in which case the result is that
the in-the-loop gain was rollout stabilization and not discretization
correction, and the site's negative manifest number is explained rather than
beaten. And on this solver the physics teacher is synthetic, so the experiment
proves separability, not that the M-net is useful; usefulness needs a flow
with a real closure.

### Gem 2. The audited auditor

**Claim.** A learned component that only decides where an expensive branch is
called, and whose unseen error is bounded in the loop by random audits of its
own verdicts, is more right at fixed compute than uniform allocation and
cannot be wrong in a way that goes unmeasured. The audit is the part missing
from every existing allocator: RL mesh refinement leans on a monotonicity
theorem that advection and source terms do not have, and emulators of exact
terms replace the term everywhere rather than choosing where it is needed.

**Forbidden thing.** No write access to the state. Every branch the auditor
can select is a valid classical step. Its only power is over the budget.

**Check.** On a fraction f of the cells it marked cheap, compute the expensive
branch anyway, do not apply it, and record the gap. With 6144 cells and
f = 0.05 that is about 300 samples per step, a standard error of σ/√300 on the
mean unseen gap, at 5% of the expensive branch's cost. The audit reading is an
unbiased estimate of the per-step error the allocation is leaving behind;
compared offline against the fine-restricted truth once, it becomes a
calibrated in-loop meter. If it drifts above a threshold the allocator is
replaced by the classical indicator for that step, and the audited samples are
the retraining set. Conservation is untouched because both branches conserve.

**Experiment on this site.** Advection interpolation order on the cylinder
channel or the swirl lane: write a bicubic backtrace interpolant; give the
auditor a 5×5 neighborhood of dye and velocity, the local Courant number, the
last allocation map and the last audit reading; a budget B of cells get cubic,
the rest bilinear. Baselines at equal B: uniform bilinear, uniform cubic (the
ceiling of the lever), random B, and top-B by the classical curvature indicator
|δ²c|, which is the fair opponent. Label for training: the per-cell
cheap-vs-expensive gap, predicted without computing it (self-supervised), with
the fine run as validator only. Report rollout error at step 300 against the
fine-restricted ghost, and the audit reading's correlation with the true
local gap. The iterative branch is excluded on purpose: the residual already
decides sweeps exactly, and block sweeps cannot remove smooth error, so an
auditor has nothing to allocate there. One to two days. The wave-model version
cannot run here: the auditor chooses per grid point per step between DIA and
the exact WRT integral, with WRT called on a random f of DIA points as the
audit; NLML is the emulator that would sit in the cheap branch.

**How it fails.** If the curvature indicator captures nearly all of the
achievable gain, the learned auditor is a re-labeled classical estimator and
the result is a kill; this is a real possibility, since semi-Lagrangian error
is dominated by the interpolant's second difference and the net's only extra
information is the backtrace direction. The audit is unbiased for the
marginal per-step error, not for the compounded rollout error, so a myopic
auditor can pass every audit and still lose at step 300. And the audit only
measures what the expensive branch would have said; where both branches are
wrong together (the model-form bin without a real exact term), the audit is
blind.

### Gem 3. The net fills only what the data cannot see

**Claim.** For inputs and state estimated from observations with no teacher
simulation, the learned component should be confined to the null space of the
observation operator composed with the solver: the observable part is solved
classically by the exact adjoint, the net supplies only the unobservable part
from a prior over flows, and the resulting estimate cannot contradict an
observation. The fence is a known inverse-problems construction (null-space
networks); placing it on a dynamics-constrained fluid inverse, where the null
space moves with the state, and stating the observability limit as the rule
for what the prior may supply, is the part not found.

**Forbidden thing.** Overriding data. The net's output is projected onto the
null space of the linearized observation operator at each Gauss–Newton
iterate, so its contribution has zero effect on the predicted observations to
first order.

**Check.** Held-out observations, offline: a velocity probe the estimate never
saw, or a later dye image. The misfit at seen observations is fixed by the
classical solve and says nothing about the net; the misfit at unseen probes is
the net's score.

**Experiment on this site.** In the swirl lane: observe dye at t = 0 and
t = 30 steps on the fine grid; unknown: the frozen velocity field. Write the
derivative of the bilinear gather with respect to the backtrace position, run
Gauss–Newton with the existing adjoint, and show the null space: the
along-isoline velocity component is unrecovered and the residual is flat in
that direction. Then fit a prior over the swirl family (the generator in
`makeSwirl` is the population) and let a small net propose the null-space
component conditioned on the observable estimate; score at held-out point
probes and on the second-step dye. The comparison is against Gauss–Newton with
a Tikhonov background, which is what 4D-Var would give in the null space. The
coastal-wave statement that goes with it cannot be run here: surface elevation
observes the depth only where kh is small, so a learned bathymetry prior is
confined to deep water by construction and the shoaling zone is the data's.
Two days.

**How it fails.** The null space is state-dependent, so the projector has to be
rebuilt at each iterate; a cheap approximate projector leaks the net into the
observable subspace and the fence is gone. Where the prior is wrong (a flow
outside the swirl family) the null-space fill is wrong and, by construction, no
observation can convict it; this is the bin's ceiling, not the method's flaw,
but it means the score can only be read on held-out observations that do reach
the null space, and a probe placed along an isoline reads nothing.

## 5. Verdict by bin

**Model-form.** The system can isolate this bin (the second teacher), fence
what enters it (conservative exchange, resolution invariance, a neighborhood
fixed in physical length), and allocate an exact term to where it matters
(gem 2 with a real expensive branch). It cannot make the closure right; that is
the closure's internals and its history and stochasticity, which is the other
lane. On this site the bin does not exist, and every experiment here that
touches it uses a manufactured physics and proves separation, not skill.

**Discretization.** Yes, with the fence. It is the one bin with a clean teacher,
and the site's own manifest shows what happens without a scaling fence: an
unroll-trained correction that is not better than the uncorrected scheme and
is beaten by running 2× finer. A correction that carries Δx^p in its wiring and
survives the refinement sweep is a discretization correction; one that does
not is a surrogate for the scheme with a mass-conserving costume, and the
sweep is what tells them apart.

**Iterative.** No. The residual acquits, multigrid closes the bin, and every
learned insertion here (warm start, preconditioner, stopping rule) can only
change speed. The site's gate figures are the correct and complete statement.

**Input.** Yes, within observability. The net may fill the null space of what
the data can see and nothing else; the fence is a projector, the check is a
held-out observation, and the ceiling is the observation operator itself:
dye gives the cross-isoline velocity and not the rest; the sea surface gives
the shallow bottom and not the deep one; a wave model given the wrong wind
cannot be corrected by anything downstream of the wind.

**Outcome and chaos.** Not pointwise, by any component. The system's
contribution is the meter, and a learned meter is unchecked; the meters that can be checked
here are classical statistics of the shedding wake. Whether a stochastic
correction with the right ensemble calibration can be more right in the
statistics is a closure-lane question that this lane can only fence and
measure.

What no learned component can be allowed to do, in any bin: replace the thing
that checks it.
