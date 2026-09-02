# Judge notes and agent returns recovered from the workflow journal (wf_56ac78f9-dbc)

Recovered 2026-09-02 after the session limit killed 30 of 44 agents. Every REIMAGINE.md on disk is a FIRST DRAFT: no revise agent ran, no sibling audit ran. Judges completed for four articles only; every judge that ran failed the draft (they were prompted to default to fail).


## Reimagine returns (8 of 11 returned; jacobian-hessian, cad-primitives, photonics wrote their files but died before returning)


### navier-stokes-history
- Hero: The gray disc in a stream with the fluid's friction on one knob and a two-line meter that splits the push on the disc into the part that is rubbing and the part that is not; at the top, halving the friction drops the rubbing line by a third and leaves the pressure line where it was, and the reader cannot say what the rest of the push is; it returns at the end with the wall layer drawn as a band and the wake's pressure deficit shaded — the rubbing line is the band, the pressure line is the area.
- Thesis: The push on a body in a fast stream is set not by how much the fluid rubs but by where the thin layer of fluid that does the rubbing lets go of the body, so a fluid with almost no friction is not almost a fluid with none.
- Biggest flaw in current article: The article has one failure chain — the 1752 zero and the 1904 layer that breaks it — and buries it as two sections of a thirteen-stop chronological tour whose hero is a labelled menu of regimes, so the one idea the live sections are about (the small-friction limit is not the frictionless case) is never stated and no figure shows it.
- Five sentences:
  1. A disc in a stream is pushed with a force that stays put while the fluid's friction is turned down tenfold; the meter shows that at the low end almost none of the push is rubbing, and the reader cannot say what the rest is.
  2. The obvious account — the rest is pressure, the stream piling up on the front — fails on the exact frictionless flow of 1752: the pile-up at the nose is refunded at the tail, the refund is exact, and the meter on that flow reads 0.000.
  3. Putting friction back as a term in the equation (Navier 1822, Stokes 1845) fixes the honey end — the sinking sphere's drag comes out right where friction dominates (Stokes 1851) — and creates a new failure: at the knob's low end the term is a hundredth of the inertia it corrects everywhere except a rim a few cells thick against the disc, which lights up on the friction-share overlay and which the reader cannot explain.
  4. The wall condition (the fluid sticks, so its speed must fall to zero at the surface however little it rubs; Prandtl 1904) fixes that: the term is never small at the wall, the rim is a layer that thins as 1/√Re without vanishing — and the layer creates the next failure: fluid inside it has rubbed the wall the whole way round, reaches the back short of speed, cannot climb the tail's pressure, reverses, and the layer lifts off, so the tail's refund is never paid.
  5. The disc from (1): the pressure line on the meter is the unpaid refund — the wake's pressure deficit times its width, set by where the layer lets go, which is nearly the same place across a hundredfold change in friction; the rubbing line is the layer's skin, thinning with the friction; and when the layer's own flow tears (Reynolds's threshold, inside the layer) it lets go later, the wake narrows, and the push drops threefold (Eiffel 1912, Prandtl 1914).

### pbits
- Hero: One sixteen-bit frustrated glass (4×4, 24 unit wires, 9 agree / 15 disagree, three unsatisfiable plaquettes) run twice on one canvas under two unnamed schedules — both energy traces fall to the certified floor (−20), and the exact-versus-dwell number under the left pane reads ~0.03 while the right reads ~0.65; one shared coldness knob (Race, OVERLAY: labels hidden, β knob with the ghost re-enumerated per setting); it returns at the end with labels on as the Z1's two-phase clock beside the same chip on a one-phase clock.
- Thesis: What a computer made of noise outputs is not a state but a frequency — how often each state comes up — and a frequency can be wrong while the best state it finds is exactly right.
- Biggest flaw in current article: The hero is Part 3's wall of dreams, which nothing in the middle six sections threatens or repairs, so the article is two real failures (leans cannot buy agreement; all-at-once reads stale) bracketed by an unmotivated coin and a product catalogue, and the hero is paid only by a training act that belongs to the sibling article.
- Five sentences:
  1. Two sixteen-bit lattices with the same twenty-four wires run the same frustrated problem; both energy traces reach the certified minimum within tens of sweeps, and the number under the left pane reads about 0.03 while the number under the right reads about 0.65 — nothing in either pane's flicker says which is which or what the number counts.
  2. The obvious way to build a computer out of noisy bits is to give each bit a lean — a bias current on a threshold that thermal noise carries across — and a lean sets how often one bit is up, but no pair of leans makes two bits agree: the connected-agreement gauge sits at zero at every setting, and the only settings that reach the agreement mark are the ones that stop both bits flickering.
  3. A wire between the two bits buys agreement while both stay fair, and creates the problem the number answers: once bits are wired, the machine's output is a share of time per joint state and nothing on screen says what the shares should be — so a four-bit loop's sixteen states are counted by hand, energy by energy, the shares come out as e^{-βE}/Z, and the live loop's dwell-times held against that count is the number.
  4. The count is 2^n additions and one-at-a-time is n turns per sweep, so at 256 cells the count dies unless a patch is fenced by held neighbors, and the obvious repair to the turns — write every cell at once — pins the fenced number several times above the floor while the lattice looks fine, because every wire joins two cells written in the same instant; freezing one color of a checkerboard while writing the other removes every such wire, drops the number back to the floor with half the lattice written per tick, and is the schedule the Z1 runs.
  5. The two panes from (1) are the checkerboard clock and the all-at-once clock on one glass; the number under each is the distance between the dwell-shares the reader counted and the ones the pane produced; and the coldness knob does what e^{-βE}/Z predicts — both numbers fall toward zero at the hot end, and only the left pane's stays at the floor as the glass cools.

### learned-solver
- Hero: WarmStartRace, kept: one frozen divergence field, two pressure solves to one gate (left from zero, right from the 809-weight proposal), sweep counters and residual meters under each; single knob = the gate (10⁻²/10⁻³/10⁻⁴); returns at the end with a residual-versus-sweeps log plot underneath whose curves the reader draws before they run.
- Thesis: The solver's meter reads the error through the Laplacian, which makes it nearly blind to the smooth error that costs thousands of sweeps and loud about the rough error that costs a dozen — so a guess that supplies only the smooth part reads as worse than nothing, saves most of the work, and cannot corrupt the answer.
- Biggest flaw in current article: The article resolves its hero's paradox at line 160, a quarter of the way down, and never brings the hero back; the remaining three quarters — baseline, impulse response, gate, a seven-row map, a second network on a different seam, a four-field table — are announced one after another with no failure driving into any of them, which its own DENSE_CORE admits by calling the spine "a tour of checks in descending strength."
- Five sentences:
  1. A network's guess for the pressure field is about nine tenths of the answer, scores above 2 on the solver's residual meter where an empty grid scores 1, and the sweeps that start from it cross the gate in about a third of the sweeps that start from nothing.
  2. The obvious mechanism is lesson 01's — sweep from zero and stop at forty — and it fails on screen: a fifth of the defect is still there after forty sweeps, two hundred sweeps do not reach the gate either, and the leftover has a shape, because a three-cell ripple dies in a dozen sweeps while a channel-wide bulge is still on screen at six hundred.
  3. Supplying the bulge from a 12 × 8 grid — by hand, then by 809 weights — fixes the slow part (2330 sweeps become 840) and creates a failure the reader watches on the meter: a coarse guess arrives with seams along the coarse-grid lines, the residual is the error through the Laplacian, the Laplacian hears a seam hundreds of times louder than a bulge, and the meter scores the improving guess as worse than nothing.
  4. Dropping the meter and taking the guess as the pressure wrecks the flow in eight timesteps with the seams as the wreckage; keeping the meter as the finish line fixes that — the weights can be turned to noise and the accepted answer moves by under 1.24% — and creates the last problem: the network can now only move a sweep count, a sweep count is a ratio, and its denominator turns out to be a 1952 algorithm that crosses the gate in fewer passes than the warmed sweeps.
  5. The opening race, re-run with a residual-versus-sweeps plot under it: the warm curve starts above the cold one, drops below it within the first few dozen sweeps, runs a fixed distance ahead from then on, and the two accepted fields agree to 0.24% — every number under the hero is r = −A e read at three wavelengths, and the reader draws the curves before they run.

