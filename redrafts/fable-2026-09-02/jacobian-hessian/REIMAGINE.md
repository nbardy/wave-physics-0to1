# The Jacobian and the Hessian — reimagined, 2026-09-02

Source read: `src/lessons/maths-01-jacobian-hessian.mdx` (415 lines, status draft),
its sims under `src/sims/maths/`, and `articles/maths/01-jacobian-hessian/`
(DENSE_CORE, PLAN, HANDOFF, STORY_CANDIDATES) plus `articles/CONCEPT_BANK.md`.
Line numbers below are the MDX's. Numbers quoted about the new spine were
computed on the article's own closed-form maps (`lib.ts` swirl, fold, landscape)
in `scratchpad/newton_check.ts` and `walkers_check.ts`; the builder should rerun
them before trusting any figure caption derived from them.

## Part 1 — The read

### Ana

Writes motion-planning code for a warehouse robot arm. Calls a function named
`jacobian()` several times a week and inverts what it returns; has never drawn
one. Read lesson 01 on this site last month and dragged everything in it.
Tuesday evening, laptop.

L9. The title. She expects a box of partials and then pictures of it. What she
wants is to see the thing her code inverts.

L11–14. "a plane has been stirred" — by nothing named. "The ring is a loupe" —
she reads it as the figure's instructions and drags the ring. A slider.

L18–25. "Push the slider all the way toward *close*" — she does. The swerving
goes; a lattice of parallelograms stands there, a different one at each spot.
She has the picture. "The stirring never manages to be complicated up close" —
she reads it twice; it says what the lattice already shows, with approval added.
"I re-ink it to match each magnification" — so the amber square is not the
square inked before the stirring, which is what the sentence before said it was.
She accepts the fudge and files the retraction.

L27–32. "Four numbers pin it down completely" — she predicts the four numbers
will be shown. "That little box of four is the Jacobian" — the question she came
with is answered in the third paragraph, by assertion: it is the lattice. Then
the Hessian, "which never needs a theory of its own because it is this same
picture, aimed at a different target." She now holds the plan of the article.
What she does not hold is a reason to want the four numbers; nothing on the page
has asked for them.

L34–58. A curve and a slope meter. She knows this — the tangent line, week one.
"the whole of first-year calculus, run backwards" — backwards from what? She
does not stop. The meter converges; she predicted it would. The one-dimensional
formula, known. L56–58 returns her to the plane with "four degrees of freedom,
not one," which she had at L27.

L60–74. The four-dimensional graph. She nods; nothing on the page moves. "That
is what the opening figure has been showing all along" — she knew.

L76–93. The stamp "finally gets its name" — it was named in the markup at L22.
Three meters, ×1.00 ×1.00 ×1.00; three shapes, a square, a lozenge, a bent rag.
She likes the frame — one number, three shapes — and would show it to someone.
She also sees that nobody asked for an area meter; the article built one in
order to knock it down. "We want the which-way." She does too.

L97–112. Arrows, ghosts, a selector. She switches to *rotate 30°* and checks the
box: 0.87, 0.50, −0.50, 0.87. Correct. *Shear* moves one arrow. This is the part
she will retell: the columns are where east and north landed. She had never read
a Jacobian as two landings.

L114–144. The box of partials arrives as the filing of those landings. "this is
the fact the standard treatments state last, if at all" — the author grading
textbooks; she skips it. "a rotation is already linear, so the zoom has nothing
left to discard" — she keeps that.

L146–165. "The first debt from the top of the article comes due" — a ledger
voice; she skims to the formula. "a swirl only rotates each ring of the plane,
and rotations spend no area" — now she knows why the three meters agreed.

L167–182. The predict. She guesses *negative*; she has met signed areas in
shoelace code. The needle, the mirrored stamp, the dot on the wrong side — she
will retell this one too. "The negative sign is not bookkeeping; it is the
picture of the plane locally turned over." Fine.

L184–196. Polar coordinates. She knows r dr dθ; the tie is neat; nothing on the
page needed an integral. Her attention drops for the first time.

L198–203. The waypoint. "prophesies." She skips it.

L205–225. "The object below looks like a change of subject and is not." She was
about to think that, and now she does. The landscape, the pink arrow, the
ghosts, the blue and green segments. She drags across the basin; the segments
swing. "four numbers — the same filing as ever." She sees it.

L227–241. "the Jacobian of the gradient — is the Hessian." This is the line she
keeps. She checks the off-diagonals in the meter: equal.

L243–261. "A hiker at a summit and a hiker at a pass would object." She feels
the elbow. "zoom again and listen to the second" — listen. "I draw the contour
lines from the true landscape, never from the quadratic … not an installation" —
she had not suspected the figure until it defended itself.

L263–269. The predict tells her the pit and peak show rings and asks about the
pass, with option b written out in full. She picks b because it is the one with
the picture in it.

