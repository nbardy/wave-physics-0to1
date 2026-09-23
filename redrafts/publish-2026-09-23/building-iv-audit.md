# Building IV — detection audit (2026-09-23)

Target: `src/lessons/lesson-01-navier-stokes.IV.mdx` (*Building a Fluid Simulation*, 3,388 words, 13 figure slots). Line numbers are as of this read; the tree is shared, so re-locate by quoted text. Detection only — nothing below has been applied to the MDX.

Numbers quoted in the prose were re-derived from the component code in this session (`transport.ts`, `solver-lab/core.ts`, `TransportLab.tsx`): 24²/48²/96² return overlap 8.9 / 16.0 / 38.4 %; exact return 100.00 %; dye-sum ratio 1.000000000000 at all three; 100 % correction 5.996e-10, 150 % correction 0.500; 10/40/160 sweeps 25.8 / 4.385 / 0.072 %; local-slope range at 8 updates −1.10..2.10. Every number the prose prints is right. The findings below are about what the reader can *see*, and about the words.

Counts: **MUST 7 · SHOULD 12 · COULD 11.**

---

## 1. Opening audit (INTROS.md)

Lines 12–24, then the hero at 26, then 28–42.

**Shape.** The three moves are present in outline. Move 1 (12–15) is the reversible trip; move 2 (21–22) is the inversion, "Even with no molecular diffusion in either calculation, they disagree about what comes back" — that sentence is the best in the intro and is doing exactly what INTROS asks; move 3 (22–24) is the thesis, last. Hero at ~185 words — fine. The intro spends no later payoff (the interpolation mechanism, the 9/16/38 ladder, and the pressure solve all still arrive as news). No metaphor. No "surprisingly".

**Where it fails the constitution.**

- **Rule 4 (open cold on a concrete thing) and rule 6 (hands, never imagination).** L12 "Move a patch of dye along a set of paths, then send every point back along the same paths in reverse." is an imperative addressed to nobody — the reader is being asked to picture an operation, which is "imagine" with the word removed. The article's concrete thing (two patches, a current that slides rows and columns, a square whose edges join) is one paragraph below. The p-bits winner opened on *the laptop in front of you*; this opens on an exercise statement.
- **Rule 2 (nothing schedules)** is broken *after* the hero, L40–42: "First we need to understand how a computer carries a quantity through a velocity field. Then we can make that velocity field evolve too." Two sentences that deliver nothing now (SLOP family 1; MUST-1 below).
- L14–15 "Stretching the patch into thin strips makes the return more intricate, but does not change the destination." is a hedge sentence — it pre-answers an objection nobody has raised yet. Fold it into the fact.

**Verdict: fails on rules 4/6 and 2, passes rules 1, 3, 5, 7, 8, 9.** Fixable in two sentences; the inversion and thesis stay as written.

**Minimal fix (fewest words changed, register of the neighbours):**

> ✗ L12–15 "Move a patch of dye along a set of paths, then send every point back along the same paths in reverse. Provided the dye does not diffuse along the way, it returns to its original shape. Stretching the patch into thin strips makes the return more intricate, but does not change the destination."
>
> ✓ "Below, a prescribed current carries two patches of dye along a set of paths, then sends every point back along the same paths in reverse. With no diffusion along the way, the dye returns to its original shape, however thin the strips it was stretched into on the way out."

and L17 "Below, two calculations make that trip." → "Two calculations make that trip." (avoids the double "Below"; the rest of 17–24 stands). Then MUST-1 for L40–42.

---

## 2. Reader journey

### 2a. Curious non-specialist

