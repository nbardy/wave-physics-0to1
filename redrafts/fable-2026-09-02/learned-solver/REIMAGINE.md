# Teaching a Solver to Guess — reimagined, 2026-09-02

Fable 5.1. Read in the order the brief gave: `00_VOICE_DOCS_CRITIQUE.md` §4 as law,
INTROS rules 1–4, 6, 8, SLOP's four tests, ESSENCE §3/§4/§6, NICKS_VOICE §6–7,
METHODOLOGY §0–2, then `src/lessons/lesson-04-learned-solver.mdx` (636 lines), the
sims it imports under `src/sims/learned/`, `articles/08-learned-solver/{DENSE_CORE,
PLAN, HANDOFF}.md` and `source/VISUAL_STORYBOARD.md`, and `articles/CONCEPT_BANK.md`.
Line numbers below are the MDX's. Nothing outside this file was touched.

Two facts checked against source that the read leans on:

- Lesson 01 L493–495 says "A few dozen sweeps of neighbourly negotiation later, the
  hill has risen and the divergence is gone. These sweeps are *Jacobi iterations*."
  `src/sims/lib/solver.ts` L27 and L37: Gauss–Seidel, `PRESSURE_ITERS = 40`, no
  tolerance check. So lesson 01 told the reader the divergence was gone; lesson 04's
  L76 says lesson 01 "did not tell you."
- `net.ts` `prolong` is bilinear, so the proposal's seams are gradient kinks along the
  coarse-grid lines, not value steps. `SlowModes.tsx` plots the two mode amplitudes
  and no residual. `WarmStartRace.tsx` prints the proposal's field error and residual
  for the case on screen; the manifest's held-out averages are 0.106 and 2.27, the
  prose's 2.42 is the hero case.

## Part 1 — The read

Dana writes backend services, took one numerical-methods course, and has read
lessons 01 and 03 on this site. She did not build any of this. Warren has read every
Ciechanowski post twice, reads every "neural network learns physics" article that
crosses his feed, and notices when a sentence is doing something to him rather than
telling him something.

### Dana

L15–19. "There is a neural network running a few centimeters below this paragraph."
She read lesson 01; that is lesson 01's sentence with the noun changed. She files it
as a series habit. 809 weights, checked in, trained on the lesson-01 solver: she
believes it. "It is doing real work" — she waits for the work, and the next sentence
gives it. L21, worse than guessing zero. She predicts the article will explain how a
good guess reads as a bad one, and that is what she is here for.

L23. Three panes. She reads the labels: the defect, sweeping from zero, sweeping from
the network. Middle pane empty; right pane already a pressure field. Under them, sweep
counters, ‖r‖ meters, and three lines of gray text at the left. After a few seconds of
hunting she finds "its own residual: 2.42" and "11% of the field still missing." The
race runs, the right counter stops first, a green chip appears. She has the paradox,
and she got it by reading a ledger.

L25–36. "it is still violet, and it is still the crime" — lesson 01's word. Then a
paragraph on what amber means in this series and what a dashed border means. She did
not ask. First dip.

L38–46. The paradox again, with the numbers she already found. "Nothing is broken…
and where it had better not." She reads "had better not" as a promise of a disaster
later and accepts the promise.

L48–72. Four moves of the timestep, an equation from lesson 01, six thousand
unknowns. She predicted the explanation of the paradox and gets a description of the
machine. No figure between L23 and L84; she scrolls to find the next one.

L74–100. "Here is something lesson 01 did not tell you." She half remembers lesson 01
saying forty. L79, "Forty because forty was the number in the code" — she likes that
one. SolveDebt: she drags the budget to 4 and the wake goes stiff, which she can see;
to 200, where the frame rate drops and the violet trace still sits above the green
line. She now knows the solver was never finished. She does not know what that has to
do with the guess.

L102–121. A five-row table. She reads the headers, reads the third row because the
prose says it is the only one that matters, skips the other four. Second dip.

L123–127. A waypoint says everything from here is about making unfinished business
cheaper, never optional. She takes that as the article's shape.

L129–161. SlowModes. She sets the ripple; it is gone before she can count; the bulge
is still there at six hundred. One cell per sweep (L146–150): she gets it. The residual
is a difference of neighbours (L152–156): she gets it. L160, "the whole strange
arithmetic of the opening figure." She has her explanation. She checks the scrollbar:
a quarter of the way down.

L163–201. ProposalAnatomy. 96 numbers in, three convolutions, stretched back. "That is
not a compromise made for speed. It is the architecture stating what it believes." She
reads it twice; the second sentence says the first again. The two meters a third time.
The symmetries paragraph is dense and she trusts it without checking.

