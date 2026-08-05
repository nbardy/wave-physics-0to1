# CRITIQUE — six p-bit outlines, one rubric

Six candidates on the table: ChatGPT's V1 ("Noisy Coins → Probabilistic
Computer"), V2 ("Stochastic Program Becomes Physics"), V3 ("Build a p-bit
Computer in the Browser"), and ours A ("A Computer Made of Noise"),
B ("Compiling Into Heat"), C ("The Wrongness Meter") from `OUTLINES.md`.

The rough correspondence: their V1 ≈ our A (bottom-up physics), their V2 ≈
our B (compiler story), their V3 has no counterpart of ours (project/lab
notebook), and our C has no counterpart of theirs (correctness-first). Those
two orphans are where the real differences live — see arguments 1 and 2.

## The rubric

Ten categories, 10 points each. Scored against what the outline *commits to
on paper*, not what a good writer could salvage from it.

1. **Hook / wonder gap** — is there a staged gap between daily familiarity
   and hidden mechanism, or just a starting topic?
2. **Narrative spine** — persistent protagonist, failure-driven sections,
   a ring that closes. Inventory chapters score low.
3. **Layer discipline** — does the piece keep math / algorithm / substrate
   visibly distinct? (This is ChatGPT's own diagnosis of the confusion, and
   it's correct.)
4. **Figure quality** — do figures show the contrast their prose claims,
   one knob, live counterfactuals? Diagrams-that-assert score low.
5. **Math earning** — interactive → words → symbols → check, equations
   arriving after the reader has been the solver. Stated-then-illustrated
   scores low.
6. **Correctness infrastructure** — exact oracle, wrongness metric, named
   schedule, determinism. The subject is sampling; an article that can't
   catch its own sampler lying is undermined.
7. **Extropic-story coverage** — chip constraint, capability boundary,
   Torx/Thermalizers, embedding tax. Does the reader leave able to state
   the actual bet?
8. **Finale payoff** — does the diffusion loop integrate the whole spine,
   and does the hero return understood?
9. **Buildability here** — fit to this repo's kit (Sim/Stepper, gpu/ lib,
   check harness), risk concentration, figure reuse economics.
10. **Voice / slop exposure** — promissory templates, quiz energy,
    captions, design-rationale-in-prose, meta-narration of the reading
    experience.

## Scores

| | Hook | Spine | Layers | Figures | Math | Correct | Coverage | Finale | Build | Voice | **Total** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **GPT V1** (coins→computer) | 6 | 4 | 9 | 6 | 6 | 4 | 7 | 6 | 6 | 4 | **58** |
| **GPT V2** (program→physics) | 5 | 6 | 9 | 5 | 6 | 5 | 9 | 6 | 5 | 5 | **61** |
| **GPT V3** (build-in-browser) | 6 | 5 | 7 | 8 | 6 | 7 | 6 | 7 | 7 | 5 | **64** |
| **Ours A** (noise computer) | 8 | 9 | 6 | 8 | 9 | 8 | 6 | 9 | 8 | 8 | **79** |
| **Ours B** (compile to heat) | 8 | 8 | 8 | 7 | 8 | 7 | 10 | 8 | 5 | 8 | **77** |
| **Ours C** (wrongness meter) | 7 | 8 | 7 | 8 | 8 | 10 | 5 | 8 | 9 | 7 | **77** |

Notable cells, briefly defended:

- **GPT layer discipline 9/9 (V1/V2):** the MATH → ALGORITHM → MACHINE
  persistent rail is the single best idea in their document and none of our
  three has it explicitly. Our B comes closest (8) because the stack *is*
  its subject; A scores 6 because its layers are implicit in the failure
  chain and a confused reader could still conflate Boltzmann-the-law with
  Gibbs-the-algorithm.
- **GPT V1 spine 4:** eleven chapters, each "teaches X" — that is
  METHODOLOGY's definition of inventory. No section is driven into by the
  visible failure of the previous one; nothing forces chapter 5 to exist
  from inside chapter 4.
- **GPT V2 coverage 9 vs our B 10:** both own the compile story; B adds
  the embedding tax (place-and-route, chains, physical-per-logical counter)
  which V2 only brushes; V2 adds nothing B lacks.
- **GPT V3 figures 8:** their strongest figure imagination — the
  StateGraphViewer (states as nodes, one-bit flips as edges, the chain as
  a glowing dot walking the graph) is a genuinely first-rate teaching
  object that none of our outlines specified. The state-gallery
  enumeration and the performance dashboard are also good.
- **GPT correctness 4/5/7:** V1 has an exact table in one chapter; V3 has
  an enumeration section and a "synchronous wrong mode" toggle in a
  dashboard. But in all three, correctness is a *station*, not a spine —
  the reader passes through it. Our C is built on it (10); A carries the
  exact-ghost + TV from its marquee failure onward (8).