### wave-particle-duality
- Hero: A single-photon Mach–Zehnder bench (heralded down-conversion source, two half-silvered mirrors, detectors A and B, a both-in-one-window counter) with a clear polarization-rotating plate in one arm: at the top every click lands on A, B is silent, the both-counter reads zero, and turning the plate to 90° moves half the clicks to B; it returns at the end with P_B = (1 − cos θ)/2 drawn as a ghost over the live counts.
- Thesis: Each photon is counted whole, at one detector or the other; how often each detector counts is fixed by a sum that can come out to zero.
- Biggest flaw in current article: Nothing the reader builds ever fails — the lump model is refuted in prose, the classical wave the photoelectric section kills was never built, and the arrow rule that is the article's actual subject is issued in bold and never put under load — so the sections are exhibits with their verdicts already attached, not repairs.
- Five sentences:
  1. With both arms clear, every click lands on detector A, none on B, and never on both in one window; a clear plate turned to ninety degrees in one arm moves half the clicks to B.
  2. A photon that takes one arm and flips a coin at each mirror is never at both detectors but puts half the clicks on B at every plate angle, and its ghost counter runs at 50% over a real counter reading zero; a wave that splits at the first mirror keeps B silent but, at ninety degrees, fires both detectors in one window once per four photons, over a real both-counter that has not moved.
  3. An arrow per route — a turn per reflection the reader sets, the click rate the square of the closing arrow, one click drawn per photon — silences B and never fires both, but only at a quarter turn per reflection, and the same arrows predict that moving the upper mirror by a fraction of a micron changes nothing, while the counts swing through a full cycle every 810 nm of extra path.
  4. An arrow that also turns once per 810 nm of path predicts the swing, and read as a phase shifter it reproduces the plate's curve too — until, at ninety degrees with the mirror sweeping, the swing is not shifted but flat at one half for every mirror position, which no phase can produce.
  5. An arrow that carries the light's polarization as a tag, adding only along what the two tags share, predicts the swing's contrast as cos θ, the flat line at ninety degrees, and the hero's curve (1 − cos θ)/2 — and the two ghosts of (2) turn out to be the two ends of the plate's travel: the coin model exactly right at ninety degrees, the split wave exactly right wherever B is silent.

### z1-compiler
- Hero: The five-node sticky walk compiled onto a patch of the Z1 fabric and watched at depth: two exact occupancy panes (written vs compiled, five node bars plus a red no-node bucket), one knob = depth 1–30; at 30 two-thirds of the compiled pane is red; returns with a kernel toggle (opening/healed), the ceiling line, and the per-step number printed beside the depth number.
- Thesis: Every number the fit minimized was measured one step deep, and the walk runs thirty.
- Biggest flaw in current article: The hero's failure (a kernel right at every step runs the program wrong) is answered by the ladder at line 311, forty percent in, and the remaining sixty percent tours the fabric's wiring, a λ-shift lemma, a four-spin mixing dial, a price list, and a twelve-spin three-body model — four other specimens with no failure driving into any of them — so the article outlives its own story by more than half.
- Five sentences:
  1. A five-node walk compiled step by step onto a patch of the fabric is close to the written walk one step deep and, thirty steps deep, has two-thirds of its mass in states that are no node at all.
  2. The obvious mechanism — five output cells, one per node, fit as a table of probabilities with every input row weighted alike — fails twice on screen: with no hidden spins half of every row's mass lands on the twenty-seven configurations that mark zero tokens or two, and with three hidden spins the rows are as good as the wires allow while the depth-thirty pane is still two-thirds red, because the fit weighted five rows alike and the walk visits the sticky node three times as often as any other.
  3. Weighting each row by the walk's own visitation, on the same wires, drops the red bucket from 0.66 to 0.19 and the depth-thirty distance from 0.66 to 0.49 without the cold rows paying for it — and leaves the chain at 0.49 with every row as good as it gets, because the loss is five terms and each is one step deep.
  4. Fitting the trajectory instead of the table — run the chain thirty deep, score whole trajectories against the walk's law, nudge the parameters toward the better-scoring ones — takes the distance to 0.144 and the red bucket to 0.04, and makes the table wronger than at any point before (per-step KL 0.41 → 1.92, worst row 0.33 → 0.70), so a chain thirty deep is five times closer to the law than its worst row, and error along a chain is not a sum.
  5. The compiled chain forgets: feed it two different starting distributions and their gap shrinks by a measured factor ρ every step, so old errors fade as fresh ones arrive and the balance is the geometric series ε̄/(1−ρ), depth-independent — the walk from (1) climbs for a few steps and flattens under that line, and the healed walk, whose worst row puts its line above one, sits at 0.144 where the arithmetic is blind, because its rows were fit to cancel.

### ebm-diffusion
- Hero: The Billed Wall kept, with the control it lacks: twenty 8×8 chains on 16×16 z1-wired patches, the four-act strip and its total, the write-rate readout, the witness row — and one slider, dreams per batch (1–64), which reorders the loops and nothing else; at the end the same wall runs three specialists written once onto three patches and the knob is inert.
- Thesis: The price of a dream on this machine is the price of holding its evidence still; the dreaming itself is a rounding error on the bill, and it is the only line that decides what the dream looks like.
- Biggest flaw in current article: The verdict schedule (batched + conditioned) loses on the article's own two measurements — worse than untrained at the noisiest level and not the cheapest — and the wall that closes the ring bills that schedule without running it, so the finale's number belongs to a machine the reader never watched.
- Five sentences:
  1. Twenty chains dream identical glyphs under two settings of one knob, and the strip's total under one setting is less than a quarter of the other's; the reader sees both and cannot say what the difference bought.
  2. The obvious account — the price is the computation, the sweeps — fails on the strip's own bars: eighteen sweeps in a bill of a hundred thousand, and four-fifths of the bill is three kernel writes, one per level, because the level lives in the weights.
  3. Running every dream through a level before any kernel write cuts the writes from three per dream to three per batch and pulls the per-dream cost down as 1/N onto a floor — and creates lockstep: dreams arrive late and together, three writes per batch never go away, and the floor is undecomposed.
  4. Taking the level out of the weights — into two held code cells, or onto its own patch — removes the writes entirely; the code cells pay in accuracy the 4×4 oracle refuses (×4.0, ×1.20, ×7.5; worse than untrained at the noisiest level) and the patches pay in fabric, and what remains once the writes are gone is a floor that is ninety-six percent the price of holding sixty-four cells still, three times a dream.
  5. The wall from (1), billed at the schedule the repairs chose, prints a per-dream total the reader already computed from four rates and a loop order — the same dreams, bit for bit, at under a quarter of the price — and its knob does nothing, because there is no write left to schedule.

### navier-stokes
- Hero: The return: a channel with a disc, an amber blob dropped into a running stream, carried forward for a few seconds and then back for the same, on a loop, with a readout of how much of the blob came back; one slider from honey to water — the blob returns at the honey end and never at the water end, and returns at the close with the slider's ends relabelled in Reynolds number and the degradation predicted by a sign count on the assembled equation.
- Thesis: Whether a stir can be undone is decided by one term of the equation — the only term that keeps its sign when the stream reverses — and how much that term counts, against the term that drags neighbours together, is the Reynolds number.
- Biggest flaw in current article: The article is an inventory of the equation's terms, each introduced by its own instrument tour, with a single genuine failure (the heaping at L407) arriving two-thirds of the way through, and a hero wing that teaches nothing between its two appearances and returns relabelled rather than predicted — the one question the top figure asks (why the braid at one end of the slider and not the other) is never answered by the equation the reader assembles.
- Five sentences:
  1. A blob of dye carried past a disc by a stream that then runs backward comes back to its shape in honey and never in water, and nothing on the screen says why.
  2. The obvious fluid is one in which every bit of water keeps its velocity and carries it along — Newton with no forces, written with the derivative that rides the fluid — and it fails on screen: the stream drives straight into the disc, dye soaks through it, and the violet overlay marks fluid being created where none can be.
  3. A push that appears wherever fluid is being crowded, tuned by hand and then by the machine to exactly the height that cancels the crowding, fixes the heaping and sends the blob around the disc — and leaves a fluid that is water at every setting of the slider: the honey end is dead, and the blob never returns.
  4. A drag between neighbours, one term with one coefficient, gives the slider its honey end and brings the blob back — and the same honey fails to bring it back when the stream runs three times as fast, so the coefficient alone does not decide.
  5. Doubling speed and viscosity together leaves every frame unchanged, so only the ratio UL/ν decides; and in the assembled equation with the stream reversed, three terms flip sign and one does not — the carrying term, quadratic in velocity — whose size against the viscous term is that ratio, so the return watched at the top is predicted: near-complete at small Re, gone at large, degrading between, where the slider, now labelled in Re, shows it.

