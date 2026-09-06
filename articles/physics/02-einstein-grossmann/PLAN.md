# PLAN — The Draft That Had to Fail (physics P2)

Second lesson of the **broad physics** field. Standalone: assumes no other
lesson; lesson 02's transport glyphs are re-taught, not linked.

Read `DENSE_CORE.md` first — it wins conflicts with this document. Every
date/number traces to `RESEARCH.md` — which wins conflicts about facts.

Scale target: ~3,500 words · ~14 figures · 7 sections · all Canvas-2D.
(Corpus band 85–180 words/figure; we plan ~250 only because the Mercury
act is prose-historic by design — no figure may be added to densify; if the
draft runs long, cut words, not add figures. SLOP family 13.)

## Stage 2 — Skeleton

Acts: **I. Straight** (§2) · **II. Curved** (§3–4) · **III. The two laws**
(§5–6) · **IV. November** (§7). Waypoint closes Act II; one prediction
before the Mercury reveal (§6).

### §1 · Hook (figs 1–2)

Cold open, two sentences: everything you have dropped went straight down
through a ground you have never seen; in August 1912 one man carried the
physics of that ground across Zurich and his friend answered with the
mathematics. Fig 1 (hero): dual-pane — two nearby straight lines on the
flat sheet stay apart; the same construction on the curved protagonist
meets. One curvature slider, unexplained. Fig 2: the human artifact, drawn
not photographed — two signatures on one 1913 title page, physical part /
mathematical part. Jargon amnesty; color-code contract; the spatial-curvature
confession (I-voice, once). No mathematics yet.

### §2 · What "Straight" Means (figs 3–4) — representation before phenomenon

The instruments: a ruler-field (the metric — drawn as little rulers, not
named yet) and the straightest path (the geodesic — drawn, not named yet).
Fig 3: flat sheet — rulers all identical, parallels stay parallel, triangle
sums to 180°. Fig 4: the same tools on the protagonist — rulers stretch,
parallels meet, triangle exceeds 180°. Phenomenon first, names second
(metric, geodesic earned here). Confess finite ruler count.
*Failure driving out: the flat derivative's meaning of "straight" has no
purchase on the second sheet — which sheet is the world?*

### §3 · The Derivative Dies (figs 5–6) — the broken demo

Carry an arrow on the flat sheet around a loop: it returns itself. Carry it
on the protagonist: it returns rotated. Fig 5: the transport game (one loop
slider: area). Fig 6: triangle-angle meter vs. loop-rotation meter — the
two witnesses agree, both read curvature × area. Fig 7: the verdict — the
ordinary derivative of a direction is a fact about our flat habits, not
about the surface. **Math #1**: the metric as ruler-field, in words first,
then the symbol $g$ — "the ruler at every point." Boundary check: flat
$g$ recovers 180° and zero rotation.
*Savior: what we lack is the rule the surface itself uses — and the law
that says which rule our world uses.*

### §4 · The Repair (fig 8 — no new figure; Waypoint + planted debt in prose)

Fig 8: the connection built from the rulers — carry the arrow the way the
surface's own rulers say, and "straight" works again; geodesics drawn as
the paths that never turn by their own rulers' account. **Math #2**: the
geodesic, words-first ("going straight by the local rulers' account"),
then the symbol form once, color-bound, with the flat boundary check.
Waypoint (Act II ends): the kinematics inventory, then the planted debt in
prose — "The sky disagrees with one of them — with a number" (the 1913/1915
dial figure was cut 2026-09-03: a static dial teaches nothing; the debt
lives in one sentence and Mercury redeems it).
*Savior: two candidate laws used this same geometry. One of them flunks
the sky.*

### §5 · The Draft (figs 10–11)

