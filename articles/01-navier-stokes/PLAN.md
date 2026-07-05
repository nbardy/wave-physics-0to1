# PLAN — Lesson 01: Building the Navier–Stokes Equations

The full-length plan, at true corpus scale, produced by METHODOLOGY.md stages 1–2.
Reference throughout: `ESSENCE_OF_VOICE_AND_DESIGN.md`; the airfoil deep dive in
`research/reports/REPORT_2_physics_epics.md` is the closest prior art — he taught the
*phenomena* of this exact subject and refused the equations. We keep his sequencing
instincts and cash out the math.

**Scale target**: ~12,000 words · ~80 figures · 13 sections · one WebGL sim family,
everything else Canvas-2D. (Corpus band: 1 figure / 85–180 words; we plan ~145.)

---

## Stage 1 — Concept

**Wonder gap.** Water is the most familiar substance in human life; nobody you know can
say why it swirls. The reader has stirred coffee ten thousand times and owns no
sentence, let alone an equation, for what the spoon starts. And the equation that *does*
govern it is one of the seven Millennium Prize Problems — a million dollars for anyone
who can prove it always behaves ($1M is dessert, deployed late, not a hook).

**Protagonist.** **The flow past a cylinder** — a gray disc in a steady stream. It is
deliberately *not* his airfoil: simpler, symmetric, and the canonical test case of
computational fluid dynamics (the von Kármán vortex street). The cylinder scene
accumulates every representation and every term: arrows → markers → dye → pressure →
the assembled equation → the live solver.

**Hero figure (the ring).** Figure 1 is the finished Stable Fluids solver: dye curling
past the cylinder, a vortex street peeling off, one slider. The IOU: "By the end of
this article you will have built, piece by piece, the equation running this
demonstration — and you'll know what every term of it does." Built last, shown first.
The final section reproduces it, understood.

**Misconceptions — omit vs. debunk:**
- *Omit Bernoulli entirely* (his move, same reason: an attractive frame that produces
  wrong explanations at this level). Also omitted: circulation, stress-tensor
  derivation (shortcut + confession), compressibility (contract: constant density),
  3D (contract: "our flows will be two dimensional and flat drawings will suffice").
- *Debunk gently*: viscosity ≠ density ("thick" ≠ "heavy" — mercury vs. honey table);
  turbulence ≠ lawlessness (same equation, one number decides); "the computer just
  draws pretty pictures" (we show the solver's four honest steps — deviation #4).

**Math budget — the earned ladder** (each via the protocol: interactive → words →
symbols-as-compression → formula with color-bound terms → boundary check):

| # | Equation | Earned in section |
|---|---|---|
| 1 | $\mathbf{u}(x, y, t)$ — velocity as a field | §3 |
| 2 | $\frac{D}{Dt} = \frac{\partial}{\partial t} + (\mathbf{u}\cdot\nabla)$ — material derivative | §4 |
| 3 | $\partial q/\partial t = -(\mathbf{u}\cdot\nabla)\,q$ — advection | §5 |
| 4 | $\partial \mathbf{u}/\partial t = \nu\nabla^2\mathbf{u}$ — diffusion of momentum | §6 |
| 5 | $Re = UL/\nu$ | §7 |
| 6 | $-\frac{1}{\rho}\nabla p$ — pressure-gradient force | §8 |
| 7 | $\nabla\cdot\mathbf{u} = 0$ — incompressibility | §9 |
| 8 | $\nabla^2 p = \frac{\rho}{\Delta t}\nabla\cdot\mathbf{u}^*$ — the pressure Poisson (computational form) | §10 |
| 9 | The assembled momentum equation + constraint | §11 |

---

## Stage 2 — Skeleton

Acts: **I. Seeing** (§2–3) · **II. Motion** (§4–7) · **III. The Constraint** (§8–10) ·
**IV. The Equation, Running** (§11–13). Waypoints at act boundaries; predictions
before the marquee reveals of acts II and III.