- **L12–24.** Parses the trip; "slides neighbouring rows and columns by different amounts, then undoes those motions in reverse order" is dense but the figure is right there, so I hold on. "they disagree about what comes back" — I want to see it. Good.
- **L26–32 (hero).** The figure opens at *Returned* (slider defaults to the end), so the first thing I see is the answer: left pane two clean discs, right pane a smear, bar 100 % vs 16 %. Then I press Start and Stretched. Works, and the strips on the left at *Stretched* are the moment I'd retell. The slider is labelled **"Stir → return"** — the prose never says stir; small dissonance (SHOULD-4).
- **L34–36.** "It loses *where the dye was*, while keeping how much there was." Clear, and this is the article's sentence. I believe the "preserves the total amount to roundoff" on the author's word — nothing on screen shows it (J2).
- **L38–42.** "The slider visits saved moments" — fine. Then two sentences telling me what we'll do next. Sag; the author's hand on my back (MUST-1).
- **L44–67.** The cell figure is plain but I understand "one number per cell". "Its advantage will become concrete when…" — an IOU stated as an IOU (SHOULD-1). Section ends on a question to me (MUST-2). Mild lab-manual feel starts here: "Select a cell", "Change the travel distance", "Scrub time", "Increase viscosity", "Adjust the right-face outflow" — the whole article addresses me in the imperative and never once says "you can". Not slop, but it is the register Nick called dry.
- **L69–105.** Backtrace figure plus the two-weight readout: the best teaching stretch in the article. "0.35 × 0.65 + …" on the canvas and the formula above it match. I get it.
- **L107–143.** The local-slope update going negative is vivid on the left pane; the "curve clipped" range readout is honest. **L134–139 is my first near-exit**: a square-root amplification factor with a wavenumber $k$ that I have never seen on a canvas, dropped in one paragraph. I skim to "Reducing the timestep slows the growth but does not make this scheme stable" and carry on. L142–143 "one whose error is quieter and much easier to mistake for fluid behaviour" is the sentence I keep.
- **L145–182.** The hero comes back with a grid selector; the prediction prompt at 156–157 is the right size (I guess yes; I get 38 % and I'm wrong; good). L170–173 is a real waypoint: three checks, three answers. L175–178 (why the sum is conserved *here*) and L180–182 (molecular diffusion left out) are two caveat paragraphs in a row at the end of the act — second sag. I would not exit but I stop reading closely.
- **L184–215 (the turn).** "So far we have supplied the motion. For a fluid simulation, we must calculate how that motion changes." I accept the new question; it is stated plainly and it is the obvious next thing. But the two discs and the exact-vs-grid twin panes are gone from here to the end, and I notice. The nozzle figure is a different object again. The material derivative is well staged (probe vs parcel numbers on canvas, then the chain rule).
- **L217–250.** Viscosity as layers is fine; "layers, stripes" buttons work. L249–250 closing generalisation — skim.
- **L252–343.** *The Water Has to Fit* is good (I balance the cell). Then five figures in a row are violet-on-grid with a percentage: projection, sweeps, cycle, omissions. Each one is honest and each has a claim, but this is the stretch where I'd say "diagrams about arrays" if asked. The derivation 285–302 is short enough. L312 says "below one billionth" while the meter reads "0.00%" — I look for the billionth and don't find it (SHOULD-6). L341–343 reads like a code comment pasted into the article; skim.
- **L345–397.** Assembling the equation lands because every symbol has now been on a canvas. The cycle figure is good; "Enlarge velocity change ×10" is the kind of honest knob I like. L380 "We can inspect the consequences of leaving an operation out." — committee sentence (MUST-3). L394–397 reads as the author arguing with a reviewer (SHOULD-9).
- **L399–431.** The live lab is fun; drag works; "Add dye" is nice. L421–424 is where I feel the author most: "Those observations are compatible." (MUST-4) and "Each measures an error the other cannot see." (SHOULD-11) — tidy, quotable, and the two sentences between them already said it. The final paragraph is advice ("We should compare the quantity we actually care about") rather than a thing happening; the article ends on a moral, not on the dye.

**Retell tomorrow:** "Even if the maths is perfectly reversible, a grid can't put the dye back — the pixels blur every step, and a grid four times finer only got 38 % back. And the simulation's own check (does the water volume balance?) can pass perfectly while the picture is wrong."

**Near-exits:** L134–139; L175–182; L283–343 (five violet figures); L426–431 (moral ending).

### 2b. Hard-case skeptic (CFD practitioner)

- Opening: "prescribed shears and their inverses, no diffusion" — clean; nothing overclaimed; they will not mistake it for Taylor's unmixing (the article never says "unmixing"). Good.
- L96–105: SL advection, bilinear, bounded, no CFL — correct and stated with the right hedge ("does not mean a large step follows a complicated current accurately").
- L129–139: FTCS, $|g| = \sqrt{1 + C^2\sin^2 kh}$ — correct. They will note $k$ is never defined on a canvas; fine for them.
- **L161–164 is where they push back.** "Even the finest offered grid loses detail" — a practitioner reads the 9/16/38 ladder as *first-order interpolation on sub-cell strips, of course it does*, and immediately asks what people do about it: higher-order interpolation (cubic/monotone), MacCormack/BFECC — BFECC is literally "run it backward and measure the error", i.e. this article's own experiment turned into a corrector. The article never says such things exist, and Further Reading doesn't either. That silence is the practitioner's near-exit; they leave thinking the author does not know. One sentence closes it (SHOULD-5).
- L175–178: the conservation caveat is correct and welcome. L180–182: fine.
- L191–212: fine. "advection of velocity" — they would say "the convective term"; harmless.
- L219–250: $\nu\Delta t/h^2 \le 1/2$ in 1D, stated; the code uses $\alpha \le 0.2$. Good. L249–250 is true and they'd nod.
- L283–343: $DG$ as the Laplacian on a periodic MAC grid — correct; "compatible gradient" remark L338–339 is the kind of thing that earns their trust. GS then CG — fine. They'd want the sweep meter to read what the prose says (4 % vs "4.4 %", SHOULD-7). "pressure residual" at L336 is the CG stopping criterion; at L421 the same phrase is used for the *divergence* readout in the corner — they will catch the conflation (SHOULD-10).
- L360–378: operator splitting named and its error stated; good. L394–397: they'd agree and find it over-explained.
- L399–431: "zero physical viscosity does not give us an exact inviscid solver" — exactly right. Ending advice (grid/timestep refinement on the quantity of interest) is standard verification language; they'd accept it and find it a little dutiful.

**Retell:** "Nice little SL demo: reversible shear map, first-order interpolation, 16 % recovery at 48², shows conservation ≠ accuracy. Doesn't mention higher-order or error-compensation schemes."

### 2c. Spine verdict

**Does IV answer the Sept-16 complaint?** For the first act, yes, and clearly: there is a spine (a trip that must return, and on the grid does not), a cast (amber and rose, exact twin versus grid twin), and a controlled question with an answer key — the exact pane is the answer key, which is the move the history lesson's figures make (controlled questions about water). Act 1's figures (return, cell, backtrace, local-slope, return refined) are all about *this dye on this trip*. That is not "diagrams about arrays".

For the second act (L184 onward) the answer is partial. The change of question is stated honestly in one sentence and does not feel like a trick; it does not feel like a second article either, because the meters keep asking the act-1 question (which check does this pass?). But the *cast* is dropped at the turn: the two discs, and above all the exact twin pane, never appear again; act 2 runs on a different periodic patch with rectangular dye blocks, a Gaussian push, and five consecutive violet-grid figures. That is the array middle again — better motivated than I's (each figure has a claim, no wing tour, no molecules), but cooler than the history's, and prose cannot fix it. The ending then talks *about* the return experiment (L423) instead of returning to it.

**Does the ending pay the opening?** In prose, yes — L421–424 names exactly the two checks the article was built to separate. Structurally, no — the hero does not come back and the last thing on screen is the live lab, whose relation to the 16 % is never stated. One sentence closes the ring (SHOULD-12).

---

## 3. Slop ledger

Family numbers are SLOP.md's. "Test" names which of the four tests (topic-swap / delete / who's-talking / Nick) or which family tell caught it. Replacements are the fewest words changed, in the register of the neighbouring sentences.

