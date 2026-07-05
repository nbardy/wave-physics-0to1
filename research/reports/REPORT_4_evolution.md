# CIECHANOWSKI CRAFT STUDY — EVOLUTION REPORT

**Corpus correction (important, verified from DATE headers):** the prompt's era labels are wrong in two places. `mesh-transforms` is **May 14, 2014** — it is peak EARLY era (16 code blocks, private-API spelunking, iOS-dev audience). `exposing-floating-point` is **January 1, 2019** — it is not 2013–2015; it is the *hinge document*, published 45 days before Color Spaces. Directory-wide dates confirm the corpus timeline: five posts Jan–May 2014, then a 4.5-year publishing gap in this corpus, then Jan 2019 onward (float → color-spaces → alpha → tesseract Dec 2019 → gears/GPS/watch/moon through 2024). I analyze by actual date below.

---

## 1. EVOLUTION STUDY

### 1.1 What changed (before/after, quoted)

**Audience assumption.** 2014 assumes working Apple-platform engineers: *"Every self-respecting programmer knows how C arrays work"* (nsmutablearray); *"the daily bread and butter of Obj-C programmers"*; unglossed ivars, ARC, class clusters, ARM64 registers. 2019 assumes only curiosity: color-spaces explains that 0–255 becomes normalized by *"just divide the source numbers by 255.0"*, and expertise is made optional, never required: *"If you're familiar with matrices and vectors, you might have already realized that the transformation we did was a plain old matrix times vector multiplication."* The early era even offers skip-permission for its own hard parts — *"There is an entire section discussing the ARM64 assembly, so if you find that boring then do not hesitate to skip it"* (nsmutablearray) — a move the interactive era never needs because nothing is gated.

**Evidence source: console → reader's own hands.** 2014 proves by printout: *"The output shows that removing object at index 0 twice simply clears the pointers"* (nsmutablearray). 2019 proves by the reader's manipulation: *"While playing with the sliders you may have noticed something peculiar – if the sliders are at their minimum or maximum the colors look the same, otherwise they don't"* (color-spaces). Same empiricism, democratized: "run my code and read the console" became "drag this and see for yourself."

**Code volume (quantified):** nsmutablearray 50 code blocks, nsdictionary 35, gpgpu 23, mesh-transforms 16, bezier 3 → float 11 (transitional) → **color-spaces 0, alpha-compositing 0**. Equations + interactive figures fully replace listings.

**Pronoun regime (counted):** mesh-transforms: 45 I/my/me vs 15 we/us/our — the author as protagonist-investigator (*"I badly wanted to figure it all out and recently I finally did"*). Color-spaces: 110 we vs 17 I — author as tour guide (*"we'll start by playing…"*). The "I" that survives into 2019 is only editorial stance ("I'll symbolize…", "I highly recommend…").

**Question marks (counted):** early posts are detective stories and ask 3–15 questions each (*"does NSDictionary make use of a hash table? This is what I've decided to investigate"*; *"Here's a trivia: what will the following code print?"*). **Color-spaces and alpha-compositing contain zero question marks.** The rhetorical mode shifted from mystery-solving to guided derivation.

**Subject half-life.** Three of five 2014 posts carry self-obsolescence disclaimers: *"Note: this article is obsolete…"* (gpgpu, retro-added); *"at some point in time NSDictionary will change and my findings will become obsolete"*; *"Implementation details of NSMutableArray are private for a reason. They're subject to change at any time."* The 2019 subjects are chosen to never expire: Grassmann's laws (19th c.), CIE 1931, Porter-Duff 1984, IEEE 754.

**Endings.** Early closes are timestamped and community-facing: *"I wholeheartedly hope BCMeshTransformView becomes obsolete on the first day of WWDC 2014… Fingers crossed for June 2"* (mesh); *"If you get bored dissecting the Bézier curves I encourage you to try playing with them… on your iPad"* (bezier, an app CTA). Late closes are timeless benedictions: *"you just need to shine a light on it"* (color-spaces); *"The next time you look at smooth edges of vector shapes… remember it's just a small but mighty powerful component making it all possible"* (alpha).

