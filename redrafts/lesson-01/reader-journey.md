# Reader Journey — Lesson 01: Building the Navier–Stokes Equations

Two simulated readings of `src/lessons/lesson-01-navier-stokes.mdx`, moment by moment,
in the reader's own head. Line numbers refer to the MDX source.

---

## READER A — Marcus

Thirty-eight, backend engineer, ships Go services all day. Took multivariable calc in
2007 and has not touched a ∂ since. His friend Dana sent the link at 9:40pm with the
message "this is the fluid thing I mentioned." It's 10:05pm, he's on the couch with a
laptop, one lamp on. He is the kind of reader who will drag every slider because
dragging sliders is what he does for a living, in a sense.

### Lines 20–32 — the opening

*Bridge engineer, 1822, one line, million dollars.* Okay. I've heard of the Millennium
Prizes — I know P vs NP, didn't know fluids was one of them. Prediction forming: this
is going to be one of those "the equation is beautiful and mysterious" articles and
then it'll show me the equation and I'll nod at symbols I can't read.

Then line 29: "That unproven line is running right now, a few centimeters below this
paragraph." I actually glance down before finishing the sentence. That's a strange
little pull — the article told me the math is *below me on the page* and my eyes obeyed
before my brain finished parsing. "The wing flies anyway" — I reread that pair of
sentences (30–31). Mathematics hasn't decided whether the equation deserves to work,
and it works anyway. That's a genuinely weird thought and I sit with it for a second.
The prediction updates: maybe this isn't going to hide the equation from me. Maybe I'm
going to be shown the actual thing.

### Line 33 — the hero wing

I drag the slider immediately, both directions, before reading another word. Something
about the trail behind the wing changes — at one end it goes glassy and smooth, at the
other it braids into a two-colored rope of swirls. I don't know what the slider *is*.
I check for a label. Then line 37 tells me, almost smugly, that this is "the oldest
debt in this article; it gets paid, but not soon."

Huh. The article just told me it's withholding something on purpose. My reaction is
not annoyance — it's the feeling of a good cold open in a series. I file it: *the
slider is a mystery.* Honestly I half-expect to forget this. (I will.)

### Lines 40–52 — the color contract

Blue is velocity, amber is dye, violet means "something went physically wrong." The
violet clause snags me — *when something goes physically wrong you will see it* — that
implies things are going to go physically wrong at some point, on purpose. Small
anticipation planted. The 2D/incompressible caveat (49–52) I read at half attention;
it feels like a EULA. I do register "the flat versions are the ones we can see whole"
as a fair trade.

### Lines 54–96 — Seeing Flow

Reeds and petals. This is gentle — maybe too gentle? I'm a little impatient during
lines 56–59; I know what a stream looks like. But the creek demo is pretty and I nudge
the time slider. The arrows demo (line 71): fine. The line at 73–74 — "The grid is not
a fact about the water" — I slow down. That's aimed at me specifically, the guy who
thinks in arrays. The grid is a rendering choice, not the data. Noted.

Lines 83–87, the paragraph starting "Notice that the two instruments genuinely
disagree": I reread this one. An arrow watches one place and sees many parcels; a
marker watches one parcel through many places. That's... a clean inversion, and the
sentence structure mirrors itself so exactly that I feel the symmetry before I
understand why it matters. "That distinction is the heart of our first equation" —
okay, so this reeds-and-petals stuff was load-bearing. Mild vindication for not
skimming.

Line 95–96: "What an arrow actually *is*, we haven't said." I notice the trick — end
the section by naming the hole in it — and I fall for it anyway. Scroll continues.

### Lines 98–138 — A Field of Velocities

The particle box. Here's my first real surge. I drag the averaging-box slider small
and the blue arrow jitters like a bad sensor reading; I drag it big and the arrow dies
to nothing. Line 115–116: "This is what still water is: not stillness, but perfectly
balanced commotion." I stop and reread that sentence. That is a sentence I want to
keep. I actually select it, then unselect it, feeling slightly silly.

The wind-mode box (line 122): the article tells me to look at the numbers *before*
touching the slider, and I obey — drift tiny, thermal speed huge. Then I add the
drift and stare at individual particles trying to see it, and I genuinely can't, and
then the box's average nails it instantly. Something in me goes *oh* — the average is
a better instrument than my eyes. "Out of all the disorder, order emerges" (127). I
spend maybe ninety seconds here, longer than any demo so far, toggling drift on and
off, trying to catch a single particle behaving differently. I never can. That
failure is the point and I know it and I keep trying anyway.

