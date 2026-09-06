# PROPOSAL — The Equation at Thirty-Two Cells

> **STATUS: UNAPPROVED. Awaiting Nick's go / no-go.**
> Nothing here is started. No sim exists, no weights exist, no lesson entry
> exists. This is the constructive follow-up to waves 05 (*Where the Simulation
> Is Wrong*), written down because the reasoning behind it lived only in a chat
> that a reboot ended. On a yes it is a one-to-two-week build; on a no it costs
> nothing and this document is the record of why it was declined.
>
> Recovered from session `44cad31c` (2026-09-02 → 2026-09-06), whose last turn
> was this proposal delivered verbally and never answered. Its inputs are
> `PROBLEM.md`, `INVENTION_A_closure.md` (Gem 1, the learned ledger),
> `INVENTION_B_system.md`, and `LANDSCAPE.md`, all committed at `e1f7f02`.

## The question that produced it

Nick, 2026-09-06: *"so is this only about where it's wrong? Could we have new
ideas that are like 'How we reinvented frontier mathematics and created a new
fluid simulation that is faster and more accurate by rebasing the theory around
deep learning?' And could/should we even replace Navier–Stokes?"*

Waves 05 is diagnostic by construction: five places a model is wrong, ordered by
what can still check the learned part. It names failures. It proposes nothing.
The honest constructive article is the one after it, and this is its brief.

## The answer, in two moves

### 1. No, there is nothing in Navier–Stokes to replace

Navier–Stokes is conservation of momentum and mass — which are symmetries, not
models — plus one constitutive law, stress proportional to strain rate, which for
water and air is right to more decimal places than any measurement will ever
need. Every failure catalogued in `LANDSCAPE.md` is a failure of what we do to
the equation in order to afford it: the grid, the closure, the inputs, the
solver. The equation is the one part of the pipeline that is never wrong.
Any article that opens on "replacing Navier–Stokes" is selling something.

### 2. What can be replaced is the assumption that the equation *at finite resolution* is Navier–Stokes-shaped

Every simulator on Earth makes the same move: take NS, discretize it, bolt on a
closure that is a local function of the resolved state. **Mori–Zwanzig says that
move is false.** The exact equation of motion for the resolved field at
resolution Δ is not NS with a correction term; it is a *stochastic operator with
memory*. What the fine scales do to the coarse ones depends on the coarse
history and on unresolved initial data that, from the coarse side, is
indistinguishable from noise. Nobody has written that equation down, because it
has no closed form.

It can only be learned. That is the one place where "rebase the theory around
learning" is a sentence with content rather than a slogan:

> The equation of motion at any affordable resolution is not Navier–Stokes. It
> is a learned operator that inherits NS's symmetries and conservation laws and
> is fit to NS's own fine solutions.

Faster, because it runs coarse. **More accurate, because at that resolution it
is the right equation and NS-plus-Smagorinsky is the wrong one.** Both halves of
the marketing sentence become literally true, and neither is a speedup claim.

And it passes Nick's relabeling test — the article's own standard, from
`PROBLEM.md`: a learned component earns its place by what it is *forbidden* to
do. This one forbids the Markov-local closure, which is a degree of freedom
every current simulator has and should not have.

### The strongest version, which we are not building

For breaking waves the sharpest form is a *surface theory*. Classical theory has
Boussinesq-type equations up to the point of breaking and nothing after it;
every real-time wave simulator handles breaking with a threshold and an
empirical dissipation rate. The effective dynamics of the free surface *through*
breaking — including what leaves it as spray and what goes under as entrained
air — is a two-dimensional object whose equation nobody has and whose teachers
exist: two-phase Navier–Stokes at ~500,000 CPU-hours a run, and the tank. A
learned surface operator with memory, a noise term paid from an energy account,
and conservation written as exchange would be the first equation for that
object. Against an under-resolved three-dimensional run — which is all anyone
can afford — "more accurate than Navier–Stokes" would be *literally* true,
because the tank is the truth and the coarse NS run is not.

**This is out of scope here.** The public site has no free-surface solver, and
this proposal does not cross into the private engine. Recorded because it is
that engine's research program if Nick ever wants it, and because it is the
reason the box below is the *principle* and not the payoff.

## The build: a forced periodic box, three lanes

