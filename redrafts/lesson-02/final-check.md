# Final Check — lesson-02-reimagined.mdx

Verification audit before the draft replaces `src/lessons/lesson-02-fiber-bundles.mdx`.
Line numbers refer to `redrafts/lesson-02/lesson-02-reimagined.mdx` as audited
2026-07-30. Sim claims verified against `src/sims/` source (ConnectionWave.tsx,
UniversalWaveMachine.tsx, HeroEMWave.tsx, lib/awave.ts). Facts verified by web
against Arnold & Khesin, ESO, Nature 2002, and Bristol Corn Exchange sources.

Verdict shorthand: LANDED (ledger entry applied correctly) · CLEAN (new prose passes
all slop families) · MUST-FIX (apply the exact replacement given) · CONFIRMED /
CORRECTED (fact checks).

---

## A. LEDGER COMPLIANCE (slop-critique.md spot-check, 16 entries sampled)

- 45–47 -> LANDED — Part 2 entry 1 (thesis recast) applied verbatim.
- 99–104 -> LANDED — Part 2 entry 2 ("is known as" triple broken; the five scattered
  later uses at 136, 151, 388, 524–525, 627 stand, as instructed).
- 208–209 -> LANDED — Part 2 entry 3 ("we will see" removed; planted as fact).
- 214–215 -> LANDED — device A2 (formula-energy confession frame killed, fact kept).
- 274–279 -> LANDED — Part 2 entry 4 (ConnectionTuner sentence split, no content change).
- 295–298 -> LANDED — Part 3 proposal 9 (adaptive optics splice); the covariant-derivative
  introduction that follows is preserved except "Thankfully" -> "instead", which the
  splice necessitates. Kinship guard respected (no "is just a covariant derivative").
- 329 -> LANDED — device E3 ("hereby paid in full" ceremony removed).
- 361–364 -> LANDED — device E4 ("One debt is due at the door" removed).
- 448–450 -> LANDED — Part 2 entry 5 (drumroll cut; both-ways guard holds: nothing
  stands between the loop-meter verdict and the heading).
- 492–497 -> LANDED — Part 2 entry 6 / Part 3 proposal 3 full-cut variant: RegaugeBrush
  replay, DictionaryReplay, and second HolonomyLoop mode="field" all removed; the fold
  paragraph carries exactly the three load-bearing facts (schematic time row + 4D
  contract; gauge/Weyl word history; violet map = magnetic field) and has not grown a
  fourth. Device kills C3, C4 confirmed dead.
- 576–583 -> LANDED — Part 2 entry 8 / proposal 6 (postulate image; correspondence
  labeled, never "just"; relativity rider collapsed to one sentence).
- 600–605 -> LANDED — Part 2 entry 9 (aphorism recast to working definition).
- 607 -> LANDED — Part 2 entry 10 (railway "rhyme" parenthetical cut clean).
- 678–682 -> LANDED — Part 2 entries 11 + 12 (flat opening; paragraph ends on the
  champion; both stacked aphorisms cut).
- 708–710 -> LANDED — device D content relocated to stop one as drafted.
- 764–789 -> LANDED — Part 2 entry 15 / proposal 7 as amended: three beats, weather
  bound promoted with its number, LinkedRings handoff, Schrödinger's-Smoke sentence and
  "I would rather say so" verbatim. Amendment (a) applied with a variation: the ledger
  suggested "cashed out as a deadline," the draft prints "expressed as a deadline" —
  flatter still, and it avoids doubling "cashed" (already used at 529). Accept.
- 858–863 -> LANDED — Part 2 entry 16 (coda recast).

No sampled entry failed to land. Part 3 proposal 1's own guard ("the sim must actually
show dispersion at stop two before the prose claims it") is satisfied in source:
`PRESET_M.phase = 0.22` (UniversalWaveMachine.tsx:673) with `drawEnvelope` drawing the
dashed |ψ| envelope ("dispersion made visible when μ > 0", line 335).

## B. NEW-PROSE SLOP SWEEP

Every paragraph that differs from the original was checked against SLOP.md families
1–19. Findings:

- 86–91 (stadium wave) -> CLEAN on slop (flat declaratives, numbers-as-dessert, the
  banned shared-"up" audit clause correctly absent per amendment 8) — but two
  mechanical spelling defects and one fact correction, both listed below (MUST-FIX 4, 5).
- 201–206 (Bristol clock) -> CLEAN — flat delivery, no "fascinatingly," tie-in sentence
  present per the cut-the-clock-if-cut guard. Facts verified (section D).