- **GPT voice 4/5/5:** scored on the outline's own register, which is what
  the article would inherit: "This will be a killer visual," "That would
  be amazing," "This is a very important pedagogical move," "This final
  section is very exciting" — enthusiasm-as-caption, the exact
  meta-narration our anti-checklist bans; plus their V3 is structurally
  design-rationale-in-prose (the article narrates its own construction),
  which house doctrine forbids outright.
- **Our B build 5:** honest self-score — the in-browser compile trainer
  and the place-and-route figure are two bespoke high-risk builds with no
  sibling in the repo, and §3 compresses a full article's material.
- **Our C coverage 5:** a reader who came for "explain Extropic" gets an
  epistemology article. Deliberate, but it's a real cost and it's scored
  as one.

---

## Arguments — what's good, what extracts cleanly, what needs connective tissue

**1. The two orphans define the trade.** Their set contains a variant ours
doesn't: the project-based lab notebook (V3). Ours contains one theirs
doesn't: correctness-as-protagonist (C). These are not random gaps — they
follow from different priors. ChatGPT's prior is "the medium is a coding
walkthrough" (Distill/Observable); the house prior is "the figure is the
argument and the build story stays out of the prose." V3 as written cannot
ship here — an article whose sections are "render one bit, now render many,
now add couplings" is the build log of its own figures, which is exactly
the design-rationale-in-prose failure. But V3's *energy* — reader-operated
instruments, dashboards, incremental capability — survives fine when
recast as figures inside a story-driven skeleton; that's what A already
is. Meanwhile their missing variant is diagnostic the other way: nowhere
in their document does anyone ask *how the reader would know the sampler
is lying*. The wrong-mode toggle exists (V3 §6) but as a dashboard
curiosity. The single most valuable instinct in this field — optimization
success ≠ sampling correctness — appears in their text as a sentence,
never as a staged scene.

