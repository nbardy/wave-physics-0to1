# PLAN — Lesson 02: Fiber Bundles, the Universal Medium

The full-length plan, produced by METHODOLOGY.md stages 1–2. Reference throughout:
`ESSENCE_OF_VOICE_AND_DESIGN.md` for craft, `articles/02-fiber-bundles/RESEARCH.md` for the
subject-matter grounding (what the tweet technically refers to, the papers, the
history — every historical beat below is sourced there). The seed is Eric
Weinstein's tweet:

> What if waves are among the most beautiful & powerful things in the world, and
> mathematicians generalized diff calculus so that there was a universal medium for
> all waves, yet didn't tell anyone outside a few theoretical physicists?
> That would be fiber bundles. Just for openers.

The tweet is the post's **epigraph**, and the post is the proof that terminates at it
(his ring structure, literalized): by Final Words the reader can audit every clause —
"generalized diff calculus" (the covariant derivative, earned §6), "universal medium
for all waves" (the connection, waving, §10), "didn't tell anyone" (the coda's amnesty:
this is standard graduate physics that never got a public telling).

**Scale target**: ~11,000 words · ~67 figures · 11 sections · all Canvas-2D
(no WebGL needed — nothing here is a dense PDE; the two 3D cameos, the globe and
the linked rings, are orthographic Canvas-2D projections). Corpus band 85–180
words/figure; we plan ~165.

---

## Stage 1 — Concept

**The thesis (the insight the tweet says was never communicated — every section
serves this).** A medium's only essential job is to define *calm*: the unperturbed
state a wave deviates from. A connection is exactly a definition of "unchanged from
point to point," and nothing more — so the connection is the minimal possible
medium, made of pure comparison, with no substance left. Light is a wave in the
meaning of "same." And the inversion that is the real payload: you don't add light
to the theory — you can't keep it out. Admit that phase conventions are local
(§5's prankster) and the ordinary derivative dies; the only repair is a
compensating field with Maxwell-shaped behavior (§6→§10). Forces are what it costs
to do calculus in a universe with no absolute conventions. This one stroke also
resolves both dangling pop-sci mysteries: Michelson–Morley came up empty because it
was hunting the rest frame of a substance and a comparison rule is not one
(nothing about it is observable except what survives the brush — curvature, and
holonomy around loops; that the dynamics also plays no favorites among uniformly
moving observers is special relativity's fact, confessed rather than derived), and
"gauge redundancy" is not a flaw in the formalism but the very thing that forces the
medium to exist. The three-rung ladder the article climbs: waves displace stuff
(rung 1, lesson 01) → "a field has a value at every point" (rung 2, the school
dodge — it quietly assumes a shared value space) → the values live in separate
fibers and the comparison rule is itself the physical field (rung 3, this lesson).

**Wonder gap.** Every wave the reader has ever met waved *in something* — water, air,
a string, the fluid of lesson 01. Light is the most familiar wave in human life, and
its medium famously failed to exist: the aether was hunted with the most sensitive
instrument of the nineteenth century and was not there. The resolution taught in
school — "fields don't need a medium" — is a name, not an answer. The actual answer,
built by mathematicians, is that the medium is not a substance but a geometric
object: a fiber bundle, and light is a traveling ripple in the rule its fibers use to
compare notes. The reader has been swimming in the answer's consequences (GPS, every
photo ever taken) and owns no picture of it.

**Protagonist.** **The line of clocks** — a circle standing over every point of a
line (later, of a plane). One scene, accumulating everything: values threaded through
fibers (a section) → the graph pane → the regauge brush mangling it → the transport
needle → the connection curve → the holonomy meter → the ripple in the connection
that is light. Deliberately *not* an abstract manifold diagram: the clocks stay
drawable, pokeable, and the same from figure 5 to figure 67.

**Hero figure (the ring).** Figure 1 is a traveling electromagnetic wave, dual-pane:
the top pane shows the textbook picture — E and B arrows rising, crossing zero, and
falling in step as the wave slides by, mutually perpendicular, in phase; the bottom
pane shows *the same wave* as a pulse running down a line of clocks — a ripple in
the rule they use to compare notes. One time-speed slider. Spec constraint
(repeated in the sim inventory so the Stage-3 builder sees it): the two arrow
families must be drawn exactly in phase — the "leapfrog" picture (E and B a
quarter-cycle apart, each dying to birth the other) is itself a widespread
misconception and must not appear anywhere in the figure; the word *leapfrog*
belongs to §10's named integrator alone. The IOU: "the top picture is the one you
have seen; by the end of this article you will know why the bottom one is the more
honest of the two." Built last, shown first, returns in §10 understood.

**Misconceptions — omit vs. debunk:**
- *Debunk flatly*: **the aether** (it is the hook; Michelson–Morley told straight,
  two sentences of history, no interferometer detour); **"gauge freedom means A is
  fictitious bookkeeping"** (killed by Aharonov–Bohm, the planted fig 2 — loops of
  the connection are as physical as anything ever measured); **"a bundle is just a
  product with extra words"** (killed by the Möbius comb, §3).
- *Keep distinct, or the reader complects them*: the Möbius **twist is topology**
  (discrete, survives any smooth re-combing) while **curvature is geometry**
  (continuous, a per-area density). One explicit sentence at §8 keeps them apart,
  and Aharonov–Bohm is exactly the case that needs the distinction (zero curvature
  along the path, nonzero holonomy around it).
- *Omit entirely*: Lie groups in general (two fibers only: lesson 01's line of
  values — the rails of §2, returning as the finale dial's first stop — and this
  lesson's one nontrivial fiber, the circle; plus one disclosed Möbius cameo with a
  segment fiber), differential forms and index gymnastics, principal-vs-associated
  bundle distinction, nonabelian curvature, spinors, the Higgs. Contract stated up
  front: base spaces are a line, a plane, the Möbius cameo's circle, and one globe
  cameo; everything survives the upgrade.
- *Quantum honesty*: the clocks are, at the end, the quantum phase of a charged
  particle. This is *planted as a debt early* (the rope loaner in §4, the stripped
  room in §5) and *paid plainly once* in §9 with an amnesty (no QM prerequisite;
  one honest paragraph, no wavefunction machinery). We do not pretend the clocks
  are classical, and we do not build quantum mechanics.

**Math budget — the earned ladder** (each via the protocol: interactive → words →
symbols-as-compression → formula with color-bound terms → boundary check):