### fiber-bundles
- Hero: Two rows of clocks at rest with the blue rule A_y(x) drawn between them — the angle a lower needle must turn on its way up to its partner to count as "the same way" — and one tap on the curve plucks it: the bump splits, runs both ways at one speed with c·t markers, and each pair's faint ghost needle (the partner carried up by the rule) swings off and back, later at every pair. ConnectionWave 'pluck' with one new draw function (local ghost needles turned by A_y·Δy, replacing the left-edge-accumulated needle that turns every clock right of a tap instantly); returns at the end with the textbook E/B lane overlaid as the pulse's time-slope and space-slope.
- Thesis: Light is a wave in the rule for comparing one clock with the next, and that rule exists because, without it, no derivative of a phase means anything.
- Biggest flaw in current article: The article's one real failure chain (the brush kills the derivative → the rule repairs it → the rule is erasable on a line → loops make it un-erasable → the rule is unfrozen) occupies about 280 of 871 lines, sandwiched between a representation tour in front (string, rails, Möbius, rope) and an inventory tour behind (globe, dictionary history, Hopf–Dirac, four-stop dial, four forces, rings, Arnold, Yang–Chern, the tweet audited), and its hero — the textbook E/B diagram the prose itself calls "the picture of light you have seen before" — poses no question that the chain answers.
- Five sentences:
  1. A tap on a flat blue curve between two rows of resting clocks raises a bump that splits, runs both ways at one fixed speed, and swings each pair's faint needle as it passes, later at every pair — and the curve is not a wave value but a rule for comparing neighbors.
  2. The obvious way to do calculus on a row of clocks is the string's way — subtract neighbors' angles as if they were heights — and it fails on screen: repaint the zero-marks with a brush and the energy formula jumps while the rope it describes never moves.
  3. A transport rule A, tuned by hand until the mangled wave reads calm, repairs the derivative (Dθ = ∂θ − A holds still under any brush) and creates the diary problem: on a line, every such rule is erased by one counter-stroke, so the first figure's pulse could be a change of pure convention traveling — a time reform running down a telegraph line, which no meter reads.
  4. On a plane a needle carried by two routes arrives disagreeing; only enclosure counts; a shrunk loop gives a density F that no brush can create or destroy, and electrons sent around a sealed core slide their stripes by exactly the enclosed loop — which makes A physical and leaves it frozen: every rule so far was scenery set by hand, and a physical rule that cannot change is not yet a physical thing.
  5. Given the cheapest life a rule can have — it costs to curve and it costs to change, the string's two costs re-aimed at the rule — the first figure's pluck obeys ∂²A_y/∂t² = c²∂²A_y/∂x², runs at c, and carries two readouts no brush can touch, E = −∂_t A_y and B = ∂_x A_y, in step: the two rows are a slice of light, and the medium between them is the rule.

## Judge verdicts (identify the article from the quoted sentences; the journal does not carry labels)


### INTRO/READ judge #1
```json
{
  "intro_pass": false,
  "read_pass": true,
  "failing_sentences": [
    {
      "sentence": "A post standing in a river and the same post in a wind of the same speed are pushed with forces in about the ratio of the two densities — eight hundred to one — although water's friction is fifty-five times air's.",
      "reason": "Disputable on two grounds an expert would raise at once. (a) The 55x is dynamic viscosity mu; the hero's knob is nu, and in nu (the friction per unit of inertia, the thing Re measures) water is fifteen times LESS viscous than air — at equal speed and size the river post sits at 15x the air post's Re. The sentence's 'although' trades on water being the more frictional fluid, which is false in the measure the article's own knob turns; the intro's 'friction' and sentence 4's 'friction' are different numbers pointing in opposite directions. (b) A real post in a real river (D 0.1–0.3 m, U ~1 m/s, rough wood) sits at Re 1e5–3e5, on or past the article's own §4 cliff (2e5), where C_d falls toward 0.3 and the ratio becomes three or four hundred; 'about' does not carry a factor of two, and the audit's claim that it covers '20%' assumes both bodies are on the plateau without saying what size or speed puts them there."
    },
    {
      "sentence": "So most of that push is not rubbing — and rubbing is the only force a fluid exerts along a surface.",
      "reason": "The claim holds (skin friction is a few percent of blunt-body drag on the plateau; shear is the only tangential stress), but the 'So' asserts that sentence 1's two numbers license the deduction, and they do not: a rubbing force also scales with density through the layer it rubs in (F_skin ~ sqrt(rho*mu) U^1.5), so the honest water/air rubbing ratio is ~200, not 55. An expert reads the 'So' as a non sequitur that happens to land on a true conclusion. The fact is what the meter below reads; state it as the fact, not as an inference the intro cannot actually perform."
    },
    {
      "sentence": "Below, the fluid's friction is on a knob, and the meter splits the push on the disc into the part that is rubbing and the part that is not.",
      "reason": "Camera move at a concrete object — the sanctioned side of SLOP 20 — but it inherits sentence 1's defect: 'the fluid's friction' here is nu (the knob), while three sentences earlier 'friction' was mu, and for the intro's water/air pair the two rank the fluids oppositely. Also 'the disc' and 'the meter' arrive with definite articles when the intro has only spoken of a post, a ball, and a hand; the reader resolves 'the disc' by looking down, which works, but one clause naming the disc as the post's cross-section would cost nothing."
    },
    {
      "sentence": "A fluid with almost no friction is not almost a fluid with none.",
      "reason": "INTROS rule 8: no false universals for rhythm. Stated about 'a fluid' with no wall or body in the sentence, it is false almost everywhere — away from walls the small-nu limit IS the Euler flow, and the audit concedes exactly this ('the limit is regular away from walls; the claim is about bodies') before waving it through on the grounds that it 'holds for the article's object,' which the sentence does not name. Part 2's own thesis scopes it correctly ('the push on a body ... so a fluid with almost no friction...'); the intro strips the scoping to get the chiasmus. The 'almost / not almost' mirror is the one sentence in the paragraph a reader feels being written, and it is the one sentence that does not survive the math review as written."
    },
    {
      "sentence": "Poisson and Saint-Venant are priority disputes, refereed for two paragraphs by a site whose own plan said it would not referee them.",
      "reason": "Part 1 costume slip: Malcolm is a reader and cannot know what PLAN.md L63–64 says. This is the reviewer's knowledge placed in the reader's head; it belongs in PROSE or the cut list (where it already appears)."
    },
    {
      "sentence": "She guesses immediately that it is the million-dollar problem, because lesson 01's first paragraph told her about it, and she is right, so the plant is already spent for her.",
      "reason": "Part 1 vocabulary leak: 'plant' and 'spent' are planning-doc words (ESSENCE planted debts, INTROS rule 1). Tessa, a firmware writer, does not think in them. The felt version is what she already has — she knows the answer to the blank, so the blank is nothing to her."
    }
  ],
  "must_fix": [
    "Intro sentence 1, the friction quantity: make the compared 'friction' the same number the hero's knob turns. Either state the kinematic version honestly (at equal speed water's friction-per-inertia is a fifteenth of air's, and the push is still ~800x) or name mu explicitly and say in sentence 4 that the knob is mu at fixed density. As written the intro's 'friction' (mu, water 55x air) and the knob's 'friction' (nu, water 1/15 air) rank the two fluids in opposite directions, and a reader who knows nu_air > nu_water trips on the first sentence.",
    "Intro sentence 1, the number: pick a body and speed that stay on the plateau in both fluids and give the reader enough to check it (a hand at a slow walk in a pool vs. the same hand in the same breeze; or a small post in a slow river), or replace 'eight hundred to one' with the density ratio stated as such. A generic post in a generic river sits at Re 1e5–3e5, on the article's own §4 cliff, where 'about eight hundred' is off by two.",
    "Intro sentence 3: delete 'So'. The two numbers in sentence 1 do not license the deduction (a rubbing force scales with density too, through the layer it rubs in). State 'Most of that push is not rubbing' as the fact the meter below reads; keep the second half, which is the checkable claim that leaves the reader holding the remainder.",
    "Intro sentence 5: scope the thesis to a wall or a body so it survives the math review, as Part 2's thesis already does — e.g. 'Past a wall, a fluid with almost no friction does not move almost like a fluid with none.' If the scoping breaks the almost/not-almost mirror, let the mirror go; the audit's own concession ('regular away from walls') is INTROS rule 8 failing, and the mirror is the only place in the paragraph a reader feels the author's hand.",
    "Part 1: strip reviewer knowledge and vocabulary from the two heads. Malcolm cannot know what 'the plan said' (PLAN.md L63–64) and is not profiled as having read lesson 01, yet compares its debt skeleton and its figures four times — either add one line to his profile (he read lesson 01 last week) or move the sibling-repetition observations to PROSE where they already live. Replace 'the plant is already spent for her', 'the author narrating his own plant', 'not-X-but-Y', 'a figure built not to teach', and the one-word 'Recap.' with what the reader felt at that line."
  ]
}
```