$\mathbf{u}(x,y,t)$ arrives at line 132 and it doesn't scare me, because it's been
defined as "the whole arrow grid folded into one symbol." First notation of the
article and I own it. Prediction: they're going to keep doing this — demo first,
symbol last. I hope so, because it's working on me.

### Lines 140–183 — Following a Parcel

The Predict widget (147–153). I like being asked. I pick (a) — steady field, steady
readings — with maybe 70% confidence. I run it. The bolted probe flatlines, and the
drifting parcel's readout swells and falls as it sails through the dye. I got it
wrong. And the wrongness doesn't sting, because line 158–159 hands me the resolution
in one clause: *all of the parcel's change comes from its own motion through a world
that varies from place to place.* Of course. The parcel is a moving cursor over a
static array. I literally think of it as an iterator. That's my mental model and it
slots in without resistance.

Then line 171 — the material derivative equation. My stomach does the old calc-class
drop. ∂q/∂t, (u·∇)q, upside-down triangles. It's 10:25pm. This is the moment I'd
normally start skimming math blocks and reading only prose. But the underbraces say
"change at a point" and "change from being carried," and those are the two instruments
from the previous section, and — the edge-case paragraph at 174–178 is what saves me.
If u = 0 the parcel agrees with the probe; if the world is uniform, moving changes
nothing. I check both in my head like unit tests and they pass. "You just watched
(u·∇)q with your own eyes" (177–178) — and I *did*, that was the amber readout
swelling. The scary symbol is retroactively the thing I already saw. I scroll back up
to the ParcelProbe demo to confirm, watch the readout rise once more, scroll back
down. First equation of my adult life I feel like I witnessed rather than accepted.

Line 180–183: the left-hand side of Navier–Stokes exists and "the right-hand side is
still empty." I now understand the shape of the whole article: we're going to fill in
the right-hand side term by term. Direction is fully clear and I want to go there.
This is the moment the article stops being Dana's link and becomes my evening.

### Lines 185–234 — Advection

Blob relocated, blob smeared, blob spiraled. Three quick demos and I give each maybe
ten seconds — attention sags slightly across 190–200, honestly; the shear one I barely
touch. Then line 208, "Here is the turn the whole subject pivots on," and I sit up
because the article has never used that voice before. Velocity is carried by the
flow... so q can be **u** itself... "the field carrying the field." The equation feeds
on its own output. I get a little chill that I recognize from the first time I
understood recursion. Line 213–214 connects this self-reference to why nobody has
tamed the equation, and the million dollars from the opening flickers back into view
for a second.

