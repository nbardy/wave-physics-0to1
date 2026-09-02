# Compiling Into Heat — reimagined

Fable 5.1, 2026-09-02. Source read: `src/lessons/physics-03-z1.mdx` (735
lines, published), its docs under `articles/06-z1-compiler/`, the sims it
imports where a figure claim needed checking (`WalkHero.tsx`,
`SplitMeterTeach.tsx`, `WalkFloor.tsx`, `walkCompile.ts`), and the sibling
openings. Line numbers below are the MDX's.

## Part 1 — The read

### Teo

Thirty-four, data engineer at a freight company. Read Part 1 last weekend
and dragged everything in it. Has never fit an energy model. Sunday, kitchen
table, coffee, laptop.

**L20–28.** "The smallest stochastic program worth compiling is a walk."
Fine. Five nodes, three probabilities each, dice — he could write this in
ten lines. Then the sentence about the paper's 5×5 grid "shrunk until Part
1's oracle — exact enumeration, gray ghosts, numbers with no error bars —
holds every quantity in sight." He half-remembers the gray ghosts. He reads
the sentence as *we made it small so we can check it* and moves on.
Prediction: this is Part 1's shape again — a truth, a sampler, a distance
between them.

**L30–36.** A paragraph telling him what the figure will show before it
shows it. "Each step re-expressed as a thermodynamic kernel, clamped,
sampled, read out" — clamping he remembers. "Running on a patch wired with
the actual chip's connection rules" — good, the real thing.

**L38.** He looks for a slider. There is none. Two tokens hop, bars fill
toward gray outlines. He watches fifteen seconds. Along the bottom a strip
prints small numbers with a "T = 30" beside them. He does not yet know what
T is.

**L40–47.** "By the histograms, the compilation worked." He looks again. The
right pane's tall bar — the sticky node — stops short of its outline. Worked,
roughly. "The quiet strip along the bottom disagrees": 0.421, and 0.190 in a
red bucket. "Which is all that running the program means" — chaining; he
gets it. He wants to chain it himself, deeper, shallower. There is nothing
to drag. He takes 0.421 on trust. "One-step agreement is the cheapest
promise a compiler makes" — he likes the line and expects the article to
show him the leak forming, step by step, next.

**L49–73.** "Four moves and a checkerboard." No walk in the heading. Four
rules in braces, a figure. He clicks cells; sixteen wires redraw around
each; the long ones are knight-moves. A minute, pleasantly. The paragraph
about edges — "pick a lie," torus versus truncated — reads as fine print. He
assumes the fabric will turn out to matter for the leak, since the compiled
walk runs on it.

**L75–91.** Add the coordinates: 1, 3, 5, 5, odd. Checkerboard. He does it
in his head before the prose finishes. ParityToggle: swap a rule for an even
one and same-colour wires appear. Quick, and retellable: *the wiring is all
knight-moves and every one is odd, so the chip is two-colourable.* It has
nothing to do with his red bucket.

**L93–110.** Z1Layers. Pick readable cells and the flat graph re-hangs into
columns. He re-rolls three times. This is the one he will tell someone
tomorrow: *a flat chip becomes a deep network the moment you choose which
cells you read.* Still no red bucket.

**L112–132.** Two couplings per edge; he splits them and the flux meter
wakes. "Probability circulates, steadily, forever" — he likes that. Then the
paragraph retires it: the theory cannot handle it, the papers stay
symmetric, "a door the theory cannot yet walk through." Exhibit opened,
exhibit closed. Four figures in and the number from the strip has not been
mentioned since line 47.

**L134–141.** The boxed Waypoint. He skims. "What remains of the hero" —
the word makes him aware of a plan behind the page, the way a menu's
"chef's journey" does.

**L143–170.** "Part 1 built the thermodynamic kernel with hands" — yes.
Three populations, three colours, a diagram with nothing to drag. The
formula: he can read the sum over $w$. "Check it at the boundary as
always" — he does not. Then "that bill arrives immediately. It also hides a
loophole no forward fit can see; that one keeps." Two teasers in one
breath. He files "loophole."

**L172–190.** "Compile one step of the walk." He sits up. Thirty-two
configurations, five mean anything. He gets it before the sentence ends,
and it is the first time the red bucket has a cause: the kernel can say
things the program cannot. "Conservation leakage" — a name for his bucket.

**L192–226.** KL. The formula, then "starve a state the truth visits and
the divergence blows up" — that lands. The split-meter "sits on every
compiled figure from here to the end of the series." SplitMeterTeach has a
depth slider. He drags it: left pane frozen, right pane climbing, red
filling. This is the interaction the top of the page should have had. He
scrolls back up to check he did not miss a slider on the hero. He did not.

**L228–243.** The glow, the loss with $q$. Then: "a handicap to declare:
this kernel's input wires are deliberately poor — tied around the ring." He
re-reads. The numbers coming are for a kernel built poor on purpose; the
hero's was not. He is not annoyed; he is recalibrating what the next
numbers are numbers *of*.

