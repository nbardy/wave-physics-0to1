# A Computer Made of Noise — reimagined

Source read: `src/lessons/physics-02-pbits.mdx` (1,032 lines, ~8,500 words, 28
mounted figures, 4 Predicts, 4 Waypoints). Line numbers below refer to that
file. Brief: `redrafts/fable-2026-09-02/00_VOICE_DOCS_CRITIQUE.md` §4.

## Part 1 — The read

### Odile

Firmware engineer. Writes DSP for hearing aids, has a side project with a
two-layer net, knows a sigmoid by its formula and by its shape. Never took
statistical mechanics. Someone on her team sent the link with "this is the
Extropic thing."

**L29–35.** Transistors margined, clocked, error-corrected — she knows this;
she has fought a noisy ADC for a month. "A chip now exists that runs on the
noise instead." She wants the chip's name and does not get it. "The flipping
is the computation." She has a slogan and no mechanism. Her guess for what
comes next: the Ising GIF from Wikipedia, with a temperature slider.

**L37–41.** "Randomness is the one output the eye cannot audit." True, she
thinks; she has stared at noise floors. Then "confidently, permanently wrong"
and "every energy readout applauds it" — the sentence is enjoying itself, and
it is telling her the ending: a fast sampler that is half a distribution off.
"This lesson builds the instrument that can catch it lying." Now she has the
plot. She will spend the next twenty minutes waiting for the instrument
instead of looking at what is on screen.

**L43–53.** Forty small lattices. She watches. A bar, a cross, a box. Her
first thought, within five seconds: tiny stable diffusion. She finds the
paint-box, paints a diagonal, presses train, waits about a second, and sees
green rings appear on cells that landed on her diagonal. That is the thing
she would show someone. "On credit" — fine. "The wall returns at the end" —
she is told the ending's shape for the second time in fifteen lines.

**L55–56.** She was not thinking about quantum mechanics. Now she is.

**L58–91.** Fair coin, flat histogram. Bias knob; the histogram leans. She
sweeps and the dots draw an S. She recognizes it before the equation: this is
her activation function. "That S-shape is yours" — she dragged a slider. Then
$\sigma(2h)$, and she stops on the 2. Why 2? Nothing here says. She files it.
The "comparator listening to its own thermal noise" clause is the sentence she
wanted at L32, and it ends with "drawn in full when the machine itself
arrives," so she is waiting for a second thing now.

**L93–122.** Amber, blue, warm, cool, green ring, violet arc. Six colors in
one paragraph. She taps cells; arcs move on neighbors only. Nothing is failing
here and nothing is being built; she reads faster. The rail — TARGET · ENERGY ·
SAMPLER · SUBSTRATE — she reads as a UI legend and never looks at again.
"Every figure from here to the end of the lesson speaks this vocabulary" — she
is being told what the lesson will do, again.

**L124–193.** Two p-bits, a two-part target: agree at 0.9, stay fair. She is
told to cheat and cheats: both knobs to the rail, agreement past the mark,
needles red, the lower gauge dead at zero. She gets it in her body before the
prose says it: she made two constants equal. "What's missing is a wire." This
is the first place she feels she found something rather than was shown it.
The Predict: disagree-wire, which bars grow — she picks the inner bars and is
right, and learns nothing from being right. The field gauge and the
$\sum_j J_{ij} s_j$ line: she reads the equation as code — gather neighbors,
weighted sum, sigmoid. The covariance line she already knows. She is slightly
proud of the section and slightly tired.

**L195–334.** Four p-bits in a ring; "frustration keeps it interesting." Page
one: tap a column, wires total. Page two: β knob, exponential. Page three: the
stacked total, divide. Page four: an average. She is on her fourth page of
the same figure and her thumb has started scrolling before the page finishes
rendering. Page five: pin three cells, two numbers agree to the last digit,
and the derivation explains the 2 from L85 — $E_+ - E_-$ is twice the field.
She reads that twice. It is the thing she would have opened the article for,
and it arrives at minute twenty-five under a heading about an atlas. Then the
meter: gray, violet, a number, a band that shrinks as $\sqrt N$. She knows
$\sqrt N$ from averaging ADC samples. Waypoint: "Everything that follows is an
attack on that number's floor." Told the plot a third time.

**L336–400.** 256 cells. She presses all-at-once: crosshatch, meter up and
pinned. She sees it. Then the state graph: a dot on a map, chords instead of
edges. "But look carefully at what the chords do and do not prove … The crime
is somewhere else. Here is where." She notices the chords were introduced in
order to be dismissed. The write-conflict panel: rings, 480 red wires. This she
gets completely and immediately — it is a data race. Two threads each reading
the other's stale value. She would retell this tomorrow: *the parallel version
is literally a race condition, and the fix is a two-phase clock.*

