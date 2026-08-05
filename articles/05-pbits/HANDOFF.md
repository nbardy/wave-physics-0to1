# HANDOFF — A Computer Made of Noise (physics P2)

Canonical per-article state. Design docs: `DENSE_CORE.md` (wins conflicts),
`PLAN.md` (skeleton + figure list), `OUTLINES.md` (the three candidate shapes;
variant B banked as the sequel), `CRITIQUE.md` (the six-way comparison).

## Where it stands (2026-08-05)

**Acts I–II BUILT and verified** — `draft` in the registry, live at
`/lesson/pbits`. ~2,900 words of Stage-3 blocked prose, 10 figures (F2–F12,
F14 of the PLAN's 26), all CPU. Sections §1–§6: the coin with a knob → display
teach → two coins that gossip → the mountain range / state graph / meter →
everyone talks at once → the two-coloring rescue and the chip reveal.

- Core library: `src/sims/pbits/lib.ts` — canonical model, counter-based RNG
  (Reset reproduces trajectories exactly), the three schedules as a sum type
  (sequential / synchronous / chromatic, one handler each; `buildChromatic`
  rejects illegal colorings by construction), exact enumerator (oracle,
  n ≤ 20), `subModel` for clamped-boundary conditionals, TV distance, the
  meter and layer-rail drawing vocabulary.
- Figures: `BitFlicker` (F2/F3), `DisplayTeach` (F4), `PairCoupler` (F5/F6),
  `Landscape` (F7), `StateGraph` (F8/F12 incl. the teleport witness),
  `MeterForge` (F9/F10), `GridSchedules` (F11/F14 with the fenced 2×2
  audit patch).
- Checks: `bun run check:pbits` — 30 assertions, all green: oracle tier
  (schedule correctness, coloring guard, subModel vs direct conditional,
  determinism) + figure tier (knobs to both ends, one quantity's own ink).
- Palette contract appended to `sims/lib/palette.ts` (sUp/sDn, ferro/anti,
  ghost, held, meter). Layer rail (MATH · ALGORITHM · MACHINE) on every
  figure per CRITIQUE extraction 1.

**Measured marquee numbers (ours, not the sibling thread's):** frustrated
four-loop — synchronous TV 0.463 vs sequential 0.004 / chromatic 0.002;
16×16 grid audit patch — synchronous 0.164 vs sequential 0.011 / chromatic
0.007. The PLAN's ledger item "re-measure before publish" is DISCHARGED.

## Findings this session

- **The check harness caught a real staging bug before the browser did**
  (the pattern from physics-01 repeats): §3's original target — "make two
  independent coins agree 0.9" — is *reachable* by pinning both biases to
  the rail (independence gives corr = tanh h₁ · tanh h₂ → 0.93 at h=2).
  Restaged as the two-part target (agree 0.9 AND stay fair), with lean
  gauges that slam red on the cheat; three checks now pin the cheat, the
  fair-coin cap, and the wire hitting both marks. Comment at the top of
  `PairCoupler.tsx`.
- **Hidden-pane trap reconfirmed** (AGENTS.md already documents it): the
  browser pane went `visibilityState: hidden` mid-pass; screenshots read
  blank and rAF froze. Not a page bug. The `_figure_check/` PNGs are the
  reliable eyes — grid-synchronous.png shows the crosshatch disease and the
  pinned meter; grid-chromatic.png the smooth domains at the floor.
- Browser-automation clicks at stale scroll offsets caused phantom
  multi-flips in `DisplayTeach`; a controlled synthetic pointerdown proved
  one-tap-one-flip. Not a component bug.

## What remains (PLAN order)

1. **§7 — the machine's manual**: F16 chip-fabric render, F17 pokeable
   manual, F18 triangle embedding + chain knob, F19 nonideality knob,
   F20 hand-compile noisy-copy (the B import; closed form ½·log 9).
2. **§8 — the finale**: F21 paint-box, F22 corruption filmstrip, F23
   two-phase correlation strips, F24 factorized-failure beat, F25 live CD
   training, F26 hero return. 4×4 glyphs so the enumerator audits single
   steps.
3. **F13 race + F15 dashboard** (§5–§6 enrichments): the optimization race
   the broken sampler wins; updates/sec vs effective-samples/sec columns.
4. **WGPU backend** for the grid/hero (`sims/lib/gpu/` pattern: one kernel
   per color pass, command ordering as the barrier); CPU stays the typed
   fallback and the parity oracle.
5. **F1 hero last** (needs §8's trained weights; prototype glyph legibility
   at 64×64 before writing its prose).
6. Stage 4 voice pass over all prose (current text is blocked scaffold;
   METHODOLOGY's fork-rule/pastiche audits not yet run), then Stage 5
   audits (rhythm, palette, ledger, sibling, anti-checklist).
7. Mobile/touch pass; Predict veil interaction on touch.

## Decisions on record

- Field `physics`, P2; revisit a `computation` field when the B-sequel
  ships. Tags `probability`, `simulation`.
- Fenced-patch honesty: the 2×2 interior + clamped ring makes the audited
  subsystem exactly conditional-independent of the outer lattice; prose
  calls it "the auditable corner" and claims nothing more.
- Knob changes reset evidence (fresh measurement of a moved target) rather
  than decaying old counts — simpler and honest; prose narrates it.
