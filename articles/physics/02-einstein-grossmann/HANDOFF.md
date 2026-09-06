# Handoff — The Draft That Had to Fail (physics P2)

Canonical state for this article. AGENTS.md carries one line pointing here
once the lesson registers.

## Status

**BUILT end-to-end 2026-09-03 · `draft` · registered (physics, order 2).**

- `DENSE_CORE.md`: thesis/hook/payoff/ranked insights/kill-list (wins prose conflicts).
- `RESEARCH.md`: every date and number sourced (wins fact conflicts). Open:
  joint-paper imprint precision (held at "1913 Outline"), November-tensor
  naming (deferred; the concept is sourced, the label unused).
- `PLAN.md`: 7 sections as built (the 1913/1915 dial figure cut — a static
  dial teaches nothing; the debt lives in one sentence, Mercury redeems it).
- `src/lessons/physics-02-einstein-grossmann.mdx`: blocked prose, ~7 sections,
  6 figure slots from 5 steppers (`StraightLines` twice: hero + ring return).
- `bun run typecheck`, `bun run build`, `bun run check:grossmann`
  (26 checks: 21 full-width + 5 mobile-width) and `bun run check:figures`
  (physics-01 regression) all green 2026-09-04; lesson id + title confirmed
  in the built bundle, route `/lesson/einstein-grossmann`.

## What is verified, and how

- Historical numbers: Entwurf Mercury ≈ 18″/century; GR 43″/century;
  observed remainder 45″ ± 5″; Le Verrier 1859; presentation 9 Sept 1913;
  Mercury paper 18 Nov 1915 — each with a live source in RESEARCH.md.
- Hero: flat pair 39px at every K; curved pair 39px → 19px; meeting follows
  cos(L·√K) (0.49 measured vs 0.46).
- LoopMeter: violet centroid shifts 108px across the knob; rotation is K·A
  with zero intercept (max 57.3°).
- CovarianceMachine: draft bar 208px → 0px across grid rotation; 1915 bar
  208px → 208px; both agree on the home grid.
- MercuryGrade: 1915 fan 1.00°/orbit; Newtonian drift −0.007° (integrator
  honesty); draft/full ratio 0.420 vs history 0.419, holding at e = 0.05
  (0.426) and e = 0.40 (0.420); both lanes paint.
- FallTest: red + green drawn at h = 1 and h = 10; levels differ by 0.0px.

## Bugs the harness caught (do not reintroduce)

1. FallTest claimed a fixed timestep it never used (`FIXED_DT` unused,
   typecheck error) — each lane now falls through semi-implicit Euler in
   FIXED_DT quanta, and the spread meter reads the three lane states.
2. Hero check sampled column x = W−14, past the curve ends (622px) —
   measured nothing; moved to W−24 with a comment.
3. Mercury section 4 shipped as an `ok(true)` placeholder — replaced with
   `measureMercuryAdvances` + ratio/drift/fan assertions at three
   eccentricities.
4. LoopMeter wedges at 0.55 alpha never matched their own palette hex, so
   the check read antialiased edges (17px) — wedges are opaque now, and the
   check asserts the predicted spill area (½·400·rot = 200px, tol 100).
5. MercuryGrade meter lines at 14px leading superimposed on screen —
   pane shortened, 20px leading (reader pass, seen with eyes).
6. FallTest's "separation at landing 0.00" was a printed string — replaced
   with a measured lane-spread meter over three independent lane states.

## Voice audits, 2026-09-03 (self-audit, post-draft)

- Two Mercury spoilers cut: §4 ended "Only one of them moves Mercury" and
  §5 ended "What it could not pass was Mercury" — both pre-chewed §6's
  payoff ahead of its Predict (SLOP 17, INTROS rule 1). Now: prose debts
  without outcomes ("The sky disagrees with one of them — with a number";
  "The next test is Mercury's orbit").
- "Prankster" cut (title + two mentions): lesson 02's device, same
  borrowing physics-01's audit caught with lesson 01's "crime" (SLOP 11).
  §3 is now "The Derivative Dies".
- Waypoint rewritten: "You now hold X … What's missing is Y" repeated
  lesson 01's waypoint skeleton beat-for-beat (sibling audit).
- Intro de-spent: the three geometer names moved out of the cold open into
  §5 (INTROS rule 1); "running right now" fixed to "yours to bend" (the
  hero is knob-driven, not animated).
- Promised-but-missing geodesic symbol cut (the paragraph promised "the
  symbol, once" and delivered none); $g$ carries the load instead.
- Family-18 trims: "which is what makes this section a grading rather than
  a story", "The simultaneity is the teaching, because…", "The confession
  belongs in the open because…" — all replaced with physics or deleted.
- "A hundred million silent orbits" corrected to "thirty thousand"
  (1.00°/orbit measured vs 2.9e-5°/orbit true ≈ 34,000×).
- Cold read, round 2: IOU rewrote lesson 02's "distance between those two
  sentences" skeleton (sibling audit) — now a flat fact about the figure;
  "Here is the verdict" trimmed (SLOP 20); stranded "two sentences …
  is paid" callback cut with its ledger-talk (SLOP 18); ending rewritten
  off lesson 02's "there is no X … there is a Y" benediction skeleton;
  "labelled as one" and "never twice" untangled.

## Open

- **Nick's read.** No voice sweep against his markup; print register still
  ratified from the one lesson-01 sample.
- **Live browser QA.** No browser exists in this environment (probed
  2026-09-04: no chromium/playwright binaries or caches) — consistent with
  prior sessions' wedged preview pane. None of the figures watched
  animating in a real browser. MercuryGrade (animated, ~8 s/orbit) most
  wants eyes; FallTest's loop timing second.
- Further Reading links landed 2026-09-04 (Janssen–Renn + Weinstein arXiv
  PDFs verified; Zurich facsimile via archive search; Entwurf unlinked per
  the Wu–Yang precedent). RESEARCH.md corrected the same day: 1906.06106
  is Sauer on the unified-field sheets, not Norton — the Norton-named
  link was cut before it shipped.
- Known density deviation: ~6 slots over ~2,250 words ≈ 375 words/figure,
  above the 85–180 band. Historic act is prose by design; if it reads thin,
  cut words before adding figures (SLOP 13).

## Done since (wrap-up 2026-09-04)

- Mobile-width block in `check:grossmann` §6: all five figures re-rendered
  at 380px, each asserting its taught quantity still paints; the hero's
  bottom title collided with its meter at 380px and was shortened into a
  parallel structure ("curved sheet — parallels meet"); Mercury's meters
  proven clear by measured type widths (no overlap possible).
- Reader screenshot pass, rounds 1–2: all six slots inspected as a reader
  (three questions each); findings fixed in code (wedges, meters, lanes).
- AGENTS.md one-liner added; lesson registered (physics order 2).