### MUST

**MUST-1 · L40–42** "Neither pane calculates what forces produce the current yet. First we need to understand how a computer carries a quantity through a velocity field. Then we can make that velocity field evolve too."
Family 1 (promissory narration), INTROS rule 2. Test: delete — nothing about the fluid is lost; both sentences schedule.
→ "Neither pane calculates what forces produce the current. The velocity is given in both; only the dye is computed."

**MUST-2 · L66–67** "For the moment, take the velocity as given, as it was in the return experiment. What concentration arrives at a grid point during one timestep?"
Rhetorical question (ESSENCE never-list; NICKS_VOICE §6 fork rule — a printed question must be a fork with named candidates; this has none). Nick flags these on sight.
→ "For the moment, take the velocity as given, as it was in the return experiment. The one job left is to find the concentration that arrives at a grid point during one timestep."

**MUST-3 · L380** "We can inspect the consequences of leaving an operation out."
Committee register (family 3, meta-narration) — the sentence announces an inspection instead of doing one. Test: who's-talking — tour guide.
→ "Now leave one operation out." (L380–383 then reads: "Now leave one operation out. Both runs below begin with the same state and push…")

**MUST-4 · L422** "Those observations are compatible."
The exact line the brief anticipates. Family 3; test: delete — the next two sentences *are* the compatibility.
→ delete the sentence.

**MUST-5 · L12–15** (opening move 1) — see §1 for the replacement. INTROS rules 4 and 6.

**MUST-6 · L426–431** (final paragraph) "…We should compare the quantity we actually care about: a transported shape, a force on a surface, a mixing rate. A plausible picture and a small pressure residual are useful evidence, but neither finishes that comparison."
Family 8 (the moral): the article ends on advice in the advisory mood ("We should"), and the ring is left open. Test: Nick — this is METHODOLOGY's verification doctrine reciting itself. Combined with SHOULD-12 (return to the hero), the minimal rewrite of the paragraph:
→ "For a flow whose answer we do not know, repeating the calculation with smaller cells and timesteps is part of finding out whether a feature belongs to the fluid or to the method, and the comparison has to be made on the quantity in question: a transported shape, a force on a surface, a mixing rate. Here that quantity was two patches of dye, and the averaging that washes out the dye in this grid is the same averaging that returned 16 % of them at the top of the page."
(Accuracy note for the editor: the live lab is 48×32 bilinear; the return experiment is 48×48 linear along rows/columns — "the same averaging" is fair; "the same grid" would not be.)

**MUST-7 · L394–397** "These omissions are diagnostic experiments, not three interchangeable physical fluids. In particular, omitting the pressure solve does not turn this into a compressible-flow solver: it supplies no density evolution or equation of state to replace the missing constraint."
Family 18 in reviewer's dress — "diagnostic experiments" is review vocabulary, and "In particular" is a referee's hinge. Test: who's-talking. The physics point (no equation of state) is real and stays.
→ "Omitting the pressure solve does not make a compressible-flow solver: nothing here evolves density or supplies an equation of state in place of the missing constraint."