**L245–263.** Predict. He picks (a): the cold contexts will pay. Toggle:
bucket 0.66 → 0.19, and the cold bars do not rise. Wrong, and glad to be.
"No price appeared. That is a measured fact about this kernel, not a law."
Then: "this model is not yet poor enough to show one." The trade he
predicted exists somewhere off the page.

**L265–279.** The inflation factor. "Uniform over $n$ contexts and $c$ is
$n$ times the hottest context's share" — he follows. "Exactly as
frightening as a worst-case ratio and no more" — he shrugs at being told
how frightened to be.

**L281–311.** REINFORCE in words: keep trajectories, score them, nudge
toward the better ones. He understands it with no equation. Stairs: 0.662,
0.491, 0.144. Then the left pane *rises*, 0.414 → 1.917: the table got
wronger while the chain got better. The second thing he will retell. "That
is not a glitch in the figure; it is the deal" — he did not think it was a
glitch.

**L313–356.** The floor. Equation first, two caveats, then the figure. The
curve flattens under a line; press "none" and the line is gone and the
figure says the bound exceeds one. He gets that cleanly. "A shadow rides
along … That account gets opened properly when the couplings themselves
come under the meter." He is counting teasers now: loophole, shadow.

**L358–396.** λ. "This section is about what the forward law does not even
witness." Nothing failed to bring him here. He drags λ: forward 0.000000,
backward diverging. He understands "an equivalence class of energies" and
has no use for it. The loophole, paid, as a lemma. It has been two thousand
words since the walk was on screen as anything but a number, and this is
where he checks the scroll bar: forty percent left.

**L398–408.** Waypoint 2, an inventory. "The next tax on the bill." The
article has told him its shape: taxes, a bill. He now expects a list and
reads the rest as one.

**L410–469.** Two spins, $e^{2J}$: fine, he follows the barrier. The dial is
a four-spin model, not the walk. Predict: he picks (b), collapsed; correct;
it feels like a quiz he was set up to pass. τ 1.7 → 194. Clamped spins are
exempt — a fact he keeps: *clamped inputs are free.*

**L471–522.** The bill. A price list, a strip, the walk kernel placed:
13 → 51 cells. He presses readout (300), reflash (27,300). "Moving house
costs more than living." He got the point on the first press; the
remaining paragraphs restate the strip's own labels. He is looking at the
clock.

**L524–532.** "Spend all three on purpose — on a model the chip cannot even
write down." Trailer voice; he notices it as a voice.

**L534–651.** The impossibility figure: re-roll, three-body zero of twenty
every time. "Compile the sampler" — he gets it and likes it. Then the
logit, the softplus pair, "our own derivation had to find the hard way" —
he skims the making-of. SoftProduct: drag coupling, the residual dies on a
log axis in a straight line. He likes this one. MetaEbmChain: three curves;
he reads the paragraph twice to learn which one the knob owns. "It was the
moves." — half a smile, half an eye-roll.

**L653–681.** The hero returns and the strip climbs the ladder live. Then:
"on those wires the uniform rung reads 0.662, not the untied opening's
0.421" — the figure is reconciling its own books in front of him. Then the
fact: the histograms match *better* with the wrongest table. He will retell
this one, and he wishes it had been the second paragraph of the article.
The market numbers are dessert he does not taste.

**L720–735.** "Every fixed machine is a universal sampler one compiler
away" — he reads it as the slogan. "Are the ones now in your hands." He
closes the tab an hour and ten minutes in.

Tomorrow he retells: the flat chip becomes a deep network when you choose
the readable cells; a hidden spin is a product term; the healed walk had a
wronger table and a better histogram. He does not retell three taxes. He
does not remember λ. If SoftProduct had not been visible while he scrolled
past λ, he would have closed the tab at line 358.

### Harriet

Forty-one, physics PhD a long time ago, writes pricing code now. Has read
every Ciechanowski post and keeps a folder of "the equation is beautiful"
articles she abandoned at the second aphorism. Train, forty minutes, phone.

**L20–28.** First sentence fine. Third sentence: the author explaining why
his toy is small. She has read "we use a small example so exact quantities
can be computed" in a hundred ML posts; here it wears "oracle" and "gray
ghosts." The article describing the article, in its first paragraph.

**L30–47.** She looks at the two histograms. The right pane's sticky bar is
short of its outline. "By the histograms, the compilation worked." She
disagrees with the page in its first minute. The strip: two numbers she
cannot produce. "A distance from the walk's law that exceeds any single
step's error" — by how much? The single-step number is not printed. Then
"One-step agreement is the cheapest promise a compiler makes" — the intro
ends on its quotable, same shape as Part 1's, and she notes the article has
spent its aphorism at line 46 with seven hundred lines to go.

**L49–132.** The fabric tour. She knows what a representation section is
for — teach the reader to read a display before anything happens in it.
Nothing later reads these figures. Parity: honest, and the counterfactual
knob is a real one. Layers: she would keep the figure and cut the sentence
that precedes it, "the next figure shows what it buys." "One last fact about
the wires, and it is the strangest on the die" — she is told what to feel
before she sees it. The asymmetric loop: installed, admired, closed with a
plaque ("a door the theory cannot yet walk through"). She counts "confessed
stand-in" (L51), "pick a lie" (L67), and later the on-canvas "confessed"
note: Part 1's confession device, back for a second article.