### STORY/PHYSICS judge #2
```json
{
  "pass": false,
  "better_than_current": "Better story, not yet a better article. The outline replaces a thirteen-room timeline (two rooms live) with one failure chain on one number, and its cut list is right; that is a real spine where the current article has none. But the hero is lesson 01's CylinderFlow with a meter bolted on (a lateral move on the familiarity axis), and the ladder's quantitative claims — the 80° let-go point, the nose-minus-tail drag formula, the intro's eight-hundred-to-one — are wrong for the range the reader will actually see, and three of its \"overlay\" figures need GPU readback that does not exist in the codebase.",
  "story_failures": [
    "Hero familiarity is argued, not paid. The picture is lesson 01's CylinderFlow verbatim (same disc, same knob, same street); the only new thing is two numbers in a box. The Mercator postmortem (articles/maths/01-jacobian-hessian/STORY_CANDIDATES.md §POSTMORTEM) says novelty of the presentation is part of the commission, and this is also a full spine swap (timeline → drag-number ladder), which per the same postmortem needs an explicit labeled checkpoint from Nick, not an outline's self-justification.",
    "The Reynolds tube (Figure 10) enters §4 as 'then the last one-delta' with nothing asking for it — the exact defect Part 1 charges against the current article's averaging equation. The failure that should pull it in (the plateau argument predicts constant push forever; the measured curve in Figure 11 falls threefold at 2×10^5) is placed AFTER the tube instead of before it.",
    "Re = UD/ν is named in §2 'beside the knob' before Figure 6, the figure that shows the inertia/viscous ratio it names; phenomenon-before-name is violated by the outline's own ordering.",
    "Five-sentence #1 says 'almost none of the push is rubbing' and 'stays put while friction is turned down tenfold'; the ladder's own read-out says a fifth, the CPU knob's honest range is fivefold (Re 30–150), and the total drops about 20% across it. The story's opening sentence overstates what the hero will show.",
    "The intro's second sentence (push grows with ρ and U²) is never shown by any figure: the hero meter is normalized by ½ρU²·D, and IdealFlow's speed knob is display-normalized so Cp never changes. A claim the reader cannot check on screen is carrying the intro.",
    "The ending ties the Clay problem to the torn layer ('whether the equation keeps a smooth solution through such tearing') — a device dressed as a fact. The Clay statement has no boundary and no cylinder, and turbulence is not the suspected blow-up; the current article at least kept these apart.",
    "The §4 numbers (80° laminar, 120° tearing) are the high-Re textbook pair, but the reader's loupe at Re 30–150 will find the layer letting go near 115–130° and moving forward as Re rises — the figure will contradict the prose beside it."
  ],
  "physics_errors": [
    {
      "claim": "§4 / sentence 5: 'for laminar separation the let-go point sits near eighty degrees from the nose across a wide range of Re' and 'nearly the same place across a hundredfold change in friction'.",
      "correction": "80–82° from the nose holds only in the subcritical band Re ≈ 10^3 – 2×10^5. In the solver's range the laminar layer lets go at ≈127° (Re 40), ≈115° (Re 100), ≈110° (Re 200) from the nose and creeps forward with Re (Wu et al. 2004 J. Fluid Mech.; Zdravkovich). The reader will see ~115–130°, not 80°, and it moves with the knob."
    },
    {
      "claim": "Ending: 'about a third past 2×10^5, the same deficit with the layer torn'.",
      "correction": "Past the cliff the base pressure rises from Cp ≈ −1.2 to ≈ −0.3…−0.5 and the wake narrows; the deficit shrinks — that shrinkage IS the drop. The outline's own §4 says 'the deficit shrinks'; the ending contradicts it."
    },
    {
      "claim": "§4 math moment: D_p ≈ (p_nose − p_tail)·D 'formalizing two numbers the reader just read off the strip'.",
      "correction": "With Cp_nose = 1 and Cp_base ≈ −0.7 (Re ~100) this gives C_dp ≈ 1.7 against a measured C_dp ≈ 1.0; at plateau Re (Cp_base ≈ −1.2) it gives 2.2 against ≈1.1. The exact statement is the shaded area: C_dp = ½∮(Cp_solver − Cp_1752) cosθ dθ, since the 1752 curve integrates to zero. The nose–tail difference is a scale/upper bound, not the meter; a reader who checks it against the meter (which the article invites) finds it fails by 50–100%."
    },
    {
      "claim": "Intro: a post in a river and in a wind of the same speed are pushed 'in about the ratio of the two densities — eight hundred to one — although water's friction is fifty-five times air's'.",
      "correction": "Same post, same speed → Re_water = 15·Re_air (ν_air/ν_water ≈ 15). A 0.1–0.3 m post at 1–3 m/s sits at Re_water ≈ 10^5–10^6, straddling the smooth-cylinder drag crisis (2–5×10^5) that §4 introduces; C_d in water may be 0.3–0.5 against ~1.2 in air, so the ratio can be ~200–400. Also 'fifty-five times' is dynamic viscosity μ; the knob is ν, and water's ν is 1/15 of air's — the intro implies water is the more frictional fluid in the sense that matters, and it is the less."
    },
    {
      "claim": "§2: 'Euler's says zero' / §1: Euler 1757 'inheriting the zero exactly — the equations are exact and the answer is exact and it is zero'.",
      "correction": "The attached irrotational solution of Euler's equations gives zero; the same equations admit Helmholtz–Kirchhoff free-streamline wake solutions (1868–69) with finite drag. The inviscid limit is non-unique, which is the actual content of the thesis. Say 'the frictionless flow that stays attached says zero'."
    },
    {
      "claim": "Sentence 1: at the low-friction end 'almost none of the push is rubbing'.",
      "correction": "At Re ≈ 150 skin friction is ≈ 22–25% of the total (C_df ≈ 0.3 of C_d ≈ 1.3; ≈ 1/3 at Re 40). The ladder's 'a fifth' is right; 'almost none' is not."
    },
    {
      "claim": "Figure 6: 'At Re 30 the whole stream glows'.",
      "correction": "The ratio |ν∇²u|/|(u·∇)u| in the bulk is of order 1/Re ≈ 0.03 even at Re 30; only a region of order the diffusion length around the body and the wake lights up. The prose claim as written is false regardless of palette."
    },
    {
      "claim": "Hero acceptance test: 'pressure + rubbing agrees with the wake's momentum deficit to a stated tolerance'.",
      "correction": "Stable Fluids' semi-Lagrangian advection does not conserve momentum, so a control-volume balance will not close tightly on this solver. Calibrate against published C_d(Re) instead (Tritton 1959; Henderson 1995: C_d ≈ 1.5 at Re 40, ≈ 1.35 at Re 100); note BoundaryLayerLoupe already reads ≈1.13 at nominal Re 130 against ≈1.35 measured."
    },
    {
      "claim": "§1 history: 'd'Alembert's 1749 Berlin essay, the 1752 publication, \"a singular paradox which I leave to future Geometers\"' (quote listed as if from 1752).",
      "correction": "The quote is from the Opuscules, 1768 (RESEARCH.md §4); keep the 'twenty years on' dating the current article has."
    }
  ],
  "must_fix": [
    "Fix the separation and wake numbers to the solver's range: state that in Re 30–150 the layer lets go at roughly 130°→115° from the nose and creeps forward with Re, that ~80° is reached only above Re ~10^3 and holds to the cliff, and that past the cliff the base-pressure deficit shrinks (Cp_b ≈ −1.2 → ≈ −0.4) — delete 'the same deficit' from the ending. Add these figures, the C_d(Re) tabulation source for Figure 11 (Wieselsberger 1921 / Schlichting Fig. 1.4 / Tritton 1959), Eiffel 1912 and Prandtl 1914 to RESEARCH.md before any prose, per the article's own vow (a).",
    "Replace the §4 math moment: the formalization of the strip is the shaded area, C_dp = ½∮(Cp_solver − Cp_1752) cosθ dθ (the 1752 curve integrates to zero, so the gap IS the meter); present (p_nose − p_tail)·D only as the scale that carries no ν, never as '≈ the meter'. Verify the shaded-area readout equals the hero's pressure line on the actual solver before the sentence is written.",
    "Rewrite the intro's numbers to survive INTROS rule 8: choose a specimen that sits on the plateau in both fluids (e.g. a finger-thick rod at walking speed: Re_air ≈ 700, Re_water ≈ 10^4) or say 'hundreds to one'; say which friction is meant (μ) and reconcile it with the ν knob the hero uses (water's ν is 1/15 of air's) — or drop the friction clause and let the density ratio alone carry the gap.",
    "Re-cost the figure list honestly: src/sims/lib/gpu/solver_gpu.ts has no CPU readback (no mapAsync/MAP_READ), so Figure H's rubbing line, Figure 6, Figure 8 and Figure 9 on the GPU backend are NEW multi-day builds, not overlays; BoundaryLayerLoupe is CPU-only with Re fixed. Before prose, run a browserless spike (pattern: scripts/check-photonics-spike.ts) on the CPU solver at D = 14 cells measuring (a) C_df and C_dp at Re 30/60/120 against Tritton/Henderson, (b) whether δ halves between Re 30 and 120 when δ is ~2.6→1.3 cells, (c) the Figure-6 field average across Re; state which of the three hero read-outs survive, and replace the momentum-deficit acceptance test with agreement to published C_d(Re) within a stated band.",
    "Reorder for failure-driven entry: in §4 show Figure 11's cliff first as the failure of the plateau argument (constant let-go point predicts constant push; the measurement drops threefold at 2×10^5), then the Predict, then the Reynolds tube as the repair; in §2 move 'Re = UD/ν' to after Figure 6 so the ratio is seen before it is named; and put the hero decision (lesson 01's CylinderFlow kept, novelty carried by a meter only) to Nick as a labeled checkpoint, since this is a spine swap."
  ]
}
```