What *can* be shown on this site is the principle, and it is enough for an
article. A doubly periodic 2D Kolmogorov box with the forcing placed **above the
coarse cutoff**. In that setting the coarse run contains no forcing at all, so
every unit of resolved energy has to arrive from below, through the closure. An
eddy viscosity of any coefficient gives a dead run, because ν_t ≥ 0 means the
closure's work on the resolved field can only be negative. This is the sharpest
possible test of a stochastic, ledgered closure and the *wrong* test of a
dissipative one — which is exactly why it is the figure.

**The hero is a dead flow beside a live one.** The claim under it is measurable
and unhedged: *at thirty-two cells across, the equation of motion is not
Navier–Stokes, and here is the one that is.*

### The box, defined once

Doubly periodic 2D domain, Kolmogorov forcing at wavenumber `k_f`, small
viscosity, weak linear drag at the largest scales so the inverse cascade has
somewhere to go. Reference is a pseudo-spectral vorticity solver, 2/3
dealiasing, RK4. **Setting B** is the one that matters: `k_f = 40` with the
coarse grid keeping `|k| ≤ 16`. (Setting A, `k_f = 4` resolved by the coarse
grid, is the classical LES test and is kept only as the control that shows the
mechanism buys nothing when the cutoff sits above the injection scale — a result
worth having either way.)

The coarse solver is *also* pseudo-spectral, truncated, and deliberately not the
site's solver: that way the coarse run's own discretization error is negligible
on the scales it keeps, and whatever residual remains is the closure alone. The
exact target is computable — filter the reference each step, form the sub-grid
stress `τ = ⟨uu⟩ − ⟨u⟩⟨u⟩` and its energy transfer `Π = −τ:S̄`, whose sign per
cell is the forward/backscatter split.

### The three lanes, as three specified runs

| lane | what runs | resolution | closure | what it is for |
|---|---|---|---|---|
| **L1 — fine reference** | pseudo-spectral vorticity, 2/3 dealiasing, RK4, forcing at `k_f = 40` | 1024² for the experiment; **256² for the shipped figure** | none — it *is* the truth | the teacher and the scoreboard. Filtered each step to produce the exact `τ` and `Π` that train L3 |
| **L2 — best NS-shaped closure** | same coarse spectral scheme, `|k| ≤ 16` | 32² | the strongest honest NS-shaped candidates, run as a set: Smagorinsky (expected: dead run), the dynamic model, and van Gastelen's dissipative learned construction | the article's opposition. It must be the *best* NS-shaped closure, not a strawman, or the claim is worthless |
| **L3 — learned operator** | same coarse spectral scheme, `|k| ≤ 16` | 32² | the learned ledger operator (below) | the claim. Must match L1's filtered spectrum and transfer PDF, and stay stable at any rollout length |

All three run from the same initial condition, to the same wall time, measured
on the same quantities: resolved `E(k)` against the filtered reference, the
inverse-cascade flux, the sub-grid transfer PDF, the backscatter fraction, the
vorticity PDF, the decorrelation time, time to statistical steady state, and
long-rollout stability.

### The learned operator (INVENTION_A Gem 1, "the learned ledger")

A sub-grid **energy account** `e` and, because this is 2D, a sub-grid
**enstrophy account** `z`, both carried as fields and **advected by the resolved
flow** — the same semi-Lagrangian backtrace the site's solver already uses for
dye. Three exchange rates (drain, deterministic return, stochastic return) and
one sink (molecular loss) are learned functions of the resolved invariants, the
relative velocities in the stencil, and the local ledger value.

What it is **forbidden** to do, by construction — this is the part that earns it:

- **Energy creation.** Resolved kinetic energy plus `Σe` changes only by forcing
  and molecular loss, because every closure term is written as an *exchange*
  between two accounts rather than as a source.