The AdvectionSchemes race (223): left panel tears itself into violet shreds — and
violet means *physically wrong*, the color contract from line 44 cashing in, "negative
dye, a thing that cannot exist." I watch the left side destroy itself twice. The right
side's trick — "whose fluid arrives here?", trace backwards — reads like a debugging
war story, and the confession at 229–230 that the fix costs blur ("our simulations
are slightly softer than reality on that account") makes me trust the whole apparatus
more, the way a candid changelog does.

### Lines 236–286 — Viscosity

"Fluids can't keep secrets" (238) — good line, I note it in passing. The jet demo: I
crank the grip slider and watch the sharp shoulders of the velocity profile slump
first, exactly as promised at 250–251 ("the sharp corners go first"). ShearBlend and
VortexDecay get shorter visits; by the third demo of this section I'm sampling rather
than studying — honest sag around lines 256–264, my eyes skip the ShearBlend prose
entirely.

The equation at 270 with ∇² — and line 272–274 hands me the reading: "how far that
point's velocity sits from the average of its neighbours." Oh. The Laplacian is a
diff-against-neighborhood-average. Ten years of that symbol being noise and it's a
one-line description of a blur kernel. I have written that exact convolution at work.
I reread the sentence to make sure it said what I think it said. It did.

The mercury/honey/air paragraph (279–283): mercury denser than water but runnier —
didn't know, enjoy it. "air's is about 0.02, which is not zero, and that small number
will matter more than you'd think." That's clearly a plant, even I can see this one's
a plant, but I don't guess what it's for.

### Lines 288–328 — The Competition

The cylinder. This is the demo I stay on longest so far. Honey end: obedient,
symmetric ooze. I drag right slowly, watching for the moment the wake first wobbles —
there's a specific slider position where the symmetry breaks and I ease back and
forth across that threshold maybe six times, like finding a resonance. The alternating
eddy street looks like the wing's braid from the top, and the prose says so (295–296)
before I finish thinking it.

Reynolds number (306): a ratio of stirring to smoothing. Fine. But the bacterium
paragraph (315–318) is where I put my drink down. Stop swimming and you halt "within a
fraction of an atom's width." I screenshot that sentence. Then the 747 at 10⁸ —
there's the air-viscosity plant from line 283 paying out, "air's almost-nothing
viscosity cashing in," and I feel the small click of a loop closing even though I'd
half-forgotten it was open. Then line 319: the confession that the hero wing "is
aerodynamically a moth." I laugh, alone, on the couch. The article just ratted out its
own opening figure. My coffee is at a few thousand — I look at the mug on the table.

The Waypoint (322–328) is an inventory: field, derivative, stirrer, smoother, referee.
I read it as a save point and realize I could actually recite this list. It also
names what's missing — nothing stops fluid from piling up — and I try to imagine what
that even means. Can't quite. Good. It's 10:45 and I check the scrollbar for the
first time: a bit past halfway. I'm staying.

### Lines 330–384 — Pressure

Particles hammering a block, red flashes. Pressure as bombardment — I knew this one
from some half-remembered chemistry class, so lines 332–343 read fast. The pressure
landscape with draggable hills and valleys: I drag the high and low regions around
more than I need to, mostly because dragging is pleasant. The contour-map analogy is
familiar territory and my attention thins across 352–357 — this is the sagging stretch
of the back half for me, the paragraph starting "To see how quickly pressure changes"
gets skim-read.

The Predict at 361: which way does the parcel accelerate? I answer (b) instantly —
downhill, obviously — and I'm right this time, and being right after being wrong
earlier feels like the quiz is calibrated to an actual person. The deep-sea creature
line (379–380) — crushed from all sides, pushed nowhere — is the kind of fact I retell.
Second screenshot candidate; I don't take it, but I read it twice.

Line 382–384: "it is tempting to add them up and declare victory." Ominous phrasing.
Prediction: the next section is where the violet comes back. I remember the color
contract now.

### Lines 386–422 — The Broken Fluid

Called it. The cylinder channel with no pressure, and it's *wrong* in a way I can see
before the prose says so — dye soaks into the cylinder like it isn't there, water
heaping up like sand. Line 394: "This is just wrong." The bluntness is almost funny
after all the careful prose. This might be my favorite demo of the article, and it's
the broken one. There's something deeply familiar about it: this is what my code does
the first time I run it. They showed me the bug before the fix.

The loop-counting demo (405, 410): I drag the loop around hunting for a violation,
find none, then turn on the hidden spring and catch it red-handed — the violet
"scene of the crime" framing has fully taken hold, I'm thinking in the article's
vocabulary now. ∇·u = 0 at line 417 arrives and it isn't notation, it's the arrest
warrant. Line 421–422 — "we've already met the only actor fast enough" — I know it's
pressure and I feel clever for knowing, which, I dimly suspect, was arranged.

### Lines 424–482 — Pressure, the Instant Fixer

"You take the controls first" (426). The PressureFix game: I under-shoot, overshoot on
purpose to see the reverse crime, hollow the spot out, then walk it in to the balance
point. I spend two full minutes on a demo whose point I got in fifteen seconds,
because *being* the pressure field is fun. Then line 436–439 lands the reveal — real
pressure does this everywhere, continuously, with no one at the slider — and the demo
retroactively deputized me. That's the emotional peak of the back half for me.

Then the Helmholtz stretch (443–458). It's 11:00pm and this is the hardest terrain of
the night. "Any smooth flow field can be split into two ingredients" — okay. The
HelmholtzSplit demo helps; I toggle swirl-only and pile-only. But the Poisson equation
at 458 is the one place my eyes bounce off a math block and don't come back — ρ/Δt,
u-star, no. And then line 460: "You don't need to unpack this one symbol by symbol;
read it as 'the pressure landscape whose disagreement-with-neighbours matches the
crime.'" The article felt me flinch and let me off. Relief, plus a flicker of
gratitude, plus the tiniest sting — am I being let off because it knew I couldn't?
The JacobiRelax scrubber pulls me back to my hands: I scrub sweeps from zero and watch
the hill grow and the violet die, back and forth, and the abstract "solve" becomes a
video I control. Neighbourly negotiation, dozens of times per cell per frame. I think
about how expensive that must be and feel a professional's respect.

Lines 474–477: pressure has no equation of its own, no history, no momentum — "Ask a
fluid 'why this pressure?' and the only answer is: *because that is what it took*."
I read this three times. This is the sentence of the article. Pressure isn't a thing,
it's a constraint solver running at infinite speed. I copy this one for real.

### Lines 484–513 — Assembling Navier–Stokes

The full equation at 489, every term underbraced in words I now speak. I read it
left to right like a sentence: change at a point equals the flow carrying itself,
minus downhill from pressure, plus neighbours dragging on neighbours, plus outside
pushes, subject to no crime. Line 493: "There is no term in that line you have not
personally dragged a slider through." I check the claim, term by term, against my
memory of the evening — and it's true. That verification, me auditing the equation
against my own hands, is the proudest moment of the read.

TermToggle: I switch off carrying (honey world), switch off viscosity (Euler world —
and the article footnotes its own blur again at 505–506, consistent), switch off
pressure and there's the violet catastrophe, "now as a diagnosis rather than a
mystery" (507). It genuinely is. Two hours ago that violet would have been noise.

Line 509–513: the million dollars returns. Whether 3D solutions stay smooth — "Not
'hard': *unknown*." The debt from line 25 pays out and the payment is bigger now,
because the equation isn't a stranger's anymore; it's the one *I just assembled with
sliders*, and nobody can prove it makes sense. The opening's weird thought — the wing
flies anyway — comes back with weight behind it.

### Lines 515–546 — Running the Equation

Stable Fluids: four moves, and "each one is a section of this article" (521). I feel
the whole essay fold up into an algorithm. The SolverXray gets a shorter visit — I'm
tired, it's 11:15 — but I do run pressure-alone to watch it hunt crime.

Then line 533–534: "the oldest debt comes due: the slider was the Reynolds number all
along." Oh — *right*. The hero slider. I had genuinely forgotten. I scroll all the way
back to the top, drag the hero slider once with new eyes, then scroll back down to the
finale wing and drag it there, and stir the stream with my pointer, and watch the
braid shatter and reform. Honey end: glassy. Fast end: the street. I know what the
number is, I know why the braid exists, I know why it blurs a little more than it
should. The finale demo isn't showing me anything new. It's showing me that *I'm* new.

The fair-warnings paragraph (540–546) — blur, no true turbulence, "I would advise
against using this solver to design a submarine" — reads like a good README's
limitations section, and "every one of them is yours now" is a sentence I feel in the
chest more than I'd admit to Dana.

### Lines 548–573 — Where Waves Live

I'm running on fumes but this is short. The linearization argument (552–558) —
smallness squared, the monster goes docile — I follow at maybe 80%. The sound demo:
fine. The surface-wave demo with the amber floats (566–568) wakes me back up: the
floats *bob in place* while the wave shape sweeps past. The wave travels; the water
mostly doesn't. I did not know that. That's the fact I'll say out loud tomorrow at
standup, I can already tell. The course pivot — everything ahead lives inside math
I've touched — reads as an invitation I'll probably accept.

### Lines 575–612 — Further Reading, Final Words

I skim the reading list, open the Barba notebooks link in a tab I will be honest and
say I may never revisit, note the Ciechanowski hat-tip without knowing who that is.
The coffee coda (602–612): the spiral off the spoon is the carrying term feeding on
itself, the fading is ν, and the coffee never piles against the cup wall because a
pressure field is being conjured and dissolved instant by instant. I look at my
actual mug again. Last line — "an unsolved equation, performing itself flawlessly, in
your cup" — I copy it and text it to Dana with "ok this was worth it." It's 11:32pm.

---

## READER B — Priya

Thirty-one, did a physics MSc before drifting into quant work. Has read all of
Ciechanowski, most of Distill, watched 3blue1brown since 2016. Reads at roughly
double speed. Clicked the link off a group chat at lunch. Her operating question for
the first two screens: *is this author doing the thing, or performing the thing?* She
has closed a lot of tabs at paragraph three.

### Lines 20–32 — the opening

Millennium Prize in the first paragraph. Slight wince — that's the fluid-dynamics
equivalent of opening a quantum article with Feynman's "nobody understands" quote.
I've seen the million dollars invoked by people who couldn't state what regularity
means. Suspicion meter: elevated. Prediction: next comes either a biography of Navier
or a "journey" promise.

Neither comes. Line 29–31 instead: the unproven line is *running below this
paragraph*, and "The wing flies anyway." Pause. That's not decoration — that's an
actual epistemic point, the gap between mathematical justification and physical fact,
stated in six words. Fine. One more section.

### Lines 33–47 — hero and contract

The wing: I drag the slider and clock the wake transition immediately. That's a
Reynolds sweep. The slider is Re, or speed-as-proxy-for-Re; the two-toned Kármán-ish
street at the fast end settles it. So when line 37 announces "the oldest debt in this
article; it gets paid, but not soon," I've already collected the debt. Mild smile,
mixed feelings: the self-aware debt-flagging is a Ciechanowski-school move, and
naming your own device out loud is one notch showier than he'd be. I note the
color-coded vocabulary system (42–47) as straight from the Airfoil playbook — the
question is whether it's used with discipline or as costume. "The amber and the rose
are the same water wearing different shirts" is a good enough sentence that I withhold
judgment. The honest 2D/incompressible contract up front (49–52): correct thing to
do. Still watching.

### Lines 54–96 — Seeing Flow

Eulerian vs Lagrangian, illustrated with reeds and petals. I know this cold, so I read
these forty lines in about forty seconds — this is my first sag, eyes skipping from
demo to demo across 61–93, prose mostly unread. Two things snag on the way past.
Line 73–74: "The grid is not a fact about the water" — clean guard against the
discretization confusion, placed before the confusion can form. And lines 83–87: the
two-instruments paragraph carries the entire Eulerian/Lagrangian distinction without
ever using either word. I actually scroll back to check — no, the words never appear.
The jargon-last discipline is real, then, not costume. That's a point in the ledger.
Prediction: the material derivative is two sections away, and it'll be derived off
this exact paragraph.

### Lines 98–138 — A Field of Velocities

Continuum limit via averaging box. Familiar again, but the wind-mode demo (122) is
better than the standard telling: making the drift *visibly undetectable* per-particle
while the average catches it instantly is the right demonstration, and I drag the box
size around longer than I need to, checking whether the jitter scales like 1/√N the
way it should. It seems to. Someone tuned this. The staging confessions at 108–111 —
arrow drawn longer than truth, particles pass through each other — are exactly the
disclosure habit I'm auditing for. Both demos so far confess their lies unprompted.
The suspicion meter is drifting down and I notice it drifting.

### Lines 140–183 — Following a Parcel

A Predict widget. Bristle: I am being quizzed, and I dislike being quizzed. The
question itself, though (148), is a legitimate fork — steady field vs. moving
observer is the actual crux, not a gotcha — so I answer, run it, and move on without
resentment. Called it two sections ago: material derivative, line 171, derived off
the probe-vs-parcel pair exactly as predicted. Meeting my prediction, not beating
it — but the *edge-case audit* at 174–178 is the part I'd steal: u = 0 recovers the
probe, ∇q = 0 kills the carried term, and the steady stream isolates (u·∇)q so the
demo the reader just watched *was* the term. That last move — "You just watched
(u·∇)q with your own eyes" — is the pedagogical version of an existence proof, and
it's tight. Reading speed drops to normal for the first time.

### Lines 185–234 — Advection

The three DyeCarry demos I flick past in fifteen seconds. Line 208–214, the
self-advection turn: "the field carrying the field," equation feeds on its own
output. This is *the* conceptual hinge of the subject and the prose gives it the
right weight without a single hype adjective — nonlinearity named after the
phenomenon, one paragraph, done.

Then AdvectionSchemes (223) and now I'm interested for real. Showing forward-Euler
transport *tearing itself apart live*, violet negative dye, next to semi-Lagrangian
stability — I have read many fluids explainers and almost none of them show the
unstable scheme running. They tell you it's unstable; this one lets it die on camera.
And line 227–228 makes the sharp claim — unstable "no matter how small the step
gets" — which is the correct, non-obvious statement (unconditional instability, not
CFL violation), and 229–230 immediately confesses the numerical-diffusion price of
the fix. That pre-empted my exact objection. I had "semi-Lagrangian is diffusive as
hell" loaded and ready, and the article said it first. This is the moment I decide
the author has actually implemented this, not read about it. Tab survives lunch.