L271–301. Rings, a crossing, the violet axes; (+2.0, +0.9), (−2.0, −0.9), one of
each. "usually taught as an incantation" — it was, and she prefers this. "det H =
λ₁λ₂, the area receipt of the gradient map" — she keeps this: one determinant
catches folds and saddles. L297–301, the tilt warning, is told rather than
shown; she believes it because she has debugged it.

L303–341. "Everything so far has been anatomy." She agrees. Two walkers: pink
zig-zags, violet lands in one step. Narrowness up, pink worsens; boldness up,
pink leaves the map. This is what she came for, at line 318 of 415. "Honesty
about the arena" — the author's word for himself.

L343–349. The second waypoint. Skipped.

L351–373. "take the vortex from the first lesson's fluid" — she read lesson 01;
she remembers the vortex dying in honey. This one does not die. ×1.000 forever:
she likes it. "Every simulation on this site drags these boxes along invisibly" —
she cannot check it from here.

L396–415. "The settling is the part that deserves astonishment." She is told what
to feel. "Smooth ones surrender." "You have been collecting on that bet since
your first derivative. Now you have seen what pays it." She closes the tab on a
compliment.

Tomorrow she retells three facts: columns are landings; the Hessian is the
Jacobian of the gradient; a negative determinant is a mirrored stamp. Asked what
happened in the article, she has no answer, because nothing did.

### Hugh

Has read every Ciechanowski post, and 3Blue1Brown's linear-algebra series twice;
worked through the first two chapters of Spivak's *Calculus on Manifolds* one
winter. Reads with the repo's code open in another tab. Notices when a sentence
is doing something to him.

L11–14. "has been stirred" — by nothing named. The warped grid is the picture
from *Essence of Linear Algebra*, chapter three, with a loupe added. He gives
the loupe credit and waits to see what it buys.

L18–25. The lattice under the loupe: he checks it at four places; it holds. "The
stirring never manages to be complicated up close" — the sentence is admiring the
lattice on his behalf. The re-inked stamp: the second sentence about it retracts
the first. He would have taken "the amber square is drawn at the loupe's scale
each time."

L27–32. "Two debts hide inside it" — a table of contents wearing a cloak. The
article has named its second object and its ending in paragraph three. Nothing
is left to be surprised by, only things left to be shown.

L36–37. "the whole of first-year calculus, run backwards" — cannot be argued
with, so it says nothing.

L42–46. The meter is "rise over run between the two visible ends of the curve" —
a symmetric secant. "*Differentiable at a point* means exactly this and nothing
more" — no. |x| at zero: the two visible ends sit at equal heights, the meter
reads 0 at every magnification and converges, and the function has no derivative
there. The meter's convergence is not the definition. He writes it in the margin
and reads on with less credit extended.

L70–71. "no amount of cleverness fits four dimensions on a screen" — the two
panes above are doing it.

L76–93. He watches the trap being built: a map chosen to preserve area, a meter
that measures area, then "it is blind." He did not have the instinct the article
assigns him. "A number cannot say *which way*. We want the which-way." — three
beats of theatre where one fact would do.

L106–112. The landing report. He switches presets and checks the cosines;
correct. Columns as landings: he knew it, and this is the cleanest rendering of
it he has seen. He grants the section.

L128–129. "this is the fact the standard treatments state last, if at all" —
L384–386 of the same article says Spivak states it in the first forty pages. The
article disagrees with itself about the textbooks it is grading.

L148. "The first debt from the top of the article comes due." The article is
reading its own ledger aloud.

L160–162. "a swirl only rotates each ring of the plane, and rotations spend no
area; det J = 1 there identically" — he checks `lib.ts`: rotation by an angle
that depends only on radius. Exact. Good.

L175–182. The needle and the mirror: he grants the figure. "no formula recovers
information that was never delivered" — an aphorism that arrives before the
section is over.

L184. "a small scandal from integration" — scandal is a mood.

L198–203. "prophesies where the map can be undone" — det J ≠ 0 gives an inverse
near the point, not "where the map can be undone"; z ↦ z² has det J ≠ 0 at every
point off the origin and no inverse. He notes the inflation.

L207. "looks like a change of subject and is not." The hand on his back.

L227–241. H as the Jacobian of ∇f; symmetry from equal mixed partials. He checks
the meter's off-diagonals: equal to the last digit. Fine.

L249–251. "A hiker at a summit and a hiker at a pass would object." "listen to
the second." He is being warmed up for a formula.

L259–261. The second "I" confession about the drawing. He counts two and starts
expecting the third.

L263–266. A predict whose question contains "that much follows from bowls being
bowls" — the quiz tells him the half it is not asking about, and the option with
the figure in it is the answer.

