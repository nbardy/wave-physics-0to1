# cad/01 — Basis, Cage, and Boundary — reimagined 2026-09-02

Fable 5.1, working from the brief in `../00_VOICE_DOCS_CRITIQUE.md` §4. Source read:
`src/lessons/cad-01-primitives.mdx` (371 lines), all seven components under
`src/sims/cad/`, `mesh.ts` / `spline.ts` / `brep.ts`, the article's HANDOFF and
STORY_CANDIDATES, and `articles/CONCEPT_BANK.md`. Line numbers below are the MDX's.

Three numbers in Part 2 were computed against the repo's own `mesh.ts` rather than
assumed (script in this session's scratchpad): dragging one cage point moves 900 of
the 2,048 skin quads at refinement level 3 (36/128, 196/512, 900/2048, 3844/8192,
15876/32768 at levels 1–5); the hero's bore radius at mid-thickness runs from 0.444
to 0.523; the cube keeps exactly 24 quads without a bicubic formula at every level.

## Part 1 — The read

### Marta

Mechanical engineer, seven years in Fusion 360, a CS minor she has not used since.
She fillets parts every day, has watched "fillet failed" more times than she can
count, has toggled "show control frame" in form mode, and has opened a STEP file
in a text editor once out of curiosity. Nobody sent her the link; she searched
"what is a B-rep" after a boolean error and this came up.

L9. "Basis, Cage, and Boundary." Cage she knows: form-mode bodies have one.
Boundary she half-knows: bodies have faces. Basis is a word from a linear algebra
course. She expects the article to tell her what her CAD file actually contains.

L11. "Open any mechanical CAD file and five words fall out: B-spline, NURBS,
T-spline, SubD, B-rep." She opened a STEP file once. It said
B_SPLINE_SURFACE_WITH_KNOTS and ADVANCED_FACE and EDGE_LOOP, over and over. It did
not say T-spline or SubD; those are buttons in her form-mode toolbar. First
sentence, first thing she knows to be off. She keeps reading because the next
clause agrees with something she believes.

L12–16. "the menu is wrong." She has always been told to pick NURBS or form
bodies as if they were rivals, and it never felt right. "Three of them answer how
is this function written down" — she does not yet know what function. "A single
part uses all of them at once, in layers." She takes that as the article's claim
and expects it demonstrated in the next figure.

L18–21. She slides. Left: amber dots and a wireframe box. Middle: a blue washer.
Right: red lines on the washer. She orbits it. She tries to click an amber point
and nothing happens. This is her form-mode "show control frame" toggle with a
crossfade. Nothing about it is a question to her; the fade explains itself.

L23–30. "every edge already rounded, and nothing rounded them." That lands. In
form mode her boxes come out rounded and she has never asked why. It is a
subordinate clause and the paragraph moves on to "Nothing about the object changed
across that slide," which she already knew, because a fade cannot change a thing.
Prediction for what comes next: the article will explain the rounding. It will
not, for three hundred lines.

L32–34. "The Basis Is the Whole Story." "Start with the one everybody has heard
of and almost nobody has been shown." She has heard of B-splines. She is being
told where she stands.

L35–43. She drags a point. The amber band; the gray ghost behind; the far end of
the curve stays exactly on the ghost. She has felt this: a sketch spline made of
control points moves locally, a sketch spline made of fit points moves
everywhere, and she never knew that was a difference in kind. The article does
not mention the fit-point kind. This is the first thing she learns and she is
now in.

L45–59. The sum. She can read a sum. "They sum to one at every parameter — the
ΣN meter reads 1.00 wherever you put the evaluation line." She slides u and it
does. "identically zero, not merely small." Good; she believes the ghost.

L61–63. "usable on parts with thousands of control points." Fine. She thinks of
a fillet edit taking four seconds anyway.

L65–77. The recursion. Two fractions, subscripts p and p−1. She skims it. "Set the
degree selector to 2, 3, 4 and count the dots" — she does: three, four, five.
"That is the recursion's arithmetic, visible." The count is visible; the
recursion is a box she is told is behind it.

L79–84. Knots are the green ticks. "Repeat a knot p times and you have
manufactured a corner." She looks for a way to repeat a knot in this figure.
There is none. She files it as a claim.

L86–88. "Here is where splines stop resembling a curve-fitting trick." She had
not thought they were one.

L91–99. She presses Insert knot. The amber polygon gains a point, the ghost
polygon shows where it was, Δ reads 3.5e-16. She gets it in one press: more
handles, same curve. This is the second thing she will retell.

L101–104. "the curve grows a visible corner while still never moving." She
presses three more times at the same u. The polygon comes to a sharp point that
touches the curve. The curve looks exactly as it did. Δ still reads e-16. She
looks for the corner in the curve and cannot find it, decides the sentence meant
the polygon, and is not sure. A fifth press: "u = 0.50 is full." Attention dips
here for the first time; she was told to see something and did not.

L105–109. "why the representation survives contact with an editing session." She
does not know what the alternative would have been.

L111–116. The gray box. "A B-spline is a finite-dimensional space of functions
with a basis chosen so that…" This is the first paragraph that is about words
rather than about the thing on screen. "Everything after this is a modification
to one of those three sentences." She is not holding three sentences; she is
holding a band, a ghost, and a Δ meter. She scrolls past.

L118–126. "A circle is the most-drawn shape in engineering and no B-spline can
represent one." She stops. She draws circles constantly and they are exact to
the tolerance box. The proof is five lines and she can follow the leading
coefficient. So her circles are something else. She wants to know what.

L128–147. Weights. She pushes w up on the free curve and it leans in. The
quarter circle: three points, middle weight 0.7071, error 2.2e-16; the dashed
polynomial through the same three points misses by 6.1e-2. She drags w₁ off and
the error jumps. This is the article's best five minutes for her. She will tell
someone tomorrow: a circle is three points and the middle one weighs 0.707.

L150–162. The fraction. "a coordinate in one dimension higher" — she gets the
sentence, not the picture; there is no figure for it.

L164–167. "Surfaces are where the representation starts sending bills." She
has paid some.

L169–180. The double sum, then a paragraph describing what happens when you
insert a knot into a grid. She has done this in form mode: insert edge, and a
line runs across the whole body. She is being told before she is shown.

L182–198. Two panes of dots. She slides the strip: +6 in the left pane, +2 in the
right. There is no surface, no body, nothing she can orbit. The prose says "A
T-spline anchor infers its own knot vector by walking outward" and she does not
know what an anchor is or why a rectangle is shaded. This is where she would
close the tab on a worse day: a diagram of a diagram, then —

L200–206. — a paragraph about linear independence, partition of unity, and
"analysis-suitable" T-splines being "a real part of the literature, not a
footnote." She does not know what any of those would cost her. She skims to the
next figure.

L208–227. The cube. She has seen this cube subdivide in every tutorial she has
ever watched. Level slider, lift a corner, construction toggle. The counter,
26 and 24, then 1,538 and 1,536, is the only thing she has not seen. She reads
the counter.

L229–239. The vertex rule. Fine. "obeying the same partition-of-unity invariant"
— she nods at the word.

L241–251. "The reason this exists alongside NURBS is topology." Trimmed patches,
seams "by hand." She has fought seams. Star points, valence, "extraordinary," "no
such formula" — she has seen star points in form mode with a warning icon on
them, and now she has the word and the reason. Third thing she will retell.

L253–261. The plate: thirty-two vertices, every one valence 4, so the skin is a
B-spline everywhere; a closed all-regular quad cage forces V − E + F = 0; the
only such surface is a torus; the one all-regular object is one with a hole.
She reads this twice. It is the best paragraph in the article and she did not
see it coming. "This is also where the opening's rounded edges came from — the
limit rounds the cage's corners on its own." The debt from L24 paid, three
hundred lines late, with "on its own" as the mechanism.

L266–271. Another gray box. "Three bases, then." She skips it.

L273–284. B-rep as a hierarchy. She knows body, face, edge, vertex from the
browser tree. The line with ⊃ and ⊔ she reads as a diagram written in symbols.

L286–295. "Underlying Surface": the infinite grid; the face is a region of it;
the inner wire is the only thing that says there is a hole. She drags the hole
and the counts do not change. She likes this one. "no surface is re-fitted" —
nothing on screen counts re-fits; she takes it on trust.

L297–308. The Euler line. She checks the counter: 16 − 24 + 10 − 2 = 0. Neat.
"which is exactly the information a mesh throws away" — she does not know
enough to argue.

L310–318. Booleans: intersect, split, classify, stitch, verify — "they fail on
the classification and stitching." This is the paragraph she searched for. No
figure; she believes it because it matches every error dialog she has seen.

L320–347. Three axes. She has read this; it is L11–16 again with bold. "The
question 'should I use NURBS or B-rep' is not a question." She agrees and had
agreed at the top. "renegotiated sixty times a second" — she shrugs.

Tomorrow she retells four things: control-point splines move locally because
each point has a band; you can add handles without moving the curve; a circle
is three points and 0.707; a plate with a hole is the only shape with no star
points, and star points have no formula. She does not retell the thesis. She
never found out why the box came out rounded, beyond "on its own."

### Gideon

Has read every Ciechanowski post, some twice, and every "the equation is
beautiful" article the last five years produced. Writes rendering code. Notices
when a sentence is doing something to him rather than telling him something, and
withdraws a little trust each time.

L11. "five words fall out." He checks it against what he knows falls out of a
STEP or Parasolid file: B-spline surfaces and B-rep topology. T-splines and SubD
are authoring formats; they get converted before they are saved. The first
sentence overclaims to make the list five long.

L12–13. "They are usually introduced as a menu … and the menu is wrong." The
author has set up a way of teaching in one clause and knocked it down in the
next. He notes the strawman and the verdict.

L13–16. "Three of them answer … One answers … One answers … A single part uses
all of them at once, in layers." He now has the article's conclusion, in the
first paragraph, as a taxonomy. What he will read for is whether the body earns
it or restates it.

L18–19. "The slider does not switch between three models; there is only one."
He predicts a crossfade. It is a crossfade. A crossfade between three drawings
cannot tell him whether there is one model or three; if the three layers had
been made separately and faded, the figure would look identical. The hero
asserts the thesis and cannot demonstrate it.

L23–30. "Nothing about the object changed across that slide." A fade does not
change objects. The sentence performs a reveal a fade cannot deliver. First
feeling of the hand on his back.

L32–34. An aphorism title, then "everybody has heard of and almost nobody has
been shown." He has been shown, and he is being told where he stands.

L38–59. He drags. The ghost, the band, "identically zero, not merely small." This
is a disputable claim with a meter next to it, and it survives. Trust back up.

L65–77. The Cox–de Boor recursion, displayed. Nothing in the figure computes it
in front of him; he can change degree and count dots. "That is the recursion's
arithmetic, visible" — the count is visible; the recursion is asserted.

L82–84. "Repeat a knot p times and you have manufactured a corner." No control
in this figure repeats a knot. A claim the figure beside it cannot check.

L88. "Here is where splines stop resembling a curve-fitting trick." Stage
direction: the article announcing that it is about to be interesting.

L101–102. "the curve grows a visible corner while still never moving." He
presses four times. Δ reads 3.5e-16 throughout. The curve is the same curve;
the control polygon has a corner. The sentence is false as written and the meter
beside it says so. Trust down again, and this time it stays down, because the
article has contradicted its own instrument.

L105–109. "re-fitting the shape and hoping the error stays small." Nobody was
proposing that; a strawman with "hoping" in it.

L111–116. "Everything after this is a modification to one of those three
sentences." A schedule, and untrue by the article's own L274, which says a B-rep
is not a surface basis at all. This is where he would close the tab on a
weekday. He continues because the Δ meter was real.

L119. "A circle is the most-drawn shape in engineering." Unverifiable and doing
stakes. The proof that follows is correct over the reals and he checks it. He
notices it arrives before the figure: he is told the failure, then shown it.

L138. "The quarter circle is the payoff." Planning-doc vocabulary in print. The
article is describing its own construction.

L139–147. The meter, √2/2, "only that number works." Correct, measured, and the
best figure in the article. He would like the article to stay here.

L158–162. Homogeneous coordinates in three sentences with no figure. Correct.

L165–167. "Surfaces are where the representation starts sending bills," then
"charges" at L184. A device deployed twice.

L176–180. The failure — a full column of control points — described in prose
before the figure, and then the figure is a diagram of anchors with no surface
on it. No surface ever pays a bill on screen.

L192–198. "A T-spline anchor infers its own knot vector by walking outward …
collecting the lines it actually crosses." He reads `footprint()` later: it
walks two lines out. That is a toy of the Sederberg rule and the prose does not
say so. "Same grid, two different local knot vectors" is true of the toy.

L200–206. A caveat paragraph that ends the section on the state of the
literature. No failure drives out of it; the next section starts from "Everything
so far has been a formula you evaluate," a recap.

L219–227. The cube. He has seen it subdivide in every graphics course since
1998. The counter is new; the picture is not.

L241–251. "The reason this exists alongside NURBS is topology." The seams
argument is told, not shown; nothing on the page has a seam. Then the
extraordinary-vertex fact, which is right, and "smoothness has to be established
from the eigenstructure of the subdivision matrix," which is right and unfigured.

L253–261. He checks the plate: closed quad mesh, all valence 4, so E = 2F and
E = 2V, so V − E + F = 0. Correct. "the only closed surface with that balance is
a torus" — the Klein bottle also has χ = 0; "orientable" is missing, and this
article is otherwise careful. "the limit rounds the cage's corners on its own":
the debt from the top, paid with the same non-mechanism it was planted with. The
article has a knot-insertion figure and a subdivision figure and never says that
the second is the first in two directions, which is the actual reason the box
comes out rounded.

L263–264. "The trade is exact." The adjective is doing nothing.

L266–271. The second gray box: inventory.

L274–276. "the single most common way to misunderstand a CAD kernel." Nobody
has measured that.

L282–284. A display line made of ⊃, =, ∂, ⊔. Notation for a hierarchy, not
something computed or checked anywhere.

L290–295. The infinite plane and the wire that says where it stops. This is
good and he says so to himself. "Drag the hole slider and no surface is
re-fitted" — nothing on screen counts re-fits; the claim is unmetered.

L306–308. "the hole does not live in the counts of faces and edges, it lives in
the loop structure, which is exactly the information a mesh throws away." A
triangle mesh of a torus has V − E + F = 0; a mesh does not throw the genus away.
What the naive count misses here is that the two pierced faces are annuli, not
discs. The sentence is wrong about meshes to make its point.

L310–318. Booleans as testimony. Fine as a paragraph; no figure can touch it.

L321. "The durable version of all this is not a ranking." Meta.

L338–340. "is not a question — the plate in the first figure had a cage, a
surface, and a boundary the entire time you were sliding." The intro again,
with the crossfade as its evidence.

L345–347. "that agreement, renegotiated sixty times a second, is all a CAD
kernel is." A kernel does not re-evaluate anything per frame; the GPU draws a
tessellation. And "is all a kernel is" is a rebrand of the article's taxonomy
as a reduction it never performed.

He retells: the Δ meter, the √2/2, the all-regular torus, and that the article
told him its conclusion in paragraph one and then toured the five words in the
order of the menu it had just called wrong.

### Story

The five sentences the article as it stands implies:

1. A plate with a hole is shown as a cage, a skin, and four red lines under one
   slider, and nothing changes across the slide. (Nothing here is something the
   reader can see and not explain; a crossfade explains itself. The one
   unexplained thing on the page, "nothing rounded them," is a subordinate
   clause.)
2. Then we look at ten control points and their basis functions.
3. Then we look at inserting a knot.
4. No polynomial spline can be a circle, and the miss is 6.1e-2 on screen;
   weights make it exact. (The article's one failure with a repair.)
5. Then we look at a tensor grid beside a T-mesh; the failure — a full column —
   is described first and diagrammed without a surface. Then we look at a cube
   subdividing; the reason it exists — seams — is described and never shown.
   Then we look at a B-rep plate. Then three axes.

That is an eight-stop tour with one failure in it, and the stops are the five
words in the order of the menu the first paragraph rejects.

The hero is the pierced plate under a crossfade. Familiarity cost: a plate with a
hole is the hello-world of CAD tutorials; the crossfade is Fusion's "show control
frame" toggle; and the cube in the fifth section is the single most reproduced
image in computer graphics. Beyond familiarity, the lens is a display mode, not a
phenomenon: nothing on it can go wrong, nothing on it can be predicted, and
nothing on it can be checked, because a fade between three drawings looks the
same whether or not they came from one model.

The specimen hosts. The plate appears in the hero and in one paragraph
(L253–261); the body figures use a ten-point curve, a six-point curve, a
five-point curve and a three-point arc, a 7 × 6 grid of dots, a cube, and a
different plate with a square bore and planar faces. Six specimens for one
article. The plate is a frame around the tour, not a lens on an object.

Biggest flaw, one sentence: the article spends its conclusion in paragraph one
and then tours the five representations in the menu order it just rejected,
with a failure driving into only one of its seven sections.

### Prose

Fifteen lines, quoted exactly, with the test each fails.

- L11 "Open any mechanical CAD file and five words fall out: B-spline, NURBS,
  T-spline, SubD, B-rep." — disputability: STEP and Parasolid files carry
  B-spline surfaces and B-rep topology; T-splines and SubD are authoring formats
  and fall out of no file.
- L12–13 "They are usually introduced as a menu — pick the representation that
  suits your part — and the menu is wrong." — verdict on other people's teaching;
  the subject is pedagogy, not the machine.
- L34 "Start with the one everybody has heard of and almost nobody has been
  shown." — performance: a stage direction placing the reader.
- L77 "That is the recursion's arithmetic, visible." — disputability: the dot
  count is visible; the recursion is computed nowhere on screen.
- L88 "Here is where splines stop resembling a curve-fitting trick." —
  performance: significance announced; the "Here is where" flourish.
- L101–102 "the curve grows a visible corner while still never moving." —
  disputability: knot insertion leaves the curve unchanged, the Δ meter beside
  the sentence reads 10⁻¹⁶, and the corner appears in the control polygon.
- L114–115 "Everything after this is a modification to one of those three
  sentences." — a schedule, and contradicted by L274.
- L119 "A circle is the most-drawn shape in engineering" — disputability: an
  unverifiable superlative doing stakes.
- L138 "The quarter circle is the payoff." — verdict/performance: the
  methodology speaking; "payoff" is planning-doc vocabulary.
- L165–166 "Curves have been easy. Surfaces are where the representation starts
  sending bills." — performance: recap plus a staged device ("bills," then
  "charges" at L184).
- L241 "The reason this exists alongside NURBS is topology." — verdict without
  evidence: the seam failure is asserted and never simulated.
- L257–258 "the only closed surface with that balance is a torus" —
  disputability: the Klein bottle has χ = 0; "orientable" is missing.
- L274–275 "reading it as one is the single most common way to misunderstand a
  CAD kernel." — disputability: unmeasured superlative.
- L307–308 "which is exactly the information a mesh throws away" —
  disputability: a mesh's V − E + F detects genus; the naive count fails here
  because the pierced faces are annuli.
- L345–347 "that agreement, renegotiated sixty times a second, is all a CAD
  kernel is." — verdict: a deflationary rebrand resting on a false fact (kernels
  do not re-evaluate per frame).