L203–228. No figure. Six configurations, 240 fields, Adam, 8,000 steps, a minute on a
laptop, the loss is on the field. "That choice is the entire preceding section, cashed
out" — she does not know what "cashed out" is doing. Third dip, the long one.

L230–254. The race with knobs. At 10⁻² the speedup is eight times, at 10⁻⁴ about two;
that surprises her and she plays with it. "Notice what does not drop." She looks for
what does not drop, finds the agreement number, and feels told to look.

L256–298. The prediction. She picks the warm sweeps, because that is what the article
is about. Cold conjugate gradients wins. This is what she will retell. L277–278 tells
her the figure is meant to be unflattering to her.

L300–305. A second waypoint ending in a rule about baselines. It reads as advice.

L307–329. ImpulseResponse. She drags the poke, the true well slides, the network's
does not. She did not know she needed this section until it arrived, and nothing
before it said it was needed.

L331–379. "Suppose we simply believed it." The ungated channel comes apart in eight
steps and she can see the blocks. Best figure on the page for her. SabotageGate: noise
up, sweeps climb, the answer does not move. The bolded sentence at L376 is what she
would quote if asked to quote something.

L381–416. A seven-row table. She reads the bold row and the last column's header. The
prose explains that the column is a ladder. She has been reading a long time and this
is a new subject.

L418–439. Dye smearing on a coarse grid. This is lesson 01's advection with a
resolution knob; she recognises it and wonders why the article about the pressure
network is now about dye.

L440–478. A second network, a second training recipe — she notices it is the second
— a loss of 10⁻⁶, and L465: it wrecks the flow in two hundred steps. A genuine shock,
and she is too tired to spend it.

L480–538. K = 16, an adjoint, a strength slider, a mass ledger, "One more honesty
item." She skims from L505 to the end of the section.

L540–575. Thirty-six lines without a figure and a table of four fields. She stops here
and scrolls to Final Words.

L617–636. "Two networks live in this lesson." "I keep coming back to how old the
load-bearing parts are." "The next time a headline says…" She has read this ending's
shape at the bottom of lesson 01.

Tomorrow she retells two things: the guess looked right and the meter said it was worse
than nothing because the meter only hears the rough part; and a 1952 algorithm beat
the neural network. She does not retell the second network, the map, or the four
fields.

### Warren

L15. Lesson 01's opening line with the noun changed. He marks the skeleton.

L18. "It is doing real work." What work? The next sentence says, so this one was a
drum roll.

L21. A fact, and a good one. He waits to see whether the article spends the paradox or
earns it.

L23. He looks at the hero for the paradox and finds it in the third line of gray text.
The figure's mystery lives in a number the eye has to hunt for.

L28. "the crime." Lesson 01's device, seven deployments there, back again. L33–36: a
legend he did not need, delivered as a paragraph on series conventions — the author
talking about the author's system.

L44–46. "the distance between them is where a neural network can live…" He has read
this site's own before/after for promissory narration — "the distance between those
two sentences is this whole article" — and this is the same construction. "And where
it had better not" is a wink. He feels the hand.

L72. "the property everything below leans on." A schedule.

L76. "Here is something lesson 01 did not tell you." He opens lesson 01 and finds
L493–495: a few dozen sweeps and "the divergence is gone," and the sweeps are "Jacobi
iterations." So lesson 01 told him the opposite, and named the method differently
from this lesson and from the code. The true sentence — lesson 01 said the divergence
was gone; it is not — was sharper than the one printed.

L86–87. "the one line of instrumentation this lesson adds." L98: "So the honest
starting position." Planning vocabulary in print; he has seen this family on this site
before.

L102–121. "There are five, they are genuinely different." He predicts the article will
walk all five, because why else print the table. He is right, 280 lines later.

L126. The waypoint promises the unfinished business is never made optional. L336 makes
it optional on purpose. He notes the contradiction.

L129–161. No objection to the section. At L160 the hero has been explained and he asks
what the article will do with the remaining three quarters of the page. He predicts:
things.

L165. "Which is what the network is. All 809 numbers of it." Cadence. L174–175: a
network with beliefs.

L220–228. He agrees the loss belongs on the field. He notices the paragraph explains
the author's decision instead of showing a residual-trained network failing. If
training on the residual is wrong, that is a figure.

L242–250. The gate dependence is a real finding, stated plainly. Then "The gate is the
contract between the two paths, and its number is the contract's strength." Aphorism
one.

L254. "Notice what does not drop." The fact was one clause away and he is told to go
find it.

L258. "Everything so far is true and everything so far is incomplete." Aphorism two, a
balanced pair with nothing in the second half.

L263–264. "published in 1952." He predicts conjugate gradients wins because the
sentence's rhythm has already called it; the prediction widget is decorated as a fork
after the prose picked.

