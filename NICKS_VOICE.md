# NICKS_VOICE.md — the other pole

`ESSENCE_OF_VOICE_AND_DESIGN.md` measures one pole of this site's register: Ciechanowski,
de-slopped, declarative, zero question marks. This document measures the other pole —
**Nick's actual voice** — and then defines the blend the articles are written in:
*somewhere between the two, on purpose, per moment.*

Provenance, two registers:
1. **Steering voice** — ~7,200 typed prompts extracted from Claude Code and Codex
   session logs on this machine (Aug 2025 → Jul 2026), math-thread-filtered, with
   pasted LLM output stripped so only Nick's own keystrokes remain. Core veins: the
   **world tubes / world foam / gauge cameras** threads (`dynaworld`, Apr–May 2026),
   the **wave_sim** breaking-wave threads (May–Jun 2026), and this repo's own editing
   sessions. Saturated: more of this register would not change the guide.
2. **Composed voice** — the three blog drafts in `~/git/blog` (~2,250 words). Thin,
   and **partially disavowed**: Nick's verdict on the old blog voice (2026-07-06) is
   "kinda sucks, I'm tired of that." So §4 treats the drafts as *evidence of devices*,
   never as a target register — a device survives into the blend only if it's
   corroborated by the steering corpus or by his editing behavior in this repo.
   ChatGPT threads are expected as a further composed-voice source; fold them in
   when they arrive and re-weigh §4 against them.
3. **ChatGPT world-tubes distillation** — a voice doc ChatGPT generated from one long
   math conversation (DynaWorld / splats / gauges / 4D representations), supplied
   2026-07-06; archived verbatim at `research/voice/chatgpt_worldtubes_voice.md`.
   Its quotes are as-recalled by ChatGPT, not verified against a transcript — but its
   patterns independently replicate this doc's fingerprint from a thread the corpus
   never saw (the "wait" pivot, tbh-hedging, the audit demand, the naming instinct),
   which raises confidence in both. It also surfaced two moves the steering corpus
   under-showed: the relabeling challenge (§2.13) and forbid-something (axiom 7).

Quotes below are verbatim, typos and all — the typos are data (they prove momentum),
not target. Claims are measured or quoted, not remembered.

---

## 1. The fingerprint (measured)

- **Median message: 23 words** (mean 36, p90 = 77). Ciechanowski's *sentence* averages
  22 words; Nick's whole *message* is that size and usually carries a question.
- **59% of messages contain a question. 20% contain three or more** (the ladder).
  145 question marks per 100 messages. Ciechanowski: zero in 36,000 words.
  This is the central tension the blend has to resolve (§6).
- **"okay" opens 15.3% of all messages** — the gear-shift. "wait" opens 3.7% (the
  brake). "And"/"Also" open 8.1% (the afterburner — thought continuing across
  messages).
- **"can we" appears in 12.7%** of messages, "do we / did we" in 16.6%, "what is/are"
  in 8.5%. The dominant grammatical mood is *first-person-plural interrogative*: the
  work is a shared expedition being steered by questions.
- **"we want / I want": 6.6%.** Desire is stated flatly, never couched. "We want the
  damn 3d water VIS."
- **"seems / looks like / i just see": 6.2%** — evidence precedes the ask.
- Texture markers: "tbh" 3.4%, "or something" 2.2%, "idk" 1.0%, "imo", "lol".
- **"I wonder": 0.06%.** Nick almost never announces wonder — he *enacts* it as
  questions. (Ciechanowski does the mirror opposite: never asks, always declares
  "It may be a little puzzling why…". Same wonder, opposite syntax.)

**The lexicon** (consistent across all three sources). Praise-words: *clean, lean,
elegant, simple, dense, gem, emergent, transcendent, first-principles, load-bearing,
rigorous.* Damn-words: *slop, squishy, degenerate, decorative, bespoke, patchwork,
bandaid, vibes, old-ideas-with-fancy-names.* The praise attaches to mechanisms and
math; the damns attach to evasions of them. (Note the asymmetry with §3.4: hype
words like *amazing/epic* attach only to goals, never to means.)

---

## 2. The moves — a leading-question grammar

