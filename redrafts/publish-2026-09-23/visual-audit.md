# Visual audit: History and Building IV (2026-09-23)

**Method.** Headless Google Chrome (`--headless=new`) driven over the DevTools protocol by
`visual/scripts/audit.ts`. Each figure was captured at 1280 px (DSF 1) and 390 px (DSF 2,
mobile emulation), after scrolling into view and letting it run for 4 s. Every range was
then set to its minimum and maximum, every button except Pause was clicked, and a pointer
drag was made across the canvas, with a capture after each step. Follow-up captures for the
checkboxes, a mid-crossfade hero state, cell clicks and Push upward came from
`iv-extra.ts` and `hist-extra.ts`. I looked at every montage, plus the individual shots
where detail mattered.

**Where to find the shots.** Screenshots are in `visual/{hist,iv}/{1280,390}/NN-<state>.png`,
with a per-figure contact sheet in `montage-NN.png` and extra captures in `x-*.png`.
Figure numbers (NN) are listed per lesson below.

**Caveats.**
- The history MDX and `TimelineHero.tsx` (smoothness plate: "open (2000–)" became
  "under review (2026)") were edited by another session at 14:04, during this audit. The
  IV MDX was edited at 14:01. No figure components or sim files changed. The prose line
  numbers below are from the current files.
- At 390 px, figures taller than the viewport show the site's sticky header painted over
  their top edge. That comes from the capture method, not the page.
- The history run crashed at block 12 and was resumed. As a result, `hist/*/report.json`
  exists only as `report-from12.json`, and montages 00–11 were rebuilt from the individual
  shots.

**Page-level results.**
- **Console, both lessons, both widths:** clean apart from a dev-only
  `favicon.ico 404` and React Router future-flag warnings. No exceptions.
- **KaTeX and images:** no `.katex-error` and no broken `<img>`. No page overflows
  horizontally at 390 px (scrollWidth equals viewport). No visible KaTeX HTML runs past the
  viewport; the only wide nodes are hidden MathML.
- **Headers:** History has an H1 and no version switch (single version), which is correct.
  IV has the I–IV version pills (IV active) with the note "working draft · Put the dye back
  · …", then the H1 "Building a Fluid Simulation". `document.title` on both pages is the
  site name ("Nick's Visual Math Lessons"), not the lesson title (nit, site-wide).
- **Cross-links:** IV → History works (inline IfLesson link, plus the SeriesNext card
  "The History of Navier–Stokes →"). History → Building ("previous lesson",
  `lesson-03…mdx:745`, and the "Building the Navier–Stokes Equations →" card) resolves to
  `/lesson/navier-stokes` with no `?v=`, so it lands on version **I**, not IV. That is
  correct only while I is the default.

---

## Building IV (`src/lessons/lesson-01-navier-stokes.IV.mdx`)

| # | Figure | Verdict |
|---|---|---|
| 00 | ReturnExperiment | OK. Loads already at Returned: 100% vs 16%, patches clearly recovered on the left and washed out on the right. Start, Stretched and Returned all behave. |
| 01 | CellStorage | **FIX** |
| 02 | BacktraceLab | OK. The arrow, the departure dot and the "40% × 0.90 + 60% × 0.35 = 0.57" readout agree at 0, 1.4 and 4 cells. |
| 03 | TransportErrors | **FIX** (colour) |
| 04 | ReturnExperiment refine | **FIX** (weak) |
| 05 | ParcelAcceleration | OK. Probe 2.20 m/s; parcel 1.05 → 3.49 m/s at the ends of the slider, matching the prose. |
| 06 | DiffusionLab | **FIX** |
| 07 | CellFlux | **FIX** (nit-level) |
| 08 | ProjectionLab | **FIX** |
| 09 | ProjectionLab iterations | OK. Violet residual shown on the right: 100 / 26 / 4 / 0.07%, and it visibly broadens at 40 sweeps. |
| 10 | SolverCycle | OK. With ×10 on, the push appears as vertical arrows (`x-cycle-push-x10.png`). Without ×10 it is invisible, as the prose warns. |
| 11 | TermExperiment | OK. Opens on "No pressure correction" at 0.6 s with a saturated violet pane; No viscosity keeps a swirl (Energy/mass 17.7 vs 11.8). Nit: the imbalance overlay hides the dye in both panes. |
| 12 | LiveSolverLab | **FIX** |

