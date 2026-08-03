# Handoff — Is Light a Wave or a Particle? (physics P1)

Canonical state for this article. AGENTS.md carries one line pointing here.

## Status

**BUILT end-to-end 2026-07-31 · `draft` · awaits Nick's read.**

~3,100 words, 6 figures, all six new, all closed-form or Monte-Carlo — nothing is
integrated and nothing is pre-rendered. `bun run typecheck`, `bun run build` and
`bun run check:figures` (20 checks) all clean.

## What is verified, and how

- **The optics kit** (`src/sims/physics/optics.ts`). Fresnel integrals C and S
  check against Abramowitz & Stegun to 1e-5 at v = 0.5, 1, 2 and are odd in v.
  `fresnelSlitIntensity` reproduces the Fraunhofer sinc² envelope to 1.1e-4 at the
  bench's Fresnel number, and produces the 1.12 ray-limit edge overshoot at a
  6 mm slit.
- **The hero's claims**, from a 120-second Monte-Carlo run at 2512 photons/s
  (300k arrivals): total two-slit / one-slit = **1.989** (want 2); centre peak
  ratio = **4.020** (want 4); at the marked column two slits deliver **0.020×**
  what one slit does; measured peak spacing 6.0–6.4 mm against λL/d = 6.330 mm
  (bin width 0.43 mm accounts for the alternation).
- **The sampler** is unbiased: 2M draws against the analytic intensity, worst bin
  2.75σ over 140 bins.
- **Every figure**, by `scripts/check-physics-figures.ts` — see PLAN §Verification.

## Bugs the harness caught (do not reintroduce)

1. `PhasorSum` sized its amplitude unit at 0.4 of the pane, so the closing arrow
   ran off the left pane at the centre of the screen — the one place the figure
   must be readable.
2. `SlitSpread` plotted against the unobstructed level, so at the narrow end (the
   whole point of the figure) the curve was a flat line on the floor.
3. `Photoelectric` drew the classical-prediction ghost *before* the bar, so the
   bar's own 22% track washed the ghost out.
4. `WhichPath` drew its marker leaders in the marker's own amber, and measured
   contrast over a window wide enough that the envelope's droop was reported as
   fringe contrast.
5. `DeBroglieRuler` carried a room-temperature helium atom four pixels from the
   electron on a 29-decade axis; its only effect was a label collision.

## Slop pass, 2026-07-31 (self-audit, post-draft)

Ten sentences cut or rewritten. All but one were the same failure — **family 18,
the article talking about the article** — which is the family SLOP predicts will
survive the others because the sentences are well-made. The pattern was section
openers that announced their own purpose: *"Before repairing the particle
picture, the wave picture deserves its strongest statement"*, *"The mechanism is
worth having precisely, because everything after this is bookkeeping on it"*,
*"This is the answer to the question in the epigraph"*, *"So the ledger closes
uneven, and it should be left uneven rather than tidied"*. Each was replaced with
the physics it was introducing, or deleted outright.

Also fixed:
- **A borrowed conceit.** "the constructive half of the same crime" imported
  lesson 01's crime device on day one — family 11, and SLOP already flags that
  device as having run seven times there.
- **An overclaim that contradicted its own hedge.** The QED paragraph correctly
  said the digits agree "as far as the independently measured constants let
  anyone check", and then the final line called it "the most precisely confirmed
  thing anyone has ever written down". The superlative is not defensible — the
  a_e comparison is limited to ~1 part in 10¹⁰ by α, not by the theory. Both the
  paragraph and the ending now quote that number and name α as the limit.
- **A cadence tic.** The "not X, not Y: Z" triple ran four times. One instance
  survives, at the article's central claim, where it forestalls a real
  misreading ("dimmer as a share of a larger total").

What was *not* cut: the two figure confessions (splitting the phase evenly in
figure 3, normalising figure 2 to its own peak). SLOP's boundary is explicit —
confessing a lie in the figure is house honesty; narrating the design is family
18. Those two are lies in the figures.

## Open

- **Nick's read.** Nothing has been voice-swept against his markup; the print
  register is still ratified from one lesson-01 sample (AGENTS "open voice items").
- **Mobile.** No narrow-viewport pass. Figures 3, 4 and 5 are two-pane and will
  want checking below ~500 px.
- **Live browser QA.** The figures were verified headlessly because the preview
  pane in the authoring session had `document.visibilityState === 'hidden'`, which
  suspends rAF and freezes every `<Sim>`. The hero was confirmed live before that
  (225k arrivals, correct fringes); figures 2–6 have not been watched animating in
  a real browser, only rendered and measured.
- **The `<Predict>` around figure 4** is the article's only one. If a second is
  ever wanted, the natural host is figure 2's crossover, not the hero.
