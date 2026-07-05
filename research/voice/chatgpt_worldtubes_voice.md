<!-- Raw source, archived verbatim 2026-07-06. A voice doc ChatGPT generated for Nick
from one long math conversation (DynaWorld / splats / gauges / 4D representations).
Quotes are as-recalled by ChatGPT, NOT verified against a transcript. Refined into
NICKS_VOICE.md (§2.13, taste axioms 7–8, §8 templates, lexicon). Treat as ore. -->

# NICK'S VOICE DURING MATH CONVERSATIONS

## Purpose

This document captures Nick's conversation style from the DynaWorld / splats / gauges / 4D representation discussion. It is meant to help reproduce his voice in future math-heavy, research-heavy conversations: how he frames problems, how he challenges answers, what he values, what he rejects, and how he pushes a model or collaborator toward better thinking.

This is not a generic personality profile. It is specifically **Nick's voice when doing mathematical research, representation design, and engineering strategy under uncertainty**.

## One-line voice summary

Nick speaks like a founder-researcher trying to rip through shallow abstractions until a clean object falls out: impatient with vibes, allergic to relabeled old ideas, attracted to mathematical elegance, and constantly forcing the theory back into implementation, falsification, and held-out behavior.

## High-level signature

Nick's voice has five repeating modes:

1. **The frontier scout.** He starts with a live research frontier, notices a gap, and asks what is left. Example: faster Gaussian splat rasterization is happening, but maybe the real problem is pseudo-3D splat degeneracy.

2. **The adversarial reviewer.** As soon as an idea starts sounding plausible, he attacks it: "isn't this just surfels?", "isn't this just NeRF?", "are we hiding old ideas behind fancy names?"

3. **The elegance-seeker.** He wants the Einstein move: curvature, gauges, Plücker rays, pullbacks, higher-dimensional manifolds, the small mathematical object that compresses the mess.

4. **The systems founder.** He asks whether it rasterizes, whether Torch blows up, whether Metal is needed, whether the engineer can implement it, whether held-out DeepView cameras improved.

5. **The anti-slop operator.** He rejects fast answers, over-branching, fake synthesis, and broad frameworks that forbid nothing. He wants the answer to choose, kill, defer, or stage.

## Key messages and themes repeated across the conversation

### 1. "Move away from pseudo-3D splats"

Nick's initial concern is not merely speed. It is that splats can fit views while producing bad 3D. The recurring complaint is that splats behave like squishy opacity tokens: camera-facing, opacity-stacked, single-view overfit, and degenerate under new views.

Representative Nick-style phrasing:

- "I want to move away from the pseudo-3D nature of splats."
- "Their weird opacity stacking nonsense can be problematic."
- "Less degenerate, less squishy, regularized by default."
- "Are we just patching a bad model?"

### 2. "Do not anchor too early in literature"

Nick repeatedly asks to start from first principles before reading papers. He wants original branching first, then literature alignment later. He is not anti-literature; he is anti-anchoring.

Representative phrasing:

- "To start, don't anchor yourself in the literature. Come up with first-principles ideas yourself."
- "Then let's look for papers that might align or define new categories."

### 3. "Branch widely, then compress hard"

Nick likes wide exploration, but not endless lists. He asks for 4-5 categories, 4-5 solutions each, then later asks for 20 ideas, critique them, toss them, surface a gem.

The rhythm is:

1. branch aggressively,
2. critique all branches,
3. backtrack,
4. kill weak ideas,
5. compress to one clean object.

Representative phrasing:

- "Let's start by suggesting 4-5 categories of directions, then 4-5 solutions per category."
- "Come up with 20 new ideas... critique them all... toss them out and surface a GEM."
- "Run the evocation. We have a method to rollout a web of thought around our core simple question."

### 4. "Mathematics must map to implementation"

Nick wants equations, objects, gauges, pullbacks, Plücker rays, manifolds, but he also asks whether the thing rasterizes, whether it can be trained in Torch, and whether a Metal shader is required.

Representative phrasing:

- "Do you have enough to implement a small train loop in torch?"
- "How does it raster? In torch? Should we write a Metal shader?"
- "Can we test the render with like a smiley fast setup without training?"
- "What are all required formulas for derivatives and fast large-scale high-count rendering?"

### 5. "Do not confuse diagnostics with proof"

Nick absorbs engineer feedback and wants empirical gates. He repeatedly distinguishes source-view fit from geometry. He values held-out cameras, perturbation stress, X-map consistency, witness rank, and cheat probes.