## Part 2 — The new outline

Proposed title: **Thirty-Two Points**. The current title is a triad of nouns and
reads as the table of contents.

### Hero

The one artifact: the pierced plate's cage — thirty-two amber points, thirty-two
quads — drawn over the blue skin it produces, with every cage point draggable.
The figure at the top is not yet understandable because the skin is smooth where
the cage is square, rounded where nothing rounded it, follows a dragged point on
one side of the plate while the other side holds still, and has a hole that the
readout says is not round (narrowest 0.444, widest 0.523). It returns at the end
with its skin written as an equation over the same thirty-two points, its moving
region predicted from the equation's support, its rounding explained as the limit
of a refinement the reader ran by hand on a curve, its hole's out-of-roundness
explained as a property of polynomial pieces, and a second file of the same plate
beside it in which the hole is round and the rounded edges are absent.

Familiarity cost, stated honestly: a plate with a hole is a beginner's exercise
in every CAD tool, and "a cage with a smooth surface inside it" is the form-mode
image every Fusion and Blender user has seen. What has not been seen is the
counter — 900 of 2,048 quads moved, the other 1,148 to 10⁻¹² unchanged — the
hole meter, and the drag on a cage whose skin is B-spline everywhere. The cost is
real and is paid by the meters, not the silhouette. The cast bracket
(STORY_CANDIDATES #2) would buy silhouette at 3–5× the cost and lose the
all-regular fact; not taken.

The current hero object stays — it is the one closed quad cage with no
extraordinary vertex, which is what lets the article write its skin down — but
the crossfade goes, the red wires go, and the drag comes in.

The solver, one sentence beside the figure: the skin is drawn at refinement
level 3 (2,048 quads) through the existing orthographic camera and painter's
sort; the limit is approached, not evaluated, which is why the counter creeps
toward a half instead of reading it.

### Thesis

A CAD part is a short list of numbers and a rule that reads them, and what the
part can be is decided by the rule.

### The five sentences

1. A plate is stored as thirty-two points; the skin computed from them is
   smooth where the points are square, follows a dragged point while the far
   side of the plate holds still, and has a hole that is rounded but not round,
   and nothing in the thirty-two numbers says why any of that is so.
2. The obvious rule is one polynomial with the points as its coefficients, and
   on a ten-point curve that rule reads every point everywhere: drag one and the
   whole curve leaves its ghost, the meter reads "votes on [0, 1]," and no far
   side can hold still.
3. Cutting the parameter into spans and letting each point vote on p + 1 of
   them fixes the reach — only the band moves — and creates the next problem:
   the curve now lies inside its polygon instead of on it, so adding a handle
   the naive way moves the curve by a visible 10⁻¹, until a knot is inserted
   instead and the curve moves by 10⁻¹⁶; repeated at every midpoint the polygon
   is pulled onto the curve without the curve moving at all.
4. Running that basis in two directions on the 8 × 4 grid the plate's cage is
   fixes the skin — the moving region is 4 of 8 spans around and 4 of 4 across,
   the rounding is midpoint insertion run to its limit — and creates two
   shortfalls the plate shows on its own meters: the rule only has a formula
   where every point has four neighbours, which a cube's corners do not, and the
   rule makes cubic pieces, which the bore meter says cannot lie on a circle.
5. A single weight of √2/2 puts a piece on the circle, and a loop on a plane
   puts the hole where the skin cannot; the plate from (1) returns with its skin
   written as ΣΣ N N P over the same thirty-two points, its moving region
   predicted, its rounding derived, and its hole measured against the second
   file's, which is round because the hole there is a loop and not a surface.

### Section ladder

**Hero (top).** Figure: `OneObject` — OVERLAY, the largest in the plan: drop the
lens; draw cage over skin the way `CageLimit` already does; pick a cage point by
projected distance (`project()` exists), move it in the camera plane, rebuild
`subdivide()` memoised on (level, points) as `CageLimit` already memoises on
(level, lift); readout lines "level 3 · 2,048 quads · moved 900 · still 1,148"
(per-vertex displacement > 10⁻¹² against the pre-drag mesh) and "hole: narrowest
0.444 · widest 0.523" (bore-strip vertices nearest mid-thickness, `ancestor % 4
== 2`). Half a day to a day. One knob: refinement level 0–3; at 0 the panels are
the skin, at 3 the corners are gone. Drag-to-orbit stays. A restore button is
furniture. Naive thing built: none yet; this is the phenomenon. Savior sentence
into §1: "The far side held still. Whatever reads the thirty-two points reads
each of them in only part of the plate, and the same question on a curve of ten
points has an answer that can be read off a plot."

**1. Reach.** Naive thing built: one polynomial with the ten points as
coefficients — `BasisLocality` at degree 9, which `openUniformKnots(10, 9)`
already produces and which is Bézier without the name. Visible failure: every
violet hump spans the whole plot, the meter reads "P5 votes on u ∈ [0.00,
1.00]," and dragging any point leaves the whole curve off its ghost, ends
included. Repair: degree 3 — the band, the ghost coinciding outside it exactly.
Figure: `BasisLocality` — OVERLAY: add "9 · one polynomial" to the degree
select; keep the u slider (it drives the "awake" count and the ΣN meter); the
restore button stays as furniture. One knob: degree. Math moment: C(u) =
Σ N_i(u) P_i, with each N_i zero outside p + 1 spans, formalizing the drag the
reader just did at degree 9 and then at degree 3 and the band the meter printed.
Nonnegativity and the sum to one are read off the meters in one sentence each.
The Cox–de Boor recursion is named in one sentence with de Boor in Further
Reading and not displayed: the reader stepped the degree and watched the count
rise by one per step, and that observation is stated as the recursion's effect.
Savior sentence into §2: "The curve is made of cubic pieces that meet somewhere
inside the band, and nothing on the curve shows where. The green ticks do, and
they can be bought."

**2. Joins.** Naive thing built: add a handle where more control is wanted, by
adding a point to the polygon and re-spacing the knots. Visible failure: the
curve leaves its ghost; the Δ meter reads on the order of 10⁻¹. Repair: insert a
knot at that u instead (Boehm's insertion, named in one sentence): one more
point, Δ = 3.5 × 10⁻¹⁶. Then the tool the plate will consume: a button that
inserts a knot at every span midpoint; press it three or four times and the
amber polygon lies on the blue curve while Δ never leaves 10⁻¹⁶. Figure:
`KnotInsert` — OVERLAY: two buttons, "add a point" (polygon midpoint, knots
re-spaced) and "insert at every midpoint" (loop over spans calling
`insertKnot`); the existing single-insert button and Undo stay. One knob: u.
Math moment: none displayed; the knots are named as the joins and multiplicity
is not raised here (the plate has no corner; see Cut list). The one waypoint
of the article, stated flat as a black box in the last sentence of the section:
"Inserting a knot at every midpoint moves the polygon toward the curve and never
moves the curve; done without end, the polygon is the curve." Savior sentence
into §3: "That is what the plate's cage does, in two directions at once, and
the plate's cage is a grid: eight stations around, four points across."

**3. Skin.** Naive thing built: the curve rule run in two directions on the
plate's own cage, with the reader predicting where a drag will show. The one
prediction prompt of the article, placed here because the common guess is
wrong: drag an outer-top point — does the underside of the plate move? Most
readers say no; it does, at those stations, because the cross-section has four
points and a cubic basis spans four spans, so across the plate every point votes
everywhere. Visible confirmation: the moved/still counter, and a support overlay
shading the 4 × 4 block of cage quads the equation predicts against the quads
that actually moved. Visible shortfall of the finite drawing: the equation says
exactly half the skin moves; the counter reads 900 of 2,048 at level 3, and the
sequence 28%, 38%, 44%, 47%, 48% at levels 1–5 creeps toward the half because
three refinement steps spread a point's influence only 1.75 spans instead of 2.
Figure: `OneObject` — OVERLAY: a "label the grid" toggle numbering the points
P_ij (i around, j across) and shading the predicted support block when a point
is dragged; the level knob already shows the sequence for levels 0–3, and levels
4–5 are quoted from computation. One knob: level (as at the top). Math moment:
S(u, v) = Σ_i Σ_j N_i(u) N_j(v) P_ij with both bases periodic uniform cubic on an
8 × 4 grid, formalizing the drag and the prediction the reader just made; then
the refinement rule at a four-neighbour point written as the two-direction
midpoint mask, (1, 6, 1)/8 ⊗ (1, 6, 1)/8, which is §2's button run on a grid —
so the cage at level k is the same surface's coefficients after k insertions and
the box was never the plate; the rounding is what thirty-two coefficients mean
under this rule. Debts paid here: no surface stored; nothing rounded; far side
still. Savior sentence into §4: "Every one of these thirty-two points has four
neighbours. A cube has eight points with three."

**4. Corner.** Naive thing built: the grid formula on a cube. Visible failure:
around every corner there is no 4 × 4 block of points to evaluate, and the
overlay hatches every quad touching a three-neighbour vertex: 24 of 24 at level
1, 24 of 96, 24 of 384, 24 of 1,536 — the hatched area shrinks and never
leaves. Repair: define the surface by the refinement rule's limit instead of by
a formula — the rule runs at any valence, the limit exists, and lifting the
corner shows it following smoothly with the counter still reading "without a
formula: 24." Figure: `CageLimit` — OVERLAY: per-level valence count (five
lines; `Construction.valence` covers level 1 only), hatch on quads with a
non-4-valent corner, counter "with a formula / without"; the construction toggle
stays because the vertex rule formalizes it; the lift slider becomes a drag on
the corner vertex, the same hand as the hero. One knob: level. Math moments:
P′ = (F̄ + 2Ē + (n − 3)P)/n, formalizing the face points and edge points the
reader just switched on, with the sentence that at n = 4 it is §3's mask; then
V − E + F = 0 for any closed quad cage with four neighbours everywhere, from
E = 2F and E = 2V, formalizing the two cages' counts printed under them (plate
32 − 64 + 32 = 0; cube 8 − 12 + 6 = 2) — and the closed orientable surface with
that balance is the torus, so the pierced plate is the one closed shape whose
skin has a formula everywhere. Catmull and Clark named in one sentence. Savior
sentence into §5: "The plate's skin has a formula everywhere, and the formula
is made of cubic pieces. The meter under the plate says what cubic pieces do to
a hole: narrowest 0.444, widest 0.523."

**5. Hole.** Naive thing built: make the arc round by pushing the polynomial
harder — the reader has the degree selector from §1 and can raise it; the
reader has the bore's own points: one quarter of the bore is three of its eight
stations, midpoint–corner–midpoint, which is exactly the three-point figure
already built. Visible failure: the polynomial through those three points
misses the circle by 6.1 × 10⁻², and no degree fixes it; the two-line leading-
coefficient argument arrives after the reader has tried, as the reason the meter
will not move. Repair: a weight on the corner point; at √2/2 the rational curve
lies on the circle to 2.2 × 10⁻¹⁶, and off √2/2 by any amount the meter leaves
zero. Figure: `WeightPull` — REUSE, re-bound in prose to the bore (the circle
pane's points are the bore's quarter, scaled); controls cut from five to two
(the free pane's knob becomes the weight of one fixed point; the point selector,
snap and reset buttons go). One knob: w₁ on the circle. Math moment: C(u) =
Σ N_i w_i P_i / Σ N_i w_i, formalizing the weight the reader just set; the
homogeneous reading (a B-spline through (w_i P_i, w_i) divided by the last
coordinate) in one sentence, unfigured, as the mechanism of the denominator.
Savior sentence into §6: "One weight makes the arc exact. The plate's skin has
no weights, and the tool that makes a hole round is not a weight; it is a drill,
and a kernel stores what a drill does as a boundary rather than a surface."

**6. Loop.** Naive thing built: the plate as surfaces only. Visible failure:
with the "forget the wires" toggle on, the hole heals — material floods back
across the bore — while the readout says "surfaces changed: 0," because the
planes never had a hole; select Underlying Surface and the top face's plane is
drawn out past the plate with no hole in it. Repair: loops — an outer wire and
an inner wire wound against it — say which region of each plane is metal; the
hole is back with no surface changed; drag the hole's radius and the wire moves
while the plane stays. Figure: `BrepStack` — OVERLAY for the wire-heal toggle
(banked in CONCEPT_BANK; `faces()` already carries the loops, even-odd fill does
the rest) and NEW for a round bore (a circular inner wire drawn as a polygon,
one cylindrical bore face with a seam edge, `counts()` taking loop kind into
account: V 10, E 15, F 7, R 2; half a day). The entity selector stays as the
instrument; the thickness slider goes. One knob: hole radius. Math moment:
V − E + F − R = 2(S − G), formalizing the counter the reader just read
(10 − 15 + 7 − 2 = 0), with G = 1 the same zero the cage produced in §4 — the
hole is in R, the plate is a torus twice over. Two sentences on booleans as
checkable testimony (split faces, add loops, classify fragments; failures are in
classification and stitching), with Open CASCADE in Further Reading. Savior
sentence into the ending: "Two files of the same plate are on the page."

**Two Files (ending).** No naive build; the ring. Figures: `OneObject` REUSE at
level 3 with the grid labels on and the equation beside it; `BrepStack` REUSE
beside it. See Ending below.

### Debts

- "No surface is stored with them" (intro) — paid §3, the equation over the
  same thirty-two points.
- "The skin has no corner anywhere, and its hole has none either" (intro) — paid
  §3: midpoint insertion in two directions, run to its limit, is the rule; the
  box was coefficients.
- "The far side of the plate does not move" (intro), and the counter "moved 900
  · still 1,148" (hero readout) — paid §1 (support is p + 1 spans) and §3 (4 of
  8 around, 4 of 4 across; the sequence toward one half).
- "Hole: narrowest 0.444 · widest 0.523" (hero readout) — paid §5 (cubic pieces
  cannot lie on a circle; one weight can) and §6 (where a kernel puts the round
  hole: in a loop).
- "Inserting a knot at every midpoint … the polygon is the curve" (§2, the one
  waypoint) — consumed §3 (the skin) and §4 (the vertex rule at n = 4).
- "Every one of these thirty-two points has four neighbours" (§3) — paid §4
  (cube: 24 quads forever without a formula; V − E + F = 0 forces the torus) and
  §6 (the same zero from the loops' side).
- "The bore is three of eight stations" (§5) — paid §6, where the same quarter
  arc is the inner wire.

### Math budget

In order, each after the thing it formalizes:

1. C(u) = Σ N_i(u) P_i, N_i zero outside p + 1 spans (§1) — after dragging at
   degree 9 and degree 3.
2. S(u, v) = Σ_i Σ_j N_i(u) N_j(v) P_ij, periodic uniform cubic, 8 × 4 (§3) —
   after the prediction and the drag on the plate.
3. The midpoint mask (1, 6, 1)/8 in each direction (§3) — after §2's button.
4. P′ = (F̄ + 2Ē + (n − 3)P)/n (§4) — after the construction toggle; equal to
   3 at n = 4.
5. V − E + F = 0 from E = 2F, E = 2V (§4) — after the two cages' counts.
6. C(u) = Σ N_i w_i P_i / Σ N_i w_i (§5) — after setting w₁; the two-line
   impossibility argument as prose math after the meter refuses to move.
7. V − E + F − R = 2(S − G) (§6) — after the counter.

Not displayed: the Cox–de Boor recursion (named; de Boor in Further Reading);
the ⊃ / ⊔ containment line (a hierarchy in symbols, computed nowhere); the
tensor-product line as a separate display (it is 2).

### Ending

It lands the two files. On the left, thirty-two numbers and a rule: the skin is
smooth everywhere, its rounded edges cost nothing, its hole is out of round by
eighteen percent, and it has a formula only because the plate is a torus — add a
boss and twenty-four quads lose it for good. On the right, ten vertices, fifteen
edges, seven faces and two rings: the hole is round to the last digit because it
is a circle loop on a plane and a circle is one weight, the rounded edges are
absent and would each be a face of their own with loops of their own, and the
question a kernel has to answer — is this point metal — is answered by which way
the inner wire winds, which the left file cannot answer at all. A form tool
stores the left file. A kernel stores the right one. Both are numbers on disk,
and the plate is whichever rule reads them; the two rules disagree about the
hole. The last sentence is the intro's thesis with its evidence in front of it,
not a new aphorism. It cannot be moved to a sibling article by changing nouns:
its content is that one plate's hole is rounded in one writing and round in the
other, and the reason is the rule.

### Cut list

- The crossfade lens on the hero — a display mode; nothing on it can be wrong,
  predicted, or checked.
- The red wires on the hero and the "boundary topology" layer name — they spend
  §6's material at the top, and they are strip boundaries labelled as faces.
- The opening's five-word taxonomy and "Three Axes, Not Five Options" — the
  conclusion in paragraph one, restated at the end; the new article has no
  taxonomy to state.
- Both Waypoints — one is a recap that schedules ("Everything after this"), the
  other is inventory; the single black-box sentence in §2 replaces them.
- The Cox–de Boor display — a definition the reader does nothing to earn; named,
  referenced.
- Knot multiplicity and the corner (L79–84, L101–104) — the plate has no sharp
  edge, so the debt has no payoff here, and the corner sentence is false as
  written; belongs to the turned-part article (CONCEPT_BANK), where the shoulder
  is a repeated knot and a drag can make the corner.
- The T-spline section and `RefineLocal` — a diagram of anchors with no surface;
  the failure it repairs (a knot line that must cross) never happens to the
  plate, whose grid is periodic and needs no local refinement in this story;
  the analysis-suitability paragraph is a literature note. The Sederberg
  reference goes with it. Cost stated: the article no longer covers T-splines,
  and the registry blurb — which currently lists five things — must change.
- "The Denominator" as a section before surfaces — the circle now arrives as
  the plate's own hole, after the skin, driven by the bore meter.
- The boolean paragraph — reduced to two checkable sentences in §6; it had no
  figure and was the section's longest paragraph.
- "renegotiated sixty times a second, is all a CAD kernel is" — false fact under
  a rebrand.
- "the only closed surface with that balance is a torus" — corrected to
  orientable.
- "which is exactly the information a mesh throws away" — wrong about meshes;
  replaced by the annulus fact.
- The second plate's square bore — replaced by a round one so §5's arc is §6's
  wire.
- Six specimens — reduced to the plate (hero, §3, §5's bore quarter, §6's second
  file, ending), the ten-point curve (§1), the six-point curve (§2), and the
  cube as the counter-specimen (§4).

## Part 3 — The intro

The plate below is stored as thirty-two points and the thirty-two four-sided
panels between them; no surface is stored with them. The blue skin is computed
from the points, and when a point moves it is computed again. The points have
square corners and a square hole through the middle; the skin they produce has
no corner anywhere, and its hole has none either. Any point can be dragged. The
skin follows it and stays smooth, and the far side of the plate does not move.
A CAD part is a short list of numbers and a rule that reads them, and what the
part can be is decided by the rule.

Hero figure: the plate's thirty-two-point amber cage drawn over its blue skin,
every cage point draggable, drag-to-orbit, with the quad count, the moved/still
counter and the hole's narrowest and widest radius printed under it; single
knob, refinement level 0 to 3 — at 0 the panels are the skin, at 3 the corners
are gone.

Audit, one line per sentence:

1. "The plate below is stored as thirty-two points and the thirty-two four-sided
   panels between them; no surface is stored with them." — Fact: `plateCage()`
   is 32 vertices and 32 quads; the skin is derived by `subdivide()`, not
   stored. Rule 1: no later payoff named. Rule 2: nothing scheduled. Rule 3:
   subject is the file. Rule 4: opens cold on the stored points. Rule 6: nothing
   imagined. Rule 8: counts verified in `mesh.ts`. Topic-swap: the counts are
   this plate's; delete: the file's contents are lost; who's-talking: the person
   who built it; Nick test: no house rule instantiated. Passes.
2. "The blue skin is computed from the points, and when a point moves it is
   computed again." — Fact: the limit is rebuilt from the cage on every drag;
   "blue" binds to the palette. Rules 1–4, 6, 8 pass (no mechanism named, no
   schedule, about the machine, concrete, nothing imagined, true of the build).
   Four tests pass: the sentence is specific to this figure and deletable only
   at the cost of the drag's meaning. Passes.
3. "The points have square corners and a square hole through the middle; the
   skin they produce has no corner anywhere, and its hole has none either." —
   Fact: the cage is a square-outlined prism with a square bore; the skin of an
   all-regular cage is C² everywhere, so "no corner anywhere" survives the math
   review. Plants the rounding debt as an observation, not a mechanism (rule 1).
   No schedule, about the object, concrete, no imagination. Four tests pass.
   Passes.
4. "Any point can be dragged." — Fact about the figure; permissive, not
   imperative (pronoun regime). Rules 1–4, 6, 8 trivially pass; delete test: the
   reader would not know the cage is live. Passes.
5. "The skin follows it and stays smooth, and the far side of the plate does not
   move." — Fact: the moved region at level 3 is a 30 × 30 block of sub-quads on
   a 64 × 32 torus; the remaining 1,148 quads are unchanged to 10⁻¹²; moving a
   coefficient preserves C². "Far side," not "far half," because the half is the
   limit statement §3 earns. Plants the reach debt as an observation. Rules 1–4,
   6, 8 pass; four tests pass. Passes.
6. "A CAD part is a short list of numbers and a rule that reads them, and what
   the part can be is decided by the rule." — The thesis, last, a full sentence.
   Disputable: an expert can hold that the numbers decide the shape, and the
   article's job is to show the same numbers under different rules and one rule
   unable to say "round." Names no rule, so spends no payoff (rule 1); schedules
   nothing (2); about the machine (3); no image needing an audit (7 by
   omission); no false universal (8). Not the p-bits shape: no familiar/inversion
   pair, no fragment. Four tests: swap the subject and "rule that reads them"
   has no referent; delete it and the intro has no claim; the physicist is
   speaking; no house rule is recited. Passes.

No sentence's only content is an effect on the reader. No "imagine." No metaphor
needing an audit sentence ("skin" is the object's name, not an image). No
aphorism opens.
