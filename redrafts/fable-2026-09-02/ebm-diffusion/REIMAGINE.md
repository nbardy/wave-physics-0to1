# REIMAGINE — Diffusion on a Dreaming Machine (thermo T3)

Source read: `src/lessons/thermo-03-diffusion.mdx` (563 lines, ~5,360 words,
eight figure mounts). Line numbers below are that file's. Sims opened where a
figure claim needed checking: `BilledWall.tsx` (no control on the hero; two
modes by prop), `OpTimeline.tsx` (batch knob), `SharedPrice.tsx` (static
bars), `AmortizeStrip.tsx` (samples knob), `ClampFloor.tsx` (sweeps knob),
`MixBudget.tsx` (allocation knob), `FabricDream.tsx` (sweeps knob),
`CeilingChart.tsx` (bits knob).

## Part 1 — The read

### Ruth

ML infrastructure engineer, 34. Read Parts 1 and 2 three weeks ago on two
evenings; remembers the wall, the violet meter, and the price strip at the end
of Part 2 with its red once-per-second line. Sunday morning, laptop, coffee.
She drags anything that moves.

L10. "Diffusion on a Dreaming Machine." The series' word for sampling. She
expects the wall.

L12–15. "The wall of dreaming lattices that closed Part 1 is back, and it has
moved twice." She has to work out what "moved twice" means from the next
clause: onto the fabric, and up to sixty-four pixels. A sentence about the
series' own furniture before anything is on screen. It's Part 3; she allows it.

L16–19. "A witness row rides the wall — the surviving instruments from two
articles of auditing." She doesn't know what a witness row looks like; the
sentence describes a thing she can't see. Then "A schedule changes the bill,
never the dreams." That reads as the conclusion. She notes it as the claim and
expects to be shown it.

L21–29. "What is new is bolted underneath: a running bill." Part 2's price list
read back to her: sweep one, readout three hundred, reflash 27,300,
ninety-one readouts. She remembers the red line. "nothing on any bill in this
article is a measurement of hardware." She was going to ask.

L31–39. "Run the wall the way Part 1 built it and the bill is absurd on sight."
She has not seen it. Then the reason — three reflashes a dream — then the
number, 36,264 per joule, "printed in error-tint." By the time she reaches the
figure she has been told what is on it, why, and what the corner says.

L41. The wall. Twenty panes, glyphs forming out of static — the motion she
knows from Part 1, bigger cells. A patch of dots flickering at the side. Under
it a strip with bars, one long and magenta, and a red readout. She looks for a
slider. None. She hovers over the wall, clicks the strip. Nothing. She watches
one glyph finish and reads the strip: the long bar is reflashes, as the
paragraph said. There is nothing on the figure to find out. She scrolls.

L43–50. "The wall returns at the end of this article running the identical
model … and that slot prints a different number." She now holds the ending's
shape: same wall, cheaper. "Two flat facts frame everything between." She skims
the UNet sentence and the binary sentence.

L52–64. "One dream is a short program." Clamp, sweep, read, swap. She likes the
four verbs. Clamp priced per node, 189.58, "a reflash spread over the patch's
144 cells." Where did 144 come from — the 12×12 patch from Part 2? She isn't
sure and lets it go.

L70–76. Predict: "Which line item owns the total?" She read L34 a minute ago:
"the reflash line item devours the strip." She clicks b without thinking. The
bars confirm what she was told twice.

L78–87. "91,918 … the reflash item is 89.1%." Then: "The dream is a rounding
error on its own bill." That one she will repeat to someone. Clamps at 9.9%,
"that item outlives every repair on this page." Filed.

L89–103. Loop order. She drags the batch knob: the curve drops onto a floor
line, the readout goes from red to green, and the wall above goes lockstep —
every chain at the same level, then every chain at the next. "Batching buys
reflashes with latency, and the trade is visible before it is named." She saw
the lockstep. She did not need to be told she saw it before it was named.

L105–111. Waypoint. The numbers she just read, restated. Skim.

L113–116. "Moving that index somewhere cheaper is the next repair." Where does
an index live that is cheaper than the weights? She wants to know.

L118–146. Two more clamped spins carrying the level. The equation at L127 —
the page's first. She reads it: b, c, U, W; she remembers W from Part 1 as the
hidden-to-output couplings. "eighteen held spins instead of sixteen." The
boundary check makes sense — fix τ and its U rows are a bias. Then "an
identity the check harness confirms on the trained weights to one part in a
billion" — the test suite is speaking to her. Then a paragraph about a paper's
τ-leaping chain being "named here once as lineage." She does not know why she
is being told about a citation policy. "One flash, ever." She has it.