L277–278. The author describes the figure's intent toward him.

L289–298. He respects this paragraph. He also counts the headline ratio: 64% at L238,
3.4× at L289, 2.8× at L378 — three numbers for one effect, on different cases and
averages, the case unstated at the point of use.

L303–304. A rule about baselines. Swap "learned component" for anything and it stands.

L307–329. He likes the impulse figure. Nothing failed to bring him here; the section
opens on "there is a temptation."

L333–334. "Which brings us back to the strange arithmetic at the top" — navigation.
L336–357 he grants whole. L376, the bolded thesis. L405–406 restates it with "the
fact the sabotage slider spent all of last section demonstrating." L627–628 will say it
a third time.

L385. "Here is the rest of the machine at the same magnification." The reveal
register, pointed at a table.

L398–402. "None of these seams exist in Navier–Stokes." True and worth having. Then the
ladder is explained to him in prose for ten lines.

L418. Lesson 01's advection with a knob, and L430–431 auditing lesson 01's honesty
("disclosed when lesson 01 bought it").

L465. The detonation. The strongest fact in the back half, and the first line of a
different article.

L477–478. "The loss was never allowed to watch the machine it lives in. So let it watch
the machine." The turn is made of the sentence's own words.

L534. "One more honesty item, and it is the one that matters." He knows the flagged
lesson-02 sentence this is the sibling of. He closes the tab.

Had he gone on: L564, "The same map is being drawn in every field that simulates" —
the survey slide. L626, lesson 01's "I find it steadying" slot. L632, lesson 01's "The
next time you stir your coffee" slot.

He retells one sentence: a 1952 algorithm beat the neural net, and the article knew it
and said so. He adds that it took 260 lines to get there.

### STORY

The five sentences the article as written implies:

1. A network's guess for the pressure field is 89% of the answer and scores worse than
   an empty grid on the solver's own meter.
2. Then we look at the four moves of the timestep, at the forty-sweep budget, and at a
   table of five kinds of error.
3. Local averaging erases a three-cell ripple in a dozen sweeps and a channel-wide bulge
   in thousands, and the residual is loud about the ripple and quiet about the bulge —
   which explains sentence 1, at line 160.
4. Then we look at the network's layers, its training set, its race, a conjugate-
   gradient baseline that beats it, its impulse response, the ungated rollout, the
   sabotage slider, a seven-row map of the timestep, a second network on advection that
   detonates and is repaired, and a table of four fields.
5. Then we look at Final Words, which say the load-bearing parts are old.

Sentence 3 is a story sentence and it is the end of the story, not its middle. The
other three are itineraries. DENSE_CORE names the spine "a tour of checks in
descending strength," and that is what it is.

Current hero: `WarmStartRace`. Familiarity cost: close to zero — no reader has seen a
warm-started pressure race with the solver's meter under it. The hero's cost is
elsewhere. Its paradox is two small numbers in gray text rather than something the eye
sees, and it never returns: PLAN.md records the coda re-run "dropped as redundant," so
the figure re-runs with knobs at 36% of the page and the article ends on a table of
other fields. The ring is open.

Specimen: hosts. The mathematical object — error has a wavelength, sweeps charge by
the square of it, the meter divides by the same square — gets L143–161 and L365–379,
about forty lines. Two training recipes, an optimizer, two losses, a flux form, a K =
16 unroll, an adjoint, and four tables get roughly three hundred. The machine-learning
apparatus is the house; the object rents two rooms.

### PROSE

Quoted exactly; line; the test failed, in one clause.

- L15 "There is a neural network running a few centimeters below this paragraph." —
  repetition: lesson 01 L8, "running right now, a few centimeters below this
  paragraph."
- L28 "and it is still violet, and it is still the crime." — repetition: lesson 01's
  device.
- L33–34 "in this series amber marks the thing we watch, and in this lesson the thing
  we watch is the network's word." — disputability: the subject is the palette, not
  the machine.
- L44–46 "Nothing is broken. The meter is honest and so is the picture, and the
  distance between them is where a neural network can live inside a physics solver —
  and where it had better not." — performance: suspense, and the house's own
  "distance between" fix reused.
- L72 "That indifference is the property everything below leans on." — disputability:
  a schedule.
- L76 "Here is something lesson 01 did not tell you about its own solver." —
  disputability: lesson 01 L493–495 told the reader the divergence was gone.
- L126 "Everything from here is about making that unfinished business cheaper — never
  about making it optional." — disputability: a schedule, and L336 breaks it.
- L174–175 "That is not a compromise made for speed. It is the architecture stating
  what it believes." — performance: symmetry filler; the second sentence restates the
  first.
- L222 "That choice is the entire preceding section, cashed out." — disputability:
  about the article, in planning vocabulary.