### INTRO/READ judge #3
```json
{
  "intro_pass": false,
  "read_pass": false,
  "failing_sentences": [
    {
      "sentence": "Under the left machine a number reads about three hundredths; under the right, about two thirds.",
      "reason": "Reversed against the figure the audit cites. In src/sims/pbits/Race.tsx runners[0] = 'all at once' (energy-level TV ≈ 0.65) is drawn at x0 = 8, the left pane; 'red / black' (≈ 0.03) is the right pane; the check probe binds synTV = tvs[0]. Part 2 lists only two changes to Race (labels hidden, β knob) — no pane swap — so the intro misreads the hero it specifies, and every left/right claim in Part 2 (five sentences, The chip, Ending) inherits the error."
    },
    {
      "sentence": "Two machines run the problem side by side, identical down to the wires, every bit flipping at random many times a second.",
      "reason": "False universal (INTROS rule 8). Measured on the shipped glass at β = 1: all-at-once bits flip ≈ 31 times/s each, but red/black bits have median 2.5 flips/s, five of sixteen under 1/s, the slowest ≈ 0.28/s. 'Every bit … many times a second' is false of the correct machine. The ~10× flicker gap is also a visible tell of which pane is which, contradicting Part 2's premise 'nothing in either pane's flicker says which is which.' The clause is additionally the winner's move-2 phrase ('its bits flip at random on purpose, millions of times a second') with the numbers swapped."
    },
    {
      "sentence": "Sixteen bits in a four-by-four grid, twenty-four wires between neighbors, each satisfied when its ends match or, for the other kind, differ — nine of one kind, fifteen of the other, dealt so that three of the nine small squares can never satisfy all four of their wires.",
      "reason": "The counts are correct (verified: 24 edges, 9 ferro / 15 anti, 3 frustrated plaquettes, E_min = −20), but the hero as specified — Race with labels hidden plus a β knob — draws sixteen bare cells, a trace, and a meter: no wires, no kinds, no squares. The reader is told to look at an object the figure does not show (rule 9: sharpen what the reader is about to see). The audit's 're-asserted by the check script' is untrue — no script asserts the 9/15/3 census; oracle/race-distribution checks only E_min and the TV ratio. Secondary: a fifty-word verbless fragment as the opening line is a spec sheet, not a fragment that carries more than the sentence would."
    },
    {
      "sentence": "Such a machine outputs not a state but a frequency — how often each state comes up — and the frequency can be wrong while the best state it finds is right.",
      "reason": "Spends the hero's unexplained element (rule 1) against the outline's own ledger. After 'each reaches a twenty-two-wire assignment' and the two numbers, this sentence tells the reader the output is a frequency and a frequency can be wrong while the best state is right — so the number measures frequency-wrongness and the two-thirds pane is the wrong one. Part 2's Debts say 'Two numbers under the hero, unexplained (intro) → what the number is (Four bits); which pane is which (The chip)' and sentence 5's audit says 'which pane is which is not given.' Both are decoded here. Either the thesis over-spends or the ledger is false; as written they cannot both stand."
    },
    {
      "sentence": "A chip built this way exists, a quarter-million bits flipped by their own thermal noise.",
      "reason": "The winner's move-2 sentence ('A chip now exists that runs on the noise instead') with nouns swapped: same subject, same verb, same slot after the measured object — the exact pastiche §3.4 of the critique warns about, and the sentence being copied is this article's own current intro. 'Built this way' is vague where every other clause is exact: the reader has just been shown two machines that differ, 'this way' names neither, and the Z1 (degree-16 sparse graph) is not a 4×4 unit-wire glass. Its job, per the author's audit, is 'the only reason two toy lattices matter' — that is significance, the thing Nick feels a sentence doing to him."
    },
    {
      "sentence": "Each reaches a twenty-two-wire assignment within a few dozen sweeps.",
      "reason": "'Sweeps' is a name before its phenomenon — nothing on the hero (unlabeled tick trace, 'N samples' under the meter) or in the reader's world defines one, so the claim is checkable only by someone who already knows the word. And the pane prints 'certified minimum −20' / 'lowest found: −20' while the intro says 'twenty-two wires' here and in the previous sentence; no bridge between the two units is offered, so the reader cannot bind either sentence to what is on screen."
    },
    {
      "sentence": "The best any of the 65,536 assignments can do is twenty-two wires; the assignments can be counted, so that best is certain.",
      "reason": "Correct (E_min = −20 with 24 unit wires ⇒ 22 satisfied), but stated in a unit the hero never prints; the figure's own on-screen fact is '−20'. The audit counts 'no energy word appears' as a virtue while leaving the reader with a number on screen the intro never accounts for."
    },
    {
      "sentence": "He has read this paragraph before — it is the worked example in INTROS.md.",
      "reason": "Part 1, Bram. A reader who has read the repo's private planning doc is the reviewer in costume. From here Bram's read runs on review vocabulary and scoring rather than felt reaction: 'trailer', 'a stage direction', 'planning-doc vocabulary in print', 'Tally: two/three/four/five', 'This section survives his read'."
    },
    {
      "sentence": "Two suspects, one of them innocent by construction, a beat of suspense, the planned reveal — the family-17 shape exactly.",
      "reason": "Part 1, Bram. Cites a SLOP.md family by number. No reader of the published site knows the family numbers; this is the critique naming its own taxonomy through a character's mouth — the definition of a review wearing a reader costume."
    },
    {
      "sentence": "Nothing is failing here and nothing is being built; she reads faster.",
      "reason": "Part 1, Odile. 'Nothing is failing / nothing is being built' is ESSENCE's failure-chain frame placed in a firmware engineer's head. What Odile would feel is that the page is a legend, not a machine; the reviewer's diagnosis leaks into her read. Same leak at L37–41: 'the sentence is enjoying itself' is the critic's line, not hers."
    },
    {
      "sentence": "nothing in either pane's flicker says which is which or what the number counts.",
      "reason": "Part 2, five sentences (1) — quoted because the intro's sentences 3 and 5 rest on it. False on the shipped figure: all-at-once bits flip ≈ 31/s, red/black median ≈ 2.5/s, five bits under 1/s. The flicker rate alone identifies the pane to anyone watching for two seconds, so the hero's stated wonder gap ('two panes that both solve the same problem and disagree by twenty-fold on a number nobody has seen') is smaller than claimed."
    }
  ],
  "must_fix": [
    "Fix the pane order once and propagate it. Either (a) add 'runners reordered: red/black left, all-at-once right' to the Race change list in Part 2's Hero, noting that check-pbit-act2.ts binds probe.synTV = tvs[0] and must be updated with it, or (b) keep the shipped order and rewrite sentence 5 to 'Under the left machine a number reads about two thirds; under the right, about three hundredths', then swap left/right in Part 2's five sentences, The chip, the Ending, and the audit line for sentence 5.",
    "Replace 'every bit flipping at random many times a second' with a claim true of both panes (measured: all-at-once ≈ 31 flips/s per bit; red/black median 2.5/s, five bits under 1/s) — e.g. 'bits flipping at random, some of them many times a second' — and resolve the flicker tell: delete Part 2's 'nothing in either pane's flicker says which is which' and either state the ~10× flicker-rate difference as a flat fact in the intro (it is a real, checkable difference the reader will see) or specify the figure change that hides it (e.g. panes show best-so-far only, no live cells) and list it under the Race changes.",
    "Bind sentences 1, 2 and 4 to what the hero actually draws. Either add 'draw the 24 wires in their two inks on both panes' and 'label the floor as 22 of 24 wires satisfied — certified' to the Race change list (then 'nine of one kind' can name the ink), or cut sentence 1 to what the pane shows (sixteen cells, a trace falling to a dashed line, a number) and move the wire census to the section where wires first appear; state the floor in the figure's own unit or change the label; replace 'sweeps' with a phrase the reader can see (e.g. 'within a few seconds of running'). Remove 're-asserted by the check script' from the audit or add ok(ferro === 9 && frustrated === 3, ...) to check-pbit-act2.ts.",
    "Cut 'A chip built this way exists, a quarter-million bits flipped by their own thermal noise.' from the intro — it is the winner's move-2 sentence with nouns swapped and its job is significance; the Debts ledger already assigns the chip's arrival to The chip, and the thermal-noise fact can ride on the Microscope figure in One bit. Then make the thesis and the ledger agree: either shorten the thesis to the half that does not decode the hero ('What a computer made of noise outputs is not a state but a frequency — how often each state comes up.') and let 'the frequency can be wrong while the best state is right' be the verdict paid on the right pane in The chip, or keep the full thesis and rewrite the Debts entry and sentence 5's audit to admit that the number's meaning and the wrong pane are given in the intro and only the mechanism (the schedule) is owed.",
    "Rewrite Bram as a reader with no access to repo docs. Delete every sentence that names INTROS.md, a SLOP family number, 'planning-doc vocabulary', 'trailer', 'stage direction', 'the ring narrating itself', 'lesson 01's/02's device', and the 'Tally: N' scoring; replace each with what he feels at that line (the hand on his back, the word he has seen before on this site, the moment he stops reading and starts noticing). Keep the felt beats that already work — closing the tab at L779, returning the next day, 'he asks at each figure what the wall on top needs from this and the answer is nothing'. In Odile's read, replace 'Nothing is failing here and nothing is being built' and 'the sentence is enjoying itself' with what a firmware engineer would actually think at those lines."
  ]
}
```