**L401–500.** Checkerboard. The Predict asks where the meter lands; she picks
"between" and is wrong — it is the floor. That one she keeps. The product
equation makes sense to her because she has just seen zero red wires. The
race: both traces hit the dashed floor, the meters differ by twenty times. She
gets the verdict. Then the dashboard: three columns, an autocorrelation time,
a struck-through row. She reads it as a benchmark table and skims. Z1,
quarter-million, bipartite, 300 picojoules — the chip's name, forty-eight
minutes in. "The schedule is the machine." Then Z1Layers: "Hang the whole
graph by those three cells" — she does not know why she is looking at this
and the prose does not say what it is for.

**L535–674.** The comparator with its lid off — the figure she was promised at
L74 — dots landing on the same S. She likes this and would have liked it at
L74. The dictionary table: fine. The X0/Z1 lineage paragraph reads like a
product page. The manual: she drags to couple two unwired cells and it snaps
back; she already believed it. The triangle and its chain spin: she is now
reading about embedding, which she did not come for. Nonideality: ±60 percent,
a tenth — numbers she cannot place. Fifty-five minutes.

**L676–789.** A kernel table; Torx; PNOT, PSWAP. Drag $J$ until 10 percent —
she finds 1.1 and then reads $\tfrac12 \ln 9$; that one she keeps too, because
her hand found it. The general kernel formula with sums over $w$ she does not
read. XOR needs a hidden spin: she guesses yes and is right. Thermalizers,
THRML, a stack figure with layers to tap, p-dit, p-mode, "a story for a
sequel." She counts product names on her fingers and runs out. If a
colleague had not sent this she would close the tab at the stack figure.

**L791–975.** Filmstrip, two phases, a subtraction. She knows contrastive
divergence by name and has never seen it; the strips creeping together is the
first time she believes it. The factorized dreams — half a box welded to half
a checker — she sees before the prose says it. The synchronous-trained dreams
that "do not look broken" — the L336 race condition is back inside the
weights; she gets why that is worse. The wall returns; she guesses "sometimes
between" and is right. She paints again.

**L977–1032.** "Every resistor in the room with you is flickering right now."
She looks at her charger cable. That she keeps.

What she retells tomorrow: the race condition and the clock; the two machines
that both solved the puzzle and one was wrong; the 2 in $\sigma(2h)$ finally
explained. What she does not retell: anything with a product name.

### Bram

Has read all of Ciechanowski, some of it twice. Has read this site's lessons
01 and 02 and remembers the crime scene in one and the confessions in the
other. Reads with the author's hand in mind.

**L29–35.** He has read this paragraph before — it is the worked example in
INTROS.md. It is fine. He waits to see whether the article keeps its own
rule.

