# Final Check — Lesson 03 Reimagined Draft

Verification audit of `redrafts/lesson-03/lesson-03-reimagined.mdx` against the
published original (`src/lessons/lesson-03-navier-stokes-history.mdx`), the edit
ledger (`redrafts/lesson-03/slop-critique.md`), SLOP.md, and NICKS_VOICE.md.
All line numbers below refer to the DRAFT unless marked "original."

Verdict up front: the draft implements the ledger faithfully — every sampled kill
and rewrite landed, the device budget is exactly on spec, and the MDX is
mechanically sound. Three defects survive, all repairable with exact splices:
one figure-honesty regression (PressureOff caption reverted past commit 241a39a),
one unsupported historical specific ("cited Navier just once"), and one
overbound number (the 2.8×10⁸ Reynolds figure attached to the measurement act
instead of the channel).

---

## A. LEDGER COMPLIANCE (16 entries spot-checked)

| Ledger entry | Draft evidence | Verdict |
|---|---|---|
| Part 1 Device A kill — "he made it *earn money*" | L431 "he staked it on a measurement." | LANDED |
| Part 1 Device F kill — "the confession you first met" | L624–625 "the same open question the previous lesson ended on" ; `confess` grep = 0 hits | LANDED |
| Part 2 item 1 — Kolmogorov rewrite, all four amendments | L584–603: eve-of-war Doklady scene with both dates; −5/3 bound to wavenumber twice (L589–590, L598–599); Obukhov half-parenthesis (L590–591); flat "Moscow desk … far side of the world" close (L599–600); no winter/cold rhyme; no Leonardo callback; Heisenberg parenthesis moved after the measurement (L600–603) | LANDED |
| Part 2 item 2 — One Skeleton rewrite | L667–677: "History never had a syllabus, but it kept a rhythm."; "stop lying" preserved verbatim (L668); four-clause anaphora intact; table-of-contents homework and "why this course was born" both gone | LANDED |
| Part 2 item 3 — torch label deletion + splice | L499–501 splices exactly as specified; no replacement label | LANDED |
| Part 2 item 4 — two-hats cut + licensed flat closer | L144–145 "Newton's number stayed wrong for a hundred and twenty-nine years." (1687→1816 = 129 ✓) | LANDED |
| Part 2 item 5 — founding-object rewrite | L189–190 "The instrument was built *for a wave*: the string got its equation a decade before fluids got theirs." | LANDED |
| Part 2 item 8 — "Read that split honestly" | L506 "The split is a concession:" | LANDED |
| Part 2 item 9 — "Read the resolution precisely" | L548 "The resolution is stranger than …" | LANDED |
| Part 2 item 10 — "The instrument was contentious…" cut | L201 paragraph ends at "…hand-drawn curves." | LANDED |
| Proposal 2 — Poisson shot | L405–411 (but see MUST-FIX 2: one clause overshoots the source) | LANDED, needs trim |
| Proposal 3 — press barb | L335–336, quote verbatim, no gloss | LANDED |
| Proposal 4 — Saint-Venant defense, "For all of it" | L417–422; strengthened clause carried | LANDED |
| Proposal 5 — Leray at the Pont Neuf, no Leonardo | L606–608, "the story goes" hedge intact | LANDED |
| Proposal 6 — Ladyzhenskaya one-clause | L618–619, single em-dash clause, two flat facts | LANDED |
| Proposal 7 — Newton ruling on his own case | L148–149, one sentence; anonymous Phil. Trans. self-review correctly kept out | LANDED |
| Proposal 8 — Pascal's second barometer | L74–76 + L82–83 flat close | LANDED |

No ledger entry failed to land. The Further Reading addition (L690–692) is the
flagged judgment call, ruled KEEP upstream — verified cite-shaped, not
promotional (see section B).

## B. NEW-PROSE SLOP SWEEP

Every sentence differing from the original was diffed out (word-level diff) and
checked against the 19 families. Findings:

- L74–76 (Pascal control) — concrete protocol, recognition unnamed, no
  family-16 label. "stare at it all day" is colloquial but auditable. CLEAN.