**01 CellStorage: FIX.** Shots: `iv/1280/montage-01.png`, `iv/1280/x-cellstorage-click-rose.png`.
- **Prose (l.50):** "Select a cell to read its amber concentration."
- **What the figure does:**
  - The only control is an "Inspect column" slider, and the row is fixed at 6.
  - Clicking the canvas does nothing.
  - Row 6 never crosses the rose patch, so a reader can't reach the rose cells at all.
  - The readout only ever says "Amber concentration".
- **Fix:** either add pointer selection of (column, row) to `createCellStorage`, with a
  dye-aware readout ("Rose concentration" on rose cells), or change the prose to "Move the
  column slider…". Source: `src/sims/construction-v4/ReturnExperiment.tsx:97–127`
  (label at 116–117, slider at 127).
- **Also:** the blue face dots are about 3 px, hard to see at 390 px.

**03 TransportErrors: FIX (colour key).** Shot: `iv/1280/montage-03.png`.
- The unstable "Local slope update" curve and its range readout are drawn in `C.div`
  (violet). In this article violet means divergence, and both curves are dye
  concentration.
- **Fix:** use neutral ink or a dashed dye colour for the slope pane.
  Source: `src/sims/solver-lab/TransportLab.tsx:81,84`.

**04 ReturnExperiment refine: FIX (weak, contrast in one frame).** Shot: `iv/1280/montage-04.png`.
- **Prose (l.157):** "overlap rises from about 9% … to 16% … and 38%". The numbers are correct
  (9 / 16 / 38%), but only one grid is ever on screen, so the reader has to remember the
  other two.
- **Fix:** add ghost tick marks on the right overlap bar for the other two grid values
  (for example, "24²: 9%" and "96²: 38%").
- **At 390 px:** the stacked panes plus controls are about 870 px tall, so exact-vs-grid is
  never in view at once.

**06 DiffusionLab: FIX (meter ordering, rule 2b).** Shots: `iv/1280/montage-06.png`.
- **Prose (l.238):** "The alternating stripes lose their sharp velocity differences quickly."
- **What the meter says:** at ν = 8, "Kinetic energy" reads 37% for the jet and 42% for the
  stripes, so the meter ranks stripes as losing *less*. Total KE is dominated by the mean
  flow and the walls.
- **Fix:** meter the energy of the deviation from the layer mean, or "velocity variation
  remaining", so the stripes score lowest. Source:
  `src/sims/solver-lab/DiffusionLab.tsx:34`.
- **Also:** the "Kinetic energy" readout is drawn in the viscosity green (`C.visc`). That is
  acceptable, but unexplained in IV.

**07 CellFlux: FIX (nit-level).** Shots: `iv/1280/montage-07.png`, `iv/390/07-initial.png`.
- **Unexplained "p":** a red **"p"** sits in the cell centre (`C.pHi`) before pressure has been
  introduced, and nothing explains it. Drop it or label it. Source:
  `src/sims/solver-lab/CellFlux.tsx:23`.
- **Label overlap at 390 px:** "OUT 1.7" collides with the cell border. Offset it by the
  arrow length, not `scale*.7`. Source: `CellFlux.tsx:22`.
- **Units:** "Total in: 1.5" has no units while "Total out" does.

**08 ProjectionLab: FIX (contrast not drawn).** Shot: `iv/1280/montage-08.png`.
- **Prose (l.311):** "At 150%, the same pressure pattern overcorrects and creates imbalance
  again."
