# Slop Critique — Lesson 01: Building the Navier–Stokes Equations

Surgical edit ledger. Line numbers refer to the current
`src/lessons/lesson-01-navier-stokes.mdx`. Verdicts follow SLOP.md's 19 families and
four tests; ties broken by `reader-journey.md` (felt → lives; predicted → dies).
Replacement prose is drafted for every KILL/CUT/REWRITE that leaves a hole — the
rewriter should need no judgment calls.

Sim-source facts cited below were verified this session:
`PRESSURE_ITERS = 40` (`src/sims/lib/solver.ts:37`), `NX = 120, NY = 72`
(`src/sims/SolverXray.tsx:14–15`), dual dye rows (`src/sims/WingFlow.tsx:57–58`),
and — negative finding — the FlowVis speed demo runs on `breezeField`
(`src/sims/FlowVis.tsx:23–28`, `src/sims/lib/field.ts:46–60`), which has **no banks
and no wall damping**. See Part 3, proposal 9.

---

## PART 1 — DEVICE CENSUS (family 19)

### Device: "crime" (coined at the DivergenceLoop; 10 instances)

The census, every instance:

| # | Line | Quote | Verdict |
|---|------|-------|---------|
| 1 | 412–413 | "the <C k=\"div\">violet</C> shading marks the scene of the crime." | **KEEP** — the coinage, full strength. The loop has literally just caught a hidden spring; the metaphor is the event. Marcus: "catch it red-handed… thinking in the article's crime vocabulary now." Priya: "doing real referential work." |
| 2 | 427 | "<C k=\"div\">violet crime</C> everywhere around it" | **KILL** — doubled use in the same paragraph as #3; the color already means violation. Replacement: "— <C k=\"div\">violet</C> everywhere around it." |
| 3 | 429 | "your job is to cancel the crime:" | **KEEP-AS-PAYOFF** — the one echo. The coinage caught the crime; here the reader is handed enforcement, and at 436–439 is fired when told the fluid needs no one at the slider. That completes the arc (crime caught → reader cancels it → real pressure revealed as the standing enforcer). Marcus is still using the vocabulary with pleasure here ("overshoot on purpose to see the reverse crime"); it is the last instance any simulated reader registers as felt. The device retires at line 439. |
| 4 | 434 | "a crime in the other direction" | **KILL**. Replacement: "Too high, and you've overcorrected — the hill hollows the spot out, divergence with the opposite sign." |
| 5 | 462 | "the pressure landscape whose disagreement-with-neighbours matches the crime" | **KILL**. Replacement: "…matches the divergence." |
| 6 | 464 | "what its four neighbours (and the local crime) suggest" | **KILL**. Replacement: "(and the local divergence)". |
| 7 | 469 | "At zero sweeps: all <C k=\"div\">crime</C>, no pressure." | **KILL**. Replacement: "At zero sweeps: all <C k=\"div\">divergence</C>, no pressure." |
| 8 | 470–471 | "the <C k=\"pHi\">hill</C> has risen and the crime is gone" | **KILL**. Replacement: "…and the divergence is gone." |
| 9 | 522 | "then solve the pressure puzzle and cancel the crime" | **KILL**. Replacement: "…and cancel the divergence." |
| 10 | 525–526 | "Carrying alone stretches and folds but lets crime accumulate" | **KILL**. Replacement: "…but lets divergence accumulate" (this caption is rewritten wholesale anyway — Part 2, L524–528). |

Guard on the replacements: "divergence" is the honest word and is already introduced
at 414–415. Do not coin a second conceit to fill the holes. Note instances 5–10 are
precisely the ones neither simulated reader mentions feeling — they are the canned
tail. Line 507's "the violet catastrophe of the broken fluid — now as a diagnosis
rather than a mystery" is not a crime-word use and is a genuine payoff: **KEEP**.

### Device: "oldest debt" (2 instances)

- L37: "that single number is the oldest debt in this article; it gets paid, but not
  soon." — **KEEP.** This is the plant, and SLOP.md family 1 quotes this exact line
  as the house fix for promissory narration. Priya files it as "one notch showy" but
  collects the payoff with pleasure.