**L134–141.** "The fabric is real to you now" — the author reporting her
state to her. "What remains of the hero" — production vocabulary in print.
The page has a plan and is reading it aloud.

**L143–170.** "What the sequel needs" — the article as its own subject.
The formula is fine. "Check it at the boundary as always" — the method
reciting itself. "That bill arrives immediately … that one keeps" — two
IOUs in ledger voice. Ciechanowski plants a lever; this plants a mood.

**L172–226.** Thirty-two versus five: the first thing on the page she could
not have written from the abstract. KL: fine. Then three sentences in a
row that schedule or slogan: "sits on every compiled figure from here to the
end of the series," "the reverse is coming," "neither pane alone is the
truth." The depth slider on SplitMeterTeach is the hero's knob, arriving
three thousand words late.

**L237–243.** "Deliberately poor — tied around the ring." Here she stops
reading the numbers as facts about the compiler; they are facts about a
kernel built so the section's effect would show. She respects that it is
said. She also notes the hero ran untied, predicts a reconciliation
paragraph near the end, and is right (L659–664).

**L245–279.** Predict: she guesses (a); the answer is no; the prose then
says the trade exists at scarcer capacity, unshown. The figure demonstrated
the absence of an effect the author believes in. "Exactly as frightening as
a worst-case ratio and no more" — her fear calibrated for her. "The bound
also confesses its own pessimism" — confession, fourth instance.

**L281–311.** REINFORCE in words: keep. The two panes moving opposite ways:
this is the article. Then "it is the deal" and "keeping both is why the
split-meter exists" — the instrument explaining its own justification.

**L313–356.** "Good news with a boundary" — valence assigned before the
fact. The caveats are honest. "Contraction is mixing wearing other clothes"
— a rebrand. "That account gets opened properly when…" — ledger voice,
third IOU.

**L358–396.** The section opens by describing itself. The identity is
correct. The equivalence-class paragraph is a footnote from the paper given
a section because a figure existed for it.

**L398–408.** "And one humility" — the author naming his own virtue. "The
next tax on the bill." She has the table of contents now: three taxes, one
finale. She reads the rest as a checklist being ticked.

**L410–469.** The two-spin barrier: keep. L428, the second aphorism. The
four-spin dial: a new specimen. Predict where the common guess is right: a
quiz. "The fit pane earns its perfection" — *earns*. "The gate has a second
jaw, and this sampler is in it."

**L471–522.** "A third currency, and it is the natural one" — inventory.
"Moving house costs more than living" — third aphorism. "The word *estimate*
is load-bearing" — the article about its own words. She stops reading prose
at line 522 and drags figures from here on.

**L534–651.** SoftProduct's log-axis line is real; she drags it twice.
"Our own derivation had to find the hard way" — the making-of. "It was the
moves." — the stop-short reveal she has seen on every blog she stopped
reading.

**L653–681.** "Has been waiting for exactly this vocabulary" — the ring,
announced. The bookkeeping paragraph she predicted. Then the histogram
fact, real, and the one she would have led with.

**L720–735.** "Nothing on it says impossible." "At a price you can now
compute" — fourth aphorism. "Are the ones now in your hands" — a
certificate.

She closes the tab for prose at L522, for figures at L681. Tomorrow she
retells: "They cripple the kernel on purpose and tell you, which is fair;
and the one result — a wronger table gives a better chain — is at word six
thousand." Where she felt the hand most: the three Waypoints, the four
aphorisms, the teasers.

### STORY

The five sentences the current article implies, written honestly:

1. A five-node walk compiled step by step onto a patch of the chip matches
   the written walk's one-step histogram and, chained thirty deep, sits
   0.421 from the walk's law with a fifth of its mass in states that are no
   node.
2. Then we look at the fabric's four wiring rules, their odd parity, the
   layered machine hidden in the flat die, and a second coupling per edge
   that the theory retires in the same section.
3. Then we look at the kernel formula with its three roles, whose per-input
   normalizer is promised to matter later.
4. The per-step fit under equal weights leaks; weighting by the walk's
   visitation halves the drift; fitting the trajectory instead of the table
   cuts it to 0.144 and makes the table wronger; the drift stops at a
   ceiling computable from two numbers.
5. Then we look at an energy shift the forward law cannot see, a coupling
   cap on a different four-spin model, a price list charged in sweeps, and a
   twelve-spin three-body model compiled as its own sampler — and the walk
   comes back healed.

Sentence 4 is a story. Sentences 2, 3 and 5 are itineraries, and sentence 5
alone is 300 lines of the source (L358–651). The hero's failure is answered
by L311, forty percent in; everything after is the chip's other facts on
other specimens, with no failure driving into any of them.