- 295–298 (adaptive optics) -> CLEAN — "a hopeless occupation. This is a real
  occupation:" is a one-off echo, not a coined device.
- 576–583 (postulate image) -> CLEAN — family 16 guard holds (correspondence, no "just").
- 625–626 (pluck plant) -> MUST-FIX — figure-honesty violation, see section C.
- 716–724 (stop two) -> MUST-FIX — the known interaction defect, see section C.
- 731–737 (stop three) -> CLEAN — CRT anchor is auditable household physics; needle-length
  fact delivered frame-free per A9.
- 781–783 (weather closing) -> CLEAN — flat form; the article's "not X — it is Y" count
  did not grow.
- Aphorism budget -> PASS: the champion (681–682) stands alone; 603–605 and 861–863 are
  working prose / coda lyricism, per the critique's accounting.
- No new staged reveals, no promissory tone, no X-is-just-Y rebrands, no new recurring
  device coined anywhere in the new prose. The four stop-leads are each phrased
  differently (no replacement caption template).

## C. FIGURE-CLAIM HONESTY (checked against src/sims/ source)

- 45–47 (HeroEMWave thesis line) -> CONFIRMED HONEST — HeroEMWave.tsx: one leapfrog
  state array (lib/awave.ts); top-pane arrows drawn from `wave.e` / `wave.b`
  (derivatives of A); bottom-pane clocks render A itself via the parallel-transported
  needle, with no E/B readouts. "Two readings taken off a single hidden quantity" and
  "that quantity, drawn without its meters" both bind to source.
- 617–618 -> MUST-FIX (carried from the published baseline, fails the same test):
  "you can drag one point of the blue curve and let go" describes an interaction the
  figure does not support. ConnectionWave.tsx 'pluck' mode plucks instantly on
  `onPointerDown` with a fixed raised-cosine kernel (awave.ts `pulse`, fixed half-width,
  fixed amplitude `PLUCK_AMP`); there is no drag-follow and no release event. The sim's
  own caption reads "tap or click anywhere to pluck the connection."
  REPLACEMENT (lines 617–618): "Now you can make one yourself. Below is a stretch of
  frozen <C k="conn">$A$</C>; tap anywhere on the blue curve to pluck it:"
- 625–626 -> MUST-FIX: "Draw a different bump and pluck again: the speed never changes,
  and neither does the shape — whatever you draw, the pulses carry it undistorted."
  The reader cannot draw a bump: the pluck kernel's shape and amplitude are fixed in
  source; only the pluck position is the reader's. The checkable facts are: repeated
  plucks anywhere, same speed every time, and pulses that hold their shape as they run
  (d'Alembert; the source notes the scheme's numerical dispersion is invisible for
  this kernel).
  REPLACEMENT: "Pluck again, anywhere along the line: the speed never changes, and
  neither does the shape — every pulse carries its bump undistorted."
  (This preserves proposal 2's shape-holding plant, which stop two's payoff needs.)