### §1 · Hook (figs 1–2)
Fig 1: the hero solver (Re slider, unexplained). Fig 2: the same channel, two fluids —
honey and water poured past the same obstacle, one *viscosity* slider, "vastly
different behavior from changing just one property" (planted; redeemed §6–7). Jargon
amnesty; the color-code contract; the IOU. *No physics yet.*

### §2 · Seeing Flow (figs 3–9) — representation before phenomenon
A creek scene: drifting petals, bending reeds (our lawn). Derive the three instruments:
**arrows** fixed in space (reeds), **markers with ghost trails** riding the flow
(petals), **speed as color**. Steady vs. unsteady shown, not named-first. Contract: 2D.
Confess arrow-length scaling ("I keep their relative lengths honest").
*Failure driving out: none — this is the instrument-rack section. Ends: "we can now see
water move. What exactly is it that we're seeing?"*

### §3 · A Field of Velocities (figs 10–14) — micro → macro, once
One compact particle box: thousands of molecules, an averaging region you resize; still
water = zero average; a current is a *shift of the average*, invisible in any one
molecule. Then the formal abandonment: "this lets us leave the molecules behind."
**Math #1**: naming $\mathbf{u}(x,y,t)$ — "writing 'the velocity of the water at that
spot, at that moment' will get old; here is the compression."
*Savior: a field at every point and every instant — but which point's story do we
follow? The one under our nose, or the one drifting past it?*

### §4 · Following a Parcel (figs 15–21) — the material derivative
Two thermometers in the creek: one bolted to a rock (probe view), one drifting (parcel
view) — **dual-pane**: scene + both temperature traces live. **Prediction #1**: "The
field below is perfectly steady — nothing about it changes in time. Will the drifting
thermometer's reading change?" (Commit, then drag.) It does — steady field ≠ constant
along a path. Earn **math #2**, $D/Dt = \partial_t + \mathbf{u}\cdot\nabla$, term by
term colored: *local change* + *change from being carried*. Boundary checks: uniform
field → carried term zero; parcel at rest → probe and parcel agree.
*Savior: the field carries temperature, dye, everything — including itself.*

### §5 · Advection (figs 22–28) — the field carries everything, even itself
Dye released into prescribed fields (uniform, rotating, shearing) — dye merely rides
and deforms. Then the turn: velocity is *also* a thing the flow carries —
$(\mathbf{u}\cdot\nabla)\mathbf{u}$, the equation eating its own output; the word
*nonlinear* earned here, gently. **Math #3.** Named-solver beat (deviation #4): the
obvious grid update *explodes* — shown live, on purpose, with its stability condition —
and **semi-Lagrangian backtracing** is the fix the reader performs by hand (drag a
parcel backward along the flow to ask "whose fluid arrives here?").
*Savior: but watch long enough — real dye doesn't stay a crisp filament forever.
Something smears it.*