**Self-deprecation deleted.** 2014: *"I suck at regular expressions"*, *"I'm new at this"*, *"you should take them with a grain of salt"*, *"This will look scary."* 2019 has none; uncertainty is replaced by precisely-scoped caveats (*"with some very rare exceptions"*).

**Titles.** Verb+proper-noun insider titles ("Exposing NSMutableArray", "Exploring GPGPU on iOS") → bare universal noun phrases ("Color Spaces", "Alpha Compositing").

**Markup archaeology (from the stripped files themselves):** in 2014 files the `{class|word}` spans are Pygments *syntax-highlight* classes (`{k|typedef}`, `{mi|4}`, `{nf|meshTransformWithVertexCount:}`); in 2019 files the identical span mechanism carries *semantic color-vocabulary* classes (`{color_mr|R}`, `{alpha_operator|source-over}`). The colored-token technology literally migrated from decorating code to binding prose→figure.

### 1.2 What he KEPT (constants across the decade)

1. **"Final Words"** — every one of the 8 posts ends with a section literally titled "Final Words."
2. **Punny/allusive section titles**: "Meeting Prometheus" (mesh 2014), "The Disappointing Linear Function / The Promising Complication / The Amazing Iteration" (gpgpu 2014) ↔ "Seeing the Matrix / The Matrix Seeing" (title reversal = matrix inversion), "There and Back Again", "One Space to Rule Them All" (color-spaces 2019). Tolkien recurs.
3. **Declared fascination as motive**: *"Hash tables are just awesome"* / *"I'm absolutely fascinated with Bézier curves"* (2014) ↔ *"all the other concepts related to alpha compositing were just too interesting to leave by"* / *"The more I learn about IEEE 754 the more enchanted I feel"* (2019).
4. **Beauty vocabulary applied to engineering**: *"a beautiful list of 64 primes"*, *"this is a beautiful solution"*, *"This is a brilliant idea"* (2014) ↔ *"beautifully simple"*, *"a charming simplicity"*, *"something truly beautiful and ever-lasting"* (2019).
5. **Failure-first pedagogy**: bad tangent → good tangent, OpenGL's "plain wrong" lines (bezier 2014) ↔ nearest-neighbor → bilinear → premultiplied; naive half-opacity pill → offscreen buffer (alpha 2019).
6. **"Notice…" as the workhorse attention verb** — present in all 8 posts (12× in color-spaces, 9× each in alpha and nsdictionary).
7. **Foreshadowing discipline**: *"As for the w field of CAMeshFace, we'll temporarily postpone its discussion"* (2014) ↔ *"to foreshadow a little, composited using a better equation that we'll derive in a minute"* (2019).
8. **Companion artifact**: GitHub repos (all five 2014 posts) → float.exposed website (2019) → eventually the embedded figures are the artifact.
9. **Numbers staged as drama**: *"Sixty four. Times. Faster."* (2014) ↔ *"an increase in number of pixels by a whooping factor of 2¹⁶"* (2019).
10. **Generous named further-reading** — and one literal cross-decade repeat: **Bruce Dawson's float series is recommended in both gpgpu (2014) and exposing-floating-point (2019)**.
11. **Interactivity itself predates the era**: bezier (Feb 2014) already embeds draggable in-browser canvas demos with a slider — *"To make the story more interesting I made a few interactive demos"* — and already performs the signature remove-the-control move: *"We're going to get rid of the slider."* The turn was not inventing the demo; it was promoting the demo from illustration-of-my-app to the argument itself.

### 1.3 Dating the transition; the turning-point post

Within this corpus: early cluster Jan 5–May 14, 2014 → gap → **Exposing Floating Point, Jan 1, 2019** → Color Spaces, Feb 15, 2019 (first zero-code post). Float is the unmistakable hybrid hinge:

