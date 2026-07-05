# PLAN — Lesson 03: The History of Navier–Stokes

Partner lesson to `articles/01-navier-stokes/PLAN.md` (lesson 01). Lesson 01 builds the equation;
this lesson tells who built it — and the two builds turn out to share one skeleton,
because history also advanced by watching the current theory fail visibly. Content
grounding: `articles/03-navier-stokes-history/RESEARCH.md`. Craft references:
`ESSENCE_OF_VOICE_AND_DESIGN.md`, `METHODOLOGY.md`.

**Scale target**: ~10,500 words · ~72 figures · 13 sections · zero new WebGL
(reuses lesson 01's sim families in period costume). Corpus band 1 fig / 85–180
words; we plan ~145.

**Per-lesson deviations** (stated once, on top of the four standing ones):

- **(a) Past tense is licensed.** The house rule already reserves past tense for
  history sentences; this lesson *is* history sentences. Physics inside figures stays
  present tense ("the filament breaks up"), narrative stays past ("Navier read his
  memoir in March 1822"). The two tenses are the lesson's two registers: what water
  does, and what people did.
- **(b) A small archival budget: ≤6 static figures** (Leonardo's water studies,
  Reynolds's 1883 plates, the Hydraulica title page, the forecast-factory
  illustration), each confessed in the "I" register ("this page is Leonardo's, not
  mine"). Everything else stays interactive.
- **(c) People's names are not jargon** — no phenomenon-first protocol for *names*;
  Navier is introduced as Navier. Technical *terms* still obey the protocol.
- **(d) Math is re-encountered, not re-earned.** Every equation here was earned in
  lesson 01; each term re-enters as a historical artifact with a birthday, in its
  lesson-01 color. A reader who skipped lesson 01 gets one-sentence refreshers plus
  pointers; we do not re-run the earning protocol.

---

## Stage 1 — Concept

**Wonder gap.** The equation of water — the most familiar substance there is — took
160 years to write down, was discovered five separate times by five men who mostly
refused to cite each other, is named after two who never met, contained a proof that
ships need no sails which stood unanswered for 152 years, and still carries a
million-dollar bounty for anyone who can show it doesn't secretly break. Nobody who
uses the phrase "Navier–Stokes" can usually say who Navier was (a bridge engineer
whose bridge failed). The reader finished lesson 01 owning the equation; they own
none of its story.

**Protagonist.** **The equation itself, assembled across two centuries** — staged on
the *same gray cylinder in the same stream* as lesson 01. The scene never changes;
the *theory rendering it* does. Under Newton it is a hail of corpuscles; under
d'Alembert and Euler a perfectly symmetric ideal flow with a drag meter reading
zero; after Navier the honey world of creeping flow; after Reynolds a transition; after
Prandtl a boundary layer that separates and finally — correctly — produces drag.
The equation display beneath the scene accumulates terms, each stamped with a name
and a year, in its lesson-01 color.

**Hero figure (the ring).** Fig 1: **two centuries in one slider** — the cylinder
scene with a single scrubber running 1687 → today. Dragging it swaps the physics
(corpuscle hail → ideal flow → viscous flow → boundary layer → live solver) while the
equation builds underneath, term by term, birthday by birthday. Unexplained at the
top; the IOU: "By the end you will know what every name on this slider saw, what each
one got wrong, and why the last stretch of the slider is still blank." Returns in
§12, readable.

**Misconceptions — omit vs. debunk:**
- *Omit*: Bernoulli's principle as physics (lesson 01's omission holds; Daniel
  appears as a character, his principle stays un-taught); adjudicating priority
  disputes in detail (we report, we don't referee); compressibility, 3D, and the
  stress-tensor derivation (same contracts as lesson 01).
- *Debunk*: **"Navier and Stokes collaborated"** (never met, never corresponded, 23
  years apart — the ampersand was installed by posterity); **"equations get
  discovered once, by their namer"** (five independent derivations; the eponymy
  lottery — Saint-Venant got nothing); **"right results come from right reasoning"**
  (Navier's molecules were fiction; the term was correct); **"turbulence is a modern
  discovery"** (Leonardo drew and named it c. 1510); **"the math of water is
  finished"** (Leray's warning, the open Millennium problem).

**Math budget — the ledger of birthdays.** Nothing new is earned (deviation d); the
lesson's "math moments" are *re-encounters*, placed where the history delivers them:

| # | Equation (from lesson 01) | Birthday | Section |
|---|---|---|---|
| 1 | shear stress ∝ velocity gradient (the Newtonian-fluid law, in words) | 1687 | §3 |
| 2 | the 1D wave equation (course callback) | 1747 | §5 |
| 3 | drag = 0 for ideal flow (the paradox, as a *result*) | 1752 | §5 |
| 4 | $\mathbf{u}(x,y,t)$, $p(x,y,t)$, and the Euler equations | 1757 | §6 |
| 5 | $+\,\nu\nabla^2\mathbf{u}$ — the term, joining the stack | 1822 | §7 |
| 6 | $F = 6\pi\mu R U$ — Stokes drag (one-line dessert, checked on a sim) | 1851 | §8 |
| 7 | $Re = UL/\nu$ — re-met at its birthplace | 1883 | §9 |
| 8 | $\mathbf{u} = \bar{\mathbf{u}} + \mathbf{u}'$ — the averaging confession | 1895 | §9 |
| 9 | boundary-layer thickness $\delta \sim L/\sqrt{Re}$ (scaling only, hand-wave flagged) | 1904 | §10 |
| 10 | the −5/3 spectrum — shown as a postcard, confessed as unearned | 1941 | §11 |

---

## Stage 2 — Skeleton

Acts: **I. Before the Equation** (§2–5) · **II. Writing It, Five Times** (§6–8) ·
**III. Taming It** (§9–10) · **IV. Beyond Its Authors** (§11–12). Waypoints at act
boundaries; predictions before the marquee reveals of acts I and III. The failure
chain is not manufactured here — **history manufactured it for us**; each section's
"Unfortunately" is a documented historical dead end.

### §1 · Hook (figs 1–2)
Fig 1: the hero scrubber (two centuries in one slider, unexplained). Fig 2: a plain
card — the equation as lesson 01 left it, every term in color, and under each term a
blank nameplate. Jargon amnesty for *names and dates* ("the timeline will stay on
screen; you never need to memorize a year"). The IOU. *No history yet.*

### §2 · Still Water and the Drawn Storm (figs 3–8)
What the ancients could do: **statics**. Archimedes' floating-crown toy (buoyancy
balance, draggable submersion); Torricelli's barometer (drag the tube's tilt, column
height invariant — pressure is real and measurable); Pascal's mountain (altitude
slider, mercury drops — pressure is *weight of fluid above*). Then the pivot
figure: **Leonardo's actual water studies** (archival, confessed) beside our lesson-01
dye sim in the same pose — he drew, c. 1510, what the reader stirred in lesson 01,
and named it: *la turbolenza*. Turbulence had a name three centuries before an
equation.
*Failure driving out: every tool here dies the instant water moves. A drawing is not
a law. What would a law of moving water even say?*

### §3 · Newton's Guess (figs 9–14)
*Principia* Book II, the wrong book that founded the field. The sheared-fluid figure
(reuse lesson 01's two-plate shear): Newton's sentence — resistance from "want of
lubricity," proportional to how fast layers slide past each other — **is** lesson 01
§6's law, stated 158 years early, as a guess (math re-encounter #1, in words). Then
his two public swings: the corpuscle-hail drag model (particles bombard the cylinder;
drag meter reads *something*, but the sim shows no wake, no flow-around — matter
streaming through matter); and the **speed of sound**, computed from mechanics for
the first time — and 15% low (a tube-of-air sim with predicted vs. measured wavefront
racing; Laplace's 1816 adiabatic fix as the payoff line). Wave-course ring: the fluid
story begins with a wave calculation.
*Savior: motion of a continuum needs mathematics nobody has. Two generations of one
family start building it — and tear each other apart.*

### §4 · The Bernoullis (figs 15–19)
Daniel's *Hydrodynamica* (1738): energy bookkeeping in a pipe — the narrowing-pipe
sim (one slider: constriction; pressure gauge falls as speed rises). We *use* the
tradeoff as observation, we do not teach it as mechanism (the lesson-01 omission,
kept, and confessed in a sentence). Then the scandal, told straight: Johann's
*Hydraulica*, dated 1732, written after his son's book — the backdating; Daniel's
letter ("I am robbed of my entire Hydrodynamics…"). Archival figure: the two title
pages side by side, the false date visible.
*Failure driving out: accounting along a pipe is not a law of motion — it cannot say
what the water in the open stream* does*. And it ignores friction entirely.*

### §5 · d'Alembert's Zero (figs 20–26) — the paradox
First, the course callback: d'Alembert 1747, the vibrating string — the first PDE of
physics (re-encounter #2; the string sim from the course scaffold, one pluck). The
tools of wave physics, invented, now aimed at the stream. The setup: ideal fluid —
no friction, nothing but Euler-to-be's pressure — flowing past our cylinder.
**Prediction #1 (marquee of Act I)**: "The flow below is frictionless. Before you
reveal the meter — how hard does the stream push the cylinder?" (Commit: hard /
gently / not at all.) Reveal: the pressure field, fore-aft **symmetric**; the drag
meter unrolls to **0.000** (re-encounter #3). Every pressure gain on the nose is
refunded on the tail. D'Alembert's own verdict, quoted: "a singular paradox which I
leave to future Geometers to elucidate." Ships need no sails; theory at war with
every swimmer since the first one.
**Waypoint (Act I ends)**: you now hold what 1752 held — perfect statics, a wave
equation, an energy ledger, and a proof that the best theory of moving water is
absurd. The paradox will sit on screen, dated, until §10 pays it.

### §6 · Euler Writes the Field (figs 27–33)
Euler 1757: the conceptual moves the reader already owns from lesson 01, now with
their birthday. The field picture (arrows fixed in space — "you learned to read this
display in lesson 01 §2; Euler invented it"); pressure as an internal field (the
particle-box callback, one sentence, no re-run); Newton's law per parcel. The **Euler
equations** assemble on the term stack — every lesson-01 color *except green*, each
nameplate filling in (re-encounter #4). Boundary check as play: kill the pressure
term → the §9-of-lesson-01 pile-up catastrophe, replayed knowingly. Euler's own
confession quoted: if fluid motion escapes us, blame *analysis itself*.
*Failure driving out: the drag meter still reads zero — Euler's equations inherit
the paradox untouched. And honey and water obey identical equations here, which the
reader's hands know is false. One term is missing, and it is the whole story.*

### §7 · The Bridge Engineer's Term (figs 34–39)
Navier: engineer first — the Pont des Invalides told straight (archival etching; the
crack, the burst sewer, the 1826 abandonment, the mockery). Then March 18, 1822: the
molecular-springs toy — a lattice of molecules with velocity-dependent pulls
(one slider: neighbor coupling); summed, the smoothing emerges — and the **green
term** $\nu\nabla^2\mathbf{u}$ joins the stack with its nameplate (re-encounter #5).
Then the honest beat, the section's spine: **the molecules were fiction and the term
was right**. Navier's constant ε connected to nothing measurable — a knob labeled ε
with no units on the sim, confessed ("I cannot tell you what to set it to; neither
could he").
*Failure driving out: a term derived from imaginary physics convinces no one. The
term needs a foundation — and it gets four, from four men who mostly refused to cite
each other.*

### §8 · Five Times Discovered (figs 40–48)
The rediscovery parade, one figure each, kept brisk: **Cauchy 1823** — the stress
cube (drag a face, watch the nine components; "the container for any material's law"
— the deepest object in the parade); **Poisson 1829** (compressible route, one
card); **Saint-Venant 1837** — shear stress ∝ strain rate on the two-plate sim, the
modern reading, published two years before Stokes, cited nobody's rival, got
nothing (the eponymy lottery figure: five names in, two names out). **Stokes 1845**:
the continuum derivation textbooks still teach — and then the equation *earns its
keep*: the falling-sphere sim (re-encounter #6, $F = 6\pi\mu RU$; boundary check —
double the radius, watch terminal velocity) turning ν from fudge factor into a
**measured property of air and water**; no-slip settled as a by-product (the
lesson-01 contract, now with a birthday). Verification dessert: **Poiseuille's
blood-capillary law** — the pipe sim with the r⁴ readout; a physician handed the
theorists their first exact confirmation.
**Waypoint (Act II ends)**: the equation is written — five times — trusted, and
named for the first and last of five men, two of whom never met. But it can only be
*solved* for creeping flows; real water, pushed harder, goes mad.

### §9 · Reynolds's Dye (figs 49–55)
Recreate the 1883 apparatus faithfully: the tank, the glass tube, the dye filament
(archival plate beside our sim, confessed). **Prediction #2 (marquee of Act III)**:
"The filament below runs straight. Before you drag — double the speed. Does the
filament survive?" (Commit, then drag.) The eruption: *direct* becomes *sinuous* —
his words, quoted. Then the collapse figure: four tubes — wide/slow, narrow/fast,
hot/cold water (ν slider) — transition governed by the single combination $UL/\nu$
(re-encounter #7): the slider the reader dragged through all of lesson 01, met at
its birthplace; Sommerfeld's 1908 christening as the etymology reward. Close on
Reynolds 1895: $\mathbf{u} = \bar{\mathbf{u}} + \mathbf{u}'$ (re-encounter #8) — the
averaging confession: above transition, we stop computing the flow and start
computing its statistics.
*Failure driving out: the equation is right, the number is known — and d'Alembert's
zero, planted in §5, still stands: at high Re friction is tiny, so why isn't the
ideal theory nearly right about drag?*

### §10 · Ten Minutes in Heidelberg (figs 56–62)
August 12, 1904, 11:30 a.m., Third International Congress of Mathematicians: a
29-year-old with ten minutes and eight pages. The magnifier figure: the lesson-01
cylinder at high Re, a draggable magnifying loupe — far from the wall, Euler's ideal
flow, honest; *inside a sliver against the surface*, velocity plunging to zero
(no-slip) across a thickness that shrinks like $1/\sqrt{Re}$ (re-encounter #9,
scaling hand-wave flagged). The layer *separates* — watch it peel off the shoulder —
the fore-aft pressure symmetry breaks, and the **drag meter, zero since §5, finally
moves**. The 152-year ledger entry is paid on screen: d'Alembert wasn't refuted; he
was right everywhere except a sliver, and the sliver controls everything. Kármán's
street (1911) named as the pattern the reader has been shedding since lesson 01's
fig 1; Bénard's photographs as archival garnish.
**Waypoint (Act III ends)**: the equation is written, verified, and — through one
thin layer — finally agrees with ships, birds, and swimmers. What remains is
everything above the transition: turbulence, and a question about the equation
itself.

### §11 · The Equation Outruns Its Authors (figs 63–67)
Richardson 1922: the whorls toy — a big eddy spawning smaller eddies spawning smaller
(one slider: time-speed), his poem as the caption-in-prose, plus the failed hand
forecast (a 145-millibar absurdity) and the imagined factory of 64,000 human
computers (archival illustration, the last of the budget). Kolmogorov 1941: the
cascade postcard — energy spectrum on log-log, the −5/3 slope drawn on (re-encounter
#10, **confessed as unearned**: "a postcard from a theory this course has not yet
climbed to"). Leray 1934: *solutions turbulentes* — the mathematicians' warning that
smoothness might fail; Ladyzhenskaya's 2D theorem (flat worlds are safe; the third
dimension is the whole problem); the Millennium card — Fefferman's 2000 problem
statement, $1M, unclaimed. The lesson-01 confession, upgraded to a dated artifact.
*Savior: an equation nobody can prove well-posed — but Richardson's factory got
built after all, out of vacuum tubes.*

### §12 · The Machine Age (figs 68–72) — the ring closes
ENIAC 1950 (Richardson's factory realized); then the solver x-ray from lesson 01
§12, replayed with **birthdays on each step**: the staggered grid — Harlow & Welch,
Los Alamos, 1965; the projection — Chorin, 1968; the unconditionally stable
advection — Stam, 1999. "The four steps you watched in lesson 01 are the 1965, 1968,
and 1999 sentences of this story." **The hero returns**: the two-centuries scrubber,
full range, every regime now readable, every nameplate filled — and the right-hand
end of the slider left visibly blank, because the story has no ending yet: the
smoothness question is open, and the newest chapter is running on the reader's GPU.

### §13 · Coda: One Skeleton, Twice Built (fig 73, optional)
The closing move, stated plainly: lay lesson 01's section ladder beside this
lesson's timeline — field, advection, viscosity, pressure, constraint, solver;
Euler, Euler, Navier, Euler, Euler, Chorin — the pedagogical order and the
historical order are nearly the same walk, because both were driven by watching the
current theory fail in plain sight. Bridge out: the wave equation was born in 1747
inside this same story; the rest of the course climbs the children of Navier–Stokes.

### Further Reading & Final Words
Each with earned praise: **Darrigol, *Worlds of Flow*** (the five-derivations
history, told with the mathematics intact); **Eckert, *The Dawn of Fluid Dynamics***
(Prandtl's century); **Anderson's *Physics Today* piece on Prandtl** (the Heidelberg
scene, beautifully reconstructed); **Reynolds 1883** (open access — read a
founding paper with plates the reader has now reproduced); **Fefferman's Clay
problem statement** (the open question, stated in four pages); **Stam 1999** (the
paper the reader's toy runs on — now readable as history). Final Words: the
re-enchantment turn — the next time you see the equation's name, it is not a label
but a two-century argument: a bridge engineer, a blind-to-each-other quintet, a
physician's capillaries, ten minutes in Heidelberg; "I find it…" sentence;
benediction — *and the equation still keeps one secret, priced at a million
dollars.*

### Stage-2 addendum — the deeper lineage layer (RESEARCH §12–14), mapped to sections

The research doc's toolbox / network / gaps material threads into the ladder above
rather than adding sections; per-section riders:

- **§3 rider**: the Newton–Leibniz notation schism, one paragraph — Britain clings
  to fluxions for a century, which is why the next 130 years of the story are
  Swiss/French/German. Planted debt: paid in §8 (Stokes as the first
  continental-trained Cambridge generation).
- **§5 riders**: the vibrating-string controversy (d'Alembert vs. Euler vs. Daniel
  Bernoulli on what counts as a *solution* — the wave course's own founding quarrel,
  settled only by Fourier); and Euler's academy judging d'Alembert's 1749 essay —
  both founding documents arrive wrapped in a grievance, Euler the common judge and
  beneficiary.
- **§6 rider**: PDEs did not predate the problem — the tool was invented next door
  (1747, for a wave) and both stories share a birth decade.
- **§7 riders**: **Fourier was Navier's mentor** — the viscous term is the heat
  operator applied to momentum, invented one desk away; and **Navier's own boundary
  condition was slip, not no-slip** — wrong for 1822's pipes, rehabilitated in
  modern microfluidics (a debt paid as a §8 aside plus a coda footnote).
- **§8 riders**: the Paris cluster framing — the five derivations were **one
  continuous in-person argument** (Cauchy refereeing Navier's memoir; the public
  Navier–Poisson polemic of 1828–29 over molecules vs. continuum); Stokes the
  hermit, discovering the French literature only after deriving his own; and the
  notation confession — every one of the five wrote three scalar component
  equations; the vector face on our term stack is a 20th-century typographical
  object (flagged here, paid in §12).
- **§9 rider**: Stokes was the Royal Society referee of Reynolds's 1883 paper, and
  the number appears embryonically in Stokes's own 1851 memoir — a thirty-year
  mentorship-at-a-distance.
- **§10 rider**: Felix Klein in the Heidelberg audience → Prandtl recruited to
  Göttingen the same year; the whole aerodynamic century flows through one act of
  listening.
- **§11 riders**: Leray invented his weak derivatives *before* Sobolev's spaces
  existed — the equation generates mathematics at both ends of its life; garnish:
  Heisenberg's doctoral thesis (Sommerfeld, 1923) was on turbulence.
- **§13 option (fig 74)**: the **gaps ledger as a figure** — horizontal bars laid on
  the hero timeline showing how long each piece hung open (135 years for the viscous
  term, 152 for the paradox, 204-and-counting for smoothness). Cheap (static bars on
  the existing scrubber chrome), and it is the lesson's thesis drawn as one picture.
  Adopt if §13 survives the drought audit; otherwise fold the three numbers into
  Final Words prose.

---

## Palette contract — inherited, not invented

The lesson-01 contract is adopted wholesale; cross-lesson color identity is the
point (Navier's nameplate is green *because* viscosity has been green since lesson
01 §6):

| Quantity | Color | Source |
|---|---|---|
| velocity / arrows | blue `#2563eb` | lesson 01 |
| dye / markers / filament | amber `#d97706` | lesson 01 |
| pressure high / low | red `#dc2626` / cyan `#0891b2` | lesson 01 |
| viscosity / the green term | green `#059669` | lesson 01 |
| divergence | violet `#7c3aed` | lesson 01 |
| obstacle / walls | gray `#6b7280` | lesson 01 |
| **history furniture** (timeline, nameplates, dates, archival frames) | warm sepia `#78716c`, never used for physics | new, this lesson |

One new color only; people and dates live in sepia so the physics palette stays
unambiguous. Palette audit at Stage 3 as usual.

## Production notes (Stage 3 planning)

**Sim inventory — reuse-heavy by design.** From lesson 01: field renderer kit
(arrows/markers/colormap), two-plate shear, dye advection, particle box (one-sentence
cameo only), pressure landscape, the solver family (§5 ideal-flow mode = solver with
viscosity off + potential-flow rendering; §10 = solver + loupe overlay). New builds,
all Canvas-2D:

- **Timeline scrubber wrapper** (the hero): a year slider driving (a) a scene-config
  dispatch (corpuscles / ideal / viscous / boundary-layer / full solver) and (b) the
  term-stack display with nameplates. The scene configs are lesson-01 sims; the
  wrapper is new chrome. Build the wrapper early, ship the hero last.
- **Drag meter overlay** — a readout component; must be honest (integrate surface
  pressure from the sim, not scripted), because §5's 0.000 and §10's first nonzero
  are the lesson's two marquee readings.
- **Statics toys** (§2): buoyancy crown, barometer, Pascal's mountain — three small
  steppers, one slider each.
- **Corpuscle hail** (§3): particle bombardment, no collective flow — deliberately
  wrong physics, confessed on screen.
- **Sound-race tube** (§3): predicted vs. measured wavefront.
- **Molecular springs** (§7): small lattice, velocity-coupled neighbors.
- **Stress cube** (§8): drag a face, nine components respond.
- **Falling sphere** (§8): Stokes drag with terminal-velocity readout.
- **Poiseuille pipe** (§8): radius slider, r⁴ readout.
- **Reynolds tube** (§9): the 1883 recreation — tank, tube, filament; speed slider;
  the transition must be genuinely sensitive (seeded noise), not scripted.
- **Whorls cascade** (§11): recursive eddy toy.
- **Framework additions**: nameplate/term-stack component (shared with the hero and
  §6–§8); archival-figure frame with confession slot; the loupe (magnifier) overlay.

**Archival assets** (deviation b, ≤6): Leonardo water study (public domain), the two
Bernoulli title pages, Pont des Invalides etching, Reynolds 1883 plate, forecast
factory illustration (Lempfert/Schereschewsky-style reconstruction — verify rights at
Stage 3; fall back to a drawn homage, confessed).

**Build order**: nameplate/term-stack + timeline wrapper chrome → §2–§5 sims (statics
toys, corpuscle hail, sound race; ideal-flow + drag meter is the critical path — it
gates both predictions) → §6–§8 (springs, cube, sphere, pipe) → Reynolds tube → loupe
→ cascade → hero assembly last. Prose blocked per section as figures land; lesson
stays `draft` throughout; `bun run typecheck && bun run build` green at every step.

**Feasibility flags**: the drag meter needs a solver faithful enough that ideal flow
integrates to ~0 — use the analytic potential-flow solution for §5 (exact, cheap)
rather than asking the numerical solver to cancel to zero; confess the swap if the
two ever share a figure. The Reynolds tube's transition sensitivity is physics, not a
bug — guard-rail with auto-reseed. Mobile: timeline scrubber needs coarse snap-points
(the 13 dated events) so touch users land on eras, not arbitrary years.

**Audit hooks (Stage 5)**: words-per-figure 85–180; drought max 3 paragraphs; knob ≤1
except the hero scrubber finale (flagged); the §5 paradox ledger entry must be paid
on screen in §10; every nameplate filled by §12 except the deliberately blank end of
the timeline; tense audit (deviation a): past for people, present for water; the
anti-checklist from METHODOLOGY.md, plus this lesson's own trap — **no inline
citations in prose**; sources live only in Further Reading.