L148–164. "The price is accuracy, and it is measured, not waved at." Bars: ×4.0,
×1.20, ×7.5. And at the noisiest level the untrained kernel scores under the
trained shared one. She reads that twice. The shared kernel is bad at two of
three levels and worse than nothing at one. She expects the article to drop it.

L166–197. Disjoint patches: three specialists, three regions, zero reflashes,
432 cells. Predict: which is cheaper at 64 — conditioned or disjoint? She
picks conditioned because the article has spent two pages on "one flash ever."
Disjoint wins by 2.5%. Then L192: "The verdict: batched + conditioned is the
schedule the rest of this article runs." She stops. It is not the cheapest,
and its dreams were worse than untrained three paragraphs ago. "on a single
patch, one flash ever." A quarter-million-cell die and the article is
economizing on 288 cells. This is the first place she feels a hand on her
back: the verdict was written before the bars were drawn.

L199–230. The clamps. Floor 11,155.5; clamps 91.8%; sweeps to 600 and still
79.1%. She drags; the share falls slowly. "The amortizations did not abolish
the bill; they stripped it down to the part that is the algorithm." She will
repeat this one too: holding the evidence is the price. Then "the smallest
line item on the floor, eighteen sweeps, is also the only one that decides
whether the dreams are any good." She wants that next.

L232–238. Waypoint. Skim.

L240–263. τ per level: 1.09, 2.86, 2.05. U rides free, W is taxed. "The
falsifiable form runs in the check harness, where it belongs." The harness
again. She is reading about a measurement made somewhere else.

L273–284. Predict: which level needs sweeps most, the noisy first or the sharp
last? She picks a. The answer is neither — the middle. "Neither candidate
predicted that shape; the measured table is the fact." She was handed two
options and the answer was a third the author had in his pocket.

L286–306. She drags the allocation knob. Two walls, two witness rows. Nothing
moves. "Then the knob delivers the section's real result, which is a null."
She drags it again. Four hundred dreams a side, the sharpened variant, five
hundred a side, still nothing. Then the mechanism: warm starts don't pay τ.
"That sentence is a measurement, not a theorem, and it is scoped to what was
measured." She has operated a figure that does nothing and read six hundred
words on why it does nothing. This is where she starts jumping to headings.

L308–315. Waypoint: "One measured notch up comes next."

L317–350. "The obvious move is to add pixels, and it dies twice before
anything runs." 2⁶⁴, and no pixel-to-pixel wires. The one-color placement:
sixty-four cells, hidden banks by wire distance, 2,048 wires all between
adjacent banks. "exactly the re-hang you have now watched twice as a
curiosity" — she does not remember watching a re-hang twice; once, in Part 1's
chip section, maybe. Zero pixel-to-pixel wires stays with her: whatever makes
two patches of ink agree has to go through the hidden banks because there is
no other road. She would have liked this before the τ section.

L352–365. "Here it is dreaming." Patch on the left, filmstrip on the right, a
green halo on the clamped frame. She drags sweeps: at four the glyphs are
ragged, at twenty-four they are clean. So sweeps matter. Two sections ago the
article measured that they don't.

L367–394. The witness paragraph: 0.053, 0.178, 0.937, 0.117, 0.343, 183 of
250, 15.63 → 2.78, 5.7 sweeps, 0.063, an inequality with a tilde. She reads
the first two numbers and lets the rest go past. Someone checked them.

L396–404. "The knob deserves a farewell reading." 12.01 pixels at four sweeps,
4.95 at twenty-four. "from rounding error toward rent." Fine.

L406–435. Ceiling chart. Predict: 68, or the 30s–40s? She picks b because a is
too clean. Both are on the chart. Arithmetic. She moves on.

L437–444. Waypoint: "What remains is assembly."

L446–471. "The wall is back for the third and last time." Then: "The wall
dreams on the three specialists under both bills; actually swapping them for
the one conditioned kernel would move the dreams … and its line on the bill is
the price of a swap this wall charges without performing." She reads it three
times. The number at the bottom is for a schedule the wall does not run. The
dreams did not change because nothing that would change them was done. Then
L490–495: the bill prices sixteen pixels while the wall holds sixty-four;
priced at the wall's size the factor is three, not eight.

L473. The settled wall. Same panes, the magenta bar short, 288,000 in the
corner. She scrolls up and down to compare. The dreams look alike. She cannot
tell whether they are identical or whether glyphs just look alike.

L497–504. Waypoint: the series in one sentence. Skim.