- **What the figure shows:** the right pane shows only pressure (cyan/pink); the residual
  imbalance at 35% (65%) or 150% (50%) exists only as a meter number. Figure 09 does draw
  the violet residual on its right pane, so the two figures are inconsistent.
- **Fix:** overlay the violet residual on the corrected pane, as `iterations` mode does.
  Source: `src/sims/solver-lab/ProjectionLab.tsx` (right-pane draw near l.21).
- **Also:** the pink "higher pressure" wash is unlabelled; the caption says only "Cyan: lower
  pressure".

**12 LiveSolverLab: FIX.** Shots: `iv/1280/montage-12.png`, `iv/1280/x-live-push-*.png`.
- **Unlabelled readout:** a small violet readout in the bottom-right ("1.1e-11 /s") has no
  label. The prose (l.421) leans on "the pressure residual can be tiny". Label it
  "Pressure imbalance 1.1e-11 /s". Source: `src/sims/solver-lab/SolverWorkbench.tsx:112`.
- **Push upward:** at the default viscosity, the push is only faintly visible after 0.4 s
  and 1.9 s (a slight vertical kink in the amber).
- **Viscosity readout:** shows "1.0" with no units, while the prose gives cell widths squared
  per second.

**IV page-level: FIX, only if IV becomes the default version.**
- The registry title is "Building the Navier–Stokes Equations" (`src/lessons/registry.ts:243`),
  but the IV H1 is "Building a Fluid Simulation".
- The lesson poster `src/assets/lesson-previews/navier-stokes.png` is the Prandtl wing flow.
  No wing appears anywhere in IV (see `visual/lesson-previews.png`).

---

## History (`src/lessons/lesson-03-navier-stokes-history.mdx`)

| # | Figure | Verdict |
|---|---|---|
| 00 | TimelineHero (top) | **FIX** |
| 01 | BuoyancyCrown | **FIX** |
| 02 | PascalMountain | OK. 712 / 712 → 712 / 627 ("85 mm lower") → 712 / 712, matching Périer's 8.5 cm. |
| 03 | FlowPrediction | OK. Fixed field vs evolving field clearly differ; drag and Add dye both inject visible fresh dye. Nit: the "Stir the middle" button is not mentioned in the prose. |
| 04 | MomentumExchange | **FIX** (colour, nit) |
| 05 | CorpuscleHail | **FIX** (weak) |
| 06 | BernoulliPipe | **FIX** |
| 07 | StringSection | **FIX** |
| 08 | Predict + IdealFlow | OK. The veil works; totals 0.25 / 1 / 4 at 0.5× / 1× / 2×, net drag 0.000, gray ghost arrows present. Nit: at the initial 1× the surface arrows are about 6 px. |
| 09 | FlowVis (arrows) | **FIX** (weak) |
| 10 | TermStack (Euler) | OK. The viscous slot is muted gray, which the prose calls "the green slot": acceptable. |
| 11 | PressureOff | OK. 100% vs 7%; paths stop at the wing without pressure; both panes read 100% when restored. |
| 12 | MolecularSprings | OK. 0% vs 34% (default) and 2% → 50% across the slider; the gray excursion tracks are visible. |
| 13 | TermStack (complete) | OK. |
| 14 | StressCube | **FIX** |
| 15 | FallingSphere | **FIX** |
| 16 | PoiseuillePipe | OK. At r = 0.5: "Flow 6.3%", columns 1.01 vs 0.06 (×16). Nit: the flow readout sits under the upper pipe but describes the lower one. |
| 17 | ReynoldsTube | OK. 0% makes the two views identical; the pink pulse is visible in both. |
| 18 | BoundaryLayerLoupe | **FIX** |
| 19 | WhorlsCascade | OK. Heat 10% vs 76% at default; the L/16 bar reaches 26% at the weakest loss, as claimed. |
| 20 | TimelineHero (reprise) | Same as 00. |