| # | Equation | Earned in section |
|---|---|---|
| 1 | $y(x,t)$ — a wave is a choice in a fiber over every point (a section) | §2 |
| 2 | $\theta(x,t)$ — a circle-valued field; the total space is a cylinder | §4 |
| 3 | $\theta \to \theta + \alpha(x)$ — regauging; $\partial\theta/\partial x$ is not invariant | §5 |
| 4 | $D\theta = \partial\theta - A$ — the covariant derivative | §6 |
| 5 | $A \to A + \partial\alpha$ — the compensating law; $D\theta$ invariant | §6 |
| 6 | $F = \partial_x A_y - \partial_y A_x$, $\oint A = \iint F$ — curvature and holonomy ($A$ upgrades from a scalar on the line to a pair $(A_x, A_y)$ on the plane, §7 — one number per direction of step) | §7–8 |
| 7 | The dictionary: $A$ = potential, $F$ = **B** (space–space) and **E** (time–space) | §9 |
| 8 | $\partial^2 A_y/\partial t^2 = c^2\,\partial^2 A_y/\partial x^2$ — the connection waves; light | §10 |

---

## Stage 2 — Skeleton

Acts: **I. Seeing sections** (§2–4) · **II. The broken derivative** (§5–6) ·
**III. Curvature** (§7–9) · **IV. The wave in the connection** (§10–11).
Waypoints close acts II and III; predictions before the marquee reveals of §5 and §7.

### §1 · Hook (figs 1–2)
The epigraph sits as paratext above the cold open — between the title and the first
sentence — a deliberate placement (the quoted-primary-artifact block, first of its
two registered uses; see DENSE_CORE's Register), so the cold open's two sentences
run straight into the hero, preserving the corpus's measured opening rhythm. Cold
open, two sentences: every wave so far waved in something; the one that reaches
your eye right now waves in nothing that has ever been found. Fig 1: the dual-pane
hero (time-speed slider, unexplained). Fig 2: the **Aharonov–Bohm toy**, planted —
described operationally and pre-quantum: a beam split along two paths around a
sealed central core, a screen where the arrivals land as a pattern of stripes, and
one dial on the sealed core. The figure's single loaned fact, stated as a contract
at the moment it appears: where the stripes fall is a real, repeatable
measurement — the honest readout of the two journeys (loan repaid in full;
redeemed §9). Turn the dial and the stripes slide, though nothing measurable
touches either path; "this demonstration should look impossible; before we are
done, it will look inevitable" (planted; redeemed §9). The words *electron*,
*interference*, *flux*, and *phase* are reserved for §9 — in this section the knob
is just the dial on the sealed core. Jargon amnesty; the color-code contract; the
fiber/base contract (per the Stage 1 wording). *No mathematics yet.*

### §2 · A Wave Is a Choice at Every Point (figs 3–8) — representation before phenomenon
Lesson 01's string returns (cross-lesson re-teach, not link). One-delta sequence:
the string → faint vertical **rails** drawn over each point (the value space each
point owns) → the wave as a threading, one choice per rail → the whole strip the
graph lives in. Phenomenon first, names second: the rail *is known as a fiber*, the
threading *a section*, the strip *the total space*. Confess the finite rail count
("I draw a dozen; the fluid of rails is continuous"). **Math #1**: $y(x,t)$ reread —
the notation of lesson 01 was secretly bundle notation all along.
*Savior: nothing about the graph ever leaves the strip the rails live in — and the
strip hides a choice nothing in the string ever exposed.*

### §3 · Twist You Cannot Comb Away (figs 9–13) — the Möbius cameo
The gluing of fibers is *data, not pedantry* — here is the proof, built from §2's
own strip. No borrowed fiber needed: the strip's fibers are already segments.
One-delta move: bend the strip of rails into a loop; at the seam you must choose
how the ends glue — no flip gives the **untwisted band**, one flip gives the
**Möbius band**. Playable comb: drag to choose a nonzero value continuously all
the way around — the section is forced through zero, every time; on the untwisted
band the same game is trivially winnable. Locally the two are indistinguishable;
globally they are not. The name earned: *this is what makes a bundle a bundle* —
locally a product, glued by choices. (The string and its rails return immediately;
the flip is a planted seed for §8's topology-vs-geometry sentence.)
*Savior: the gluing is a choice with consequences — and nothing forced the fiber to
be a segment either. A circle can stand over a point just as well.*

### §4 · The Phase Clock (figs 14–19)
A rope whirled in a helix — circular polarization, the household anchor: every point
of the rope travels a circle. Extract the circle: over each $x$, a **clock face**;
the wave is an angle. The rope confessed as a loaner at the moment it is borrowed,
Möbius-contract style: the rope is a stand-in instance — nature's own clock-row,
the one this article is finally about, has no visible needle and no ambient "up";
what stands in its fibers is a debt paid in §9. **Math #2**: $\theta(x,t)$; the
total space is a cylinder, drawn once — with one sentence noting the roles are
swapped relative to §3's picture (there the base was a circle and the fibers were
segments; here the base is a line and the fiber is a circle), and only this total
space gets the name *cylinder*: §3's untwisted twin stays "the untwisted band."
The protagonist locks in: the **clock-row** with its graph pane beneath
(dual-pane: bundle picture above, $\theta(x)$ plot below — the mapping between them
is the lesson). Steady traveling wave on the clocks; time-speed slider. The
clock-row figure gains a small **energy meter** — a readout, not a control, so the
one-knob law is untouched — introduced with one line stating what it computes: the
string-inherited energy, rotation rate squared plus twist rate squared,
$E = \int[(\partial\theta/\partial t)^2 + c^2(\partial\theta/\partial x)^2]\,dx$,
presented as "the analog of the string's energy."
*Savior: a wave equation for the clocks needs the twist rate $\partial\theta/\partial x$
— the analog of the string's slope. And a problem is waiting there that the string
never had.*

### §5 · The Prankster's Derivative (figs 20–25) — the central broken demo
The clock-row, dual-pane. Open on the seam, redeemed: "Recall the seam — the gluing
was a choice." Somebody has to choose how neighboring clock faces align, and for
the string nobody ever had to (the plant the ledger carries to §6's boundary
check). Folded into the anchor with its own figure: **before railway time, every
town set noon by its own sun** — comparing clocks across towns required a
convention, and no convention was more correct than another. One disanalogy
sentence leans the anchors against each other: the towns had no master rope in the
sky — and neither, the stripped room below will promise, does light. Now the
interactive crime, run *with the rope visible*: a **regauge brush** — smoothly
rotate each fiber's zero-mark by an arbitrary $\alpha(x)$. The plotted $\theta(x)$
writhes; its slope changes everywhere; the rope's actual motion, kept visible in
the top pane, is untouched. **Prediction #1** (commit before brushing): "will the
wave's energy readout change?" — and the meter is now a **dual meter**:
rope-energy (computed from the visible motion) beside formula-energy (§4's meter,
computed from the plotted slopes — lesson 01's string-energy recipe applied to
$\theta$, the only energy we know how to write yet, confessed in an "I" staging
sentence; no on-canvas caption, no new display equation — the math budget stays at
8). The reader commits "no — nothing physical changed"; the formula-meter jumps
anyway (the brush is time-independent, so $\partial\theta/\partial t$ and the
rope's motion are untouched — the twist term does the jumping) while the
rope-meter sits still. The split is the verdict, stated as such: every formula
built from $\partial\theta$ — the derivative, and the energy we wrote down with
it — is a fact about our labels; the rope-meter stayed honest only because the
rope lives in a room whose "up" every point shares. For the rope the prankster's
freedom is a choice of bookkeeping; for nature's clocks (§4's debt) there is no
"up" at all — which is why the rope must eventually be returned. **Math #3**:
$\theta \to \theta + \alpha(x)$, and the flat verdict: *the ordinary derivative of
a section is not a fact about the wave; it is a fact about our labels.*
Unfortunately, every wave equation ever written is built from derivatives.
Section-closing beat, one reuse-with-overlay figure: the room and rope fade,
leaving only clock faces — the confession in I-voice, staging register, with the
IOU: "nature's clocks, I'll confess before we are done, come with no room and no
visible needle; no experiment has ever read one clock's absolute angle — only
comparisons" (planted; redeemed §9 — the IOU is a plant, not the confession, so
the said-plainly-once vow holds).
*Savior: what we lack is a rule for carrying a needle from one clock to the next.*

