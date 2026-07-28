# Missing Moves — Lesson 01: Building the Navier–Stokes Equations

Proposals for the narrative turns the article does not yet have, grounded in the
felt-reader simulation (`reader-journey.md`). Line numbers refer to the current MDX
(`src/lessons/lesson-01-navier-stokes.mdx`). Every proposal names its placement, the
actual material (with facts and confidence), the journey beat it repairs, and the slop
family it must not collapse into.

Ordering: the two biggest sag-repairs first (advection captions, pressure buildup),
then the structural arc, then the mandatory subtractions, then the local fixes.

---

## 1. The advection captions carry the mixing fact — and plant a debt viscosity pays

**PLACEMENT** — §Advection, lines 187–201 (the three `DyeCarry` captions), with the
payoff landing in §Viscosity around line 233–234.

**THE MATERIAL.** The three captions currently narrate the figure ("relocates,"
"smears," "winds into a spiral") and carry no fact — this is the deadest stretch in the
article, sitting immediately before its most important idea. Replace the third caption's
job: the spiral is not decoration, it is *the reason stirring works*. Advection does not
mix. It stretches. Each turn of the vortex thins the gap between amber and clear, and a
filament in a swirling flow grows in length without bound while its width collapses
toward zero. Diffusion — which we meet in the very next section — only has to cross that
ever-thinner gap, so it finishes in seconds what it could never finish alone.

The number is the hook. Left to molecular diffusion, a drop of cream would take *weeks*
to spread across a coffee cup: the diffusion coefficient is about 10⁻⁹ m²/s, the cup is a
few centimetres across, and crossing time goes as (distance)²/D — call it a fortnight.
One turn of a spoon does it before you look up. *(Confidence: high. The (distance)²/D
estimate is textbook; ~10⁻⁹ m²/s for small molecules in water is standard; the coffee-cup
figure lands at 1–3 weeks.)*

Drafted prose (third caption, ~198–201):

> And a vortex winds it into a spiral, each turn pulling the amber into a thinner and
> thinner filament. This is not yet mixing — the amber and the clear water have only been
> drawn out, not blended. But the gap between them is now vanishing, and that will matter
> in a moment.