- L533: "the oldest debt comes due: the slider was the Reynolds number all along."
  — **KEEP-AS-PAYOFF.** Marcus scrolls back to the top and re-drags the hero slider
  "as a different person." Textbook plant-and-pay; exactly the pattern family 19
  calls engineering, not recurrence.

### Device: "confess" (2 instances)

- L319: "which obliges me to confess that the wing at the top of this article… is
  aerodynamically a moth." — **KEEP** — the one full-strength deployment. Both
  readers' top-three retell; Priya: "confessed my objection before I could bill for
  it." This is the confession-as-act that family 18's boundary explicitly protects.
- L505–506: "sneaks in a little blur of its own, as confessed earlier" — **KILL the
  device word, keep the cross-reference** (the cross-reference is what Priya valued;
  "as confessed earlier" is also family-3 "as mentioned earlier" in a trench coat,
  and lesson 02 died of exactly this word). Replacement: "…in practice our
  backward-tracing scheme sneaks in a little blur of its own — the same price we
  paid for stability back in Advection)."

### Device: "negotiation" (4 sites, 5 uses)

- L286: "Everything a flow becomes is a negotiation between them." — **KILL** (see
  Part 2, L286). The word is about to be coined for something else; using it first
  for advection-vs-viscosity muddies both.
- L464–465: "a computer solves it by patient negotiation: every cell repeatedly
  updates its pressure toward what its four neighbours… suggest" — **KEEP** — the
  coinage, and it is the correct image for Jacobi relaxation specifically.
- L469–470: "A few dozen sweeps of neighbourly negotiation later" — **KEEP** — same
  demo, same explanatory unit as the coinage; one deployment spanning its own figure,
  not a recurrence.
- L563: "That traveling negotiation between <C k=\"pHi\">pressure</C> and inertia is
  sound." — **KEEP-AS-PAYOFF.** This cashes the device with new physics: pressure's
  instant negotiation, allowed a little compression, propagates — sound *is* the
  negotiation traveling. A payoff completes; this completes.

### Device: "the same water wearing different shirts" (1 instance)

- L46–47 — **KEEP.** Single use; Priya withheld judgment on its strength alone.
  Guard for proposal 3 (Part 3): the finale payoff must not re-quote this line.

### Cluster: "honest / contract" (planning-doc vocabulary in print — family 18 watch)

- L49: "One honest contract before we start:" — **KILL the framing clause** (family
  18: *contract-with-the-reader* is METHODOLOGY vocabulary; Marcus read the passage
  as "a EULA"). Replacement: "The flows in this article are two dimensional, and the
  fluid never compresses. Real water lives in three dimensions, but everything we'll
  build survives the upgrade — the flat versions are the ones we can see whole."
- L326 "the term that keeps fluid honest", L452 "leaving only honest swirl behind",
  L546 "every term in it is honest" — **KEEP all three.** Here "honest" is doing
  physical work (honest = mass-conserving / true to the stated limits), not
  narrating the artifact. Three scattered uses with three referents is register, not
  template.

### Not devices (checked, cleared)

The "as a check / sanity-check at the edges" move (L174, L275, L377) is pedagogy
grammar — the move family 11 explicitly permits to repeat — and Priya calls it "the
part I'd steal." No surface phrase is templated across the three. **KEEP** (L377's
instance is restructured by proposal 2; see Part 2, L378–380). No instance of
"wink," "Boundary check," or "loaner" exists in this article.

---

## PART 2 — LINE LEDGER

Ordered by line number. Everything not listed here was checked and cleared —
including several near-misses adjudicated by the reader journey: L95–96 ("What an
arrow actually *is*, we haven't said" — Marcus noticed the trick "and I fall for it
anyway": lives), L116 ("not stillness, but perfectly balanced commotion" — family-4
shape but the second half is the physics; Marcus tried to keep the sentence:
lives), L382–384 ("tempting to declare victory" — the temptation is genuine, the
next section actually tries it and breaks: not family 17), L394 ("This is just
wrong" — blessed blunt verdict), L421–422 ("the only actor fast enough" — earned;
pressure's instantaneity was established at the bombardment), L460 ("You don't need
to unpack this one" — family-9-adjacent but it is the documented save of Marcus's
near-exit #2: lives), and the Predict at L361 (non-live fork for Priya, but
Marcus's "the quiz is calibrated to an actual person" is a felt positive — split
verdict goes to keep, no change).

