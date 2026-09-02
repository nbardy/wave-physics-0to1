# REIMAGINE — The Multiply Made of Light (photonics P1)

Fable 5.1, 2026-09-02. Subject: `articles/09-photonics/OUTLINES.md` (P1 at
L30–181, P2 at L185–278, P3 at L281–381), read with `DENSE_CORE.md`,
`RESEARCH.md`, `articles/CONCEPT_BANK.md`, the scout notes and extracts under
`research/photonics/`, and the FDTD spike at `src/sims/photonics/fdtd.ts`.
There is no MDX. Line numbers below are OUTLINES.md. The two readers are
handed the draft intro (L154–181) as prose and then walk the act ladder
(L71–144) as the article it would produce if built as written.

## Part 1 — The read

### Anil

Technical, curious, did not build this. Has read two of the site's articles
(the fluid one and the p-bit one) and one IEEE Spectrum piece on photonic
chips.

L154, "Below this paragraph, a matrix is multiplying a vector." He looks
down. He has read this sentence before — the solver article opened with a
neural network "a few centimeters below this paragraph" — so before the
figure loads he already knows the article's shape: a thing runs under the
first line, and the article explains it. He is not against that. He notes he
has seen the move.

L156, "The pane on the left is not a diagram. It is a wave field." He had
not assumed it was a diagram. The correction arrives before the error, so he
spends a half-second wondering what he was supposed to have thought.

L156–158, the leapfrog "this site uses for water," slowed "ten orders of
magnitude." He does the arithmetic — picoseconds into tens of milliseconds —
and accepts it. He does not know the site's water scheme and does not need
to.

L158–163. Four beams, "brightness" carrying four numbers, split, cross,
interfere, and "every multiply and every add performed by interference, none
of it by arithmetic." He stops on the last clause. Either interference is
arithmetic or it is not; the sentence says both and wants credit for the
second. He predicts the article will show him a beamsplitter equation, and
that the equation will be arithmetic. Then a smaller thought that stays with
him for the rest of the read: brightness cannot be negative. If the vector
has a −0.3 in it, what does the beam do?

L163–166, "The right pane keeps the books … You can drag the input values and
watch both panes agree." He will drag. He wants to drag the value below zero
to see what happens, and the paragraph does not say.

L167, "The stopwatch under the field pane is the strange part." He is told
which part to find strange before he has found it. He looks at the stopwatch
because he was told to.

L168–172. "The number on this page that the size of the matrix barely
touches. Make the matrix four times larger … the count of multiplications
inside one walk grows sixteen times faster than the walk does." He does this
arithmetic too, because the site has trained him to: four times larger — is
that four times the entries or four times the side? Either way the ratio he
gets is two or four, not sixteen, unless the walk does not grow at all. He
files it as a mistake and keeps reading, slightly less willing to do the next
sum.

L172–178. "Chip companies compress this into a slogan: matrix multiplication
in O(1). The slogan is true. The price of it is written in everything around
the stopwatch — in how fast the glass grows, in how dim the light gets, in
which parts of this machine are allowed to change quickly and which are not
— and that price is the rest of the article." He now has the table of
contents: growth, dimming, slow parts. He has also been told the answer to
the article's central question (the stopwatch barely moves) in the same
paragraph that announced the question. Whatever the article does with the
stopwatch later, he already knows.

L180–181, "First the arithmetic itself, because it is not obvious that
ripples can multiply." Ripples multiplying is the thing he came for, stated
as a preview.

Act I, L71–81. A primer on reading the field pane with one source and
nothing computing. He waits through it; he learned hue-as-phase in the
wave-particle article and the primer does not know that. Two beams cross and
"amplitudes add" — the −0.3 question from L158 has its answer here (the sign
is a phase) but the outline does not say so, and the hero at L40 still says
brightness. Then the port-steering game: two knobs, send all the light out
one port. This he would play for several minutes. When the game ends with
"what the two knobs were setting is a 2×2 matrix," he asks which knob is
which entry, and the honest answer — neither, they are an angle and a phase —
is the first genuinely new fact of the article, if the prose says it. The
failure driving out, L78–79: "our 2×2 cannot touch beams that don't meet —
mixing four inputs needs a plan for who crosses whom." Nothing has failed. He
has a working 2×2 and is told he needs more of them.

Act II, L83–92. A routing diagram to trace. He traces it. He routes a 4×4
"junction by junction" while the arithmetic pane multiplies 2×2s. Then L87:
"program a matrix that amplifies — the mesh refuses." He had not tried to
amplify; he was routing. The refusal is real and he would like it, but it was
handed to him as a demonstration, not met. SVD, three panes. "Waypoint 1" —
he predicts a paragraph telling him what he now holds, and skims it.