- Old era retained: the "Exposing X" title formula (after Exposing NSMutableArray/NSDictionary), 11 code blocks, LLDB sessions (*"we can fire up LLDB and let the hacky type punning do its work"*), printf/C audience.
- New era arrived: demystification hook (*"floating point numbers are often understood in a hand-wavy manner… things aren't actually that complicated"*); first-principles ladder (decimal notation → binary notation → "floating points numbers are just numbers in base-2 scientific notation with… two restrictions"); the triumphant mid-article reveal *"If you've grasped everything that we've discussed so far then congratulations – you understand how floating point numbers work"*; visual "map of floats" with an accessibility fallback (*"If you have trouble seeing color you can switch to the alternative version"*); the `{hidden|…}` dark-mode-conditional prose device shared verbatim with color-spaces; the wonder benediction close. 45 days later, code count hits zero and never returns.

### 1.4 What the early work reveals about what was deliberately abandoned

- **Code listings** were abandoned because the early posts prove they gate by language, rot with SDKs, and *demonstrate* rather than let readers *discover*. Gpgpu now opens with its own obituary.
- **Assumed expertise / "for programmers" framing**: the early value proposition is professional utility (*"You can use __NSArrayM as either stack or queue without any performance hits"*, *"I no longer have to question myself using NSMutableArray as queue"*). The late value proposition is wonder + literacy for anyone with a screen.
- **The investigator narrative** (I disassembled, I peeked, I suspect) was traded for the tour-guide narrative: early posts document *his* discovery process; late posts engineer *yours*.
- **Ephemerality**: early posts pin SDK versions ("based on iOS 7.0 SDK") because they know they'll rot; the mature style solves rot by selecting immortal subjects.
- Notably, the early era already contained everything the late era needed — demos (bezier), puns (Prometheus), failure-first, beauty-talk — minus one decision: that the general reader, not the Apple developer, is the customer.

---

## 2. PER-POST PROFILES

Stats = prose words (markup-stripped, code blocks excluded) / sections (`#` count incl. title) / code blocks. FIGURES headers read 0 in all files and no [FIGURE]/[CONTROL] markers survive stripping; figure activity inferred from captions and demo-references.

**exploring-gpgpu-on-ios — Jan 5, 2014 — 3,667 w / 23 §§ / 23 code**
- Open: *"I've always wanted to try some GPGPU programming on iOS. The idea of harnessing the highly parallelized power just tickled my inner geek."* Hook: personal itch + promised payoff ("it works like magic").
- Arc: Why? (three benchmark stories, adjective-titled: Disappointing/Promising/Amazing) → How? (Transform Feedback, buffers, shaders) → When? (data size, precision) — a literal why/how/when skeleton.
- End: *"All those effort will become vein, when Apple provides access to the now private OpenCL framework. Until then, OpenGL abuse is the primary toy for us to play."* (typo "vein" for "vain" — early editing was rougher). Ephemeral, platform-hostage close.
- Fingerprints: *"That's right, the GPU was over 64 times faster. Sixty four. Times. Faster."*; *"As you can see, GPU sucks in this case."*; *"once started it's better to keep it rolling."*

**drawing-bezier-curves — Feb 18, 2014 — 2,541 w / 19 §§ / 3 code — PROTO-INTERACTIVE**
- Open: *"A few months ago I've released my latest iPad app – Revolved. The core idea of Revolved is super simple – you draw curves… and they get revolved around the axis to create a 3D model."* Hook: my-app's-guts.
- Arc: curves → subdivision (draggable demo + slider) → width via triangles → bad tangent/good tangent → auto-segmentation ("get rid of the slider") → "Why not Core Graphics?" cost analysis.
- End: *"If you get bored dissecting the Bézier curves I encourage you to try playing with them, this time in 3D, on your iPad."* App CTA.
- Fingerprints: *"Dragging the control points and watching the curve wiggle is an experience on its own."*; *"We're going to pick hyperbola – it's just so awesome"*; *"the devil, as usual, is in the details."*