**L37–41.** It does not. Second paragraph: "confidently, permanently wrong,"
"applauds," and "this lesson builds the instrument." A second protagonist
announced, the marquee scene spent (a sampler "half a distribution from the
law" — he will meet that number at L461 as news that is not news), and the
subject of the last sentence is the lesson. He predicts a meter that will be
reintroduced at every act boundary. He is right four times.

**L43–53.** Forty diffusion chains at 4×4. He has seen noise become an image
more times than he has seen the Ising model. The only unfamiliar thing is
the size, and he asks why 4×4 and does not get the answer (enumeration) until
L799. "The weights … ship with this page unexplained — on credit" is the
IOU, correctly flat. "The wall returns at the end" is the schedule the
previous sentence had avoided.

**L55–56.** "One amnesty up front." Planning-doc vocabulary in print. He
notes the word and keeps a tally.

**L58–91.** The S-curve drawn by hand before it is named — this is the site's
move and it is done properly here. "That S-shape is yours; the figure only
recorded it" is the author congratulating him for dragging. "The coin stays
with us as the metaphor; p-bit is the working word from here on" — a style
decision from a planning doc, printed as prose. Tally: two.

**L93–122.** A representation section with no figure that fails. Ciechanowski
teaches the display inside the first figure that needs it. Then the rail: a
four-slot chrome named and explained, "a pipeline this lesson refuses to
blur." The article is describing its own furniture. Tally: three. He would
close the tab here if he were not reading for the purpose of noticing.

**L124–193.** The cheat is real and the connected gauge is a real
instrument; he feels the failure. "There is a cheat, and you should take it"
is a hand on the back, but the physics behind it is honest. The Predict is a
quiz whose answer is the obvious one. The covariance line is earned by the
cheat. This section survives his read.

**L195–334.** Five pages of one figure, each page introduced by a question
the author asks himself — "The first page asks each state what it costs,"
"The weights have one defect," "The last page of the atlas is the one the
rest of the lesson stands on." An atlas is a tour by definition. The
conditional derivation on page five is the article's best mathematics and is
placed as the last stop of a tour. The meter that follows is announced as "a
permanent instrument," and the Waypoint ends "Everything that follows is an
attack on that number's floor" — trailer. Tally: four.

**L336–400.** All-at-once pins the meter; the crosshatch is real. Then the
state-graph chords: "But look carefully at what the chords do and do not
prove … The crime is somewhere else. Here is where." Two suspects, one of
them innocent by construction, a beat of suspense, the planned reveal — the
family-17 shape exactly. And "crime": lesson 01's device, now on its third
article. The write-conflict panel that follows is the real argument and would
have stood alone.

**L401–534.** The race is the article. Both traces reach the certified floor;
the meters differ twenty-fold; "optimization success is not sampling
correctness." That is the scene he would send someone. It sits at 45 percent
of the page, after "Stage the fight fairly" (a stage direction) and before a
dashboard with a struck-through row and a figure (Z1Layers) whose own caption
says "Nobody designed that architecture" and does not say why it is here.
"One confession about the drawing" — lesson 02's device. Tally: five.

**L535–789.** Nine proper nouns in two sections: X0, Z1, Torx, PNOT, PSWAP,
Thermalizers, THRML, p-dit, p-mode. A comparator figure that belongs at L74.
A manual of four verbs, a triangle, a nonideality knob, a kernel table, a hand
compile, an XOR, a stack diagram with tappable layers. He asks, at each
figure, what the wall on top needs from this, and the answer each time is
nothing. The article has stopped being about the object and started being
about the company. He closes the tab at "a story for a sequel, not this
lesson" (L779) — the article telling him what it is not.

**L791–975 (returns the next day).** The two-phase trainer is honest and the
factorized-dreams failure is the two-coins failure at sixteen cells, named
correctly. The synchronous-trained dreams are the one long-range payoff that
works as engineering: the L336 failure retires into the weights. "That is not
a defect to apologize for" — nobody asked for an apology. "The wall that
opened this article is back — the one that flickered before any of its
vocabulary existed, running weights it promised to explain" — the ring
narrating itself.

What he retells: the race, and that it was buried in the middle of three
articles wearing one title.

### STORY

The five sentences the current article implies:

1. Forty sixteen-cell lattices flicker and a bar, a box, a cross condense out
   of the static; every cell is a coin toss on weights that ship unexplained.
2. Then we look at one coin: fair, its histogram is flat; with a bias knob it
   leans, and a sweep of the knob traces an S-curve.
3. Two biases cannot make two p-bits agree while both stay fair, and a wire
   can — then we look at a state atlas, five pages of it, and then we look at
   a meter.
4. One-at-a-time is serial on 256 cells; all-at-once pins the meter while
   still finding low energies; freezing one color of a checkerboard while
   writing the other drops it to the floor, and that schedule is the chip —
   then we look at the comparator, the manual, the triangle, the nonideality
   knob, the kernel table, the copy gate, the XOR, and the stack.
5. Then we look at bit-flip corruption and a two-phase trainer; the wall
   returns, and the failures from (3) and (4) reappear in its dreams.

Two of the five have a mechanism failing (3, 4). Sentence 2's failure — a fair
coin computes nothing — is not the failure of any mechanism proposed for the
hero; nobody proposed fair coins for the wall. The hero from (1) is paid only
by (5), and (5) is the machinery of the third article in the series. The
middle of (4) is inventory.

**Current hero:** the wall of forty dream chains. Familiarity: the object
(forty 4×4 lattices) is not something a reader has seen; the idea it depicts —
an image condensing out of noise — is the most reproduced image in machine
learning this decade, and both readers filed the hero as "tiny diffusion"
within ten seconds. Cost: the wonder gap collapses into "why so small," and
the answer (exact enumeration) arrives at L799. A second cost: nothing between
L58 and L888 threatens the wall. The hero is never in jeopardy, so no section
is a rescue of it.

**Specimen:** hosts. Roughly 2,900 of 8,500 words are Extropic's own
catalogue — the comparator lineage, four verbs, embedding, nonideality, Torx,
Thermalizers, THRML, PNOT, PSWAP, p-dit, p-mode, the stack figure, Z1Layers.
The mathematical object — a local rule whose dwell-times are a global law, and
the schedule that breaks the identity — occupies §§3–6. Parts 2 and 3 of the
series already own the compiler and the trainer respectively (`physics-03-z1`
"Compiling Into Heat"; `thermo-03-diffusion` "Diffusion on a Dreaming
Machine"), so the specimen material here is also a duplicate.

### PROSE

Each line quoted exactly, with the test it fails.

- L40–41 "So alongside the machine, this lesson builds the instrument that
  can catch it lying." — disputability: nothing to dispute; the sentence
  schedules, and its subject is the lesson.
- L38–40 "a fast, plausible-looking sampler can sit half a distribution from
  the law while every energy readout applauds it." — performance ("applauds"),
  and it spends the L456–465 race.
- L52–53 "The wall returns at the end, dreaming a picture you painted, on
  weights trained in front of you." — performance: the subject is the reader's
  coming experience; nothing here is a fact about the machine.
- L55 "One amnesty up front: there is no quantum mechanics anywhere in this
  article." — disputability: the subject is the article; "amnesty" is
  planning-doc vocabulary.
- L72–73 "The coin stays with us as the metaphor; p-bit is the working word
  from here on." — disputability: a style-guide decision, not a fact about
  the machine.
- L82 "That S-shape is yours; the figure only recorded it." — performance
  (warmth); undisputable.
- L108–109 "Every figure from here to the end of the lesson speaks this
  vocabulary and no other." — disputability: schedules; subject is the lesson.
- L118–119 "The small rail in each figure's corner — TARGET · ENERGY · SAMPLER
  · SUBSTRATE — names a pipeline this lesson refuses to blur" — disputability:
  the article describing its own chrome.
- L135 "There is a cheat, and you should take it: crank both knobs to the
  rail." — performance: an imperative staging the reader's move.
- L200 "The system is *frustrated*, and frustration keeps it interesting" —
  performance: interest asserted rather than shown; undisputable.
- L332–334 "Everything that follows is an attack on that number's floor." —
  performance: trailer register; schedules.
- L371–375 "They do not say it is an unlawful one — moving many p-bits in one
  tick is something a perfectly legal schedule can also do, and one is about to
  rescue this grid. The crime is somewhere else." / "Here is where." —
  performance: a suspect erected to be dismissed, plus a schedule ("about to
  rescue"); repetition: "crime" is lesson 01's device.
- L434 "Stage the fight fairly." — performance: a stage direction with no
  content about the machine.
- L503 "One confession about the drawing:" — repetition: lesson 02's device,
  redeployed as a caption frame.
- L957–958 "That is not a defect to apologize for." — performance:
  reader-management; nobody asked; undisputable.

## Part 2 — The new outline

### Hero

One artifact: a sixteen-bit frustrated glass — 4×4, twenty-four unit wires,
nine agree and fifteen disagree, three of its nine plaquettes unsatisfiable —
run twice on one canvas. Left pane and right pane are the same bits and the
same wires under two schedules that are not named. Each pane carries its
energy trace falling to a dashed floor certified by enumeration (−20), and
under each pane a number: the distance between how often the pane visits
each energy rung and how often the exact law says it should. Left reads about
0.03; right reads about 0.65. One knob, shared by both panes: coldness (β).

This is `Race` with two changes — the schedule labels hidden, and a β knob
whose ghost is re-enumerated per setting (65,536 states, milliseconds). At
the end the same figure returns with its labels on: the left pane is the
two-phase clock the Z1 runs in silicon, the right is the same chip with a
one-phase clock; the number under each is a count the reader performed at
four bits; and the knob does what the law predicts — both numbers fall toward
zero at the hot end, and only the left stays at the floor as the glass cools.

Familiarity cost, stated: a flickering grid of cells is Ising-adjacent, and a
physics-curious reader has seen an Ising GIF. That is the whole familiar
part. Two audited panes that both solve the same problem and disagree by
twenty-fold on a number nobody has seen — the reader cannot have seen this,
because the number is the thing the article builds. The trade against the
current hero: this one is visually smaller (sixteen cells, not six hundred
forty) and its idea is not the most familiar image of the decade.

Why not keep the wall: it is Part 3's hero, and paying it costs the training
act — a third of the current article — which is Part 3's subject.

### Thesis

What a computer made of noise outputs is not a state but a frequency — how
often each state comes up — and a frequency can be wrong while the best state
it finds is exactly right.

### The five sentences

1. Two sixteen-bit lattices with the same twenty-four wires run the same
   frustrated problem; both energy traces reach the certified minimum within
   tens of sweeps, and the number under the left pane reads about 0.03 while
   the number under the right reads about 0.65 — nothing in either pane's
   flicker says which is which or what the number counts.
2. The obvious way to build a computer out of noisy bits is to give each bit
   a lean — a bias current on a threshold that thermal noise carries across —
   and a lean sets how often one bit is up, but no pair of leans makes two
   bits agree: the connected-agreement gauge sits at zero at every setting,
   and the only settings that reach the agreement mark are the ones that stop
   both bits flickering.
3. A wire between the two bits buys agreement while both stay fair, and
   creates the problem the number answers: once bits are wired, the machine's
   output is a share of time per joint state and nothing on screen says what
   the shares should be — so a four-bit loop's sixteen states are counted by
   hand, energy by energy, the shares come out as $e^{-\beta E}/Z$, and the
   live loop's dwell-times held against that count is the number.
4. The count is $2^n$ additions and one-at-a-time is $n$ turns per sweep, so
   at 256 cells the count dies unless a patch is fenced by held neighbors, and
   the obvious repair to the turns — write every cell at once — pins the
   fenced number several times above the floor while the lattice looks fine,
   because every wire joins two cells written in the same instant; freezing
   one color of a checkerboard while writing the other removes every such
   wire, drops the number back to the floor with half the lattice written per
   tick, and is the schedule the Z1 runs.
5. The two panes from (1) are the checkerboard clock and the all-at-once
   clock on one glass; the number under each is the distance between the
   dwell-shares the reader counted and the ones the pane produced; and the
   coldness knob does what $e^{-\beta E}/Z$ predicts — both numbers fall
   toward zero at the hot end, and only the left pane's stays at the floor as
   the glass cools.

### Section ladder

**One bit.**
Naive build: a bit that flips at random — a fair coin, histogram flat, and
nothing the reader sets changes it. Visible failure: the hero's lattices
spend most of their time in a few assignments; their bits are not fair
coins. Built: a bias knob; the histogram leans; a slow sweep leaves a dot per
stop and the dots draw an S. Then the same cell with its lid off: a bias
current, thermal noise riding on it, a comparator asking whether the sum is
above zero; sweep the current and the measured flip-rate dots land on the
same S. Savior: a lean is a fact about one bit; the assignments the hero
sits in are facts about which neighbor matches which, and two leans do not
buy one of those. Figures: `BitFlicker` REUSE; `BitFlicker trace` REUSE;
`Microscope` REUSE (moved here from the chip section). Knob: the bias, which
in the third figure is the DAC current. Math: $P(s{=}{+1}) = \sigma(2h)$,
formalizing the curve the reader's sweep drew; boundary check at $h \to \pm\infty$
(flicker dies) and $h = 0$ (fair coin). The 2 is left standing as a debt.

**Two bits.**
Naive build: two leans, and a two-part target — agreement 0.9 with both
needles at fair. Visible failure: the connected-agreement gauge sits at zero
at every pair of settings; the only settings that reach the mark pin both
needles to the rail and kill the flicker. Built: a wire; the outer bars swell
under agree, the inner under disagree, both needles at fair, the connected
gauge climbing with the raw one. Then the right bit's field gauge: its bias
plus the wire's weight times what the left bit shows this instant. Savior:
with a wire, the four bars settle at heights nothing on screen predicted;
for four bars, the heights can be counted. Figures: `PairCoupler
mode="biases"` REUSE; `PairCoupler mode="wire"` OVERLAY (the gray exact
outlines hidden — the count has not been performed yet); `PairCoupler
mode="wire" fieldGauge` REUSE. Knob: $J$. Math: $P(s_i{=}{+1}) =
\sigma\!\left(2\left(h_i + \sum_j J_{ij} s_j\right)\right)$ after the field
gauge; $\mathrm{Cov}(s_1,s_2) = \langle s_1 s_2\rangle - \langle s_1\rangle
\langle s_2\rangle = 0$ under separate leans, formalizing the zero the
reader's cheat produced. No prediction prompt — the common guess (inner bars
under disagree) is right.

**Four bits.**
Naive build: the loop should sit in its cheapest state. Four bits in a ring,
three agree-wires and one disagree: no assignment satisfies all four, eight
states tie for cheapest. Visible failure: the loop does not sit; it moves
among the eight and visits the upper shelf a measurable fraction of the
time, and the fraction changes with coldness. Built, one page per delta on
the same sixteen columns: tap a column and its wires total (energy); read the
ratio of two column heights at two coldness settings (an exponential of the
energy gap); divide by the visible stacked total (shares that sum to one);
then a live four-bit loop running the two-bit rule, its dwell-shares in violet
against the counted shares in gray, and their gap folded into one number that
falls as evidence accumulates, with the $\sqrt N$ band. Then the question that
is live: the rule was written at two bits and never consulted the count —
pin three of the four and the free bit's counted share equals $\sigma(2\beta
\cdot \text{field})$ to the last digit, and two lines say why. Savior:
sixteen states is sixteen additions; the chip has a quarter-million bits, and
one turn per bit per sweep. Figures: `StateAtlas mode="energy"` REUSE;
`StateAtlas mode="weight"` REUSE; `StateAtlas mode="normalize"` REUSE;
`MeterForge` REUSE; `StateAtlas mode="conditional"` REUSE. The observable
page is cut. Knob: coldness $\beta$, the hero's knob, on every page. Math, in
order: $E(s) = -\sum_{(i,j)} J_{ij} s_i s_j - \sum_i h_i s_i$ after the
reader tallied wires; $w(s) = e^{-\beta E(s)}$ after the reader read the
height ratio at two $\beta$; $Z = \sum_s e^{-\beta E(s)}$, $p(s) =
e^{-\beta E(s)}/Z$ after the stacked total; $\mathrm{TV} = \tfrac12 \sum_s
|p(s) - q(s)|$ after watching the gap between gray and violet; the
conditional, $p(s_i{=}{+1}\mid\text{rest}) = \sigma\!\left(2\beta\left(h_i +
\sum_j J_{ij} s_j\right)\right)$, after the two readouts agreed — which pays
the 2. One flat sentence ties the hero: the number under each pane of the
first figure is this distance, taken over energy rungs rather than states.

One Waypoint here, the only one: two black boxes go forward — the count (for
any lattice small enough to enumerate, the exact share of time per state,
and the distance between that and what a running lattice does) and the slice
(one bit's share given its neighbors' states is the S-curve of its field).
§§4–5 consume both.

**Two hundred fifty-six bits.**
Naive build: the count on 256 cells — $2^{256}$ — dead. Repair: a fence.
Hold the eight neighbors of a 2×2 patch across a domain wall; the patch's law
given the fence is the slice, sixteen states again, exact; the number lives on
the patch. Second naive build: one turn at a time — correct, idling at the
floor, and 256 turns per sweep. Obvious repair: write every cell at once.
Visible failure: the lattice crosshatches, and the number climbs several-fold
and pins — more evidence does not lower it. (The check script asserts the
all-at-once number above three times the legal schedules' and the legal
schedules' below 0.08; the prose prints the figure's own two numbers, not
"an order of magnitude.") The discriminator: freeze the grid at one dispatch,
ring every cell being written, redden every wire joining two ringed cells —
480 of 480. Each of those wires is a bit deciding on its neighbor's state
from before the tick, not "this instant" as the two-bit gauge promised.
Savior: the number that separates the schedules is the red count, not how
many cells move per tick; a schedule that writes many cells and reddens no
wire keeps the speed. Figures: `GridSchedules` REUSE; `WriteConflict` REUSE.
The state-graph chords are cut. Knob: the schedule toggle (one at a time /
all at once). Solver, one sentence beside the grid: every lattice on this
page runs one loop — gather the neighbors, sum the field, one S-curve, one
counter-hashed uniform, write ±1 — and the schedule is the only thing the
toggle changes. Math: none new; the fence consumes the slice.

**Two colors.**
Repair: color the grid like a checkerboard; every wire joins a red cell to a
black one; freeze black, write all 128 red at once, then swap. Prediction
prompt, the article's only one: red/black writes half the lattice per tick —
where does the number land? The common guess is "between," and it is wrong:
the floor. Then the freeze-frame with the half-sweep on its menu: 128 rings,
zero red wires. Figures: `GridSchedules chromatic` REUSE inside the Predict;
`WriteConflict chromatic` REUSE. Knob: the schedule toggle, now three-way.
Math: $p(s_R \mid s_B) = \prod_{i \in R} p(s_i \mid s_B)$ — formalizing the
zero the reader just counted, each factor the slice from four bits; boundary:
written over all 256 cells the product is false, and the 480 red wires are
the places it breaks. Savior: the coloring works because every wire of a grid
joins a red cell to a black one — a fact about the graph, not the schedule —
so a graph designed that way can run the two-phase clock natively; one was.

**The chip.**
Z1: about a quarter-million p-bits on a fixed sparse graph, roughly sixteen
neighbors each, designed two-colorable; program biases and wire weights, sweep
red, sweep black; millions of Gibbs iterations a second, the papers' own
estimate about three hundred picojoules each, thermal noise supplying the
dice. A patch of the fabric running its two-phase clock: 72 cells written
per tick, zero red wires — the same zero the freeze-frame printed. Figure:
`ChipFabric` REUSE. Then the hero returns with its labels on — `Race`
OVERLAY (β knob; labels shown): the left pane is the chip's clock, the right
is the same glass on a one-phase clock; both traces reach −20 because
optimizing is the thing all-at-once does fine; the number under each is the
distance the reader built at four bits; and the knob: hot, both numbers fall
toward zero, because the law is flat and a stale read of a fair coin is a
fair coin; cooling, the right pane's number climbs and the left stays at the
floor. (The cold end's behavior on the left — where mixing slows and finite
evidence can starve the number high — is a claim for the check script to
settle before the prose makes it.) Knob: coldness. Math: none new; the ring
closes on equations already earned.

### Debts

- Two numbers under the hero, unexplained (intro) → what the number is (Four
  bits); which pane is which (The chip).
- "The assignments can be counted, so that best is certain" (intro) → the
  count is enumeration (Four bits); the certified floor in the hero's traces
  (The chip).
- Thermal noise flips the chip's bits (intro) → the comparator with its lid
  off; the S-curve is what a noisy threshold does (One bit).
- The 2 in $\sigma(2h)$ (One bit) → $E_+ - E_-$ is twice the field (Four
  bits, conditional page).
- "What the left bit shows this instant" (Two bits, field gauge) → what
  all-at-once breaks: a read from before the tick (Two hundred fifty-six
  bits).
- The count is $2^n$ (Four bits) → the fence (Two hundred fifty-six bits);
  no number at $2^{250{,}000}$, the fence survives (The chip).
- The slice (Four bits) → the fenced patch's law (Two hundred fifty-six bits);
  the factorization over a frozen color (Two colors).
- Coldness knob on the hero (intro) → $\beta$ on the atlas pages (Four bits);
  the knob's predicted behavior on both panes (The chip).

### Math budget

1. $P(s{=}{+1}) = \sigma(2h)$ — One bit.
2. $P(s_i{=}{+1}) = \sigma\!\left(2\left(h_i + \sum_j J_{ij} s_j\right)\right)$ — Two bits.
3. $\mathrm{Cov}(s_1, s_2) = \langle s_1 s_2\rangle - \langle s_1\rangle\langle s_2\rangle$ — Two bits.
4. $E(s) = -\sum_{(i,j)} J_{ij} s_i s_j - \sum_i h_i s_i$ — Four bits.
5. $w(s) = e^{-\beta E(s)}$ — Four bits.
6. $Z = \sum_s e^{-\beta E(s)}$, $p(s) = e^{-\beta E(s)}/Z$ — Four bits.
7. $\mathrm{TV}(p, q) = \tfrac12 \sum_s |p(s) - q(s)|$, with the
   $\pm\sqrt{p(1-p)/N}$ band — Four bits.
8. $p(s_i{=}{+1}\mid\text{rest}) = \sigma\!\left(2\beta\left(h_i + \sum_j J_{ij} s_j\right)\right)$, derived from 6 in two lines — Four bits.
9. $p(s_R \mid s_B) = \prod_{i\in R} p(s_i \mid s_B)$ — Two colors.

Cut from the current budget: $\langle A\rangle$, the marginalized kernel
$\tilde K(y|x)$, $J = \tfrac{1}{2\beta}\ln 9$, the contrastive-divergence
update, $E_\theta(x_t, w, y)$.

### Ending

The hero, labels on. The reader names the left pane as the chip's two-phase
clock and the right as the same chip on a one-phase clock, reads both traces
reaching −20 as the thing all-at-once does fine, and reads the two numbers as
the count from four bits taken over energy rungs. The thesis is paid on the
right pane: best state exactly right, frequency wrong. The knob is the last
act: hot, the numbers meet near zero; cooling, they separate. Then the count
at the chip's size: the number under each pane is 65,536 additions; the Z1's
state space has some $2^{250{,}000}$ corners and no such number can be
printed there; what survives is the fence — hold a cell's sixteen neighbors
and its law is one S-curve, exact — and the chip is trusted the way the
fenced patch was, locally, by a count. The last fact is the one the intro
opened on, returned: the difference between the two panes is the number of
phases in a clock, and that is the whole difference between a computer made
of noise and a noise generator built from the same transistors.

This ending cannot be moved onto Part 2 or Part 3 by changing nouns: neither
sibling has two panes of one glass, and neither ends on a clock's phase
count.

### Cut list

- Second intro paragraph (L37–41): announces a second protagonist and spends
  the race.
- The wall (`MosaicHero` ×2, paint-box, L43–53 and L944–967): Part 3's hero;
  paying it costs the training act.
- Quantum amnesty (L55–56): the article never raised quantum; the sentence
  does.
- "Reading the display" (L93–122): no failure drives into it; `PairCoupler`
  and `StateAtlas` label their own inks.
- The rail and its prose (L118–122, L771–774): planning chrome described in
  print.
- `StateAtlas mode="observable"` and $\langle A\rangle$ (L282–296): served
  only a callback to the pair's correlation.
- Predict 1 (L149–155): the common guess is right.
- `StateGraph schedules` and the chords (L358–375): a suspect erected to be
  dismissed.
- `Race` as a mid-article figure (L434–465): it is the hero now.
- `Dashboard` (L466–484): a benchmark table; the autocorrelation/ESS story is
  M2's (`CONCEPT_BANK.md`, "Why the Walker Settles").
- `Z1Layers` and its paragraph (L513–523): Part 2's figure, built for Part 2
  (`HANDOFF.md`).
- Chip anatomy (L535–674 less `Microscope`): the dictionary table, X0/Z1
  lineage, `Manual`, `Triangle`, `Nonideality` — none changes the hero;
  embedding is Part 2's.
- Compiler section entire (L676–789): `KernelTable`, `CompileCopy`,
  `XorHidden`, `StackFigure`, Torx, Thermalizers, THRML, PNOT, PSWAP, p-dit,
  p-mode — `physics-03-z1` is that article.
- Training act and dreams (L791–942): `Filmstrip`, `PhaseTrainer`,
  `DreamChain`, `DreamCompare` ×2, the CD update, $E_\theta$ —
  `thermo-03-diffusion` is that article. The synchronous-mislearning beat is
  the one loss worth naming; it belongs with the trainer, and Part 3 already
  reruns the wall under every schedule.
- Waypoints 2, 3, 4 (L525–533, L781–789, L969–975): recap.
- Predicts 3 and 4: go with their sections; Predict 3's common guess is right
  anyway.
- The "crime" device (L373, L378) and "confession" (L503): lessons 01 and 02
  own them.
- The hierarchy-of-witnesses paragraph (L977–988): movable onto Part 3 by
  noun swap; replaced by the fence at chip size.
- Final Words as written (L1027–1032): "some of it had a job" is false of this
  page, whose dice are a hash; the send-back moves to the chip, where the
  noise is the dice.
- Consequence for a sibling, not a cut here: `thermo-03-diffusion` opens on
  "The wall of dreaming lattices that closed Part 1 is back." With this
  outline the wall does not close Part 1, and Part 3's first sentence needs a
  noun swap.

## Part 3 — The intro

Sixteen bits in a four-by-four grid, twenty-four wires between neighbors,
each satisfied when its ends match or, for the other kind, differ —
nine of one kind, fifteen of the other, dealt so that three of the nine small
squares can never satisfy all four of their wires. The best any of the 65,536
assignments can do is twenty-two wires; the assignments can be counted, so
that best is certain. Two machines run the problem side by side, identical
down to the wires, every bit flipping at random many times a second. Each
reaches a twenty-two-wire assignment within a few dozen sweeps. Under the
left machine a number reads about three hundredths; under the right, about
two thirds. A chip built this way exists, a quarter-million bits flipped by their own
thermal noise. Such a machine outputs not a state but a
frequency — how often each state comes up — and the frequency can be wrong
while the best state it finds is right.

Hero figure: `Race` with schedule labels hidden — two 4×4 panes of one glass,
each with its energy trace falling to the dashed certified floor and the
exact-versus-dwell number beneath; one knob, coldness, shared by both panes.

Audit, one line per sentence:

1. "Sixteen bits … can never satisfy all four of their wires." States the
   glass: 16 spins, 24 edges (2·3·4), 9 ferro / 15 anti, three frustrated
   plaquettes — the shipped figure's own counts (L442–445), re-asserted by the
   check script. Rule 1: no later payoff spent. 2: nothing scheduled. 3: about
   the machine. 4: opens on wires and squares. 6: no imagination. 8: an odd
   count of disagree-wires around a square is unsatisfiable. Topic-swap fails
   on every number; delete loses the problem; a physicist describing a glass;
   instantiates no house rule.
2. "The best any of the 65,536 assignments can do is twenty-two wires; the
   assignments can be counted, so that best is certain." $2^{16}$;
   $E_{\min} = -20$ with unit wires means 22 satisfied, 2 violated (Race.tsx,
   seed 71). Certain because enumerable. 1: the energy tally is not
   pre-chewed — no energy word appears. 2–4, 6 pass. 8: checkable against
   `enumerate`. Topic-swap fails; delete loses the certified floor; physicist;
   no rule instance.
3. "Two machines run the problem side by side, identical down to the wires,
   every bit flipping at random many times a second." Same bits, same wires,
   sixty ticks a second. 1: the schedules are not named. 2: present tense. 3:
   the machine. 4, 6, 8 pass. Topic-swap: "identical down to the wires" pins
   it to this glass; delete loses the twinning; physicist; no rule instance.
4. "Each reaches a twenty-two-wire assignment within a few dozen sweeps."
   Race.tsx: both schedules reach $E_{\min}$ within tens of sweeps. 1: the
   race's verdict (frequency wrong) is not spent — only the part both panes
   share. 2, 3, 4, 6, 8 pass. Topic-swap fails on the numbers; delete loses the
   fact that both solve it; physicist; no rule instance.
5. "Under the left machine a number reads about three hundredths; under the
   right, about two thirds." Energy-level TV ≈ 0.03 / ≈ 0.65 (Race.tsx). 1:
   the number's meaning is not given, only its reading; which pane is which
   is not given. 2–4, 6, 8 pass. Topic-swap fails; delete loses the hero's
   unexplained element; physicist reading a meter; no rule instance.
6. "A chip built this way exists, a quarter-million bits flipped by their own
   thermal noise." ~250,000 p-bits (papers' figure per DENSE_CORE);
   comparators on thermal noise. 1: the ending's payoff is which pane is the
   chip, not that a chip exists. 2: exists, present. 3: the machine. 4, 6
   pass. 8: "a quarter-million" per the fact-hygiene pass. Topic-swap fails;
   delete loses the only reason two toy lattices matter; physicist; no rule
   instance.
7. "Such a machine outputs not a state but a frequency … and the frequency
   can be wrong while the best state it finds is right." The thesis.
   Checkable on the hero: the right pane reaches −20 and reads 0.65.
   Disputable — an expert could argue a sampler outputs states. 1: states the
   claim the article earns, not the mechanism. 2: no schedule. 3: the machine.
   4, 6 pass. 8: true of the right pane by construction. Topic-swap fails
   ("frequency," "best state"); delete loses the thesis; physicist; not a
   rule recited.