Act III, L94–96. "Predict moment: the mesh doubles from 4×4 to 8×8 — what
happens to the transit-time readout?" He read L168–169. He knows. He drags
anyway, and the readout does what the intro said. Then L105–121, "the bills,
one figure each": silicon, loss, the slow knob, the edges. He reads bill 1
(area grows, a count of MZIs, "per-MZI area/power figures pending"), bill 2
(brightness decays, "specific dB numbers pending"), and here attention goes.
Two figures in a row have promised numbers they do not have. He jumps to
bill 4 because the intro said the machine has slow parts and he wants to know
which, finds the 1 GHz / 10 MHz pair in bill 3 on the way, and likes it. The
sentence he will repeat tomorrow is at L120–121: light in a silicon waveguide
is slower than a signal on a PCB trace. "Waypoint 2." "Effective precision
(4–8 bits, shot-noise floor) closes the act" — a fact, stated, with nothing
on screen losing a bit.

Act IV, L124–144. Shen 2017: 76.7% on the chip against 91.7% in simulation,
and "our mesh reproduces the mechanism of that gap with injected phase
noise." He would turn that knob. Then L128–133, "the arc compressed: 2017 →
tensor cores 2021 → on-chip backprop 2023 → Taichi 2024 → the Nature 640 pair
2025." A timeline. He skims it as he skims every timeline. Then L134–138, the
copper wall, ~30% of cluster energy, co-packaged optics, Celestial→Marvell,
Lightmatter selling one thing and publishing another. He is now reading an
industry brief and he came for the multiply. He does not close the tab — he
is near the end — but he is no longer doing sums. L137–138, "The mesh did not
lose to physics; it is waiting on its own edges." That is the other sentence
he might repeat, and he is not sure what it means. L139–142: the hero returns
with the stopwatch "legible," and the last thought is a piece of glass
computing Fourier transforms "since before anyone asked it to," which he
recognises as the doorway to the next article.

What he can retell: the PCB-trace fact; O(1) is O(N) in picoseconds; a chip
company sells interconnect. What he cannot retell: how twelve phase settings
become a matrix, because he routed a diagram and never set a dial.

### Greta

Has read all of Ciechanowski. Has read every article in which an equation
turns out to be beautiful. Reads with one hand on the author's wrist.

L32–37, the thesis: "The sentence 'photonics does matrix multiplication in
O(1)' is true, and every word of it is load-bearing … The article makes the
claim precise, then prices it." The subject is a sentence from a press
release. She has read three fact-checks of that sentence, including the one
in McMahon's review. An article whose antagonist is a slogan has picked a
fight it cannot lose, and she expects it to win it slowly.

L39–45, the hero. Dual pane, field and arithmetic, one knob on the input
vector, and an IOU: "a transit-time readout in picoseconds that the reader
cannot yet interpret; it returns in Act III as the entire point." She knows
the move — the hero carries a number it will redeem — and she notes that the
hero as specified has exactly one unexplained thing, the stopwatch, and that
the matrix itself is not in the glass at all: it lives in the right pane as
digits. There are no dials in the picture. The wave field is showing her a
fixed multiply that the arithmetic pane shows better. What is the field
adding, except that it is light?

L47–51, the protagonist "accumulating understanding: a single crossing → one
beamsplitter → one MZI → the 4×4 mesh → the mesh with its electrical edges
attached." A parts list in growth order. She checks whether any part is
forced by the failure of the previous one and finds the answer at L78–79: it
is not.

L53–55, the debunk of "computes at the speed of light," McMahon's numbers.
Good fact, she thinks; she will watch where it lands.

L61–67, the math budget: "unitarity forced by energy conservation." She
predicts the article will say the words rather than let a meter show the
sum pinned. L88 says "felt not cited," which is the right plan, and the intro
at L161–163 already does the opposite: it tells her the multiplies are
"performed by interference."

L154, the intro. She reads it as a paragraph she has read before, in the
solver article, with the nouns swapped. L156, "not a diagram. It is a wave
field." A correction with nothing to correct. L167, "the strange part": the
hand on the wrist. L170–172, sixteen times faster than the walk: she checks
it, it fails, and the author who wrote L98–99 ("honestly O(N)") wrote this
too. L172–173, "The slogan is true." Declared here; withdrawn at L98–99,
where the time "follows the depth of the block — honestly O(N)." An article
that calls a slogan true in its intro and O(N) in its third act is arguing
with itself. L174–178, "that price is the rest of the article." She closes
the tab here, in her head — she has been handed an itinerary — and reopens it
only because she has agreed to read the outline.

L94–96, the predict moment, already answered at L168–169. L101, "Numbers as
dessert, each bound to a ledger line" — planning vocabulary, which in the
p-bit article leaked into print, and she expects it to leak again.

L105–121, the four bills. She has read this listicle in Spectrum: area,
loss, weight loading, conversion. Here each is "one figure," and two of the
four say "pending." She notes that no bill fails into the next bill; they are
four exhibits in a row. The one fact she keeps is at L120–121, and it is a
fact about copper, not about the mesh.

L124–144. Shen's gap with phase noise injected into the site's own mesh is
the one figure in the act she would build herself. The arc and the landscape
she reads as the article changing subject to the photonics industry. L137–138
is the aphorism: "did not lose to physics; it is waiting on its own edges" —
a shape she has seen ("X did not fail; X is waiting for Y") and a claim no
one could check. L140–142, glass "computing Fourier transforms since before
anyone asked it to": a warmth the document itself outlawed forty lines
earlier, at L14–17, on P2.