- **Backscatter from an empty account.** Each step's total withdrawal
  (deterministic return plus the noise's expected injection) is capped at `e/Δt`,
  so `e ≥ 0` always. This is the fence the unbounded learned stochastic closures
  in the literature do not have; Perezhogin et al. report the failure it
  prevents (an eddy that emerges and runs away at 96²).
- **Divergent noise.** The random forcing is the curl of a random stream
  function, so it is divergence-free by construction.
- **Return at the wrong scale.** The enstrophy account pins it: a return of `ΔE`
  must carry `ΔZ = k²ΔE`, so the noise's spectral centroid is `√(z/e)`.
- **Frame dependence.** Inputs are differences and invariants only. No absolute
  velocity enters anywhere.

The noise is an **AR(1) process in time with a learned decorrelation time**, not
white noise per step. This is not a detail: white noise injects energy that
vanishes with `Δt` (Alvelius 1999; Perezhogin et al. 2023), and the ledger's
withdrawal has to equal the injection *actually delivered*, or the budget
identity is a lie.

**Training.** A priori: the ledger's exact value (`½ tr τ`) and exact transfer
(`−τ:S̄`) from the filtered reference train the drain and the deterministic
return; the sink is fitted to the reference's sub-grid dissipation. A
posteriori: the noise amplitude and decorrelation time are fit through the
differentiable 32² solver, on the resolved spectrum and the PDF of `Π`.

**The in-loop check, which is the whole point.** Every step, the two-account
budget: resolved KE + `Σe` against `∫(forcing − molecular loss)`, and the
enstrophy account likewise. Both are *exact identities* when the code is right,
so a nonzero residual is a conviction — of a bound violation or of a coding
error, with no ambiguity. Offline: an ensemble of coarse runs against an
ensemble of references as a **rank histogram** of resolved energy, which
convicts noise of the wrong amplitude or the wrong correlation time.

This is the gap in the literature, stated precisely: prior art has the
hand-built ledger (Jansen & Held) and the unbounded learned stochastic closure,
and **nobody has joined them.** No 2D ledger closure carries enstrophy.

## Cost

| item | estimate |
|---|---|
| The box | a few hundred lines, this repo's TypeScript, hand FFT. 256²/32² for the shipped figure |
| The experiment-grade reference | 1024² × 10⁴ steps: minutes on a GPU, ~an hour in NumPy. Coarse runs are seconds |
| Training the operator | offline; weights shipped with a manifest, exactly as the 809-parameter pressure net already is |
| The article | new spine, new lesson entry, hero + supporting figures |
| **Total** | **1–2 weeks of build** |

Nothing about this needs a cloud GPU or a standing service.

## The named risk

**The one honest failure mode, from the closure inventor's own write-up:** the
ledger is a one-pole memory of the sub-grid state. If the sub-grid energy's own
dynamics are *faster than the coarse step*, or nonlocal in a way that advecting
a scalar cannot carry, the learned rates fit the mean, the stochastic term
carries the rest, and the rank histogram comes out **U-shaped — under-dispersive
— with no fix short of more accounts.**

If that happens, the article's claim shrinks from *"the learned operator matches
the reference"* to *"the learned operator is closer than any NS-shaped closure."*
**That is still a result, and it is still the article** — it is just a weaker
headline than the one the title promises. Nick should approve the build knowing
the title may have to change.

Two smaller risks, recorded so they are not rediscovered:

- **The enstrophy pin may be too tight.** Real sub-grid return is not at a single
  wavenumber. Pinning the spectral centroid while the reference returns energy
  over a band would show up as a bump in `E(k)` at `√(z/e)`.
- **Setting A may buy nothing.** Where the coarse grid resolves the forcing, the
  ledger closure may not beat van Gastelen's dissipative construction. That
  would mean the mechanism matters only when the cutoff sits below the injection
  scale — which is a finding, and belongs in the article as one.

## Why this is not version III of lesson 04, or part of waves 05

Waves 05 is the map: five places a model is wrong, ordered by what can check the
learned part. It is complete and it is live. This is a different article with a
different spine — a single claim, one experiment, one hero, and a measured
number under it. It should be its own lesson entry when it is built, not a
version of anything. (Filing the map as "version III of *Teaching a Solver to
Guess*" was already the wrong call once, and correcting it is what promoted it
to waves 05 at `95ec4d0`.)

## The decision

- [ ] **GO** — build the box, train the operator, write *The Equation at Thirty-Two
  Cells* as its own lesson. 1–2 weeks. Accept that the headline may soften to
  "closer than any closure" if the rank histogram comes out U-shaped.
- [ ] **NO-GO** — leave waves 05 as the article on this subject, and this document
  as the record.
- [ ] **PARTIAL** — build the box and run L1 and L2 only (days, not weeks). That
  alone produces the dead-flow figure and proves the *negative* half of the
  claim, which is the half nobody disputes. Decide on L3 after seeing it.
