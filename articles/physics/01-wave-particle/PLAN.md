# Plan — Is Light a Wave or a Particle?

First article of the **broad physics** field. Standalone: it assumes no other
lesson and is assumed by none.

Read `DENSE_CORE.md` first — it wins conflicts with this document.

## The bench

Every figure in the article quotes one apparatus, so numbers recur and can be
checked against each other. It lives in `src/sims/physics/optics.ts` as `BENCH`:

| | |
|---|---|
| wavelength λ | 633 nm (helium–neon) |
| slit separation d | 0.20 mm |
| slit width a | 0.04 mm |
| mask → screen L | 2.0 m |
| screen | ±30 mm |
| fringe spacing λL/d | **6.33 mm** |
| envelope first zero λL/a | 31.7 mm (just past the screen edge) |
| Fraunhofer number a²/λL | 1.3 × 10⁻³ ≪ 1 |
| max angle x/L | 0.015 rad (sinθ ≈ θ to 1 part in 10⁴) |

Change any constant and the last two rows have to be re-checked: they are what
make a single sinc²·cos² expression the truth rather than a cartoon.

## Palette

Same role-rhyme as lessons 01–03 and maths 01 — amber is the thing we watch, blue
the thing that acts, violet the derived meter. Registered in `sims/lib/palette.ts`.

| key | role |
|---|---|
| `hit` | one photon's arrival; the marker on a dial |
| `amp` | the amplitude ψ — the phasor, the intensity curve |
| `pdf` | the derived meter: measured tallies, closing arrow, contrast |
| `slitA` / `slitB` | the left and right slits' contributions |
| `ejecta` | ejected-electron energy |
| `cutoff` | threshold frequency; path knowledge D |

## Figures

Each is `src/sims/physics/<Name>.tsx`, stepper factory exported so
`scripts/check-physics-figures.ts` can render and measure it headlessly.

| # | Figure | Must show, in one frame |
|---|---|---|
| 0 | `BenchSetup` | The hardware, once: lamp, mask, screen, drawn agnostic — no rays, no wavefronts, because either would take a side. A loupe resolves the slit pair at one true scale (so the drawn a : d is the real 1 : 5), and the screen carries the fringed pattern, λL/d apart. |
| 1 | `PhotonRain` (hero) | Discrete arrivals **and** fringes **and** the counterfactual: one marked column that is starved with two slits and flooded with one. Both screens on one vertical scale, both tallies counted from the dots. |
| 2 | `SlitSpread` | The ray prediction and the truth on the same axes, and a knob that *reverses* — past the crossover, narrower means wider. Exact Fresnel across the whole slider. |
| 3 | `PhasorSum` | Two contributions laid tip to tail, and the closing arrow going to zero while both contributions stay full length. Paired with the full screen profile and the no-interference ghost. |
| 4 | `Photoelectric` | Brightness moving one bar and not the other, with the classical prediction drawn as a ghost over the bar it contradicts. Below threshold, both bars gone at full brightness. |
| 5 | `WhichPath` | Continuous drain of contrast, a measured contrast meter, and a marker locked to a quarter circle. |
| 6 | `DeBroglieRuler` | 29 decades, every specimen at its own computed λ, and the fringe spacing each would give **on this same bench**. |

## Standing decisions

- **Figure 2's vertical scale is the pattern's own peak, not the unobstructed
  level.** A 0.05 mm slit passes 0.2% of the light; on an absolute scale its
  pattern is a flat line on the floor and the figure teaches nothing. The
  normalisation is confessed in prose and the discarded light is a printed meter.
- **Figure 3 splits the phase difference evenly between the two arrows.** Only
  the difference is observable. Loading all of δ onto the second arrow is equally
  correct and puts the two arrows exactly on top of each other at δ = π — the
  figure would show one line at the precise moment it must show a collapse.
- **Figure 5 measures contrast over ±0.55 of a fringe.** Wider, and the
  diffraction envelope's own droop is reported as fringe contrast (0.78 where the
  relation says 0.71), putting the figure's two witnesses at odds.
- **Canvas text stays inside Latin-1 plus `×` and `µ`.** Superscript digits above
  ³ and U+2212 minus are not in every system font.

## Verification

`bun run check:figures` renders all seven headlessly and asserts the specific thing
each must teach — 27 checks. It exists because pixel-coverage checks are
worthless here: every one of these figures paints a background wash, and three of
the first-draft measurements were reading a reference line, a ghost outline, or a
guide circle rather than the quantity. Two genuine figure bugs (arrows leaving
their pane; a narrow-slit pattern flat on the floor) were found by it.