Current hero: the sticky five-node walk, run as written beside its compiled
twin, one-step histograms live, the depth-thirty number printed in a strip
with no knob. Familiarity cost: a random walk on a ring is a first-week
probability object and a Markov chain every reader of this site has met;
that cost is real and moderate. The hero does not buy it back: what is on
screen at the top is two histograms converging — a picture every reader has
seen — and the thing nobody has seen, the chain going nowhere at depth, is
a printed number the reader cannot move. The novelty is in the strip and
the strip is inert.

Specimen serves or hosts: in L172–356 the walk serves the object (chained
kernels, error at depth). Elsewhere the article does not have a specimen
problem; it has four specimens — the fabric (L49–132), a four-spin model
(L431–455), a placed patch with a bill (L479–522), a twelve-spin three-body
model (L536–651) — and the words in those sections go to each specimen's
own physics. The walk is absent from 55 percent of the source.

### PROSE

Quoted exactly; the test each fails in one clause.

- L25–28 — "this ring is that demonstration shrunk until Part 1's oracle —
  exact enumeration, gray ghosts, numbers with no error bars — holds every
  quantity in sight." Delete test: the reader loses only the author's
  reason for the toy's size.
- L40 — "By the histograms, the compilation worked." Disputability: the
  histograms differ by TV 0.265 (WalkHero.tsx header) and the sticky bar is
  visibly short.
- L93 — "Bipartite is a stronger word than it looks, and the next figure
  shows what it buys." Delete test: a stage direction for the figure below.
- L112 — "One last fact about the wires, and it is the strangest on the
  die." Performance: "strangest" assigns the reader's reaction.
- L131–132 — "The second coupling stays on the die, a door the theory
  cannot yet walk through." Performance: a metaphor with no audit and no
  mechanism.
- L135 — "The fabric is real to you now:" Performance: the sentence's only
  content is the reader's state.
- L139 — "What remains of the hero is its other half:" Verdict/craft: the
  subject is the article's plan, not the machine.
- L168–170 — "that bill arrives immediately. It also hides a loophole no
  forward fit can see; that one keeps." Performance: suspense scheduled
  twice in one breath.
- L207–208 — "The instrument itself is the **split-meter**, and it sits on
  every compiled figure from here to the end of the series." Disputability:
  a schedule cannot be argued with.
- L214–215 — "and the reverse is coming — and neither pane alone is the
  truth." Repetition: schedule plus slogan, the section's third of each.
- L270–271 — "which is exactly as frightening as a worst-case ratio and no
  more" Performance: the reader's fear calibrated by the author.
- L307 — "That is not a glitch in the figure; it is the deal." Repetition:
  the not-X-but-Y verdict frame, recurring from L46 and L131.
- L316–317 — "one more fact remains, and it is good news with a boundary."
  Performance: valence assigned before the fact.
- L354–356 — "contraction is mixing wearing other clothes, and sharpness
  taxes it. That account gets opened properly when the couplings themselves
  come under the meter." Verdict: a rebrand plus a schedule; nothing
  forbidden, nothing delivered.
- L653–654 — "The walk that opened this article has been waiting for
  exactly this vocabulary." Delete test: the ring narrated instead of
  closed.

## Part 2 — The new outline

### Hero

The walk, thirty deep. The same five-node sticky walk, compiled step by
step onto a patch of the fabric wired by the chip's own four rules — and
watched at depth instead of at one step. The figure at the top: two panes
of six bars each, the walk's occupancy after $T$ steps as written (left) and
as compiled (right); five bars are nodes, the sixth is red and counts
states that are no node. Both panes are exact chain propagation, no
sampling. The one knob is depth, 1 to 30. At the knob's left end the panes
are close; at 30, two-thirds of the right pane is red. The reader can see
it and cannot explain it.

It returns with the same knob, a second toggle (opening kernel / healed
kernel), the ceiling line drawn wherever the arithmetic of §5 can draw one,
and the per-step number printed beside the depth number. At 30 the healed
chain sits at 0.144 with 0.04 red; its per-step table is the wrongest the
article fit; its one-step panes are closer than the opening's were.

Familiarity cost: a random walk is the most familiar object in probability
and the cost is paid in full. The hero is kept because the article's object
is a chain of kernels and a walk is the smallest chain, and because what is
on screen is not the walk the reader has seen — it is a walk running as heat
on a chip patch and landing two-thirds nowhere. The current hero is not
kept as built: its live one-step histograms show the familiar thing and its
depth number is inert; the new hero puts the knob on depth from the first
frame.

One capacity, top to bottom: the tied ring, three hidden spins, the
ladder's kernel family. The current article runs the hero untied (0.421)
and the ladder tied (0.662) and spends L659–664 reconciling them. Every
number below is on the tied ring; the two per-step numbers not yet measured
on it are marked [measure].

### Thesis

Every number the fit minimized was measured one step deep, and the walk
runs thirty.

### The five sentences

1. A five-node walk compiled step by step onto a patch of the fabric is
   close to the written walk one step deep and, thirty steps deep, has
   two-thirds of its mass in states that are no node at all.