What she would retell: that the site fact-checked a marketing sentence and
attached a very good wave simulator to the fact-check. What she would not
say, because it is not true yet: that the article showed her a matrix become
glass.

### STORY

The five sentences the article implies, as it stands:

1. A simulated block of glass multiplies a four-vector by a fixed matrix and
   a stopwatch under it reads picoseconds; the intro then says what the
   stopwatch will do when the matrix grows (L168–172), so the one unexplained
   thing is spent before the figure is played.
2. Then we look at how to read a wave field, how two beams add, and a
   port-steering game that ends by naming the beamsplitter a 2×2 matrix
   (L71–81); nothing fails, and the "failure" out (L78–79) is that four beams
   need a plan, which is a parts list.
3. Then we look at a routing diagram (L84–86); a matrix that amplifies is
   refused (L87–88), a real failure nobody asked for, and SVD repairs it
   (L88–90).
4. Then we look at the stopwatch under doubling, answered already, and then
   at four bills, one figure each (L105–121), two of them with their numbers
   marked pending; no bill fails into the next.
5. Then we look at 2017 to 2025 and where the money went (L125–138); the hero
   returns with its stopwatch legible (L139–140) and the last line advertises
   P2 (L140–142).

Current hero: a 4×4 mesh as a live wave field beside its arithmetic, with a
stopwatch. Familiarity as a cost: the lattice of X-shaped crossings is the
figure-1 of every photonic-computing explainer, Lightmatter's marketing, and
the Nature papers the ledger cites; a technical reader who has read one press
piece has seen it. The slogan the thesis is built on (L32–37) is the press's
own sentence. What no reader has seen — a live field with its dials exposed,
refusing a matrix — the hero as specified (L39–45) does not show: the matrix
is digits in the right pane, and the glass has no visible settings. Cost:
high on the thesis, medium on the figure, and the novel part is hidden.

Serves or hosts: hosts. By the outline's own scale (L146), Acts III–IV are
about half the article, and they are the specimen's economics — device
counts, chip clock rates, a paper timeline, an acquisition, a company's
product line. The mathematical object (a lossless linear map as a sequence of
two-beam crossings; a general map as two such sequences around a stretch) is
finished at L90 and does not reappear. The mesh stops accumulating
understanding at the article's midpoint and becomes an exhibit.

Biggest flaw: the article audits a slogan instead of building an object, so
once the mesh is assembled at L90 nothing on screen fails again, and the
second half is a priced list and a timeline that the protagonist merely
illustrates.

#### P2 and P3, story only

P2, "Glass That Learned" (L185–278). Hero: three trained masks classifying
a sketched digit. Its real failure is the last one — three linear plates
collapse to one plate (L237–240) — and the hero embodies exactly that
limitation from the top without the reader being able to see it, so the
article's best beat arrives as a fact about the hero rather than a failure
the reader meets. The middle is a tour: "a lens computes only the one
transform" (L226) is a parts need, not a failure, and the 4f act (L227–232)
plus Vander Lugt is a history stop; the five sentences run (1) plates
classify, (2) then we look at the lens by hand — the hand-painted mask
failing to focus is a good failure but it is a failure of the reader's
painting, not of a mechanism the hero used — (3) then we look at 4f
convolution, (4) learning fixes the design problem and creates the depth
problem, (5) the stack fails as one plate fails. Sentence (5) is the only
one with a mechanism failing; it should be sentence (2). The intro (L258–277)
spends the ending at L272 ("What none of them can be is deep") and performs
at L258–259 ("the last computation anyone will ever run on them").
Familiarity cost: the lens-as-Fourier-transformer is Goodman chapter 5 —
every optics student has it — medium; the trained plates are low. The
specimen (the lens, the correlator) hosts the middle; the object (propagation
as a linear operator; the adjoint as propagation reversed) is confined to Act
III.

P3, "Waves That Anneal" (L281–381). Hero: a fiber loop of pulses beside the
p-bit lattice on the same max-cut. The intro (L360–368) spends all three
payoffs — 2016, 2018, 2019 — in its first paragraph, then says at L370–375 it
will "hold both ends" and "stage the rematch"; Act III (L328–351) pays a debt
the intro already paid. The five sentences: (1) a loop cuts a graph, (2) then
we look at a coin made of light — no failure, (3) then we look at the loop,
where the multiply is the FPGA's (a good plant, L321–324), (4) then two GPUs
beat it, (5) the instance is solved three ways. Nothing the reader builds
fails; the reader watches a machine lose an argument, which is a verdict, not
a story. The material that could drive one is at L323–324 — 2,808 of 5,056
pulse slots idle waiting for the FPGA — a visible failure of the loop itself
(it is mostly waiting) that the outline uses as a citation. Familiarity cost:
low to medium (the CIM has had Quanta-grade coverage but is not daily). The
specimen hosts: the object (Ising energy, the pitchfork, mean-field
annealing) is T1's material re-taught in one figure, and most words audit one
2016 machine.