### INTRO/READ judge #4
```json
{
  "intro_pass": false,
  "read_pass": false,
  "failing_sentences": [
    {
      "sentence": "The solver's only meter is the residual, one pass over the grid: an empty grid scores 1.00, lower is better, and the proposal scores above 2.",
      "reason": "Disputable and contradicted by the article's own §1. Lesson 01's solver (src/sims/lib/solver.ts `project()`) computes no residual, has no tolerance, and stops at PRESSURE_ITERS = 40 — the intro said so two sentences earlier, and the new §1 is built on 'no check.' The meter belongs to this lesson's instrument (poisson.ts `relResidual`), not to the solver. It also spends math-budget item 1 ('one pass, equal to 1 at p = 0'), which the ledger says arrives after SolveDebt's trace, and §5 then claims the black box is 'stated once' in §5."
    },
    {
      "sentence": "The proposal is also about nine tenths of the correct field, and sweeps that start from it cross the residual gate in about a third of the sweeps that start from nothing.",
      "reason": "'The residual gate' arrives with a definite article and no definition, three sentences after 'It stops after forty sweeps' — the solver just described has no gate, so a reader who took sentence 3 literally has both panes stopping at forty. 'About a third' holds only at 10⁻³ (h1 3.4×, held-out 2330→840) and the gate is unstated; the hero's single knob sets 10⁻² (≈8×) and 10⁻⁴ (≈2×), so the one button the reader is handed falsifies the sentence. Fails INTROS rule 8."
    },
    {
      "sentence": "A network with 809 weights, trained on that solver's own divergence fields and checked into this repository, now proposes the pressure field before the first sweep.",
      "reason": "The p-bits move-2 hinge beat for beat: three sentences of the existing machine measured, then 'A [noun] now [verbs]' ('A chip now exists that runs on the noise instead'). The closing audit claims 'no measured-familiar / inversion' shape; the intro has two of its three moves. 'This repository' addresses the build artifact, not the machine — the reader is on a web page (the current MDX says 'this website's repository')."
    },
    {
      "sentence": "He has read this site's own before/after for promissory narration — \"the distance between those two sentences is this whole article\" — and this is the same construction.",
      "reason": "Reviewer in a reader costume: that before/after is SLOP.md family 1. No reader has it. The felt version is what the construction did to him at L44–46, not which repo doc it matches."
    },
    {
      "sentence": "L28. \"the crime.\" Lesson 01's device, seven deployments there, back again.",
      "reason": "Checkably wrong: lesson 01 currently uses 'crime' twice (L435, L451). 'Seven' is SLOP family 19's July count, quoted from the detector, not from reading lesson 01."
    },
    {
      "sentence": "L534. \"One more honesty item, and it is the one that matters.\" He knows the flagged lesson-02 sentence this is the sibling of. He closes the tab.",
      "reason": "Reader costume: the flagged lesson-02 line lives in NICKS_VOICE §5 / SLOP family 18. A reader closes the tab because the sentence is about the article; he does not know the incident it resembles."
    },
    {
      "sentence": "Planning vocabulary in print; he has seen this family on this site before.",
      "reason": "'Family' is the detector's vocabulary; the same costume runs through 'Aphorism one,' 'Aphorism two,' 'The reveal register, pointed at a table,' 'the survey slide,' and 'it took 260 lines to get there' — readers do not count lines or name families."
    },
    {
      "sentence": "repetition: lesson 01 L8, \"running right now, a few centimeters below this paragraph.\"",
      "reason": "Wrong anchor: the line is lesson 01 L29 (L8 is an import). The read's claim to be line-anchored is checked by exactly this kind of citation."
    }
  ],
  "must_fix": [
    "Rewrite intro sentence 5 so the residual is the figure's meter, not the solver's: lesson 01's `project()` has no meter and §1 depends on that. Say what the meter reads (how much divergence a pressure field leaves uncancelled, relative to all of it), that an empty grid reads 1.00 and the proposal 2.42, and drop 'one pass over the grid' so §5 states the black box once as the outline says.",
    "Rewrite intro sentence 6: either name the gate ('swept until the meter reads below one part in a thousand') and give the ratio at that gate, or cut the ratio and let the race's '3.4× fewer sweeps' chip print it. As written it contradicts 'It stops after forty sweeps' and is falsified by the hero's only knob.",
    "Rewrite intro sentence 4 to break the 'A [noun] now [verbs]' hinge shared with the p-bits opening — fold the network into the figure (the right-hand pane starts from a pressure field a network wrote before sweep one; 809 weights, trained on this solver's own divergence fields), replace 'checked into this repository' with the website form or cut it, and correct the closing audit line that denies the shape.",
    "Part 1, Warren: rewrite every entry to what a reader with no access to this repo's docs can notice. Cut the citations to SLOP's before/after, 'this family,' the flagged lesson-02 line, 'Aphorism one/two,' 'the reveal register,' 'the survey slide,' '260 lines'; recount 'the crime' in lesson 01 (two: L435, L451). For each line keep what he felt and what he did next, in his words.",
    "Fix two checkable slips in the self-audit: 'lesson 01 L8' is L29; 'in the order the hero prints them' is false — WarmStartRace prints '% of the field still missing' on ledger line 2 and 'its own residual' on line 3, and the intro gives residual first. Either reorder sentences 5–6 to match the figure or delete the claim."
  ]
}
```