**00/20 TimelineHero: FIX (high).**
Shots: `hist/1280/00-*.png`, `hist/390/00-btn8_1904.png`, `hist/*/x-hero-*.png`.
- **Inset hides the wake on mobile.** The "near the wing" inset is a fixed 122 × 112 CSS px
  box, so at 390 px it covers about a third of the canvas, including the whole wake the prose
  tells readers to mark and watch (l.43–47).
- **Blue strokes barely visible.** The blue strokes the prose describes (l.62) are 1.6 px on
  a 3 px gray bar, at most 34 px long. At 1280 px I could read them only after zooming. In a
  running state they turn red (reversed flow), which the hero prose doesn't mention.
- **Fix:** scale the inset with `w`, or move it below or beside the canvas on narrow widths.
  Thicken the blue strokes, draw a wall tick, and mention red in the prose. Source:
  `src/sims/history/flow.ts:292–316`.
- **Crossfade colours:** at 50/50 (`x-hero-mid-2.5.png`), amber dye plus the cyan "farther
  era" renders as an olive/teal wash that reads as a third fluid, and the era dots switch
  to teal/red. This is a nit, but consider fading the farther era in gray instead of cyan.
- **Other nits:**
  - On mobile the drag badge overlaps the wing's leading edge.
  - The term row wraps "smoothness" onto its own line at some eras but not others, so the
    page jumps while scrubbing.

**01 BuoyancyCrown: FIX (legibility).** Shots: `hist/1280/montage-01.png`, `hist/390/01-initial.png`.
- The force labels "weight 1.00" and "buoyancy 0.77" are drawn over the gray block in
  gray/teal. They are illegible at both widths, and "floor 0.23" is partly covered.
- **Fix:** place the labels outside the block, or add a white halo stroke. Source:
  `src/sims/BuoyancyCrown.tsx:233`.

**04 MomentumExchange: FIX (colour, nit).**
- The velocity arrows are drawn in the dye colours (amber upper, rose lower), while the
  article's key uses blue for velocity. Source: `src/sims/MomentumExchange.tsx:44`.

**05 CorpuscleHail: FIX (weak, prose claim).** Shot: `hist/1280/montage-05.png`.
- **Prose (l.185):** "the averaged reading settles on a perfectly definite drag".
- **What the meter shows:** at the same 2× speed, "avg 6 s" read 1.25 in one capture and 1.89
  in another; "now" reads 0.00 most frames. With only 150 particles the average is noisy.
- **Fix:** raise `N_PARTICLES` (`src/sims/CorpuscleHail.tsx:37`) or lengthen the averaging
  window.

**06 BernoulliPipe: FIX (legibility).** Shot: `hist/1280/montage-06.png`.
- Each gauge needle is drawn through its own numeric readout ("-0.11" and "+0.10" are
  struck through). At "pinched" the throat dial overlaps the pipe wall.
- **Fix:** move the value below the dial pivot or out of the needle's sweep. Source:
  `src/sims/BernoulliPipe.tsx:153`.
- **Also:** the bottom third of the canvas is empty.

**07 StringSection: FIX (question 1 fails).** Shot: `hist/1280/montage-07.png`.
- An unlabelled amber squiggle: the pulse has become a bipolar wiggle riding a straight
  diagonal slope, with small ripples trailing behind it (visible after 4 s and again after
  Reset).
- There is no text on the canvas: no "string", no fixed-end markers, nothing about
  curvature. The prose (l.232) calls it an equation relating change in time to curvature,
  and nothing on screen shows that.
- **Fix:**
  - Add pinned-end markers and a label.
  - Optionally draw curvature (u_xx) as a faint fill.
  - Check the seed and damping, which likely cause the slope: `uPrev = shape(i − C)`
    together with `(…)*DAMP` on the whole update. Source:
    `src/sims/StringSection.tsx:26–41`.
- **Colour:** amber is the dye colour, used here for a string.