### PROSE

Quoted exactly, with the line and the test failed.

1. L154 — "Below this paragraph, a matrix is multiplying a vector." —
   repetition: skeleton shared with the solver article's "There is a neural
   network running a few centimeters below this paragraph."
2. L156 — "The pane on the left is not a diagram. It is a wave field" —
   performance: a correction with no error to correct; not-X-it-is-Y for
   the rhythm.
3. L161–163 — "every multiply and every add performed by interference, none
   of it by arithmetic" — disputability: interference is the arithmetic, and
   the negation cannot be checked.
4. L163 — "The right pane keeps the books" — performance: a metaphor doing
   the work of "shows the matrix, the vector, and the product."
5. L165–166 — "You can drag the input values and watch both panes agree." —
   performance: a stage direction whose subject is the reader's coming act.
6. L167 — "The stopwatch under the field pane is the strange part." —
   verdict: strangeness asserted before it is shown.
7. L168–169 — "it is the number on this page that the size of the matrix
   barely touches" — performance: spends the Act III reveal (L94–99) as a
   preview, and its subject is the page.
8. L170–172 — "the count of multiplications inside one walk grows sixteen
   times faster than the walk does" — disputability, and it loses: doubling
   the side gives two, quadrupling gives four; sixteen needs a walk that does
   not grow, which L98–99 denies.
9. L172–173 — "Chip companies compress this into a slogan: matrix
   multiplication in O(1). The slogan is true." — verdict: called true here,
   called "honestly O(N)" at L98–99.
10. L174–178 — "The price of it is written in everything around the
    stopwatch … and that price is the rest of the article." — performance:
    promissory; the subject is the article.
11. L180–181 — "First the arithmetic itself, because it is not obvious that
    ripples can multiply." — performance: schedules the next section and
    stages the inversion.
12. L101 — "Numbers as dessert, each bound to a ledger line" — repetition:
    the planning vocabulary that reached print in the p-bit article (SLOP
    18), queued to reach print again.
13. L137–138 — "The mesh did not lose to physics; it is waiting on its own
    edges." — verdict: an aphorism with a personified mesh, and "lose to
    physics" is not a claim anyone could check.
14. L140–142 — "a piece of glass that has been computing Fourier transforms
    since before anyone asked it to" — performance: the greeting card, the
    family this document founded at L14–17.

## Part 2 — The new outline

### Hero

The block: a 4×4 multiplier — six crossings, a row of four drains, six more
crossings — as a live two-dimensional field on the left, with its sixteen
dial values printed on the glass beside the segments they heat, four source
marks at the left edge, four detector patches at the right, light visibly
leaving the block at the drain row, and a clock beneath the pane reading the
crossing time in picoseconds. On the right: the matrix, a fixed input vector,
and the product, each output lighting as its beam lands. The knob is the
matrix — any entry can be dragged. What is not understandable at the top:
sixteen dials that retune to unrelated values when one entry moves; light
leaving the middle for no stated reason; an entry that stops moving past a
certain size; a clock in picoseconds; and the count — sixteen dials, sixteen
entries, and no dial is any entry.

It returns with the reader having set a 2×2 by darkening one port, a 4×4 by
darkening six, having read the drain as the block's largest singular value,
having counted the dials as N(N−1)/2 + N + N(N−1)/2 = N², and having said
what the clock will read for an 8×8 before the slider is moved.

Familiarity cost, honestly: the X-lattice of crossings is in every
explainer and every Nature figure 1; a reader who has seen one has seen the
shape. What no explainer shows is the field itself, the dials with values,
the drain light, and the refusal — and the current hero hides all four. The
current hero's object is right (the mesh as a live field is the one thing on
the page nobody else has); what it shows is wrong. Kept, and turned inside
out: the settings go on the glass, the matrix becomes the knob, and the
drains are visible from the first frame.

Solver, one sentence beside the figure, not in the intro: the left pane is
Maxwell's equations in two dimensions on a Yee grid — the same leapfrog as
the site's water — slowed by ten orders of magnitude, with absorbing edges
that swallow what leaves the block.

### Thesis

A four-by-four matrix is sixteen dial settings in a block of glass, and the
light multiplies by it in one crossing — so a bigger matrix costs the block
depth, drained light, and dial-setting time, never arithmetic.

### The five sentences

1. A block of glass with sixteen dials turns four beams into a matrix times
   four numbers; when one entry moves all sixteen dials retune, light leaves
   the block's middle, past a certain size the entry refuses, and a clock
   under the pane reads picoseconds.
2. The obvious way to add two beams — run both wires into one — leaks: when
   the beams are out of step the light leaves the junction sideways into the
   glass, the output goes dark, and the meter shows the loss depends on the
   numbers being added.
3. Giving the lost light a second wire fixes the leak and creates the lock:
   the two outputs of a crossing always carry the input's power between them,
   so a crossing's one dial can reach only the matrices that conserve power,
   and a pure adder is not among them.