2. The obvious mechanism — five output cells, one per node, fit as a table
   of probabilities with every input row weighted alike — fails twice, and
   both failures are on screen: with no hidden spins half of every row's
   mass lands on the twenty-seven configurations that mark zero tokens or
   two, and with three hidden spins the rows are as good as the wires allow
   while the depth-thirty pane is still two-thirds red, because the fit
   weighted five rows alike and the walk visits the sticky node three times
   as often as any other.
3. Weighting each row by the walk's own visitation, on the same wires,
   drops the red bucket from 0.66 to 0.19 and the depth-thirty distance from
   0.66 to 0.49 without the cold rows paying for it — and leaves the chain
   at 0.49 with every row as good as it gets, because the loss is five terms
   and each is one step deep.
4. Fitting the trajectory instead of the table — run the chain thirty deep,
   score whole trajectories against the walk's law, nudge the parameters
   toward the better-scoring ones — takes the distance to 0.144 and the red
   bucket to 0.04, and makes the table wronger than at any point before
   (per-step KL 0.41 → 1.92, worst row 0.33 → 0.70), so a chain thirty deep
   is five times closer to the law than its worst row, and error along a
   chain is not a sum.
5. The compiled chain forgets: feed it two different starting distributions
   and their gap shrinks by a measured factor $\rho$ every step, so old
   errors fade as fresh ones arrive and the balance is the geometric series
   $\bar\varepsilon/(1-\rho)$, depth-independent — the walk from (1) climbs
   for a few steps and flattens under that line, and the healed walk, whose
   worst row puts its line above one, sits at 0.144 where the arithmetic is
   blind, because its rows were fit to cancel.

### Section ladder

**Thirty steps** (the intro and the hero; no section heading)

- Built: the walk compiled step by step, each step a kernel fit row by row
  the way Part 1 fit its copy gate — clamp the five input cells to the
  token's node, let the rest flicker, read the five output cells, descend
  the gap to the step's three probabilities.
- Failure, visible: drag depth to 30; two-thirds of the compiled pane is
  red. Measured: off-graph occupancy 0.662 at $T = 30$, tied ring, uniform
  weights (PLAN, 2026-08-06).
- Savior: the red bar counts twenty-seven states; the next figure lists
  them.
- Figure: OVERLAY on `WalkHero` — the two panes become occupancy-at-depth
  driven by a depth slider (`chainOccupancies` and `targetOccupancies`
  exist in `walkCompile.ts`); the live hopping tokens stay as staging on the
  fabric patch; the "quiet strip" goes. The kernel is the ladder's rung-one
  kernel (tied, nh = 3, uniform) instead of the untied one.
- Knob: depth, 1–30.
- Math: none. The patch's wiring is one sentence beside the figure ("wired
  by the chip's four offset rules, sixteen wires a cell"); the fabric is a
  black box here and stays one.

**Thirty-two states**

- Built: the node as five p-bits, one up and four down; the step as an
  energy model over five clamped inputs and five free outputs, no hidden
  spins; fit.
- Failure, visible: the output row over all 32 configurations, the five
  one-hots outlined, and about half the mass outside them (0.487 untied;
  [measure] tied). Cause on screen: with nothing between input and output
  the five output bits are independent given the clamp, and independent
  bits cannot say "exactly one of us."
- Reader by hand: adds hidden spins one at a time on the knob and watches
  the outside mass fall (0.487 → 0.229 at three, untied; [measure] tied).
  Counts the states: $2^5 = 32$, five of them nodes.
- Savior: three hidden spins leave a fifth of each row outside the nodes
  [measure], and the hero says what a fifth per step becomes at thirty —
  and the fit that produced these rows weighted all five alike, while the
  walk does not.
- Figure: OVERLAY on the `WalkFloor` fit machinery — one clamped input (a
  node picker), the 32-state output row drawn with the five one-hots
  outlined, outside mass printed; `invalidMass()` exists. Cost: the drawing
  of a 32-bar row and the node picker, half a day.
- Knob: hidden spins, 0–3.
- Math moment: $P^F(y \mid x) = \frac{1}{Z^F(x)}\sum_w e^{-E(x,w,y)}$,
  $Z^F(x) = \sum_{y',w} e^{-E(x,w,y')}$ — the sum over $w$ is the hidden
  spins the reader just added; boundary: no hidden spins, no sum, the
  factorized row of the failure. The per-input $Z$ is named in one clause
  and no debt is hung on it.

**Visitation**

- Built: the same fit with its loss made visible: five rows, five KL
  terms, equal weights — the compiler's default, because the compiler is
  handed the gate and not the program. The split-meter is introduced in one
  sentence beside the figure: left pane, per-row KL; right pane, occupancy
  at depth; under the left pane a warm wash for how often the walk sends
  each input — 0.43 on the sticky node, 0.14 on each of the other four.
- Failure, visible: under equal weights the left bars are as low as the fit
  pushes them and the right pane's red bucket at 30 holds 0.66; the tallest
  wash sits under a row the fit treated like the other four.