L274–275. "Rings and crossings are the only two smooth options" — false without
det H ≠ 0: a trough gives parallel lines, a monkey saddle three lines through
the point. The sentence needed one clause and traded it for rhythm.

L289. "usually taught as an incantation" — the article's opinion of other
teachers, again.

L305. "Everything so far has been anatomy." He agrees. It is line 305.

L307. "the daily bread of optimization" — placeholder.

L311. "tilted 25°" — `NewtonRace.tsx` line 24: RHO = 30°. The one number the
article states about its finale figure is wrong.

L320–334. The zig-zag and the one-step landing: correct, and "steep because far
from the bottom" versus "steep because the valley is narrow" is the right
diagnosis. He grants it.

L336–341. "Honesty about the arena" — the article naming its own virtue.

L353–356. "take the vortex from the first lesson's fluid" — he opens lesson 01:
`VortexDecay` is a Lamb–Oseen-shaped vortex, tangential speed (1 − e^{−r²})/r,
whose far field keeps turning and which decays while you watch. The swirl here
turns each ring by k·e^{−r²/σ²}, dies as a Gaussian, and never decays. A
different vortex. L361–362, "winds tighter and tighter … without rest" —
`WarpLoupe.tsx` line 129 ping-pongs the clock; the grid unwinds every six seconds
on his screen. He stops extending credit here.

L369–373. "The solver's advection step asks where a parcel came from — a question
about undoing a flow map, legal only while det J ≠ 0" — the semi-Lagrangian
back-trace steps backward along the velocity and inverts nothing. "The pressure
projection is the machine that polices det J = 1" — it enforces ∇·u = 0 on a
velocity field each step; the flow map's determinant drifts with the advection
error and nothing polices it.

L398–415. "The settling is the part that deserves astonishment." "Smooth ones
surrender." "every use anyone has ever made of these two boxes is a bet" —
universals for cadence. "Now you have seen what pays it." He was not asked to
bet.

What he retells: |x| beats the meter; 25° is 30°; the vortex is not lesson 01's.
What he would have retold if the article had let him: columns are landings, and
one determinant catches both folds and saddles.

### STORY

The five sentences the current article implies:

1. A grid that has been stirred becomes a lattice of parallelograms under a
   loupe at every point — and the next paragraph names the four numbers and the
   second matrix, so nothing stays unexplained and nothing on the page wants
   them.
2. Then we look at the one-dimensional zoom.
3. A one-number area meter reads ×1.00 on three differently shaped stamps, so
   the two arrows' landings are filed instead: the Jacobian — the failure of an
   instrument the article built, on a map chosen to fail it.
4. Then we look at the determinant, a fold, and polar coordinates; then we look
   at a landscape whose gradient is a map and so has a Jacobian, called the
   Hessian.
5. Where the arrow dies the linear stand-in is blank, so the quadratic one is
   read off two signed curvatures; then we look at two walkers, of which the one
   holding H⁻¹ lands in one step; then we look at the swirl as a flow map with
   det J = 1.

Three of the five begin "then we look at." Two failures exist — the blind meter
and the blank linear stand-in. The first is staged; the second is felt only by a
walker who does not appear for four more sections.

Hero: an unnamed closed-form swirl of a grid, with a loupe. Familiarity cost:
high. The warped grid is the standard picture of a linear map in every explainer
since 3Blue1Brown, and the article concedes the lineage at L380–382; the loupe is
the one new element, and it is an instrument, not a thing that does anything.
Desire: none — no task on the page needs the four numbers until L318.

Specimen: the swirl serves the object — its own physics takes twenty words — but
it is inert. Nothing happens to it, nothing is asked of it, and its return as "a
fluid all along" pays a debt nobody was holding. A specimen the object is never
used on is a backdrop, not a lens.

Biggest flaw, one sentence: nothing on the page needs either matrix until the
eighth of nine sections — the article says so itself at L305 — so what precedes
is a definition unfolded, section by section, with no failure driving any of it.

### PROSE

1. L21–22 "The stirring never manages to be complicated up close." —
   performance: approval added to a fact the figure already shows.
2. L29–32 "Two debts hide inside it: the area of the parallelogram, and an
   entire second matrix wearing the first one's structure — the Hessian, which
   never needs a theory of its own because it is this same picture, aimed at a
   different target." — verdict spent early: the ending's reveal in paragraph
   three, as a table of contents.
3. L36–37 "The zoom is not a new instrument. It is the whole of first-year
   calculus, run backwards." — disputability: no expert can argue with it, so
   it states nothing.
4. L45–46 "*Differentiable at a point* means exactly this and nothing more" —
   disputability: false for the meter as built; |x| at 0 passes it.
5. L91–93 "The scale-factor meter is not wrong; it is blind. … A number cannot
   say *which way*. We want the which-way." — performance: a staged verdict on
   an instrument the article built to fail.