### STORY/PHYSICS judge #5
```json
{
  "pass": false,
  "better_than_current": "A better story shape than the current article: the ring now closes on the page's real marquee (two schedules, one glass, one number), the specimen stops hosting (Extropic's catalogue drops from ~2,900 words to one section), and every section after the first is driven by a visible failure. But it is a lateral move on the hero — it is Variant C's banked hero from articles/05-pbits/OUTLINES.md, and it now duplicates the twin-pane-with-hidden-audit-number device that physics-03-z1.mdx already opens on — and its two closing beats rest on claims I measured to be false on the shipped glass (the cold-end knob) or not derivable as stated (the Boltzmann shares \"counted by hand\"). Fixable in a revision; not passable as written.",
  "story_failures": [
    "Sibling skeleton: the hero device (two panes of one object whose visible statistics agree while an audit number under them disagrees) is the opening device of Part 2 — src/lessons/physics-03-z1.mdx L13–L47 runs the walk twice, histograms match, and 'the quiet strip along the bottom disagrees… prints two numbers the histograms cannot see.' The outline's defense ('neither sibling has two panes of one glass') is a noun-swap defense of exactly the kind the brief's rule 5 forbids. The series would open twice on the same shape.",
    "The Four-bits section enters as 'then we look at a ring' behind a manufactured naive build ('the loop should sit in its cheapest state' — nobody proposed that). The failure that should drive into it is on screen in the hero: I computed the hero glass's plaquettes (scratchpad probe on raceGlassModel) and plaquette (2,2) is exactly three agree-wires and one disagree-wire — it IS lib.ts's frustratedLoop. The intro plants 'three of the nine small squares can never satisfy all four of their wires' and the outline never cuts one of those squares out to count it; the plant is left half-paid and a free hero tie is missed.",
    "The ending's last two beats are both unsound. (a) The coldness-knob beat ('cooling, the right pane's number climbs and the left stays at the floor') is the outline's own invention, flagged in a parenthetical as unverified, then asserted as fact in five-sentence #5 and the Ending; measured on the shipped glass it is false (see physics_errors). (b) The closing aphorism — 'the whole difference between a computer made of noise and a noise generator built from the same transistors' — contradicts the thesis the page just paid (the right pane finds the certified ground state; a noise generator does not) and is Variant C's banked ending ('one number stands between a stochastic computer and an expensive noise machine') recycled.",
    "The Four-bits stretch is still five consecutive figures on one sixteen-column object (energy, weight, normalize, MeterForge, conditional). It is defensible as a ladder, but the weight page is a figure that asserts the law: the reader 'reads the ratio of two column heights' off bars the figure drew as e^{-βE} by fiat, and sentence 3 then says the shares 'come out as e^{-βE}/Z' from counting. The reader counted energies, not shares; the exponential was handed to them.",
    "The cut list says Parts 2 and 3 'already own' the compiler and the trainer, but Part 2 is written as a continuation of Part 1, not a re-teach: physics-03-z1.mdx L32 'the treatment Part 1 ended with', L51 'Part 1's fabric drawing', L145 'Part 1 built the thermodynamic kernel with hands', L185 'Part 1's factorized failure', L452 'Part 1 ended its…', L496 'Part 1's triangle repair', L567–568 'In Part 1, one hidden spin bought XOR'. The outline's 'consequence for a sibling' names only Part 3's first sentence; the real bill is seven load-bearing references in Part 2 plus Part 3's opening.",
    "The hero's only control is a β knob whose behavior contradicts the intro at most settings (both traces reach −20 'within a few dozen sweeps' holds near β=1 only — at β=0.25–0.5 synchronous needs ~750–800 sweeps, at β=4 it never reaches −20). Without the knob the hero is two small dashboards (13-px cells) with nothing for the reader's hand; the outline concedes it is 'visually smaller' but does not solve the passivity."
  ],
  "physics_errors": [
    {
      "claim": "The chip section / five-sentence #5 / Ending: 'the coldness knob does what e^{-βE}/Z predicts — both numbers fall toward zero at the hot end, and only the left pane's stays at the floor as the glass cools'; 'cooling, the right pane's number climbs and the left stays at the floor'.",
      "correction": "Measured on the shipped Race glass (seed 71, run seed 5, 5,400 ticks — the figure's own 90-second budget): synchronous energy-level TV is non-monotone in β — 0.66 (β=1), 0.95 (1.5), 0.17 (2.0), 0.31 (3.0), 1.00 (4.0) — and across eight seeds at β=3 it ranges 0.009–1.000 (β=2: 0.078–1.000). Because the exact law concentrates on the ground rung at cold (P(ground)=0.98 at β=3), a synchronous run that freezes into a ground state reads near zero on the rung meter while one caught in a period-2 oscillation reads 1.0; the chromatic pane can also starve high on a slow-mixing seed (0.189 at β=3). Only the hot end is safe: at β=0.05 both read small (syn 0.09, chr 0.02) because a stale read of a fair coin is a fair coin. State the hot end only, or verify a restricted β range (≈0.75–1.5, where syn ≥ 0.65 and chr ≤ 0.05 on seed 5) and ship the knob clamped to it. Also state that rung-TV is a coarse-graining (a lower bound on state-TV): 0.65 proves wrongness; 0.03 is consistent with, not proof of, state-level correctness."
    },
    {
      "claim": "Intro sentence 4 and the hero with a β knob: 'Each reaches a twenty-two-wire assignment within a few dozen sweeps'; The chip: 'both traces reach −20 because optimizing is the thing all-at-once does fine'.",
      "correction": "True at the figure's default β=1 (syn 17 sweeps, chr 2). With a knob on the hero it is false at most settings: syn first reaches −20 at sweep 796 (β=0.25) and 745 (β=0.5), never within 5,400 sweeps at β≤0.1 (min −18) or β=4 (min −14, frozen in a 2-cycle). If the hero keeps a knob, the intro's sentence must be qualified or the knob restricted."
    },
    {
      "claim": "One bit: 'a bias current, thermal noise riding on it, a comparator… sweep the current and the measured flip-rate dots land on the same S'; debt ledger: 'the S-curve is what a noisy threshold does'.",
      "correction": "A threshold with Gaussian (Johnson/thermal) noise has the probit transfer curve Φ(I/σ_n), not the logistic σ(2I); after slope-matching the two differ by ~0.01–0.02 in probability and their tails differ (e^{-x²} vs e^{-x}). The dots land exactly on σ only because src/sims/pbits/Microscope.tsx samples logistic-distributed noise (act3.ts logisticNoise: log(u/(1−u))/(2β)) — the figure's own header comment says so. Write 'an S-curve; the figure's noise is logistic-shaped so the match is exact, and calibration absorbs the difference on real silicon' — or confess the noise shape on the figure. Do not state the sigmoid as the physics of a thermal comparator."
    },
    {
      "claim": "Five-sentence #3: 'a four-bit loop's sixteen states are counted by hand, energy by energy, the shares come out as e^{-βE}/Z'; Four bits: 'read the ratio of two column heights at two coldness settings (an exponential of the energy gap)'.",
      "correction": "Counting the sixteen states yields energies and degeneracies (two shelves of eight at −2 and +2), not shares. The exponential weight is the Boltzmann law: it is either postulated, extracted empirically from the live loop's dwell ratio between the two shelves at two β (log-ratio linear in β·ΔE with ΔE=4), or proved stationary via the conditional page (each update draws from the law's own slice, so the law is invariant under the rule — uniqueness is M2's detailed-balance/ergodicity story per CONCEPT_BANK). The weight page as built draws e^{-βE} by fiat (StateAtlas.tsx L105), so 'reading the ratio' off it is circular."
    },
    {
      "claim": "Intro sentence 6: 'A chip built this way exists, a quarter-million bits flipped by their own thermal noise.'",
      "correction": "The verified ledger (articles/06-z1-compiler/RESEARCH.md) records Z1's ~250,000 nodes, but its rate as 'the chip WILL perform between 10⁶ and 10⁷ Gibbs iterations per second' and its energy as an estimate; X0 is the chip verified as fabricated test silicon (subthreshold CMOS p-bits via XTR-0, calibrated to ~5% absolute probability). Binding 'exists' to the quarter-million figure asserts Z1 silicon the ledger does not verify. Either mirror the accepted intro ('a chip now exists that runs on the noise' — X0-class) without the count, or write 'a chip designed this way — a quarter-million bits…'."
    },
    {
      "claim": "Ending: 'the difference between the two panes is the number of phases in a clock, and that is the whole difference between a computer made of noise and a noise generator built from the same transistors.'",
      "correction": "The right pane is not a noise generator: it reaches the enumerator-certified ground state about as fast as the left pane (the outline's own thesis: best state right, frequency wrong). 'Whole difference' is a false universal — weights, calibration, nonideality and mixing all separate the two. State the fact: the panes differ by one clock phase; one samples the law and one does not; nothing on screen but the number says which."
    },
    {
      "claim": "Two hundred fifty-six bits: 'the patch's law given the fence is the slice, sixteen states again, exact'; Waypoint: 'the slice (one bit's share given its neighbors' states is the S-curve of its field)'.",
      "correction": "The Waypoint defines the slice as a one-bit conditional (one S-curve); the fenced 2×2 patch's law is a four-bit joint conditional requiring enumeration of 16 states with the fence folded into effective biases (lib.ts subModel). Same principle (Markov blanket), different object — call the patch's law the fenced count, and reserve 'the slice' for one bit, or the Waypoint's black box is misdescribed when §4 consumes it."
    },
    {
      "claim": "Four bits figure list: 'Knob: coldness β, the hero's knob, on every page.'",
      "correction": "As built, StateAtlas mode=\"conditional\" locks β=1 (StateAtlas.tsx L717–721) and mode=\"energy\" has no knob (energies are β-independent). Only weight/normalize carry the knob among the pages kept."
    }
  ],
  "must_fix": [
    "Ending + hero knob: delete the cold-end claim. Either (a) remove the β knob from the hero and the closing Race overlay and end the knob beat at the verified hot end only ('hot, both numbers meet near zero — a stale read of a fair coin is a fair coin'), or (b) add a β-sweep assertion to scripts/check-pbit-act2.ts over the range you intend to ship and clamp the slider to the range where it passes on the figure's seed (my probe: β≈0.75–1.5 gives syn ≥0.65, chr ≤0.05, both reach −20 within 60 sweeps). Then replace the closing aphorism with the fact: the panes differ by one clock phase; one samples the law, one does not; only the number says which — the right pane is not a 'noise generator', it found the certified ground state.",
    "Boltzmann law provenance: stop saying the shares were 'counted by hand'. Reorder Four bits so the live loop is measured before the law is drawn — MeterForge (OVERLAY: ghost hidden) at two β, reader reads the tall-shelf/short-shelf dwell ratio (ΔE=4, so the ratio is e^{4β}: ≈3.3 at β=0.3, ≈7.4 at β=0.5), then the weight page formalizes what was measured, then normalize/Z, then the conditional page proves the law is invariant under the rule (each update draws from its own slice). Rewrite five-sentence #3 to 'measured dwell-shares, counted energies, and the exponential that bridges them'. If you prefer to postulate the law, say so in one flat sentence as the current article does (L227–229).",
    "Lift Four bits out of the hero and differentiate the hero from Part 2. The hero glass's bottom-right plaquette (2,2) is exactly three agree-wires and one disagree-wire (raceGlassModel, seed 71) — the same object as lib.ts frustratedLoop. Open Four bits by cutting that square out of the hero ('one of the three squares the intro said can never be satisfied'), which pays the intro's plant and removes the manufactured 'the loop should sit' naive build. Then change the hero's form so it is not physics-03-z1's twin-pane device: one glass, one unlabeled two-position schedule toggle under the reader's hand (labels A/B), the trace and lattice unchanged by the toggle while the number under it flips 0.03↔0.65 — verified at β=1 by the existing race assertion; the closing figure returns with the toggle labeled. If you keep two panes, state in the outline why Part 2's opening (L13–47) is not the same skeleton, or change Part 2.",
    "Bill the sibling consequences honestly. List, in the outline's cut-list section, every Part 2 dependency this cut breaks — physics-03-z1.mdx L32 (thermodynamic-kernel treatment 'Part 1 ended with'), L51 (fabric stand-in), L145 (kernel built 'with hands'), L185 (factorized failure), L452, L496 (triangle/chain spins), L567–568 (XOR needs a hidden spin) — and decide each: re-teach in Part 2 (one figure apiece: KernelTable→CompileCopy, XorHidden, Triangle already exist and are REUSE there), or keep a one-figure compile beat in Part 1. Also list thermo-03-diffusion.mdx L1's noun swap, which the outline already notes.",
    "Figure honesty and small facts: (1) relabel Microscope in One bit as OVERLAY — as built it draws two neighbor currents (J=0.8 boxes, ±0.8 labels) before any wire exists; hide the neighbor branches or introduce them in prose; and change 'the S-curve is what a noisy threshold does' to 'an S-curve — this figure's noise is logistic-shaped, so the match is exact; Gaussian thermal noise gives the near-identical erf, and calibration absorbs the difference'. (2) Swap Race's runner order (Race.tsx L138–141 puts 'all at once' on the LEFT) or swap the intro's left/right. (3) Note that the conditional atlas page locks β=1. (4) Hedge intro sentence 6 per the ledger: do not bind 'exists' to the quarter-million count unless RESEARCH.md can cite a sentence saying Z1 silicon was fabricated; the papers say Z1 'will perform' and its energy is 'estimated'."
  ]
}
```

