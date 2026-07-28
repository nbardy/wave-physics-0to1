# Missing Moves — Lesson 03: The History of Navier–Stokes

Proposals for narrative elements the article does not yet have, grounded in the
reader-journey simulation (`redrafts/lesson-03/reader-journey.md`). Line numbers refer
to `src/lessons/lesson-03-navier-stokes-history.mdx` as of this writing. Every
historical claim below was verified by web search this session; confidence is stated
per fact. Candidate prose is drafted in the house register and is a starting point,
not copy-paste-final.

Sources verified this session:
- Grant, Stewart & Moilliet, "Turbulence spectra from a tidal channel," *J. Fluid
  Mech.* 12 (1962) 241–268 — full text obtained and read
- Kolmogorov 1941 Doklady trilogy reception dates (ADS / Eyink's JHU archive copies)
- Darrigol, "The First Five Births of the Navier-Stokes Equation," *Arch. Hist.
  Exact Sci.* 56 (2002) — full text obtained and read (the article's own Further
  Reading source, so every quote below is already collateralized in-article)
- Cannone & Friedlander, "Navier: Blow-up and Collapse," *Notices of the AMS*,
  Jan 2003 — full text obtained and read
- Philip Ball (homunculus blog) + J.-Y. Chemin lecture "Jean Leray et les fondements
  mathématiques de la turbulence" (2007) for the Pont Neuf anecdote
- MacTutor / Friedlander's AMS obituary material for Ladyzhenskaya's biography

---

## 1. THE HEADLINE FIX (structural): Kolmogorov gets the number, the eve-of-war scene, and the sea

**PLACEMENT:** The Open Question, L565–575 — replace the current single sentence +
"postcard" parenthesis with a three-beat sub-arc: Richardson's verse → Kolmogorov
(scene + exponent) → the 1962 measurement at sea. The Heisenberg aside survives,
moved after the measurement.

**THE MATERIAL.** The article's own rule is awe-numbers-as-dessert, and here dessert
is currently skipped: "one universal exponent," unnamed, "admired, not derived."
Three verified facts fix it:

1. *The exponent:* −5/3. (House-honesty note: Kolmogorov's 1941 papers state the
   result as the 2/3 law for velocity differences between neighboring points; the
   −5/3 spectrum is its Fourier twin, cast that same year in the same Moscow school
   by his student Obukhov. The 1962 paper itself says "as predicted by Kolmogoroff"
   for k^−5/3, so calling it Kolmogorov's exponent is standard usage; a
   half-parenthesis crediting the recasting is available if wanted. Confidence:
   high.)
2. *The scene — corrected from the brief:* this is an eve-of-war scene, not a
   wartime-Moscow scene. The first Doklady paper was received 28 December 1940; the
   dissipation paper 30 April 1941. Eight weeks after the third, the Wehrmacht
   crossed the border, and the Academy was evacuated east. The papers were written
   in peace by four months and published into the war. (Reception dates: high
   confidence, from the printed papers. Evacuation: high confidence.)
3. *The measured instance:* Grant, Stewart & Moilliet, 1962 — verified in full. A
   Canadian defence-research team ran a hot-film probe from the 217-foot research
   vessel *Oshawa* through Seymour Narrows in Discovery Passage, British Columbia,
   where the tide runs up to 15 knots. Channel Reynolds number at a common 12-knot
   tide: 2.8 × 10⁸ — about three orders of magnitude beyond the best laboratory
   pipe. The spectra ran proportional to k^−5/3 "for several decades in k as
   predicted by Kolmogoroff," and they measured Kolmogorov's constant. Best
   embodied detail, verbatim from the paper: "the scale of the turbulence is so
   large that a ship is carried about to a considerable extent by the
   energy-containing eddies" — the instrument platform was being shoved around by
   the thing it was measuring. (All: high confidence, read from the paper.)

Candidate prose:

> That picture became quantitative on the eve of the war. Kolmogorov's three short
> papers reached the Doklady between the 28th of December, 1940 and the last day of
> April, 1941; eight weeks after the third, the Wehrmacht crossed the border. The
> claim inside them: deep in the cascade, the statistics forget how the stirring
> started. Coffee spoon or storm front, by the middle generations the energy is
> shared out by one rule — a spectrum falling as the −5/3 power of eddy size.
>
> For twenty years that exponent lived on paper. Then a Canadian team towed a
> hot-film probe through Discovery Passage, a tidal channel in British Columbia
> where the sea runs at up to fifteen knots, and measured the turbulence at a
> Reynolds number of 280,000,000 — three orders of magnitude past any laboratory.
> The eddies were larger than the 217-foot ship, which spent the runs being carried
> about by the thing it was measuring. The 1962 spectra track −5/3 across decades
> of eddy size. A rule written in Moscow, in winter, from dimensional argument
> alone, holding in a cold channel on the far side of the world.

Optionally, the callback that completes the article's own oldest ladder — Leonardo
at L94 planted "a name three centuries before it had an equation, and four before it
had a number," and that ladder paid at Re. One clause here extends the payment
rather than the plant (no new setup needed): the braided wakes Leonardo could draw
and not describe now obey a measured exponent — in exactly his kind of water, a
stream running past obstacles. Keep it to a clause; the fact carries it.

**READER EFFECT:** Priya at L216 of the journey — "a postcard here — admired, not
derived. I'm grateful for the explicit license not to understand" — gratitude is the
wrong emotion at the most astonishing result in the story; she should get the chill
she gets from Tao (journey L219–225) and a fourth collectible for Tomás. Marek
(journey L427–436) reads the section at double speed "reading the selection"; the
Oshawa detail is a fact he does not have — this section's equivalent of
Stokes-referees-Reynolds, the one he retells. Also softens Priya's worst sag
(L219–221): the sag paragraph now sits between two paid-off beats instead of after
an admitted skip.

**SLOP GUARD:** Family 17 — do not stage universality as a punchline ("and where do
you think that exponent showed up next?"). State the measurement flat; the surprise
is the physics'. Family 5 — no "astonishingly." The ship-carried-by-eddies detail
must stay a measurement condition, not become a metaphor.

---

## 2. The Poisson shot — one round from the documented polemic

**PLACEMENT:** Five Times, L401–402, the Poisson sentence ("satisfied with nobody
else's foundations"); also discharges the flagged StressCube-caption inertness
(L393–399) by putting the blood in the prose directly below the cube.

**THE MATERIAL.** The section promises "open polemic... in-person Paris argument"
and never quotes a shot from it. Darrigol (2002, pp. 124–125) documents the "long,
bitter polemic in the Annales de Chimie et de Physique": Poisson claimed to be the
first to offer a genuinely molecular theory of elasticity and **referred to Navier
only to declare that his assumptions should have led him to zero elasticity** —
i.e., cited his rival once, to say that by the rival's own logic his solid could
not hold together. Navier's wounded reply is quoted by Darrigol: it was he, Navier,
who "conceived the idea of a new question, one necessary to the computation of
numerous phenomena that interest artists and physicists"; the new emphasis on rigor
"could only betray a desire to belittle" his achievement. (Confidence: high — read
directly from Darrigol's paper, which is the article's own Further Reading source.)

Candidate prose (replacing/extending the current Poisson sentence):

> Poisson re-derived the equation in 1829 by his own molecular route,
> compressibility included, satisfied with nobody else's foundations — and said so
> in print. In the polemic that ran through the Annales de Chimie, he cited Navier
> just once: to declare that Navier's own assumptions, taken seriously, give a
> solid with zero elasticity — a material that could not hold itself together.
> Navier answered that it was he who had "conceived the idea of a new question,"
> and that all this new talk of rigor was a way of belittling the man who asked it.

**READER EFFECT:** Priya, journey L153–156: "the Poisson and Saint-Venant sentences
start to blur — names, dates, priority — until" the eponymy line. This does for
Poisson what "I am robbed of my entire Hydrodynamica" does for the Bernoullis
(journey L74–75, her first screenshot): a voice instead of a date. It also makes
the eponymy-lottery line land harder — the reader has now heard what "citing your
rivals" actually sounded like in this crowd.

**SLOP GUARD:** Family 17 — this is not a suspense beat; no "but one man went
further." Two sentences of documented venom, then move on at the section's existing
pace. Do not editorialize the irony (family 5's cousin): the reader can hear that
the zero-elasticity barb is the same shape as the zero-drag paradox without being
told.

---

## 3. The press barb at the fallen bridge

**PLACEMENT:** The Missing Term, L330–333, the bridge-collapse sentence.

**THE MATERIAL.** Cannone & Friedlander (AMS Notices, Jan 2003) quote the sarcastic
Paris press on Navier after the Pont des Invalides affair: he was referred to as
**"that eminent man of science whose calculations fail in Paris."** The same
article documents the committee criticism that the Corps was "too attached to
theory" and the praise of British builders for not "mathematicising" the problem.
(Confidence: high — read directly from the article.)

Candidate prose (one clause added to the existing sentence):

> ...cracked at an anchorage when a water main burst in 1826, and was dismantled to
> public mockery — the papers called him "that eminent man of science whose
> calculations fail in Paris" — and a review committee reproached him for having
> relied *too much on mathematics*.

**READER EFFECT:** Marek, journey L374–376: "The bridge-collapse reproach... I
half-remember from somewhere; plausible, unchecked, and I note that I'm now
*extending credit* to this author." A verbatim contemporary quote converts his
extended credit into collateral on the spot, at the exact line where he noticed
himself lending. For Priya it sharpens the irony that already carries her through
the section (journey L135–137) without adding length.

**SLOP GUARD:** Family 8/5 — no gloss after the quote ("the wound that produced the
term," etc.). The quote is the concrete; the existing "too much on mathematics"
sentence already does the framing. One quote, no commentary.

---

## 4. Saint-Venant defended the man the lottery would skip him for

**PLACEMENT:** Five Times, L402–405, the Saint-Venant sentence — a long-range
cross-link back to the bridge of The Missing Term (L330–333).

**THE MATERIAL.** Darrigol (2002, p. 128) records that Saint-Venant — the man the
article introduces only as the careful crediter whom eponymy skipped — also wrote
the era's defense of Navier over the bridge affair, against "a surge of the spirit
of denigration, not only of the savants, but also of science, disparaged under the
name of theory opposed to practice." Darrigol also notes Saint-Venant's technical
verdict: Navier had misestimated one force direction on one stone — "a kind of
oversight... easily corrected on the spot" — and hostile municipal authorities got
the bridge dismantled anyway. (Confidence: high — read directly from Darrigol.)

Candidate prose (extending the existing Saint-Venant sentence by one):

> ...and was the only man in the parade who carefully credited everyone else. He
> was also the one who defended Navier's bridge in print — the failure, he wrote,
> was one misjudged force on one stone, the kind of oversight fixed on site, and
> the dismantling was the work of a "spirit of denigration... of science,
> disparaged under the name of theory opposed to practice." For all of it he
> received nothing: the equation is named for the first and the last of its five
> discoverers.

**READER EFFECT:** This is the emotional payload the eponymy line currently asserts
without evidence. Priya copies "citing your rivals buys no tickets" into her notes
(journey L156–157); with this fact the line stops being an aphorism about an
abstraction and becomes about a man who defended the person he'd be erased beside.
Marek names Saint-Venant as his home-historiography shibboleth (journey L381–384);
this is the one Saint-Venant fact the standard tellings omit. It also quietly
completes the bridge arc: the article's reader last saw the bridge surrounded by
mockery; its defense arrives 70 lines later from the least rewarded man in the
story.

**SLOP GUARD:** Family 17 — do not present as a twist ("but here is the strange
thing about Saint-Venant"). It is one flat additional fact before the existing
"For this he received nothing." Family 19 — this is a payoff completing the bridge
beat, not a refrain of it; no further bridge callbacks after this.

---

## 5. Leray at the Pont Neuf

**PLACEMENT:** The Open Question, L577–580 — the introduction of Leray, currently
the entry point to Priya's worst sag.

**THE MATERIAL.** The documented anecdote (Philip Ball's account; J.-Y. Chemin's
2007 public lecture on Leray is framed around it): Leray is said to have drawn his
picture of turbulence not at his desk but leaning over the Pont Neuf, watching the
Seine eddy around the piers, for hours. (Confidence: medium-high — well-attested
anecdote, standardly told with "is said to have"; the candidate prose keeps that
honest hedge.)

Candidate prose:

> While the physicists climbed into the cascade, a French mathematician quietly
> asked the question underneath all of it. Jean Leray worked on it, the story goes,
> leaning over the parapet of the Pont Neuf, watching the Seine shear past the
> piers — the same braided water Leonardo drew. The question he brought back to his
> desk: the equation predicts; laboratories confirm; but does it actually *promise*
> an answer — does a smooth flow, evolved by Navier–Stokes, stay smooth?

**READER EFFECT:** Priya's worst sag is exactly here (journey L219–222, near-exit
list item 3): "densest prose at 11:15pm, eyes skip at 'weak derivatives... function
spaces.'" The section currently walks into function spaces with no body attached.
A man on a bridge watching real water gives the paragraph a scene before its
abstraction — the same fix the article already uses everywhere else (every other
mathematician in the story gets an object: a glass tube, a loupe, a lattice).
Bonus: a bridge over the Seine is where Navier's story broke; no prose should say
so (see slop guard), but the reader who notices owns the rhyme.

**SLOP GUARD:** Family 18 — absolutely no "another bridge over the Seine" nudge;
the echo belongs to the reader. Family 10 — the Leonardo clause is optional and
must stay literal (it is the same river-past-piers configuration), not become a
lyrical flourish. Keep the "the story goes" hedge — it is doing epistemic work
(family 6 distinction).

---

## 6. Ladyzhenskaya, one clause of biography

**PLACEMENT:** The Open Question, L588–590, the Ladyzhenskaya sentence.

**THE MATERIAL.** Verified: her father Aleksandr Ivanovich, a mathematics teacher
in the small town of Kologriv who taught her the subject, was arrested by the NKVD
in October 1937 and executed without trial as an "enemy of the people"; she was
then refused admission to Leningrad University because of his status. Exonerated
posthumously in 1956. (Confidence: high — MacTutor, Friedlander's obituary
material.)

Candidate prose:

> Olga Ladyzhenskaya — taught mathematics by her father, a schoolteacher the NKVD
> shot in 1937, and barred for his sake from Leningrad University — later fenced
> off the flat world: in two dimensions... [existing sentence continues]

**READER EFFECT:** The journey shows Marek specifically crediting the article for
including her at all ("most tellings skip her," L430–431) — but she is currently
the only named person in the entire article with zero biography, in a story whose
engine is people with pulses (Priya's phrase for the Bernoulli moment, journey
L75–76). One clause matches the article's costing elsewhere (Richardson gets the
ambulance, Leray can get the bridge). It also sits correctly in this section's
register: the Open Question section is the story's coldest, and her fact belongs
to the same century of institutional weather as Kolmogorov's evacuation.

**SLOP GUARD:** Family 5 — no "defiant," no "remarkable woman"; the clause states
two facts and moves to the theorem. If it can't be done in one clause, do not do
it — the theorem, not the trauma, is why she is in the article.

---

## 7. Newton wrote the verdict on his own priority fight

**PLACEMENT:** Newton's Guess, L145–148, the calculus-wars paragraph.

**THE MATERIAL.** The Royal Society committee that adjudicated the
Newton–Leibniz priority dispute (Commercium Epistolicum, 1712) issued a report
drafted anonymously by Newton himself — the president of the Society ruling on his
own case — and Newton then reviewed the report, also anonymously, in the
Philosophical Transactions. (Confidence: high — standard, well-documented history;
recommend a one-search re-verify at draft time as it predates this article's other
sources.)

Candidate prose (one sentence into the existing paragraph):

> One more thing happened in 1687 that shaped the next century: the calculus wars.
> When the priority fight came to trial at the Royal Society, the committee's
> report was drafted, anonymously, by its president — Newton, ruling on his own
> case. Britain sided with Newton's notation out of loyalty and clung to it for a
> hundred years...

**READER EFFECT:** Priya skims this paragraph "keeping only 'Britain rejoins the
story late' as a promise" (journey L69–71). One barbed fact makes the paragraph
sticky — and it quietly opens the article's real running theme (priority is a
blood sport and its verdicts are crooked) one section before the Bernoulli
backdating, so that Johann's 1732 fraud reads as the second case in a series and
"eponymy is a lottery" lands as the third. The theme is present in the material
already; this just gives it its earliest instance.

**SLOP GUARD:** Family 17 — no "keep this in mind"; no forward reference to the
Bernoullis. The series is built by placement, never announced (that would be
family 18). One sentence only — this paragraph is a hinge, not a room.

---

## 8. Pascal's second barometer — the control

**PLACEMENT:** Still Water, L73–79, the Puy-de-Dôme sentences.

**THE MATERIAL.** Périer's documented protocol for the 1648 experiment: before
climbing, he set up a second barometer in the garden of the Minim friary at the
base of the mountain and had an observer watch it all day; it never moved while
the summit barometer dropped ~8 cm. It is a strong candidate for the first
deliberate control in experimental physics. (Confidence: high on the two-barometer
protocol and the stationary base reading — it is in Périer's published account;
medium on any "first control ever" superlative, so the candidate prose avoids
claiming it.)

Candidate prose:

> In 1648 Blaise Pascal sent his brother-in-law up a mountain with two barometers
> to check — one carried to the summit, one left at the base with a friar assigned
> to stare at it all day, so that nobody could say the weather had done it. The
> ocean got shallower on the way up; the barometer at the base never moved.

**READER EFFECT:** Both readers' grip is loosest here — Priya's first skim
(journey L44–46, near-exit 1) and Marek's longest exit-itch ("I have seen each of
these figures a hundred times," journey L293–296). The buoyancy and barometer
figures can't be made novel, but the *experimental design* can: a control group in
1648 is a fact aimed precisely at this site's actual audience (Priya recognized
the d'Alembert fight as a spec dispute; she will recognize a control), and it is
the one detail of this famous story the hundred essays Marek has read do not
carry. The article already has "two barometers" in the sentence — it currently
pays that detail nothing.

**SLOP GUARD:** Family 16 — do not write "the first A/B test." The kinship with
the reader's profession must go unnamed (naming it is the rebrand). State the
protocol; let the engineer feel the recognition.

---

## 9. One Skeleton, Twice Built — remove the curriculum from the prose (family-18 fix)

**PLACEMENT:** L634–652, the whole section; also the section's title is safe, keep
it.

**THE MATERIAL.** Structural rewrite, no new facts. The section currently
instructs the reader to admire the construction ("Set this article's timeline next
to the previous article's table of contents and an odd thing appears") and then
explains why the course exists ("That is also why this wave course was born in
this story rather than merely near it"). Both are the methodology speaking. The
historical claim underneath is real and strong; state it on its own authority and
let readers who took lesson 2 notice the mirroring themselves.

Candidate rewrite (full section body):

> History never had a syllabus, but it kept a rhythm. Each theory ran until it
> failed in plain sight, and the next term was whatever it took to stop lying.
> Euler answered d'Alembert's absurdity; Navier answered Euler's honey-equals-
> water; Prandtl answered the meter stuck at zero; the projection method answered
> a fluid that computers kept letting pile up. Field, pressure, and constraint in
> 1757; viscosity in 1822; the solver in 1965–1999 — the ladder assembled itself,
> rung by visible failure.
>
> The first PDE in physics was d'Alembert's string, invented inside the argument
> this article just told. Navier–Stokes is the parent equation; sound, ripples,
> and every wave in the lessons ahead are its children, small enough to be gentle.

(Note: "the next term was whatever it took to stop lying" is preserved verbatim
per the flag. The rewrite drops: the table-of-contents instruction, "an odd thing
appears," "because history had no other engine either," "Nobody was following a
curriculum" — the last is absorbed into "never had a syllabus," and "why this wave
course was born in this story" is deleted entirely; the parent/children sentence
carries the course connection without self-reference.)

**READER EFFECT:** This is Marek's third near-exit (journey L446–455,
near-exit 3): "self-comparison to a lesson he never read, plus a historical claim
he half-disputes... survived by brevity." The rewrite removes both irritants — no
cross-artifact homework, and the failure-driven claim is stated as history's
property, with his own quibble (Poisson and Cauchy answered each other's
foundations, not a visible failure) no longer provoked because the rewrite claims
a rhythm, not an engine, and names only the four transitions that genuinely were
failure-driven. Priya "opens lesson 2 in a new tab" anyway (journey L249–251) —
she was moved by the material, not the instruction, and the instruction's deletion
costs her nothing.

**SLOP GUARD:** Family 18 is the fix itself. Residual risk is family 4 (the
Euler-answered/Navier-answered anaphora run) — it is four items long and
load-bearing, at the edge; keep it because each clause names a distinct repair,
but do not extend it.

---

## 10. Delete the torch label

**PLACEMENT:** Direct and Sinuous, L484 — "There is a quiet passing of torches in
this scene:"

**THE MATERIAL.** A deletion. The Stokes-referees-Reynolds fact is, per the
journey, the single most retold fact in the article for the expert reader (Marek:
"That is a genuinely new fact to me, thirty years into reading about this
subject, and it's the one I will retell," journey L399–402). The label in front
of it tells the reader it is poignant before letting them find out.

Candidate replacement:

> The slider under the tube is showing you its own value; the christening came
> later, when Sommerfeld called it the *Reynolds number* in a 1908 lecture, and
> the name stuck. The referee who handled Reynolds's paper at the Royal Society
> was Stokes — sixty-four years old, the man whose own pendulum memoir had
> carried the number in embryo three decades earlier.

**READER EFFECT:** Both readers' recorded reactions to this fact (Marek's retell,
Priya's "the cast is closing its own loops now," journey L184–185) happened
because of the fact, not the label — neither journey mentions the torch sentence.
Removing it converts an authored poignancy into a discovered one, which is the
difference the whole journey shows readers rewarding (compare Priya at the meter:
trust arrived when the article *anticipated* her, not when it directed her).

**SLOP GUARD:** This deletion is itself a family-5/18 repair (asserting the
emotion the evidence should produce). Do not replace the label with a subtler
label ("one more loop closed here") — that's the same crime at lower volume.

---

## 11. Retire the two-hats rebrand

**PLACEMENT:** Newton's Guess, L141–143 — "The very first act of the fluid story
is a wave calculation, wrong for a subtle reason — waves and fluids are the same
subject wearing two hats."

**THE MATERIAL.** A trim, not an addition. The sound-speed race and the Laplace
correction have already *demonstrated* the kinship; the hat sentence swaps the
demonstration for a costume metaphor (borderline family 16 — the copula claims a
unification the figure just performed better). The factual half of the sentence
is worth keeping because it is a real historical oddity with a date attached.

Candidate replacement:

> The real error was thermodynamic — sound compresses air too fast for the heat to
> leak away, which stiffens the spring — and Laplace corrected it in 1816. The
> first prediction ever made about a fluid in motion was a wave prediction, and it
> ran a hundred and twenty-nine years before it was right.

(129 years: 1687 → 1816. Verify the arithmetic framing at draft time — Principia
1687, Laplace's correction 1816. Confidence in dates: high, both already in the
article.)

**READER EFFECT:** Priya's attention dips through exactly this stretch (journey
L66–69: "my attention dips through the thermodynamics explanation... reads as
detail I'm not required to hold"). The replacement ends the beat on a number with
a span in it — the article's native way of making a sentence hold — rather than on
a metaphor that asks nothing. Marek, allergic to being managed, loses a sentence
of the shape he flinches at.

**SLOP GUARD:** Family 16 is the fix. Guard the replacement against family 17: "a
hundred and twenty-nine years before it was right" is a flat count, not a staged
reveal — do not upgrade it to "and it would take X years for anyone to see why."

---

## 12. Un-found the founding object

**PLACEMENT:** The Zero, L185–186 — "This is the founding object of the entire
wave-physics course, and the date matters: the PDE was invented *for a wave*, a
decade before fluids got theirs."

**THE MATERIAL.** A trim. "Founding object of the entire wave-physics course" is
the curriculum talking about itself (family 18); "and the date matters" is the
author grading his own fact. The historical claim — first PDE in physics, made
for a wave, a decade before fluids — is strong enough to stand alone, and after
proposal 9 it still gets its course-level echo in the final section's
parent/children sentence.

Candidate replacement:

> The first partial differential equation in physics was invented *for a wave* —
> the string got its equation a decade before fluids got theirs.

**READER EFFECT:** Marek files this exact sequencing point as load-bearing
*without* the label (journey L326–329: "a sequencing point I hadn't held
consciously, and I can see it's load-bearing for the whole course's framing.
Filed.") — proof from the simulation that the reader reaches the conclusion the
label pre-announces. Priya reads the string section "at medium speed" (journey
L87–88); one less sentence of throat-clearing shortens her path to the
what-is-a-solution fight that actually grabs her.

**SLOP GUARD:** Family 18 is the fix. The date-comparison must stay concrete
(1747 vs 1757 is already in the surrounding text); do not compensate for the
deleted emphasis with italics inflation.

---

## Priority order, if triage is needed

1 (Kolmogorov — user-confirmed headline defect) · 2 (Poisson shot — the section's
stated promise is currently unkept) · 9 (One Skeleton — flagged family-18
violation) · 10, 11, 12 (flagged micro-fixes, cheap) · 3 (press barb — one clause,
high yield) · 4 (Saint-Venant defense — completes two arcs at once) · 5 (Leray
scene — repairs the worst sag) · 6 (Ladyzhenskaya clause) · 8 (Pascal control) ·
7 (Newton report).

Proposals 1, 4, and 9 are the structural ones: 1 re-sequences a section and
completes the article's oldest ladder (name → equation → number → exponent); 4 is
a new long-range payoff arc (bridge mocked in one section, defended two sections
later, by the man the lottery skipped); 9 rebuilds a section's authority from
instruction to declaration.