### Lines 236–286 — Viscosity

Momentum diffusion as heat equation — standard, and I skim the three demos (248–264)
in under a minute; ShearBlend and VortexDecay get one glance each. Second honest sag.
Line 272–274's reading of the Laplacian as distance-from-neighbourhood-average: the
right plain-language rendering, filed for my own future use. The viscosity-isn't-
density paragraph (279–283) with mercury vs honey — nice, and "air's is about 0.02...
that small number will matter more than you'd think" is a visible plant. Obviously
it's the Re = 10⁸ setup. Two-for-two on predicting the debts. I'm starting to read
the article on two levels at once — the physics, which I know, and the construction,
which is what's actually holding me.

### Lines 288–328 — The Competition

Cylinder regime sweep. I drag straight to the interesting part: where does the wake
first go unsteady, and does the demo's labeled order-of-magnitude Re roughly match
the ~47 threshold for vortex shedding? I zoom the slider around the transition. It's
in the right neighborhood. The prose hedges honestly at 308–310 — "a scaling argument
we're waving past" — rather than pretending UL/ν fell from the sky. Then line 319: the
hero wing, "flying at a few hundred, is aerodynamically a moth." Ha — there it is.
That confession was *my* objection too; a browser sim at toy Re presented as a wing is
the kind of quiet dishonesty I hunt for, and the article turned it into a joke at its
own expense before I could bill for it. Three times now it's beaten me to my own
critique. The bacterium's stopping distance and the 747 land as well-chosen numbers,
and the air plant pays exactly where I said it would. Meeting predictions — but the
moth line beats them.