6. L128–129 "this is the fact the standard treatments state last, if at all" —
   disputability: contradicted by the article's own L384–386.
7. L148 "The first debt from the top of the article comes due" — verdict
   narration: the sentence's subject is the article's ledger.
8. L179–180 "The negative sign is not bookkeeping; it is the picture of the
   plane locally turned over." with L300–301 "The mixed term is not
   bookkeeping; it is the freedom to tilt." — repetition: one device, twice.
9. L207 "The object below looks like a change of subject and is not." —
   performance: the article pre-empting the reader; its subject is the article.
10. L249–251 "A hiker at a summit and a hiker at a pass would object. When the
    first-order term goes silent, zoom again and listen to the second:" —
    performance: a staged objection and a stage direction.
11. L274–275 "Rings and crossings are the only two smooth options" —
    disputability: false where det H = 0 (troughs, monkey saddles).
12. L305 "Everything so far has been anatomy." — verdict: the article confessing
    seven sections without drive; subject is the article.
13. L311 "tilted 25°" — disputability: the figure's bowl is rotated 30°
    (`NewtonRace.tsx`, RHO).
14. L407 "The settling is the part that deserves astonishment." — performance:
    instructs the feeling instead of stating the fact.
15. L414–415 "You have been collecting on that bet since your first derivative.
    Now you have seen what pays it." — performance: awards the reader; trailer
    register.

## Part 2 — The new outline

This replaces the spine, not the figure set. Per HANDOFF's process rule, the
hero paragraph and this ladder go to Nick as a labeled checkpoint before any
build: *this re-hinges the article — confirm.*

### Hero