**L40–41** — "The mathematics of fluids has a reputation, and some unfamiliar words
will come up along the way." — Family 1/9 (promissory + pre-soothing) in the second
clause. **REWRITE:**
> The mathematics of fluids has a reputation. Every quantity in this article is
> color-coded, so…
(i.e., cut the clause, splice straight into the existing L41 sentence.)

**L49** — "One honest contract before we start:" — Family 18. **CUT clause**;
replacement in Part 1 (honest/contract cluster).

**L89–93** — speed-as-color paragraph — caption-flat, no fact. **REWRITE, but
conditional on a figure fix** — see Part 3, proposal 9a. If the sim is not changed,
keep the current flat caption: a flat honest caption beats a vivid false one.

**L192–196** — "A uniform current just relocates the blob. Flows with structure do
something more interesting — they *deform* what they carry. A shearing current
smears the blob into a slanted streak:" — Family 3-adjacent figure-narration; the
deadest stretch (Marcus: "attention sags… the shear one I barely touch"; Priya:
fifteen-second flick-past). **REWRITE:**
> A uniform current only relocates the blob — same shape, same sharp edges,
> somewhere else. Structure in the flow is what deforms. A shearing current draws
> the blob into a slanted streak: the amber inside is exactly as concentrated as
> before, but its boundary has grown longer.