Nick's prompting has a small set of recurring moves. Each is named here, quoted, and
stated as a reusable principle. (§8 turns these into advice for prompting LLMs; §6
decides which ones are allowed into print.)

**2.1 The status sweep.** A burst covering past / present / future, used to resync
shared state before steering:

> "Where are we at? What is done? what is planned? and what is next? What is commited?"
> "Okay, whats left? What next? Is it all implimented and working? We have fast fully
> corect metal shaders? And do we have a new wandb run?"

**2.2 The ladder.** One message, three to seven small questions, each answerable,
together encoding his current model of the system — the ladder *is* a response schema:

> "now what are the main mathmemtical aspects of pwoerfoam, go back and read the paper,
> Cells? voronoi? Spherical reflection? how do they manage color and orientaiton and
> movement? What are all free params and core equations?"

**2.3 The fork.** The signature leading question: supply candidate answers and demand
adjudication. The menu can be refused but not ignored — it forces commitment and
carries his mental model across even when a guess is wrong:

> "okay so in theory its sublinear? But in pratice not? or what? And STAR UVT is? But
> not worldfoam?"
> "is it grid or paticle math? are we gonna need new math? or is this just an
> implimentation detail?"
> "Is that like aerrated water? do we have water/foam particle mixes? and how dow e
> render that? do we rende rit as pure white blocks? or do we have transcluent water
> / spray?"

**2.4 Observation → hypothesis → differential.** State the observable first, venture a
mechanism with soft markers (*maybe, like, I think probably, or something*), then ask
for confirmation or refutation. Evidence, then guess, then question — never vibes:

> "It doesn't really line up, maybe we got something wrong, like grads or bakrpop, i
> just see a bunch of random colors, compare to the gsplatfit baseline"
> "I'm thinking about this now and I think probably what happened is when we moved to
> feature splatting we did 10x the number of free parameters responsible for color…
> my guess is basically we need to adjust the learning rate."

**2.5 The physics oracle.** The sim is tested against embodied reality — waves he has
actually watched — not against the code. The mechanism must justify itself physically:

> "why is foam breakers breaking in deep water before it hits the shoals?"
> "Does it have gravity? Beause the gravity needs to happen to drop the water to make
> it barrel"
> "only the thinest pats where there is the most wind shear … start to show foam and
> spray as it begins to crest not the whole back … which should be correctly shleted"

**2.6 The audit send-back.** Summaries are not accepted; the model is sent back to the
source, and critique is explicitly de-niced:

> "audit the paer and all the math and free params, did we miss anything or full
> powerfoam reproduction?"
> "We saved some new notes from the scientist, are they genuinely interesting? Dont go
> ease on them"
> "Be cynical ot see if oomp and auto research is actually helping?"

**2.7 The naming.** Coin a term, then interrogate the named thing as if it already
exists — the name summons the object: *world tubes, world foam, feature foam, gauge
cameras, DENSE CORE, spit* (the air a barrel compresses and fires out the end).

> "Did we ever write feature foam code? Where the foam is rastering features? or was
> that just theory in docs?"
> "Gauge Cameras and World Tubes for sub linear frame scaling of Dynamic Gaussian splats"

**2.8 The role cast.** Assign the model an identity and a rank, and calibrate handoffs
to the *reader's* competence, stated without embarrassment:

> "We just hired you as a new chief scientist, this repo has been done by a ton of
> amateurs, can you dive in and cook hard"
> "You are the smarter chief scientsit and you kjust assign them implimentation tasks tbh"
> "Keep in mind that the agent we're using could be a dumb engineer who is not very
> smart at math, and we want to make sure to be very over specified and super clear"

**2.9 Honest deference.** Direction is owned; formalization is delegated; gaps are
confessed to get translation instead of jargon:

> "tbh I'm not as strong in the math as you so can you help me explain this all,
> please and thank you"
> "I think I undersspceified a bit and you can make it more formal mahetmically."

**2.10 The momentum liturgy.** Verb chains as ritual, sometimes sent five times in a
row, verbatim: *"continue, measure, iterate, test, audit, improve."* Also: "keep
cooking", "let it cook", "work all night", "straight line".