4. A crossing that runs one port off to the edge on purpose, set between two
   dialled crossings, reaches any 2×2 at the price of dimming — which is the
   hero's drain and the hero's refusal — and stacking crossings until every
   beam has met every other reaches any size, N layers deep, N(N−1)/2
   crossings, each set by darkening one port, and the dials count to exactly
   N².
5. With the depth known the clock is predicted before it runs — n·N·ℓ/c,
   picoseconds per layer, while the crossings crossed per pass number N² —
   and the sixteen heaters re-set a hundred times slower than the beams
   stream, so the block is a fast function of a slow matrix, fed and read
   through 2N conversions that cost more than its N² crossings until N is in
   the thousands.

### Section ladder

**Hero (F0).** NEW. The block above, live. Knob: any matrix entry. Build:
an FDTD renderer (none exists — the spike is solver-only), a waveguide and
crossing stamp kit (angled arms, coupler pairs, heated segments), port flux
meters, a dial solver (real SVD → two rotation meshes + drains, each crossing
calibrated against its own measured 2×2 in the sim, which is also how real
meshes are programmed), and the matrix pane; four to six days, plus the WGSL
port if the CPU cannot hold roughly 420×200 cells at frame rate. Read-out
paragraph names the solver in one sentence and confesses that a real chip
reads a signed output with a reference beam, which the simulation does not
need.

---

**1. Two wires into one**

Naive thing built: an adder. Two channels carrying numbers a and b, merged
into one channel, on the claim that light adds.

Visible failure: with a and b in step, the output carries their sum and the
meter reads all the light delivered. Turn the phase of b half a wave — the
only way a beam carries a minus sign — and the output goes dark while the
field visibly leaves the junction sideways into the glass; the "missing"
meter reads the whole input. In between, the missing light is exactly the
part of the sum the single wire cannot carry. An adder that throws away
data-dependent light.

Savior sentence: the light that left sideways had nowhere else to go; give
it a wire.

Figures:
- F1 NEW — Y-junction in the field; knob: the phase of b; meters: delivered
  and missing. Cost: the stamp kit and the flux meter, one day, shared with
  everything after.
- F2 NEW (one delta on F1) — the same junction with two arrows laid tip to
  tail in an inset, the sum arrow's length squared tracking the delivered
  meter; the drawing borrowed from `physics/PhasorSum.tsx`. Knob: same
  phase. Hours.

Math moment: the reader has just turned a phase and watched a sum run from
two to zero. Formalized: the output amplitude is (a + b·e^{iφ})/√2, the
detector reads its square, and the sign of a number is a half-wave of
phase. For this article's real numbers: (a ± b)/√2 delivered, (a ∓ b)²/2
missing.

---

**2. The second wire**

Naive thing built: two channels run side by side, close, for a length — the
coupler — instead of merged. Then a heated segment between two couplers: a
crossing with one dial.

Visible repair, then the lock: the two output meters now sum to the input
for every phase; the sum is pinned. The reader plays the game — turn the dial
until port 2 is dark — and does it by hand for in-step inputs, then for a
negative b (a half-turn further). Then the matrix pane from the hero appears
beside the crossing with a target 2×2 from the hero's own matrix, and no
dial setting reaches it: the achieved matrix always keeps y₁² + y₂² = x₁² +
x₂², and the target does not. A pure adder — everything out one port for
every input — is the first target, and the pinned meter is the proof that no
setting does it.

Savior sentence: a port that throws light away on purpose.

Figures:
- F3 NEW (delta on F1) — the coupler; knob: the phase of b; two meters whose
  sum is drawn pinned. Hours.
- F4 NEW (delta on F3) — the crossing: coupler, heated segment, coupler; one
  dial; the darkening game. Half a day (dial → index bump → calibrated 2×2).
- F5 NEW (delta on F4) — the crossing beside a target pane; knob: the dial;
  achieved vs target, and the meter. Hours.

Math moment: the reader has just found the one dial angle that sends
(x₁, x₂) entirely out one port. Formalized: the crossing is a rotation,
[y₁; y₂] = R(θ)[x₁; x₂], and the pinned meter is the statement that its rows
are unit length and perpendicular — orthogonal, which is the real case of
unitary. Boundary check: θ = 0 passes straight through; a quarter turn
swaps. What the reader did — turned the rotation until its second row was
perpendicular to the input — is one Givens rotation, and the name waits
until §4 when they have done six.

Debt planted: the nulled port reads 0.003, not 0.

---

**3. The drain**

Naive thing built: a crossing whose second port runs off to the absorbing
edge — a dimmer with one dial, delivering cos θ of the input and losing the
rest on purpose. Then the sandwich: crossing, two dimmers, crossing.

Visible result: the hero's 2×2 target is reached by four dials; the missing
meter now reads the intended loss, and the light leaving at the middle is the
hero's drain, seen up close. Then the failure the hero showed: drag the
target's largest entry upward and the dials follow until the block would
have to deliver more light than came in, and the entry stops. The refusal is
a meter reading.

Savior sentence: beam 1 and beam 4 have never met.