Then the existing bridge at 233–234 (currently "even in perfectly still water, a sharp
filament slowly fuzzes out. Something else is at work.") pays it:

> Left to itself, a drop of dye would need weeks to spread across a coffee cup. Stirred,
> it is gone in one turn of the spoon — because the swirl did the stretching, and now
> the fuzzing has almost no distance left to cross.

**READER EFFECT.** Repairs Marcus's honest sag at 190–200 ("attention sags... the shear
one I barely touch") and Priya's fifteen-second flick-past at 385. Both readers should
leave the vortex caption holding a live question — *why does stretching help?* — that the
Viscosity section answers, instead of watching three deformations and moving on. It also
gives the advection→viscosity seam a reason to exist beyond adjacency.

**SLOP GUARD.** Must not become family 16 ("stirring is just stretching") — the point is
a *mechanism* (advection steepens gradients, diffusion crosses them), not a rebrand. Keep
the copula out; state what stretching does to the gap, not what stirring "really is."

---

## 2. The pressure buildup opens on the snailfish, not the topographic map

**PLACEMENT** — §Pressure, lines 346–380. Structural re-sequence: pull the deep-sea
concrete (currently parked at 379 as an edge-check) up to open the pressure-landscape
work, and thin the topographic-map buildup (352–357) that both readers skim.

**THE MATERIAL.** This is Priya's near-exit — "the one stretch that reads as inherited
rather than built... scrollbar check at ~line 350" — because the bombardment/contour/
marble sequence is done beautifully in Airfoil and she gets nothing new. Marcus skims it
too (344–357). The fresh fact the article already owns is stranded at the end as a
throwaway. Lead with it, and attach a verified number.

In April 2023, a research team filmed a snailfish alive and feeding at 8,336 metres down
in the Izu-Ogasawara Trench off Japan — the deepest fish ever recorded. The water above it
presses at roughly 84 megapascals, about 830 times atmospheric, close to a tonne bearing
down on every square centimetre of the animal. It feels none of it, and swims freely —
because that crushing push is the *same on every side*. What would destroy it is not the
depth but a *difference*: haul it up too fast and the pressure across its body no longer
balances, and it is the imbalance, not the magnitude, that tears. *(Confidence: high.
Pseudoliparis snailfish, 8,336 m, filmed 2023, Alan Jamieson / Minderoo-UWA team, widely
reported; 84 MPa ≈ 830 atm follows from ρgh.)*

Drafted opener (replacing the transition into 346):

> A snailfish filmed in 2023 at the bottom of the Izu-Ogasawara Trench lives under close
> to a tonne of water on every square centimetre of its body — and swims as if it were
> nothing, because that push is the same on every side. Pressure at rest moves nothing,
> however large it is. It only *does* something where it is uneven. So the question is
> never how large the pressure is, but which way it falls off.

The contour-map paragraph (352–357) can then shrink to one sentence — the reader already
holds the hill/valley picture from the draggable landscape; it does not need the
topographic-map analogy spelled out at length.

**READER EFFECT.** Converts Priya's longest sag (330–384, near-exit #2) into the section's
freshest beat — a fact she has not read in Airfoil, doing setup work rather than sitting as
an edge-check. Marcus retells deep-sea facts (it was a screenshot candidate at 199); moving
it to the front means he meets the strongest thing in the section first, not last. Both
should feel the section was *built*, not inherited.

**SLOP GUARD.** Must not become family 5 (awe-inflation) — the tonne-per-square-centimetre
is a number doing work (it sets up "same on all sides"), not a "staggering," "crushing"
adjective pile. Let the figure carry the awe; keep the sentence flat.

---

## 3. STRUCTURAL: the rose/amber currents pay off as mixing at the finale

**PLACEMENT** — debt already planted at line 46 ("The amber and the rose are the same
water wearing different shirts"); payoff site is the finale `WingFlow` at 531–536.

**THE MATERIAL.** The color contract at 46 plants that the two currents are the same water
marked by origin. The finale currently spends its energy on the Reynolds-slider payoff
(strong, keep it) but lets the rose/amber distinction pay out only implicitly as "the
braid." The wing sim injects amber above and rose below (`WingFlow.tsx`, DYE_ROWS /
DYE2_ROWS) and advects them separately — so the two colors are exactly an instrument for
the mixing fact from Proposal 1. At the honey end they ride in parallel sheets and never
blend; at the fast end the eddy street folds them into each other. That *is* advective
mixing, closing the loop opened in §Advection, and it cashes the line-46 contract as a
visible event rather than a caption.

Drafted addition to the finale prose (~535):

> Drag to the honey end and the amber and rose ride past the wing in two clean sheets that
> never touch — laminar flow does not mix. Drag back and the eddy street folds one color
> into the other until you cannot say where the upper current ends. That braiding is the
> stretching-then-blending from the very first section, happening to the wing's own two
> dyes.

**READER EFFECT.** Both readers noted the color system as a Ciechanowski-school move under
audit (Priya, 340–342: "the question is whether it's used with discipline or as costume").
An unpaid color contract reads as costume; a paid one reads as discipline. This gives the
finale a second earned payoff beside the Reynolds reveal, and links the article's last
figure back to its first mechanism — the ring Marcus feels ("showing me that *I'm* new")
gains a second strand.

**SLOP GUARD.** Must not become family 19 (canned callback) — this works only if it
*completes* the mixing idea, not if it merely re-invokes "same water, different shirts" as
a refrain. State the physical event (sheets vs. folding); do not re-quote the contract line.

---

## 4. An embodied concrete before the material derivative

**PLACEMENT** — §Following a Parcel, between the probe/parcel resolution (158–159) and the
two-questions bullets (161–166).

**THE MATERIAL.** This is Marcus's first near-exit — the calc-class stomach-drop at 10:25pm
(near-exits #1). The edge-case unit tests at 174–178 save him, and Priya calls that audit
"the part I'd steal" — so keep it. What is missing is a body-level anchor *before* the
symbol, so the reader arrives at ∂q/∂t + (u·∇)q with a felt referent, not only a probe demo.

Steal it from driving. On a summer night, roll the window down and drive from a sun-warmed
valley down toward a river: the dashboard thermometer drops several degrees in a hundred
metres. The air did not cool — you carried yourself into colder air that was sitting there
all along. That drop is the carried term, felt on your face. The porch thermometer back
home, meanwhile, reads its own slow change in time. Same night, two different derivatives.
*(Confidence: high — valley/riverside temperature inversions are an everyday phenomenon;
the dashboard-thermometer drop is directly observable.)*

Drafted prose (~160):

> You have felt this without the symbols. Drive on a summer night from a warm hillside down
> toward a river and the car's thermometer falls a few degrees in a hundred metres — not
> because the air cooled, but because you carried yourself into colder air. A thermometer
> nailed to a fence post would have read something else entirely. Riding the flow and
> standing still are two different questions about the same air.

**READER EFFECT.** Gives Marcus a handhold at exactly the moment the tab historically
closes (near-exit #1), so the equation at 171 arrives as *notation for something he has
felt in a car*, reinforcing the "witnessed rather than accepted" feeling he reports at 115.
Priya's reading-speed already drops to normal here (381); the concrete costs her nothing and
gives Marcus the floor.

**SLOP GUARD.** Must not become family 10 (fake metaphor) — the driving image must be
auditable. It is: the failure mode is that a real drive also has genuine time-change (the
evening actually cools), so the analogy is clean only for the carried piece, which is
exactly the piece being isolated. State it as the carried term, not as "the material
derivative is like driving."

---

## 5. The Helmholtz split gets its image and loses its limp hinge

**PLACEMENT** — §Pressure, the Instant Fixer, lines 441–452.

**THE MATERIAL.** Marcus's second near-exit (443–473, densest terrain at the tiredest
hour). The one important mathematical idea of the section — any flow = a swirl part + a pile
part, and the pile part is a gradient — is delivered with no image, behind the limp hinge
"There's a piece of mathematics underneath your slider-work." Both the hinge and the image
are missing.

The math-native image (licensed by NICKS_VOICE §6.7, audited Ciechanowski-style): two
transparent sheets stacked. The first sheet holds only whirlpools — drop a grid of tiny
loops on it and not one loop ever gains or loses water; it swirls and never piles. The
second holds only springs and drains — water welling up and sinking away, piling and
thinning, but without a single closed loop of rotation. Every smooth flow there is can be
built by stacking exactly these two. The pile-up sheet is a gradient — a hill-and-valley
landscape — and a pressure hill produces exactly that kind of push. So the fix you did by
eye always exists: whatever a flow tries to pile, some pressure landscape can un-pile it,
leaving honest swirl behind.

Drafted hinge replacement (~441):

> The fix you did by eye is not a lucky trick — it always exists, and here is why. Picture
> any flow as two transparent sheets stacked together. One sheet holds only swirl:
> whirlpools that spin forever and never pile water anywhere. The other holds only piling:
> springs and drains, water welling and sinking, with not one loop of rotation in it. Every
> flow is some stack of the two, and the piling sheet is always a hill-and-valley
> landscape — which is precisely what a pressure field is. So there is always a pressure
> that cancels the piling exactly.

The `HelmholtzSplit` demo (447) then shows the two sheets the prose just named, instead of
arriving cold.

**READER EFFECT.** Repairs Marcus's near-exit #2 by giving the abstract decomposition a
picture he can hold at 11pm, so the demo confirms an image rather than introducing one. Priya
approved the stated-not-proven call (466–468); the image does not weaken the rigor, it makes
the "always exists" claim graspable before the Poisson equation she watched Marcus bounce off.

**SLOP GUARD.** Must not become family 10 — the two-sheets image is auditable: it fails on
non-smooth fields and non-trivial domain topology, which is exactly why the article defers
the proof to further reading. Keep the "shown here, proven in the further reading" honesty at
449–450.

---

## 6. Kill both significance announcements

**PLACEMENT** — line 208 ("Here is the turn the whole subject pivots on") and line 341–342
("and here is the part that matters for us").

**THE MATERIAL.** Both are the methodology speaking (family 18) and promissory framing
(family 1) — sentences *about* the article's structure, telling the reader that weight is
coming instead of letting the weight land. The following sentences carry it unannounced.

Line 208 — delete the announcer; open on the physics:

> Velocity is itself carried by the flow. A gust of fast water does not stay behind while
> the river moves on — the fast water *is* water, and it goes where the water goes.

The recursion in "the field carrying the field... the equation feeds on its own output"
(211–212) delivers the pivot without being told it is one.

Line 341 — delete "and here is the part that matters for us"; the sentence after it carries
the turn:

> Pressure only *moves* things where it is uneven. A parcel of fluid is bombarded by its
> neighbours in exactly the same way — the fluid pushes on itself.

**READER EFFECT.** Marcus "sits up because the article has never used that voice before"
(126) — but the sit-up should come from the recursion, not from a stage cue. Priya reads
the self-advection turn as given "the right weight without a single hype adjective" (388);
the announcer sentence is the one hype gesture in an otherwise clean paragraph, and removing
it makes her ledger-note true. Removing announcers trusts the reader the way the rest of the
article does.

**SLOP GUARD.** The replacements must not smuggle the announcement back in as "notice that"
or "the key point is" — those are family 3. Just the declarative.

---

## 7. Census and retire the "crime" device (family 19)

**PLACEMENT** — the conceit runs across lines 413, 427, 429, 434, 462, 464, 469, 470, 522,
525 — ten uses between the Broken Fluid section and Running the Equation.

**THE MATERIAL.** Family 19's rule: one full-strength deployment, one payoff echo, then
retire. The device earns its full-strength deployment once — the `DivergenceLoop` at 407–413,
where the loop literally catches a hidden source and the violet "scene of the crime" marks it.
That instance is the coinage and should stay at full strength. One echo may survive: the
arrest-warrant framing of ∇·u = 0 and "we've already met the only actor fast enough"
(421–422), because it *cashes* the setup (pressure was characterized as instantaneous, and
that property is now called on) — a payoff, not a refrain. Everything after that is the
canned cornism, and Priya already feels it hardening ("on the edge of cute," 457).

The later eight uses need distinct, literal language for what is a literal thing —
divergence, a violation of ∇·u = 0, fluid being created or destroyed:

- 427/429 (PressureFix): "violet everywhere around it... cancel the divergence."
- 434: "a crime in the other direction" → "now the spot hollows out — divergence with the
  opposite sign."
- 462/464 (Poisson gloss): "matches the crime" → "matches the divergence"; "the local
  crime" → "the local divergence."
- 469/470 (JacobiRelax): "all crime, no pressure" → "all divergence, no pressure"; "the
  crime is gone" → "the divergence is gone."
- 522/525 (Solver / X-ray): "cancel the crime" → "cancel the divergence"; "lets crime
  accumulate" → "lets divergence accumulate."

**READER EFFECT.** Repairs the exact failure family 19 names: "the reader starts predicting
the device, and a predictable honesty-move reads as shtick." Marcus reports "thinking in the
article's crime vocabulary now" (217) — good the first time, a tic by the tenth. Priya's "it's
doing real referential work" (458) is only true if it is spent sparingly; ten uses spends it
into a mannerism. Retiring it protects the one instance that earns it.

**SLOP GUARD.** This is the subtraction, so the guard is on the replacements: "divergence"
is the honest word and it is already introduced at 414 — do not invent a *second* new conceit
to replace the first (that would be family 19 again, in a new costume). Plain nouns.

---

## 8. The finale of §Where Waves Live ends on physics, not a syllabus

**PLACEMENT** — lines 570–573 ("the equation this course now sets out to explore...
Everything ahead of us... lives inside mathematics you have already touched").

**THE MATERIAL.** Brochure tone: "the equation this course now sets out to explore" is
promissory (family 1) and the methodology speaking (family 18) — it describes the *course* as
an artifact rather than the physics. The strongest thing in this section is the fact both
readers carry to standup: the floats bob in place while the wave sweeps past (566–568). End on
a consequence of that, not on a syllabus promise.

Drafted ending (~570):

> Both obey the *wave equation* — the small, well-behaved child of the giant we built today.
> A string, a column of air, the surface of the sea: the same equation runs under all of
> them, and every one of them is a place where energy travels but the material stays home.

The "everything ahead lives inside mathematics you've already touched" claim can survive if
demoted to a flat fact, but the "this course now sets out to explore" clause should go — the
reader does not need the table of contents narrated.

**READER EFFECT.** Marcus is "running on fumes but this is short" and the floats "wake me back
up" (293–295); ending on energy-travels-material-stays-home keeps him on the fact he already
loves instead of handing him a course brochure at the tiredest moment. Priya reads the pivot as
"the first point where I think about lesson 02 as something I might read" (512) — she converts
herself; being sold the course undoes that.

**SLOP GUARD.** Family 1. The replacement must not become "next lesson we will..." Keep it a
statement about waves (energy vs. material), not about the reading plan.

---

## 9. Two caption-flat paragraphs get one fact each

**PLACEMENT** — §Seeing Flow, speed-as-color, lines 89–93; and §Running the Equation,
`SolverXray` caption, lines 524–528.

**THE MATERIAL.**

*Speed-as-color (89–93).* Currently a flat "sometimes we don't care about direction, paint
speed as color." Give it a fact that plants a debt: a stream runs fastest down its centre
and drops to nothing right at the banks — the water touching the bank is not moving at all.
That is a visible fact in the speed field, and it is the no-slip condition the reader meets
in §Viscosity (252–254). *(Confidence: high — surface velocity peaks mid-channel and vanishes
at the boundary; standard open-channel observation.)*

> Painted this way, one thing jumps out that the arrows buried: the flow is brightest down
> the middle and fades to nothing right at the edges. The water touching the bank is not
> moving at all. Hold onto that — it comes back with a name.

*SolverXray caption (524–528).* Currently narrates the three panels. Carry the fact that the
four moves do not commute — they are run as a *sequence*, and that sequence is the whole trick.
Carrying-alone lets divergence pile up because nothing is enforcing the constraint yet; that is
*why* the pressure step comes last, cleaning up after the carry. On this grid the pressure step
alone runs 40 Jacobi sweeps across every one of the 120×72 cells, every frame — the expensive
move, and the reason real-time fluid was hard until Stam's splitting. *(Confidence: high — read
from `solver.ts` (PRESSURE_ITERS = 40) and `SolverXray.tsx` (NX=120, NY=72).)*

> Run in isolation, none of the three is water: carrying alone lets divergence pile up because
> nothing is cleaning it, smoothing alone melts everything toward stillness, and the pressure
> step alone hunts divergence and touches nothing else. Water is what you get by running them
> in order, every frame — and the pressure step is the costly one, forty neighbourly sweeps
> across every cell of the grid before the frame can be drawn.

**READER EFFECT.** The speed-as-color plant gives Marcus (the array-thinker who noted "the grid
is not a fact about the water," 58) a second forward-link to collect, and pays at no-slip.
The SolverXray fact meets Marcus's "professional's respect" (242) and Priya's Jacobi-convergence
interest (476–478) at a caption both currently skim tired — a number lands where narration was.

**SLOP GUARD.** Family 8 (summary-itis) on the SolverXray caption — it must add the
ordering/cost fact, not recap "each one is a section of this article" (already said at 520).
And the speed-as-color plant must actually pay at 252–254 or it is an unresolved plant (banned
at both poles, NICKS_VOICE §6).

---

## Notes on coverage

- **Mandatory items, all addressed:** advection captions (#1), both significance announcements
  (#6), crime census (#7), pressure buildup + deep-sea concrete (#2), material-derivative
  concrete (#4), Helmholtz image + hinge (#5), speed-as-color and SolverXray captions (#9),
  lines 570–573 brochure tone (#8).
- **Structural proposals:** #1 (new advection→viscosity debt/payoff), #2 (re-sequence the
  deep-sea concrete from edge-check to opener), #3 (rose/amber contract → finale mixing
  payoff), #7 (retire a device, redistribute across eight sites).
- **Facts stolen from reality, verified this session:** snailfish 8,336 m / ~830 atm (2023,
  Izu-Ogasawara); coffee-cup diffusion ~weeks vs. one stir; solver constants 40 sweeps /
  120×72 grid. The vortex-shedding onset Re ≈ 47 was verified but not spent — the cylinder
  section is not a sag, so it is held in reserve rather than forced in.
- **Deliberately not proposed:** no new coined refrain (family 19 now bans canned devices); no
  fork erected at the pressure section (Priya already finds the marble Predict at 361 a
  non-live fork — adding suspense there would be family 17).