The history, told in three dated sentences: August 1912 (the walk),
1913 joint Outline (physical/mathematical parts), June 1913 Einstein–Besso
manuscript (run the draft against Mercury). Fig 10: the restricted-covariance
demo — the draft's law drawn as a machine that answers correctly in some
coordinate grids and visibly shifts its answer when the grid is rotated;
the 1915 law's machine sits still under the same rotation. One knob: grid
rotation. Fig 11: the fall test — both laws drop the apple onto Newton's
track (both pass; the draft's Newtonian limit, honored, not mocked).
*Savior: falling could not separate them. Mercury could.*

### §6 · Mercury Grades Them (figs 12–13) — the marquee

**Prediction** (commit before running): two laws, one planet, 43″ on the
board — which law lands on it? Fig 12: the orbit integrator — Newtonian
ellipse plus the small extra precession each law earns by honest integration
(post-Newtonian $1/r^3$ correction term for the 1915 law; the draft's weaker
correction beside it — both integrated live, same stepper, one-delta apart;
stability note beside the constants). Readout: accumulated perihelion shift
per century-equivalent, with the 43″ line drawn and the draft landing near
18″. Fig 13: the verdict pane — 18″ vs 43″ vs 45″ ± 5″, with Le Verrier
1859 named once. Numbers as dessert, after the mechanism.
*Savior: the draft convicted itself with a number — two years before anyone
knew the right law.*

### §7 · November (fig 14) — the ring

Four weeks, four communiques (4/11/18/25 November 1915); the 18th lands
Mercury with Besso's 1913 techniques. Fig 14: the hero returns — the same
dual-pane straight lines, now readable: falling bodies are the bottom lines,
going straight through the rulers' curved geometry. Final Words: this
article's own re-enchantment (sibling audit: not lesson 01/02's skeleton).

### Further Reading & Final Words

Each source 2–3 sentences of specific praise: Janssen & Renn on the
perihelion (the manuscript trail); Norton on the Zurich notebook (how the
near-final equations were set aside); the Einstein–Besso manuscript story
as told by Janssen–Renn; Weinstein's rotating-disk/Mercury account (Nov 18
context); Bernstein–Phillips or equivalent for the "friends in the math"
register if needed. Final Words: land the earned thing once, re-enchant at
the dropped object, send the reader back to the world.

## Palette contract

| Quantity | Color | First appears |
|---|---|---|
| flat construction | blue `#2563eb` | §1 top pane |
| curved protagonist / rulers | amber `#d97706` | §1 bottom pane |
| curvature readout (triangle + loop meters) | violet `#7c3aed` | §3 |
| 1913 draft | red `#dc2626` | §4 dial |
| 1915 law | green `#059669` | §5 machine |
| observed 43″ line | gray `#6b7280` | §6 |

Equation symbols inherit figure colors; prose binds with `<C>`.
1913-red vs 1915-green never encode right/wrong outside §5–6 (the draft's
Newtonian pass is drawn in its own red, honored).

## Production notes (Stage 3)

**Sim inventory** — four steppers, all Canvas-2D, factories exported for
headless checks:
- `StraightLines` (hero + finale): two geodesics on flat vs. bump surface,
  one curvature slider. Geodesics integrated with fixed-step RK4 at a stated
  dt; stability note beside constants.
- `LoopMeter`: parallel transport around a draggable-area loop + triangle
  angle sum; both meters live; flat boundary check built in.
- `CovarianceMachine`: one field solved on a rotated grid under two laws —
  draft answer shifts, 1915 answer holds. (Cheapest honest version: a scalar
  Poisson solve with/without the restricted term; the *shift under rotation*
  is the taught quantity, both meters live.)
- `MercuryGrade`: shared orbit integrator, Newtonian + two correction
  strengths; perihelion-shift readout vs. the 43″ line. Fixed-step
  semi-implicit Euler at stated dt; precession measured, not pasted.

**Build order**: `StraightLines` → `LoopMeter` → blocked §§1–4 →
`CovarianceMachine` + `MercuryGrade` → blocked §§5–7 → headless checks →
voice pass. Lesson stays `planned` until blocked MDX exists; `draft` after.

**Audit hooks**: words-per-figure diagnostic only (historic act exempt from
densify pressure); drought max 3 paragraphs outside §5 prose; knob ≤1 except
flagged §6; every planted debt (confession §1, dial §4, 43″ board §4) has a
named redemption; anti-checklist from METHODOLOGY Stage 5.