Figures:
- F6 NEW (delta on F4) — the dimmer; knob: its dial; delivered and drained
  meters. Hours.
- F7 NEW — the 2×2 sandwich with the target pane; knob: one target entry
  (drag); the four dials retune, the drain light grows and shrinks, the entry
  refuses at the limit. Half a day (the 2×2 SVD in the dial solver).

Math moment: the reader has just set a general 2×2 with a rotation, two
dimmers, and a rotation. Formalized: M = R(α) · diag(σ₁, σ₂) · R(β), any real
2×2, with σ ≤ 1 because a dimmer only dims; the drained fraction is 1 −
Σσᵢ²xᵢ'². Boundary check: σ = (1, 1) → drains dark → M is a rotation, which is
§2's lock. Four dials, four entries.

---

**4. Who meets whom**

Naive thing built: four channels and one layer of two crossings, (1,2) and
(3,4). The target pane shows the 4×4 the layer can reach.

Visible failure: eight of the sixteen entries are hard zeros — beam 1 cannot
reach output 3 or 4 because it never meets them — and a target with a
nonzero corner is refused for a different reason than §3's: unreachable, not
too bright. The knob adds layers in the brick pattern: (2,3) fills the middle,
a third layer of (1,2),(3,4) fills the corners, and with all sixteen entries
reachable the target rotation still cannot be matched — the residual against
the target stays — until a fourth layer's (2,3) crossing makes six. Six
crossings, four layers, every pair of beams met once.

Then the game at full size: the reader programs the six crossings by
darkening marked ports in the order the figure lights them, and the running
product on the right assembles from six rotations. Each turn is §2's turn.

Waypoint, the only one in the article, stated as a black box: from here a
crossing is a box with one dial that does any rotation of two numbers, and a
mesh is N(N−1)/2 of those boxes, N deep, that does any rotation of N numbers.

Savior sentence: the ports the reader darkened read 0.003, and each took a
minute to set.