### §6 · Viscosity (figs 29–36) — already prototyped
The jet-between-walls figure (live today in the lesson) plus: two-layer shear blending,
vortex decay under a ν slider, honey↔water. Earn **math #4** with the Laplacian read as
*disagreement with the neighborhood average* (boundary check: a linear profile has no
disagreement — and indeed doesn't change). No-slip stated as contract with its
molecular one-liner. Debunk viscosity ≠ density (mercury/honey/water/air table — real
units, his table move). Fig 2's honey half redeemed.
*Savior: so advection stirs and viscosity smooths — which one wins?*

### §7 · The Competition (figs 37–42) — Reynolds number
Same cylinder, one slider that is *secretly* $UL/\nu$: the regime tour — creeping flow
→ steady wake → periodic shedding → chaos. Earn **math #5** by scaling argument in
words (flag the hand-wave; full nondimensionalization is Further Reading). Awe-numbers:
bacteria swim at $Re \sim 10^{-5}$ (they live in *our* honey); a cruising 747 wing,
$\sim 10^8$; your coffee spoon, $\sim 10^4$. Fig 1's slider named at last: "you have
been dragging the Reynolds number all along."
**Waypoint (Act II ends)**: you now hold a field, a derivative that rides it, the term
that stirs, the term that smooths, and the one number that referees them.
*Savior: but our simulated dye still misbehaves — in every demo so far the fluid has
been allowed to do something real water never does.*

### §8 · Pressure (figs 43–50)
Particle box returns once (last time — say so): pressure as collision bombardment;
walls feel it, but so does *any parcel of fluid*. Imbalance, not magnitude, makes
force. The pressure landscape: contour lines → hills and valleys → a marble that is a
parcel. Earn **math #6**, $-\nabla p/\rho$, colored. **Prediction #2**: a parcel sits
between a red hill (high) ahead and a blue valley (low) behind — which way does it
accelerate? (Commit; then release the marble.)
*Savior: we now have three forces on a parcel — but nothing yet says the fluid can't
simply pile up.*

### §9 · The Broken Fluid (figs 51–57) — the central broken demo
Run advection + viscosity *without* the constraint: dye piles into bands, density of
markers bunches, flow leaks *into* the cylinder. "This is clearly wrong. Water does
not pile up in a corner of the cup." A **divergence meter** lights up where fluid
appears/vanishes. Earn **math #7**, $\nabla\cdot\mathbf{u} = 0$: what flows in must
flow out, shown with a resizable test loop (flux in = flux out) before the symbol
appears. Toggle a source/sink to see nonzero divergence and what it would mean.
*Savior: some field must push the pile-ups apart the instant they try to form. We've
already met it.*

### §10 · Pressure, the Instant Fixer (figs 58–65) — reader as inverse-solver
Hand-tune first (his airfoil move, our version): a simple scene with a forming pile-up
and a draggable pressure blob — the reader *is* the solver; too weak → still piles, too
strong → hollows out. The feedback-loop refrain (verbatim template, three uses).
Then the reveal: nature needs no tuner; demand $\nabla\cdot\mathbf{u}=0$ and the
pressure field is *determined*. Show **Helmholtz** visually: any velocity field splits
into a swirling part + a piling part; pressure's gradient is exactly the anti-piling
part. Earn **math #8** in its computational form, with a **Jacobi iteration slider**:
drag iterations 0→60, watch pressure relax and the divergence meter die. "Pressure has
no equation of its own. It is whatever field, at every instant, keeps the fluid from
piling up."
**Waypoint (Act III ends).**

### §11 · Assembling Navier–Stokes (figs 66–70) — the ceremony
Every term arrives as a friend, in its color, stacked one per line into the momentum
equation + constraint (**math #9**) — the full display he never shows. The marquee
figure of the post: **the term-toggle solver** — one live simulation with four
switches: kill viscosity (Euler — sharp, unstable beauty), kill advection (Stokes —
honey world, reversible), kill pressure (the §9 catastrophe, replayed knowingly),
all on (water). One knob... four, and flagged with the wink it deserves. Boundary
checks as play. The confession: whether solutions always stay smooth is an open
Millennium problem — the equation you just assembled is worth a million dollars.
*Savior: an equation you can't solve by hand — but we can make a computer walk it.*

### §12 · Running the Equation (figs 71–78) — Stable Fluids, solver x-ray
Named-solver section in full: the four steps — add forces, advect (semi-Lagrangian, §5
redeemed), diffuse (§6 redeemed), project (§10 redeemed) — each shown as its own
one-delta figure operating on the *same* frozen state. Then assembled, then WebGL for
speed (stated plainly: same math, more pixels). **The hero returns** (ring closes):
fig 1 again, now with dye injection, click-to-stir, Re slider — and the reader knows
what every part is. Honest limits: what this solver blurs (numerical diffusion),
what it can't do (true turbulence's fine scales) — "I would advise against using it to
design a submarine."

### §13 · Coda: Where Waves Live (figs 79–82)
Linearize about rest — tiny disturbances: pressure ripples (sound, with the
compressibility confession) and the free surface (water waves, teased). "Navier–Stokes
is the parent; every wave in this course is one of its children, small enough to be
gentle." Bridge to lesson 02.

### Further Reading & Final Words
Reading, each with earned praise: Lorena Barba's *12 Steps to Navier–Stokes*; Jos
Stam, *Real-Time Fluid Dynamics for Games* (the paper behind our solver); Bridson,
*Fluid Simulation for Computer Graphics*; Tritton, *Physical Fluid Dynamics*;
braintruffle's video series; and **Ciechanowski's own *Airfoil*** — the intuition-first
telling of this same physics, and the post this lesson is in conversation with.
Final Words: re-enchantment at the coffee cup — the spiral off your spoon is the same
street our cylinder sheds — *and now you own the equation*; "I find it…" sentence;
benediction.

---

## Palette contract (fixed at first appearance, never redesigned)

| Quantity | Color | First appears |
|---|---|---|
| velocity / arrows | blue `#2563eb` (site accent) | §2 |
| dye / markers / parcels | amber `#d97706` | §2 |
| pressure high / low | red `#dc2626` / cyan `#0891b2` | §8 |
| divergence (the crime) | violet `#7c3aed` | §9 |
| viscosity / smoothing | green `#059669` | §6 |
| obstacle / walls | gray `#6b7280` | §1 |

Equation terms inherit the color of the figure element that taught them; prose spans
bind with a `<C name>` component (to build — see production notes). Pressure's
red/cyan vs. velocity-blue collision was considered; cyan is kept far from `#2563eb`
in saturation and always appears in diverging-map context. Revisit at Stage 3 palette
audit if figures disagree.

## Production notes (Stage 3 planning)

**Sim inventory** — one WebGL family, ~14 Canvas-2D steppers, heavy reuse-with-overlay:
- *Field renderer kit* (shared): arrow grid, marker+trail layer, scalar colormap,
  contour lines — one module, used by ~70% of figures.
- Canvas steppers: creek scene; particle box (§3, §8 reuse); parcel thermometers +
  dual-pane plots; prescribed-field dye advection (3 fields = 3 overlay configs);
  unstable-advection demo (deliberately divergent, capped + auto-reset); backtrace
  toy; the jet (**exists**); shear blend; vortex decay; divergence meter + test loop;
  pressure landscape (2D contours; 3D only if cheap — else contours suffice, "2D for
  measurement"); Helmholtz split toy; Jacobi relaxation grid; term-toggle solver
  (small grid, Canvas, ~64²).
- WebGL: the Stable Fluids solver (hero, §12 finale, and fig 2's honey/water via high-ν
  setting). Ping-pong FBOs, one fragment shader per step. Build last; hero ships last.
- Framework additions, in order of need: `<C>` colored-vocabulary component (§2);
  dual-pane `<Sim>` layout (§4); prediction widget (§4) — a two-button commit that
  reveals the figure (smallest honest version); waypoint styling (§7).

**Build order** (Stage 3): field renderer kit → §2–§5 sims → §6–§7 (extend the live
jet) → §8–§10 → term-toggle → WebGL solver → hero. Prose is blocked per section as its
figures land; lesson stays `draft` and building throughout.

**Feasibility flags**: Jacobi at 60 iter/frame on Canvas is fine at ≤128² — the
term-toggle and §10 figures stay small-grid; only the WebGL finale runs dense. Mobile:
cap grid by devicePixelRatio; every drag has a tap equivalent. The §5 instability demo
must be guard-railed (auto-reset on blow-up, by design).

**Audit hooks** (Stage 5): words-per-figure 85–180; drought max 3 paragraphs; knob ≤1
except the flagged §11 finale; every planted debt in this plan has a named redemption
section; the anti-checklist from METHODOLOGY.md.