- L254 "Notice what does not drop." — performance: withholds the fact and instructs
  the reader.
- L258 "Everything so far is true and everything so far is incomplete, because a
  speedup is a ratio and a ratio needs a denominator." — performance: a balanced pair
  standing in for the fact that follows it.
- L303–304 "it is worth it against the best baseline you were willing to implement —
  never against the one you happened to have." — disputability: survives topic-swap.
- L385 "Here is the rest of the machine at the same magnification:" — performance: the
  reveal register pointed at a table.
- L534 "One more honesty item, and it is the one that matters." — disputability: about
  the article; the sibling of the flagged lesson-02 line.
- L632 "The next time a headline says a neural network simulates physics a thousand
  times faster," — repetition: lesson 01's closing slot, with L626 filling lesson 01's
  "I find it steadying" slot four lines earlier.

## Part 2 — The new outline

### Hero

`WarmStartRace`, kept. One frozen divergence field; two pressure solves on the same
matrix to the same gate, left from zero, right from the network's proposal; a sweep
counter and a residual meter under each; the proposal's field error and residual
printed once. Kept because the thing it shows — a nearly finished field that the
solver's own meter scores below an empty grid, and that then wins the race — is the
mathematical object itself and not a host for it, and nobody has seen it.

Familiarity cost: near zero on the phenomenon. The cost this hero pays is legibility:
its paradox is carried by two gray numbers. The intro below reads those numbers out
before the figure so the eye knows where to look, and the figure's return carries the
overlay that makes the numbers into curves.

At the top: no legend paragraph; the pane labels carry it. One knob: the gate
(10⁻², 10⁻³, 10⁻⁴). The reader who presses it sees the race's ratio move and does not
yet know why.

State it returns in (§8): the same race with a residual-versus-sweeps plot under it on
a log axis, both curves, the gate as a horizontal line, same knob. The reader draws the
curves before they run: the warm curve starts above the cold one, crosses below it
within the first few dozen sweeps, runs a fixed distance ahead from then on; both cross
the gate; the two accepted fields agree to a number that belongs to the gate. Every
number under the hero is one equation read at three wavelengths.

### Thesis

The solver's meter reads the error through the Laplacian, which makes it nearly blind
to the smooth error that costs thousands of sweeps and loud about the rough error that
costs a dozen — so a guess that supplies only the smooth part reads as worse than
nothing, saves most of the work, and cannot corrupt the answer.

### The five sentences

1. A network's guess for the pressure field is about nine tenths of the answer, scores
   above 2 on the solver's residual meter where an empty grid scores 1, and the sweeps
   that start from it cross the gate in about a third of the sweeps that start from
   nothing.
2. The obvious mechanism is lesson 01's — sweep from zero and stop at forty — and it
   fails on screen: a fifth of the defect is still there after forty sweeps, two
   hundred sweeps do not reach the gate either, and the leftover has a shape, because a
   three-cell ripple dies in a dozen sweeps while a channel-wide bulge is still on
   screen at six hundred.
3. Supplying the bulge from a 12 × 8 grid — by hand, then by 809 weights — fixes the
   slow part (2330 sweeps become 840) and creates a failure the reader watches on the
   meter: a coarse guess arrives with seams along the coarse-grid lines, the residual is
   the error through the Laplacian, the Laplacian hears a seam hundreds of times louder
   than a bulge, and the meter scores the improving guess as worse than nothing.
4. Dropping the meter and taking the guess as the pressure wrecks the flow in eight
   timesteps with the seams as the wreckage; keeping the meter as the finish line
   fixes that — the weights can be turned to noise and the accepted answer moves by
   under 1.24% — and creates the last problem: the network can now only move a sweep
   count, a sweep count is a ratio, and its denominator turns out to be a 1952
   algorithm that crosses the gate in fewer passes than the warmed sweeps.
5. The opening race, re-run with a residual-versus-sweeps plot under it: the warm curve
   starts above the cold one, drops below it within the first few dozen sweeps, runs a
   fixed distance ahead from then on, and the two accepted fields agree to 0.24% —
   every number under the hero is r = −A e read at three wavelengths, and the reader
   draws the curves before they run.

### Section ladder

Format per section: what is built naively; its visible, simulated failure; figures
(REUSE / OVERLAY / NEW with cost); the one knob; the math moment and what the reader
just did by hand that it formalizes; the savior sentence.

**§0 — the hero, under the intro.**
Built: nothing yet; the race runs. Read-out under the figure, three sentences: which
pane is which; the proposal is computed once, 809 multiply-adds, and does not change
while the sweeps run; the residual meter is a real pass over the grid and reads the
same quantity under both panes. Figure: `WarmStartRace` REUSE. Knob: gate. Math:
none. Savior: the middle pane is lesson 01's solver doing what lesson 01's solver
does, and lesson 01 said forty sweeps of it left the divergence gone.