Figures:
- F8 NEW — four channels, layers as the knob (1 → 4); the reachable-entry
  pattern and the residual against a target rotation. Half a day (schematic
  reachability; the field is the hero's top mesh with layers masked).
- F9 NEW (delta on F8) — the count: crossings N(N−1)/2 and depth N as N runs
  2 → 8, field to N = 4, schematic beyond. Hours.
- F10 NEW — the six-port darkening game on the 4×4 with the running product.
  One day (game order = the nulling order; the dial the reader turns is live
  in the field).

Math moment: the reader has just turned six dials in six coordinate planes
and watched a 4×4 rotation assemble. Formalized: U = T₆T₅…T₁, each Tₖ a
rotation in one pair of beams — every rotation of N numbers is N(N−1)/2
rotations of two. Then the count the hero owed: a rotation mesh has N(N−1)/2
dials, the drain row N, the second mesh N(N−1)/2, and N(N−1)/2 + N +
N(N−1)/2 = N² — sixteen dials for sixteen entries, exactly, and not by
coincidence. Boundary check: N = 2 gives 1 + 2 + 1 = 4, which is §3.

---

**5. The dials**

Naive thing built: the programmed block, taken as sixteen numbers, with a
knob that jitters all sixteen by a random amount in degrees.

Visible failure: the product on the right drifts away from the target as the
jitter rises; a four-input, four-class linear task run through the block
loses accuracy along a curve, and the residual from §2 was the first sample
of this curve. Quoted as theirs: Shen 2017's 56-crossing mesh of 4×4
rotations scored 76.7% on the chip against 91.7% in its own simulation, and
the difference is this knob. Then the second property of a heater: a
timeline with two clocks — vectors streaming at the data rate, a dial re-set
at the heater rate — and the product is wrong for the hundred vector-times
after any matrix change. The rates quoted as a photonic multiplier's two
clocks, not as this mesh's: 1 GHz on the data modulators against 10 MHz on
the weight modulators of one shipping chip (Hua et al. 2025), by design.

Consequence stated as what the physics permits: a matrix that stays put and
numbers that stream. The block holds one matrix.

Savior sentence: the one clock left is the crossing itself.

Figures:
- F11 NEW (delta on F0) — the hero with a jitter knob; the product error and
  the task accuracy curve. Half a day.
- F12 NEW — the two-clock timeline: knob is a matrix-change request; the
  product pane shows garbage for the settling window, counted in vectors.
  Canvas, not field (a 100:1 ratio does not render in a field pane). Half a
  day.

Math moment: none new. The two-clock ratio is arithmetic (a hundred vectors
per re-set), and the effective bit count is read off the accuracy curve, with
the sourced range stated flat: four to eight effective bits in the meshes
that have been measured (Nahmias 2020).

---

**6. The clock and the edges**

Prediction prompt, the only one, because the common guesses are wrong: the
block goes from 4×4 to 8×8. The clock reads — the same (the slogan's guess)
or four times (the multiply-count guess)? It reads twice.

Naive thing built: the N slider on the block, field to N = 4, schematic
beyond, the clock computed from the geometry and the cell size and nothing
else.

Visible result: the clock climbs by one layer's transit per row while the
multiplies per pass climb as N². Then the fact stated flat where it belongs,
beside the clock: light in a silicon waveguide moves at about 0.4c, and a
signal on a printed-circuit trace at about 0.43c (McMahon 2023); the block
is not fast because light is fast. Then the edges: the four source marks and
four detector patches the hero has carried since the first frame are
conversions — a number into a beam, a beam into a number — and the reader
counts them: 2N edges for N² crossings, eight for sixteen in the hero, 128
for 4,096 at N = 64. Each conversion is an electronic event and each crossing
is not, and the sourced ratio: in a Transformer-scale analysis the light is
under 1% of the system's energy (Anderson et al. 2023, via McMahon).

The hero returns: the same block, the reader's matrix in its dials, the
drain read, the refusal read, the clock said before the slider moved.

Figures:
- F13 NEW (delta on F9) — the N slider with the clock. Hours.
- F14 NEW (delta on F0) — the hero with its edges highlighted and the two
  counts, 2N and N², as N runs. Hours.
- F0 again, as is.

Math moments: the reader has just predicted a clock. Formalized: τ = n·N·ℓ/c
for a mesh N layers deep at pitch ℓ, and N² multiply-adds per transit — the
slogan, stated once, as this pair of lines. Then the reader has just counted
edges: E_pass = 2N·E_conv + N²·E_cross, so the crossings dominate the bill
only when N ≫ 2E_conv/E_cross, which McMahon puts near N ≈ 10⁴ for
throughput or energy, with latency explicitly exempt. The two widest blocks
built are 64 and 128 beams (Nature 640, 2025).

### Debts

- Sixteen dials retuning to unrelated values (hero) → §2 says what one dial
  is; §4 counts them and shows why sixteen.
- Light leaving the block's middle row (hero) → §3, the drain row.
- The entry that refuses past a size (hero) → §3, σ ≤ 1.
- The clock in picoseconds (hero) → §6, τ = nNℓ/c, predicted before run.
- Four source marks and four detector patches, unnamed (hero) → §6, the
  edges, 2N against N².
- The missing meter (§1) → §3, where the missing light is kept on purpose.
- The nulled port reading 0.003 (§2) → §5, the jitter curve.
- "Each a heater" (intro) → §5, the two clocks.

### Math budget

Earned in this order, each after the reader's hands did the thing:

1. y = (a + b·e^{iφ})/√2, read as |y|²; a sign is a half-wave. (§1, after
   the phase knob.)
2. [y₁; y₂] = R(θ)[x₁; x₂]; y₁² + y₂² = x₁² + x₂² ⇔ rows orthonormal. (§2,
   after darkening a port.)
3. M = R(α)·diag(σ₁, σ₂)·R(β), σᵢ ≤ 1; drained = 1 − Σσᵢ²xᵢ'². (§3, after the
   sandwich.)
4. U = T₆…T₁; crossings N(N−1)/2, layers N; dials N(N−1)/2 + N + N(N−1)/2 =
   N². (§4, after the layer slider and six darkenings.)
5. τ = n·N·ℓ/c; multiply-adds per pass N². (§6, after the prediction.)
6. E_pass = 2N·E_conv + N²·E_cross; crossover N ≈ 2E_conv/E_cross ≈ 10⁴
   (throughput and energy; latency exempt). (§6, after counting the edges.)

### Ending

It lands on the hero's four unexplained things, read: the sixteen numbers
on the glass are the matrix, and they count to sixteen because rotate,
dim, rotate has N² settings; the light at the middle is the largest singular
value's change; the refusal is the dimmer's ceiling; the clock is the depth.
The verdict, from this material: the block is one fixed matrix, evaluated in
a single crossing N layers deep, dimmed by its largest singular value, held
by N² heaters that re-set a hundred times slower than the numbers stream,
and fed and read through 2N conversions that outspend its crossings until N
is in the thousands — and the widest built is 128. That verdict cannot be
moved onto P2 (no dials, no drain, no depth-clock) or P3 (no matrix in the
optics at all); it is this block's.

No benediction into the reader's world — nothing photonic is in it. The
last figure is F0 with the reader's matrix in it.

### Cut list

- The thesis as a slogan audit (L32–37): the slogan appears once, in §6, as
  two lines that fall out of equation 5; it is not the subject.
- The field-pane primer on an empty pane (L72–73): representation is taught
  by the phase knob in §1; no section without a failure.
- The Clements routing diagram traced by the reader (L84–86): the reader
  never traces a diagram; they watch zeros fill as layers are added.
- Waypoints 1 and 2 (L90, L122): one black-box line into §4 remains.
- The four bills as four figures (L105–121): silicon becomes §4's count,
  earned; the slow knob becomes §5's two clocks; the edges become §6's count.
  Loss with depth (dB per layer) is cut outright — unsourced (ledger GAP 7)
  and the field has no propagation loss to show it honestly.
- "Effective precision closes the act" as a stated fact (L122): becomes §5's
  jitter curve, or nothing.
- The 2017 → 2025 arc (L128–133): cut; Shen stays as the one quoted gap in
  §5; the rest is Further Reading at most.
- The landscape paragraph (L134–138: copper wall, co-packaged optics,
  Celestial → Marvell, Lightmatter's product line): cut from the body;
  press-level, the specimen's economics, and the ending it produced is P3's
  ending with nouns swapped. One Further Reading sentence on the interconnect
  business survives.
- "The mesh did not lose to physics; it is waiting on its own edges"
  (L137–138): cut, aphorism.
- The re-enchant-by-ancestry doorway to P2 (L140–142): cut; an ending that
  advertises a sibling is not an ending.
- The photonic-quantum-computing one-sentence debunk (L55–57): cut; nothing
  in the article raises it.
- The speed-of-light debunk as marquee (L53–55, L118–121): kept as one flat
  sentence in §6 beside the clock.
- "Brightness encodes a vector" (L40): cut as false to the mechanism —
  brightness has no sign, and §1's whole failure is that a sign is a phase;
  the hero carries amplitudes with sign and the read-out confesses the
  reference beam.
- The Act III prediction prompt as written (L94–96): its answer was in the
  intro (L168–169); the new intro says what the clock reads, not what it does
  with size.
- The confession of the time slowdown in the intro's second sentence
  (L156–158): moves to the figure's read-out line, where the solver is named
  once.

## Part 3 — The intro

Four beams enter the block below at the left and four leave at the right,
and the four numbers they carry out are a matrix times the four they carried
in. The matrix is the settings of sixteen dials, each a heater laid along one
channel of the glass that delays the light passing under it by up to one
wavelength; nothing inside the block switches. Between entering and leaving,
the light performs the sixteen multiplications and twelve additions of a
four-by-four product, and the clock under the pane reads the crossing time in
picoseconds. Every multiply in the block happens where two beams cross, and
one pass of the light through every crossing is the whole product. When any
one entry of the matrix changes, all sixteen dials retune, light leaves the
block at its middle row in an amount that depends on the matrix, and past a
certain size the entry cannot be set at all.

Hero figure: the 4×4 block — six crossings, four drains, six crossings — as a
live field with its sixteen dial values on the glass, source marks and
detector patches at its edges, and a picosecond clock beneath; the matrix,
the fixed input, and the product on the right. Knob: any entry of the matrix,
dragged.

Audit, one line per sentence:

1. "Four beams enter … a matrix times the four they carried in." — States:
   four in, four out, output = M·input, a fact the product pane computes from
   the field. Rules 1 (says what, not how), 2, 3 (subject: the beams), 4
   (opens on beams and a block), 6, 8 (true by construction and checked)
   pass. Topic-swap breaks it; delete loses the figure's reading; a physicist
   describing the device; no rule instantiated.
2. "The matrix is the settings of sixteen dials … nothing inside the block
   switches." — States: sixteen dials (6 + 4 + 6 for a real 4×4), a dial is a
   heater (thermo-optic phase shifter), a full turn is one wavelength of
   delay (2π), and nothing in the block toggles (heaters hold; no gate).
   Rule 1: what a dial is, not how it multiplies. Rules 2, 3, 6, 8 pass; an
   expert could dispute "heater" (some meshes use electro-optic shifters) and
   the sentence is about this block. Four tests pass.
3. "Between entering and leaving, the light performs the sixteen
   multiplications and twelve additions … reads the crossing time in
   picoseconds." — States: 4×4 by 4 is sixteen multiplies and twelve adds
   (rule 8); the clock reads a physical crossing time computed from
   geometry. Rule 1: the clock's reading is the hero's flat IOU; what it
   does with size is not said. Rules 2, 3, 6 pass. "The light performs" is
   disputable (an expert says the interference is them, or the detector
   finishes them) and so is content. Four tests pass.
4. "Every multiply in the block happens where two beams cross, and one pass
   of the light through every crossing is the whole product." — The thesis,
   a full sentence. States: the arithmetic is located at crossings; one
   transit is one matrix-vector product. Disputable (a crossing does four
   multiplies, distributed) and about this block. Rule 1: the mechanism of a
   crossing, the count of crossings, and the clock's scaling stay unspent.
   Rules 2, 3, 6, 8 pass. Not a fragment; not an aphorism; not the p-bit
   shape.
5. "When any one entry of the matrix changes, all sixteen dials retune,
   light leaves the block at its middle row … past a certain size the entry
   cannot be set at all." — States three checkable behaviours of the figure:
   one entry perturbs U, Σ, and V (all dials move); the drain fraction is
   1 − delivered power; σ_max > 1 is unreachable (rule 8). Rule 1: the
   phenomena, not the reasons. Rule 2: a conditional describing the machine,
   not a schedule. Rule 3: no "you"; the subjects are dials, light, an entry.
   Rules 6, 8 pass. Four tests pass.

No sentence's only content is an effect on the reader; none was cut on
re-audit. No "imagine," no metaphor ("laid along one channel" is literal),
no aphorism opens, no imperative. Word count: 154.