The Waypoint (322–328): inventory of holdings plus the named gap — "nothing we've
built stops fluid from piling up." Good structural honesty. And a real question: I
know the answer is the pressure projection, but I don't know how they'll *stage* it,
and staging is what I'm here for now.

### Lines 330–384 — Pressure

This is my long sag. Kinetic pressure via wall bombardment, pressure maps, contour
lines, marble-on-terrain — I have read this exact pedagogical sequence, beautifully
done, in Airfoil, and lines 332–357 give me nothing it didn't. Eyes skip whole
paragraphs; I check the scrollbar at around line 350 — two-thirds. The second Predict
(361) asks me whether marbles roll downhill and I feel a genuine flick of being
managed — this fork is not live for anyone who's read this far. Answer, skip the demo,
keep moving on momentum and credit already extended. Deep-sea creatures (379–380):
fine, pretty. The section's one structural job — -∇p/ρ on the parcel — is done
cleanly, but this is the stretch where, on a worse day, I'd have left.

### Lines 386–422 — The Broken Fluid

And this pulls me back hard. Running the *incomplete* physics — advection plus
viscosity, no pressure — and letting the reader watch fluid soak into a cylinder and
heap up like sand: I have not seen this done as a first-class figure before. Everyone
teaches the projection; nobody first ships the broken build. "This is just wrong"
(394) — blunt, and the bluntness is backed by the visible heaping, not by adjectives.
The divergence loop hunt (405–410) with a hidden source to catch: the counting
argument made draggable. ∇·u = 0 arrives as an arrest warrant, and 421–422's "we've
already met the only actor fast enough" sets up the projection with actual dramatic
logic — pressure was characterized as *instantaneous* back in the bombardment section,
and that's the property being called on now. The crime vocabulary is on the edge of
cute but it's doing real referential work — violet has meant "conservation violated"
since line 44 and every use has been literal. This section is the article's own idea,
not an inheritance, and it's the moment the tab converts from "audit" to "read."

