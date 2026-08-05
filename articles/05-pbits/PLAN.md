# PLAN — A Computer Made of Noise (rev. 2)

Stage-2/3 master for the synthesized article (DENSE_CORE.md wins conflicts).
Revision 2 (2026-08-05) integrates two feedback rounds on the built Acts I–II:

**Nick's read:** more equations, cashed out harder; the p-bit named and used
as the working word (not "coin" forever); Torx/Thermalizers/THRML present in
THIS article; and the wire explained *physically and mathematically* — what a
p-bit is in silicon, what a coupling physically is, how the two tie together.

**Technical review (accepted):** (1) rail becomes the transformation pipeline
TARGET → ENERGY → SAMPLER → SUBSTRATE (already in `lib.ts`); (2) the claim
"chromatic makes only single-flip state-graph moves" is FALSE — a chromatic
half-sweep flips many spins at once; the honest discriminator is *write
conflicts* (edges between simultaneously-written spins), not move arity;
(3) β is inverse temperature and must be labeled so; (4) the √2 claim is an
expected sampling-noise scaling, shown as a band, not promised per-run;
(5) ESS cannot rescue a biased sampler — correctness gates throughput, three
orthogonal columns; (6) J = (1/2β)·log 9 — lock β = 1 visibly wherever the
shorthand is used; (7) the old finale trained an *unconditional* Boltzmann
machine while narrating diffusion — the finale becomes true conditional
reverse kernels (clamp x_t always; y clamped in positive phase only; hidden
units); (8) the forward corruption is NOT "the machine's native act" — the
native act is block-Gibbs on a programmed energy model; (9) hero rescale: a
mosaic of many independent 4×4 chains, not one 64×64 lattice wearing 4×4
weights; (10) ending softened to a hierarchy of witnesses.

Target ~9,000–11,000 words, 30 primary figures F1–F30 (single reconciled
count; diagnostic, not quota). Acts ship in order behind `status: draft`.

## Persistent chrome

- **Transformation rail** (built): TARGET · ENERGY · SAMPLER · SUBSTRATE,
  active slot lit, on every figure. The Boltzmann law lives under TARGET;
  (h, J, E) under ENERGY; schedules under SAMPLER; WebGPU/JAX/Z1 under
  SUBSTRATE. Thermalizers is *the arrow* TARGET → ENERGY, and §8 says so
  on the stack figure.
- **The meter** (built): exact ghost + live bars + TV number; persistent
  overlay wherever a distributional claim is made; degrades honestly to
  weaker witnesses when enumeration dies.

## Palette contract — as built in `sims/lib/palette.ts` (sUp, sDn, ferro,
anti, ghost, held, meter), plus §9's data-phase/dream-phase background
tints (first appearance §9, nowhere earlier).

## Hardware dictionary (Nick's demand — the physical↔mathematical binding)

Taught twice, briefly in §2 and fully in §7 (F17):

| on screen | in the math | in silicon |
|---|---|---|
| flickering cell | s_i ∈ {−1,+1} | a bistable circuit read by a comparator |
| bias knob | h_i | a programmable current/voltage offset (DAC) |
| wire, warm/cool | J_ij | a programmable conductance — neighbor's state feeds a weighted current in |
| the arc gauge | σ(2β(h_i+ΣJ_ij s_j)) | the comparator's transfer curve, thermal noise supplying the dice |
| held halo | clamp | input register overriding the noise source |
| red/black clock | chromatic sweep | the chip's two-phase update clock |

The local field is literally an analog current sum; the sigmoid is what a
noisy threshold *is*. §2 gets two sentences of this; F17 draws the circuit.

## Predicts (one per act) and Waypoints (act boundaries)