**exposing-nsmutablearray — Mar 5, 2014 — 3,417 w / 36 §§ / 50 code (max code density)**
- Open: *"I've always wondered how NSMutableArray works internally. Don't get me wrong, immutable arrays certainly provide enormous benefits: not only are they thread safe but also copying them is essentially free."* Hook: confessed curiosity.
- Arc: C-array problem → class-dump → line-by-line ARM64 walkthrough of objectAtIndex: → reconstructed C → circular-buffer reveal → headline behavioral findings ("Once grown, doesn't shrink", "Initial capacity almost doesn't matter") → CFArray contrast.
- End: *"Personally, I'm most delighted with constant-time performance of insertion/deletion from either end… It works perfectly fine."*
- Fingerprints: *"I'm in love with this disassembler."*; *"Isn't assembly just amazing?"*; *"This is a shocker – __NSArrayM never reduces its size!"*; *"I'm new at this."*

**exposing-nsdictionary — Apr 8, 2014 — 3,053 w / 19 §§ / 35 code**
- Open: *"Hash tables are just awesome. To this day I find it fascinating that one can fetch an object corresponding to an arbitrary key in constant time."* Hook: naked enthusiasm.
- Arc: question posed → allocation internals (indexed ivars) → reverse-engineered objectForKey: → prime-sized storage tables → adversarial experiments (nil-key gotcha, BCNastyKey, linear worst case).
- End: *"…right here and right now it's just so much fun to see how things work and hopefully you share my excitement."*
- Fingerprints: *"It should be (null) right? Nope:"*; *"This key is awful: we're only equal to self"*; *"a beautiful list of 64 primes"*; *"This hack is very fragile… but this is a test project so it's perfectly fine."*

**mesh-transforms — May 14, 2014 — 3,613 w / 17 §§ / 16 code**
- Open: *"I'm a huge fan of the transform property. Combining rotations, translations, and scalings is one of the easiest ways to modify a shape of a UIView or a CALayer."* Hook: fan-confession + API namecheck.
- Arc: private CAMeshTransform anatomy (vertex/face/coordinates) → leaky abstractions (rasterization, quad triangulation) → CALight → crash-your-device dangers ("Private for a Reason") → missing features → his open-source BCMeshTransformView + implementation war stories.
- End: *"I wholeheartedly hope BCMeshTransformView becomes obsolete on the first day of WWDC 2014… Fingers crossed for June 2."*
- Fingerprints: *"The first time I saw iOS-runtime headers I was mesmerized."*; *"assigning 20 to subdivisionSteps property is probably the easiest way to programmatically reboot your device."*; *"It's not. It's just amazing."*; *"I couldn't force myself to get through literally hundreds lines of floating point assembly."*

**exposing-floating-point — Jan 1, 2019 — 4,856 w / 34 §§ / 11 code — THE HINGE**
- Open: *"Despite everyday use, floating point numbers are often understood in a hand-wavy manner and their behavior raises many eyebrows. Over the course of this article I'd like to show that things aren't actually that complicated."* Hook: demystification promise (the canonical mature hook, already fully formed).
- Arc: decimal → binary → "floats are just base-2 scientific notation with two restrictions" → encoding sign/significand/exponent → special values map → subnormals → discrete space → raw-integer trick → type conversions → printing/hex → exact decimal representation.
- End: *"William Kahan… created something truly beautiful and ever-lasting. I genuinely hope this trip… made them a bit less mysterious and showed you some of that beauty."*
- Fingerprints: *"congratulations – you understand how floating point numbers work"*; *"That's (almost) all there is to them."*; *"Things fall into place just perfectly."*; *"Other than exploiting the absurdity of present day list of top level domains"* (on float.exposed).