### SHOULD

**SHOULD-1 · L64–66** "Its advantage will become concrete when we count fluid entering and leaving a cell."
Family 1. Test: delete — the debt is paid at L276–277 ("This is why storing normal velocities on faces is useful") whether or not it is announced here.
→ delete; the sentence before it ("…is called a *staggered grid*.") closes the paragraph.

**SHOULD-2 · L14–15** "Stretching the patch into thin strips makes the return more intricate, but does not change the destination." — folded into MUST-5's replacement; listed separately so the editor sees the hedge was deliberate to remove.

**SHOULD-3 · L59–62** "We are tracking values at fixed locations rather than maintaining an identity for every parcel in the water."
Committee register ("maintaining an identity"). Test: Nick.
→ "We store values at fixed places and never follow an individual parcel."

**SHOULD-4 · slider label, `ReturnExperiment.tsx:85`** "Stir → return".
Prose↔figure join, not prose slop: the article never uses "stir" (IV_STORY rejected the stirring frame on purpose) and the current is prescribed shear. Component change: → "Forward → return" (or "Progress"). Same file's phase label "Forward · stroke 3 of 6" is fine but the prose never says *six*; COULD-1 covers that.

**SHOULD-5 · after L164** (practitioner exit) — one sentence, no new figure:
→ append to the paragraph ending "Even the finest offered grid loses detail.": "Interpolating with more than two neighbours, or measuring this very backward error and correcting for it, recovers more; both are refinements of the same update, not escapes from it."
(Keeps the article's claim honest and tells the skeptic the author knows the field. Optional; if declined, add Bridson's chapter on higher-order advection to the Further Reading sentence instead.)

**SHOULD-6 · L312** "At 100%, the measured imbalance falls below one billionth of its starting value."
Join: the meter prints `0.00%` (`view.ts:69`, two decimals below 1 %); no billionth is visible.
→ "At 100%, the meter reads 0.00%: the measured imbalance is below one billionth of its starting value."

**SHOULD-7 · L331** "forty sweeps leave about 4.4% of the original root-mean-square divergence"
Join: value is 4.385 %, meter prints `4%` (whole percent at ≥ 1 %).
→ "about 4%". (160 sweeps → "0.07%" matches the meter.)