### §6 · The Transport Rule (figs 26–33) — reader as inverse-solver
Parallel transport as data: a needle carried along the line, rotating by a
prescribed amount per step — a field $A(x)$, drawn as its own curve. Hand-tune
first (the airfoil move), as a two-stage game with its feedback channel specified.
**Stage 1** (one figure, one knob): $\alpha$ is a fixed-shape bump — visibly the
same bump the §5 brush applied — and $A$ is the same bump with a single amplitude
slider. The graph pane gains a second trace: the wave as read through the
transport rule (the needle carried by $A$, plotted as its disagreement with the
section — equivalently $\theta$ unwound by the accumulated transport), with a
ghost of the pre-mangle wave as the standing target; a residual **calm meter**
(mean disagreement) locks below a stated threshold — the win, reachable in ~15
seconds. "Too little, still writhing; too much, over-corrected" becomes the
literal reading of one slider. Crucial honesty beat, stated in the plan: the raw
$\theta(x)$ trace never moves while you tune — the transport rule repairs the
reading, not the labels, and watching the read-through curve calm while raw
$\theta$ keeps writhing is the point of the section. **Stage 2** (next figure):
$\alpha$ becomes two or three stacked bumps; $A$ gets three amplitude handles
(tap-step equivalents per the mobile flag). Corpus line earned honestly: "after
some trial and error you may get pretty close" — and the toil is declared
unscalable at brush resolution. You have just built *a connection*. **Math #4**
arrives as the *name* of the number the reader has been driving to zero:
$D\theta = \partial\theta - A$, color-bound: measured twist minus expected twist.
Then the rescue completes itself in the reader's hand — live figure first: brush a
fresh $\alpha$ over the wave they just repaired and watch the $A$ curve absorb the
brushstroke while the $D\theta$ plot sits perfectly still; overlay the shift $A$
picked up against the $\partial\alpha$ of their own brush — they match, stroke for
stroke; and the §5 formula-meter, rebuilt from $D\theta$ in place of
$\partial\theta$ ("Recall that…"), holds still under the same brush — the
invariance shown, not asserted; the meter that lied is the meter that now tells
the truth, the first physically meaningful number the repaired calculus buys us.
Only then the compression, **math #5**: $A \to A + \partial\alpha$, $D\theta$
invariant — the law is the name for what their hand just failed to break.
Boundary checks: $A = 0$ recovers ordinary calculus; and the sharper truth about
lesson 01: the room's shared "up" *was* a connection — the flat one, handed to us
free by the embedding, which is why the rope and the string never had this
problem. "Just use up = 0" is not an alternative to choosing a connection; it is
choosing one. Nature's phase comes with no room, so the transport rule must be
bought as physical data — and the plane will show that in general no flat choice
even exists. Name earned with the epigraph's first clause (echoed as an italic
clause fragment, never re-quoted whole): *the covariant derivative — differential
calculus, generalized.* One paragraph of historical shadow, no detour: the
subject's own history ran this exact failure chain — Weyl built the first gauge
theory in 1918 with the wrong fiber (length scale, not phase), Einstein pointed
out that atoms would then remember their histories and visibly don't, and the
quantum phase repaired it in 1929. Even the inventor's naive version broke first.
**Waypoint (Act II ends)**: you hold fibers, sections, the prankster, and the rule
that makes derivatives mean something again.
*Savior — and a suspicion conceded: everything called $A$ so far was written by our
own brush and can be erased by it — on a line that suspicion is not paranoia, it is
a theorem; any $A$ here is a diary of brush strokes, nothing more. What rescues $A$
from bookkeeping is not the line but the plane: where the needle has many ways to
travel, the diary theory becomes testable — and the ways need not agree.*