### Lines 424–482 — Pressure, the Instant Fixer

The PressureFix game — reader manually balances a source with a pressure hill before
being told the fluid does it automatically. I play it once, precisely, and appreciate
the inversion at 436–439: you were the solver, now fire yourself. Helmholtz at
443–452, stated-not-proven with the proof deferred to further reading — right call,
and the decomposition demo is the correct evidence to show. The Poisson equation
(458) with the honest "you don't need to unpack this one" (460): I do unpack it,
reflexively — ρ/Δt scaling on the divergence of the pre-projection velocity, yes,
that's the standard Chorin splitting — and the article's plain-language reading,
"the pressure landscape whose disagreement-with-neighbours matches the crime," is
faithful to the math it's paraphrasing. Paraphrase without betrayal is rare and I
check for it specifically.

JacobiRelax: I scrub it and watch the low-frequency error hang around at low sweep
counts, which is the actual convergence behavior of Jacobi — whether that's deliberate
or just true, it's *right*, and right in a way you can't fake by drawing the answer.

Lines 474–477: pressure has no ∂p/∂t, no history — it's a Lagrange multiplier, and
"because that is what it took" is the best civilian rendering of a Lagrange
multiplier I've encountered. I copy that sentence into my notes file. That's the
article's one aphorism, spent at the right node. If I send this article to anyone,
this line is why.

### Lines 484–546 — Assembly, surgery, finale

The assembled equation at 489, each term underbraced in the article's own earned
vocabulary. Line 493's claim — no term you haven't dragged a slider through — I
verify against the construction, because verifying construction is what I've been
doing all along, and it holds. TermToggle is where I spend my longest single stretch
of the whole read: I kill viscosity and watch for whether the "Euler world" secretly
blurs — it does, of course, semi-Lagrangian diffusion — and the article *already
confessed it*, at 505–506, cross-referencing its own earlier confession. Fourth time
it's pre-empted me. I stop keeping score.