**color-spaces — Feb 15, 2019 — 6,304 w / 24 §§ / 0 code / 208 color-vocab spans / 24 drag-slider references**
- Open: *"For the longest time we didn't have to pay a lot of attention to the way we talk about color. The modern display technologies capable of showing more vivid shades have, for better or for worse, changed the rules of the game."* Hook: the-familiar-just-changed.
- Arc: play with two mismatched pickers → normalized range → TRC (definition part 1) → hand-match primaries → Grassmann → matrix → inverse → negative values via physical light-matching → CIE RGB → XYZ → chromaticity diagram → gamut (definition part 2) → white point (definition part 3) → sRGB case study. The article's spine is a three-part definition assembled piecewise.
- End: *"Color is one of those areas with seemingly infinite depth of complexity. I hopefully showed you that some of that complexity isn't actually as scary as it looks, you just need to shine a light on it."*
- Fingerprints: *"A dry definition of a color space is not a good way to kick things off."*; *"If you're still not tired of dragging the sliders you can do it yourself, or just let me do it:"*; *"Since the numbers don't care, the entire thing works"*; *"Perception of every color happens in our heads."*

**alpha-compositing — Jul 24, 2019 — 6,043 w / 29 §§ / 0 code / 59 alpha-vocab spans**
- Open: *"Transparency may not seem particularly exciting. The GIF image format which allowed some pixels to show through the background was published over 30 years ago."* Hook: anti-hype inversion; thesis pun follows: *"a lot of invisible depth and beauty in something that we often take for granted."*
- Arc: rose-tinted-glasses demo (opacity) → coverage/rasterization → alpha = opacity×coverage → simple compositing → intermediate buffers → derivation halts at ugliness (*"Look how complicated the second equation is! … This is just inelegant."*) → premultiplication detour (filtering, interpolation) → derivation completes → Porter-Duff catalog with draggable ♥/♣ demos → nine-step nautical painting → pitfalls (group opacity, coverage loss, linear values, bit depth).
- End: *"The next time you look at smooth edges of vector shapes… remember it's just a small but mighty powerful component making it all possible."*
- Fingerprints: *"Look how premultiplied alpha made things beautifully simple."*; *"a charming simplicity"*; *"Let's take the rose-tinted glasses off"* (the opening prop, retired at the pivot to caveats); *"it all, quite literally, adds up."*

---

## 3. CROSS-POST SYNTHESIS (color-spaces, alpha-compositing, + float as hybrid)

### 3.1 Voice fingerprint (quote-backed)

1. **Anti-hype openings** that concede boredom to buy trust: *"Transparency may not seem particularly exciting."* / *"A dry definition… is not a good way to kick things off."*
2. **Play-before-theory**, with "play" as a literal recurring verb: *"we'll start by playing"*, *"Let's continue playing with the color pickers"*, *"Three dimensional diagrams are fun to play with."*
3. **We-voice, zero questions**: 110 we/us/our vs 17 I in color-spaces; 0 question marks in both 2019 posts (vs 8–15 in each 2014 post).
4. **Pre-narrated reader experience**: *"While playing with the sliders you may have noticed something peculiar"*; *"Unless you're quite skilled, the task probably wasn't trivial"*; *"You may have seen this horseshoe shape before."*
5. **Fatigue-empathy jokes / labor-sparing asides**: *"If you're still not tired of dragging the sliders… or just let me do it"*; *"The details of the evaluation are boring"*; *"I won't bore you with the algebraic manipulations."*
6. **Aesthetic exclamation as the payoff beat**: *"It's just perfect, we got rid of all the color bleeding and jaggies are nowhere to be seen."*; *"beautifully simple."*
7. **Topic-native puns bookending articles**: color-spaces closes *"shine a light on it"*; alpha opens with "invisible depth", pivots on *"Let's take the rose-tinted glasses off"* — the pun is the opening demo's prop.
8. **"Notice…" imperative** as the dominant attention-director (12×/9×): *"Notice the presence of negative values."*; *"Notice the little minimap in the corner."*
9. **Personified mathematics**: *"the pixel's color and its alpha like to be together"*; *"A set of three RGB coordinates just begs for a three dimensional presentation"*; *"Thankfully, Grassmann's laws come to our rescue."*; *"Since the numbers don't care, the entire thing works."*
10. **Scoped hedging, never vague**: *"with some very rare exceptions"*; *"a 2D projection onto an image, somehow contrarily, does not present a full picture."*
11. **Formal-archaic diction spiked with colloquial**: *"We're in a dire need of a better approach"*, *"a daunting endeavor"*, *"those immaculate beings have to be rasterized"* vs *"a wacky, but not particularly useful alpha-squaring effect."*
12. **Section titles that encode content as jokes**: "Seeing the Matrix" → "The Matrix Seeing" (title reversal = matrix inversion); "There and Back Again" (round-trip conversion).
13. **Lab-manual experiment prompts with predicted outcomes**: *"As an experiment I encourage you to set red and green components to 0 and just play with the blue slider. You should be able to see that…"*
14. **History woven in with reverence, names always given**: *"In July 1984 Thomas Porter and Tom Duff have published a seminal paper"*; *"David Wright and John Guild independently conducted experiments."*

