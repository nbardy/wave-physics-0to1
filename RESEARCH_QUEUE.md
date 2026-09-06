# RESEARCH_QUEUE.md

Open experiments, unbuilt figures, and passes that were measured but never
applied. One row per item: what it is, what it costs, what checks it, and **who
owes the decision**. Nothing here is in progress — if something is being built,
its state belongs in that article's `HANDOFF.md`, not here.

**The rule that keeps this doc from becoming a graveyard:** an item leaves the
queue three ways — built (state moves to a HANDOFF), killed (a one-line verdict
stays, so it is not re-proposed), or declined (same). Nothing sits here unowned.

Opened 2026-09-06, closing out session `44cad31c`, which finished its turn on an
unanswered proposal and was then orphaned by a reboot.

---

## The gate: eleven outlines nobody has read

Four of the five items below are downstream of one unread thing.
`redrafts/fable-2026-09-02/` holds a voice-doc critique and **eleven per-lesson
`REIMAGINE.md` outlines with new intros** — first drafts, unrevised, and **Nick
has read none of them**. Three are spine swaps that need his explicit yes
(navier-stokes, navier-stokes-history, jacobian-hessian). Until he reads
`02_INDEX.md` (which carries the main loop's verdict on each intro) and picks,
Q4 cannot start and Q3 is guessing at which lines to retire.

Cheapest unblocking action in the repo: **read `redrafts/fable-2026-09-02/02_INDEX.md`.**
It is 5 KB and it stands in for the eleven long files.

---

## Q1 — *The Equation at Thirty-Two Cells*: the forced Kolmogorov box

**Owner of the decision: Nick. UNAPPROVED — this is a go/no-go, not a task.**
Full brief, with the Mori–Zwanzig framing and the operator spec:
**`articles/08-learned-solver/PROPOSAL_thirty_two_cells.md`**. Read that before
acting on anything below; this entry is the queue's summary of it.

The constructive follow-up to waves 05. Thesis: do not replace Navier–Stokes —
it is conservation laws plus a constitutive law that is right. Replace the
*assumption that the equation at finite resolution is NS-shaped*. Mori–Zwanzig
says the exact coarse equation is a stochastic operator with memory, which has
no closed form and can therefore only be learned.

A doubly periodic 2D Kolmogorov box with **the forcing above the coarse cutoff**
(`k_f = 40`, coarse keeps `|k| ≤ 16`), so the coarse run contains no forcing and
every unit of resolved energy must arrive from below through the closure. Any
eddy viscosity gives a dead run there. Hero: a dead flow beside a live one.

### The three lanes, as three separately specified runs

| run | scheme | grid | closure | success is |
|---|---|---|---|---|
| **L1 fine reference** | pseudo-spectral vorticity, 2/3 dealiasing, RK4 | 1024² experiment / **256² shipped figure** | none — the teacher | filtered each step to yield exact `τ = ⟨uu⟩ − ⟨u⟩⟨u⟩` and `Π = −τ:S̄`; these train L3 |
| **L2 NS-shaped closure** | same coarse spectral scheme (deliberately *not* the site's solver, so residual = closure, not discretization) | 32² | Smagorinsky, dynamic model, van Gastelen's dissipative learned construction — the strongest honest set | expected **dead run**; must be the best NS-shaped closure or the comparison is worthless |
| **L3 learned operator** | same coarse spectral scheme | 32² | the learned ledger (below) | matches L1's filtered `E(k)` and transfer PDF; stable at any rollout length |

Same initial condition, same wall time, same measured set: resolved `E(k)`,
inverse-cascade flux, sub-grid transfer PDF, backscatter fraction, vorticity PDF,
decorrelation time, time to steady state, long-rollout stability.

### The energy ledger and the correlated noise

Sub-grid **energy** account `e` plus, because this is 2D, a sub-grid
**enstrophy** account `z` — both carried as fields and **advected by the resolved
flow**. Three learned exchange rates (drain, deterministic return, stochastic
return) and one learned sink (molecular loss), as functions of resolved
invariants, stencil relative velocities, and the local ledger.

Forbidden by construction, which is what earns the network its place:

- **Energy creation** — resolved KE + `Σe` changes only by forcing and molecular
  loss; every closure term is an exchange, never a source.
- **Backscatter from an empty account** — each step's withdrawal is capped at
  `e/Δt`, so `e ≥ 0` always. This is the fence the unbounded learned stochastic
  closures lack (Perezhogin et al.'s runaway eddy at 96²).
- **Divergent noise** — the random forcing is the curl of a random stream function.
- **Return at the wrong scale** — `ΔZ = k²ΔE` pins the noise's spectral centroid
  at `√(z/e)`.
- **Frame dependence** — differences and invariants only; no absolute velocity.

The noise is **AR(1) in time with a learned decorrelation time**, not white noise
per step: white noise injects energy that vanishes with `Δt`, and the ledger's
withdrawal must equal the injection actually delivered.

**In-loop check:** the two-account budget every step (resolved KE + `Σe` against
`∫(forcing − molecular loss)`, and the same for enstrophy). Both are exact
identities, so a nonzero residual is a conviction. **Offline check:** a rank
histogram of resolved energy over an ensemble, which convicts wrong noise
amplitude or wrong correlation time.

### Cost and risk

**1–2 weeks.** The box is a few hundred lines of this repo's TypeScript with a
hand FFT; the operator trains offline and ships as weights with a manifest, the
way the 809-parameter pressure net already does. No cloud GPU, no standing
service.

**Named risk:** the ledger is a one-pole memory. If the sub-grid state's own
dynamics are faster than the coarse step, the rank histogram comes out U-shaped
(under-dispersive) and the claim shrinks from *"matches the reference"* to
*"closer than any NS-shaped closure."* Still a result, still an article, weaker
title. Two smaller ones: the enstrophy pin may be too tight (a bump in `E(k)` at
`√(z/e)`), and in the control setting where the coarse grid resolves the forcing
the ledger may buy nothing over a dissipative construction.

**Cheaper option on the table:** build L1 + L2 only. Days, not weeks; produces
the dead-flow figure and proves the negative half of the claim, which nobody
disputes. Decide on L3 after seeing it.

---

## Q2 — the refinement sweep (INVENTION_B Gem B1)

**Owner: Nick, but this is the cheap one and it was ranked "build first."**
Two teachers, two fences, and a sweep at refinement factors 8, 4, 2 that
convicts whichever network learned the other's error: a discretization net
cannot emit a correction that survives refinement, and a physics net cannot see
the grid. **~2 days on the existing `check:learned` harness** — no new sim.

Why it matters beyond the article: it explains the site's own measured negative
result, that the advection correction trained through a 16-step unroll scores
*worse* at step 300 than the uncorrected coarse scheme. Both inventors
independently found the underlying reason — the site's cylinder at Re ≤ 400 has
a laminar wake and therefore **nothing sub-grid to learn**; the whole
coarse-to-fine gap is numerical diffusion, so any "closure" trained on it is a
discretization correction in costume.

### Also banked, not queued (from the same invention pass)

One line each so they are not re-invented from scratch. Full write-ups in
`articles/08-learned-solver/INVENTION_A_closure.md` and `INVENTION_B_system.md`.

| gem | bin | checked by | verdict on record |
|---|---|---|---|
| A2 advected memory | closure | the boost test, exact in a periodic box | run the afternoon-long diagnostic first; if Lagrangian history does not explain the residual, it dies honestly |
| A3 projected, audited four-wave transfer | closure, waves | exact term on a random sample of bins — the only acquitting meter in the lane | for a wave builder; needs a single-point WAVEWATCH III run, cannot run here |
| B2 audited auditor | compute allocation | random audits of its own cheap verdicts | likely a kill if the curvature indicator captures the gain — and a kill is a result |
| B3 null-space net for inputs | input | held-out probes | a known fence on a new problem; ~2 days |

Both lanes independently killed the same three things: anything in the iterative
bin (speed only, closed by multigrid), learned checkers (a checker nobody
checks), and PINNs as forward solvers.

---

## Q3 — fold the sentence law and the cadence rule into the voice docs

**Owner: whoever writes next. Measured, agreed, and never applied.**

The pattern Nick named — *"boring statement, break, attempt at being
interesting"* — was measured in the lesson-04 rewrite and the numbers said it is
structural, not a few lines:

- 18 of 51 paragraphs end on a sentence of twelve words or fewer, after longer
  ones — a build-then-punch every third paragraph.
- 11 pairs of the exact shape "The X. The/It Y," with the second sentence short.
- 29 em-dashes in 2,650 words, 8 of them a "— surprising fact —" interjection
  dropped into an otherwise plain sentence.

**The docs prescribe it.** ESSENCE §1 calls "long build → short verdict" the
signature cadence; METHODOLOGY Stage 4 makes it "the default cadence";
NICKS_VOICE §6.5 licenses "a short fragment at a verdict or a reveal." The
master does it once or twice a post; told it is the default, a writer does it
once a paragraph. INTROS rule 5 ("the aphorism comes last") is the same tic at a
third scale.

**The replacement rule, agreed and unwritten:** *a paragraph opens on its most
surprising fact and spends the rest explaining it. No sentence exists to land the
one before it. Sentence length follows content, never position. A dash holds a
genuine aside, not the interesting part.*

The fold also owes the positive **sentence law** from
`redrafts/fable-2026-09-02/00_VOICE_DOCS_CRITIQUE.md` §4, whose verdict was that
the docs are "a changelog of failures, not a theory of the failure" — twenty-one
prohibitions and almost no positive law, which produces defensive prose.

Per AGENTS.md's anti-accretion rule this is a **replacement, not an addition**:
the three cadence lines in ESSENCE §1, METHODOLOGY Stage 4, and NICKS_VOICE §6.5
retire, and INTROS rule 5 is rewritten. Touching `NICKS_VOICE.md` and `SLOP.md`
is the visible half; retiring what it replaces is the point.

**Caution:** `NICKS_VOICE.md` and `SLOP.md` currently carry another session's
uncommitted edits. Diff before writing, and see the
`shared-worktree-atomic-writes` memory note for the safe pattern.

---

## Q4 — browser QA on waves 05, *Where the Simulation Is Wrong*

**Owner: whoever is next at a browser. Small, and genuinely unverified.**

`src/lessons/lesson-05-where-simulation-is-wrong.mdx` (~6,650 words, registry id
`where-the-simulation-is-wrong`, `status: draft`) has **never been viewed
rendered.** Not once, in any session. Its figures are the same components lesson
04 already uses, so the risk is layout and not physics: KaTeX display blocks,
table overflow at 380px, figure sizing, and the I/II/III version switch not
appearing on a `sole()` lesson.

The trap that caused this: a preview pane whose `document.visibilityState` is
`hidden` suspends rAF, so every `<Sim>` freezes and any browser-side pixel probe
silently measures a blank canvas. Both prior sessions hit it. Use a real
foreground window, or the headless `@napi-rs/canvas` harness.

Lesson 04's own browser and mobile pass is still owed too, per
`articles/08-learned-solver/HANDOFF.md`.

---

## Q5 — version II for the other ten lessons

**Owner: Nick. Blocked on the gate at the top of this file.**

The I · II · III switch works and is verified in a browser, but **only lesson 04
has versions**, and no lesson has a MUSE slot filled. The commission was to
rewrite *them*, plural, so Nick could compare baseline against this side's
rewrite against MUSE's.

Nothing should be built until Nick picks spines from the eleven `REIMAGINE.md`
outlines — building on an unread outline is how version II of lesson 04 became a
mis-scoped speedup article. Three of the eleven are spine swaps needing his
explicit yes; `02_INDEX.md` also lists physics lines the main loop already
flagged for hand-fixing before any revise agent runs (the wave-particle
half-wave-plate angle, the p-bits number order, the photonics "real matrix"
qualifier).