The un-stirrer. Two panes. Left: the plane before stirring, a plain grid, with
an amber marker. Right: the same plane after stirring — each ring about the
center turned by an angle that dies off with radius — with a red target the
reader places and the amber marker's image. A machine hops: from the marker's
current position it moves the marker on the left pane, draws the hop as a
segment, and draws where the moved marker's image lands on the right; it stops
when the image sits on the target. Under the panes: a hop counter, a miss meter
printing the image's distance from the target after each hop to six figures, and
a violet meter that reads 1.000 and never changes. One knob: the stirring
strength, 0 to 4 (the swirl's k), default 1.5.

What the figure does at the top, visible and unexplained: at the default
stirring, no target on the pane needs more than six hops, most need four, and
the miss falls under a millionth of a grid cell (measured: 729 targets on a
0.1 grid, k = 1.5, zero failures, max six hops). A marker started at the
target's own coordinates does not walk toward the target; it hops in a direction
the reader cannot predict and lands closer. Past k ≈ 2.2 a ring of targets near
the center sends the marker wandering — twenty hops, or off the pane (measured:
12 of 729 fail at k = 2.2, 116 at k = 3, 284 at k = 4). The frozen violet meter
is the third thing to explain.

Returns at the end understood: the same figure with the loupe's lattice drawn at
the marker before each hop, the landing report filed beside it, the violet meter
labeled as the landed parallelogram's area, and the miss meter's digits doubling
hop over hop. The wandering is explained as hops that trusted the lattice past
the loupe; the frozen meter as the reason a stirred plane never folds.

Familiarity cost, stated: the stirred grid is the most familiar image in
linear-algebra pedagogy, and that cost is paid in full — the grid is the stage,
not the show. What nobody has seen is a marker being hunted backwards through a
stirring by a machine with its hop count on a meter. If the grid alone is judged
to sink the hero, the fallback is a stirred field of dots at random positions
(no lattice visible until the loupe draws one), which costs the plant of §2 its
before-image; the grid is recommended.

Solver sentence beside the figure: the stirring is closed-form — rotation of each
ring by k·e^{−r²/σ²}, the flow map of a steady vortex with that angular-velocity
profile — with exact Jacobian and exact inverse; the machine's hop is a 2×2
solve; nothing on the page is integrated. It is not lesson 01's vortex and the
article does not say it is.

### Thesis

The Jacobian is what the stirring does to a small step, the Hessian is what the
downhill arrows do to a small step, and one machine reaches the origin of any
stirred point or the bottom of any valley by reading those four numbers at each
hop and nothing else.

### The five sentences

1. A machine started at a target's own coordinates on a stirred plane finds the
   point the target came from in four or five hops for any target, in directions
   the reader cannot predict; stirred harder, it wanders from targets near the
   center; and a violet meter under it never leaves 1.000.
2. The obvious mechanism — move the marker by the miss, as if the plane were not
   stirred — fails: near the center each step's image lands sideways from where
   it was aimed and the image orbits the target without closing, because the
   stirring turns steps.
3. Measuring what the stirring does to a small step at the marker — zoom until
   the swerve drains and a lattice stands, file where east and north land, the
   Jacobian — fixes it: the miss counted in landed-lattice cells is the hop, and
   the miss after each hop shrinks by squares; but the counting divides by the
   landed parallelogram's area, and on a map that folds the area passes through
   zero: the hop blows up on the crease and beyond it a target has two origins.
4. Aiming the same machine at the point where a valley's downhill arrow dies
   fixes the zig-zag of the walker who follows the arrow, once the arrows' own
   landing report — the Hessian — is filed; but the machine stops at any dead
   arrow, pass or peak as readily as basin, and only the two signed curvatures
   along the report's tilted axes say which it has reached.
5. The hero's hop count and its wandering are predicted: each hop is exact for
   the lattice, the leftover miss is the bend the lattice threw away applied to
   the old miss twice — digits doubling in the meter — and a hop that lands
   outside the loupe's reach trusted a lattice that was not there; the frozen
   meter is a stirring that spends no area, on which the machine can lose its
   way but never its parallelogram.

### Section ladder

**§1 The miss step**
Naive thing built: a walker that measures the miss (target minus image) on the
stirred plane and moves the marker by that vector on the unstirred plane, as if
the stirring were nothing. Visible failure: at mild stirring it lands in about
six steps; at the default, targets near the center make its image swing sideways
from every step and orbit the target (measured at k = 2.2: 168 of 729 targets
never land; the rest average thirty-three steps; one printed image sequence for
target (0.3, 0.1) circles it at radius ~0.4). The reader sees the step taken
straight on the left and its image veering on the right. Savior: the step's image
veered because the stirring turns steps — what the stirring does to a small step
at the marker is the thing to measure.
Figures: OVERLAY on the hero (`Unstir` with the hopping machine hidden and the
gray miss-walker shown; same target, same knob). Knob: stirring strength.
Math moment: none.

**§2 The lattice**
Naive thing built: the one-number repair — the stirring turns steps, so turn the
miss back by the ring's angle before stepping. The loupe at the marker: zoom until
the swerve drains; a lattice of parallelograms. Visible failure: at mid radius
the lattice is not a turned square; the two landed arrows have different lengths
and are not perpendicular, and the preset selector shows why one angle cannot
file it — *rotate 30°* lands a turned square, *shear* moves only one arrow, the
swirl does both and differently at each radius. Savior: the miss lives on the
stirred plane and the step on the unstirred one; the two landings are the
dictionary between them, and reading it backwards is the hop.
Figures: REUSE `WarpLoupe mode="plant"` (loupe anchored at the §1 marker's
position; zoom knob) → REUSE `WarpLoupe mode="arrows"` (default preset swirl,
not shear; selector as the knob). One delta between them: the two arrows.
Math moment: F(p + h) ≈ F(p) + J h, J's columns as the two landings, the four
partials named as the filing of what the reader just read off the box while
switching presets. The one-dimensional f(a + h) ≈ f(a) + f′(a) h is one clause
of known ground, not a figure.

**§3 The hop**
Naive thing built: the hop by hand. Inside the loupe the miss is drawn from the
marker's image to the target over the landed lattice; the reader counts the miss
in landed cells — so many east-landings, so many north-landings — and those two
counts, taken in plain cells on the unstirred plane, are the hop. Two violet
numbers print the counts. Then the machine does the same count on a clock: hop,
re-zoom, count, hop; the miss meter prints the miss after each. Visible: for a
mid-radius target at k = 2.2 the meter reads 4.6e−1, 3.1e−1, 3.9e−2, 3.2e−3,
4.3e−6, 4.7e−11 — once the marker is inside the loupe's range, the number of
correct digits doubles per hop. The hero's hop count is now the reader's. Visible
failure driving on: back the zoom off and the counting lattice stops matching the
grid it is drawn over — the count is exact for the lattice and the lattice is
only there under the loupe (the plant that pays the wandering in §9); and the
counts are a division by the parallelogram — the presets never flatten it, but a
map exists on which it flattens.
Figures: OVERLAY on `WarpLoupe mode="arrows"` (the target and miss vector drawn
in the loupe pane, the counted hop on the left pane, the two counts as meters;
knob: zoom) → REUSE the hero `Unstir` with the miss meter read hop by hop.
Math moment: J h = m, h = J⁻¹ m; the hop p ← p − J⁻¹(F(p) − q). Formalizes the
cell count the reader just did.

**§4 The fold**
Naive thing built: the machine as it stands, on a map that folds the plane like
paper pushed from both ends. Visible failure: as the fold slider advances, the
stamp at the crease thins to a needle and the machine's hop from a target near
the crease shoots off the pane — the count divided by an area near zero; past
the fold, a target inside the crease band has three origins, the machine returns
whichever its start was nearest, and at one of them the stamp lands mirrored,
dot on the wrong side. Prediction prompt (common guess wrong): as the fold passes
through the stamp, the area meter stops at zero / goes negative. Savior: the
swirl never does this — every ring is turned and no area is spent, det J = 1 at
every point, which is the frozen violet meter — so on a stirred plane the machine
always has a hop; the next task has no target to aim at.
Figures: OVERLAY on `DetFold` (the machine's hops and a placeable target added to
the fold map, area meter and dotted stamp kept; knob: fold).
Math moment: det J = f₁ₓ f₂ᵧ − f₁ᵧ f₂ₓ as the landed parallelogram's signed
area; the hop exists iff det J ≠ 0; negative is mirrored. Formalizes the meter
the reader just watched cross zero. No change-of-variables integral.

Waypoint (the only one; the next act consumes the machine as a black box): the
machine takes a map and a target and returns an origin. At each hop it reads the
two landings at the marker, counts the miss in those landings, and steps by the
counts; it has a hop wherever the landings span a parallelogram with area.

**§5 The valley**
Naive thing built: the arrow-following walker — measure the downhill arrow, step
against it. Visible failure: on a narrow tilted bowl the walker zig-zags across
the valley and crawls along it; turn narrowness past the tipping point and each
overshoot exceeds the last until it leaves the map. Savior: the arrow alone
cannot tell far-from-the-bottom from narrow; but the bottom is the one point
where the arrow dies, and a dead arrow is a target — arrow(p) = 0 is an
un-stirring problem, and the machine can hunt it once it has the arrows' landing
report: what happens to the arrow when the marker steps east, and when it steps
north.
Figures: OVERLAY on `NewtonRace` (pink walker only; boldness fixed just under the
default valley's tipping value; knob: narrowness, which crosses the tipping point
since GD tips at η > 2/κ).
Math moment: none new; ∇f as the arrow, stated.

**§6 The arrow map**
Naive thing built: the report by hand — the reader steps the probe east and
watches the arrow change, steps north and watches it change; the two changes,
filed at per-step rate, are the four numbers. Visible: the meter's off-diagonals
agree to the last digit at every probe point (measured by centered differences of
the drawn gradient; exact on this cubic landscape). Then the machine runs on the
bowl with that report: one hop to the bottom, at any narrowness — the arrows of a
quadratic are a linear map, so the lattice is exact everywhere and the loupe
never has to shrink. Visible failure driving on: the bowl has one dead arrow; the
landscape from the arrow figure has four.
Figures: REUSE `GradField` (probe drag) → REUSE `NewtonRace` (both walkers; knob:
narrowness).
Math moment: H = the Jacobian of ∇f, the four second partials, symmetric in one
honest sentence (equal mixed partials, no proof); the hop p ← p − H⁻¹∇f, exact on
a quadratic. Formalizes the east/north stepping the reader just did on the
arrows, and the count from §3 aimed at zero.

**§7 The pass**
Naive thing built: the machine turned loose on the four-critical-point landscape
from a draggable start, beside the arrow-follower from the same start.
Prediction prompt (common guess wrong): from a start in the pass's quadrant, the
hopping machine stops at the basin / at the pass. Visible failure: it stops at
the pass, satisfied — the arrow is dead there too — while the pink walker from
the same start reaches the basin (measured on `landF`: from internal (0.6, −0.4)
Newton reaches the pass in six hops, gradient descent the pit; from (−0.5, 0.8)
Newton reaches the other pass). Repair: the second zoom. At each dead point the
contours under magnification: rings at basin and summit, a crossing at the pass;
the violet axes and two signed curvatures, (+2.0, +0.9), (−2.0, −0.9), (+2.0,
−0.9); the machine's check is the two signs — both positive and the stand-in was
a bowl; otherwise the hop was toward a pass or a summit. det H = λ₁λ₂ < 0 flags
the pass: the area receipt from §4, filed on the arrow map. Visible failure
driving on: the axes the curvatures live along are tilted 25° off the grid, and
the tilt is not in the two diagonal numbers.
Figures: NEW `PassTrap` — the `lib.ts` landscape with contours (marching dots as
in `CriticalZoom`), a draggable start, violet hops and pink steps on a fixed
clock, and a label naming where each stopped; cost about a day, since landscape,
gradient, Hessian, contouring, and both walkers already exist. Then REUSE
`CriticalZoom` (selector basin/summit/pass; zoom).
Math moment: f(c + h) ≈ f(c) + ½ hᵀH h; H v = λ v read as "along v the
landscape is a parabola with curvature λ"; det H = λ₁λ₂. Formalizes reading the
signs the reader just used to tell the pass from the basin. Boundary check: H =
0 leaves the linear story.

**§8 The tilt**
Naive thing built: a cheaper machine that reads only the two diagonal numbers of
the report. Visible failure: with the valley square to the grid it lands in one
hop like the full machine; turn the valley to 30° and it zig-zags along the
tilted floor for forty-five steps (measured: κ = 12, tilt 30°, 45 steps to
1e−4; tilt 0°, one step) while the full machine is indifferent to the knob. The
off-diagonal entries are the tilt; at zero tilt they are zero. Savior into the
return: the machine reads four numbers at every hop and never fewer, and the
hero's hops are those reads.
Figures: OVERLAY on `NewtonRace` (third walker using diag(H) only; pink hidden;
κ = 12 and boldness 1 fixed; knob: the valley's tilt angle, 0° to 45° — RHO
becomes a parameter; cost hours).
Math moment: none new.

**§9 The hop count** (return)
The hero again with its overlays: the loupe's lattice at the marker before each
hop, the report beside it, the violet meter labeled area ×1.000, the miss meter.
What is read off: (a) the digits double because the hop is exact for the lattice
and the leftover is the bend the lattice threw away — the second derivatives of
the stirring — applied to the old miss twice; (b) the wandering at strong
stirring: the first hop from a core target lands where the ring's angle differs
by more than a radian, so the next count is taken on a lattice that has nothing
to do with the target's; real un-stirrers shorten any hop that increases the
miss, one sentence; (c) the frozen meter: a stirring by a fluid turns rings and
spends no area, det J = 1 at every point, so the machine on a stirred plane
always has a parallelogram to count in — it can lose its way, never its hop.
Figures: OVERLAY on the hero `Unstir` (lattice, report, labeled meters; knob:
stirring strength).
Math moment: e_{k+1} ≈ ½ J⁻¹ F″(e_k, e_k), stated beside the meter as the
doubling the reader just watched; F″ named as the stirring's own second
derivatives — each output coordinate has a Hessian — so the second box is the
first box's error term.

Further Reading: Sanderson (columns as landings, global), Spivak (the derivative
as the linear map, the matrix as its filing), Boyd–Vandenberghe chapter 9
(the zig-zag bounds and Newton's indifference to tilt, with proofs). Final
Words: short, on the two boxes as the first two things a loupe finds at a point.

### Debts

- Hero: the hop count (four or five) → paid §3 (the count is the hop; digits
  double) and §9 (the doubling's reason).
- Hero: the wandering at strong stirring → paid §9 (hops past the loupe).
- Hero: the violet meter frozen at 1.000 → paid §4 (a turned ring spends no
  area) and §9 (why the machine never meets a fold on a stirred plane).
- §2: the stamp's corner dot → paid §4 (mirrored).
- §3: the counting lattice stops matching when the zoom backs off → paid §9.
- §4: det J as the area receipt → paid §7 (det H < 0 flags the pass).
- §5: "the arrow alone cannot tell far from narrow" → paid §6 (H is the record
  of how the arrow changes; one hop on the bowl).
- §6: H symmetric → paid §7 (perpendicular axes, real curvatures).
- §7: the axes are tilted → paid §8 (the off-diagonals are the tilt).

### Math budget

1. F(p + h) ≈ F(p) + J h, columns as landings, partials as filing (§2); the
   one-dimensional line as one clause.
2. J h = m ⇒ h = J⁻¹ m; the hop p ← p − J⁻¹(F(p) − q) (§3).
3. det J, signed area; hop exists iff det J ≠ 0 (§4).
4. H = J of ∇f, symmetric (§6).
5. p ← p − H⁻¹ ∇f, exact on a quadratic (§6).
6. f(c + h) ≈ f(c) + ½ hᵀH h; H v = λ v; det H = λ₁λ₂ (§7).
7. e_{k+1} ≈ ½ J⁻¹ F″(e_k, e_k) — the doubling (§9).

Cut from the budget: |det J| in change of variables and the polar map.

### Ending

The miss meter. For a mid-radius target at the default stirring it reads 4.6e−1,
3.1e−1, 3.9e−2, 3.2e−3, 4.3e−6, 4.7e−11: two hops to get inside the loupe,
then the correct digits go 2, 4, 8 and the next hop is machine precision. The
reason is the article's own: the hop is exact for the lattice, and what the
lattice leaves out is the bend — the stirring's second derivatives — applied to
the old miss twice, so the new miss is the old miss squared, scaled by bend over
lattice. The Hessian of each output coordinate of the stirring is the Jacobian's
own error term; the two boxes are the first two things a loupe finds at a point,
and the machine lives on the first while the second sets its speed. The frozen
meter closes the other debt: a stirring by a fluid turns rings and spends no
area, so det J = 1 at every point of every stirred plane, and the un-stirrer can
lose its way by hopping past the loupe but never loses its parallelogram. Change
the nouns and this ending is about no other article on the site.

### Cut list

- "One Number Was Enough" and `ZoomLine`: a recap the reader owns, with no
  failure driving into it; the one-dimensional line becomes one clause in §2.
- "Maps, Not Graphs": representation talk; the two panes teach the
  representation by being used.
- `WarpStamp` and its three ×1.00 meters: an instrument built to fail on a map
  chosen to fail it; the naive mechanism is now a step the reader would take.
- Polar coordinates and the change-of-variables integral: a payoff belonging to
  a different article; nothing here integrates.
- The second Waypoint (L343–349): recap.
- The `CriticalZoom` predict as worded: it answers itself; replaced by the pass
  prompt, whose common guess is wrong.
- "take the vortex from the first lesson's fluid": false in detail (Lamb–Oseen
  tail versus Gaussian swirl; decay versus none); replaced by the solver sentence.
- The return figure's ping-pong clock with prose that says "winds without rest":
  the return now shows the machine, not a flowing clock.
- "Every simulation on this site drags these boxes along invisibly" and the
  advection/projection claims: not checkable on the page and wrong in detail.
- "Everything so far has been anatomy": nothing precedes the machine now.
- "A hiker … would object," "listen to the second," "small scandal,"
  "prophesies," both "not bookkeeping; it is" sentences, "the fact the standard
  treatments state last," "usually taught as an incantation": performance or
  opinion about other authors.
- Final Words' "deserves astonishment," "surrender," and the bet: the ending is
  the meter.
- "tilted 25°": the figure is 30°; the new §8 puts the tilt on the knob.

## Part 3 — The intro

The plane on the right has been stirred: every ring around the center was turned
by an angle that dies off with radius, so the grid that is straight on the left
is wound on the right, and each point on the right came from exactly one point on
the left. A red target sits on the stirred plane. The machine's job is to find
the point it came from. It starts an amber marker at the target's own coordinates
on the unstirred plane, as if nothing had been stirred, and hops; after each hop
the marker's image on the stirred plane is drawn, and the meter prints the
image's distance from the target. At the stirring below, no target on the pane
needs more than six hops to bring that distance under a millionth of a grid
cell, and most need four. Past the middle of the knob's range, targets near the
center send the marker wandering — twenty hops, or off the pane. The violet
meter under the figure reads 1.000 and does not change.

Hero figure: `Unstir` (NEW) — left pane the unstirred grid with the amber marker
and its hops as segments; right pane the stirred grid with the red target
(placed by click or drag) and the marker's image after each hop; under them a
hop counter, the miss meter to six figures, and the violet meter labeled area
×1.000. One knob: the stirring strength, 0 to 4, default 1.5.

Audit, one line per sentence:

1. "The plane on the right has been stirred … exactly one point on the left." —
   States: the map is a rotation of each ring by an angle Gaussian in radius
   (circles stay circles on screen), and it is one-to-one. Rule 1: spends
   neither the lattice nor det J = 1. Rule 2: no schedule. Rule 3: about the
   object. Rule 4: opens on a grid and a ring. Rule 6: no imagination asked.
   Rule 8: a rotation per ring is a bijection; the Gaussian falloff is
   `swirlMap`. Topic-swap: describes only this map. Delete: loses the
   definition of the stirring. Who's-talking: the builder describing the
   object. Nick: states a fact.
2. "A red target sits on the stirred plane." — States: the figure's target and
   which pane it is on. Rules 1–4, 6, 8: pass. Four tests: pass; delete it and
   the next sentence has no referent.
3. "The machine's job is to find the point it came from." — States: the task
   the meter measures (distance to the target). Rule 2: a present task, not a
   schedule. Rule 3: about the machine. Others pass. Delete: the hops lose
   their purpose.
4. "It starts an amber marker … the image's distance from the target." —
   States: initial guess equals the target's coordinates; hops are drawn on the
   left and imaged on the right; the meter prints the miss. Rule 1: does not
   say what a hop is. Rule 8: matches the figure spec. Four tests: pass.
5. "At the stirring below, no target on the pane needs more than six hops …
   most need four." — States: measured at k = 1.5 over 729 targets, max six
   hops to 1e−12, mean 4.2. Rule 8: "most need four" is the measured mode;
   "no target" is the measured max. Rule 1: does not explain why. Four tests:
   pass.
6. "Past the middle of the knob's range, targets near the center send the marker
   wandering — twenty hops, or off the pane." — States: knob 0–4, failures
   begin at k ≈ 2.2 near radius 0.45, max hops 20, some leave. Rule 1: the
   phenomenon, not its cause. Rule 8: matches the measurement. Four tests: pass.
7. "The violet meter under the figure reads 1.000 and does not change." —
   States: det J = 1 for the swirl at every point. Rule 2: the one legal IOU, a
   flat fact pinned to the hero. Rule 1: does not say what it measures. Four
   tests: pass; delete it and §4's savior has no plant.

No sentence's only content is an effect on the reader. No "imagine." No
metaphor: "wound," "dies off," and "wandering" describe what is on screen. No
aphorism. The thesis is not printed in the intro; the article earns it.