P1 (§3, built) bars under a disagree-wire · P2 (§6, built) where does the
meter land · P3 (§8) "add one hidden p-bit — can the two-wire XOR now reach
the target?" · P4 (§10) trained on six glyphs — one of the six, or something
between? Waypoints after §4, §6, §8, §10 (the last is the ending's job).

---

## ACT I — The distribution (§1–§4) — BUILT, revise per this rev

**§1 The coin with a knob** (F2 flicker+histogram, F3 sweep trace — built).
Revisions: name the p-bit in the first breath after the reveal and USE the
term thereafter (coin remains the metaphor, p-bit the noun); one whispered
hardware sentence ("in silicon this is a noisy comparator — the full circuit
waits in the machine act"); math moment 1 (σ(2h)) stays, plus boundary check.
F1 HERO placeholder stays deferred (see Act IV; hero is a mosaic of 4×4
dream-chains, pretrained, confessed).

**§2 Reading the display** (F4 — built). Revisions: the two hardware-
dictionary sentences (wire = programmable conductance; gauge = transfer
curve); name the rail once, now with the new slot names.

**§3 Two p-bits that gossip** (F5/F6 — built with the two-part target).
Revisions: after the update-rule equation, add the connected-correlation
line Cov(s₁,s₂) = ⟨s₁s₂⟩ − ⟨s₁⟩⟨s₂⟩ = 0 under independence — the cheat
quantified; state β=1 here and that β arrives in §4.

**§4 The State Atlas and the witness** (expand built F7/F9/F10; F8 state
graph moves to Act II). The mountain range grows into a **State Atlas** —
one figure family, synchronized panes over the frustrated four-loop:
- F7a energy ladder: every state's E(s), the wires' satisfaction totaled.
- F7b raw weight e^{−βE} with β knob **labeled inverse temperature /
  "coldness"** (boundary checks: β→0 fair coins; β→∞ minimizer).
- F7c the partition function Z = Σ e^{−βE} as the visible stacked total the
  weights divide by → p(s) = e^{−βE(s)}/Z; the token hops columns live.
- F7d an observable pane: ⟨s₁s₂⟩ or ⟨E⟩ as bar-weighted average, live.
- F7e a conditional slice: pin one spin (halo) and the atlas re-normalizes
  over the remaining columns — *this is the object Gibbs updates draw from*,
  and the two-line derivation lands here: from p(s) ∝ e^{−βE}, the
  conditional of one spin is σ(2β(h_i + Σ J_ij s_j)) — the §3 rule and the
  law are one fact, now proven, not asserted.
- F9 the meter, forged (built) + F10 target-moved (built), with the √2 line
  reframed: an expected ±1/√N band drawn behind the live bars; the predict
  asks where the *typical* floor moves when evidence doubles.
Math budget for the act: σ(2h); E(s); e^{−βE}; Z; p = e^{−βE}/Z; ⟨A⟩;
the conditional derivation; Cov. **Waypoint 1** (rule ⇄ law, plus witness).

## ACT II — The sampler (§5–§6) — BUILT, fix per this rev

**§5 Everyone talks at once** (F11 grid+fenced patch — built; keep, with the
conditional-independence honesty already in prose). Changes:
- F12 REPLACED. The state-graph teleport stays only as a sequential-vs-
  synchronous *illustration* and must not be framed as what validates
  chromatic. The new F12 is the **write-conflict panel**: same grid, one
  dispatch frozen mid-air; every spin being written this instant is ringed;
  edges joining two ringed spins glow red and a counter totals them —
  sequential: 1 writer, 0 conflicts; chromatic: 128 writers, 0 conflicts;
  synchronous: 256 writers, ~480 conflicts. The factorization equation
  p(s_R | s_B) = Π_{i∈R} p(s_i | s_B) prints beside the zero.
- F13 the race (new, C's marquee): two panes, same frustrated problem;
  synchronous *wins* the energy race while its meter pins; flat verdict.

**§6 The two-coloring rescue** (F14 — built; P2 built). Changes:
- F15 dashboard (new): three orthogonal columns per schedule — updates/sec
  (throughput), autocorrelation/ESS (dependence), TV (bias) — with the
  stated gate: the first two columns are meaningless until the third
  passes; a wrong sampler can have splendid ESS for the wrong law.
- F16 chip reveal (built §6 prose; add the fabric render): the same
  red/black half-sweep on a degree-16 bipartite patch; Z1's numbers as
  dessert; SUBSTRATE slot lit. **Waypoint 2.**

## ACT III — The machine and its compiler (§7–§8) — NEW

**§7 What the chip is and is not.**
- F17 **the p-bit under the microscope** (Nick's figure): one cell drawn as
  its circuit — thermal noise source, bias DAC, neighbor currents summing
  through programmable conductances, comparator; sweep the summed current
  and the flip-rate traces the same S-curve as F3, measured from the
  circuit. The hardware dictionary table lands in prose here.
- F18 the pokeable manual (four affordances — bias, couple to a *wired*
  neighbor, clamp, sweep; everything else visibly absent).
- F19 the triangle, shortened: try to two-color it, fail, one auxiliary
  chain spin embeds it; physical-per-logical counter. One knob.
- F20 one nonideality, priced (gain jitter; meter cost; confess-and-retire).

**§8 Compile an instruction — Torx, Thermalizers, THRML, named plainly.**
- F21 a stochastic kernel as a table: K(y|x) heatmap for noisy-copy; edit
  the entries; this is what a Torx program *is* — a wired composition of
  such kernels (say so, one sentence, with the PSC gate vocabulary).
- F22 hand-compile it (the built plan's F20): clamp x, drag J until the
  flip-rate meter reads 10%; reveal J = (1/2β)·log 9 with **β locked at 1
  on-screen**; target heatmap and compiled heatmap side by side, error
  heatmap between; K̃(y|x) = Σ_w e^{−E(x,w,y)} / Σ_{y′,w} e^{−E(x,w,y′)}
  printed and connected to F7e's conditional (marginalizing hidden spins =
  summing atlas columns — reuse the atlas vocabulary).
- F23 a kernel that CANNOT compile without help: noisy-XOR of two inputs.
  P3 here. Visible-only attempt: the error floor refuses. Add one hidden
  p-bit (w): the floor collapses. Target/compiled/error heatmaps + a live
  loss curve; this trained object is a thermodynamic kernel — the thing
  **Thermalizers** fits.
- F24 the stack, as one figure: Torx (kernels & circuits) → Thermalizers
  (fits E(x,w,y)) → THRML (biases, couplings, blocks, clamps) → substrate
  (JAX sim · this page's sampler · Z1). Each layer lit on the rail as the
  reader hovers/taps it. Sequel pointer, one flat sentence (composition,
  context matching, place-and-route). **Waypoint 3.**

## ACT IV — The learner (§9–§10) — NEW (replaces the old §8)

**§9 One conditional denoiser.** Forward corruption honestly framed: bit-
flip noise is a *simple stochastic program*, not the machine's native act;
the native act (Gibbs on a programmed landscape) is exactly what learns to
undo it. Energy per timestep t:
E_θ(x_t, w, y) = −b·y − c·w − x_tᵀU y − wᵀW y, with x_t always clamped.
- F25 corruption filmstrip over a 4×4 glyph, t = 0…T (β_t schedule knob).
- F26 the two phases, one figure: positive phase (x_t AND y clamped, w
  sampled) vs negative phase (only x_t clamped; w, y sampled by block
  Gibbs); correlation strips accumulate per phase; ΔU ∝ ⟨x y⟩⁺ − ⟨x y⟩⁻
  earned as "nudge by the disagreement you see." Single-step audit: the
  16-bit enumerator checks the learned K̃_t against held-out corruption
  statistics (the oracle's last stand, confessed).
**§10 Tiny browser diffusion.**
- F27 generation chain: x_T random → for t = T…1 clamp x_t, sample y,
  step down; the chain runs live per noise level (3–4 levels, one small
  conditional model each).
- F28 factorized-vs-coupled dreams: the no-hidden, no-coupling reverse
  model trains in seconds and tears glyphs (per-pixel right, jointly
  wrong — §3's lesson at scale, name the rhyme); hidden units restore
  coherence. Side-by-side dream strips.
- F29 the mislearning beat: train the same conditional model with the
  synchronous schedule as the negative-phase sampler; the learned kernels
  are biased and the dream strips visibly diverge — the §5 crime resurfaces
  *inside learning*.
- F30 HERO returns = F1: a mosaic of dozens of independent 4×4 dream
  chains (the browser runs many chains in parallel), first seen pretrained
  in §1, now running the reader's freshly trained weights; their painted
  glyph appears across the population. P4 above the first sample.

**Ending (three jobs, rev.):** land — noise plus neighbors is a
programmable distribution, and learning is two measurements and a
subtraction. Re-enchant, honest version: for tiny systems every state can
be checked; as systems grow the complete oracle disappears and what remains
is a *hierarchy of witnesses* — exact local conditionals, known moments,
autocorrelation, ESS, small embedded problems that stay computable — and a
stochastic computer is trusted not because its output looks random but
because every scale at which truth remains available agrees. Send back:
the thermal flicker in every resistor in the room.

## Ledger (rev.)

- Hero weights confessed §1 → retrained by reader §10 (F30).
- Hardware whisper §1–§2 → paid in full at F17.
- Atlas conditional slice F7e → reused for hidden-spin marginalization F22.
- Two-coins independence failure §3 → factorized-dreams failure F28 (named).
- §5 synchronous crime → resurfaces inside learning F29.
- Fenced-patch oracle §5 → carries §9's single-step audits.
- Sequel debt (composition/context/place-and-route) planted F24, one flat
  sentence; OUTLINES variant B is the sequel.

## Build & verification rules (unchanged, binding)

Honesty rules per AGENTS.md (fixed timestep, counter RNG, contrast shown
in-frame, knobs change what claims depend on, one quantity's own ink).
`lib.ts` is FROZEN for parallel work — per-act helpers live in the act's
own files. Every act ships a self-contained check script
`scripts/check-pbit-act{N}.ts` (import from lib; oracle tier + figure
tier) and leaves `bun run typecheck` green. The assembled lesson MDX is
integrated by the main thread only — acts deliver fragments to
`articles/05-pbits/drafts/act{N}.mdx`.

## Risk ranking (rev.)

(1) §9/§10 conditional trainer convergence + pacing (mitigate: 4×4, 3
levels, pretrained fallback shipped and confessed); (2) F17 circuit figure
legibility — it must read as a circuit, not a diagram of boxes (prototype
first); (3) F23 XOR floor-collapse timing (train live but small — visible
in seconds); (4) mosaic hero glyph legibility at cell size (prototype);
(5) F12 conflict-counter clarity at 16×16 (freeze-frame, don't animate the
count). Build order within the remaining work: F12/F13/F15 (Act II fixes)
→ Act III → Act IV → hero → assembly → voice pass.