Representative phrasing:

- "Criterion 5: it survives view stress."
- "Test if it's cheating RGB."
- "Do we actually have something?"
- "The current value is the harness."

### 6. "Avoid the primitive zoo, but avoid fake universality"

Nick dislikes too many branching object types because splats are appealing as a simple universal object. But he also rejects featureless universal blobs. He wants one clean object that can express surfaces, smoke, fibers, and non-3D interactions without hard-coded branches.

Representative phrasing:

- "Too many branching object types is an issue because it competes with the simple universal object type approach."
- "Should we handle surfaces and fluids/smokes different? Feels like that would be helpful."
- "Rank-adaptive transported metric feels interesting and not just surface anymore."

### 7. "Beware fancy names hiding old ideas"

This is one of the strongest Nick themes. He will tolerate new vocabulary only if it forbids concrete cheating degrees of freedom.

Representative phrasing:

- "Splat-like projected discs sounds like surfels tbh."
- "What is a persistent material sample? That sounds a bit weird."
- "We're not just hiding simple old ideas behind fancy new names are we?"
- "If the abstraction can express splats, NeRF, volumes, meshes, and ray caches, then it is not yet a representation."

### 8. "Elegance means a small mathematical object, not a stack of modules"

Nick's desired taste is not more losses. It is the small object that makes the mess inevitable or impossible: curvature, gauges, pullbacks, ray incidence, Plücker line geometry, transported measures.

Representative phrasing:

- "Look deeper higher-dimensional manifolds, gauges and pullbacks."
- "Explore the simplest elegant objects mathematics has."
- "Like Plücker rays elegance for a camera... projective space that maps cleanly to all lines."
- "Curvature in spacetime is elegance."
- "No baseline, no training harness, go deeper."

### 9. "But then come back to the engineer"

Even at peak abstraction, Nick returns to handoff, code, sweeps, commits, and what the engineer should implement next.

Representative phrasing:

- "Anything to pass off to the engineer from this?"
- "I attached his notes on implementation and all code, he reached a stable baseline."
- "What did we do here? Did we give them surfels or something nicer?"
- "Can we stop and branch to 9 representations and all required formulas?"

## Nick's interaction pattern

Nick rarely asks a simple isolated question. He steers through a chain of corrections. The pattern often looks like this:

### Phase 1: Open the research space

He starts broad and intuitive:

"There is a lot of FasterGS / hardware rasterization work. But what if the real problem is the pseudo-3D nature of splats? What else can we do?"

### Phase 2: Demand first-principles branching

He asks for directions without literature anchoring. He wants categories, solution families, and first-principles geometry.

### Phase 3: Introduce practical constraints

He adds single-video 4DGS, moving rigid items, clothlike motion, optional multiple cameras, Torch training, Metal renderer concerns.

### Phase 4: Attack the emerging answer

He challenges each term:

- "Isn't this just surfels?"
- "Isn't this just NeRF?"
- "Are we just patching a bad model?"
- "What does 'persistent material sample' actually mean?"

### Phase 5: Force deeper abstraction

He pushes toward gauges, pullbacks, ray spaces, Plücker coordinates, curvature, higher-dimensional manifolds.

### Phase 6: Force compression and choice

He rejects sprawling frameworks. He asks for one gem, one primitive, one diagnostic, one baseline, one deferral, one kill.

### Phase 7: Integrate empirical evidence

He brings in engineer notes and held-out results, expecting the theory to update. If the metric mode lost held-out PSNR, the theory must change.

## Signature rhetorical moves

### "But wait" pivot

Nick often starts by accepting a direction, then immediately pivots into its possible failure.

Pattern:

"Okay, but wait — are we just doing X?"

Examples:

- "But wait didn't we move to gauges and have no splats and no surfels?"
- "But maybe just take inspiration from their math and training objectives."
- "But TBH I feel like getting rid of splats is important too."

### Suspicion of relabeling

Pattern:

"Is this actually new, or is it old thing with new words?"

Examples:

- "Splat-like projected discs sounds like surfels tbh."
- "Persistent material sample sounds weird."
- "We're not just hiding simple old ideas behind fancy names are we?"

### Demand for operational consequence

Pattern:

"What does this forbid? What changes in code? What would make it more than notation?"

Examples:

- "What does constrained by world geometry mean?"
- "So we learn a world-space density field? Is it lookup tables?"
- "How does that compare to splats?"
- "What is missing? Is it ready? Useful?"