### 3.2 Design grammar (figures + controls + colored vocabulary as one system)

- **Colored vocabulary = typed variables binding prose↔equation↔figure.** Color-spaces *declares its notation in prose*: *"I'll symbolize the red, green, and blue values from the top half with a small bar on top of the letters: {R̄ḠB̄}. For the values from the bottom half I'll use a bar at the bottom"* — then uses these inked tokens **208 times**. Because the post is literally about color, the device is object-language: the token for the weaker red primary is printed in that weaker red; numeric triples are dyed per-channel (`{0.9}{0.5}{0.2}` in r/g/b inks). The reader's eye does the type-checking that a compiler would.
- **Alpha extends the device from nouns to operators and functional roles**: `{alpha_operator|source-over}` always appears in operator-ink, and the source-over equation is glossed by a plain-English sentence whose words are colored 1:1 to equation terms: *"The operation {masks} {some} {background light} and {adds} {new light}."* Prose becomes a legend for the algebra.
- **Device- and theme-adaptive text**: `{click_word|click}{tap_word|tap}` branches on input device; `{hidden|…}` spans swap sentences by dark/light theme (*"make the background black{hidden|make the background bright}"*) — present in both color-spaces and float.
- **Control lifecycle**: introduce manual control → let reader struggle (*"After some trial and error you may get pretty close"*) → declare the toil unscalable (*"a daunting endeavor"*) → derive formalism as relief → automate/remove the control. (Prototyped in bezier 2014: *"We're going to get rid of the slider."*)
- **Destructive-view minimap**: *"Some blend modes are quite destructive and it may be easy to lose track of what's where. The minimap always shows a result of the simple source-over compositing."* — a UI affordance invented for pedagogy.
- **Figure recurrence with single-delta**: the nested-cubes 3D visualization appears 3× in color-spaces (forward matrix, inverse, white point), changed by exactly one lesson each time; dimensional escalation runs sliders → A/B split plates → 3D draggable cubes → taught 2D projection (*"Rejection of z is equivalent to a flat projection onto xy plane"*).
- **The page itself as specimen**: *"Almost everything you see on this website was blended using this mode"*; *"If you look up close on a screenshot of this page you'll notice…"*; *"the images on this website use sRGB."*

### 3.3 Pedagogy patterns

