# METHODOLOGY — concept → skeleton → blocked content → final draft → polished post

The essence (`ESSENCE_OF_VOICE_AND_DESIGN.md`) inverted into a production process for
our lessons. Five stages, each with entry criteria, work, and a gate. The stages exist
because the corpus shows the craft is layered: *structure* mistakes are fatal and cheap
to fix early; *voice* mistakes are cheap and only worth fixing late. Never polish prose
sitting on a broken skeleton.

## §0 — Our standing deviations (decided once, apply to every lesson)

We imitate the essence, not the accidents. Four deliberate departures:

1. **We cash out the math.** He builds superb intuition and refuses the equations
   (zero Bernoulli, NS named-not-shown). Our reader came to *earn the equations* — so
   every lesson lands them, using his own math protocol (Essence §5): interactive →
   words → symbols-as-compression → formula with color-bound terms → boundary check →
   every term gets its own figure.
2. **Prediction before reveal.** His interaction is confirmation; ours asks for a
   committed guess before marquee reveals ("Before you drag — which way will it
   turn?"). One per act, not per figure; more becomes a quiz.
3. **Waypoints.** At act boundaries, a two-sentence "what you now hold" consolidation.
   Un-preachy, no bullet lists in the reader's face.
4. **Named solvers.** We state the numerical scheme and its stability condition in the
   post. For us the simulation *is* subject matter, not stagecraft.

Everything else: his rules are our rules.

---

## Stage 1 — CONCEPT

**Output: one paragraph + one figure idea. Gate: the wonder gap is real and the
protagonist exists.**

- **Pick an immortal subject** with a *wonder gap*: daily-familiar outside, hidden
  mechanism inside. (His hooks all live in that gap: watches, flight, the Moon.)
- **Choose the persistent protagonist** — the single artifact that survives the whole
  post and accumulates understanding (the movement / the airfoil / for us: one flow).
- **Name the hero figure**: the finished thing, running, playable, *not yet
  understandable*. It opens the post with an IOU and returns at the end, understood.
  The article is a proof that terminates at its own epigraph — plan the ring first.
- **List the misconceptions to kill, and choose omission vs. debunk** for each. (He
  omits Bernoulli entirely; he debunks GPS-relativity flatly. Omission for attractive
  wrong frames; debunk for myths the reader will meet elsewhere.)
- **Set the math budget now**: which equations will be *earned* by the end, in what
  order. This is our deviation #1 and it shapes everything downstream.

## Stage 2 — SKELETON

**Output: the section ladder + full figure list. Gate: every section ends on a
manufactured problem, and the figure count is budgeted.**

The skeleton is a **chain of failures repaired**:

1. Write the **failure chain**: for each section, name (a) the naive thing we'll build,
   (b) its *visible, simulated* failure, (c) the savior sentence ("This is where X
   comes in"). If a section has no failure driving into it, it's inventory — cut or
   merge it. Alternative grains of the same move: constraint-relaxation ladder (remove
   one impracticality per section) or representation-until-it-breaks.
2. **Representation section(s) come first.** Teach how to *see* the domain (our arrows,
   markers, color maps) before anything happens in it. Nothing moves until the reader
   can read the display.
3. **Ground the continuum in micro once, then formally abandon it** ("this lets us
   leave the particles behind").
4. **Budget figures at ~1 per 140 words** (band: 85–180). A 12,000-word lesson is
   ~70–90 figures — write the full figure list now: for each, the one idea, the one
   knob, and the *cheapest rendering that works*. Amortize with **reuse-with-overlay**
   (same scene gaining arrows → markers → colors) and **one-delta sequencing**
   (consecutive figures differ by exactly one element).
5. **Plant the payoffs**: every early unexplained demo gets a ledger entry and a
   redemption point ("Recall that…"). Debts unpaid at the end of the skeleton = broken
   skeleton.
6. **Place the math moments** where the reader has just *been* the solver — the
   equation must arrive as the formalization of something they already did by hand.
7. **Mark the waypoints** (our deviation #3) at act boundaries, and the **prediction
   moments** (deviation #2) before the marquee reveals.
8. **Check the drought map**: no stretch over ~3 paragraphs without a figure; density
   droughts are the measured bail points.

## Stage 3 — BLOCKED CONTENT

**Output: MDX with real figures and scaffold prose. Gate: it runs — every figure is
live, honest, and one-knob.**

Build order matters: **figures before finished prose**, because the figure is the
argument and the prose is its legend.

1. **Assign the palette contract** for the whole lesson: quantity → color, fixed at
   first appearance, never redesigned (barrel is red from fig 6 to fig 93). This is
   the color-vocabulary namespace prose will bind to.
2. **Build each Stepper** (see AGENTS.md for the honesty rules: fixed timestep, stated
   stability condition, `create` = fresh state, pure `draw`). One knob; sliders default
   to time-speed; failure regimes reachable on purpose — the reader finds the boundary
   by crossing it.
3. **Block the prose** as setup → figure → readout: the sentence above names the knob
   and what to try; the sentence below reads out what you should have seen ("Notice
   that…"). No captions — the prose does that work.
4. Rough in the math per the protocol: figure → words → symbols → check. Don't polish
   phrasing yet.
5. Ship blocked sections behind `status: draft` as they land — the pipeline stays green
   the whole time (`bun run typecheck && bun run build`).

## Stage 4 — FINAL DRAFT

**Output: full prose at final quality. Gate: the voice audit passes.**

Now — and only now — the voice pass. Rules from the corpus (Essence §2):

- **Pronoun regime**: *we* builds, *you* touches (permissive "you can drag," never
  imperatives), *I* only to confess a staging decision. Present tense throughout.
- **Jargon protocol**: phenomenon first, name second ("…is known as"), amnesty stated
  once up front, etymology as an occasional reward.
- **Plot devices**: "Unfortunately," for the naive failure; "Thankfully," for the
  rescue; "However" for the twist. Emotion in discourse markers, not adjectives.
- **One load-bearing metaphor per section**, audited ("an imperfect, but convenient
  analogy"). Analogies must be simpler *physical* systems, ideally with their own
  figure.
- **Numbers as dessert**: concrete, astonishing, deployed only after intuition.
- **Calibrated hedges** on approximate claims only; flat declaratives on hard ones.
- **Confess every distortion** at the moment it appears ("I'm making it much larger so
  you can see it"; "very much not to scale").
- **Sentence music**: ~22-word average, long build → short verdict. Zero rhetorical
  questions. Exclamation budget: ≤2 per post, spent on counterintuitive truth only.
- **Boundary-value check after every formula.**
- Close every simplification loop; pay every planted debt; end sections on forward
  hooks, not summaries.

## Stage 5 — POLISHED POST

**Output: published lesson. Gate: the audits below, then `status: published`.**

- **Rhythm audit** (mechanical, scriptable): words-per-figure in band; no >3-paragraph
  droughts; knob count ≤1 except flagged finales; adjacency (figure-figure without
  prose) ≈ never. The band and any plan-stage figure count are *diagnostics, not
  quotas*: scale and density are judged per article by what the lesson and the story
  need. Never add or cut a figure to hit a number — a figure is added because a
  moment needs one; a short article that lands is finished at its own length.
- **Palette audit**: same quantity = same color in every figure and every prose span;
  no orphan colors.
- **Ledger audit**: every "we'll get back to this" has its "Recall that…"; the hero
  figure returns understood.
- **Reader-respect furniture**: global pause, restart buttons, touch-friendly drags,
  reasonable mobile cost. (No static-fallback sentences — the figures *are* the
  argument; a prose understudy per figure defeats the point. Decided 2026-07.)
- **Endings ritual**: Further Reading with 2–3 sentences of specific, earned praise per
  source → Final Words: an "I find it…" sentence + a re-enchantment benediction
  ("perhaps the next time you…"). Ours additionally lands the equation one last time —
  understanding increases wonder, *and now you can compute with it*.
- **The anti-checklist** — none of these may appear: numbered figure references,
  captions, rhetorical questions, "obviously/simply/clearly," pop culture in body
  prose, inline citations, motivational filler, apologies for difficulty, unresolved
  plants, an equation whose symbols weren't first seen on canvas, and **promissory
  templates** — "by the end of this article you will know/have…", "in this article
  we'll build, piece by piece…", "you'll know exactly what X is": sentences that
  narrate the reading experience instead of the thing (play-test finding, 2026-07).
  Debts are planted as flat declaratives that carry the content of the promise, not
  its schedule ("that single number is the oldest debt in this article; it gets
  paid, but not soon").

---

## Production notes

- **Figures are the cost driver** (his moat: ~1 post/year at 80–120 bespoke figures).
  Our bets against that cost: the shared `<Sim>` framework, reuse-with-overlay
  sequencing, Canvas-2D by default with WebGL only where irreducible, and building
  figure families (one Stepper, several overlay configurations).
- **Stage order is load-bearing.** Voice-polishing a section whose skeleton will
  change is wasted work; building figures for a section with no failure driving it is
  worse — it locks in inventory. When in doubt, go back a stage; it's cheaper.
- Stage gates are review points to run `/design_review`-style passes with the docs
  open: skeleton against Essence §4/§6, draft against Essence §2, polish against the
  audits.