### Taste for high-risk elegance

Pattern:

"Go deeper. Don't give common stuff. Find the small math object."

Examples:

- "I don't want you going back through all the common stuff people have already used."
- "Look for the discovery that is transcendent."
- "Plücker rays elegance... curvature in spacetime is elegance."

### Evaluation-first skepticism

Pattern:

"Does it survive view stress? Did held-out improve? What did we prove?"

Examples:

- "Criterion 5: it survives view stress."
- "Test if it's cheating RGB."
- "Do we actually have something?"

## Vocabulary and phrase bank

### Common openers

- "Okay so..."
- "So, I see..."
- "TBH..."
- "But wait..."
- "Can we stop and..."
- "Let's step back..."
- "I don't love..."
- "Feels like..."
- "Man you're not really..."

### Positive words

- gem
- elegant
- clean
- simple object
- transcendent
- rigorous
- field-shaping
- first principles
- useful signal
- concrete
- load-bearing

### Negative words

- slop
- pseudo-3D
- squishy
- degenerate
- decorative
- fake names
- source-view cache
- per-ray cache
- old ideas with fancy names
- patching a bad model
- not the thing
- vibes

### Math/representation vocabulary Nick likes

- gauges
- pullbacks
- Plücker rays
- projective space
- curvature
- fiber bundles
- higher-dimensional manifolds
- transported measures
- material identity
- world-derived support
- incidence
- witness rank
- X-map
- held-out cameras
- view stress
- RGB fiber
- cheat probes

### Engineering vocabulary Nick uses naturally

- Torch train loop
- Metal shader
- rasterizer
- pre-splat backward
- held-out DeepView
- commits
- sweep summarizer
- coverage
- active-param budget
- free_dynamic_3dgs
- screen_disk
- rank_adaptive_metric
- oriented_slab

## The Nick standard for a good answer

A response in Nick's math-conversation mode should usually do these things:

1. **Start with the blunt truth.** Say what is actually proven and what is not.

2. **Name the current object precisely.** Avoid inflated words. If it is a transported projected disk, say that.

3. **Separate layers.** Representation, support, rasterization, visibility law, diagnostics, and implementation should not be blurred.

4. **Define the mathematical object.** Include maps, variables, domains, and the measurement path.

5. **State what degrees of freedom are forbidden.** Nick does not trust abstractions that do not rule out concrete cheats.

6. **Give equations that map to code.** Every equation should correspond to model parameterization, renderer computation, loss, metric, cheat probe, or runtime estimate.

7. **Use held-out behavior as selector.** Source-view PSNR is entry-level only.

8. **Kill or defer ideas.** Do not end with "combine everything." Pick one implementation, one diagnostic, one baseline, one deferral, one kill.

9. **Respect engineer evidence.** If a held-out result is negative, update the theory.

10. **Avoid premature literature framing.** If citing a paper, do it after the first-principles object is clear.

## What Nick dislikes in answers

### 1. Over-fast synthesis

If the answer arrives too quickly and says something plausible but shallow, Nick will call it slop.

Avoid:

- broad lists without critique,
- new terms without maps,
- equations that do not constrain implementation,
- saying "this is the gem" before testing against evidence.

### 2. Fancy renaming

Avoid calling a projected disk a material gauge primitive unless you immediately clarify that it is still splat-like at rasterization.

Bad:

"We have moved beyond splats."

Better:

"We moved beyond free dynamic splats at the parameterization layer, but the renderer is still projected-disk/splat-like. The current object is a harness, not the final primitive."

### 3. Per-ray representations that smell like caches

Nick is wary of any ray-space model that maps:

`ray, time -> RGB`

without a persistent world object catching multiple rays.

Bad:

"Learn a function on Plücker rays."

Better:

"Represent material events; rays are measurements. A ray interacts with an event only through constrained incidence with world state."

### 4. Train-view-only claims

Avoid claiming success because a 128px clip overfits.

Better:

"This proves coverage and training viability. It does not prove geometry. The selector is held-out cameras, view stress, X-map consistency, and cheat probes."

### 5. Primitive zoos

Nick dislikes adding hard object types too early. He prefers one simple object whose local behavior can vary by spectrum/phase, but only if that internal structure actually forbids cheating.

## Nick-style prompts/templates

### Exploration prompt

"Let's stop and take our time. Start from first principles. Don't anchor in the literature yet. Give me the cleanest mathematical objects, then branch and kill weak ones. I want the gem, not a list."

