# Final Check — Lesson 01 (reimagined), pre-publish gate

Auditing `redrafts/lesson-01/lesson-01-reimagined.mdx` against the published baseline
`src/lessons/lesson-01-navier-stokes.mdx`, the edit ledger `slop-critique.md`, SLOP.md
(19 families), and NICKS_VOICE.md. Line numbers refer to the **reimagined draft**
unless marked (orig).

Verdict up front: the draft is publish-ready after **one** surgical fix (the snailfish
filming year). Ledger compliance is complete, the new prose is clean, every changed
figure claim is honest against source, MDX integrity passes, and all four device
budgets are exactly on-budget.

---

## A. LEDGER COMPLIANCE (spot-check, 15 entries — all landed)

| # | Ledger item | Expected in draft | Verdict |
|---|---|---|---|
| 1 | Crime kills (orig 427,434,462,464,469,470,522,525) | only 2 crime uses remain | LANDED — draft has crime at 435 (coinage) + 451 (payoff) only |
| 2 | "violet crime everywhere" → "violet everywhere" | L449 | LANDED — "<C k=\"div\">violet</C> everywhere around it" |
| 3 | "a crime in the other direction" → "divergence with the opposite sign" | L456 | LANDED |
| 4 | "matches the crime" → "matches the divergence" | L486 | LANDED |
| 5 | "the local crime" → "the local divergence" | L488 | LANDED |
| 6 | "all crime, no pressure" → "all divergence" | L493 | LANDED |
| 7 | "the crime is gone" → "the divergence is gone" | L494 | LANDED |
| 8 | "cancel the crime" (solver) → "cancel the divergence" | L547 | LANDED |
| 9 | "as confessed earlier" retired → "the same price we paid… back in Advection" | L530 | LANDED |
| 10 | orig L40 "some unfamiliar words will come up" clause cut | L40 | LANDED — "…has a reputation. Every quantity…" |
| 11 | orig L49 "One honest contract before we start:" cut | L48 | LANDED — opens "The flows in this article are two dimensional" |
| 12 | orig L208 "Here is the turn the whole subject pivots on." cut | L223 | LANDED — opens "Velocity is itself carried by the flow." |
| 13 | orig L341 "here is the part that matters for us:" cut | L361 | LANDED — "…goes nowhere. And a parcel of fluid is bombarded…" |
| 14 | orig L286 "a negotiation between them" → "which one is winning" | L306 | LANDED |
| 15 | Snailfish opener + driving-thermometer + Helmholtz two-sheets + cream-coffee + rose/amber finale + SolverXray cost caption + §Waves ending | L166–170, 247–254, 364–369, 463–469, 549–555, 566–570, 602–605 | ALL LANDED |

Note: proposal **9a (speed-as-color no-slip caption) was correctly NOT applied** — it was
conditional on a sim change that did not happen, so the draft kept the flat caption and
documented the gap in a source comment (L93–98). That is the honest outcome the ledger
demanded. No action.

---

## B. NEW-PROSE SLOP SWEEP (every changed sentence, family-checked)

All new/rewritten passages read clean. Detailed clearances:

- **L166–170 (driving-thermometer)** — CLEAN. Household analogy with a stated failure
  mode (a real evening also cools in time — exactly the split the section isolates); math-
  native, auditable (family 10 pass). Not significance-announcing.
- **L203–215 (advection captions)** — CLEAN. Flat declaratives carrying real content
  (concentration preserved, boundary lengthening, filament width → 0). No "that will
  matter in a moment" scheduling (family 1 avoided per ledger amendment).
- **L249–254 (cream-in-coffee)** — CLEAN. Order-of-magnitude claim, mechanism-carrying.
  "works arm in arm with the stirring" is mild personification, within register.
- **L364–369 (snailfish)** — CLEAN as prose (fact issue handled in D). Vivid, content-rich.
- **L463–469 (Helmholtz two-sheets)** — CLEAN. Auditable image (fails on non-smooth
  fields / non-trivial topology, which is why the proof stays deferred). No new
  "here is why" announcer — opens on "Picture any flow…" per amendment.
- **L549–555 (SolverXray caption)** — CLEAN. Carries verified constants and the
  non-commuting-order fact; does not recap "each one is a section."