**09 FlowVis arrows: FIX (weak).** Shot: `hist/1280/montage-09.png`.
- A near-uniform rightward arrow field. Moving the "slow ↔ speed of time" slider end to end
  gives screenshots that look the same, so the slider does nothing visible in a still.
- The figure carries the prose's "at *this* point, how fast" (l.322) only as decoration.
- **Fix:** use a field with visible spatial variation (the hero's wing flow, for example),
  plus a probe readout at one point.

**14 StressCube: FIX (clipping at 390 px).** Shots: `hist/390/14-initial.png`, `hist/1280/montage-14.png`.
- **Clipped text at 390 px:** "σyx = σxy — sits still", the matrix's right column and
  "they spin, / the smaller one faster" all run off the right edge.
- **Overlap at both widths:** the larger ghost square overlaps the main parallelogram (at
  390 px), and the "σyx pinned at 0" caption overprints the larger ghost (at 1280 px).
- **Fix:** position the text relative to `w`, or stack the matrix and ghosts below the cube
  when `w < 500`. Source: `src/sims/StressCube.tsx:153–186` (box width 96 at l.156 is too
  narrow for "0.35").

**15 FallingSphere: FIX (legibility).** Shot: `hist/1280/montage-15.png`.
- A landed ball sits centred on the floor line and covers its column's readout
  ("v 3█ mm/s").
- **Fix:** rest the ball above the floor, or move `READOUT_Y` below the ball radius.
  Source: `src/sims/FallingSphere.tsx:332`.

**18 BoundaryLayerLoupe: FIX (claim hard to see).** Shot: `hist/1280/montage-18.png`.
- **Prose (l.620–623):** "Choose **Rear** … negative samples turn red."
- **What the figure shows:** the Rear preset (145°) shows only about 2 px of red at the wall.
  At 160° (slider max) a clear red run appears, 0.2–0.75 radius from the wall.
- **Fix:** set Rear to about 160, or magnify the near-wall band. Source:
  `src/sims/BoundaryLayerLoupe.tsx:206`.

---

## Summary of FIX items (no BLOCKERs)

**Highest priority**
1. History 00/20 Hero: the near-wall inset hides the wake on mobile, and its blue strokes are barely visible (`history/flow.ts:292–316`).
2. History 14 StressCube: text clipped at 390 px, and ghost overlaps (`StressCube.tsx:153–186`).
3. History 07 StringSection: an unlabelled, degraded squiggle (`StringSection.tsx`).
4. IV 01 CellStorage: the prose says "Select a cell", but only a column slider exists and rose cells can't be reached (`construction-v4/ReturnExperiment.tsx:97–127`, or MDX l.50).
5. IV 06 DiffusionLab: the KE meter ranks stripes as losing less than the jet, against the prose (`DiffusionLab.tsx:34`).
6. IV 08 ProjectionLab: the residual imbalance is not drawn on the corrected pane (`ProjectionLab.tsx`).

**Legibility**
7. History 01 Buoyancy: labels drawn on the block (`BuoyancyCrown.tsx:233`).
8. History 06 Bernoulli: needles strike through the values (`BernoulliPipe.tsx:153`).
9. History 15 FallingSphere: the ball covers the readout (`FallingSphere.tsx:332`).
10. IV 12 Live: unlabelled residual readout (`SolverWorkbench.tsx:112`).

**Claim or evidence weak**
11. History 18 Loupe: the Rear preset barely shows red (`BoundaryLayerLoupe.tsx:206`).
12. History 05 Corpuscle: the average doesn't settle (`CorpuscleHail.tsx:37`).
13. History 09 FlowVis: uniform field; the slider does nothing visible.
14. IV 04 refine: only one grid on screen, so the three-way contrast is never visible together.

**Colour key**
15. IV 03 local-slope curve drawn in divergence violet (`TransportLab.tsx:81,84`).
16. History 04 velocity arrows in dye colours (`MomentumExchange.tsx:44`).
17. IV 07 unexplained red "p" (`CellFlux.tsx:23`); "OUT" label collision at 390 px.

**Page level, conditional**
18. IV title and poster don't match the registry entry, if IV becomes the default.
19. History "previous lesson" link lands on Building version I.

---

## IV fixes (2026-09-23, after the audit above)

Re-captures are in `visual/iv-after/{iv,i}/{1280,390}/<data-lab>-<state>.png`, with per-figure
contact sheets `m-*.png`, made by `visual/scripts/iv-after.ts` against the running dev server.
Version I was re-captured wherever a shared solver-lab component changed. Every PNG was looked at.

| # | Figure | Change | Evidence |
|---|---|---|---|
| 01 | CellStorage | Cells are now selected by pointer/tap on the grid (`cellAt` hit-test, `onPointerDown` on the figure wrapper); Column and Row sliders remain for keyboard users and echo the selection. Readout is `Column c, row r` and `Amber x.xx · Rose y.yy`, so rose cells read as rose. Face dots scale with the cell (min 3 px). Prose l.50: "read its amber concentration" → "read its amber and rose concentrations". | `iv/*/cell-storage-click-rose.png` (Column 9, row 8: Amber 0.00 · Rose 1.00), `-row-slider-3.png` |
| 03 | TransportErrors | Local-slope curve and its range readout now in the dye amber (`C.dye`), not divergence violet. No prose in I/II/IV named the colour. | `iv/*/transport-*.png`, `i/*/transport-*.png` |
| 04 | Refinement | In `refine` mode the grid pane's overlap bar carries a tick for each grid at the current step, and a line `24 × 24: 9%   48 × 48: 16%   96 × 96: 38%` (current grid bold). Canvas 20 px taller in that mode only. The hero (00) is unchanged. | `iv/*/return-refinement-{2424,4848,9696}.png`; at Stretched the line reads 7 / 9 / 11%. |
| 06 | DiffusionLab | Diagnosis: the "Kinetic energy" meter is honest but measures mostly the mean flow, which the walls drain slowly; the stripes start with a larger mean than the jet, so at ν = 8 they keep 42% vs the jet's 37%. Added a `readout` prop: `'energy'` (default, versions I/II, whose prose says "dissipates kinetic energy, shown beneath the profiles") and `'differences'` — the total layer-to-layer speed difference Σ\|u[i+1] − u[i]\|, relative to the start. IV mounts `readout="differences"`. Ordering now: ν = 8 jet 52%, layers 79%, stripes 9%; ν = 1 stripes 10%; ν = 3 jet 75%. Stripes lowest at every viscosity. | `iv/*/diffusion-{jet-max,layers-max,stripes-max,stripes-1}.png` |
| 07 | CellFlux | `pressureMark` prop (default true). IV passes `false`: no "p" before pressure is introduced (IV l.283). In I/II the "p" stays and gains a small "pressure" caption. Side labels now hang off the cell border (`IN 1.0` right-aligned at x − 5, `OUT r` left-aligned at x + s + 5) instead of centring on the arrow, which collided with the border at 390 px. "Total in" now carries m³/s like "Total out". | `iv/390/cell-initial.png`, `i/1280/cell-initial.png` |
| 08 | ProjectionLab | New `FieldView` `'pressure-residual'` in `view.ts`: the pressure wash with the remaining divergence over it in violet. The corrected pane uses it in the correction mode (the sweeps mode already drew divergence). Subtitle: "Cyan low, pink high pressure · violet: imbalance left". At 100% the pane is pressure only; at 150% a violet block appears at the centre (sign reversed), at 35% most of the ring remains. Consistent with I/II prose ("Beyond that, the correction introduces an imbalance of the opposite sign"). | `iv/*/projection-{0,35,100,150}.png`, `i/*/projection-*.png` |
| 12 | LiveSolverLab | Corner readout labelled `Imbalance 9.8e-12 /s`, matching the "Imbalance … /s" labels of the cycle and comparison figures and IV's "the imbalance readout in the corner". | `iv/*/live-initial.png`, `i/*/live-initial.png` |

**Checks.** `bun run typecheck` clean for the files touched here (two `StressCube.tsx` errors on
`gx` belong to the concurrent history session). `check:construction-v4` 1504 passed (new checks:
pointer hit resolves to the cell under it, hits outside the grid select nothing, a saturated rose
cell is selectable, the refinement comparison line stays on canvas and names 9 / 16 / 38%);
`check:construction` 142; `check:publication` passed; `scripts/check-ns-revision.ts` 742 (imports
`panes` from `view.ts`).

**Not changed.**
- Versions I/II keep the kinetic-energy meter (their prose depends on it), so their stripes-vs-jet
  ordering at high viscosity is unchanged; the `differences` readout is available if that prose
  is ever revised.
- IV 04 at 390 px is still about 870 px tall (stacked panes); the comparison line fits in the gap
  between panes.
- Capture artefact: `i/390/cell-{min,max}.png` show the slider moved but the canvas not redrawn;
  the same component redraws in `iv/390` and `i/1280`, so this is the harness, not the figure.

---

## History fixes (2026-09-23, after the audit above)

After-shots are in `visual/hist-after/{1280,390}/`, captured with
`visual/scripts/hist-after.ts` against the same dev server, same method
(scroll into view, run, set controls, clip). Each item was looked at at both
widths. Files touched are listed per item; nothing under
`src/sims/construction-v4/` or `src/sims/solver-lab/` was changed.

**00/20 TimelineHero (`src/sims/history/flow.ts`, inset block near l.291).**
- Before: fixed 122 × 112 px inset top-right, covering the wake at 390 px; 1.6 px blue strokes; no wall mark.
- After: the inset scales with the canvas (`clamp(w/640, 0.7, 1)`) and, below 560 px, sits bottom-left over the undisturbed inlet stripes; the wake is clear (`390/00-hero-1904-wake.png`). Strokes are 2.5 px blue on a 4 px gray bar with a wall line. The samples are now 2.6 cells apart (0–16 cells) instead of 1.4 (0–8): measured, the stalled layer above the shoulder is 12–14 cells deep (|u| < 0.25 U), so the old span showed seven near-zero strokes. The profile now reads full speed at the top, stopped and reversed toward the wall (`1280/00-hero-1904-20s.png`, inset).
- Prose (l.62–64): "Its blue strokes show the computed streamwise velocity; the gray strokes show…" → "Its blue strokes show the computed streamwise velocity, red where it runs backward; the gray strokes show…".
- Not done: the cyan crossfade and the drag-badge/term-row nits.

**01 BuoyancyCrown (`src/sims/BuoyancyCrown.tsx`, `drawArrow` and its three calls).**
- Before: "weight" and "buoyancy" labels 8 px off the arrow, on the gray block.
- After: labels hang off the block's edges (weight left, buoyancy right, floor arrow moved just outside the right edge), 11 px semibold with a white halo. Legible at both widths (`*/01-buoyancy-*.png`).

**04 MomentumExchange (`src/sims/MomentumExchange.tsx:48`).**
- Before: velocity arrows in the dye colours.
- After: `PALETTE.vel` for every arrow; markers keep the dye colours. `scripts/check-history-followups.ts:71` now counts blue ink for its arrow check.

**05 CorpuscleHail (`src/sims/CorpuscleHail.tsx`).**
- Before: 150 corpuscles, random heights; the 6 s average wandered ±20% at a fixed speed.
- After: one corpuscle per 400 px² (400 on the desktop canvas, ~220 on mobile), heights from a golden-ratio sequence so the inflow is stratified across the front face, and a `measure()` on the stepper. Measured over 40 s (`avg` sampled each second after 8 s): 620×260 at 1× mean 1.77, sd 2.9%; at 2× mean 7.02, sd 1.2%; 340×260 at 1× sd 1.7%, at 2× sd 0.6%. Both readouts in `*/05-hail-*.png`.

**06 BernoulliPipe (`src/sims/BernoulliPipe.tsx`, `drawGauge` text; `midY` 0.56 → 0.6).**
- Before: value drawn at the pivot, struck through by the needle.
- After: label and value stacked above the arc, outside the sweep; the pipe sits lower so the bulge dial's stack has headroom and the bottom of the canvas is used (`*/06-bernoulli-pinched.png`).

**07 StringSection (`src/sims/StringSection.tsx`; MDX l.237 `stage="string"` → `stage="plucked"`).**
- Before: an unlabelled amber squiggle sagging into a diagonal with ripples. Cause: the loss factor multiplied the whole update `(2u − uPrev + c²Δu)·DAMP`, which is a Klein–Gordon mass term, not friction — long wavelengths outran the pulse. Also C = 0.5 (dispersive) and a seed that travelled left while the comment said right.
- After: Courant number 1 at dt = 1/120 (the exact travelling-wave step, no dispersion; same crossing time), loss applied to the velocity only, seed corrected. New `plucked` stage for the history lesson: dark string, pinned ends drawn and labelled "fixed", sepia arrows of the second difference at every eighth point with the key "arrows: acceleration, set by the local curvature", which is the sentence before the figure. The four lesson-02 stages keep their look and gain only the scheme fix (`*/07-string-*.png`).

**09 FlowVis (`src/sims/FlowVis.tsx`; MDX l.322 `<FlowVis mode="arrows" />` → `<FlowVis mode="arrows" field="eddy" probe />`).**
- Before: near-uniform breeze; nothing on screen carried "at this point, at this instant".
- After: an `eddy` field (a divergence-free vortex train carried downstream at the base speed, periodic in x) so the arrow field varies visibly, plus an opt-in draggable probe: a ring, a heavier velocity arrow at it, and a readout "at the ring, now / speed 0.20 widths/s". Both are props, so the three lesson-01 mounts are unchanged. The time slider is still a rate knob; it now changes how fast the eddy passes the ring, which is visible live but not in a still (`*/09-flowvis-*.png`).

**14 StressCube (`src/sims/StressCube.tsx`, `draw`).**
- Before: text at fixed fractions of `w`; matrix and captions off the right edge at 390 px; ghosts overlapping the element.
- After: element in a left column (`s = min(0.19 w, 0.28 h)`), everything else in a right column that starts past the element's widest skew; the matrix box is measured, captions word-wrap to the column, the ghosts spread across `min(colW, 220)` and sit below the captions. Nothing clips at 390 px; 1280 px unchanged in content (`*/14-stress*.png`).

**15 FallingSphere (`src/sims/FallingSphere.tsx` layout constants).**
- Before: floor at y = 300, readout at 310; the landed 28 px ball covered its reading.
- After: floor at 282, readout at 314 (a full big-ball radius below the floor). Fall is 226 px = 64.6 mm, race 1.81 s; the ¼ / ½ / ¾ rules still measure the leader's travel, so the "quarter of the way down" check is unchanged (`*/15-sphere-*.png`).

**18 BoundaryLayerLoupe (`src/sims/BoundaryLayerLoupe.tsx`; `scripts/check-loupe.ts`).**
- Before: Rear = 145°, ~2 px of red.
- After: Rear = 160°. Measured over 40 s: 145° averages 1.8 reversed samples, 160° averages 11.3 with red in 94% of frames. The reversed run only forms after ~8 s of flow, so the pre-roll went from 200 to 360 steps (9 s); `createLoupe` now takes ~3.4 s synchronously in bun (was ~1.9 s). The check script asserts ≥ 4 reversed samples at 160° on the first frame. No angle appears in the prose, so l.620–623 still holds (`*/18-loupe-rear*.png`).

**Checks after all changes:** `bun run typecheck` clean; `check:history` 63 passed; `check:history-followups` 40 passed; `check-loupe` 22 passed; `check:timeline` 40 passed.