The Clay problem returns at 509–513 and now it's load-bearing rather than
ornamental — "Not 'hard': *unknown*" attached to the specific equation the reader
just assembled. The opening's cheap-looking hook was a debt too, and it clears.
The finale wing: slider named as Re, which I knew at line 33 — the payoff for me
isn't the reveal, it's the symmetry of the frame closing. I stir the stream with the
pointer for a while, longer than analysis requires. The fair-warnings paragraph
(540–546) — numerical viscosity, no subgrid turbulence, WebGPU fallback resolution,
"I would advise against using this solver to design a submarine" — is the full
limitations section I'd demand, delivered unprompted, with a joke in it.

### Lines 548–612 — Waves, readings, coda

The linearization to sound and surface waves (552–568): compressed to exactly my
taste — smallness squared kills the nonlinearity, one demo per wave type, floats
bobbing in place to nail phase-vs-material transport. This is the pivot that tells
me what the *course* is, and it's the first point where I think about lesson 02 as
something I might read rather than something I'm reviewing.

Then Further Reading, line 591–595: Ciechanowski named, the debt to Airfoil declared
openly — "this lesson is openly in conversation with it," stops where Airfoil stops,
"tips its hat." I've been silently comparing this article to Airfoil since line 42,
sometimes in its favor and sometimes not, and the author walks up and names the
comparison himself, states precisely where the boundary between the two works sits —
Airfoil builds the feel and stops at the equations; this begins there. That's an
accurate self-placement, and accurate self-placement is the single strongest trust
signal I know. The coda's coffee spiral I read at full speed but the last line —
"an unsolved equation, performing itself flawlessly, in your cup" — closes the
"wing flies anyway" thought from line 31, and I notice the ring structure, and I
paste the article link back into the group chat, which is my highest form of
applause and costs me exactly one message.

---

## EMOTIONAL TRACE

### Marcus (Reader A)

1. **Skeptical curiosity** — lines 20–28 — expects a symbols-he-can't-read article
2. **First pull** — lines 29–33 — glances down at the running sim mid-sentence; drags hero slider before reading on
3. **Patient coasting** — lines 54–96 — gentle terrain, mild impatience at reeds/petals, snagged by the two-instruments inversion
4. **Surge / wonder** — lines 98–138 — "perfectly balanced commotion"; ninety seconds hunting for the invisible drift
5. **Fear → witnessed relief** — lines 161–183 — first equation dread dissolved by edge-case unit tests; scrolls back up to re-watch the demo the symbol names
6. **Recursion chill** — lines 208–234 — the field carrying the field; the scheme that tears itself apart
7. **Grounded delight** — lines 288–328 — bacterium screenshot, moth confession laugh, looks at his own coffee mug; first scrollbar check, decides to stay
8. **Skim trough** — lines 344–357 — contour-map stretch read at half attention
9. **Recognition jolt** — lines 386–422 — the broken fluid is *his* code before the fix; thinking in the article's crime vocabulary
10. **Deputized, then strained, then released** — lines 424–482 — plays pressure-fixer for two minutes; bounces off the Poisson block at 11pm; caught by "you don't need to unpack this"; copies "because that is what it took"
11. **Ownership** — lines 484–546 — audits the assembled equation against his own evening and it checks out; scrolls to the top to re-drag the hero slider as a different person
12. **Tired tenderness** — lines 548–612 — bobbing floats wake him; texts the last line to Dana at 11:32pm

### Priya (Reader B)

1. **Armed suspicion** — lines 20–27 — Millennium Prize in paragraph one, wince
2. **Stay of execution** — lines 29–31 — "the wing flies anyway" is a real point; one more section granted
3. **Instant debt collection** — line 33 — reads the hero slider as Re on first drag; the "oldest debt" framing noted as one notch showy
4. **Audit mode** — lines 40–138 — checking disclosure habits; staged-demo confessions and jargon-last discipline lower the meter
5. **Speed-skim sag** — lines 54–96 — known material, forty lines in forty seconds
6. **Conversion event** — lines 216–234 — the unstable scheme dies on camera and the diffusion cost is confessed before she can object; decides the author has implemented, not just read
7. **Two-level reading** — lines 236–328 — physics known, construction watched; moth confession beats her to her own critique
8. **Long sag / near-exit** — lines 330–384 — the Airfoil-shaped pressure sequence; scrollbar check; marble Predict bristles
9. **Pulled back hard** — lines 386–422 — shipping the broken build first is a move she hasn't seen; audit converts to reading
10. **Professional respect → note-taking** — lines 424–482 — verifies the Poisson paraphrase is faithful; Jacobi's slow low-frequency convergence is *right*; copies the Lagrange-multiplier aphorism
11. **Stops keeping score** — lines 484–546 — fourth pre-empted objection at TermToggle; stirs the finale longer than analysis requires
12. **Named lineage, closed ring** — lines 591–612 — the Airfoil comparison she'd run silently is declared and precisely placed; reposts the link