L544–563. "Nothing was added to the wall in three articles — layers of reading
were." Then the bit-identical streams and "A schedule is one object read
twice." She read that at L18.

Tomorrow she retells: the dream is a rounding error on its own bill; holding
the evidence is ninety-two percent of the price. She does not retell the
verdict, because she cannot defend it.

### Colin

41, writes numerical code for a living. Has read every Ciechanowski post
twice and most of the imitators once. Came in from a direct link to Part 3,
skimmed Part 1's opening. Desktop, console open. His reflex is to find where
the author is steering.

L12. "is back, and it has moved twice." Recap voice. The first sentence of the
article and its subject is the article's history.

L16–19. "the surviving instruments from two articles of auditing" — the author
grading his own prior work. "A schedule changes the bill, never the dreams."
A slogan at line 18. He will count how many times it returns.

L21. "What is new is bolted underneath." The page announcing its fixtures.

L31–39. "absurd on sight" before he has seen it; then the mechanism; then the
number. The section that would explain the figure is spent above the figure.

L41. Twenty panes of flicker and a strip. No control. He clicks the wall, the
strip, the inset. A red readout. "modeled rates" in small type. A screensaver
with a receipt stapled to it, and the receipt was read aloud already.

L43–45. "The wall returns at the end of this article … Two flat facts frame
everything between." The author narrating the frame.

L57–58. "every verb in that paragraph now has a price." A sentence about the
paragraph.

L70–76. The Predict. The answer is at L34. Not a fork.

L78–81. "The dream is a rounding error on its own bill." He grants it. A fact
with a number under it, and the first sentence on the page that told him
something he did not know.

L102–103. "the trade is visible before it is named." The method describing
itself — he is being told that he saw something before being told about it.

L129–141. "Formally there is nothing new in that line" — fair. Then "an
identity the check harness confirms … to one part in a billion" and the
citation-policy sentence. The test suite and the bibliography have both
entered the prose.

L148. "The price is accuracy, and it is measured, not waved at." A sentence
whose job is to say the article is honest.

L155–164. The shared kernel is worse than untrained at t=3. He sits up. A real
result, and the article has just shot its own repair.

L173–197. The second Predict is a coin toss between two numbers 2.5% apart.
Then the verdict picks the one that lost — on cost and on accuracy — because
it is "on a single patch." He writes in the margin: the verdict predates the
measurement. From here he reads to see whether the article notices.

L209–223. Clamps 91.8%; "Conditioning on evidence is what a reverse step is,
and on this machine conditioning is physical." He grants this too. Had the
article opened here he would be reading differently.

L258–259. "The falsifiable form runs in the check harness, where it belongs."
Third time he has been told things were checked elsewhere.

L273–284. Two candidates, a third answer. A fork the author rigged.

L286–306. A knob that does nothing and six hundred words on why. "That sentence
is a measurement, not a theorem, and it is scoped to what was measured" —
hedging performed as a sentence. He checks the scroll bar. Half the article
left.

L319. "The obvious move is to add pixels, and it dies twice before anything
runs." The shape he came for — naive thing, its death — but the deaths are
described, not run.

L330–331. "the re-hang you have now watched twice as a curiosity. This time it
is the model." The author telling the reader what the reader experienced.

L338–350. No pixel-to-pixel wires; the hidden banks are the only route. The
one thing on the page he would repeat, at line 340 of 563, after a null.

L352. "Here it is dreaming." He has met this construction in a hundred
generated pages.

L367–394. A QA log with the numbers left in.

L396. "The knob deserves a farewell reading." The knob's career, narrated.

L448. "The wall is back for the third and last time —" The opening's own
sentence, back for its second time.

L460–464. "the price of a swap this wall charges without performing." He
closes the tab. The ring closes on an invoice for a machine that was not run.

Had he continued: L550 "Nothing was added to the wall in three articles —
layers of reading were." Not-X-but-Y. L562, the slogan from L18, third time.

What he would retell: that an article measured its chosen kernel as worse than
untrained, chose it anyway, and priced a wall for it without running it. Also,
grudgingly, the rounding-error line and the clamp floor.

### STORY

The five sentences the article implies as written:

1. Twenty chains dream glyphs on fabric patches with a bill underneath, and
   the bill is owned by kernel swaps — stated in the second and third
   paragraphs, so the reader arrives at the wall with nothing left to see.
2. The obvious guess, that the sweeps own the bill, fails: eighteen of
   91,918, visible in the composition bars — but the winner was named above
   the figure, so the failure is confirmed, not found.
3. Reordering the loops cuts the reflashes from 3N to 3 per batch and creates
   latency and a floor at 10,018 — the article's one failure-and-repair.