- 716–718 -> MUST-FIX (the mandated known defect): "Pluck this stop the way you plucked
  the wire" — UWMPreset (UniversalWaveMachine.tsx:675–697) has no pluck interaction;
  its only control is the time-speed slider, and the packet auto-launches at creation
  (`makePsi` seed). "The string's pulses kept whatever shape you drew" also overclaims
  drawing (see 625–626). The string preset's packet observably holds its shape
  (μ = 0, smooth Gaussian seed, periodic base), so the contrast survives as observation.
  REPLACEMENT (lines 716–719, through "...smearing as it goes."): "Watch the packet
  this stop launches: it comes apart as it runs. The string stop's packet holds its
  shape — and so did the pulses you plucked with your own hand a section ago — but
  this one rots, sharp features outrunning slow ones, the packet smearing as it goes."
  Keep the rest of the paragraph (719–724: "The mass $\mu$ on the fiber is what does
  it..." through the Klein–Gordon parenthetical) verbatim. Same length or shorter;
  shape-rot fact, string contrast, mass-μ attribution, and the electron number all
  preserved; no announcement, no new device.
- 731–737 (stop three) -> CONFIRMED HONEST — charged mode uses a frozen background A
  bump (`bumpLinks`, drawn as "frozen scenery"); path-bend/fringe-slide claims are the
  confirmed sim facts. Needle lengths: `drawPhasorRow` needle length = |ψ|, confirmed.
- 739–743 (stop four) -> CONFIRMED HONEST — the staged amber-to-blue crossfade
  (`swapT`, `lerpAmberBlue`, equation `slot()` crossfade) makes "the figure says so at
  the moment the dial lands" checkable and true.
- REMOVED-FIGURES CHECK -> PASS: no prose refers to DictionaryReplay, the RegaugeBrush
  replay, or the second HolonomyLoop. "The selector walks the four forces" (759) refers
  to WhichForce, which is present. "The sealed core replayed as dynamics" (733) is a
  concept callback, not a figure reference. DictionaryReplay import removed; no unused
  imports remain.

## D. FACT CHECKS

- 776–783 Arnold weather bound -> CONFIRMED. Arnold & Khesin, *Topological Methods in
  Hydrodynamics* (torus/trade-wind model): "the deviations grow by the factor of 10^5
  in 2 months," making dynamical forecasts for the period "practically impossible."
  The draft's "multiply by roughly a hundred thousand over two months" matches the
  book, "roughly" is the honest hedge, and "costs digits of accuracy" is safe (2.5
  digits/month). Note: some modern recomputations get larger factors (10–12 digits per
  two months); the draft cites Arnold's own number, which is correct sourcing.
- 201–206 Bristol Corn Exchange clock -> CONFIRMED on every detail: two minute hands,
  just over ten minutes apart (Bristol at 2°35' W ≈ 10 min behind); red hand = GMT /
  railway time, black hand = Bristol local — the draft's "black for the city's own
  sun, red for the railway's convention" is the right way round; the noon train
  departing 11:49 by local reckoning is the standard sourced example; Bristol adopted
  GMT 14 September 1852, years after railway time reached the city (GWR 1841), so
  "ran both zero-marks side by side for years before conceding" holds.
- 86–91 stadium wave -> CORRECTED (one clause). Farkas, Helbing & Vicsek, Nature 419,
  131–132 (2002): speed ~12 m/s (20 seats per second) — confirmed; width ~6–12 m
  (~15 seats) — confirmed; trigger: "generated by the simultaneous standing up of not
  more than a few dozen people" (ETH video estimate 22 ± 3 seats/s is consistent).
  The draft's "two dozen people are enough to launch one" asserts sufficiency at a
  number the source does not give. MUST-FIX, replacement in the summary (entry 4).
- 295–298 ELT M4 -> CONFIRMED. ESO: 5,316 contactless actuators reshaping the mirror
  up to 1,000 times per second; M4 is the largest adaptive mirror built, so "the
  largest carries 5,316 handles and reshapes itself a thousand times a second" holds.
- 720–722 electron packet spread -> CONFIRMED by arithmetic: σ_v ≈ ħ/(mσ) =
  1.05e-34 / (9.1e-31 × 1e-9) ≈ 1.15e5 m/s; in 1 ns → 1.15e-4 m ≈ 0.1 mm; ratio
  ≈ 1.15e5 — "a tenth of a millimeter... a hundred-thousand-fold spread" is right.

## E. MDX INTEGRITY

- Imports: 19 named imports; all 19 used in the body; all paths resolve to files under
  `src/sims/`. No unused imports (DictionaryReplay import correctly removed).
- `C`, `Predict`, `Waypoint` are used without import — identical to the published
  original; they are provided globally from `src/components/Prose.tsx` via the MDX
  components mapping in `src/App.tsx`. Not a defect.
- KaTeX: 10 `$$` fences (5 balanced display blocks); 158 single `$` outside them
  (79 balanced inline pairs); no line carries an odd inline count that isn't a
  legitimate multi-line span (none found).
- Braces balanced (38/38); no `{/* */}` comments present; `<Predict>` opens and closes
  correctly both times; the `<table>` block is well-formed; all sim components
  self-close. No broken JSX found.

VERDICT: PASS (no integrity fixes needed).

## DEVICE BUDGET

- Confession family: exactly 3, at exactly the sanctioned sites — 155 (rope loaner,
  full strength), 508–509 (quantum-phase payoff echo), 843 (Feynman bookkeeping line,
  Further Reading). No synonym-swapped replacements detected ("caveat... cashed" at
  529 is the approved A4 replacement).
- "Boundary check": 7 of 7 kept (111, 169, 239, 304, 434, 503, 633–634), one per
  section, surface varied — the sanctioned instrument intact.
- Crime/prank: 1 full deployment (219) + the table-cell payoff (472); C3/C4 dead.
  Prankster (8 uses) and diary (5 uses) intact as coined vocabulary per the census.
- Debt/credit/IOU: E1 (50), E2 (157), E5 (684) kept; E3/E4 dead. "Wink": zero.
- New prose coins no recurring device: "cast in iron," "a real occupation," "rots"
  each fire once.

---

## MUST-FIX SUMMARY (apply exactly these, nothing else)

1. Lines 617–618 — replace the pre-figure sentence with:
   "Now you can make one yourself. Below is a stretch of frozen
   <C k="conn">$A$</C>; tap anywhere on the blue curve to pluck it:"
2. Line 625–626 — replace "Draw a different bump and pluck again: the speed never
   changes, and neither does the shape — whatever you draw, the pulses carry it
   undistorted." with:
   "Pluck again, anywhere along the line: the speed never changes, and neither does
   the shape — every pulse carries its bump undistorted."
3. Lines 716–719 — replace "Pluck this stop the way you plucked the wire, and watch
   the pulse itself: it comes apart as it runs. The string's pulses kept whatever
   shape you drew — you checked this with your own hand a section ago — and this one
   rots, sharp features outrunning slow ones, the packet smearing as it goes." with:
   "Watch the packet this stop launches: it comes apart as it runs. The string stop's
   packet holds its shape — and so did the pulses you plucked with your own hand a
   section ago — but this one rots, sharp features outrunning slow ones, the packet
   smearing as it goes."
   Keep the remainder of the paragraph (mass-μ sentence, electron number,
   Klein–Gordon parenthetical) verbatim.
4. Lines 90–91 — replace "and two dozen people are enough to launch one." with
   "and a few dozen people are enough to launch one."
5. Lines 87 and 89 — American spellings, matching the rest of the article:
   "a hundred metres of crowd" -> "a hundred meters of crowd";
   "nothing else travelling" -> "nothing else traveling".

## CLEAN (verified good — do not touch)

- The thesis recast at 45–47 (bound to HeroEMWave source).
- The stadium-wave paragraph's structure and its 20-seats-per-second / 15-seats-wide
  numbers (only the trigger-count clause and spellings change).
- The Bristol clock passage 201–206, including hand colors, 11:49, and "for years
  before conceding" — all verified.
- The adaptive-optics splice 295–298, including 5,316 and one thousand per second.
- The fold-in paragraph 492–497 (exactly three facts; do not add a fourth).
- The postulate paragraph 576–583 and both aphorism recasts (603–605, 861–863).
- The champion ending at 681–682, standing alone.
- Stop one (708–710), stop three (731–737), stop four (739–748) dial-walk prose.
- The Arnold weather beat 776–783, including "roughly a hundred thousand over two
  months" and "expressed as a deadline."
- The electron spread number at 720–722 (keep verbatim inside fix 3's paragraph).
- All device counts as tallied above; all seven boundary checks; the three confession
  sites; every entry in the slop-critique's "surveyed and spared" list, which the
  draft preserved intact.
- MDX import block, math delimiters, and JSX — no changes needed.

Sources used for section D: Arnold & Khesin *Topological Methods in Hydrodynamics*
(via dokumen.pub full text search result), ESO elt.eso.org M4 pages, Farkas–Helbing–
Vicsek Nature 419:131 (2002) + ETH COSS supporting page, secretbristol.com and Atlas
Obscura on the Corn Exchange clock.

---

## FIXES APPLIED — 2026-07-30

1. Applied — pre-figure pluck sentence (was 617–618): "tap anywhere on the blue
   curve to pluck it" replaces the drag-and-release claim, verbatim per ledger.
2. Applied — pluck-repeat sentence (was 625–626): "Pluck again, anywhere along the
   line... every pulse carries its bump undistorted" replaces the draw-a-bump
   overclaim, verbatim per ledger.
3. Applied — stop-two opening (was 716–719): "Watch the packet this stop launches..."
   replaces the pluck-this-stop defect, verbatim per ledger; mass-μ sentence,
   electron number, and Klein–Gordon parenthetical untouched.
4. Applied — stadium trigger count (was 90–91): "a few dozen people are enough to
   launch one."
5. Applied — spellings (was 87, 89): "metres" -> "meters", "travelling" -> "traveling".

Skipped: none.

Post-fix mechanical re-checks (section E): 19 imports, all used, all paths resolve
under src/sims/; 10 $$ fences (5 balanced blocks); 158 inline $ (79 balanced pairs);
braces 38/38; no odd per-line inline counts. Device budgets re-counted and unchanged:
confession 3 (155, ~509, ~843); boundary check 7 of 7 (the one at ~635 wraps
"Boundary / check:" across lines — present, single-line grep undercounts it);
prankster 8; wink 0; debt/credit/IOU 3; "rots" / "cast in iron" / "a real occupation"
once each; British spellings 0; all three overclaim phrasings ("drag one point",
"whatever you draw", "shape you drew") gone.