- **L566–570 (rose/amber finale)** — CLEAN as prose (figure honesty in C).
- **L602–605 (§Where Waves Live ending)** — CLEAN. Replaced the narrated syllabus
  ("strings, sound, light's analogies, water") with a physics statement. "every one is a
  place where energy travels while the material stays home" states the just-shown
  wave/material distinction; it is physics, not a section-ending moral (family 8 pass).

No new significance announcements, staged reveals, X-is-just-Y rebrands, brochure
promises, recurring devices, or aphorism overdrafts were introduced. Aphorism budget
intact: the single champion "because that is what it took" (L501) is untouched and
unchallenged; the opening/closing ring ("The wing flies anyway" / "in your cup") is
preserved and not charged.

---

## C. FIGURE-CLAIM HONESTY (changed claims vs sim source)

- **L549–555 — SolverXray "forty neighbourly sweeps across every cell of a 120-by-72
  grid"** — HONEST. `src/sims/SolverXray.tsx:14–15` sets `NX=120, NY=72`;
  `src/sims/lib/solver.ts:37` sets `PRESSURE_ITERS=40`, the default `pressureIters` the
  SolverXray `FluidSolver` runs. Per-stage behavior claims ("carrying… lets divergence
  accumulate; smoothing melts toward stillness; pressure hunts divergence and touches
  nothing else") match the toggle wiring at `SolverXray.tsx:30–34` and the header
  comment. CLEAN.
- **L566–570 — rose/amber finale mixing** — HONEST. `WingFlow.tsx:57–58` advects two
  separate dye stripes (amber upper rows 12–42, rose lower rows 46–76). Honey end
  `HONEY_RE=40` is documented as "steady AND visibly laminar — streamlines part at the
  nose and rejoin flat" (`WingFlow.tsx:36–47`), supporting "two clean sheets… an orderly
  flow does not mix." High-Re braided street (`HERO_RE=500`, "sustained braided street")
  supports "folds one color into the other." CLEAN. (Minor: "never touch" is a hair
  strong — the two sheets are adjacent and meet at the wake centreline — but they do not
  cross or blend, which is the load-bearing claim. Not a fix.)
- **L562–563 — "you can also stir the stream with your pointer"** — HONEST. Finale
  variant wires pointer-stir (`WingFlow.tsx:269–281`, impulse on `variant==='finale'`).
- **L87–91 — speed-as-color caption ("brighter blue where the flow runs faster")** —
  HONEST and unchanged. `FlowVis.tsx:24` speed mode runs `breezeField` (bank-less,
  `field.ts:46–60`); the caption makes **no bank-darkening claim**, exactly as the
  mandate requires. The `{/* PROPOSED FIGURE */}` comment at L93–98 is sanctioned
  source-comment documentation — KEEP.

---

## D. FACT CHECKS

- **Snailfish — 8,336 m, Izu-Ogasawara Trench, Jamieson team, deepest fish ever
  recorded** — CONFIRMED. Depth 8,336 m in the Izu-Ogasawara Trench, expedition led by
  Prof. Alan Jamieson (Minderoo-UWA), published 2023 (Deep-Sea Research Part I),
  world-record deepest fish. Pressure sanity: ρgh ≈ 1025·9.81·8336 ≈ 8.4×10⁷ Pa ≈
  ~827 atm; force on 1 cm² ≈ 838 N ≈ 0.85 tonne-force → "close to a tonne of water on
  every square centimetre" is correct.
  **CORRECTED (the one must-fix):** the footage was captured **August 2022** and announced
  in 2023; the draft's "filmed in 2023" (L364) is the wrong year for the verb "filmed."
  Fix: change "A snailfish filmed in 2023" → "A snailfish filmed in 2022".
- **Cream-in-coffee diffusion contrast (weeks unstirred vs one stir)** — CONFIRMED,
  defensibly stated. With D ≈ 10⁻⁹ m²/s and a cup a few cm across, crossing time
  L²/D ≈ 10⁶ s ≈ 1.5–4 weeks. The draft states it as an order-of-magnitude claim ("a
  couple of weeks," "grows as the square of the distance") with no fake precision — the
  form the mandate requires.
- **SolverXray constants (forty sweeps, 120×72)** — CONFIRMED against
  `SolverXray.tsx:14–15` and `solver.ts:37` (see section C).

---

## E. MDX INTEGRITY — PASS

- **All 18 imports used** (each component appears in the body): CylinderFlow ×2,
  WingFlow ×2, FlowVis ×4, ParticleBox ×3, ParcelProbe ×1, DyeCarry ×3, AdvectionSchemes
  ×1, ViscosityDemo ×1, ShearBlend ×1, VortexDecay ×1, PressureLandscape ×3,
  DivergenceLoop ×2, PressureFix ×1, HelmholtzSplit ×1, JacobiRelax ×1, TermToggle ×1,
  SolverXray ×1, RippleWaves ×2. No unused imports.
- **All body components imported or provided.** `<C>`, `<Predict>`, `<Waypoint>` are not
  imported — correct: they are MDX-global components exported from
  `src/components/Prose.tsx` (`C` L9, `Waypoint` L17, `Predict` L31).
- **Import paths resolve** — every `../sims/X` exists under `src/sims/`.
- **KaTeX delimiters balanced** — 16 `$$` markers (8 display blocks); no line carries an
  odd count of `$` (inline math balanced).
- **JSX well-formed** — `<C>` 36 open / 36 close; `<Predict>` 2/2; `<Waypoint>` 2/2; no
  unclosed tags or stray braces.
- **MDX comment legal** — the single `{/* … */}` block at L93–98 sits at block level
  between two figures; valid MDX.

---

## DEVICE-BUDGET AUDIT (lesson-specific mandate)

| Device | Budget | Draft occurrences | Verdict |
|---|---|---|---|
| crime / criminal / scene-of-the-crime | coinage (DivergenceLoop) + 1 payoff (PressureFix) | **2**: L435 "scene of the crime" (in DivergenceLoop section, after `<DivergenceLoop withSource={true}/>`), L451 "cancel the crime" (in PressureFix section, before `<PressureFix/>`) | ON-BUDGET |
| confess / confession | moth line only | **1**: L338 (the aerodynamic-moth confession) | ON-BUDGET — "as confessed earlier" retired at L530 |
| negotiation | Jacobi + sound payoff | **4** across 2 sanctioned sites: L487, L489, L494 (all the Jacobi coinage/`<JacobiRelax/>` unit), L595 (sound payoff) | ON-BUDGET |
| debt | plant + payoff | **2**: L37 (plant, hero slider), L561 (payoff, "oldest debt comes due") | ON-BUDGET |

No overages. No stray device use elsewhere in prose.

---

## MUST-FIX (apply exactly these — 1)

1. **L364** — change `A snailfish filmed in 2023 at the bottom of the Izu-Ogasawara
   Trench` → `A snailfish filmed in 2022 at the bottom of the Izu-Ogasawara Trench`.
   (Footage captured Aug 2022; announced/published 2023. Depth, trench, team, and
   record all remain correct.)

## CLEAN — verified-good, do not touch

- Crime census: L435 coinage + L451 payoff (all 8 canned-tail uses correctly killed).
- Device budgets: confess (L338), negotiation (L487/489/494/595), debt (L37/561).
- Aphorism champion L501 "because that is what it took"; opening/closing ring
  (L30–31 / L643–644).
- Driving-thermometer insert (L166–170); advection rewrites (L203–215); cream-coffee
  extension (L249–254); Helmholtz two-sheets (L463–469); SolverXray cost caption
  (L549–555, constants verified); rose/amber finale (L566–570, sim-supported);
  §Waves ending (L602–605).
- Speed-as-color caption (L87–91) — no bank claim; `{/* PROPOSED FIGURE */}` comment
  (L93–98) sanctioned, KEEP.
- All 18 imports; MDX structure; KaTeX; C/Predict/Waypoint provisioning.

---

## FIXES APPLIED — 2026-07-30

1. L364 — "A snailfish filmed in 2023" → "A snailfish filmed in 2022" (must-fix #1; footage captured Aug 2022, announced 2023).

Skipped: none. Post-fix re-checks: all 18 imports used and paths resolve; KaTeX balanced (16 `$$`, no line with an odd `$` count); JSX balanced (C 36/36, Predict 2/2, Waypoint 2/2); device budgets unchanged and on-budget — crime 2 (L435, L451), confess 1 (L338), negotiation 4 (L487, L489, L494, L595), debt 2 (L37, L561).