4. Then we look at three amortizations and pick one against the measurements;
   then we look at the floor's decomposition; then we look at a mixing knob
   that moves nothing; then we look at an 8×8 model on the fabric and its
   witnesses; then we look at a ceiling chart.
5. The wall returns billed for the chosen schedule at 7.9× less — a schedule
   it does not run, at a pixel count it does not have.

Hero: the Part 1 mosaic wall, third appearance in the series, no control.
Familiarity cost: maximal inside the series — the reader has watched this wall
open and close Part 1 and knows its motion; the one new element is a strip of
bars whose meaning the intro has already read out. A cold reader sees the
site's standard flicker grid with a receipt. Nothing on the hero is done by the
reader's hand.

Specimen versus object: the specimen hosts. The mathematical object is the
schedule — a sequence of conditional kernels, its cost a sum over four priced
acts, its one identity (a loop order permutes the (dream, level) pairs and
leaves each pair's kernel and seed alone) never stated as an argument — plus
the conditioned energy, one equation at L127. Of ~5,360 words, about 1,500
(L317–435) are the 8×8 model's own construction, its witness numbers, and a
ceiling chart; about 700 (L240–306) are a mixing measurement that returned a
null; the schedule's identity is asserted at L18 and L456–459 and shown
nowhere as something the reader can do.

The single largest flaw: the verdict schedule loses on the article's own two
measurements — worse than untrained at the noisiest level, not the cheapest —
and the wall that closes the ring bills that schedule without running it, so
the finale's number belongs to a machine the reader never watched.

### PROSE

1. L12–13 "The wall of dreaming lattices that closed Part 1 is back, and it
   has moved twice." — disputability: nothing an expert could argue with; the
   subject is the series' furniture.
2. L18–19 "A schedule changes the bill, never the dreams." — verdict spent:
   the ending's claim at line 18, before a figure.
3. L21 "What is new is bolted underneath:" — performance: the page announcing
   its own fixtures.
4. L31 "Run the wall the way Part 1 built it and the bill is absurd on
   sight." — performance: "absurd on sight" asserts the effect before the
   sight.
5. L43–44 "The wall returns at the end of this article running the identical
   model, dreaming the identical dreams, and that slot prints a different
   number." — performance: a schedule of the reader's reading.
6. L45 "Two flat facts frame everything between." — disputability: about the
   article, not the machine.
7. L102–103 "Batching buys reflashes with latency, and the trade is visible
   before it is named." — performance: the method reciting itself.
8. L148 "The price is accuracy, and it is measured, not waved at." —
   performance: asserts the article's honesty in place of the number.
9. L192–194 "The verdict: batched + conditioned is the schedule the rest of
   this article runs — within 2.5% of the cheapest at every demand level, on
   a single patch, one flash ever." — verdict: chooses against the section's
   two measurements.
10. L258–259 "The falsifiable form runs in the check harness, where it
    belongs:" — performance: the process talking; third mention of the
    harness.
11. L286 "Then the knob delivers the section's real result, which is a
    null." — verdict: a figure that moves nothing, narrated as a finding.
12. L302–303 "That sentence is a measurement, not a theorem, and it is scoped
    to what was measured" — performance: epistemic hedging as a sentence.
13. L448 "The wall is back for the third and last time —" — repetition: the
    opening's skeleton ("is back") reused to open the finale.
14. L463–464 "and its line on the bill is the price of a swap this wall
    charges without performing." — verdict: confesses the payoff is for a
    schedule not run.
15. L550–551 "Nothing was added to the wall in three articles — layers of
    reading were." — disputability: not-X-but-Y with nothing checkable in
    either half.

## Part 2 — The new outline

Numbers in this part are arithmetic on the shipped rates (sweep 1, readout
300, kernel write 27,300 iteration-equivalents; a held cell priced as the
kernel write spread over the cells it wrote) applied to the chain the wall
actually runs — sixty-four evidence cells on a 256-cell patch, three levels,
six sweeps a level. The shipped article bills a sixteen-cell chain on a
144-cell patch under a sixty-four-cell wall; that mismatch goes (cut list).
Every number below is re-derived by the check harness before it is quoted;
prose binds to what the strip prints.

Rates under that basis: hold ≈ 106.6 per cell; one dream holds 3 × 64 cells
= 20,475; sweeps 18; readouts 900; swaps 81,900. Naive total 103,293. The
no-swap floor F = 21,393. At sixty-four dreams a batch: 22,673. Ratio 4.56
at sixty-four, 4.83 in the limit.

### Hero

Kept, with one change. The Billed Wall — twenty 8×8 chains dreaming on
16×16 patches wired like the chip, the strip of four priced acts under it,
the swap-rate readout, the witness row — gains the control it lacks: dreams
per batch, 1 to 64, which changes the order in which the chains take their
steps and nothing else. At the top the reader drags it and the strip's total
falls to under a quarter while no dream changes, the rate readout goes from
red to green, and the wall drops into lockstep. That is the thing not yet
understandable. At the end the same wall runs the schedule the article
settled on — three specialists written once each onto three patches — and
the same knob is inert: the swap line is zero at every position, the readout
reads zero, dreams arrive one at a time again, and the reader has computed
the per-dream total from four rates before the strip prints it.

Familiarity cost, stated: third appearance of the wall in the series; a cold
reader sees the site's house grid of flicker with a receipt under it. Paid
because the trilogy's one structural promise is that Part 1's first figure
returns as Part 3's last, and a finale that returns a different object
defaults on a larger debt than familiarity. What is new on the hero is the
reader's hand: the loop order is theirs. The knob is batch rather than a
schedule selector because batch is the one control a reader can operate
before the article has taught them a word.

### Thesis

The price of a dream on this machine is the price of holding its evidence
still; the dreaming itself is a rounding error on the bill, and it is the
only line that decides what the dream looks like.

### The five sentences

1. Twenty chains dream identical glyphs under two settings of one knob, and
   the strip's total under one setting is less than a quarter of the other's;
   the reader sees both and cannot say what the difference bought.
2. The obvious account — the price is the computation, the sweeps — fails on
   the strip's own bars: eighteen sweeps in a bill of a hundred thousand, and
   four-fifths of the bill is three kernel writes, one per level, because the
   level lives in the weights.
3. Running every dream through a level before any kernel write cuts the
   writes from three per dream to three per batch and pulls the per-dream cost
   down as 1/N onto a floor — and creates lockstep: dreams arrive late and
   together, three writes per batch never go away, and the floor is
   undecomposed.
4. Taking the level out of the weights — into two held code cells, or onto its
   own patch — removes the writes entirely; the code cells pay in accuracy the
   4×4 oracle refuses (×4.0, ×1.20, ×7.5; worse than untrained at the noisiest
   level) and the patches pay in fabric, and what remains once the writes are
   gone is a floor that is ninety-six percent the price of holding sixty-four
   cells still, three times a dream.
5. The wall from (1), billed at the schedule the repairs chose, prints a
   per-dream total the reader already computed from four rates and a loop
   order — the same dreams, bit for bit, at under a quarter of the price — and
   its knob does nothing, because there is no write left to schedule.

### Section ladder

**1. The strip** (hero)
- Built: nothing naive; the reader operates the knob.
- Failure: none yet. The visible unexplained thing: total to under a quarter,
  dreams unchanged, red readout to green, lockstep on the wall.
- Figures: BilledWall — NEW-ish: gains OpTimeline's batch mechanics and a
  slider (about a day; the batched schedule and its bill exist in part3lib;
  the chains must wait at level boundaries, and per-chain seed streams keep
  the dreams bit-identical across N — the current check asserts identity
  across two modes and must assert it across the knob).
- Knob: dreams per batch, 1–64.
- Beside the figure, one sentence each: the sampler (each chain runs Part 1's
  checkerboard sweep on its patch; the browser runs the chip's contract, not
  the chip); the witness row (three numbers — fenced 2×2 TV, mean distance to
  the nearest family glyph, share within family — that will not move in this
  article); the weights ship pretrained.
- Math: none.
- Savior: itemize one dream.

**2. One dream, itemized**
- Built: the account that the bill is the computation. The reader counts one
  dream's acts on the ticker: 3 holds of 64 cells, 18 sweeps, 3 readouts,
  3 kernel writes.
- Predict — the one on the page — before any rate is printed: which of the four
  acts owns the bill. The common guess is sweeps, by volume; it is wrong.
- Then the rates, and the failure visible in the composition bars: sweeps a
  hairline, kernel writes four-fifths, holds a fifth.
- Figures: OpTimeline locked at N = 1 with the slider hidden — OVERLAY (the
  ticker and bars exist).
- Knob: none.
- Math: the bill as a sum, B = Σ n_a r_a over the four acts — formalizes the
  count the reader just made; the boundary read is that sweeps at k = 6 are
  0.017% of it.
- Savior: the kernel write happens because the level lives in the weights;
  how often it happens is a loop order.

**3. The loop order**
- Built: for each dream, for each level, write the kernel. Reordered: for each
  level, for each dream. The reader drags N.
- Failure visible: on the wall above the curve, lockstep — dreams late and
  together; on the curve, a floor no N pierces; three writes per batch,
  recurring.
- Figures: OpTimeline with its knob — REUSE.
- Knob: dreams per batch.
- Math: c(N) = F + 3R/N, F = 3(64·r_hold + k + r_read) — formalizes the curve
  the reader just dragged onto the floor; F ≈ 21,393 at k = 6. One sentence
  states why the dreams cannot change: the reorder permutes (dream, level)
  pairs, and each pair meets the same kernel with the same seed.
- Savior: two places other than the weights where a level index could live —
  the held cells, or the fabric.

**4. Where the level lives**
- Fork, in print, both candidates live: hold the level as two more cells, or
  give each level its own patch. Build the first.
- Built: the conditioned kernel — two code cells held beside the evidence,
  one kernel for all three levels, written once ever.
- Figures: DreamChain OVERLAY — two code cells drawn beside the evidence
  wearing the held halo, level selector (half a day); SharedPrice — REUSE.
- Knob: level (on the DreamChain overlay); none on SharedPrice.
- Math: E_θ(x_t, τ_t, w, y) = −b·y − c·w − [x_t; τ_t]ᵀ U y − wᵀ W y —
  formalizes "hold two more cells"; boundary: fix τ_t and its rows of U
  collapse into a per-level bias, so the kernel is a specialist for that level.
- Failure visible: SharedPrice at the 4×4 oracle — ×4.0, ×1.20, ×7.5, and at
  t = 3 the untrained kernel's dashed line sits under the trained one. A
  quieter second failure on the strip: the two code cells are held at every
  level of every dream, a surcharge that never amortizes.
- Savior: the other candidate.

**5. Three patches**
- Built: each specialist written once onto its own patch; the descent hops
  patches; zero writes after three; batch of one; dreams one at a time again.
- Figures: NEW fabric-region map — three patches on the z1 drawing, the
  active one lit as a dream hops (about a day; z1.ts, Z1Layers' drawing, and
  part3lib's disjointRegionPlan exist); AmortizeStrip — REUSE, for cost
  against footprint; ClampFloor — OVERLAY (re-chained to the 64-cell
  specialist chain).
- Knobs: dreams demanded S (AmortizeStrip); sweeps per level (ClampFloor).
- Math: d(S) = F + 3R/S; the crossover with the code cells, S* = 2R / (3 · 2 ·
  r_hold) ≈ 85 dreams — one line; then the floor decomposed: hold share =
  3·64·r_hold / F ≈ 0.96 at k = 6, and at k = 600 still 0.88.
- Failure visible: with the writes gone the floor is the hold; the sweeps knob
  on ClampFloor barely moves the share.
- Verdict, with reasons: the code cells' cheapness below S* buys dreams the
  oracle rejects; the patches cost 768 of 250,000 cells, three-tenths of one
  percent; the wall runs the patches. (The shipped article's verdict reversed:
  it chose the code cells against its own two measurements.)
- Savior: the smallest line is the only one that can change what a dream looks
  like — so the obvious economy is to starve it.

**6. The cheapest line**
- Built: sweep as little as the bill allows. One sentence carries the shipped
  null: at sixteen pixels, splitting nine sweeps across levels any way moved
  nothing the witnesses could see (0.170 against 0.138 strays; the sharpened
  variant likewise).
- Failure visible at sixty-four: FabricDream, sweeps 4 → dreams a mean 12
  pixels from the nearest family glyph; 24 → 5.
- Figures: FabricDream — REUSE.
- Knob: sweeps per level.
- Math: sweeps' share 3k/F; at k = 24 it is 72 of 21,447, a quarter of one
  percent. Nothing new. Named once: Part 2's mixing tax, at the size where it
  shows.
- Savior: the wall, billed.

**7. The wall, billed**
- Built: the hero in its settled schedule — three patches, batch of one,
  k = 6.
- Before the figure, the reader's arithmetic: F ≈ 21,400 a dream plus 81,900
  spread over the dreams so far; the strip prints it and climbs as the three
  writes amortize. Dreams per joule from the §II B estimate, live, with both
  idealizations printed on the canvas (modeled rates; contract, not chip).
- Figures: BilledWall settled — OVERLAY (bill plan → disjoint; the same knob
  left in place).
- Knob: dreams per batch, inert — and the sentence beside it says why.
- Reads: dreams bit-identical to the opening at every knob position; witness
  row unchanged; one sentence on what k = 24 would print (dreams five pixels
  from the family instead of eleven, the strip up a quarter of one percent)
  and why the wall runs at six — so that it is the wall from the top.
- Math: dreams per joule = 1 / (c · J_iter).

No waypoints: no act consumes a tool from the last one as a black box; the
bill is the subject throughout. One consolidation sentence opens section 6
(the floor's two shares).

### Debts

- Hero: the total under a quarter, dreams unchanged → section 2 names what
  the difference bought (kernel writes); section 3 states why the dreams
  cannot move; section 7 prints the number the reader computed.
- Hero: the red readout → section 2 names it (recurring writes per second
  against the once-per-second line); section 5 zeroes it; section 7 reads
  zero.
- Hero: the witness row, stated as a black box → section 7 reads it
  unchanged (Part 1's promised hierarchy, paid as chrome, not as a section).
- Section 2: the level lives in the weights → sections 4 and 5 move it.
- Section 3: lockstep → section 5 (batch of one on three patches).
- Section 3: the floor undecomposed → section 5.
- Section 3: three writes per batch, recurring → section 4 (one ever) →
  section 5 (three ever).
- Section 4: the oracle's accuracy price → section 5's verdict keeps the
  specialists.
- Section 4: the code cells' recurring surcharge → section 5's crossover.
- Section 5: sweeps the smallest line → section 6.
- Section 6: what 24 sweeps buys → section 7's one sentence on why the wall
  runs at six.

### Math budget

1. B = Σ n_a r_a — the bill as a sum over four acts (section 2).
2. c(N) = F + 3R/N, F = 3(64·r_hold + k + r_read) (section 3).
3. E_θ(x_t, τ_t, w, y) = −b·y − c·w − [x_t; τ_t]ᵀ U y − wᵀ W y, with the
   fixed-τ boundary check (section 4).
4. d(S) = F + 3R/S and the crossover S* (section 5, one line).
5. hold share = 3·64·r_hold / F; sweeps' share 3k/F (sections 5–6).
6. dreams per joule = 1 / (c · J_iter) (section 7).

### Ending

Lands, from this article's own material: the strip read as three shares —
holds ninety-six percent, readouts four, sweeps a tenth of one percent; the
knob that moved the price fourfold at the top moves nothing at the bottom,
and the reader can say why; the dreams never changed; the one line that could
change them is the one that costs nothing. What the reader now does that they
could not: given four rates and a loop order, price any diffusion schedule
on this machine before running it. The nouns — holds, evidence, sweeps,
kernel writes — belong to this machine's acts and no sibling's. The shipped
"one object read twice" line is not reused; the ring shows it instead. Further
Reading keeps its four sources with fresh sentences.

### Cut list

- The intro's price list and the 36,264 figure — spend sections 2 and 7.
- L18–19 "A schedule changes the bill, never the dreams" and L562–563 — the
  thesis spent as a slogan; the hero now shows it and section 3 earns it.
- L43–50 "The wall returns at the end …" — schedules the reading.
- Predict 2 (conditioned vs disjoint) — the answer is the verdict's argument,
  not a quiz; Predict 3 — a fork with a third answer; Predict 4 — goes with
  its section.
- The batched + conditioned verdict and the L460–464 scope caveat — the wall
  now runs what it bills.
- The sixteen-cell bill under a sixty-four-cell wall (L490–495) — one basis,
  the wall's own.
- The mixing budget section (L240–306), MixBudget, the τ table, the U/W
  exemption — a knob that moves nothing, 700 words on a null; the null
  survives as one sentence in section 6. Part 2's exemption stays quoted in
  Part 2; here it explained a quantity the article then measured to be inert.
- "Past the oracle's edge" (L317–404) as a section — the specimen's own
  physics. The zero-pixel-to-pixel-wires / layers-by-BFS beat is a standalone
  candidate ("a picture's placement on the die decides the network's depth")
  and should be banked in CONCEPT_BANK by whoever edits it; the witness
  paragraph reduces to the three numbers on the hero's row.
- The ceiling chart (L406–435) — one sentence of arithmetic beside section
  5's footprint (768 of 250,000).
- All four Waypoints — recaps.
- The δ̃ warranty sentence (L392–394) — Part 2's theorem re-invoked with
  nothing to do.
- The τ-leaping lineage paragraph in the body (L137–141) — Further Reading
  only.
- L448–452 "The wall is back for the third and last time" — the opening's
  skeleton reused.
- L550–551 "Nothing was added to the wall in three articles — layers of
  reading were."
- Every sentence whose subject is the check harness (L135–136, L258–259,
  L361–363, L458–459) — the checks run; the prose states the number.

## Part 3 — The intro

Twenty sixteen-by-sixteen patches wired like the chip are dreaming, an
eight-by-eight glyph apiece, each the end of three reverse steps that began as
sixty-four coin flips, on weights that ship with the page. Every step is made
of four acts the hardware has a price for: hold a cell at a value, sweep the
free cells once, read the cells out, or write a kernel into the couplings.
The strip under the wall counts each act as it happens and charges it at rates
modeled from the two papers' constants, with one sweep as the unit. The slider
changes nothing about what any chain computes — the same seeds, kernels, and
sweeps at every level — only the order in which twenty chains take their
steps. Dragged to the right, it takes the strip's total to less than a quarter
of itself, and not one dream on the wall changes by a pixel.

Hero figure: the Billed Wall — twenty 8×8 chains on 16×16 z1-wired patches,
one live patch inset, the four-act strip with composition bars and running
total, the write-rate readout against the once-per-second line, dreams per
joule in the corner, the three-number witness row — with one slider, dreams
per batch, 1 to 64.

Audit, one line per sentence:

1. "Twenty sixteen-by-sixteen patches … on weights that ship with the page."
   States: 20 chains; 16×16 patches on the z1 topology; 8×8 glyphs; x₃ is
   sixty-four coin flips; T = 3; pretrained8 weights. Checkable in
   BilledWall.tsx (CHAINS = 20, PATCH 16×16, N_LEVELS, PRETRAINED8). Rule 1:
   no payoff spent — the pretrained fact is a confession. Rule 2: nothing
   scheduled. Rule 3: subject is the machine. Rule 4: cold, concrete. Rule 6:
   no imagination asked. Rule 8: "wired like the chip" survives the torus
   idealization; "began as coin flips" is the filmstrip's own label.
   Topic-swap breaks it; deletion loses the scene; the physicist is talking;
   no house rule is being recited.
2. "Every step is made of four acts … write a kernel into the couplings."
   States: the op alphabet — clamp, sweep, readout, reflash — the four kinds
   in part3lib's Op type, each with a rate. Disputable (an expert could argue
   the act set or whether a hold is distinct from a write; §II B 2 prices it
   like one). Rules 1–4, 6, 8 pass: no rate is given, nothing scheduled, the
   subject is the hardware, no imagery. Four tests pass: the sentence dies
   under topic-swap, deletion removes the acts the strip counts, no tour
   voice, no rule recited.
3. "The strip under the wall counts each act … with one sweep as the unit."
   States: live accrual; modeled rates from the papers' constants; the
   iteration-equivalent unit. Checkable on the strip's own "modeled rates"
   tag. Rule 1: the rates themselves are withheld for section 2. Rule 8:
   "modeled" is the honest word; "estimates" would also pass. Rules 2, 3, 4,
   6 pass. Four tests pass.
4. "The slider changes nothing about what any chain computes … only the
   order in which twenty chains take their steps." States: bit-identity of
   the dreams across the knob; the knob is a loop order. Checkable by the
   identity assertion in check-billedwall (to be extended across N — a build
   constraint, noted in section 1). Rule 1: states the visible invariant, not
   the reason (section 3's). Rules 2, 3, 4, 6, 8 pass. "The slider" is the
   object, not the reader; no imperative.
5. "Dragged to the right, it takes the strip's total to less than a quarter
   of itself, and not one dream on the wall changes by a pixel." States: the
   ratio at N = 64 (4.56 under the outline's basis; 8.1 under the shipped
   sixteen-cell basis — "less than a quarter" holds for both) and pixel
   identity. Rule 1: the hero shows this on screen at the top; the article
   explains it, so it is the X of sentence (1), not a payoff. Rule 8: the
   ratio is the harness's to print and "less than a quarter" is scoped to
   what both bases give. Rules 2, 3, 4, 6 pass. Not an imperative. Delete it
   and the wonder gap is gone; topic-swap breaks it; the physicist reading
   the strip; no rule recited.

No sentence's only content is an effect on the reader. No "imagine." No
metaphor: "dreaming" is the series' coined name from Part 1, not an image
needing audit here. No aphorism opens; the thesis is not printed in the intro
— the hero carries it as the gap between sentences 4 and 5, and section 3
earns it. Shape against the p-bits winner: that one runs familiar-measured →
inversion → fragment; this one runs scene → the four acts → the meter →
the knob's invariant → the visible drop, and ends on a fact, not a fragment.
Against Part 2's opening: no "the smallest X worth Y is a Z" definition, no
"Below, the X twice."
