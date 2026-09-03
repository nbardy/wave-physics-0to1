# Index — the 2026-09-02 reimagine pass

What is here, what state it is in, and the main loop's own verdict on each new
intro. Read this first; the per-article files are long.

## State

- `00_VOICE_DOCS_CRITIQUE.md` — the voice-doc critique and the brief the agents
  worked from. Complete.
- `<lesson>/REIMAGINE.md` × 11 — Part 1 felt-reader read of the current article,
  Part 2 new outline, Part 3 new intro with a sentence audit. **All eleven are
  first drafts.** The session limit killed the fleet after the drafts landed:
  no revise pass ran, no sibling audit ran, judges completed for four articles
  only (every judge failed its draft, by design; their must-fix lists are the
  useful part).
- `01_JUDGE_NOTES.md` — the six judge verdicts and the eight structured returns,
  recovered from the workflow journal so they are not lost with the session.
- No lesson MDX, doc, or sim was touched.

Cost of the run: 44 agents launched, 14 completed, ~3.5M subagent tokens. That
was three times the fleet the request named (one agent per article); the judge,
revise, and sibling stages were the overspend.

## Verdicts on the new intros (main loop, by eye)

| lesson | new hero | keeps or swaps spine | intro | flag |
|---|---|---|---|---|
| wave-particle-duality | heralded single-photon Mach–Zehnder with a polarization tag in one arm | swaps (double slit → interferometer + eraser) | facts throughout; strong | half-wave-plate angle vs polarization angle is conflated (90° plate ≠ 90° rotation); "stays at zero" is a false universal (Thorn g²(0)=0.018); "the twin … splits" says the photon splits in the one article where that is the question |
| pbits | one frustrated 4×4 glass, two schedules, one number under each | swaps (wall of dreams → sampler vs optimizer) | good; thesis is the article's real content | the two numbers under the panes are reversed against the outline (judge caught it); first sentence over-counts wires |
| z1-compiler | the five-node walk, watched at depth thirty | keeps, re-centers on depth | good; the strongest of the thermo three | "one to ten million times a second" needs a RESEARCH.md check |
| ebm-diffusion | the Billed Wall with a schedule knob that changes the bill and not one pixel | keeps | good; the inversion is a measurement | none |
| navier-stokes | dye blob in a channel run forward then backward, honey → water | swaps (wing + million-dollar prize → reversibility) | best story swap of the set | build risk: semi-Lagrangian advection has numerical diffusion, so the blob may fail to return even at low Re; the figure must be shown honest before the spine is adopted |
| fiber-bundles | two rows of clocks over the connection curve; a tap travels as a change in the rule | swaps hero, keeps thesis | good; trim the last three sentences, which fall into fragment cadence ("What travels is the rule, changing.") | none on physics |
| navier-stokes-history | the disc with friction on a knob and a meter splitting drag into rubbing and pressure | swaps (timeline → d'Alembert's paradox as the spine, history as the ladder) | good; ends on an aphorism-weight thesis, the p-bits shape | this is no longer a history article; spine swap needs Nick's checkpoint |
| learned-solver | WarmStartRace kept | keeps | the most Nick-proof intro here: three measurements that cannot all be true | judge failed a number ("scores above 2"); check against the shipped manifests |
| jacobian-hessian | "Unstir": Newton's method finding a target's preimage under a stirring map, hops on a meter | swaps to the agreed "Newton's One Idea" direction | good; ~170 words, a little long | NEW figure; per the July postmortem, a hero swap here needs an explicit checkpoint before any build |
| cad-primitives | the pierced plate, thirty-two points and a rule | keeps hero, replaces the five-thing tour with a rule-fails chain | good; thesis as a full sentence | none |
| photonics (P1) | a 4×4 MZI block: six crossings, four drains, six crossings | new (no article existed) | reads as facts | "sixteen dials" is correct for a REAL matrix (6 Givens rotations + 4 attenuators + 6 rotations = 16 = N²); the prose must say the block does real matrices, since a complex mesh needs two phases per crossing. Earlier draft of this index flagged it as wrong; that flag was mine and mistaken |

## Sibling audit, by eye (the agent never ran)

- No intro ends on a fragment. Four of eleven end on a quotable thesis line
  (pbits, fiber-bundles, navier-stokes-history, cad); seven end on a fact or a
  planted debt. Acceptable variety, but the four are the INTROS §3.4 risk.
- Five of eleven open or pivot on "the X below / on the right is…" (cad,
  jacobian, navier-stokes, z1, photonics). Legal camera move; still a shared
  skeleton if all five ship.
- No coined device appears in any intro. The "below this paragraph" and
  "crime" repeats in the current lessons 01/04 are gone.

## What would close it out, cheapest first

1. Nick reads the eleven Part 3 intros (this index has the verdicts) and the
   five-sentence stories in `01_JUDGE_NOTES.md`, and picks which spines to
   accept. Three are spine swaps that need his explicit yes: navier-stokes,
   navier-stokes-history, jacobian-hessian.
2. The main loop fixes the flagged physics lines by hand (wave-particle plate
   angle, pbits number order, photonics "real matrix" qualifier). No agents.
3. Only for accepted spines: one revise agent per article with its judge notes
   where they exist. Eleven agents at most, and only on request.