1. **Definition assembled piecewise**: color-space's three defining properties are delivered as section-ending rewards across the whole article (*"We can now say that one of the defining properties of a color space is:"*), not stated up front.
2. **Failure-first**: *"the steps on the edges of the triangle look unpleasant and they flicker heavily"* → 4-sample coverage → exact trapezoid coverage; *"The final result has an ugly blue halo around it"* → premultiplication.
3. **Derivation-interruption (cliffhanger algebra)**: stop at the ugly equation, name the ugliness (*"This is just inelegant"*), build the missing concept in a detour, return and watch terms cancel (*"all those pesky multiplications disappear"*).
4. **Manual labor before automation**: hand-match primaries with sliders, then meet matrices as relief.
5. **Physical anchors for scary abstractions**: negative RGB via the light-booth story — *"we could say that the left side is too green, or we could say that the right side is not green enough!"*; premultiplied color as *"haze, smoke, fog, or some colorful powder."*
6. **Both directions taught as a symmetry check**: forward/inverse matrix; source-over/destination-over (*"it's just a 'flipped' source-over"*).
7. **Triumph followed by mandatory caveat section**: after premultiplication wins, a full section concedes *"premultiplied alpha isn't a silver bullet"* (bit-depth collapse: values 148–152 all encode to 30 at 20% alpha; only 25.2% of RGBA32 survives premultiplication uniquely).
8. **Invented mini-stories to motivate rules**: the 725/275 survey that sums to 101% under round-half-up, fixed by round-to-nearest-even (float).

### 3.4 Critique — honest weaknesses

1. **Deferred payoff / front-loaded abstraction**: color-spaces spends ~11 sections (~55% of the article) on two *anonymous, contrived* color spaces before any physical grounding; the reader carries unnamed {R̄ḠB̄}/{R̲G̲B̲} abstractions for thousands of words, and "what is sRGB" arrives ~5,500 words in.
2. **Typography-hostage meaning**: "bar on top" vs "bar on bottom" notation and 208 color-coded tokens make the prose unreadable when color/markup is stripped — as this very corpus demonstrates. Accessibility is handled ad hoc (float offers a color-blind alternative; color-spaces' colored vocabulary has no stated fallback). Screen-reader and print experiences are afterthoughts.
3. **Derivations skipped at exactly the hard parts**: *"The details of the evaluation are boring, so let's just present the solution as is"*; *"The details of this computation are not critical… you can read about them… on Bruce Lindbloom's website"*; *"The proof is fairly simple, but I won't bore you."* The three moments a rigorous reader most wants are all outsourced — trust-gaps disguised as mercy.
4. **Zero-question rhetoric risks passivity**: every observation is pre-narrated ("you may have noticed…"), so demos become confirmations rather than experiments; there is nothing the reader can get *wrong*. The 2014 posts, ironically, tested the reader harder (*"what will the following code print? … Nope"*).
5. **Split audience calibration**: explains 0–255→normalized division, yet leans on *"If you've solved systems of linear equations before, you may have realized that this is just an inverse matrix"* — the on-ramp and the summit serve different readers, and the middle reader gets neither derivation nor glossary.
6. **Formulaic closings**: "Final Words" + wonder-benediction + pun is a template; alpha's *"small but mighty powerful component"* is generic filler compared to the body's precision.
7. **Undated environmental claims**: *"The default way to do things on the web and in most graphic design software is to directly blend non-linear values"* is browser-era-contingent but stated as standing fact — the 2014 posts pinned SDK versions precisely because they knew claims rot; the mature style occasionally forgets that some of its claims are contingent too.
8. **No static fallback for load-bearing demos**: sentences like *"Making the border between the two halves disappear may take some tweaking, but eventually we can agree on values that fit perfectly"* are semantically empty without a working canvas — a deliberate trade, but it means the articles cannot be quoted, printed, or archived without loss.

---

**One-line thesis:** the interactive era was not a style change but an audience change executed with total discipline — Ciechanowski kept every 2014 instinct (puns, failure-first, beauty-talk, foreshadowing, "Final Words", even the Bruce Dawson citation) and swapped exactly two things: the reader (Apple dev → anyone) and the evidence (his console → your hands); `exposing-floating-point` (Jan 1, 2019) is the document where both swaps are visibly half-complete.