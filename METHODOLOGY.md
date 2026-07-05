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

Now — and only now — the voice pass. Three source documents govern it:
`ESSENCE_OF_VOICE_AND_DESIGN.md` for the *philosophy of the moves*,
`NICKS_VOICE.md` for the *prose temperature* (the blend rule lives in AGENTS.md:
structure → ESSENCE wins, temperature → NICKS_VOICE wins), and `SLOP.md` as the
detector to read the result against — 15 families, four tests; judge with the
tests, never grep for the families.

**The pastiche guard, first.** The Essence doc is a measurement of one author's
converged fingerprint. A phrasing is a *signature* when one author converges on it
over a decade, and *pastiche* when we copy it on day one. So every rule below names
a MOVE; the quoted phrases beside it are his rendering of the move, cited as
evidence — never as required wording. If a specific phrase from the Essence doc
appears in our article more than about twice, that's compliance-by-grep, not voice
(measured failure: an early draft used "…is known as" 10× in 4,900 words; his rate
is ~2 per post). Find our own words for the move every time.

The moves:

- **Pronoun regime**: *we* builds, *you* touches (permissive, never imperative),
  *I* only to confess a staging decision. Present tense for the physics.
- **Phenomenon first, name second**: the reader meets the thing before its label;
  amnesty stated once up front; etymology as an occasional reward. ("…is known as"
  is *one* rendering — vary it or just let the name arrive.)
- **Emotion lives in discourse structure, not adjectives**: the naive failure gets
  its own turn, the rescue its own beat, the twist its own hinge. (His hinge words —
  "Unfortunately," "Thankfully," "However" — are fingerprint, not requirement.)
- **One load-bearing metaphor per section**, used hard, then audited for its limits.
  Analogies are simpler *physical* systems, ideally with their own figure.
- **Numbers as dessert**: concrete, astonishing, deployed only after intuition.
- **Calibrated hedges** on approximate claims only; flat declaratives on hard ones.
- **Confess every distortion** at the moment it appears.
- **Long build → short verdict** as the default cadence; no drama fragments; zero
  rhetorical questions; exclamations spent only on counterintuitive truth. (His
  ~22-word average is *his* music — ours comes from NICKS_VOICE.)
- **Boundary-value check after every formula.**
- Close every simplification loop; pay every planted debt; end sections on forward
  hooks, not summaries.

**Humor and warmth cannot be scheduled.** The corpus stat ("deadpan 2–3× per post")
describes what taste produced, not a quota to fill. A joke goes in because it
arrived while writing; if none arrived, the article ships drier and that's fine.

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
- **Endings**: Further Reading gives each source 2–3 sentences of specific, earned
  praise. Final Words has three *jobs*, not a template: land the earned thing one
  last time, re-enchant (understanding increases wonder), and send the reader back
  to the world. The renderings are free and MUST differ per article — "I find it…"
  and "the next time you…" are Ciechanowski's phrasings, and our first two drafts
  both reused them beat-for-beat (measured 2026-07: near-identical ending skeletons).
  Write each ending from the article's own material; if it could be swapped onto a
  sibling article by changing the nouns, it isn't an ending yet.
- **Sibling audit** (new, from the same finding): with every prior article open,
  compare this article's hook move, section-transition habits, waypoint phrasing,
  Predict framing, and Final Words against its siblings. The *pedagogy grammar* may
  repeat (failure chain, ring, waypoints — that's the method); the *surface
  language* may not. Any sentence skeleton that appears in two articles gets
  rewritten in one of them.
- **The anti-checklist** — none of these may appear: numbered figure references,
  captions, rhetorical questions, "obviously/simply/clearly," pop culture in body
  prose, inline citations, motivational filler, apologies for difficulty, unresolved
  plants, an equation whose symbols weren't first seen on canvas, and **promissory
  templates** — "by the end of this article you will know/have…", "in this article
  we'll build, piece by piece…", "you'll know exactly what X is": sentences that
  narrate the reading experience instead of the thing (play-test finding, 2026-07).
  Debts are planted as flat declaratives that carry the content of the promise, not
  its schedule ("that single number is the oldest debt in this article; it gets
  paid, but not soon"). This anti-checklist is the corpus-measured subset; the full
  15-family slop taxonomy with its detection tests lives in `SLOP.md`.

**On audits themselves**: an audit may return zero findings — "this is fine" is a
legitimate, complete result. Finding-counts are not a quality metric, and "all
findings applied" is not a virtue: mechanically accepting every critic note sands
prose to the safe middle, which is slop's other face. Each finding is a proposal;
the author (thread) judges it against the article's own voice and may decline with
a reason.

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