**2. Their best idea costs us one afternoon: the layer rail.** The
persistent MATH → ALGORITHM → MACHINE header is a direct answer to the
confusion that seeded this whole project ("Is Boltzmann the algorithm? Is
block Gibbs the hardware?"). Our outlines answer those confusions *inside
the narrative* (A §4's "one rule, one law, same object read two ways"; B's
five-instruction manual), but a reader can hold a rail in a way they can't
hold a chapter. Extract it whole: a small fixed chrome element on every
figure — three slots, the active one lit — showing which layer the figure
currently lives on. It costs almost nothing (one shared component in the
`chrome.ts` idiom), it survives any of the six skeletons, and it converts
their one structural advantage into ours. This is the highest
value-per-effort extraction in their entire document.

**3. The StateGraphViewer is the one figure of theirs we should steal
outright.** For n ≤ 5: every state a node, one-bit flips as edges, the
running chain a dot walking the graph, node size = Boltzmann mass. It
makes *stationarity* visible — the dot's visit frequencies converge on the
node sizes — which is the one concept all six outlines otherwise teach
only through histograms. It slots into A between §4 (landscape) and §5
(marquee failure) with a bonus: the synchronous pathology has a signature
*on this very display* (the dot teleporting along non-edges — moves a
single-site sampler cannot make). That gives the §5 failure a second,
independent witness beyond the TV meter. Cheap (closed-form layout,
Canvas-2D), checkable (assert visit counts against enumeration).

**4. Their component inventory is a good engineering doc filed as a
story.** BitWidget, BoltzmannExplorer, TwoBitCoupler, GridIsingViewer,
ColoringViewer, KernelTableViewer, ThermalizerTrainer, DiffusionToy — as
an implementation-planning artifact this is genuinely useful, and our
OUTLINES has no equivalent (our spine section covers the GPU kernel and
oracle but never lists the reader-facing instruments). But the repo's rule
is extract shared components only after a pattern repeats across three
figures — pre-building a widget library is how you get figures shaped
like the library instead of like the argument. Extraction: keep their
list as a *feasibility appendix* to OUTLINES (it demonstrates every
needed figure is buildable), not as a build order.

**5. Their math ladder is a solid checklist and a wrong protocol.** The
four-tier ordering (basics → sampler → hardware → compiler) is correct
and matches our math budgets almost term for term — good convergent
evidence that the ordering is real. But their chapters *state* the math
and then illustrate it ("Math: P(x) ∝ e^{−E(x)}" as a chapter field),
where the house protocol makes the reader perform the quantity before the
symbols arrive (A §1: the histogram traces the sigmoid before it is
named; B §4: the reader solves J = ½log 9 by dragging). The ladder
extracts as an internal completeness check against our math budgets;
the delivery protocol stays ours.

**6. Their 4×4 scoping instinct beats our 8×8, and their honesty about
the reverse model is worth adopting.** Two places their engineering
conservatism outdoes ours. First: 16 p-bits per image (4×4) keeps *exact
enumeration alive* deep into the diffusion section for single-timestep
checks — our 8×8 glyphs (64 bits) abandon the oracle exactly where the
article's hardest claims live. Adopt 4×4 (or 5×5) as the v0 finale
dataset; 8×8 becomes stretch. Second: their aside "output all bits with a
small factorized model first, then later replace with a coupled energy
model" is the honest ramp — a factorized reverse kernel is trainable in
seconds and *visibly worse* at capturing correlations, which is itself a
teachable contrast (a figure: factorized dreams vs coupled dreams on the
same corruption). Our outlines jumped straight to the coupled model;
theirs stages the failure that motivates it. That's a failure-chain beat
they found and we missed — fold it into whichever finale ships.

**7. Their Torx/Thermalizers chapters assert; ours operate; the fix for
theirs is the fix we already built.** V1 ch. 8–9 and V2 ch. 3 teach the
compile stack with labeled-box diagrams ("stochastic gate → compiled to →
small energy model") — the reader is shown that compilation exists, never
made to feel why it's hard or what it costs. Every deep idea there has an
operable version in our B: the capability boundary as a fabric the reader
pokes and finds affordances *absent* (B §2), hidden variables as a felt
necessity when two-bit XOR hits its leak floor (B §4), compile-vs-runtime
as a trainer the reader watches converge then freezes (B §5, their V2 §5
has the same separation — their one structural move worth crediting).
If their variants were to be rescued, the rescue is: replace each diagram
with the corresponding B figure. Which is to say — their V2 collapses
into our B under editing pressure, and adds nothing B doesn't have.

**8. Their code-snippet ladder is good pedagogy for a different genre.**
Snippets 1–8 (sigmoid → biased bit → energy → local field → Gibbs → block
Gibbs → exact Boltzmann → KL) are well-ordered and genuinely progressive
— for a notebook or README. In house articles, prose-adjacent code
appears where the *named solver* deviation wants it: the honest nested
loop of the enumerator (C §1), the five-line WGSL kernel body with its
correctness-condition comment (spine doc). A snippet per concept would
make the code a parallel narration track competing with the figures.
Extract: their snippet 7 (exact Boltzmann probabilities) is the right
code to show beside C §1's oracle; the rest are implementation, not
article.

**9. What ours need that this comparison exposed.** Beyond the rail
(argument 2) and the finale rescoping (argument 6): **A** still undersells
the compiler frame — their recommendation ("compiler framing from V2 is
what's actually novel") is half-right, and the cheap concession is
importing B §4's noisy-copy hand-compile as a single late figure in A §7,
giving A the taste of compilation (drag J until the flip-rate meter reads
10%, reveal ½log 9) without B's trainer risk. **B**'s two high-risk
figures now have prior art to lean on — their V2 §4's "two kernel
heatmaps + error heatmap + descending loss" is a more buildable rendering
of B §5's trainer than what we wrote, and we should adopt that concrete
layout. **C** should absorb their performance-dashboard framing (V3 §6:
updates/sec beside effective-samples/sec) as the §6 centerpiece — our
outline has the race, theirs has the instrument panel; the panel is the
better rendering of the same claim.

**10. The recommendations agree, which is worth noticing.** Their hybrid
(V3's medium + V1's ordering + V2's compiler reveal) and ours (A's spine +
C's meter folded in + B banked as sequel) are the same shape rotated:
everyone independently concluded no single variant survives contact.
The residual disagreement is exactly one axis — *what gets folded into
the primary*: they fold in the compiler story and drop correctness; we
fold in correctness and defer the compiler story. Given argument 1 (the
correctness instinct is the rarer, less-told, more load-bearing one) and
argument 9's cheap compiler concession (one hand-compile figure), the
fold order stands: **A + C's meter + one B figure, with B whole as the
sequel** — now also carrying the layer rail, the state-graph viewer, the
4×4 finale, and the factorized-first failure beat, all extracted from
theirs.

## Disposition of extractions (concrete)

Into `OUTLINES.md` variant A (the ship candidate), from ChatGPT's doc:
1. Layer rail (MATH/ALGORITHM/MACHINE chrome on every figure) — new
   shared component, all sections.
2. StateGraphViewer — new figure, A §4.5, second witness in §5.
3. Noisy-copy hand-compile (via our B §4, their V1 ch. 9 concurs) —
   A §7, one figure.
4. Finale rescope to 4×4/5×5 with factorized-vs-coupled failure beat —
   A §8.
5. Their component inventory + math tiers — appended to OUTLINES as
   feasibility appendix / completeness checklist, not build order.
Into B (banked): their V2 §4 heatmap-pair loss layout for the trainer
figure. Into C (banked/folded): their V3 §6 dashboard as the §6
centerpiece rendering.