- Reader by hand: toggles the weights to the walk's visitation and refits
  on the same wires. Prediction prompt kept, because the common guess is
  wrong: the cold rows do not rise (measured, PLAN 2026-08-05). Red bucket
  0.66 → 0.19; distance at 30 0.66 → 0.49.
- The tied wires, stated as fact in one sentence beside the figure: the
  kernel's input wires are five numbers shared around the ring, not
  twenty-five private ones, standing in for a fabric that routes fewer
  wires than a fit would like; with private wires each row fits alone and
  weighting has nothing to move.
- Savior: every row is now as good as these wires allow and the chain sits
  at 0.49; the loss is five terms and each is one step deep; nothing in it
  can reach the right pane except through the left.
- Figure: `WalkLeak` REUSE (toggle, split-meter, glow), inside the
  `Predict` wrapper as now.
- Knob: the weighting toggle.
- Math moment: $D_{\mathrm{KL}}(K\,\|\,\tilde K) = \sum_y K \ln (K/\tilde K)$
  — the reader has been reading bar-against-ghost gaps on the left pane;
  this is the gap, weighted by how often the truth says each state, with
  the boundary that a starved state the truth visits costs infinity. Then
  $\mathcal L = \sum_x q(x)\, D_{\mathrm{KL}}(K(\cdot\mid x)\,\|\,\tilde
  K_\theta(\cdot \mid x))$ — the toggle is $q$. One clause for
  $c = \max_x q(x)/\mu(x)$: training uniform charges the sticky row
  $5 \times 0.43 = 2.14$ times its share.

**The trajectory**

- Built: a loss that is the chain. Run the compiled walk thirty deep, keep
  whole trajectories, score each by its distance from the walk's law at
  depth, nudge every parameter toward the trajectories that scored above
  average and away from the rest. In words only; inputs clamped, everything
  else free — one clamping pattern where Part 1's training needed two.
- Result, visible: 0.49 → 0.144; red bucket → 0.04.
- Failure, visible, the created one: the left pane rises. Per-step KL
  0.41 → 1.92; the worst row's TV 0.33 → 0.70 (untied → healed; [measure]
  the tied rung-two row). The table is the wrongest the article has fit.
- Savior: a chain thirty deep sits five times closer to the law than its
  worst row; whatever error does along a chain, it does not add.
- Figure: `WalkLadder` REUSE with one OVERLAY — three rung buttons so the
  reader can sit on a rung and read both panes still, instead of watching
  stairs animate. Cost: an hour.
- Knob: the rung.
- Math moment: none displayed. The reader did nothing by hand that the
  REINFORCE gradient formalizes; it stays in words.

**Forgetting**

- Built: the naive arithmetic, stated: thirty rows each wrong by the worst
  row's error add to thirty times it — more than one, the walk lost
  entirely.
- Failure, visible: the depth curve for the opening kernel climbs for a few
  steps and flattens. Measured on the floor kernel (untied, nh = 2): 0.305
  at forty deep, moving $7 \times 10^{-5}$ over the last twenty steps
  [measure on the tied opening kernel].
- Reader by hand: feeds the compiled chain two different starting
  distributions and reads their gap by depth; the ratio of consecutive gaps
  is printed and settles — 0.753 on the floor kernel: each step keeps
  three-quarters of yesterday's gap and forgets a quarter.
- Math moment: $\bar\varepsilon(1 + \rho + \rho^2 + \cdots) =
  \bar\varepsilon/(1-\rho)$ — the ratio the reader just read, summed:
  $0.177/(1 - 0.753) = 0.718$, drawn as a line; the curve sits under it at
  0.305. $\rho$ is the chain's slowest surviving mode, not a per-step
  guarantee, and the line is checked against the curve, not proved — one
  sentence, beside the figure.
- Knob: hidden spins, two / none. With none the worst row is so wrong that
  $\bar\varepsilon/(1-\rho)$ passes one and the figure prints that it
  bounds nothing; the curve still flattens, at 0.77. The plateau belongs to
  the chain; the line belongs to the capacity.
- Savior: the healed kernel's worst row is 0.70, its line by this
  arithmetic is above one, and its chain sits at 0.144 — the hero at the
  top, again.
- Figure: `WalkFloor` REUSE plus one OVERLAY — a second pane with two
  starting distributions propagated side by side and the gap ratio printed
  (`chainContraction()` exists; two-start propagation is a dozen lines;
  the pane, half a day).