**SHOULD-8 · L34–35 and L170–172** "This particular grid update even preserves the total amount of each dye to roundoff." / "Their sum stays constant, so this particular test passes a dye-conservation check."
Join: nothing on the canvas shows the dye total; the reader takes both on trust, and the act-1 waypoint (three checks) rests on it. This is a component fix, not a prose one: add a per-pane "Dye total 100%" readout beside "Overlap with start" in `createReturnExperiment` (the sums are already computed in `overlap`'s loop). If the component is not touched before publish, the prose survives as is — but flag it in the HANDOFF as a promise the figure does not cash.

**SHOULD-9 · L391–392** "The moving colour alone can make that last omission difficult to recognise, which is why the arrows and matched reference matter."
Family 18 — "which is why the … reference matter[s]" explains the figure's design to the reader.
→ "The moving colour alone can hide that last omission; the arrows and the left pane show it."

**SHOULD-10 · L421** "The pressure residual can be tiny while the dye looks increasingly washed out."
Join/terminology: the corner readout (`SolverWorkbench.tsx:112`) is RMS *divergence* after projection, which the article has called "imbalance" everywhere else; "pressure residual" at L336 means the CG stopping test. A practitioner catches the conflation.
→ "The imbalance readout in the corner can be tiny while the dye looks increasingly washed out."

**SHOULD-11 · L424** "Each measures an error the other cannot see."
Tidy rhythmic close (family 12 cadence / family 24's silhouette); test: delete — L423–424 already state both checks concretely.
→ delete.

**SHOULD-12 · ending ring** — covered by MUST-6's replacement (last sentence). Listed here so it is not lost if MUST-6 is declined: at minimum, one sentence after L424 that names the 16 % again.

### COULD

**COULD-1 · L17–19** "which slides neighbouring rows and columns by different amounts, then undoes those motions in reverse order" — the figure prints "stroke 3 of 6"; say "six shears, then the same six undone in reverse order" so the phase label is explained.

**COULD-2 · L34, L135, L171** "This particular grid update", "this particular combination", "this particular test" — a hedging tic three times; "this" alone in each.

**COULD-3 · L101** "The averaging is useful." — flat topic sentence; "The averaging also protects the update:" and run on. Low confidence; the short verdict is legal.

**COULD-4 · L249–250** "Bounded advection does not remove a restriction imposed by a different operation." — paragraph-closing generalisation (2026-09-06 sweep, mold 4). The previous sentence already carries it; delete, or "The backtrace's freedom from a timestep limit does not extend to this step."

**COULD-5 · L279–281** "On a grid, changing its right-face velocity changes the neighbouring cell's balance too." — true and load-bearing, but the cell-flux figure shows one cell; the neighbour's balance is asserted, not seen. Cheapest evidence is a second readout ("Neighbour to the right: net −0.7") in `CellFlux`; otherwise leave.

**COULD-6 · L243** "so the fluid's total momentum need not remain constant" — the figure's readout is *kinetic energy* %, not momentum. "…so the kinetic-energy readout falls as well as the profile" binds the sentence to the pixels.

**COULD-7 · L341–343** "In the code, the stored pressure variable includes the factor Δt/ρ…" — a confession, allowed, but it reads as a code comment. "The colours above show relative pressure, not pascals; the stored pressure already carries Δt/ρ, so its differences are velocity corrections directly."

**COULD-8 · L389** "Without viscosity, sharp velocity differences persist longer." — the visible evidence is the "Energy/mass" readout (arrows are drawn every third cell); point at it: "…persist longer, and the energy readout stays higher."

**COULD-9 · `SolverWorkbench.tsx:132`** — the live viscosity control prints a bare number; L409 gives its unit ("cell widths squared per second"). Add `cells²/s` to the `<output>` as `DiffusionLab` does.

**COULD-10 · L52–55 / `ReturnExperiment.tsx:118`** — the cell figure prints "Centre: dye and pressure" before pressure has been introduced (L283). Either drop "and pressure" from the label until the projection section, or leave; a reader will not stall on it.

**COULD-11 · imperative mood throughout** ("Choose", "Select", "Change", "Scrub", "Increase", "Adjust", "Drag", "Pause") — never "you can". ESSENCE's rule is permissive-never-imperative; NICKS_VOICE's directness tolerates the imperative. Not a slop finding; noted because it is the main source of the lab-manual temperature Nick may feel. If one change is wanted, the hero (L28) is the place: "Choose **Start**…" → "You can step through **Start**, **Stretched** and **Returned**…".

**No findings** for families 5, 10, 16, 17, 19, 20, 21, 22, 23 — IV has no awe adjectives, no metaphors, no "X is just Y", no staged suspects, no canned device, no trailer or greeting-card register, no dash epiphany, no awarded ownership. The prediction prompts (L156–157, L307–308) are one per act and are not quiz-shaped. "…is called…" appears twice (L64, L375) and "This procedure is…" once — under the pastiche threshold.

---

## 4. Prose ↔ figure joins

Every operating instruction and readout claim, checked against the component source.

| Lines | Figure | Claim / instruction | Source | Verdict |
|---|---|---|---|---|
| 26–32 | `ReturnExperiment` | Start / Stretched / Returned buttons; amber and rose recover on the left; 16 % on the right; bars = overlap with start | `ReturnExperiment.tsx:85–86`, `overlap()` | OK. Figure opens at *Returned* (default 72 = max) — the answer is the first frame; not a defect but the editor should know. |
| 30–31 | same | "100% means a complete return" | exact pane at step 288 → `originAt` identity → 100.00 % | OK |
| 34–35 | same | dye total preserved to roundoff | measured 1.000000000000; **not displayed** | SHOULD-8 |
| 38 | same | slider "visits saved moments", second half 3→6 s reverses | `RETURN_DT·4·72 = 6.0 s`; frames precomputed | OK. Label reads "Stir → return" — SHOULD-4 |
| 52–55 | `CellStorage` | "Select a cell to read its amber concentration"; centre dot; blue face dots | slider over columns of row 6; labels at :116–119 | OK ("select" = a column slider; rose is visible in some cells but only amber is read — matches prose) |
| 81–83 | `BacktraceLab` | blue arrow from arrival cell back to departure; change travel distance; contributing values highlighted | `:26–33`, slider 0–4 cells | OK. "selected arrival cell" is fixed at cell 9 — wording tolerable |
| 92–94 | same | integer displacement → direct copy | weight < .001 skips highlight | OK |
| 122–125 | `TransportErrors` | 0.65 cells/update; dashed exact curve as cell averages | `courant = .65`; `interpolate(initial, i − shift)` equals the exact cell average of the translated step | OK |
| 129–132 | same | negatives and > 1 after a few updates; range keeps reporting after clipping | at 8 updates −1.10..2.10; "· curve clipped" suffix | OK |
| 141–142 | same | backtrace stays in range, peak falls | 0.00..0.90 at 80 updates | OK |
| 156–164 | `ReturnExperiment refine` | 24/48/96 buttons; 9 / 16 / 38 % | 8.9 / 16.0 / 38.4 | OK |
| 166–168 | same | overlap definition | `overlap()` — min per cell, both colours, ÷ starting total | OK |
| 170–172 | same | bounded + sum constant | not displayed | SHOULD-8 |
| 191–199 | `ParcelAcceleration` | arrows fixed; probe 2.20 m/s; parcel 1.05 → 3.49 | `u = 1 + x`; probe x = 1.2; `parcelAt(1.2).x = 2.486` | OK |
| 200–201 | same | prescribed incompressible narrowing flow | `physics.ts:7–9`, div u = 0, slip walls | OK |
| 234–243 | `DiffusionLab` | same profile, 2 s, viscosity slider, jet/layers/stripes, gray outline | `:8–14`, buttons :44, ghost curve :30 | OK. Readout is kinetic energy, prose says momentum — COULD-6 |
| 247–249 | same | νΔt/h² ≤ ½; figure inside the limit | α = ν/40 ≤ 0.2 | OK |
| 258–266 | `CellFlux` | adjust right-face outflow; others fixed; 1 m³; top/bottom cancel; right must carry 1 | `:14–22` (IN 1.0, OUT 0.5, IN 0.5) | OK. Unmentioned: "Balance the cell" button and a `p` glyph in the cell (COULD-10 sibling) |
| 304–308 | `ProjectionLab` | violet = imbalance; cyan = low pressure on the right; slider scales the correction; 150 % | right pane `'pressure'` mode, cyan for negative; frames `correct(p, n/100)` | OK. Default slider is 35 %, not 0 |
| 312–313 | same | 100 % → below one billionth; 150 % overcorrects | 5.996e-10; 0.500 | Numbers right; meter prints `0.00%` — SHOULD-6 |
| 313–315 | same | meter = RMS divergence relative to proposal | `metrics().divergence` = √(Σd²/n); `meter()` ratio | OK |
| 317–318 | both | opposite edges join | `LabFluid.index` periodic | OK |
| 322–332 | `ProjectionLab iterations` | Gauss–Seidel sweeps; 0/10/40/160; 4.4 % and 0.07 % | in-place update (GS) `core.ts:158–160`; 4.385 % / 0.072 % | Meter prints `4%` — SHOULD-7 |
| 335–337 | live | CG, relative residual stop, iteration limit | `project()`: 220 iters, rr > 1e-18·initial (≈1e-9 relative) | OK |
| 341–343 | — | stored pressure carries Δt/ρ; colours relative | ρ = 1, h = 1, `correct` subtracts `p` differences directly; colour scale /25 | OK |
| 360–373 | `SolverCycle` | six stages; ×10 magnification is a *difference*; 1/40 s | `STAGES`, `delta = 10·(after − before)`, `LAB_DT = 1/40`; imbalances 0 → .603 → .667 → .552 → 0 → 0 | OK |
| 380–392 | `TermExperiment` | same start and push; omit one; dye transport always on; violet view for pressure | `comparisonFrames`, `tick(8, omit)`, auto view switch | OK. "sharp velocity differences persist longer" is carried by the energy readout — COULD-8 |
| 401–404 | `LiveSolverLab` | drag to push; Push upward; Add dye; pause/resume | `:125–131`, `<Sim>` Play/Pause | OK. "Show cells" checkbox unmentioned (fine) |
| 408–410 | same | viscosity in cell²/s; 48×32 | control has no unit — COULD-9; grid label prints 48 × 32 | Partly |
| 415–419 | same | fixed timestep; carry/diffuse/project/dye; pushes projected immediately, even paused | accumulator loop; `tick`; `push(){…; f.project()}` | OK |
| 421 | same | "pressure residual" tiny | corner readout is RMS divergence | SHOULD-10 |
| 433 | link | history link via `IfLesson` | present | OK |

**Promises the figures cannot cash:** the dye-total conservation (L34–35, L170–172) and the "one billionth" (L312) — both are true, both invisible. Everything else the prose says a figure shows, the figure shows.

---

## 5. Packaging if IV becomes default

Registry entry `src/lessons/registry.ts:236–270` (`id: 'navier-stokes'`).

1. **Title.** Registry `'Building the Navier–Stokes Equations'` vs IV's H1 `# Building a Fluid Simulation`. The registry title is what the index card, the version switch, and the history's back-link context show. Change the registry title to IV's: **`title: 'Building a Fluid Simulation'`**. (I–III keep their own H1s; they are editor-only.) Keep `id: 'navier-stokes'` — the URL and the history's `<Link to="../navier-stokes">` depend on it.

2. **Blurb.** Current: "Meet each piece of fluid motion on its own, see why it alone falls short, then assemble the equation and run it live." — describes I's chain-of-failures and is itself promissory. In the register of the neighbouring blurbs (declarative, two sentences):
   > "Two patches of dye are carried out along prescribed paths and back again. Exact arithmetic returns them; a 48-cell grid returns 16%. How a computer moves numbers between grid points, computes its own velocity, and which of its checks that passes."
   Shorter alternative: "A grid carries two patches of dye out and back along the same paths and returns 16% of them. How a fluid simulation moves numbers between cells, computes its own velocity, and which checks that passes."

3. **Version order and status.** `defaultVersion` is `versions[0]` (`registry.ts:493`), so IV must move to the front of the array and drop its `status: { kind: 'draft' }`; I moves down and gains `status: { kind: 'draft' }` with a note ("Previous default · September 2026 construction revision"). `scripts/check-publication.ts:53–59` hard-codes `['I']` as the reader's versions and `'I'` as the default label — update those assertions (and the `label: 'I', author: 'baseline'` regex at :96 which targets the "at least one published version" check) in the same commit, or `check:publication` fails.

4. **Preview.** The card preview (`registry.ts:238–240`) loads `createHistoryFlow('prandtl')` — the wing, which IV never shows — with poster `assets/lesson-previews/navier-stokes.png`. Swap to the return experiment at *Returned* on the 48² grid: `import('../sims/construction-v4/ReturnExperiment').then(m => m.createReturnExperiment({ current: 72 }, { current: 48 }))` (the factory takes refs; `browserRaster` default needs `OffscreenCanvas`, which the preview path has). Re-shoot the poster. `warmup` can drop to 0 — the stepper is static.

5. **History cross-link, `lesson-03-navier-stokes-history.mdx:737–741`.** "The solvers behind the figures above, built step by step in the previous lesson, use numerical methods developed over the following decades. After adding any outside pushes, a solver has three jobs: carry motion with the flow, exchange momentum between neighboring layers, and find the pressure that keeps volume balanced." The three jobs are IV's act 2 exactly, so the description survives. What does not: "the solvers behind the figures above, built … in the previous lesson" — history's figures run the wing solver (`sims/history/flow`); IV builds a periodic lab and says so. Minimal edit: "The solvers behind the figures above use the numerical steps the <Link>previous lesson</Link> builds on a small periodic grid, methods developed over the following decades." Also harmonise the Stam link (history uses `dgp.toronto.edu`, IV uses the Stanford mirror) — one URL.

6. **IV → history link (L433)** already goes through `<IfLesson>` and describes the history correctly. No change.

7. **Docs after the flip:** `articles/01-navier-stokes/HANDOFF.md` header ("Lesson 01: Building the Navier–Stokes Equations") and AGENTS.md's one-line status. Not reader-facing; do in the same commit.

No other lesson references the construction lesson by content (`rg` over `src/lessons`: only history:739 and the registry).

---

## Summary

**Counts:** MUST 7 · SHOULD 12 · COULD 11. All prose fixes are sentence-local; two SHOULDs and four COULDs are component tweaks (slider label, dye-total readout, meter wording, units).

**Top MUSTs:** (1) L40–42 scheduling after the hero; (2) L66–67 rhetorical question at the section hinge; (3) L380 "We can inspect the consequences…"; (4) L422 "Those observations are compatible."; (5) the opening's imperative-as-imagination first sentence (L12–15) — plus the moral ending (L426–431) and the referee paragraph (L394–397).

**Spine verdict:** Act 1 answers the Sept-16 complaint — a real spine, a real cast, a controlled question with an answer key, and the hero returns mid-article with a new knob. Act 2 is honestly motivated and every figure has a claim and a meter, but it drops the cast (discs and the exact twin) and runs five violet-grid figures in a row; that is the array middle at lower temperature, and prose cannot warm it. The change of question lands as a stated turn, not a second article. The ending pays the opening in words but not on screen; one sentence closes the ring.

**Recommendation:** IV is fit to become the default after the surgical fixes above. It is a clear improvement on I (no coffee opening, no wing tour, a hero with an answer key, no claim the figures cannot back), and its prose has no families 5/10/16/17/20–24 slop at all — its faults are cool register at hinges and closers, which the MUST list removes. What surgery cannot do is give act 2 the cast act 1 had; the cheapest non-surgical follow-up worth queuing (not a publish blocker) is to seed `LabFluid` with the same two discs so the cycle, omissions and live lab carry the hero's dye, and to let the live lab's ending sentence point at them.

---

## Disposition (applied 2026-09-23)

Each item: applied / skipped, one line. Line numbers now refer to the edited file.

### MUST

- **MUST-1** (L40–42 scheduling after the hero) — **applied.** → "Neither pane calculates what forces produce the current. The velocity is given in both; only the dye is computed."
- **MUST-2** (L66–67 rhetorical question) — **applied,** as one sentence rather than the ledger's "The one job left…": "…take the velocity as given, as it was in the return experiment, and find the concentration that arrives at a grid point during one timestep."
- **MUST-3** (L380 "We can inspect…") — **applied** as proposed: "Now leave one operation out."
- **MUST-4** (L422 "Those observations are compatible.") — **applied,** deleted.
- **MUST-5** (opening L12–15) — **applied** with one change to the proposal: "a current" not "a prescribed current" in the first sentence, since the next paragraph says "the same prescribed current" and the word would land twice in four lines.
- **MUST-6** (moral ending) — **applied.** Indicative mood, and the ring closes on the two patches: "Here that quantity was two patches of dye. The averaging that washes out the dye in this grid is the averaging that returned 16% of them at the top of the page." Split into two sentences instead of the proposal's one; "the same averaging" kept as "the averaging… is the averaging" (live lab is 48×32 bilinear, hero is 48² linear along rows/columns — same operation, not the same grid).
- **MUST-7** (referee paragraph) — **applied** as proposed; "diagnostic experiments… interchangeable physical fluids" cut, the equation-of-state point kept.

### SHOULD

- **SHOULD-1** (staggered-grid IOU) — **applied,** deleted; the debt is paid at "This is why storing normal velocities on faces is useful" regardless.
- **SHOULD-2** (hedge sentence in the opening) — **applied** inside MUST-5.
- **SHOULD-3** ("maintaining an identity") — **applied:** "We store values at fixed places and never follow an individual parcel."
- **SHOULD-4** (slider label "Stir → return") — **applied,** component: "Forward → return"; aria-labels "Return progress" / "Refined return progress". `ReturnExperiment.tsx` is IV-owned.
- **SHOULD-5** (practitioner exit, higher-order/error-compensating advection) — **applied,** plainer than proposed: "Interpolating from more than two neighbours, or measuring this backward error and correcting for it, recovers more of the pattern; both refine the same update." Dropped "not escapes from it" (a tidy close).
- **SHOULD-6** ("below one billionth" vs meter 0.00%) — **applied** in prose: "the meter reads 0.00%: the measured imbalance is below one billionth…". `view.ts` `meter()` is shared with I/II, so its format was left alone.
- **SHOULD-7** (4.4% vs meter 4%) — **applied:** "about 4%".
- **SHOULD-8** (dye total shown nowhere) — **applied,** component: a "Dye total" line under each overlap bar in `createReturnExperiment`, `toFixed(1)`. Measured: grid pane 1.000000000000 at every state; exact pane (512² sampling of the analytic paths) dips to 0.999784 at maximum stretch, so it prints 100.0% throughout. Prose now points at it in both places (L34–35, L169–170). The dye square shrank 20 px to make room (`dyeSquare()` exported; the check script samples the same region). `check:construction-v4` gained one tripwire: both panes print 100.0% at maximum stretch.
- **SHOULD-9** ("which is why the arrows… matter") — **applied:** "…can hide that last omission; the arrows and the left pane show it."
- **SHOULD-10** ("pressure residual" for the divergence readout) — **applied:** "The imbalance readout in the corner…"; and the next sentence's subject changed from "Pressure checks" to "That readout checks" so the pair reads as two readouts, two checks.
- **SHOULD-11** ("Each measures an error the other cannot see.") — **applied,** deleted.
- **SHOULD-12** (ring back to 16%) — **applied** inside MUST-6.

### COULD

- **COULD-1** (six strokes) — **applied,** since the figure prints "stroke 3 of 6": "six shears that slide neighbouring rows and columns by different amounts, then the same six undone in reverse order."
- **COULD-2** ("this particular" ×3) — **applied** at all three (one was absorbed into SHOULD-8's rewrite).
- **COULD-3** ("The averaging is useful.") — **skipped;** the short verdict is legal and the ledger itself was low-confidence.
- **COULD-4** ("Bounded advection does not remove a restriction…") — **skipped;** it carries content the previous sentence does not (the backtrace's freedom from a timestep limit does not transfer to viscosity), so it is not a trivial cut.
- **COULD-5** (neighbour readout in `CellFlux`) — **skipped;** shared component, not a cut.
- **COULD-6** (momentum vs kinetic-energy readout) — **skipped;** the prose does not claim a readout, and the rewording is not a cut.
- **COULD-7** (Δt/ρ code comment) — **skipped;** rewording.
- **COULD-8** (energy readout pointer) — **skipped;** rewording.
- **COULD-9** (units on live viscosity `<output>`) — **skipped;** shared component (`SolverWorkbench.tsx`, mounted by I and II); additive but not a cut. Listed as queued in the promotion doc.
- **COULD-10** ("Centre: dye and pressure" before pressure exists) — **applied,** component: "Centre: dye concentration" (a cut of "and pressure").
- **COULD-11** (imperative mood throughout) — **skipped;** a register decision for Nick, not a slop finding.

### Not done, queued

- Seed `LabFluid` with the two discs (act-2 cast). Recorded in `building-iv-promotion.md`.

### Checks after the edits

`bun run typecheck` clean; `check:construction-v4` 1490 passed (was 1488 + the new tripwire, ×2 widths); `check:construction` 142 passed; `check:publication` passed (12 lessons, 2 reader-visible). A separate fresh read of every touched paragraph against SLOP's four tests found one further fix (the "Pressure checks" subject, folded into SHOULD-10 above).