- L144–145 (flat count closer) — licensed by ledger Part 2 item 4, carries a
  number, not an aphorism. CLEAN.
- L148–149 (Newton self-ruling) — one flat sentence; the em-dash reveal is the
  fact's own shape, no suspects erected (family 17 pass). CLEAN.
- L405–411 (Poisson/Navier polemic) — register clean, no editorializing; one
  factual overshoot handled in section D / MUST-FIX 2.
- L417–420 (Saint-Venant defense) — quote-bearing, flat; final bridge beat,
  and no bridge-failure callback follows it (verified — see device audit). CLEAN.
- L584–603 (Kolmogorov block) — "The claim inside them:" is a flat colon
  delivery, not a staged reveal; "Coffee spoon or storm front" replaces the
  original's pair without new device vocabulary; "A rule written at a Moscow
  desk … far side of the world" is the ledger's own sanctioned flat version.
  No postcard, no coverage narration (family 18 discharged). CLEAN.
- L606–608 (Leray) — "the story goes" hedge does epistemic work (family 6
  pass); the Navier-bridge rhyme stays unspoken as required. CLEAN.
- L667–673 (One Skeleton) — "kept a rhythm" claims a rhythm, not an engine;
  approved as drafted upstream. "failed in plain sight" (L668) and "visible
  failure" (L673) echo mildly — below actionable threshold, not a family. CLEAN.
- L690–692 (Further Reading, Grant/Stewart/Moilliet) — "reports the Discovery
  Passage measurement in full, spectra and ship-handling both." Flat,
  cite-shaped, and "ship-handling" is literally a topic of the paper (§2,
  violent manoeuvres, drift logs). KEEP per upstream ruling. CLEAN.

No new significance announcements, staged reveals, X-is-just-Y rebrands,
promissory tone, new recurring devices, or aphorism overdrafts introduced.

### Device budget audit (counts)