**2.11 Lane splitting.** Divergent asks are pre-structured into numbered lanes with
different risk profiles:

> "#1 and #2 should reference a narrow approach using the papaers … #3 and #4 should
> be a synthesis blending the best of our ideas … #5 and #6 should be a set of new
> frontier ideas, taking existing math, super seeding it with new better math"

The branch always ends in a kill — wide, then one: "Come up with 20 new ideas…
critique them all… toss them out and surface a GEM." Never "combine everything":
the output of divergence is a choice (implement / defer / kill), not a merger.

**2.12 The blunt verdict.** Displeasure is direct, specific, and playful — never
hedged, never cruel:

> "This is honestly such a weak intro … Do better"
> "that is the worst descripiton, try again human readable"
> "2d ... wtf... we want 3d physics... How did that happen"
> "lol grew lines again.... What is going on"

**2.13 The relabeling challenge.** The defense against notation inflation: whenever a
new term appears, ask whether it's an old object in a costume — and tolerate the new
name only if it *forbids* something the old one allowed (from the world-tubes thread,
see provenance):

> "Splat-like projected discs sounds like surfels tbh."
> "We're not just hiding simple old ideas behind fancy new names are we?"
> "What is a 'material sample' actually? Is it just a Lagrangian point / old particle
> with a fancy name? If yes, say that. Then tell me what degree of freedom it removes."

This is the naming move (2.7) run in reverse: 2.7 coins names to summon objects;
2.13 strips names to expose their absence.

---

## 3. The taste axioms

Underneath the moves is a consistent aesthetic. These are the beliefs the voice keeps
returning to; they should govern editorial decisions even when no sentence quotes them.

1. **Dense core, no patchwork quilt.** "iterating to a CORE key systems and math and
   physics core, like dieally the less equations the better and we just need to polish
   and press and condense and make the core key physics work perfectly … rather than
   adding on little patches of fxies to just make a big patchwork quilt."
2. **Emergent over bespoke.** "The wave pheoneoma should be emergent, never make these
   mistakes again." "yea remove any hard coded stuff and only do emergent physics."
   The barrel must fall out of the equations, not be drawn.
3. **Straight line to the ambitious artifact.** "I don't love iterating and doing baby
   versions first because some times they get in the way of doing things the clean,
   simple, and perfect mathematical ways." "we build bullshit simpler versions of
   those. Instead of a straight line to the amibitous final artifact."
4. **Maximal ambition, minimal mechanism.** "the world's most realistic wave
   simulation" and "the less equations the better" in the same breath. The hype
   vocabulary (*amazing, epic, transcendent, brilliant*) attaches to *goals*; the
   mechanism vocabulary (*lean, clean, simple, dense, naive baseline*) attaches to
   *means*. Never swapped.
5. **Measure AND transcend.** "we run bencar to find acutal bottlenecks instead of
   relying on assunmptions" — but also "try transcendaatn reorgs of the entire algo to
   have a new approach wher eth old issues are not evne ther insead of anchoring in a
   bad frmae." Benchmarks for honesty, reframes for progress; neither substitutes for
   the other. And evidence updates theory without ceremony: "Given these results,
   update the theory. Don't defend the old answer. What did we actually prove? What
   should we kill or demote?"
6. **Principles recovered, not rules copied.** "We don't mechanistically copy the
   previous author's style. We study his style we recover the philosphy behind his
   decision making, and we work forward from our own intuitition and taste."
7. **An abstraction must forbid something.** "If the abstraction can express splats,
   NeRF, volumes, meshes, and ray caches, then it is not yet a representation." A new
   concept earns its name only when it rules out specific cheats; otherwise it's
   notation. Article corollary: an explanation that would explain any outcome explains
   nothing — every concept we name should make some visible behavior *impossible*,
   and ideally the figure shows the impossibility.
8. **First principles before literature.** "To start, don't anchor yourself in the
   literature. Come up with first-principles ideas yourself." Then align with papers
   afterward. Anti-anchoring, not anti-reading — the sequence is the point.

---

## 4. The composed register — what survives when Nick writes for readers