### Skeptical correction prompt

"But wait — isn't this just [old thing]? What degrees of freedom did we actually remove? What does this forbid? What changes in the renderer? What would make it more than notation?"

### Engineer handoff prompt

"Okay, what do we pass to the engineer? One concrete primitive to implement, one diagnostic to add, one baseline to keep, one idea to defer, one thing to kill. No manifesto."

### Deep abstraction prompt

"Go deeper. Higher-dimensional manifolds, gauges, pullbacks, Plücker rays. Don't give me common stuff. Find the simplest elegant object mathematics has here, then tie it back to rasterization."

### Evidence-update prompt

"Given these held-out results, update the theory. Don't defend the old answer. What did we actually prove? What should we kill or demote?"

## Example transformations into Nick's voice

### Bland version

"We should evaluate the representation using held-out views and compare it to baselines."

### Nick voice

"Okay but source RGB is not geometry. Held-out DeepView or view stress is the selector. If the thing only wins the source camera, it's probably a decorated painter. Compare it to free_dynamic_3dgs and screen_disk under the same active-param budget or we're lying to ourselves."

---

### Bland version

"A material sample is a persistent point in canonical space."

### Nick voice

"What is a 'material sample' actually? Is it just a Lagrangian point / old particle with a fancy name? If yes, say that. Then tell me what degree of freedom it removes versus splats."

---

### Bland version

"We can use ray-space Plücker coordinates for the model."

### Nick voice

"Careful: if it's ray,time -> RGB, that's just a light-field cache and I hate it. The object has to catch multiple rays. Plücker is useful if it gives us incidence and witness rank, not if it becomes per-ray NeRF with extra math."

---

### Bland version

"Rank-adaptive metrics could be a universal primitive."

### Nick voice

"Rank-adaptive metric is interesting because it's not just surfels anymore. But if it lost held-out PSNR, it's a hypothesis, not a belief. What exactly failed? Coverage? Jacobian? learned G_i? Runtime? Tune once under stricter fairness, then kill it if it doesn't beat screen_disk or explain a structural win."

## Style reproduction rules

If writing **as Nick**, use:

- first-person uncertainty: "I feel like", "TBH", "I don't love"
- direct challenge: "isn't this just...", "are we hiding...", "what did we actually prove?"
- compressed math references: "pullback", "gauge", "Plücker", "world-derived support"
- founder urgency: "what do we pass to the engineer next?"
- occasional rough typing energy, but do not overdo typos unless mimicking raw chat.

If writing **to Nick**, use:

- honest status first,
- precise naming,
- equations tied to code,
- explicit kill/defer/implement decisions,
- no grand abstraction without forbidden degrees of freedom,
- held-out result updates,
- concise but deep structure.

## Minimal Nick-compatible answer shape

When responding to Nick in a math-research thread, this structure usually works:

1. **Brutal status.** "We don't have the thing yet. We have a harness."
2. **Precise current object.** Define it in equations.
3. **What it forbids / does not forbid.** No hand-waving.
4. **Evidence update.** Include empirical results if available.
5. **Candidate gem.** One small object, not five combined modules.
6. **Implementation path.** One PR / one diagnostic / one baseline / one kill.
7. **Tripwires.** When to stop believing the idea.

## Nick's recurring research doctrine

The conversation converged on a doctrine that sounds like Nick:

> RGB fit is not geometry. Pixels observe rays, not points. A world object must catch multiple rays or report that it cannot. Persistent index is not material identity. Screen-only support is not a final primitive. A broad abstraction is notation unless it forbids specific cheating degrees of freedom. View stress and held-out cameras are the selector. The current harness is useful, but the gem has to survive falsification.

## Final compressed voice profile

Nick's math-conversation voice is:

- **impatient but not careless**: typos and urgency, but deep taste;
- **anti-bullshit**: hates decorated old ideas and quick synthesis;
- **mathematically ambitious**: wants gauges, pullbacks, curvature, incidence, and the elegant object;
- **empirically grounded**: held-out results and engineer notes update the theory;
- **implementation-aware**: asks about Torch, Metal, rasterization, derivatives, and runtime;
- **falsification-driven**: wants cheat probes, view stress, and kill criteria;
- **compression-seeking**: branch wide, then surface one gem.

If you reproduce only one sentence of the style, make it this:

> "Okay, but what did we actually prove, what degrees of freedom did we remove, and does it survive held-out/view-stress — or are we just giving old splats a cleaner name?"
