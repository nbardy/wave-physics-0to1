# CIECHANOWSKI CRAFT STUDY — full-text analysis of airfoil, sound, naval-architecture, moon

Corpus stats (prose words = markup stripped):

| post | date | prose words | figures | words/figure | controls | controls/fig | colored-vocab spans | unique color classes | content sections |
|---|---|---|---|---|---|---|---|---|---|
| naval-architecture | 2021-07 | 4,915 | 47 | 105 | 47 | 1.00 | 51 | 9 | 9 |
| sound | 2022-10 | 7,950 | 48 | 166 | 45 | 0.94 | 180 | 20 | 6 |
| airfoil | 2024-02 | 14,495 | 81 | 179 | 67 | 0.83 | 351 | 41 | 10 |
| moon | 2024-12 | 16,292 | 120 | 136 | 117 | 0.98 | 605 | 47 | 9 |

The colored-vocabulary system quadruples in density from 2021→2024 (51→605 spans). Posts double in length over the same period. ~1 control per figure is invariant.

---

## AIRFOIL DEEP DIVE

### Section outline (10 content sections, 81 figures)

1. **Intro** (figs 1–2). Two hooks: the yellow airfoil cross-section with AoA slider (fig 1), and a fluid flowing around a gray cube where "changing just one {viscosity|property} of this substance, we can end up with vastly different effects" (fig 2). Both are unexplained promises — fig 2's cube is not resolved until fig 63, ~4,000 words later.
2. **Visualizing Flow** (figs 3–7, grass scenes). Teaches the three representations before any physics: grass-blade **arrows** (Eulerian velocity field), leaf-like **markers with ghost trails** (Lagrangian tracers), and **color-brightness** for speed. Explicitly contrasts the first two: "An arrow is attached to its fixed point in space… the little markers are actively following the flow." Ends by declaring the 2D restriction.
3. **Velocity** (figs 8–14, particle cubes). Kinetic theory: 12,000 particles in an 80 nm cube; a red averaging box whose size you control; still air = zero mean; a hurricane-speed wind is invisible in the particle motions ("This is not a mistake"). Bridge sentence: the big average arrow "is equivalent to each of the arrows seen below" — micro rejoins the grass field.
4. **Relative Velocity** (figs 15–24, car→plane). Frame-of-reference via split-screen ground-camera/car-camera; "there is absolutely no difference between 'regular' wind and wind experienced by the car." Force diagrams for car vs plane isolate **lift as the mystery force**. Introduces "the protagonist of this article," then immediately swaps the asymmetric airfoil for a symmetric one.
5. **Pressure** (figs 25–31, tennis balls + particle cubes). Pressure = collision statistics, taught through a macro analogy (tennis balls bombarding a cardboard box, 3 variants) interleaved with micro particle sims. Key moves: pressure is never negative; **imbalance, not magnitude, creates force**; and — crucial for fluids — "the same rules apply to any chunk of air itself."
6. **Visualizing Pressure** (figs 32–42). Draggable high/low pressure blobs; surface-force arrows on the airfoil; net-force arrow; re-referencing to gauge pressure ("The phrase 'pressure lower than static pressure' is a mouthful"); contour lines; gradient defined via graphic-design gradients; the 3D **pressure-landscape** (marble rolling on hills). Then the deliberate failure: with made-up fields "the air markers will flow right through the body. This is clearly wrong!… those pressure fields themselves were completely made up and didn't correspond to any physical reality."
7. **Airfoil Flow** (figs 43–55) — the core. Two axioms ("the air can't penetrate solid walls"; steady-flow marker paths can't cross), then the reader **hand-tunes** the pressure field region by region with sliders: positive at the nose (too low → penetration, too high → back-flow), negative above/below, positive at the tail. Each region gets a verbal feedback-loop argument. Only *after* the reader has been the solver does he name Navier–Stokes. Then: surface pressure → net force → **lift/drag decomposition** → symmetric airfoil makes zero average lift → tilt it (AoA) → lift-vs-AoA plot → **stall** shown but not explained → cliffhanger into viscosity.
8. **Viscosity** (figs 56–66). Viscosity = "the rate of the diffusion of momentum," built from shear-layer demos, a dye-diffusion bottle analogy, vortex decay, a thin plate (no-slip and skin-friction drag observed), instabilities → the fig-2 cube returns with vortex shedding, turbulence vs laminar, Reynolds number (the post's only equation), a viscosity table, then back to particles: a Lennard-Jones two-molecule collision toy and momentum exchange between fast/slow layers; no-slip explained by surface roughness at molecular scale. "Let's leave the world of particles behind for the last time."
9. **Boundary Layer** (figs 67–76). Zoom into the plate; 99% BL definition; velocity profiles with a white "steepness" line ∝ skin friction; **favorable/adverse pressure gradients**; adverse gradient reverses near-wall flow → separation → stall finally explained by replaying the stall demo (fig 72 = fig 55 revisited); turbulent BL, golf-ball dimples; demystification: a tilted **flat plate also makes lift** — "An airfoil-like shape is not a requirement for lift generation."
10. **Airfoil Shapes** (figs 77–81). Thickness slider; breaking symmetry (camber) creates lift at 0° AoA — "we finally recreated the asymmetric shape we first saw on the airplane in the early sections"; laminar-flow airfoils (moving the pressure "pit" aft); supercritical/supersonic mentioned and declined; 3D-wing caveat.

### Concept sequencing and why it works

Order: **representation → velocity-as-average → reference frames → pressure-as-collisions → gradient-as-force → self-consistency constraint → emergent pressure field → lift/AoA/stall (observed) → viscosity → boundary layer → stall (explained) → shape design.**

Why this order works:

- **Just-in-time introduction.** Viscosity — the thing most fluids courses front-load — arrives at 66% of the post, only after stall creates a *need* for it: "to understand how these effects arise we have to talk about a property that affects the flow of every fluid: viscosity." Lift is fully derived from an effectively inviscid pressure argument first; viscosity exists to explain lift's *failure*.
- **The reader is the solver before the equation is named.** The manual pressure-tuning sequence (figs 43–47) makes you perform relaxation-to-equilibrium by hand; NS then arrives as "the formalization of what you just did," not an alien PDE: "The quite informal description of these balances that I've presented can be formalized mathematically using the Navier–Stokes equations."
- **Two micro→macro bridges, then explicit abandonment.** Velocity and pressure are each grounded in particle statistics, and each time he formally cashes out: "This fact lets us abandon the molecules and their collisions yet again." This licenses continuum language without hand-waving what fields *are*.
- **Misconception-proofing by omission.** Verified by grep: the words **"Bernoulli," "streamline," "circulation," and "equal transit time" appear ZERO times** in 14,500 words about lift. He never says streamline — markers leave "ghosty historical trails" (pathlines) instead. Lift is *only* the surface integral of a self-consistent pressure field. His Further Reading confirms this is deliberate: he praises McLean's book for "showing that many popular explanations of the origins of lift are either incorrect or they're based on merely mathematically convenient theorems."
- **Failure states are curricular.** The wrong (made-up) pressure field, the too-high/too-low slider positions, and stall are all shown *before* their resolutions.

### Equations / math handling

Essentially equation-free. Full inventory: stagnation pressure "proportional to the square of that velocity" (words only); the Reynolds number Re (one displayed relation; symbols μ, u, ρ, L each introduced in prose first); viscosity units Pa·s with a comparison table. Navier–Stokes is **named twice, displayed never**, with the workload routed to Further Reading (Lorena Barba's "12 steps to Navier-Stokes," Tony Saad's CFD lectures). Substitutes for math: (1) interactive hand-tuning of fields, (2) a repeated verbal feedback-loop template ("If the pressure is too low… If that pressure is too high… The system balances itself yet again" — used 3× for nose/top/rear), (3) empirical plots (lift vs AoA) instead of formulas, (4) the pressure-landscape/marble analogy standing in for ∇p.

### Visualization choices

- **Velocity field**: arrows fixed in space, length ∝ speed, deliberately sparse ("I'm also not packing the arrows as densely as the blades of grass… but every point in the flow has its own velocity"). Honest about scaling: "I adjusted the lengths of the arrows to prevent them from visually overlapping, but I also made sure to maintain their relative lengths."
- **Pathlines**: user-droppable markers with ghost trails ("you can click anywhere in the flow to drop a marker") — exploration affordance flagged by "a little hand symbol in the bottom right corner."
- **Speed**: brightness colormap "at the cost of the directional information," with arrows overlaid when needed.
- **Pressure**: red-intensity map → re-referenced diverging red/blue gauge map → contour lines ("very similar to lines of the same altitude… on maps") → 3D landscape. Four escalating representations of one field, each motivated by a defect of the previous.
- **Forces on the body**: per-surface-element arrows → single net arrow → lift/drag decomposition. Same arrow grammar from the tiny particle cube to the airfoil ("They're the exact same arrows that we've seen acting on the walls of the tiny yellow cube, here we just see them at a larger scale").
- 3D only where irreducible (particle cubes, landscape); the flow itself always 2D.

### Confessed simplifications (verbatim)

- "Thankfully, the air flows we'll consider in this article will be two dimensional and the simple flat drawings will suffice."
- "This asymmetric design is very important, but right now it will needlessly complicate our discussion."
- "the computer models used here are quite simplified and they don't reflect the full richness of physics involved in the motion of air. These slow-motion demonstrations are intended to present the broad strokes of the delicate interaction between the air and the airfoil, but **I would advise against relying on them when building an airworthy airplane**."
- "We can get some, albeit a bit hand-wavy, understanding by observing what happens to the air markers when those negative regions are missing."
- "if it makes things easier for you, wherever you see the word momentum you can think of velocity, but in more complex scenarios these differences can matter."
- "While I can't easily simulate it here, with further decrease in viscosity, the flow can develop full featured turbulence."
- "Be aware that what you're seeing here is a very simplified simulation of a turbulent boundary layer. Turbulence is inherently three dimensional… extremely computationally expensive to evaluate in detail."
- "Supersonic flows of air are more complicated than what we've explored in this article, as variations in density and temperature become an important component."
- "Real airplanes are three dimensional and the overall shape of the wings also significantly affects the lift and drag."

Skipped entirely (never even named): Bernoulli, circulation/Kutta condition, streamfunction/streamlines, compressibility (constant density assumed), induced drag/wingtip vortices, downwash/Newton's-third-law accounts of lift, any lift coefficient or real-world magnitude.

### Hook and payoff figures

- **Hooks**: fig 1 (hero airfoil + AoA slider) and fig 2 (viscosity cube — "vastly different effects" from one slider). Fig 2 is a planted long-range payoff, resolved at fig 63 (vortex shedding explained by viscosity).
- **Intellectual payoff**: figs 53–54 (lift-vs-AoA curve, then its plateau and collapse — stall), because everything before builds the machinery to read that plot, and everything after explains its failure region.
- **Narrative payoff**: fig 78 — the camber slider that "finally recreated the asymmetric shape we first saw on the airplane in the early sections of this article." The post is a ring: hero shape shown → simplified away → re-derived from first principles.

---

## PER POST

### AIRFOIL (2024-02-27) — 14,495 words, 81 figs, 179 w/fig, 10 sections, 67 controls
- **Opening**: "The dream of soaring in the sky like a bird has captivated the human mind for ages. Although many failed, some eventually succeeded in achieving that goal." — *romance-of-the-familiar hook*, followed immediately by the "familiar thing is secretly puzzling" turn ("we take air transportation for granted, but the physics of flight can still be puzzling").
- **Arc/escalation**: see deep dive. Escalation unit = one missing explanatory ingredient per section, each section ending with a forward hook.
- **Ending**: "I hope this deeper, technical exploration of airfoils hasn't diminished your appreciation of the greatness of flight. Perhaps paradoxically, by seeing how all the pieces fit together, you'll find the whole thing even more magical." — *re-enchantment close*.
- **Voice fingerprints**: "The air somehow senses the presence of the body." / "And when we do just that, from all the chaos emerges order." / "For most distributions of pressure, the air markers will flow right through the body. This is clearly wrong!"

### SOUND (2022-10-18) — 7,950 words, 48 figs, 166 w/fig, 6 sections, 45 controls
- **Opening**: "Invisible and relentless, sound is seemingly just there, traveling through our surroundings to carry beautiful music or annoying noises. In this article I'll explain what sound is, how it's created and propagated." — *direct-promise hook*, then a **participatory** hero figure: a playable keyboard in fig 1 (the reader makes the phenomenon before any theory).
- **Arc**: Air (particle cubes → pressure) → Making Sounds (plate in tube; pops → frequency → waveform addition → interference → draw-your-own waveform → timbre) → Pure Tones (sine from rotating circle → beats → Fourier decomposition, "invert this process" → live microphone spectrum) → Masses and Springs (1 mass → 2 masses/normal modes → 5 → string limit → harmonics → pluckable string → real instruments) → Pressure Waves (sphere radiator → piston → directivity → speed of sound, SPL/decibels, Doppler, two-speaker interference, echo, reverb). Escalation = synthesis→analysis→sources→propagation; the keyboard recurs in ~15 figures as the constant instrument.
- **Ending**: "I find it fascinating that the most irritating noises and the most inspiring music are driven by the same phenomena – it's only the underlying shapes and magnitudes of their pressure waves that make them sound so distinctively different." — *unification close*.
- **Voice fingerprints**: "It's only after some lucky aromatic particles manage to bounce into the vicinity of your nose that you get to experience the smell." / "it's quite astonishing that our ears pick up differences that small." / "The speaker is completely unaware of what's going on – it just keeps emitting the sounds at the same frequency."
- Notable device: hardware honesty — "Unfortunately, we're hitting the limits of frequencies we can easily display on a screen… from this point on I'll significantly slow down the motion of the plate."

### NAVAL ARCHITECTURE (2021-07-27) — 4,915 words, 47 figs, 105 w/fig, 9 sections, 47 controls
- **Opening**: "When I first heard the term naval architecture I thought it was the artistic practice of designing beautiful boats. It turns out it's a proper scientific discipline dedicated to the engineering of ships." — *personal-misconception hook*, the only one of the four that opens autobiographically.
- **Arc**: Pressure (syringe → P=F/A → P=ρgh derived stepwise → Pascal's law/barrel) → Buoyancy (arrows → Archimedes derived → subdivision argument for arbitrary shapes → tilt/torque) → Hull (hollowed steel block; ship-part vocabulary dump) → Stability (righting arm, stability curves, metacenter) → escalating destabilizers: Cargo (height → lateral offset → **sliding cargo**) → Free Surface (tanker sloshing; compartments fix) → Waves (roll resonance) → Propulsion (propeller derived from first principles: paddles → blade angle → radial velocity variation → twist → helicoid → blade count → cavitation). Escalation = static → dynamic threats, then a self-contained design mini-story.
- **Ending**: "Both traditional and naval architects have to devise functional, safe, and habitable structures. However, naval architects face the additional challenge of designing for an ever-changing setting for their creations – the harsh and unpredictable sea." — *dignify-the-discipline close*.
- **Voice fingerprints**: "While Pascal himself possibly never performed that experiment, some modern recreations have been successful." / "A tanker ship can be used to carry chemicals, crude oil, or even orange juice." / "if we let this heavy box slide the results can be truly catastrophic."
- This is the math-heaviest post relative to size: two full algebraic derivations (hydrostatic pressure, Archimedes) done by substitution with a highlighted term carried between equations.

### MOON (2024-12-17) — 16,292 words, 120 figs, 136 w/fig, 9 sections, 117 controls
- **Opening**: "In the vastness of empty space surrounding Earth, the Moon is our closest celestial neighbor. Its face, periodically filled with light and devoured by darkness, has an ever-changing, but dependable presence in our skies." — *poetic hook*, then an intentionally overwhelming full simulator: "This may all feel quite overwhelming at the moment, but we'll eventually see how all these pieces fit together" — the show-the-ending-first move.
- **Arc**: Motion in Space (2-body sandbox → gravity law → barycenter → ellipse vocabulary → angular momentum via spinning-bar) → Moon and Earth (real orbit; sidereal + anomalistic months; apsidal precession) → Eyes on the Heavens (projection geometry, angular size, librations — teaches *observation* as a skill) → Gravity at Scale (1,200-body accretion sims → why planets are round/spin/differentiate → giant-impact hypothesis → tidal forces → tidal locking via bar-and-ropes torque analogy → ocean tides on a water world) → Moon, Earth, and Sun (ecliptic, nodes, draconic month, nodal/axial precession, Cassini's law) → Sunlight (solar day, synodic month, phases, eclipses of 2024/2023/2022, earthshine) → Lunar Surface (craters, maria, regolith) → Lunar Brightness (opposition surge → shadow hiding → full wave-optics coherent backscattering finale). Escalation = add one body or one effect at a time; the four lunar months are distributed as section payoffs.
- **Ending**: "Perhaps the next time you catch a glimpse of the Moon's shiny surface beaming in the night sky, you'll see it a little differently – not as a mundane fixture of the heavens, but as a fellow companion that gently affects our own existence." — *re-enchantment close*, same "Perhaps the next time" formula as airfoil's "Perhaps paradoxically."
- **Voice fingerprints**: "It may be barren and dull, but, undeterred by its own lifelessness, it never leaves us completely alone." / "the observer's Moon-facing rotation can make things pretty nauseating outside of the poles." / "The simple rule for remembering which apsis is which is that apoapsis is the one that's farther away."

---

## CROSS-POST SYNTHESIS

### Voice fingerprint (quote-backed)

1. **"We" as expedition, "I" as stagehand, "you" as witness.** "We" does the physics ("we'll build some intuitions"); "I" only ever builds/adjusts demos ("I'm drawing the markers as visible dots," "I steadily release a whole line of them"); "you" observes and is *predicted* ("You've probably felt this many times by sticking your hand out the window").
2. **"Let's" is the master transition** — 49 occurrences in airfoil alone; sections and paragraphs launch with "Let's take a look / Let's pause for a second / Let's quantify."
3. **Present tense, live-event framing.** Phenomena happen to the reader now: "We're witnessing flow separation"; "You're witnessing the motion of over twelve thousand air particles."
4. **Phenomenon first, name second — always.** The construction "…is known as X" appears 42 times across the corpus (8 airfoil, 7 sound, 7 naval, 20 moon): "What we're witnessing here is known as a stall"; "This sticking behavior is known as the no-slip condition." A term is never introduced before its referent has been seen in a figure.
5. **He narrates his own representational choices and their distortions.** "To make that central arrow visible, I'm making it much larger than the tiny arrows"; "the distortion you're playing with here is vastly exaggerated"; "The red and blue colors make it look like pressure is changing a lot, but in practice these variations are minuscule." Trust is built by confessing the lie in every visualization.
6. **Pre-empting reader misperception is a signature move.** "Don't be misled by the frozen arrows, the wind is actually blowing there"; "This is not a mistake – even with hurricane-level wind speeds it's very hard to see any difference"; "Don't be misled by what you see here – the Earth is still rotating."
7. **Hedged honesty as a register**: "albeit a bit hand-wavy"; "It's not super realistic, but this simplification will help illustrate"; "a decent representation"; "at least in principle."
8. **Deadpan humor, ~2–3 times per post, never jokey**: "I would advise against relying on them when building an airworthy airplane"; "crude oil, or even orange juice"; "pretty nauseating outside of the poles"; "one might get cold from a fast blowing wind regardless of the direction from which that wind is coming."
9. **Awe carried by numbers, not adjectives alone**: "an astonishing 1030 mph"; "roughly ten billion collisions per second"; "everything happens 11 billion times slower than in real life"; "410 quintillion, or 4.1×10²⁰ particles."
10. **Exclamation marks reserved for genuine physical surprise** (≈3 per post): "This is clearly wrong!"; "no sound gets emitted!"; "causing it to rotate even further!"
11. **Transitions are physical camera moves**: "Let's zoom away from the world of microscopic particles"; "let's raise above the ground"; "Let's jump back onto the surface of Earth"; "Let's leave the world of particles behind for the last time."
12. **Everyday-experience anchors, one per concept**: hand out car window (relative wind), spoon in honey (viscosity), perfume across a room (mean free path), lightning delay (sound speed), airplane engine beats (interference), desk-chair spin (angular momentum), golf-ball dimples (turbulent BL), kayak lean (angle of list).
13. **Explicit promissory notes and paid debts**: "we'll get back to these soon"; "we'll discuss it soon enough"; "the demonstration that brought us here in the first place"; "Let me bring up the previous demonstration one more time." He keeps visible books on what's owed.
14. **What he never does**: no rhetorical quizzes; no "obviously/simply/it's trivial"; no pop-culture references or memes; no external links mid-flow (references quarantined to a Further Reading section that reviews each source in 2–3 sentences); no equations with unexplained symbols; no second person imperatives that assume knowledge; analogies never leave the physical world (they're always simpler *mechanical systems*, usually given their own interactive figure — tennis balls, marble on landscape, bar on ropes, swarm of bees).
15. **Openings are cold, atmospheric, two-sentence; endings are ~3-sentence re-enchantments** with a shared formula: "Perhaps paradoxically… even more magical" / "Perhaps the next time you catch a glimpse…"

### Design grammar

- **Persistent protagonist objects.** Airfoil: the yellow cross_section persists through ~40 figures; the gray cube is a planted payoff (fig 2 → fig 63). Sound: the plate and the 3-key keyboard recur in ~15 figures. Naval: one brick, one wooden block, one hull carried through. Moon: the yellow/teal body pair from the first sandbox persists into real Earth-Moon physics; a draggable observer figurine appears in ~20 figures. New concept ≠ new object; new concept = new overlay on the same object.
- **Knob discipline: ~1 control per figure** (0.83–1.00 across posts). Slider #1 is almost always time-speed; slider #2 is the single physical parameter under study. Never more than 3 controls. Slow-motion is the default epistemic tool ("slow down time, you'll be able to see how each marker just moves in the direction of the arrows").
- **Colored vocabulary is a namespace shared by prose and canvas.** 51→180→351→605 spans across the four posts chronologically; airfoil uses 41 distinct classes, moon 47. Words like {lift|lift}, {pn|negative}, {gradient_word|adverse pressure gradient} are ink-linked to the pixels they name — the prose is a legend for the figure and vice versa. Even *within-sentence lists* get distributed coloring ("{c0|the} {c2|four} {c1|colored} {c3|lines}").
- **Figure reuse with overlays**: the same scene appears 2–4 times gaining arrows → markers → colors → force decompositions (airfoil figs 22/23/24; 49/50; 55/72). Cheap for the author, powerful for the reader: representation change is isolated as the only variable.
- **Split-screen dual reference frames**: ground-camera/car-camera; sky-view/space-hemisphere pairs in moon (paired FIGURE mounts, e.g. sky6+hemi1, appear 12+ times); waveform-drawn/waveform-decomposed in sound. Same event, two coordinate systems, simultaneously.
- **2D by default, 3D only when irreducible** (particle cubes, pressure landscape, orbital planes, propeller twist, BRDF spheres), always with drag-to-rotate.
- **Failure states are playable**: sliders deliberately extend into wrong regimes (pressure too high → markers reverse; cargo too high → capsize; AoA too high → stall). The reader finds the boundary by crossing it.
- **Reader-respect furniture**: metric/imperial toggles, click/tap adaptive text, "restart" buttons, locate-me button (moon), volume warnings (sound), scale bars in the corner.

### Pedagogy patterns

1. **Representation before physics.** Airfoil spends its entire first section on *how to see* flow; moon has a whole section ("Eyes on the Heavens") on how to see the sky. Nothing moves until the reader can read the display.
2. **Micro→macro, established then formally dismissed**: "What we've simulated at a micro scale and in slow motion as countable, individual interactions, very quickly smooths out into a uniform and uninterrupted notion of force-exerting pressure. This fact lets us abandon the molecules…"
3. **Broken-version-first**: the fabricated pressure fields ("Our mistake was that we completely ignored any interactions between the pressure of the air and the motion of that air"); sound's three-pop keyboard is deliberately inadequate ("Three pops of different loudness is not much to create music with"); moon opens with an overwhelming simulator that the whole article then earns.
4. **Reader-as-solver**: hand-tune the field, then learn nature does it automatically, then learn the math has a name. Also naval's propeller: reader watches paddle orientation fail before the twist is derived.
5. **Simplify-then-refine with explicit contracts and closed loops**: symmetric airfoil borrowed with a stated reason, asymmetric returned at the end; sound's tube plate declared "a little simplified as it doesn't match the behavior of typical instruments" and replaced by sphere and piston sources.
6. **Mystery-driven section chaining**: stall observed → "we have to talk about… viscosity"; librations observed → "It's finally time to investigate how the Moon got locked into that motion." Nearly every section ends with a forward hook, not a summary.
7. **Verbal feedback loops as ODE substitutes**: the "too low → X, too high → Y, settles to equilibrium" template appears 3× in airfoil and again for tidal bulges in moon.
8. **Quantify only after intuition**: viscosity numbers arrive after six viscosity demos; decibels after the reader has *heard* amplitude; Moon distances after orbits have been played with.
9. **Cross-post curriculum reuse**: sound (2022) built the air-particle/pressure kit that airfoil (2024) redeploys nearly demo-for-demo (particle cube, collision flashes, pressure-as-collisions); naval covers hydrostatic pressure, airfoil dynamic pressure. He re-teaches rather than links, keeping each post self-contained.

### Math handling (corpus-wide)

Equations appear iff they are ≤4 symbols, every symbol has already been *seen* in a figure, and each term gets a colored span mapping it back ("Let's unpack this equation" — SPL in sound; F=Gm₁m₂/r² in moon with a "very brief mathematical interlude" apology; P=ρgh derived by substitution in naval). PDEs and anything requiring calculus are **named, credited, and outsourced** (Navier–Stokes → Barba/Saad in Further Reading). The corpus-wide replacements: interactive equilibria, feedback-loop prose, empirical plots, and analogy systems. Naval (shortest, earliest) is the most algebraic; airfoil (the fluids post) is the *least* — a deliberate signal that fluid math is the one place he refuses to fake tractability.

### Critique — honest weaknesses

1. **Enormous unchunked commitment with no waypoints.** 14.5k–16.3k words, 81–120 figures, zero recaps, zero summaries, no "what you now know" checkpoints. A reader who bails at airfoil's Pressure section (~40%) has seen no lift at all; the payoff density is heavily back-loaded (first lift at fig 52 of 81, ~65% in).
2. **Slow ramps punish knowledgeable readers.** Seven figures of grass before any airfoil; 20+ moon figures before anything Moon-specific; sound and airfoil re-teach the identical particle-cube material. There is no lane for a reader who already knows what a vector field is.
3. **No quantitative exit capability.** After 14.5k words the reader cannot compute anything: no Bernoulli, no lift coefficient, no real magnitudes ("For this airfoil, the pressure drag is very tiny" — how tiny?); the lift-vs-AoA plot has effectively unlabeled axes. Superb intuition, zero engineering traction — a gap a Navier–Stokes lesson can deliberately exceed by keeping his sequencing but cashing out in the actual equations.
4. **Simulation epistemics are opaque.** "The computer models used here are quite simplified" is honest but unfalsifiable: he never says what the solver is, so the reader can't distinguish physics from numerical artifact (e.g., is the fig-48 pressure oscillation a real instability or solver noise?). The confession shields him without informing.
5. **Agency is uneven — many figures are movies with a speed knob.** The standout demos (draggable pressure blobs, droppable markers, drawable waveforms, pluckable string) are a minority; long stretches, especially in moon, are watch-only with a time slider, and the interaction is ornamental rather than hypothesis-testing.
6. **The color-coding system is load-bearing and fragile.** 351–605 colored spans bind prose to canvas; in any degraded medium (print, screen readers, colorblindness, text extraction — as these very files show) the binding vanishes and sentences like "the {c0|angle} between {c2|that} and the {ascending|ascending node}" lose their referents. Sound additionally fails silently without audio.
7. **No retrieval structure.** Pure linear exposition: no exercises, no self-tests, nothing designed for a second visit; terms defined once mid-flow are hard to relocate later (moon's four lunar months are scattered across four sections with no consolidating table).
8. **Endings under-deliver relative to the buildup.** The Final Words sections are 2–3 paragraphs of re-enchantment with no synthesis of the causal chain just constructed — the one place a diagram-of-everything (pressure↔velocity↔shape) would land, he goes lyrical instead.

### Most transferable lessons for a Navier–Stokes lesson

(1) Teach the *representations* of fields before the fields; (2) ground velocity and pressure in particle statistics once, then formally abandon the particles; (3) let the learner hand-tune a field against self-consistency constraints so NS arrives as the formalization of something they already did; (4) delay viscosity until an observed failure (separation/stall/shedding) demands it; (5) one knob per figure, time-dilation as the default instrument, persistent protagonist objects, confessed distortions; (6) plant an unexplained hero demo up front and resolve it late — then go beyond him by actually cashing out into the equations he only names.