### §7 · Around a Loop (figs 34–38)
Base becomes a **plane of clocks** — and the ladder debt is paid at the door: with
many directions to step, the needle needs a rotation-per-step for each direction
it can travel, so $A$ upgrades from a scalar on the line to a pair $(A_x, A_y)$,
one number per direction of step — the object math #6 will differentiate.
Transport the needle along two different paths from P to Q: the arrivals disagree.
Close the loop: the needle returns rotated — phenomenon first, then the name:
*holonomy*. **Prediction #2** (the marquee): two loops on the plane, one
encircling a marked core, one not — commit to which needle comes back rotated,
then run both. Then the free exploration that generalizes the prediction: the
fixed-size loop, draggable across the plane, with its live $\oint A$ meter —
holonomy appears exactly when the loop encircles the core; position doesn't
matter, only enclosure (a seed §9's replay redeems). Physical anchor with its own
figure: the transport **needle** itself (the same amber glyph as §6), drawn lying
in the tangent plane of a globe, carried along a triangle (equator → pole →
equator), returning turned by a right angle — the sphere has been doing this to
travelers forever. The anchor audited immediately, in one confession sentence (an
imperfect, but convenient analogy): on the globe, the sphere's own shape writes
the transport rule; on our plane of clocks the floor is flat and a *field* writes
it — same phenomenon, different author (a confession redeemed at §9's replay).
*Savior: the disagreement is a per-loop fact; shrink the loop and it becomes a
per-area density, waiting for a name.*

### §8 · Curvature (figs 39–42)
Shrink-to-area, with area as the live variable: the fixed-position loop, one
radius slider, live $\oint A$ and $\iint F$ meters — a monotone radius sweep with
both meters live *is* the Stokes demonstration. **Math #6**: rotation per area →
$F = \partial_x A_y - \partial_y A_x$; the meter equality $\oint A = \iint F$
(Stokes, shown not cited). $F$ earns its own picture: a violet heat-map overlay on
the clock plane, per the palette contract. Boundary check, run on §7's draggable
loop: a pure-gauge $A = \partial\alpha$ gives zero holonomy on every loop — *the
brush can move $A$ around but cannot create or destroy $F$* — the meter's verdict
on §6's suspicion: a diary-of-the-brush $A$ scores zero around every loop, so
anything the meter reads is not diary. The promised distinction, one sentence: the
Möbius flip is topology (discrete, uncombable); holonomy is geometry (continuous,
per-area) — different twists, and the reveal needs the reader to know which is
which.
*Savior: a field you cannot gauge away, measured in loops. Physics has a name for it.*

### §9 · You Have Built Electromagnetism (figs 43–51) — the reveal
The dictionary, one row at a time, each row already touched by hand and each row a
small reuse-with-overlay replay of a figure the reader already drove (fig 43 the
table itself; figs 44–48 one row per figure, each keeping its original single
knob), with every physics-side entry pinned to a one-clause household anchor so
the physics column is never ghost-to-ghost: the connection $A$ ↔ the
electromagnetic potential (replayed over the §6 tuner); curvature ↔ the magnetic
field (space–space; the compass needle, the fridge magnet — replayed over §8's
loop meter) and the electric field (time–space — time joins the base, drawn
schematically, confessed; the doorknob spark, static cling); holonomy ↔ magnetic
flux (replayed over the loop); the regauge brush ↔ what physicists call gauge
transformations ("they kept the surveyors' word" — replayed over the §5 regauge
demo). The dictionary presented under its true name, as a history sentence: this
table exists in the literature as the **Wu–Yang dictionary**, written in 1975,
when Yang, trying to understand what his own theory was, asked the mathematician
next door (Jim Simons, at Stony Brook) and discovered that geometry had built the
whole apparatus decades earlier (the journal pointer lives in Further Reading).
Then the missing-identity beat, raised declaratively: one column of the dictionary
is still blank — nothing yet says what stands in the fibers when nature runs this
construction. The amnesty paragraph pays the §4 and §5 debts, with "Recall that…"
as the redemption operator: what the clocks are, said plainly once — the quantum
phase of a charged particle, with no room and no visible needle; no experiment has
ever read one clock's absolute angle, only comparisons — one honest paragraph, no
machinery. **Fig 2 redeemed** (fig 49: the same component with its overlays
unlocked — the holonomy meter and the circulating-$A$ arrows): the stripes are
where electrons land; the pattern *is known as interference* (phenomenon first,
name last); and the mechanism is exactly the machinery the reader owns — each path
carries a clock (§4), transported by the rule (§6); the two arriving needles are
added, and their alignment decides where the stripes sit. The dial is then named:
it sets the flux — the holonomy of a region the electrons never enter; zero
curvature along every path, nonzero loop. The globe confession cashes out: the
fringes slide though the floor is flat and no path sees any curvature — the author
here is the field, not the floor. Awe-dessert, staged as two desserts with the
awe-number as a figure axis (the same fig 49, its readout pane doing the work):
the AB toy gains a
fringe-shift-vs-enclosed-flux readout pane whose axis is marked in units of
$h/e \approx 4.14\times10^{-15}$ weber — the Aharonov–Bohm period; the fringes
slide linearly and the pattern recurs exactly once per $h/e$ (figure spec
constraint: *not* a staircase — the AB phase is continuous in flux; steps would be
superconducting flux quantization, a different phenomenon). Then Tonomura's 1986
experiment, anchored to the same toy with one overlay delta (fig 50: the shielded
core drawn as the superconducting torus; prose reads out why every loophole
closes): his superconducting sheath could trap flux only in half-period units —
$h/2e \approx 2.07\times10^{-15}$ weber, the superconductor's own flux quantum —
so his fringes sat displaced by exactly half a fringe: a phase of π, with the
field sealed away from the electrons entirely. And the double discovery as a
dual-pane figure (fig 51, one knob: drag-to-orbit, precedent §7's globe): in 1931
Dirac's monopole and Hopf's fibration entered the literature *the same year*, from
opposite directions — Hopf circles (stereographic orbit view; drag a point on the
base sphere, watch its fiber circle) beside Dirac's monopole field lines —
recognized as the same object only in 1977; and $h/e$ is where the *Dirac* unit
legitimately lives (charge quantization, the first Chern class), which the
half-vs-full-period contrast sets up rather than muddles. The debunk lands: $A$ is
not bookkeeping — loops of it move fringes in a laboratory.
**Waypoint (Act III ends).**
*Savior: so far we set $A$ by hand, frozen scenery. But nothing in nature is scenery.*

### §10 · The Wave in the Connection (figs 52–60)
Unfreeze $A$: the connection has dynamics of its own. One postulate confessed
plainly at the moment it's made (the honest hedge on "you can't keep it out"):
the repair is forced, but giving the repair a life of its own — the simplest
possible one, so it costs energy for the connection to curve and to change — is
the one thing we add by hand. And the confession carries a rider: the simplest
dynamics happens to treat every uniformly moving observer alike. The string's
equation looks identical but is written in the frame of the string's own material;
here there is no material underneath, so that reason for a preferred frame is
gone — and that no other reason sneaks in is special relativity's fact, which we
state and do not derive. Everything after is consequence. Act IV's household
anchor, immediately after the unfreezing and before the equation, with its own
figure: a **row of compass needles**. Wiggle a bar magnet at one end; what travels
down the row is not any needle and not a substance between them — it is the
redefinition of where each needle wants to rest, arriving point by point, late.
Each needle's rest direction is the local definition of "calm," so the reader
watches the thesis happen before the equation formalizes it — and at bottom this
is not even an analogy: the compasses read the curvature of the very connection
this section unfreezes. Two standard confessions where they arise: "I have slowed
time enormously — across a desk the redefinition arrives in about a nanosecond"
(the delay *is* the wave; time-speed slider as the one knob); and the needles read
the curvature readout $F$ while the wave itself rides in $A$ — exactly the
dual-pane mapping the hero teaches. (One sentence, no figure, extends the §5
railway anchor as a second rhyme: news of a time reform running down the telegraph
line is a ripple in the convention itself — audited with §8's boundary check
attached: a reform every town adopts is pure gauge, the brush's work, and carries
nothing; the ripple light carries is the part no reform can remove — the
curvature.) Then the reader plucks it — the same hand that set $A$ all lesson now
drags one point of the frozen $A$ curve and releases; the bump splits into two
pulses running opposite ways at $c$ (observed on a distance/time readout before
any equation). The waving quantity is the **transverse component $A_y$** — a plane
wave uniform in $y$, watched along one $x$-line of clocks, a slice of §7's plane,
which the reader already owns; confessed in the Ciechanowski register: "I show you
one line of the plane; the wave is identical along the direction I've hidden."
What their pluck obeyed, named — **math #8**:
$\partial^2 A_y/\partial t^2 = c^2\,\partial^2 A_y/\partial x^2$ (the gauge choice
confessed as "bolting down the prankster's knob before doing calculus" — Lorenz
gauge named, not derived). The readouts stated explicitly, with a D-vs-∂ readout
overlay riding the wave figure: $E_y = -\partial_t A_y$ (time–space curvature) and
$B_z = \partial_x A_y$ (space–space curvature), both nonzero, gauge-invariant, and
in phase. The free payoff sentence: light's waving component is perpendicular to
its travel — the transversality the reader met as the whirled rope of §4, now
explained rather than assumed. Named solver (deviation #4): leapfrog on $A_y$ over
a 1D grid, stability condition stated beside its constants — and the hero and the
connection-wave figure share *one* leapfrog state array $A_y(x,t)$; the top pane
draws no independent animation — $E$ comes from the leapfrog's two stored time
levels, $B$ by centered difference — i.e. exactly the time–space and space–space
curvature rows of §9's dictionary, so "the bottom one is the more honest" is true
in the code, not just the prose. **The hero returns** (ring closes): the dual-pane
EM wave, now readable — E and B in the top pane are the curvature readouts of the
connection pulse in the bottom pane; same wave, and the bottom is the honest one —
and because both readouts are derivatives of the same pulse (E from its
time-slope, B from its space-slope, of one $f(x-ct)$), they rise and fall in
lockstep: the in-phase dance the top pane presents as a coincidence, the bottom
pane derives. (One confession as the top pane's arrows appear, shared with the
pseudo-3D projection confession: the array the hero waves is the transverse
component of $A$ — §6's clock-row $A$ was the along-the-line component, and a wave
in that component alone would have E but no B.) Michelson–Morley resolved in one
paragraph, claiming only the earned half: the experiment was hunting the rest
frame of a substance, and a comparison rule is not a substance — no parts, no
worldlines, nothing to be at rest with respect to; the question, not just the
answer, was empty; and nothing about the rule is observable except what survives
the brush — its curvature, and its holonomies around loops. The measured isotropy
is the rider confessed above — kept, not re-derived. The inversion stated plainly
as the section's verdict: we never added light to this article. We admitted that
clocks have no shared zero, the derivative died, and the repair — the only
possible repair — turned out to have dynamics, and the dynamics is light. *Light
is a traveling ripple in the rule for comparing phases, and it exists because
calculus had to be repaired.*
*Savior: but the epigraph's boldest clause is still an IOU. It promised a universal
medium for ALL waves — and we have exactly one, light. Lesson 01's string, sound,
the phase wave the clocks turned out to carry: every other wave the reader has
ever met still lives in its own separate subject, with no bundle in sight.*

### §11 · Finale: One Medium, Every Wave (figs 61–67)
The epigraph audited clause by clause (clause fragments echoed as italic,
color-bound spans in author prose — the tweet is never re-quoted whole) — and the
"universal medium" clause is proven by a figure, not a paragraph. **The marquee
finale: the Universal Wave Machine** (fig 61, the lesson's term-toggle, flagged
with the wink the extra knobs deserve): one live stepper, the covariant wave
equation on screen, every symbol color-bound and already earned, and a
fiber/connection dial — with each dial position also frozen as its own one-delta
preset figure (figs 62–65), so the finale never droughts. The dial's honest
structure, staged in two clauses. First clause — positions 1–3 are literally one
equation, the covariant wave equation for the amber section $\theta$, its terms
graying and switching live: *fiber = line, trivial connection* → the string wave
(lesson 01's world, sound) — with the dial's wink that the string setting carries
lesson 01's material frame with it while the light setting will carry none: the
dial changes what stands *under* the wave as well as over each point;
*fiber = circle, $A = 0$* → a **free phase wave**, given a small mass term so
packets visibly disperse (one confession at the dial, in the AB-toy-honesty
register: this is the relativistic — Klein–Gordon — cousin of the schoolbook
matter wave; a real electron's wave obeys a first-order-in-time cousin of this
equation, Schrödinger's, a difference this lesson only names — but it couples to
$A$ by the identical rule, every $\partial$ becomes $D$, which is the dial's
actual claim: swap the fiber, keep the derivative); *fiber = circle, frozen
background $A$ with curvature* → a charged wave bending, fringes sliding (§9
replayed). Second clause — the fourth position is different in kind, and the
figure says so at the moment the dial lands on it: the on-screen equation visibly
trades its amber $\theta$ for blue $A$ ("Recall that…" — math #8, already earned
in §10 with its confessed postulate), confessed with the wink the finale already
budgets: one mode on this dial has no section left to wave, because for light the
medium itself is the wave — which is the whole article. The universal-medium
clause then cashes out honestly: one construction — choose the fiber, choose the
connection, write the covariant wave operator — contains every wave. Named, not
built, on the far side of the dial, with its own picture-gallery figure (fig 66,
knob: the which-force selector, confessed as named-not-built): richer clock
faces — sphere-like faces for the weak and strong dials, frames for gravity, with
one confessed difference. Lesson 01's waves: sections of trivial bundles under the
trivial connection — the same language contains them. And the marriage runs deeper
than containment (articles/02-fiber-bundles/RESEARCH.md §7), with one figure and
two prose desserts: the marriage figure (fig 67) — two linked vortex rings in
drag-to-orbit orthographic 3D with a live linking-number readout computed from the
Gauss linking integral of the drawn curves (honest because it is geometry of drawn
curves, not a faked 3D fluid sim) — shows the linking of lesson 01's vortex lines
measured by helicity — this lesson's Hopf invariant in Arnold's asymptotic
(averaged) sense, and exactly, as an integer, in the spherical-Clebsch maps
Schrödinger's Smoke runs on; ideal flow is itself geodesic geometry on a group
(Arnold — with his back-of-envelope estimate, from the idealized model's negative
curvature, of why long-range weather forecasts must fail); and the state of the
art in vortex-preserving fluid simulation (Schrödinger's Smoke, 2016) runs lesson
01's fluid *on* this lesson's bundle, beating lesson 01's own solver at keeping
filaments crisp — Smoke stays prose, because it cannot be simulated honestly in
scope, and we say so. The bridge between the lessons is theorems, not analogy. The
coda's crown jewel, set as the second and final use of the quoted-primary-artifact
block (a typographically quarantined block, never running prose): Yang to Chern in
1975 — "this is both thrilling and puzzling, since you mathematicians dreamed up
these concepts out of nowhere" — and Chern's reply: "No, no. These concepts were
not dreamed up. They were natural and real." Two communities, no contact, one
structure: found, not made. And the tweet's last clause, with its honest nuance:
this is the standard mathematics of the Standard Model, taught in every physics
graduate program and almost nowhere else — told to the public essentially once
(Scientific American, 1981) and forgotten; this article is the second telling,
with the reader's hands on the figures this time. Bridge to lesson 03.

### Further Reading & Final Words
Each with earned praise: **Baez & Muniain, *Gauge Fields, Knots and Gravity*** (the
gentlest true book on exactly this ladder); **Needham, *Visual Differential Geometry
and Forms*** (holonomy-first, a kindred spirit in pictures); **Feynman Lectures II,
ch. 15** (the reality of the vector potential, argued before Aharonov–Bohm was
common knowledge); **Tonomura et al. 1986** (the experiment of §9, done with
superconducting shielding so no skeptic could object); **Wu & Yang 1975**
(*Phys. Rev. D* — the dictionary itself; one of the few physics papers whose
centerpiece is a table, and the table is this article's §9); **Bernstein &
Phillips, Scientific American 1981** (the one telling before this one, and a
generous teacher still — it explains the neutron's 720° turn with a Philippine
wine dance and curvature with a rolling cone; what it never does is let the
connection wave, which is where this article picks up); the tweet itself, credited
as the seed. Final Words: re-enchantment benediction — the next time light crosses
a room to reach your eye, there is no jelly quivering in between; there is a
bundle, and the light is its geometry ringing — an "I find it…" sentence — *and
now you own the derivative that makes it move.*

---

## Palette contract (fixed at first appearance, never redesigned)

Deliberate role-rhyme with lesson 01: amber is still "the thing we watch," blue is
still "the field that acts on it," violet is still "the derived meter."

| Quantity | Color | First appears |
|---|---|---|
| base space / rails / fibers | gray `#6b7280` | §2 |
| section / wave value / needle angle θ | amber `#d97706` | §2 |
| connection / transport rule A | blue `#2563eb` (site accent) | §6 |
| gauge / the prankster's α | green `#059669` | §5 |
| curvature / holonomy F | violet `#7c3aed` | §8 |
| electric / magnetic (hero top pane + dictionary) | red `#dc2626` / cyan `#0891b2` | §1 (hero, top pane only — shown, not named) |

Equation terms inherit the color of the figure element that taught them ($\theta$
amber, $A$ blue, $\alpha$ green, $F$ violet). Red/cyan appear exclusively in the
hero's textbook pane (fig 1 in §1, and its §10 return) and §9's dictionary panes.
In §1 they are shown but unnamed — no prose span binds red/cyan until §9's
dictionary teaches E and B — and they never appear, in figure or prose, in §2–8,
where the core vocabulary (amber/blue/green/violet) lives. The hero's arrows
therefore keep one color identity from fig 1 to the ring's close.

## Production notes (Stage 3 planning)

**Sim inventory** — all Canvas-2D, one shared kit, heavy reuse-with-overlay:
- *Clock kit* (shared, `sims/lib/clocks.ts`): clock-row/clock-grid renderer (circle
  fibers + needles), θ-graph pane, regauge brush, transport-needle walker, A-curve
  editor, holonomy meter. Used by ~60% of figures — this is the lesson's field-kit
  bet, mirroring lesson 01's `field.ts`.
- **Clock-kit state contract** (so the regauge demo cannot refute its own claim):
  every clock-row figure holds $\theta_{\text{phys}}(x,t)$ (physical needle
  angles — a prescribed traveling wave in §5; only §10/§11 steppers integrate
  state, and they integrate physical/gauge-invariant variables) plus gauge data
  $\alpha(x)$ (zero-marks) and, from §6 on, $A(x)$. Brushes write ONLY to gauge
  data — the regauge brush to $\alpha$ (and in §6 simultaneously
  $A \leftarrow A + \partial\alpha$, math #5 made literal); no brush ever touches
  $\theta_{\text{phys}}$ or stepper state. Rendering: the top pane draws needles
  from $\theta_{\text{phys}}$ and zero-marks from $\alpha$ (the brush visibly
  spins the green marks while the amber needles stay frozen); the bottom pane
  plots the label $\theta = \theta_{\text{phys}} + \alpha$ (math #3). "Nothing
  physical changed" then holds by construction, including when the clock-row later
  hosts live steppers. The §5 energy readout is defined here too: the
  formula-meter is the naive string-energy of the *plotted label*,
  $E = \Sigma[(\partial\theta/\partial t)^2 + (\partial(\theta+\alpha)/\partial x)^2]$ —
  deliberately built from ordinary derivatives, so under a static brush the
  gradient term jumps; Prediction #1's answer is pinned: yes, the readout changes
  while the rope does nothing. Forward hook: §6 reuses the same meter with
  $\partial$ replaced by $D = \partial - A$; "make the mangled wave read calm"
  means driving this meter quiet, and after the compensating law it sits still
  under any brush.
- **Clock-kit pointer helper** (touch-scroll arbitration, implemented once in the
  kit, inherited by ~60% of figures): canvases get `touch-action: pan-y`; the
  regauge brush claims the pointer only after horizontal intent (|dx| > |dy| over
  the first ~8 px, else release to page scroll); the A-curve editor and holonomy
  loop capture only when the touch begins on a fat target (≥44 px hit radius
  around a curve handle or the loop path); all other touches scroll. Noted
  asymmetry: brush strokes are horizontal, but A-curve edits are vertical drags
  (value up/down), so intent detection alone would break the §6 tuner —
  handle-anchored capture is the rule there.
- Steppers: string-with-rails (extends `StringWaveDemo`); helix rope + circle
  extraction; Möbius comb (drag a section around the band; the untwisted-band
  twin for the winnable version — never called "cylinder"; that word belongs to
  the clocks' total space); clock-row wave (with the §4 energy-meter readout);
  regauge demo (dual-pane, slope-built **dual energy meter** — rope-energy holds
  still, formula-energy jumps under the brush *by design*; §6 reuses the formula
  meter rebuilt from $D\theta$; the meters are readouts, not knobs — the brush
  remains the section's one control); connection tuner (the inverse-solver game;
  one stepper, two staged configs — a single-amplitude bump, then 3–4 draggable
  handles at fixed x with fat hit targets ≥44 px and tap-step equivalents; the
  target mangling $\alpha^*(x)$ is generated by sampling the tuner's own editor
  basis — random y-values at the same handle positions, Catmull-Rom interpolated —
  so that curve IS the answer $A^*$ and $\alpha^*$ is its integral, computed once
  at create(): exact match is representable *by construction*, no
  spatial-frequency cap or representability check needed; feedback = read-through
  trace + ghost target + residual calm meter, RMS($D\theta$) against a calm
  pre-mangle scene ($\partial\theta_0 = 0$; if Stage 3 mangles a traveling wave
  instead, the meter must be RMS($D\theta - \partial\theta_0$)), win at <10% of
  initial, the $D\theta$ trace relaxing to a flat line; the meter is a small bar
  in neutral ink/gray with a lock-on-win state — NOT green and not violet: green
  is contracted to $\alpha$ from §5 and violet does not first-appear until §8; no
  snap-to-$\partial\alpha$ button — the relief beat is the adjacent math #5
  figure); D-vs-∂ comparison plot; globe needle transport (orthographic
  projection: rotate the lat/long grid by the two orbit angles and drop z;
  visibility is the z-sign alone — back hemisphere faint, front bold, no z-buffer;
  path fixed to §7's octant triangle; transport is closed-form — along each
  great-circle leg the needle keeps a constant angle to the leg's tangent, and the
  return deficit equals the enclosed area, exactly 90° — so no numerical
  integration anywhere in the figure; drag-to-orbit — 3D only because a sphere is
  irreducibly 3D); plane holonomy loop (one stepper, two overlay configs, one
  manipulation each: (a) fixed-size loop, draggable across the plane, live
  $\oint A$ meter — holonomy vs. position, the reader finds the core by sweeping;
  (b) fixed-position loop with one radius slider — no resize handles — live
  $\oint A$ and $\iint F$ meters, holonomy vs. area, earning $F$ as per-area
  density and the Stokes equality); Aharonov–Bohm two-path toy (one component,
  two configs: the §1 config = sealed core + two paths + the dial + sliding
  stripes only; the §9 replay = the identical component gaining two overlays — the
  holonomy meter, $\oint A$ read live from the dial, reusing the clock kit's
  meter, and circulating-$A$ arrows outside the core with $F$ confined inside —
  zero additional sim code; the plant is paid by reuse-with-overlay); leapfrog on
  the transverse component $A_y(x)$ (1D grid; plane wave uniform in y; pluck
  interaction: drag one sample of the $A$ curve, release — tap-step equivalent per
  the mobile note); hero dual-pane EM wave (readouts $E_y$ and $B_z$; spec
  constraint: the two arrow families must be drawn exactly in phase — the
  "leapfrog" picture, E and B a quarter-cycle apart, is itself a widespread
  misconception and must not appear anywhere in the figure); compass-row anchor
  (§10; free — a compass is a circle plus a needle, the clock kit re-skinned; one
  time-speed knob); linked vortex rings (§11; drag-to-orbit orthographic 3D, live
  linking-number readout via the Gauss linking integral of the drawn curves — do
  NOT claim reuse of lesson 01's assets, those are 2D); Hopf/monopole dual-pane
  (§9; stereographic orbit view, one drag-to-orbit knob); **Universal Wave
  Machine** (the §11 finale — see its own design bullet below).
- **UWM design** (so the finale's claim is true in the code): state is one
  stepper, two fields {ψ: complex pair (current + previous), A: real pair
  (current + previous)}; the dial is a flat sum type
  Mode = String | FreePhase | ChargedInFrozenA | LightInA — not a
  fiber×connection product (line-fiber × nontrivial-connection is uninhabited;
  illegal states unrepresentable), one handler per mode selecting which field
  steps and which is frozen scenery. The covariant Laplacian is discretized with
  link phases $U_i = e^{iA_{i+1/2}\Delta x}$ on edges:
  $\psi_{tt} = c^2(U_i\psi_{i+1} - 2\psi_i + U^*_{i-1}\psi_{i-1})/\Delta x^2$.
  Since $|U| = 1$ the operator is Hermitian with spectrum in $[-4/\Delta x^2, 0]$
  regardless of $A$, so the charged mode's stability is A-independent by
  construction — and this discretization IS "one group element per lattice edge,"
  echoing RESEARCH.md §7's lattice-QCD note (a free honesty win worth one sentence
  in-post). One confessed representation upgrade: the finale's clocks gain a
  needle length (phasor), because mode 3's "fringes sliding" needs amplitude — the
  angle-only θ of §5–6 cannot interfere. The FreePhase mode carries a small mass
  term $\psi_{tt} = c^2\psi_{xx} - \mu^2\psi$ (one confessed constant): without it
  mode 2 is massless KG, dynamically identical to the string mode, and the dial's
  second stop would show nothing; with $\mu > 0$ packets visibly disperse — the
  stop's payoff — confessed as the relativistic (Klein–Gordon) cousin of the
  schoolbook matter wave. §10's leapfrog on $A_y$ is the $U \equiv 1$, real-field
  member of the same family, which keeps the "same stepper family" bet literally
  true. The equation pane animates the mode-4 unknown swap θ→A in their contract
  colors (amber → blue), so the figure is honest that three modes are one equation
  and the fourth swaps the protagonist on purpose. On-screen honesty sentence
  (also §11's prose): "every mode runs the same leapfrog on the same covariant
  operator; the dial chooses the fiber, the mass, and which field is live versus
  frozen scenery."
- **Mode-2 naming note** (keep the subtlety visible): mode 2 is "free phase,"
  never "matter wave" — Schrödinger is first-order in time; the UWM stepper is
  second-order; only the coupling rule (∂→D) is universal.
- **AB toy honesty**: it is phasor arithmetic (two path phases added), not a
  Schrödinger solver — confessed in-post; the fringe shift is exact anyway, which
  is itself the point (only the loop integral matters). Two confessions, each
  where it lands: (a) at fig 2 (§1), one clause, no math — the paths, fringe
  spacing, and envelope are drawn for legibility, wildly not to scale (this keeps
  §1's "No mathematics yet" contract and plants the scale debt that §9's
  flux-period dessert, $h/e \approx 4.14\times10^{-15}$ Wb, pays); (b) at the §9
  replay — the pattern is the exact two-path interference formula, and its
  exactness is the point. Framed positively: the figure computes the closed-form
  answer — nothing dynamical is being faked, so the honesty rules are satisfied by
  construction; fringes move only because the dial does.
- **Hero honesty**: one stepper, one state array (the §10 leapfrog), one
  time-speed slider; the top pane is derived readouts only ($E$ from the two time
  levels, $B$ by centered difference), drawn in a fixed oblique axonometric
  projection — the one genuine rendering task (~30 lines, static transform),
  confessed in prose. Never two synchronized animations.
- **Leapfrog honesty** (deviation #4): stability condition
  $(c\,\Delta t/\Delta x)^2 + (\mu\,\Delta t/2)^2 \le 1$ (reducing to
  $c\,\Delta t/\Delta x \le 1$ when $\mu = 0$), stated once beside the shared
  constants that satisfy it by construction; Courant number ≈ 0.9 so the mass term
  has headroom by construction.

**Build order** (Stage 3): clock kit (with the state contract and pointer helper
above) → §2 string-with-rails → §3 Möbius (needs only the rails, not the clock
kit) → §4 rope + clock-row → §5 regauge → §6 tuner (the risk item — playtest
early; gate: median win under 60 s on mobile, else reduce to 3 handles / widen the
win threshold) → §7–8 loop + globe → AB toy → §10 leapfrog + hero + compass row →
§11 UWM + linked rings + Hopf pair. Prose blocked per section as figures land;
lesson stays `draft` throughout; `bun run typecheck && bun run build` green the
whole time. **Stage 3/4 gate** before final-draft prose: verify the tweet's exact
wording (archive.org snapshot or a logged-in read of status 1077751816400433152)
and upgrade DENSE_CORE's "candidate status link, unconfirmed" annotation to a
verified citation in RESEARCH.md §1 — the ring terminates at this sentence and it
cannot be a paraphrase. (The Yang–Chern quote needs no new work: RESEARCH §3
already sources it.)

**Feasibility flags**: nothing here strains Canvas — the heaviest figure is the
clock-grid plane (~30×20 clocks, trivial). The globe figure needs care to stay
"one knob" (drag-to-orbit + a single walk button — no zoom, no orbit inertia, no
draggable vertices; anything beyond orbit + walk is cut); with the z-sign cull and
closed-form transport it is a ~150–250 line Canvas-2D build with no solver, so it
carries no stability-condition obligation (deviation #4 does not apply — the
figure is exact). The connection-tuner game must be winnable in ~15 seconds
(stage 1) / under a minute (stage 2); win = residual meter under threshold, locked,
with the ghost-overlap as the visual confirmation; the raw-θ-never-moves display
must be playtested first — it is the article's riskiest figure. Touch: the brush
kernel must be wide enough that one finger stroke is a meaningful α edit — one
constant serves both the winnability construction and the touch kernel; ≥44 px
handles on the A-curve. The tap-step ledger, per interaction: brush → tap places a
smooth α bump at the tap point; A-editor → tap-select a handle, then nudge arrows;
Möbius comb → step-around buttons; globe → the walk button; leapfrog pluck → tap
lifts the nearest sample.

**Audit hooks** (Stage 5): words-per-figure 85–180; drought max 3 paragraphs; knob
≤1 except the flagged finale; the anti-checklist from METHODOLOGY.md, with one
registered amendment — the zero-question-mark and no-inline-citation audits count
author voice only; quoted-primary-artifact blocks (budget: exactly two — the
epigraph and the §11 Yang–Chern exchange) are exempt, and the budget itself is
audited. The plants ledger:
- fig 2 (AB toy + its one loaned fact: the stripes are a real measurement) → §9
  (stripes named as interference; the dial named as flux; loan repaid via two
  added clock needles; the redemption is the same component with overlays
  enabled — identity, not a rebuild);
- fig 1 hero IOU → §10 return;
- Möbius flip → §8's topology-vs-geometry sentence;
- "nobody chose for the string" (§5) → §6's trivial-connection boundary check;
- §4 energy meter → §5 dual-meter verdict → §6 $D\theta$-rebuilt meter sits still;
- rope loaner (§4, reinforced §5) + room-stripped IOU (§5) → §9's quantum amnesty;
- §6 suspicion ("A is the brush's diary — true on the line, a theorem there") →
  §8 pure-gauge boundary check (the meter that tests it) → §9 AB (the verdict:
  loops of A move fringes);
- globe authorship confession (§7) → §9 AB replay ("the fringes slide though the
  floor is flat; the author here is the field, not the floor");
- §7's draggable loop plants "position doesn't matter, only enclosure" → §9 AB
  replay;
- §10's savior (the universal-medium IOU) → §11's Universal Wave Machine;
- the epigraph audited clause by clause in §11.
Note for the record: the §9/§11 drought map and the figure budget were rebalanced
at skeleton review (61 → 67 figures; header and protagonist line updated to match).