---

## TOMORROW TEST

### Marcus retells:

1. "A bacterium in water — if it stops swimming, it stops within *a fraction of the
   width of an atom*. Water is basically concrete to it." (line 316–318)
2. "In a water wave the water doesn't actually go anywhere — the floats just bob in
   place while the shape moves past. The wave travels; the water doesn't." (566–568)
3. Texted verbatim to Dana the night before: "an unsolved equation, performing itself
   flawlessly, in your cup." (line 612)

### Priya retells:

1. "Pressure has no equation of its own. Ask a fluid 'why this pressure?' and the
   only answer is: *because that is what it took*. Best plain-English Lagrange
   multiplier I've ever seen." (lines 474–477)
2. "It runs the *broken* physics first — no pressure term — and lets you watch the
   water soak into the cylinder and pile up like sand before it fixes it." (388–397)
3. "The author admits his own hero wing 'is aerodynamically a moth.' Confessed my
   objection before I could make it." (line 319)

---

## NEAR-EXITS

### Marcus

1. **Line 171, the material derivative block, ~10:25pm.** First real math of the
   night; a decade of ∂-avoidance says skim-and-drift, which historically ends with
   the tab closing three paragraphs later. Pulled back by the underbrace labels
   matching the probe/parcel demo he just ran, and the u = 0 / ∇q = 0 edge cases he
   could verify in his head like unit tests.
2. **Lines 443–473, the Helmholtz/Poisson stretch, ~11:00pm.** Densest terrain at the
   tiredest hour; eyes bounce off equation 458 and do not return to it. Pulled back
   by line 460's explicit release ("you don't need to unpack this one") and by the
   JacobiRelax scrubber putting the solve back in his hands.
3. (Softer) **Lines 344–357, the contour-map stretch.** Attention thins rather than
   threatens to leave; the ominous "tempting to declare victory" at 382–384 and the
   promised return of violet carry him across.

### Priya

1. **Lines 20–27, the opening screen.** Millennium-Prize-as-hook pattern-matches to a
   hundred closed tabs. Pulled back within two sentences by "the wing flies anyway" —
   an actual epistemic claim where she expected perfume.
2. **Lines 330–384, the pressure section.** The one stretch that reads as inherited
   rather than built — the Airfoil-shaped bombardment/contour/marble sequence plus a
   Predict fork that isn't live for her. Scrollbar checked at ~line 350. Pulled back
   by the Broken Fluid section: incomplete physics shipped as a figure, which she has
   not seen elsewhere.
3. (Earlier, milder) **Lines 54–96, Seeing Flow.** Known material at skim speed; the
   risk is boredom-drift, not offense. Held by the disclosure habits she's auditing
   paying out (staging confessions at 108–111, jargon withheld at 83–87).

---

## THE RIDE IN ONE PARAGRAPH

The article opens by pointing at a gap — mathematics undecided, wing flying anyway —
and then walks the reader down into that gap by hand: first teaching two ways of
*watching* water, then dissolving the arrows into molecular commotion and
reassembling them, then putting the reader inside a moving parcel so the first
equation arrives as a caption for something already witnessed. The middle of the ride
alternates muscle and rest — a conceptual jolt (the field carries itself), a stretch
of familiar terrain (viscosity, pressure hills) where both readers' attention
honestly thins, then the ride's signature drop: the physics is deliberately run
*broken*, water heaping like sand, so that pressure enters not as a topic but as the
only suspect fast enough, and the reader is handed the slider to be the fix before
being told the fluid needs no one at the controls. The assembly of the full equation
then plays as an audit the reader performs on their own evening — every term traceable
to their own hands — and the two debts opened in the first screen (the unlabeled
slider, the unclaimed million) come due within a few paragraphs of each other, one as
a name, one as a weight. The ride ends by shrinking: from the unproven equation back
down to a coffee cup on the reader's own table, both readers leaving with a sentence
in their clipboard and the odd sensation that the most familiar liquid in their life
got stranger, not tamer, by being explained.