**§1 — Forty sweeps.**
Built: lesson 01's `project` — sweep from zero, stop at forty, no check. Failure:
`SolveDebt` — after forty sweeps a fifth of the defect is still on the grid; the trace
never touches the gate at any slider position; at four sweeps the wake stiffens and the
streaks stop mixing; at two hundred the frame rate halves and the trace is still above
the line. Lesson 01 said the divergence was gone; the trace says a fifth of it rides
into every next frame. Figure: `SolveDebt` REUSE. Knob: sweep budget. Math: ∇²p = ∇·u*
written as A p = b, 6,144 unknowns on the hero's channel; the meter is
‖b − A p‖ / ‖b‖, one pass over the grid, and it reads exactly 1 at p = 0 — this
formalizes the trace the reader just watched, which is that quotient per frame.
Savior: two hundred sweeps did not finish what forty started, so the leftover is not a
quantity, it is a kind, and the next figure separates the kinds.

**§2 — The shape of the leftover.**
Built: more sweeps. Failure: `SlowModes` — a three-cell ripple is gone in about a
dozen sweeps; a channel-wide bulge is 90% still there at six hundred. With the overlay,
the residual trace drops by roughly two orders of magnitude in those first dozen sweeps
(the ripple's eigenvalue is about 0.8, the bulge's about 0.004 on this grid) and then
flattens while the bulge is still on screen: the meter reads nearly done and the field
is mostly error. Figure: `SlowModes` OVERLAY — a third trace, ‖A e‖ relative to its
start, on the existing log axis; the stepper already holds the field, so this is a
few lines. Knob: ripple wavelength. Math, two lines, in this order: (a) a sweep moves
information one cell, so a mode L cells wide needs on the order of L² sweeps — the
reader checks 3 against a dozen and 96 against thousands; (b) r = b − A p = −A e, and
for a mode of wavelength L the Laplacian returns about (2π/L)² of it, so the meter
divides the error by L² — the roughest mode this grid holds is heard on the order of a
thousand times louder than the smoothest. This formalizes the residual trace the reader
just watched fall while the bulge stayed. Savior: the expensive error is the smooth
one, and a smooth field across 96 × 64 cells is described by far fewer than 6,144
numbers — few enough to guess.

**§3 — Paint the bulge.**
Built: the reader guesses the smooth part by hand on a 12 × 8 grid — drag a block up
or down — and the guess is stretched to 96 × 64 with the same bilinear prolongation
the network uses. Failure: the field-error meter falls as the reader paints and the
residual meter climbs past 1 before the field error is halved; the residual pane lights
along the coarse-grid lines. The meter scores the improving guess as worse than the
empty grid the reader started from. Figure: `PaintTheBulge` NEW — three panes (the
painted guess, prolonged; the residual field |b − A p₀| in violet; the converged field
as a gray ghost) and two meters. Cost: half a day — `prolong`, `relResidual`,
`FieldPainter`, and the CG reference exist in `net.ts`/`poisson.ts`/`figlib.ts`; new
work is the drag surface, a reset, and a check asserting the residual exceeds 1 at some
painted state. The field error at which the residual crosses 1 is measured at build,
not asserted here. Knob: none but the painting. Math: for p₀ = prolong(c), A p₀ is
zero inside each block and a spike along every coarse-grid line, so r = b − A p₀ is b
plus a lattice of spikes a cell or two wide — §2's L² applied at L ≈ 1. This
formalizes what the reader just did: every block set closer to the answer made the
seams sharper and the meter louder. Savior: a painted guess is two errors — the bulge
it got right, which the sweeps charge thousands for, and the seams it invented, which
they charge a dozen for — and the painter's only job is the first. The question is who
paints.

**§4 — The network paints.**
Built: the reader's hand replaced by 809 weights: average 8 × 8 blocks, three 3 × 3
convolutions on the 12 × 8 grid (a reach of seven coarse cells, most of the channel),
prolong. Three sentences on training, beside the figure: 240 divergence fields read
from `solver.div` after real timesteps, conjugate-gradient targets at 10⁻⁵, loss on the
field — on the field and not on the residual because of §2: a residual loss would spend
the weights chasing seams. What it fixes: `ProposalAnatomy` prints 11% of the field
missing and a residual of 2.27, both of which §3 predicted; the race averaged over
sixteen held-out fields goes 2330 → 840 sweeps; and inside lesson 01's own forty-sweep
budget the leftover drops from 0.235 to 0.045 (§1 paid). Failure: the case knob to the
airfoil, two discs, and the empty channel — field error triples (0.106 → 0.318), the
speedup falls to 1.6×. `ImpulseResponse`: poke one cell; the true response is a
symmetric well that slides with the poke; the network's is a blurred wake-shaped patch
with eight-cell seams, 40–45% wrong wherever the poke lands. It learned what pressure
around a wake in this channel looks like, not the operator, and that sentence predicts
the airfoil number. Figures: `ProposalAnatomy` REUSE (knob: case), `WarmStartRace`
REUSE (knob: case — the gate stays at 10⁻³ here), `ImpulseResponse` REUSE (knob: poke
position). Math: none new. Savior: the head start pays for the bulge and the bill is
still 840 sweeps, because the meter charges for the seams and then for the last three
decades of residual; the obvious economy is to stop paying the meter.