**L198** — "And a vortex winds it into a spiral:" — same family, and it sits
immediately before the article's most important idea. **REWRITE:**
> And a vortex winds it into a spiral, each turn drawing the amber into a thinner
> filament. The filament's length grows without bound; its width collapses toward
> zero. Nothing has blended — the amber is still pure amber — but the distance any
> blending would have to cross is shrinking toward nothing.
(This is the plant; it is paid at L232–234, below. Flat facts, no "that will matter
in a moment" — see Part 3, proposal 1 amendment.)

**L208** — "Here is the turn the whole subject pivots on." — Family 18 + 1
(significance announcement). **CUT clean.** The paragraph opens directly:
> Velocity is itself carried by the flow. A gust of fast water doesn't stay behind
> while the river moves on — the fast water *is* water, and it goes where the water
> goes.
The recursion at 211–212 ("the field carrying the field… feeds on its own output")
delivers the pivot unannounced. Marcus's sit-up must be earned by that sentence,
not cued.

**L232–234** — "But a real drop of dye in real water does something none of our
prescribed currents did — even in perfectly still water, a sharp filament slowly
fuzzes out. Something else is at work." — Keep, and **EXTEND** to pay the L198
plant with the number:
> But a real drop of dye in real water does something none of our prescribed
> currents did — even in perfectly still water, a sharp filament slowly fuzzes out.
> That fuzzing is feeble on its own: left unstirred, a drop of cream would take a
> couple of weeks to cross a coffee cup, because its crossing time grows as the
> square of the distance. One turn of a spoon finishes the job before you look up —
> the swirl stretches the cream so thin that the fuzzing has almost no distance
> left to cross. Something else is at work, and it works arm in arm with the
> stirring.
(Numbers verified in missing-moves: D ≈ 10⁻⁹ m²/s, cup a few cm, (distance)²/D ≈
1–3 weeks.)

**L286** — "Everything a flow becomes is a negotiation between them." — Device
collision (Part 1, "negotiation"): the word must stay reserved for Jacobi/pressure,
where it is coined at 464 and paid at 563. **REWRITE:**
> We now have two competing forces of character: advection stirs, viscosity
> smooths. Everything a flow becomes depends on which one is winning.
(Also sets up §The Competition and Re-as-referee more directly.)

**L341–342** — "and here is the part that matters for us:" — Family 18 + 1, second
significance announcement. **CUT clean**, splice:
> Pressure only *moves* things where it is uneven. And a parcel of fluid is
> bombarded by its neighbours in exactly the same way: the fluid pushes on itself.

**L346–348** — "So the question is never 'how large is the pressure' but 'which way
does it fall off.' Let's build some unevenness by hand." — the good sentence here
survives, but the section opens on stock terrain (Priya's longest sag, near-exit
#2). **REWRITE the entry into the landscape work** with the snailfish leading
(proposal 2, approved):
> A snailfish filmed in 2023 at the bottom of the Izu-Ogasawara Trench, 8,336
> metres down — the deepest fish ever recorded — lives under close to a tonne of
> water on every square centimetre of its body, and swims as if it were nothing,
> because that push is the same on every side. Pressure at rest moves nothing,
> however large it is. It only *does* something where it is uneven. So the question
> is never "how large is the pressure" but "which way does it fall off." Let's
> build some unevenness by hand.

**L352–357** — the topographic-map paragraph ("the same device topographic maps
use… the analogy is worth taking seriously…") — stock buildup, both readers skim
it. **REWRITE to one sentence:**
> Contour lines make the unevenness visible: <C k="pHi">high pressure</C> is a
> hill, <C k="pLo">low pressure</C> is a valley, and where the lines crowd
> together, the terrain is steep.
(The draggable landscape demo stays; it now demonstrates rather than accompanies.)

**L378–380** — "Deep-sea creatures live their whole lives under crushing pressure
that pushes them nowhere." — now a duplicate of the snailfish opener. **REWRITE**
the edge-check to collect the plant instead:
> As a check: on flat terrain, $\nabla p = 0$ and pressure moves nothing, no matter
> how large it is — the snailfish's whole life.

**L441–443** — "There's a piece of mathematics underneath your slider-work. Any
smooth flow field can be split into two ingredients…" — limp hinge, "slider-work"
is the article talking about its own apparatus (family 18-adjacent), and the one
important mathematical idea of the section arrives with no image (Marcus's
near-exit #2 territory). **REWRITE** (proposal 5 as amended — no "here is why"):
> The fix you did by eye is not a lucky trick. Picture any flow as two transparent
> sheets stacked together. One sheet holds only swirl: whirlpools that spin forever
> and never pile water anywhere. The other holds only piling: springs and drains,
> water welling and sinking, with not one loop of rotation in it. Every smooth flow
> is some stack of the two — and the piling sheet is always a hill-and-valley
> landscape, which is precisely the kind of push a pressure field makes. So there
> is always a pressure that cancels the piling exactly.
The `HelmholtzSplit` demo then shows the two sheets the prose just named. Keep
L449–450's "shown here, proven in the further reading" honesty verbatim; L452's
"leaving only honest swirl behind" survives (Part 1).

**L505–506** — "as confessed earlier" — device retirement + family 3. **REWRITE**;
replacement in Part 1 (confess census).

**L524–528** — SolverXray caption ("The demonstration below lets you watch each
move in isolation… Carrying alone stretches and folds but lets crime accumulate;
smoothing alone melts everything toward stillness; the pressure step alone hunts
divergence and touches nothing else:") — narrates the three panels; carries no
fact; both readers arrive tired and skim. **REWRITE** (constants verified:
`PRESSURE_ITERS = 40`, grid 120×72):
> The demonstration below lets you watch each move in isolation, running repeatedly
> on the same channel. None of the three alone is water: carrying stretches and
> folds but lets divergence accumulate, because nothing is enforcing the constraint
> yet; smoothing melts everything toward stillness; the pressure step hunts
> divergence and touches nothing else. Water is what you get by running them in
> order, every frame — and the pressure step is the expensive one: forty
> neighbourly sweeps across every cell of a 120-by-72 grid before each frame can be
> drawn.

**L570–573** — "Both obey the *wave equation* — the small, well-behaved child of
the giant we built today, and the equation this course now sets out to explore.
Everything ahead of us — strings, sound, light's analogies, water — lives inside
mathematics you have already touched." — Family 1 + 18: promissory brochure, the
table of contents narrated. **REWRITE** (proposal 8 as amended — the syllabus list
goes entirely):
> Both obey the *wave equation* — the small, well-behaved child of the giant we
> built today. A string, a column of air, the surface of the sea: the same equation
> runs under all of them, and every one is a place where energy travels while the
> material stays home.

### Aphorism budget (cap: one per article)

**Champion: L476–477** — "Ask a fluid 'why this pressure?' and the only answer is:
*because that is what it took*." Both readers copied it; Priya names it "the
article's one aphorism, spent at the right node." It stays, and nothing else may
claim the slot.

Ruled on the other candidates:
- **L30–31 / L611–612** ("The wing flies anyway." / "an unsolved equation,
  performing itself flawlessly, in your cup") — this is one ring, not two
  aphorisms: the closing line completes the opening's thesis, sits inside the Final
  Words coda where ESSENCE licenses lyricism, and is both readers' top retell.
  **KEEP both.** Not charged to the budget.
- **L238** ("Fluids can't keep secrets.") — aphorism-shaped, but it is a mechanism
  image cashed in the very next clause ("its neighbours find out immediately") and
  audited by the whole section. Metaphor, not verdict-line. **KEEP.**
- **L286** — aphorism-shaped section-ender, already killed above on device grounds.
  The budget stays at one.

---

## PART 3 — PROPOSAL AUDIT (missing-moves.md)

**1. Advection captions carry the mixing fact — AMENDED.** The mechanism (advection
steepens gradients; diffusion crosses them) and the coffee number are the right
repair for the article's deadest stretch. Two amendments: (a) the drafted third
caption ends "and that will matter in a moment" — that is family 1, scheduling the
payoff instead of planting the fact; replaced with flat declaratives (Part 2,
L198). (b) The proposal drafts only the third caption; the first two are equally
dead — drafts supplied (Part 2, L192–196). Payoff placement at the L232–234 seam
approved; draft extended so "Something else is at work" survives as the section's
forward hook (Part 2, L232–234).

**2. Snailfish opens the pressure buildup — APPROVED with one amendment.** The
re-sequence converts Priya's near-exit into the section's freshest beat, and the
tonne-per-square-centimetre number does setup work instead of sitting as an
edge-check. Amendment: the proposal leaves L378–380's deep-sea line in place, which
becomes a duplicate once the snailfish leads — rewritten as the ∇p = 0 edge-check's
callback ("the snailfish's whole life," Part 2, L378–380), which turns the
duplication into a paid echo. The contour paragraph shrinks to one sentence as
proposed (draft in Part 2, L352–357). The marble Predict at 361 stays unchanged —
non-live for Priya, but calibration-positive for Marcus, and it wraps a demo, not
just a question.

**3. Rose/amber pays off as mixing at the finale — APPROVED with two amendments.**
The sim genuinely supports it (`WingFlow.tsx:57–58,133–134`: two dye stripes
advected separately), and an unpaid color contract reads as costume. Amendments:
(a) "laminar flow does not mix" introduces *laminar* — a term the article never
defines, violating jargon-last; replace with plain description. (b) "the
stretching-then-blending from the very first section" mislocates it (the stretching
is §Advection) and names a section instead of an event. Amended draft for ~535:
> Drag to the honey end and the amber and rose ride past the wing in two clean
> sheets that never touch — an orderly flow does not mix. Drag back and the eddy
> street folds one color into the other until you cannot say where the upper
> current ends: the same stretching-until-the-gap-vanishes you watched a blob of
> dye perform, now happening to the wing's own two currents.
Guard honored: the line-46 contract is not re-quoted (family 19).

**4. Driving-thermometer concrete before the material derivative — APPROVED as
drafted.** The image is auditable (its stated failure mode — a real evening also
cools in time — is exactly the split the section teaches, so the analogy cleanly
isolates the carried term), the placement is Marcus's documented near-exit #1, and
it costs Priya nothing. Insert at ~160, between the probe/parcel resolution and the
two-questions bullets. Keep the edge-case audit at 174–178 untouched — both readers
name it as the section's best move.

**5. Helmholtz two-sheets image + hinge replacement — APPROVED with one
amendment.** The draft's "it always exists, and here is why" installs a new "here
is" announcer in the same pass that kills two (L208, L341) — cut it; open on
"Picture any flow…" (amended draft in Part 2, L441–443). The image passes the
family-10 audit (fails on non-smooth fields and non-trivial topology, which is why
the proof stays deferred). Keep "shown here, proven in the further reading."

**6. Kill both significance announcements — APPROVED.** Matches the mandatory
kills; splice drafts in Part 2 (L208, L341–342).

**7. Crime census and retirement — AMENDED.** The proposal keeps only the coinage
at full strength and assigns the one permitted echo to the arrest-warrant beat at
421–422 — but that beat never uses the word "crime," so it spends nothing from the
device budget. The echo is reassigned to L429 ("your job is to cancel the crime"),
where the arc actually completes: the crime was caught at the loop, the reader is
handed enforcement, and at 436–439 is relieved of duty. That is a payoff by family
19's own definition, and it is the last instance any simulated reader registers as
felt. Kills therefore number eight (427, 434, 462, 464, 469, 470, 522, 525), each
with replacement prose in Part 1. The proposal's guard stands: plain nouns, no
successor conceit.

**8. §Where Waves Live ends on physics — APPROVED with one amendment.** The
proposal lets "everything ahead lives inside mathematics you have already touched"
survive demoted; it should not — the amended ending sentence already does that
unification, and the "strings, sound, light's analogies, water" list is the table
of contents narrated (family 18). Cut L571–573 wholesale; replacement in Part 2
(L570–573).

**9a. Speed-as-color caption gets the no-slip plant — AMENDED, conditional on a
figure fix.** Adversarial finding: the drafted caption claims "the flow is
brightest down the middle and fades to nothing right at the edges… the water
touching the bank is not moving at all" — but the FlowVis speed demo runs on
`breezeField` (`FlowVis.tsx:23–28`), a bank-less sum of drifting sinusoids with no
wall damping (`field.ts:46–60`). The figure would contradict the prose — the exact
defect the repo's last figure-quality pass existed to remove. Condition: give the
speed mode a channel field with no-slip walls (or add wall damping to the creek
field family) so the edge-darkening is visible; only then ship the caption.
Second amendment: "Hold onto that — it comes back with a name" is an instruction
plus a schedule (families 9 + 1) — cut it; the fact plants itself, and the payoff
gains the back-reference instead. Amended caption (contingent):
> Painted this way, one thing jumps out that the arrows buried: the flow is
> brightest down the middle and fades to nothing at the edges. The water touching
> the bank is not moving at all.
Amended payoff at L252–254:
> And the fluid never slips along the walls: real fluid sticks to solid surfaces —
> the *no-slip condition*, the name for what the speed picture showed at the banks
> — and the walls quietly bleed momentum out of the jet until nothing is left.
If the sim is not changed, reject the caption and leave L89–93 as is; do not print
the claim. The payoff back-reference is likewise contingent.

**9b. SolverXray caption carries the ordering/cost fact — APPROVED.** Constants
verified against source (40 sweeps, 120×72). Draft in Part 2 (L524–528), with the
one crime-word in the current caption retired in the same stroke. The family-8
guard holds: the rewrite adds the non-commuting-sequence and cost facts and does
not recap "each one is a section of this article."

---

## Coverage check

All known-issue items adjudicated: advection captions (Part 2, L192–201 + seam),
both significance announcements (L208, L341 — cut), crime census (Part 1, 10
instances: 1 keep, 1 payoff, 8 kills), pressure buildup + deep-sea re-sequence
(L346–380), material-derivative concrete (proposal 4, approved), Helmholtz image
and hinge (L441–443), speed-as-color and SolverXray captions (proposal 9, one
conditional), brochure tone at L570–573 (rewritten). Aphorism budget: champion
named, ring licensed, no overdraft after the L286 kill. Devices beyond the brief
that the census surfaced: "negotiation" (one kill, coinage + payoff kept),
"confess" (one retirement), "honest contract" (one framing kill).