### INTRO/READ judge #6
```json
{
  "intro_pass": false,
  "read_pass": false,
  "failing_sentences": [
    {
      "sentence": "The twin meets a half-silvered mirror and splits into two equal arms that rejoin at a second one, with a detector on each output.",
      "reason": "The grammatical subject of \"splits\" is the photon. The sentence takes the wave side of the question §2 exists to test (coin model: the photon does not split), and it contradicts the outline's own §1 solver sentence (\"nothing is drawn travelling in the arms, because drawing it would take a side\"). The audit's defense (\"the sentence does not decide\") is false on the page as written. An expert disputes \"the photon splits\" as wrong, not as content. Rule 1 spent in the wrong direction."
    },
    {
      "sentence": "A third counter, for A and B in the same window, stays at zero.",
      "reason": "Rule 8 false universal, and inconsistent with the writer's own hedging: B got \"all but silent\" one sentence earlier, the both-counter gets a flat zero. The reader has been told about a real laser and crystal and takes this as a bench fact; §1's body then tells them the bench reads nonzero. The number the audit and §1 rely on (\"under two clicks in a hundred, Thorn 2004\") mis-paraphrases g²(0) = 0.018, a ratio against the rate two independent detectors would give, not a per-hundred click count. An expert disputes it."
    },
    {
      "sentence": "A clear plate in the upper arm turns the light's polarization; its twin in the lower arm, fixed at zero, keeps the arms matched.",
      "reason": "\"Twin\" has meant the photon since S2 (\"its twin enters the bench\", \"The twin meets a half-silvered mirror\"). Here it means a plate. The reader tracking the twin through the bench hits the collision at the hero's knob, in the sentence that introduces it."
    },
    {
      "sentence": "Turn the upper plate to ninety degrees and half the clicks move to B.",
      "reason": "Wrong for the device the audit names. A half-wave plate turned to α rotates polarization by 2α; at 90° the arms are back to parallel polarization with a π sign flip, so all the clicks move to B, not half. Half is at 45°. A Faraday rotator is not turned at all. The hero knob (\"plate's angle, 0° to 90°\"), §5's V = |cos θ|, and the harness check \"B at 50 ± 2% at 90°\" all inherit the conflation of plate angle with polarization angle. This is the hero fact, and a domain expert disputes it on the first read."
    },
    {
      "sentence": "Each photon is counted whole, at one detector or the other; how often each counts is fixed by a sum that can come out to zero.",
      "reason": "The first clause restates S6 and fails the delete test inside a 155-word intro; it exists to build a two-clause shape. That shape ([fact]; turn; [paradox clause], thesis last) is what seven of the eight intros in this pass end on (pbits \"…the frequency can be wrong while the best state it finds is right\", navier-stokes \"…a stir that can be undone and one that cannot\", ns-history \"…not almost a fluid with none\", z1 \"…and the walk runs thirty\"). The fragment thesis the critique demoted has been replaced by a new sibling stamp, and this sentence is an instance of it."
    },
    {
      "sentence": "The demonstrative reveal. He has read the house style doc's own name for this.",
      "reason": "Part 1, Jonah L79–80. The reader has read SLOP.md. This is the reviewer in a reader costume; the whole Jonah section runs on house vocabulary (\"trailer register\", \"stage direction\", \"the planning doc speaking\", \"promissory device\", \"inverse-solver move\"), keeps an aphorism tally as a score, and opens the component's source code. His three real structural findings already appear in STORY and PROSE, so the section duplicates the diagnosis with a name attached instead of simulating a read."
    },
    {
      "sentence": "She notes that the article has led with its cleverest sentence, and that a page which leads with its cleverest sentence usually spends the rest of its length explaining the sentence.",
      "reason": "Part 1, Rosa L11–14. A critic's maxim placed in the head of a backend engineer on a train. Everywhere else Rosa is felt and line-anchored (the red column, collecting lines, the API-shaped rule, never touching anything that produced V²+D²); this line is the reviewer speaking through her."
    }
  ],
  "must_fix": [
    "Part 3 S3 and S7: make the bench divide, not the photon (e.g. \"At a half-silvered mirror the path divides into two equal arms that rejoin at a second one, with a detector on each output\"), and rename the lower-arm plate \"a matching plate\" so \"twin\" names only the photon.",
    "Part 3 S8, the Hero knob, §5 math, and the harness checks: choose the device and make every number agree. Half-wave plate: half the clicks move to B at 45°, contrast is |cos 2α|, knob runs 0° to 45° (or 0° to 90° with 2α carried through §5 and the \"B at 50% at 90°\" check). If the knob is to be the polarization angle itself, name a device that rotates by the angle it is set to and say so in S7; a wave plate does not.",
    "Part 3 S6 and the fact §1 prints under the figure: correct the Thorn number (g²(0) = 0.018 means the both-counter ran at under two hundredths of the rate two independent detectors would give, not \"two clicks in a hundred\"), then either hedge S6 as S5 is hedged (\"all but never moves\") or pin \"stays at zero\" to the figure explicitly, so the reader is not told a real bench reads zero one paragraph before being told it does not.",
    "Part 3 S9: cut the first clause (S6 already carries it) and break the two-clause paradox shape every sibling intro in this pass ends on. End on a single-clause claim about the sum, or end on the plate fact (S8) and give the sum claim to §1's savior line.",
    "Part 1: rewrite Jonah as a reader. Delete every line that names a house-doc family or device (\"trailer register\", \"demonstrative reveal\", \"the house style doc's own name\", \"the planning doc speaking\", \"promissory device\", \"stage direction\", \"inverse-solver move\"), the aphorism tally, and the visibilityFrom source inspection; keep what he feels at each line and leave his three structural findings (classical wave never built, one function evaluated twice, rule issued not found) to STORY and PROSE, where they already appear. Cut Rosa's L11–14 \"cleverest sentence\" maxim. Story-before-prose order and the five \"Then we look at\" sentences are honest and stand."
  ]
}
```