**§5 — Take the guess.**
Built: the proposal is the pressure field; no sweeps. (Tompson, Schlachter, Sprechmann
and Perlin's 2017 arrangement, named in this one sentence.) Failure: `UngatedRollout`
— from the same warmed-up flow, the ungated channel comes apart in about eight
timesteps, the divergence meter running 0.7 → 84 against a flat 0.42 in the gated
channel, and the wreckage is eight-cell blocks: §3's seams, injected as a velocity
error every step at the one wavelength the flow cannot dissipate. The slider finds the
edge between two and forty correction sweeps. Figure: `UngatedRollout` REUSE. Knob:
correction sweeps. Math: none. The meter as a tool, stated once as a black box in this
section's first paragraph: one pass over the grid; hears rough error at full volume and
smooth error at almost none. Savior: the meter cannot see what the guess got right; it
can see what the guess got wrong, and that is the half that wrecks a flow — so the meter
stays, not as the guess's grader but as the finish line.

**§6 — The gate.**
Built: the guess starts, the sweeps finish, the meter says when. Test: `SabotageGate`
— noise on all 809 weights, trained model at the left end, a random function of the
divergence at the right. The proposal's error climbs and keeps climbing; sweeps to the
gate climb past the cold-start line and keep going, so the accelerator becomes a
decelerator well before the slider ends; the accepted answer moves by at most 1.24% of
peak pressure at any noise level, and the worst is in the middle of the slider, not
the end. Figure: `SabotageGate` REUSE. Knob: weight noise. Math: both accepted fields
satisfy ‖b − A p‖ < ε‖b‖, so their difference d satisfies ‖A d‖ < 2ε‖b‖, and
‖d‖ < 2ε‖b‖ / λ_min up to the constant pressure is defined to — where λ_min is §2's
smoothest eigenvalue, the L² turned around. The gate bounds rough disagreement tightly
and smooth disagreement loosely, by the same factor that hid the guess. Measured: 0.24%
of peak at 10⁻³, 6% at 10⁻². This formalizes what the reader just did — dragged the
weights to noise and watched the agreement stay put; the inequality has no weights in
it. Savior: behind the gate the network cannot touch the answer, only the sweep
counter, and a sweep count is a ratio whose denominator this article has not yet named.

**§7 — The denominator.**
Built: the ratio 2.8× (3.4× on the hero's field), against Gauss–Seidel — the runner
slowest at the bulge. Prediction prompt, kept, because the common guess is wrong: cold
conjugate gradients against network-warmed sweeps, which crosses the gate first.
Result: `FourWays`, in passes over the grid because a conjugate-gradient step touches
each cell about three times — 2679, 792, 420, 378. Cold conjugate gradients beats the
warmed sweeps outright; the network is worth 3.4× against sweeps and 1.1× against
conjugate gradients, because conjugate gradients is already good at the bulge and there
is one bulge to remove. One sentence for the baseline not run: the classical name for a
coarse-grid guess is a coarse-grid correction, Brandt 1977; a multigrid solver does
what the network does with a ladder of grids and no training set, this article did
not build one, and the network is competing with it whether or not it says so.
Figure: `FourWays` REUSE with the `Predict` wrapper. Knob: none beyond the prediction
(one field, four counters). Math: a unit, not an equation — passes = sweeps for
Gauss–Seidel, ≈ 3 × iterations for conjugate gradients. Savior: that is every number
the opening frame prints except the ones it prints first.

**§8 — The opening frame, read.**
Built: the hero again, with a residual-versus-sweeps plot under it on a log axis, both
curves, the gate as a horizontal line. Before it runs, the reader can say: the warm
curve starts above the cold one (2.27 against 1.00 — the seams, §3); it drops below
within the first few dozen sweeps (a seam is an error a cell or two wide — §2's dozen);
from there the two curves have the same slope with the warm one a fixed distance ahead
(the slope is the bulge, and the warm start paid it before sweep one — §2 and §4); both
cross the line; the ratio of the crossings is the 2.8×; the accepted fields agree to
0.24% because 10⁻³ was the gate (§6); press the gate knob and the ratio moves — 8× at
10⁻², 2× at 10⁻⁴ — because the head start is a fixed distance and the finish line is
not (§7's arithmetic). Figure: `WarmStartRace` OVERLAY — the racers already compute a
residual per advance; the plot is on the order of forty lines in the stepper. The
crossing sweep is measured at build; the outline claims "within the first few dozen,"
not a number. Knob: gate. Math: none new; the check is that the reader could have
drawn the plot. Savior: none — this is where the article ends.

Waypoints: none. The only tool a later act consumes is the meter, and §5 states it as a
black box in its own first paragraph. Prediction prompts: one, §7. Figure count: nine
slots from seven components, one of them new.

### Debts

- Hero, top: the proposal scores above 2 and is nine tenths right. Paid §3 (the seams,
  by the reader's own hand) and §8 (the curves).
- Hero, top: the pane that starts from the guess wins anyway. Paid §4 (the race read
  with numbers) and §8 (the slope).
- Hero, top: the gate knob moves the ratio, unexplained. Paid §8 via §7's arithmetic.
- §1: forty sweeps leave a fifth; lesson 01 said gone. Paid §4 — inside the same forty
  the leftover drops from 0.235 to 0.045.
- §2: the meter divides by L². Paid §3 (the seams at L ≈ 1) and §6 (the gate's bound
  is loose by the same factor: 6% at 10⁻²).
- §3: the seams. Paid §5 (the wreckage is eight-cell blocks) and §8 (the crossing).
- §4: the airfoil is slower. Paid inside §4 by the impulse response — not carried.
- §6: the sweep count is a ratio with a denominator. Paid §7.
- §7: the baseline not run, Brandt 1977. Not paid; stated as the article's open cost in
  the ending, not left implicit.

### Math budget

In the order earned, each arriving after the reader has done the thing by hand:

1. §1. A p = b for ∇²p = ∇·u*; the meter ‖b − A p‖ / ‖b‖, one pass, equal to 1 at
   p = 0. After watching `SolveDebt`'s trace.
2. §2. Sweeps to erase a mode L cells wide grow like L². After watching a ripple and a
   bulge die at different rates.
3. §2. r = −A e; the Laplacian returns about (2π/L)² of a mode of wavelength L, so the
   meter divides by L². After watching the residual trace fall while the bulge stayed.
4. §3. A prolong(c) is spikes along the coarse-grid lines — equation 3 at L ≈ 1. After
   painting blocks and watching the meter rise.
5. §6. ‖A d‖ < 2ε‖b‖ ⇒ ‖d‖ < 2ε‖b‖ / λ_min: the gate's guarantee, loose by the same
   L². After dragging the weights to noise and watching the agreement hold.

§7 adds a unit conversion (passes versus iterations), not an equation. Four equations
and one restatement; nothing arrives before the reader has met it in a figure.

### Ending

What it lands, after §8's curves: the meter reads the error through the Laplacian, and
that one fact is both its blindness and its guarantee — it cannot see the nine tenths
the guess supplied because that part is smooth, and it cannot miss the seams the guess
invented because they are not, and the accepted answer's agreement is set by the gate
and the operator, not by anything the weights did. Neither property belongs to the
network. So a learned guess belongs in this solver at one of its four moves — the one
with a meter of this kind — and behind that meter, as a head start; it is worth 2.8×
against the runner worst at the bulge, 1.1× against a runner good at it, and an
unmeasured amount against multigrid, which does the same job without a training set and
which this article did not run. The last image is the sabotage slider at its right
end: 809 weights turned to noise, the sweep counter past cold, the accepted field moved
by a hundredth.

That cannot be moved onto a sibling by changing nouns: the L² asymmetry is a property
of this operator and this meter, and the 1.1× is a measurement on this grid. The
verdict chooses — behind the gate, with the denominator named — and admits the
baseline it owes.

### Cut list

- The Seam (L48–72): a timestep tour with no failure; the Poisson line moves to §1
  beside `SolveDebt`.
- Five Ways to Be Wrong (L102–121): an inventory; the article touches one row.
- Both waypoints (L123–127, L300–305): a schedule that L336 contradicts, and a moral.
- Where the Data Came From (L203–228): twenty-six figureless lines; three sentences
  beside `ProposalAnatomy` carry what the reader needs.
- The Map of the Machine (L381–416): a seven-row tour; a sibling article's spine.
- What Averaging Steals, A Correction That Cannot Cheat, The Solver in the Loss
  (L418–538): the second seam is its own article with its own hero — a training loss
  of 10⁻⁶ that detonates on rollout — and its own five sentences; grafted here it is
  sentence 4's "then we look at." This reverses the v2 expansion; the storyboard's map
  is two articles, not one act.
- The Rungs Below and the four-field table (L540–575): swappable nouns.
- Final Words as written (L617–636): lesson 01's ending skeleton.
- The amber/dashed legend paragraph (L33–36): the pane labels carry it.
- "the crime" (L28): lesson 01's device.
- The three headline ratios (64%, 3.4×, 2.8×): one ratio per figure, with its case and
  gate stated where it is used.
- The mid-article hero re-run with both knobs (L232): the knobs split — case in §4,
  gate at the top and in §8.
- "Here is something lesson 01 did not tell you" (L76): replaced by the true sentence.

## Part 3 — The intro

The last move in every timestep of lesson 01's solver is a linear system — on the
channel below, six thousand pressure values, one per cell, each tied to the cells
beside it, that together must cancel the divergence the rest of the step left behind.
The solver works through it by sweeping: set each cell to the mean of its neighbours
minus a quarter of the local defect, then repeat. It stops after forty sweeps. A
network with 809 weights, trained on that solver's own divergence fields and checked
into this repository, now proposes the pressure field before the first sweep.
The solver's only meter is the residual, one pass over the grid: an empty grid scores
1.00, lower is better, and the proposal scores above 2. The proposal is also
about nine tenths of the correct field, and sweeps that start from it cross the
residual gate in about a third of the sweeps that start from nothing.

Hero figure: `WarmStartRace` as built — one frozen held-out divergence field; two
solves to one gate, left from zero, right from the proposal; a sweep counter and a
residual meter under each; the proposal's field error and residual printed once at the
left — with a single knob, the gate: three buttons, 10⁻², 10⁻³, 10⁻⁴.

Audit, one line per sentence:

1. "The last move in every timestep…left behind." States: projection is the final
   stage of the step (`solver.ts` order), 96 × 64 = 6,144 unknowns on the hero's grid,
   five-point coupling, A p = b with b = ∇·u*. Rule 1: spends nothing — the leftover,
   its shape, the seams, the baseline all untouched. Rule 2: no schedule. Rule 3:
   subject is the solver. Rule 4: opens on a linear system in a running solver. Rule
   6: no imagining. Rule 8: "each tied to the cells beside it" holds at walls and
   solids, where "four neighbours" would not. Topic-swap breaks it; deleting it loses
   the object; a physicist's sentence; instantiates no house rule.
2. "The solver works through it by sweeping…repeat." States: the Gauss–Seidel update,
   mean of neighbours minus b/4 at unit spacing. Rules 1–4, 6, 8 pass; the method's
   name is withheld here and given once in §1, where lesson 01's "Jacobi" is corrected.
   Four tests pass: a mechanism, not a mood.
3. "It stops after forty sweeps." States: `PRESSURE_ITERS = 40`, no tolerance. Rule 1:
   does not say whether forty suffices — that is §1's beat. Rules 2–4, 6, 8 pass.
   Delete it and the reader does not know the budget is fixed.
4. "A network with 809 weights…before the first sweep." States: parameter count
   (`weights.ts`), data provenance (`cases.ts` reads `solver.div`), weights in the
   repo, one forward pass before sweep zero (`WarmStartRace`'s proposing phase). Rule
   1: architecture, loss, race all untouched. Rule 2: "now proposes" is present tense,
   not a schedule. Rule 3: the machine. Rules 4, 6, 8 pass. "Checked into this
   repository" is the flat IOU pinned to the hero, the one legal kind.
5. "The solver's only meter is the residual…scores above 2." States: no other
   convergence check exists in `project`; ‖b − A·0‖/‖b‖ = 1 by definition; the
   proposal's relative residual is 2.27 on the held-out average and 2.42 on the hero's
   case, so "above 2" survives both. Rule 1: says the number, not why. Rules 2–4, 6
   pass. Rule 8: "lower is better" makes the comparison's direction explicit.
   Undisputable only in the sense that it is measured; an expert can check it.
6. "The proposal is also about nine tenths…start from nothing." States: field error
   0.106 held out; sweeps 2330 → 840 (0.36) held out, 3.4× (0.29) on the hero's field
   — "about a third" covers both. Rule 1: the race's outcome is on screen within
   seconds and is not a later section's payoff; its explanation is. Rules 2–4, 6, 8
   pass. Topic-swap breaks it; delete it and the paradox has only two legs.

No sentence's content is an effect on the reader. No "imagine," no metaphor, no
aphorism, no fragment. Against the p-bits winner: no measured-familiar / inversion /
fragment-thesis shape — this one is three measurements that cannot all be true, in
the order the hero prints them. Against lesson 01: no "below this paragraph."