The blog drafts (`~/git/blog`, ~2,250 words) are the one direct sample of Nick
composing prose — and Nick is tired of that voice (see provenance). Read this section
as an *autopsy for parts*, not a model: each device below is kept only because it's
corroborated outside the blog. The blog's overall register — the irreverent, profane,
self-deprecating riff — is explicitly **not** the target and transfers nothing
directly.

**Validated in print:**

- **The fork survives, self-adjudicated.** From the *Interesting to AI* draft: "So is
  this interesting to AI? And did we actually write it? Turns out, sort of." Ask,
  then immediately call it — exactly the §6 blend rule, already native to his prose.
- **The "wait" pivot survives.** "Well, actually wait a second—what if we just ask
  the AI again?" The mid-essay brake-and-turn is a structural device, not a typing
  artifact.
- **Blunt verdicts survive, lowercase.** "Still a little esoteric for my taste, but
  kind of interesting." "The thoughts are pretty raw and hard to interpret."
- **Live-experiment structure.** The essay *is* a demonstration: do the thing,
  show the screenshot, react honestly, iterate. Failure shown before success. This is
  the blog-native form of this repo's figure-first pedagogy.

**New devices (missing from the steering corpus):**

- **Mathematical image-making.** His best composed writing coins vivid images for
  abstract objects: "RL models are like a high-dimensional cone focused toward a
  single (maybe right) solution. Base models are like a spider web connecting many
  solutions, all floating in a log-probability soup." Note these are *not*
  Ciechanowski-style household-object analogies — they're images native to the math
  itself (cones, webs, soups of probability). That's a distinct register, and it's
  gold for physics writing. *Corroborated:* the steering corpus names things the same
  way (world tubes, world foam, spit) — the metaphor instinct is his, not the blog's.
- **Aphorism-coining.** Compressed, quotable verdict-lines, deployed at payoffs:
  "Learning to ask questions that you yourself could never answer becomes the new
  superpower." "What use is a superhuman without superhuman questions?"
  "Unidirectional is anti-CoT." "Adjust you priors."
- **Escalate-then-deflate irony.** Inflate a conclusion to absurdity, then pop it:
  "…we just need to write something that is... A novel enduring philosophical puzzle
  to rival ideas as old and profound as the books of history itself." — followed by
  the deflating pivot. Always at pomposity's expense, never the reader's.
  *Caution: this is the most blog-flavored device — the one register Nick is tired
  of lives right next to it. On probation in the blend (§6.9); use at half strength
  and let his in-situ reactions decide whether it stays.*
- **The anti-slop reflex, self-applied.** His own slide notes label their summary
  section "Key Takeaways(Boring AI Summary)". He flags genericness even in his own
  drafts — the §5 blacklist is a personality trait, not an editing pass.
- **His stated question-methodology.** The *Interesting to AI* draft states §8's
  thesis in his own words: "The only trick I've found to asking superhuman questions
  is to consume lots of mathematics and research and look for combinations of ideas
  that are **compatible** but have not been used together yet." (World tubes, gauge
  cameras, and lesson 02's bundles-for-waves are all this trick, executed.)

---

## 5. The slop blacklist (his own flags, verbatim)

Lines from this repo's drafts that Nick flagged as "llm slp", with his diagnosis:

- ✗ "In this article we'll build, piece by piece, the equation that governs it"
- ✗ "By the end of this article you will know why the bottom one is the more honest of the two."
- ✗ "by the end of this article you'll know exactly what that property is, and you'll
  have assembled every term of the equation running this simulation:"

His diagnosis: "It literal just says 'in this article well do X' … basically just
restating the meta rules themselves while being the most boring generic instatition of
them it can be." And: "Weird cadence and generic placeholders."

**The rule extracted: never announce what the article will do — do it.** IOUs live in
figures and planted debts (the ESSENCE mechanism), never in promissory sales copy. If
a sentence's only content is a promise about a later sentence, cut it.

The full taxonomy — 15 slop families, the four detection tests, and the real
before/after pairs from this repo's de-slop commits — lives in **`SLOP.md`**.

---

## 6. The blend — the register the articles are written in