- **"confession"**: 0 occurrences. ✓ (mandate: zero)
- **Resurrection vocabulary**: exactly the 3 sanctioned instances — L131
  ("come back to life"), L381 ("modern afterlife"), L448–449 ("survives in one
  place … quietly rehabilitated"). No fourth. ✓
- **Aphorism budget**: champion intact at L421–422 ("Eponymy is a lottery, and
  citing your rivals buys no tickets."); sanctioned edge-rider at L668 ("stop
  lying"); no third line of that shape added anywhere. ✓
- **Leonardo**: single mention, L88 (original passage). No new mention. ✓
- **Bridge callbacks after the Saint-Venant defense (L417–420)**: the only
  later "bridge" hits are L465 ("a bridge engineer's fictional molecules",
  Waypoint) and L701 ("a bridge engineer whose molecules were fiction", Final
  Words roll-call) — both pre-existing original text inside the untouchable
  Waypoint/roll-call, identity descriptors, not failure callbacks. ✓
- **Blank-slider frame**: plant L45–46, payoff L662–663, close L707 — as
  original. ✓

## C. FIGURE-CLAIM HONESTY

1. **L312–313 — PressureOff caption — MUST-FIX (regression).** Draft reads:
   "the <C k=\"div\">violet</C> counts off the cells where water is being
   conjured out of nothing or quietly destroyed." The published original
   (post-commit 241a39a, "fix PressureOff meter") reads "floods the places …
   destroyed — and each pane's meter averages that crime over its whole
   channel." The draft was cut from a pre-fix snapshot. Verified against
   `src/sims/PressureOff.tsx`: the sim draws a per-pane meter ("fluid created
   or destroyed: X% of a cell's volume each second") computed as the **mean
   |∇·u| over the pane** (lines 158–171), and the sim's own METER note (lines
   97–106) records that a cell-**counting** statistic read backwards and was
   replaced by the magnitude average. "Counts off the cells" is therefore the
   exact reading the figure was fixed to avoid, and the draft also orphans the
   on-screen meter. Replacement (L312–314), restoring the published text:

   > the <C k="div">violet</C> floods the places where water is being conjured out of
   > nothing or quietly destroyed — and each pane's meter averages that crime over its
   > whole channel. Both channels carry the same faint stickiness, which

2. **L81–83 — PascalMountain caption + new clause — CLEAR.** The figure-bound
   half ("about eight centimeters lower at the summit") checks against
   `src/sims/PascalMountain.tsx`: readout at 1465 m gives 760 − 675 = 85 mm ≈
   8 cm. ✓ The appended "the barometer at the base never moved" is past-tense
   historical (the 1648 control introduced at L74–76), not a claim about the
   figure, which shows one barometer riding the slope. Tense and referent keep
   it out of the figure's claim space. No change.

3. **Kolmogorov/GSM block (L584–603)** — describes measurements, not the
   WhorlsCascade figure; the WhorlsCascade caption itself (L582–583) is
   unchanged from the original. No new interaction claims anywhere else; all
   other figure captions are verbatim original.

## D. FACT CHECKS (web-verified)

1. **K41 Doklady dates** (L585–587) — **CONFIRMED.** First paper ("Local
   structure of turbulence," Doklady 30(4)) received 28 Dec 1940; third paper
   ("Dissipation of energy," Doklady 32(1)) received 30 Apr 1941 ("the last day
   of April" ✓). Invasion 22 Jun 1941 = 7.6 weeks after the third paper —
   "eight weeks" is a fair round. Academy evacuation east (to Kazan, summer
   1941) is standard history. No change.

2. **Grant, Stewart & Moilliet 1962** (L593–599) — **CONFIRMED except the Re
   binding.** Verified against the paper itself (JFM 12:241–268, full text):
   hot-film probe on a towed body ✓; Discovery Passage, west coast of Canada ✓;
   "The current in Seymour Narrows becomes as large as 15 knots" ✓ ("up to
   fifteen knots" ✓); "for a 12-knot tide, which is common, the Reynolds number
   in the Narrows is 2.8 × 10⁸" ✓ (280,000,000 ✓ as a *channel* figure);
   spectra "proportional to k^-5/3 for several decades in k" ✓ ("across decades
   of wavenumber" ✓); ship = research vessel *Oshawa*, "The overall length of
   the ship is 217 ft" (Figure 3 caption) — **217-foot CONFIRMED from the
   primary source** (the Algerine-class nominal 225 ft does not override the
   paper's own stated figure); "the scale of the turbulence is so large that a
   ship is carried about to a considerable extent by the energy-containing
   eddies" ✓ — the draft's "carried about by the thing it was measuring" is a
   faithful paraphrase. **CORRECTED — MUST-FIX 3:** the draft binds 2.8×10⁸ to
   the act of measurement ("and measured the turbulence at a Reynolds number of
   280,000,000"), but the paper's measurement runs were made between stations
   two and three "where the maximum velocity is about 3 knots"; the abstract
   claims Re "about 10⁸" for the measured flow, and 2.8×10⁸ is the Narrows at a
   12-knot tide. Rebind the number to the channel. Replacement (L593–596):

   > For twenty years that exponent lived on paper. Then a Canadian team towed a
   > hot-film probe through Discovery Passage, a tidal channel in British Columbia
   > where the sea runs at up to fifteen knots and the Reynolds number reaches
   > 280,000,000 — three orders of magnitude past any laboratory.

   ("Three orders past any laboratory" is supported: the paper's own comparison
   is Laufer's pipe at 5 × 10⁵.)

3. **Poisson's barb + Navier's reply** (L405–411) — **reply CONFIRMED, barb
   CORRECTED.** Darrigol (*Worlds of Flow* pp. 123–125): the polemic ran in the
   *Annales de chimie et de physique* ✓; Navier's reply is rendered almost
   verbatim — "It was he, Navier, who in 1821 'conceived the idea of a new
   question…'" and "The newer emphasis on a supposed rigor could only betray a
   desire to belittle his own achievement" ✓. Poisson did obtain "the absence
   of transverse pressures in the continuum limit" and "used this conclusion to
   dismiss Navier's theory" ✓ — the zero-elasticity barb is real. Two
   overshoots: (a) "he cited Navier just once" has no support in Darrigol (his
   "did not refer to Navier" remark concerns Poisson's separate 1831 *fluid*
   memoir, and the Annales polemic was a multi-round exchange); (b) "could not
   hold itself together" misstates the physics — zero rigidity means the
   material cannot hold a *shape* (it flows); it does not disintegrate.
   Replacement (L407–409):

   > polemic that ran through the Annales de Chimie, his sharpest shot went at the
   > foundations: Navier's own assumptions, taken seriously, give a solid with zero
   > elasticity — a material that could not hold a shape. Navier answered that

   (Saint-Venant's defense at L417–420 also verified against Darrigol p. 143:
   "mis-estimated the direction of the force exerted by the chain on the
   stone — a kind of oversight … easily corrected on the spot," and the "spirit
   of denigration … of science, disparaged under the name of theory opposed to
   practice" quote is verbatim. CONFIRMED, no change.)

4. **Press quote** (L335–336) — **CONFIRMED.** "that eminent man of science
   whose calculations fail in Paris" is verbatim from Cannone & Friedlander,
   "Navier: Blow-up and Collapse," AMS Notices 50(1), 2003. No change.

5. **Ladyzhenskaya** (L618–619) — **CONFIRMED.** Father Aleksandr Ivanovich
   Ladyzhenskii, mathematics teacher in Kologriv, arrested and executed by the
   NKVD in 1937; Olga refused admission to Leningrad State University because
   of his status (MacTutor, multiple biographies). "Schoolteacher," "shot in
   1937," "barred for his sake" all check. No change.

6. **Pascal's control barometer** (L74–76, L82–83) — **CONFIRMED.** Périer's
   1648 protocol: two Torricellian tubes set up at the Minim monastery in
   Clermont; one left there with a monk instructed to observe it through the
   day while the other went up the Puy-de-Dôme; the stationary tube did not
   change. The Minims are a mendicant order, so "friar" is correct; "so that
   nobody could say the weather had done it" matches the stated purpose of the
   control. Measured drop 711→627 mm ≈ 84 mm ≈ "about eight centimeters" ✓.
   No change.

7. **Newton's anonymous verdict** (L148–149) — **CONFIRMED.** Newton, as Royal
   Society president, appointed and packed the committee on the
   Leibniz priority dispute and anonymously drafted the committee's report
   (Commercium Epistolicum, 1712); scholarship on the surviving drafts
   establishes his authorship. The draft's one-sentence rendering is
   defensible, and the ledger's restraint note (anonymous self-review stays
   out) is honored. No change.

Also verified in passing: −5/3 bound to **wavenumber** at both instances
(L589–590 "written against the eddies' wavenumber"; L598–599 "across decades of
wavenumber") — the eddy-size sign error did not survive into the draft ✓; the
Obukhov spectrum-form credit (same year, same school) is historically correct ✓;
"Newton's number stayed wrong for a hundred and twenty-nine years" (1687→1816)
✓ arithmetic.

## E. MDX INTEGRITY

- **Imports vs. usage**: 22 imports, all 22 used in the body (verified by tag
  census). No unused imports.
- **Body components not imported**: `Predict`, `Waypoint`, `C` — provided
  globally by `MDXProvider` in `src/App.tsx` (line 12: `mdxComponents = { Sim,
  TeX, C, Waypoint, Predict }`), same as the published original. Legal.
- **Import paths**: all 21 `../sims/*` targets plus `../components/TermStack`
  exist under `src/` (paths resolve from the file's destination,
  `src/lessons/`). ✓
- **Math delimiters**: one `$$…$$` display block (balanced); 26 inline `$`
  (13 balanced pairs). ✓
- **JSX**: every paired tag closes (`C`×3, `Waypoint`×3, `Predict`×2); all
  other components self-close; `TermStack` attribute braces balanced
  (byte-identical to the working original). ✓
- **MDX comments**: none present, so nothing to mis-place. ✓

**Verdict: PASS** — no mechanical changes required.

---

## MUST-FIX SUMMARY (the fixer applies exactly these three splices)

1. **L312–314** — replace
   `the <C k="div">violet</C> counts off the cells where water is being conjured out of`
   `nothing or quietly destroyed. Both channels carry the same faint stickiness, which`
   with:
   `the <C k="div">violet</C> floods the places where water is being conjured out of`
   `nothing or quietly destroyed — and each pane's meter averages that crime over its`
   `whole channel. Both channels carry the same faint stickiness, which`

2. **L407–409** — replace
   `polemic that ran through the Annales de Chimie, he cited Navier just once: to`
   `declare that Navier's own assumptions, taken seriously, give a solid with zero`
   `elasticity — a material that could not hold itself together. Navier answered that`
   with:
   `polemic that ran through the Annales de Chimie, his sharpest shot went at the`
   `foundations: Navier's own assumptions, taken seriously, give a solid with zero`
   `elasticity — a material that could not hold a shape. Navier answered that`

3. **L595–596** — replace
   `where the sea runs at up to fifteen knots, and measured the turbulence at a`
   `Reynolds number of 280,000,000 — three orders of magnitude past any laboratory.`
   with:
   `where the sea runs at up to fifteen knots and the Reynolds number reaches`
   `280,000,000 — three orders of magnitude past any laboratory.`

## CLEAN (verified good — do not touch)

- All 16 ledger kills/rewrites listed in section A, as landed.
- The device budget exactly as counted: confession 0, resurrection 3, aphorism
  champion + sanctioned edge, Leonardo 1 (original), no bridge-failure callback
  after L420, blank-slider frame intact.
- The Pascal control-barometer addition (L74–76, L82–83), verbatim.
- The Newton self-ruling sentence (L148–149), verbatim.
- The press barb (L335–336), verbatim — quote confirmed word-for-word.
- The Saint-Venant defense (L417–420), verbatim — both quoted fragments
  confirmed against Darrigol.
- The Kolmogorov block (L584–603) except nothing — dates, wavenumber binding,
  Obukhov clause, flat Moscow-desk close, and the moved Heisenberg parenthesis
  are all correct as written. (The GSM sentence fix is MUST-FIX 3 only.)
- "The eddies were larger than the 217-foot ship, which spent the runs being
  carried about by the thing it was measuring." — both the length and the
  paraphrase are confirmed by the 1962 paper itself. Keep exactly.
- The Leray Pont Neuf scene (L606–608) and Ladyzhenskaya clause (L618–619).
- The One Skeleton rewrite (L667–677) and Further Reading addition (L690–692).
- The untouchables: meter paragraph, parcel walk, blank-slider plant, Final
  Words roll-call — all byte-identical to the original. Confirmed untouched.

Sources used for section D: JFM 12 (1962) 241–268 full text (cached PDF, DOI
10.1017/S002211206200018X); Darrigol, *Worlds of Flow* (OUP 2005) pp. 123–125,
143; Cannone & Friedlander, AMS Notices 50(1) 2003; ADS/Doklady records for
Kolmogorov 1941a/1941c; MacTutor biography of Ladyzhenskaya; Périer's Puy-de-Dôme
account (secondary reconstructions); Newton Project / Royal Society records on
the Commercium Epistolicum.

---

## FIXES APPLIED — 2026-07-30

- MUST-FIX 1 (L312–314): PressureOff caption restored to the post-241a39a
  published text — "floods the places … averages that crime over its whole
  channel." Applied verbatim; "counts off" now 0 hits.
- MUST-FIX 2 (L407–409): "cited Navier just once" removed; barb rebound to the
  foundations, "could not hold itself together" → "could not hold a shape."
  Applied verbatim; "cited Navier just once" now 0 hits.
- MUST-FIX 3 (L595–596): 2.8×10⁸ rebound from the measurement act to the
  channel — "the sea runs at up to fifteen knots and the Reynolds number
  reaches 280,000,000." Applied verbatim.

Skipped: none. Post-fix mechanical re-checks (section E) all pass: 22/22
imports used, all import paths resolve from `src/lessons/`, one balanced `$$`
block + 13 balanced inline `$` pairs, C 3/3, Waypoint 3/3, Predict 2/2. Device
budgets re-counted and on target: confession 0, resurrection 3, aphorism
champion + edge-rider only, Leonardo 1, no bridge-failure callback after the
Saint-Venant defense, blank-slider plant/close intact.