**Thirty steps, again** (the return; no new heading beyond the hero's)

- Figure: the hero, OVERLAY — kernel toggle (opening / healed), the ceiling
  line drawn for whichever kernel the arithmetic can bound, per-step KL
  printed beside the depth distance. The one-step panes at $T = 1$: opening
  TV 0.265, healed 0.140 (untied; [measure] tied).
- What is on screen: at 30 the opening kernel's two-thirds is a plateau —
  under a drawn line if the tied opening kernel's $\bar\varepsilon/(1-\rho)$
  is below one, and printed as "bounds nothing" if it is not; either is the
  article's own fact and the prose says which. The healed chain at 0.144
  under no line the arithmetic can draw, its table the wrongest fit, its
  one-step panes closer than the opening's.
- Then Further Reading (the two papers; Levin–Peres for $\rho$ as
  mathematics) and Final Words.

No Waypoint blocks. The split-meter is the one tool a later section
consumes, and it is stated as a black box in a single sentence beside its
first figure in **Visitation**. One prediction prompt, the one whose common
guess is wrong.

### Debts

- The red bucket (hero) — named in **Thirty-two states** (the twenty-seven
  configurations), mostly emptied in **Visitation** (0.66 → 0.19), printed
  at 0.04 in the return.
- "Every number the fit minimized was measured one step deep" (thesis) —
  paid in **Visitation** (the loss's five one-step terms, shown) and **The
  trajectory** (the first number fit at thirty).
- The one-step panes at the knob's left end (hero) — paid in the return:
  closer with the wrongest table.
- The visitation wash (**Visitation**) — paid in the same section by the
  toggle; nothing carried.
- The worst row, 0.70 (**The trajectory**) — paid in **Forgetting** (its
  line is above one) and the return.
- $\rho$ (**Forgetting**) — paid in the return, as the line on the hero.

Nothing is planted for a sibling article. The current L169 "loophole"
(λ-shift) and L352–356 "shadow" (mixing) are not planted because they are
not paid here.

### Math budget

In order of arrival, each after the reader's own act:

1. $2^5 = 32$ against 5 — arithmetic in prose, after counting the row.
2. $P^F(y \mid x) = \frac{1}{Z^F(x)}\sum_w e^{-E(x,w,y)}$ — after adding
   hidden spins on the knob.
3. $D_{\mathrm{KL}}(K \,\|\, \tilde K) = \sum_y K(y\mid x)\ln\frac{K(y\mid x)}{\tilde K(y\mid x)}$
   — after reading bar-against-ghost gaps on the per-row pane.
4. $\mathcal L = \sum_x q(x)\, D_{\mathrm{KL}}\big(K(\cdot\mid x)\,\|\,\tilde K_\theta(\cdot\mid x)\big)$,
   with $c = \max_x q(x)/\mu(x)$ in one clause — after toggling $q$.
5. $\bar\varepsilon(1 + \rho + \rho^2 + \cdots) = \bar\varepsilon/(1-\rho)$
   — after reading the gap ratio off the two-start pane.

Five displays. The current article carries eleven (the offset rule set,
$P^F$, KL, $\mathcal L$, $c$, the floor, the λ identity, the two-spin
barrier, the meta-EBM logit, the softplus pair, the gate decomposition).

### Ending

The hero at thirty with both kernels under the reader's thumb. The opening
kernel's two-thirds was a plateau, not a runaway; the line over it, where
one can be drawn, is two numbers the chain reports about itself. The healed
kernel's worst row is 0.70 — its line is above one, the arithmetic says
nothing — and the chain sits at 0.144, with its one-step panes closer to
the written walk than the opening's were. The per-step meter bounds the
chain from above and cannot see cancellation; the last rung was fit
entirely where that meter is blind. The verdict the ending calls: a
compiler is judged at depth; the table's error is a ceiling on the chain's,
never its size; the rung that fit the chain directly bought what no table
fit could, and paid in a table no one-step meter would pass.

Swap-test: the ending names the opening's two panes, the 0.70 row, and the
0.144 chain under a line above one. Part 3's chains do not have a healed
kernel with a condemned table; Part 1 has no chain. It cannot be moved by
changing nouns.

### Cut list

- **Four moves and a checkerboard** (L49–132; `Neighborhood`,
  `ParityToggle`, `Z1Layers`, `AsymmetricLoop`) — the fabric's own physics;
  no failure in the walk needs it; the hero's patch is wired by the four
  rules and one sentence says so. `Z1Layers` is banked (a flat die
  re-hung into a layered machine is a figure for a fabric article).
- **Clamp, marginalize, normalize** as a section (L143–170;
  `PartitionFigure`) — the formula moves into **Thirty-two states** as the
  formalization of the hidden-spin knob; the roles are the three colours on
  the hero's patch.
- `SplitMeterTeach` (L217–226) — its depth knob is the hero's knob now.
- The inflation-factor paragraph (L265–279) — reduced to one clause; the
  reader toggled $q$ and does not need the bound narrated.
- The tied/untied confession (L237–243) and reconciliation (L659–664) —
  gone by running one capacity end to end; one flat sentence states the tie.
- **What the forward law cannot see** (L358–396; `LambdaShift`) — a lemma
  with no failure driving into it, and the plant that announced it (L169)
  goes with it; the equivalence class of energies is a backward-compilation
  article's opening fact, banked.
- **The mixing tax** (L410–469; `MixingDial`) — a second specimen; the price
  of couplings in sweeps is the bill's subject, which is Part 3's.
- **The bill** (L471–522; `CostStrip`) — Part 3 opens by restating every
  rate in full (`thermo-03-diffusion.mdx` L14–28); the placement pane
  (13 → 51 cells) goes with it.
- **Sampling the impossible** (L534–651; `MetaImpossible`, `SoftProduct`,
  `MetaEbmChain`) — a second specimen with its own story; banked as an
  article seed: hero, a three-body law sampled through pairwise wires; spine,
  one hidden spin is one product term.
- The three Waypoints (L134–141, L398–408, L524–532) — inventories; none
  hands the next act a tool it consumes.
- The `MixingDial` prediction (L440–446) — the common guess is right.
- Aphorisms at L46–47, L428–429, L511–512, L729–730 — one thesis, in the
  intro.
- The market-simulator dessert (L677–681) — another specimen's numbers; one
  clause in Further Reading if at all.
- Final Words (L722–735) — rewritten from the hero; the current one is a
  recap plus a certificate.

Sibling debt, flagged not paid: Part 3 references this article for the
fabric patch (its L13), the price list (L22, L59), the mixing tax (L242),
the clamped-spin exemption (L250), the layer figure (L329), and the floor
(L392). After this rewrite Part 2 still delivers the kernel and the floor;
the price list, the mixing tax, the exemption, and the layer figure would
move into Part 3's own first act, which already restates the rates. That is
a series-level change and is not made here. The registry blurb ("pay the
three taxes — embedding, context, mixing") describes the cut article and
would change.

## Part 3 — The intro

The Z1 chip from Part 1 does one thing: every cell resamples itself from as
many as sixteen wired neighbours, between one and ten million times a
second, on a graph fixed in silicon. A program is a chain of conditional
tables, each step's output the next step's input. The program below is a
walk: five nodes in a ring, a token that moves clockwise six times in ten
from four of them and, at the fifth, stays put seven times in ten.
Compiling one step means fitting a patch of the fabric — the five input
cells clamped to the token's node, the rest flickering — until the five
output cells, read back, come as close to that step's three probabilities as
the fit can push them. Thirty steps deep, two-thirds of the compiled walk's
mass sits in states that are no node at all. Every number the fit minimized
was measured one step deep, and the walk runs thirty.

Hero: the walk's occupancy after $T$ steps, written (left) and compiled on a
patch wired by the chip's four rules (right), six bars each — five nodes
and a red no-node bucket — both exact; the one knob is depth, 1 to 30.

Audit, one line per sentence:

1. "The Z1 chip from Part 1 does one thing…" — facts: Gibbs resampling from
   wired neighbours; degree sixteen, "mostly regular" (Thermalizers §II B,
   hence "as many as"); $10^6$–$10^7$ iterations per second (§II B); the
   graph hardwired in silicon (Torx §IV.2). Rule 1: no later payoff spent.
   Rule 2: nothing scheduled. Rule 3: subject is the chip. Rule 4: opens on
   a chip and a cell. Rule 6: no "imagine." Rule 8: the two hedges are the
   papers' own ranges. Topic-swap: fails for any other subject. Delete:
   loses the constraint that makes compiling necessary. Who's talking: the
   physicist. Nick test: no rule instantiated.
2. "A program is a chain of conditional tables…" — fact: a stochastic
   program as a directed factor graph of Markov kernels, output to input
   (Thermalizers Fig 1). Disputable (an expert can raise branching graphs)
   and therefore content. Rules 1–4, 6, 8 pass; all four tests pass.
3. "The program below is a walk…" — facts: `targetKernel` in
   `walkCompile.ts`: right 0.6 at four nodes, stay 0.7 at node 0. "Below"
   is a camera move to the figure. Rules 1–4, 6, 8 pass; the four tests
   pass.
4. "Compiling one step means fitting a patch…" — facts: clamp $x$, Gibbs
   the rest, read $y$ (Thermalizers §II A); the fit descends a per-row gap
   and does not reach it — "as the fit can push them" is a hedge doing
   epistemic work. Rule 1: the loss's form is not spent, only its existence.
   Rules 2–4, 6, 8 pass; the four tests pass.
5. "Thirty steps deep, two-thirds…" — fact: off-graph occupancy 0.662 at
   $T = 30$, tied ring, uniform weights (PLAN, measured 2026-08-06). This is
   what the hero shows, not what a later section earns; the explanation is
   the article. Rules 1–4, 6, 8 pass; the four tests pass.
6. "Every number the fit minimized was measured one step deep, and the walk
   runs thirty." — facts: the loss is $\sum_x q(x)\,D_{\mathrm{KL}}$ over
   one-step rows with no depth term; $T = 30$ on the figure. Disputable (an
   expert would say a trajectory loss exists — which is the article's fourth
   section) and therefore content. The thesis, a full sentence, last. Rules
   1–4, 6, 8 pass; the four tests pass.

No sentence's only content is an effect on the reader; none was cut on
re-audit. No metaphor; "flickering" is Part 1's term for a p-bit's state
changes, not an image. No aphorism opens. Against the p-bits winner: no
inversion of a daily-familiar object, no fragment at the end, six sentences
of unequal length, the thesis carrying two facts joined by "and."