The operating formula: **Ciechanowski's discipline, Nick's blood.** The ESSENCE rules
for structure (figure rhythm, one knob, colored vocabulary, failure-first, planted
debts, jargon-last) stay fully in force. What changes is the *temperature* of the
prose. The central conflict — his zero question marks vs. Nick's 59% — resolves like
this:

**A question may appear in print only if it is a genuine fork the article immediately
adjudicates.** Nick's move 2.3, promoted to pedagogy: name two or three live candidate
mechanisms, then stage the fight and call the winner within the section. Decorative
wonder stays declarative (his pole); load-bearing forks may interrogate (Nick's pole).
Never "But what does this really mean?" — that's a question wearing slop's clothes.

### Transfers from Nick into print

1. **Fork questions as section hinges** — sparingly, always answered, candidates always
   physical. ("So which term lets go first when the wave steepens? Two candidates have
   a claim…")
2. **Blunter verdicts at failures.** Where Ciechanowski writes "The results are
   completely janky," the blend is allowed one notch hotter: "This is just wrong — the
   water flows *through* the cylinder and never pushes back." Verdicts stay grounded
   in the visible observation, never in adjectives.
3. **The physics oracle as evidence.** Appeals to watched reality are admissible and
   encouraged: what foam actually does on a real wave face, where spray actually
   starts, what wind sheltering actually looks like. This is the site's native
   authority — it comes from the beach, not the textbook.
4. **Naming as a first-class act.** Coin honest names for recurring objects and then
   treat them as characters (the repo already lives this: DENSE CORE, world tubes,
   spit). A good name is a compression win; introduce it Ciechanowski-style
   (phenomenon first, name second) but don't be shy about coining where the literature
   has no word.
5. **Momentum in the cadence.** Pull the median sentence *below* Ciechanowski's 22
   words. Allow a short fragment at a verdict or a reveal — one per section at most.
   The long comma-chained legato is his; ours is allowed a heartbeat.
6. **Stated desire.** The article may *want* things: "We want the whole wave — lip,
   barrel, spray — out of one equation." Ciechanowski invites; Nick wants; the blend
   wants out loud, then earns it.
7. **Math-native images** (§4). Alongside ESSENCE's household anchors, the blend may
   coin images native to the mathematics itself — the spider-web/log-probability-soup
   register — provided each one is audited afterward the Ciechanowski way ("An
   imperfect, but convenient analogy…"). Household analogy for phenomena; math-native
   image for abstractions.
8. **One aphorism per article, max.** A coined, quotable compression, spent at a
   payoff moment the way Ciechanowski spends an exclamation mark — earned, never
   opening. ("Learning to ask questions that you yourself could never answer becomes
   the new superpower.")
9. **Escalate-then-deflate** is admissible as the humor device — inflate the naive
   conclusion to absurdity, pop it with the physics. At pomposity's expense, never
   the reader's; 1–2 per article, like his deadpan. **On probation**: it borders the
   disavowed old-blog register (§4 caution). Deploy sparingly and keep only if Nick's
   reactions to drafts endorse it.

### Stays at the Ciechanowski pole (do NOT import from the transcripts)

- Mechanics normalized: no typos, no "tbh / idk / imo / lol", no "okay so" opening a
  section, no ALL-CAPS emphasis in prose. Profanity doesn't print — but the *deflation
  energy* of "fuck it, let's just ask" does (as the escalate-then-deflate device).
- Hype adjectives (*amazing, epic, transcendent, brilliant, beautiful*) don't print.
  Ambition shows in what the article *attempts* and in awe-numbers-as-dessert, not in
  adjectives. (Exception preserved from ESSENCE: beauty-talk is allowed in a Final
  Words-style coda, where Ciechanowski himself goes lyrical.)
- The reader is never the dumb engineer. Role-casting and competence-calibration are
  prompting moves (§2.8); in print, reader competence is axiomatic — never "you might
  be confused."
- The reader is never blamed, rushed, or sold to. All ESSENCE "never do" items (§2 of
  that doc) stand.

### Banned at both poles

Promissory templates, generic placeholders, meta-narration, motivational filler,
unresolved plants. Slop is not a midpoint between the two voices; it's off the axis
entirely.

---

## 7. Calibration triptychs

Same moment, three registers. The third column is the target.

**Introducing the mystery slider:**
- *Slop:* "In this article, we'll explore the fascinating world of viscosity and
  discover how a single parameter can dramatically change flow behavior."
- *Nick raw:* "okay so what is that slider actually doing? is it viscosity? or like a
  diffusion number or something? and why does the wake go all wobbly at the low end tbh"
- **Print:** "The slider changes one number, and we're not saying which. Drag it left
  and the tidy pair of eddies behind the cylinder unravels into a street of them that
  never settles. Nothing new was added — the same equation, with one term starved."

**Calling a failure:**
- *Slop:* "Unfortunately, our naive approach has some limitations that we'll need to
  address in the following sections."
- *Nick raw:* "It doesn't really line up, maybe we got something wrong, like grads or
  bakrpop, i just see a bunch of random colors"
- **Print:** "The result is garbage. Dye pours *through* the cylinder as if it weren't
  there, because our made-up pressure field never pushes back. That's the missing
  ingredient, and it's worth catching in the act."

**A section hinge:**
- *Slop:* "Now that we understand pressure, let's dive into what happens when the wave
  begins to break!"
- *Nick raw:* "so is it the pressure that holds the wave up? or the water under it? or
  what? and when does it let go"
- **Print:** "So what lets go first when the wave steepens — the pressure holding the
  face up, or the water feeding it from below? Both have a claim, and the next figure
  stages the fight."

**A wanting sentence (no slop equivalent exists — slop can't want):**
- *Nick raw:* "We want the damn 3d water VIS … that get that barreling with emergent
  physics … no hard coded conditions"
- **Print:** "We want the whole wave — the steepening, the pitch, the barrel, the
  spray — to fall out of the equations with nothing hard-coded. That is the standard
  this article holds itself to."

---

## 8. Appendix — leading questions as an operating manual

What makes Nick's prompting work. One line per rule — each is demonstrated with
quotes in §2, so this is the checklist, not the argument:

1. **Ladder small** — many answerable questions beat one vague one; the ladder is a
   response schema (§2.2).
2. **Fork with candidates** — wrong guesses are cheap; a menu forces adjudication, an
   open question invites a survey (§2.3).
3. **Observable before ask** — report what you saw, then ask what it means (§2.4).
4. **Hypothesize with soft markers** — "maybe … or something" invites correction
   without anchoring (§2.4).
5. **Send it back to the source** — re-grounding beats memory (§2.6).
6. **Challenge the labels** — "isn't this just surfels?"; every new name owes you a
   forbidden degree of freedom (§2.13).
7. **Sweep status to resync** — past / present / next in one burst (§2.1).
8. **Cast the role, set the rank** — and calibrate the handoff to its executor (§2.8).
9. **Confess your gaps** — buys translation instead of jargon, at zero cost (§2.9).
10. **End in a verdict** — implement, defer, or kill; never "combine everything"
    (§2.6, §2.11, §2.12).

**The five templates** — usable verbatim as prompt skeletons (distilled from the
world-tubes thread; lightly normalized):

- *Explore:* "Start from first principles — don't anchor in the literature yet. Give
  me the cleanest mathematical objects, branch wide, critique them all, kill the weak
  ones. I want the gem, not a list."
- *Challenge:* "Wait — isn't this just [old thing]? What degrees of freedom did we
  actually remove? What does this forbid? What changes in the code?"
- *Hand off:* "What do we pass to the engineer? One primitive to implement, one
  diagnostic to add, one baseline to keep, one idea to defer, one thing to kill. No
  manifesto."
- *Go deeper:* "Don't give me the common stuff. Find the simplest elegant object
  mathematics has here — then tie it back to [the implementation]."
- *Update on evidence:* "Given these results, update the theory. Don't defend the old
  answer. What did we actually prove? What gets killed or demoted?"

---

*Companions: `ESSENCE_OF_VOICE_AND_DESIGN.md` (the other pole, and all structural
law), `METHODOLOGY.md` (the production process), `AGENTS.md` (reading order). When
this guide and ESSENCE disagree about prose temperature, this guide wins; when they
disagree about structure, ESSENCE wins.*
