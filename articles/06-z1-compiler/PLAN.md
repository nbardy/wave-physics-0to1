# PLAN — Compiling Into Heat (Part 2, Extropic-specific)

Stage-2 skeleton. DENSE_CORE.md wins conflicts; RESEARCH.md gates every
hardware number (VERIFY-BEFORE-PROSE: topology rules, iteration rates,
energy/iteration, readout & reflash costs — all currently second-hand).
Prereq: Part 1 published or at least stable — this article opens from
Part 1's stack figure and reuses its vocabulary, palette, rail, and meter
without re-teaching. Target ~7,000–9,000 words, ~24 primary figures.

## Persistent chrome

Part 1's rail and meter, plus the **split-meter**: per-step KL beside
trajectory-occupancy TV on every compiled figure. The article's one new
color: visitation glow (q(x)) — a warm background wash keyed to how often
the upstream program shows an input (first appearance §3; add to
palette.ts as `visit` when built).

## Acts

**Act I — The fabric (§1–§2).** What Z1 actually is.
- §1 Hero: the walk, twice (as-written vs compiled-on-fabric); one-step
  histograms match; the IOU names the trajectory lie. F1 hero (built last).
- §2 The four moves: generate the fabric from
  $(a,b)\in\{(1,0),(2,1),(2,3),(4,1)\}$ and their rotations. F2 the
  neighborhood (one cell's 16 wires, drawn as moves on the plane; knob:
  pick the cell). F3 parity: every offset has odd $a{+}b$, so the
  checkerboard survives — reader toggles a hypothetical even rule in and
  watches the coloring die (counterfactual knob). F4 the re-hanging:
  choose k visible cells, re-layer the graph by distance-to-visible;
  planar ↔ layered toggle; strictly no same-layer wires (bipartite drawn).
  The "your sparse chip is secretly a deep Boltzmann machine" reveal.
  F5 two couplings per edge: symmetric mode = everything Part 1 proved;
  asymmetric mode = detailed balance visibly broken (a fenced curiosity:
  cycle flux meter nonzero, no scalar energy exists — one figure, then
  retired with a confession). Waypoint 1.

**Act II — The kernel (§3–§5).** Thermalizers for real.
- §3 The thermodynamic kernel, formally: $V_{\text{in}}/V_{\text{hid}}/V_{\text{out}}$,
  clamp–marginalize–normalize; $P^F(y|x)=\frac{1}{Z^F(x)}\sum_w e^{-E(x,w,y)}$
  earned by re-deriving Part 1's atlas-conditional with the three-way
  partition drawn in the three roles' colors. F6 the partition figure.
- §4 The context tax (marquee). The 5-node walk, one step compiled as a
  kernel. F7 compile under uniform q: per-step KL small everywhere,
  trajectory occupancy drifts — the leak ("conservation leakage" is the
  papers' own name for it), on the split-meter. F8 the visitation glow +
  refit under target-visited q — PROSE BOUND by the measured-facts
  section below: claim "weighting helps where it counts," NOT "error
  pools in unvisited contexts." F9 the three-stage ladder, which is the
  papers' own: uniform → context-matched → REINFORCE post-training,
  reproduction target their walk demo's half-ℓ1 error 5.64 → 0.30 →
  0.08 (our toy should show the same *shape*; our numbers are ours).
  REINFORCE build spec (now corroborated-detailed in RESEARCH):
  ∇L = E[F·(Φ − E[Φ|parent])], needs only the negative-phase clamping
  pattern — cheaper than CD, which is itself a teachable beat.
  $\mathcal L=\sum_x q(x) D_{\mathrm{KL}}(K(\cdot|x)\,\|\,\tilde K_\theta(\cdot|x))$
  with the inflation factor c_ℓ = max_x q(x)/μ(x) as the section's one
  scary-looking-then-obvious equation. Predict #1: "train on inputs the
  program never sends — what happens to the occupancy when we re-weight?"
- §4b The floor (new, from the third pull): the split-meter earns its
  theory overlay — per-step error η contracts through a mixing chain,
  so trajectory error saturates at a depth-independent floor
  δ̃ ≤ ε̄/(1−ρ). F9b: trajectory TV vs depth flattening onto the drawn
  floor, with ρ measured from the chain itself (their meta-EBM measures
  ρ₀ = 0.28, floor ≈ 0.6× bound — reproduce the *construction* at our
  scale). This upgrades "the leak accumulates" (Part 1's modest 1.28×)
  into the honest full statement: it accumulates, then saturates, and
  the floor is computable.
- §5 The λ-shift deep cut. F10 two energy models, same forward kernel,
  different hidden priors — forward pane identical, backward pane
  different; the shift $\lambda(x)$ drawn as a per-input energy offset
  the forward law cannot see. One figure, one equation, one boundary
  check. Waypoint 2.

**Act III — The taxes (§6–§7).**
- §6 Mixing–expressivity (their Appendix L as one knob). F11 coupling-cap
  dial: KL-to-target falls, autocorrelation time explodes; the
  split-meter gains a third pane (ESS) and the §6-of-Part-1 gate is
  re-invoked verbatim. Predict #2 on the knob's far end.
- §7 Placement economics. F12 the embedding of the walk kernel onto the
  actual fabric patch (chains routed, physical-per-logical counter);
  F13 the cost strip — charged in **Gibbs-iteration equivalents first**
  (readout ≈ 10²–10³ iterations, reflash "significantly more expensive"
  per the papers' own relative framing), with joules only as a secondary
  conversion at the estimated ~$3\times10^{-10}$ J/iteration. The figure
  charges the reader's choices (samples taken, kernels swapped) in a
  running meter. Numbers as dessert, AFTER the taxes bite (all VERIFY).
  Waypoint 3.

**Act IV — Sampling the impossible (§8).**
- §8 Meta-EBM: a 12-spin model with three-body terms (doubly impossible:
  the fabric cannot host $\binom{12}{2}$ wires AND pairwise Ising cannot
  express 3-body at all — their experiment: 18 pairwise + 20 three-body,
  N(0, 0.6²)). F14 the impossibility drawn; F15 one Gibbs *update* of
  the dense model compiled as a thermodynamic kernel; **F15b the
  soft-product gate** (the third pull's gift, and the figure an Extropic
  engineer would screenshot): one hidden spin per hyperedge realizes one
  higher-order term as a difference of softplus ramps —
  ½[sp(−2(αᵀx−β)) − sp(−2(αᵀx+β))] — with a knob sweeping the coupling
  magnitude and the residual visibly dying exponentially. A hidden spin
  is a product term; that is the whole secret of "expressivity from
  hidden units," drawn once. F16 the chain sampling the dense model
  through the sparse fabric — occupancy vs exact law (4096 states,
  oracle holds) on the split-meter, saturating within ~3 sweeps as
  theirs does. The chip samples a machine it cannot express. F17 hero
  returns: the walk, trajectory-honest, split-meter agreeing at both
  scales. Ending dessert (VERIFY first): the same three-stage ladder at
  industrial scale is the papers' market simulator — 14 assets, 4,802
  trading days, >1,000 hidden spins per step, composite error 0.818 →
  0.667 → 0.486 across single-BM → conditional chain → +REINFORCE —
  named in one sentence as where the toy's ladder goes when it grows up. Ending: three jobs from this article's own material (the
  compiler's taxes named; re-enchant via "every fixed machine is a
  universal sampler one compiler away — at a price you can now compute";
  send back to the papers themselves).

## Measured facts the §4 prose is bound to (check-walk.ts, 2026-08-05)

The leakage lab core is BUILT (`src/sims/pbits/walkCompile.ts`, exact
enumeration + exact chain propagation, no sampling) and these are the
numbers the article may claim, no others:

- Factorized leak: nh=0 puts up to **0.487** of output mass off-graph
  (Part 1's independence failure, recurring at the compiler level).
- Three hidden spins buy it back to **0.229**; uniform-context KL
  0.702 → 0.311.
- Trajectory accumulation is real but modest at this size: T=30
  trajectory TV **0.421 = 1.28×** the worst single-step TV (0.329);
  off-graph occupancy 0.190. Claim "exceeds any single step's," NOT
  "dwarfs."
- Context weighting works: visitation-weighted KL 0.565 → 0.475
  (tied-ring capacity — private per-context capacity nullifies weighting
  entirely, measured; fabric-sparse U is the honest final capacity story,
  F12).
- **Measured surprise: no free lunch DID NOT appear** — cold-context KL
  *improved* (0.66 → 0.60) under target-visited training; the shared
  wires spilled positively. F8's prose may NOT claim "error pools in the
  unvisited contexts" for this model — the honest line is "weighting
  helps where it counts, and here it cost the cold contexts nothing;
  the trade emerges when capacity is scarcer," with the scarcer-capacity
  version demonstrated only if we build and measure it.
- Model-visited refit (valid-projected q, one round) trims trajectory TV
  0.662 → 0.642; the principled off-graph treatment is the papers'
  REINFORCE (§III D) — now BUILT, measured below.

Ladder + floor measurements (check-walk-figs.ts, 2026-08-06; exact
REINFORCE built in walkCompile — expectations enumerated, no sampling,
gradient verified against FD to 5e-10):

- **The three-stage ladder** (tied ring, nh=3, T=30): trajectory TV
  **0.662 (uniform q) → 0.491 (context-matched) → 0.144 (+REINFORCE)**.
  Same shape as the papers' 5.64 → 0.30 → 0.08; these are our numbers.
- **REINFORCE's price, measured**: per-step KL RISES under REINFORCE
  (q-weighted 0.414 → 1.917) while trajectory TV falls 0.491 → 0.144 —
  the split-meter's two panes move in OPPOSITE directions in stage 3.
  Prose may claim the trade; it may NOT claim REINFORCE improves the
  per-step fit. Tied-capacity off-graph leak is also large (occupancy
  0.662 uniform-fit, 0.193 visited-fit at T=30) — bigger than the
  untied 0.190 above; say which capacity mode a number belongs to.
- **The floor** (untied, uniform q, 220 iters): with nh=2, ε̄ = 0.177,
  ρ = 0.753 (SLEM of the compiled 32×32 chain, power iteration; the
  Dobrushin coefficient is ~1 on garbage inputs and useless here), bound
  ε̄/(1−ρ) = **0.718**, measured curve saturates at **0.305** (≈0.42×
  the bound; papers' meta-EBM: ≈0.6×; TV(40)−TV(20) = 7e-5). With nh=0
  the bound goes VACUOUS (2.79 > 1) while the curve still saturates
  (0.772) — the honest capacity contrast F9b's knob shows. Also
  measured: training longer/sharper RAISES ρ (mixing–expressivity, §6's
  theme, already visible here).

## Infrastructure (build order)

1. `src/sims/pbits/z1.ts` — BUILT (session of 2026-08-05): exact offset
   topology on a torus, degree-16 verified, odd-parity ⇒ bipartite
   verified, BFS layering, symmetric-J model builder via lib's
   buildModel; asymmetric two-coupling support = TODO (needs a
   non-detailed-balance sweep handler — new sum-type variant, NOT a
   change to lib's existing handlers).
2. `Z1Fabric.tsx` / `Z1Layers.tsx` — F2/F4 seeds — Z1Layers BUILT.
3. Walk compiler core (`walkCompile.ts`) — BUILT (2026-08-05): sticky
   5-node walk, one-hot encoding, exact thermodynamic-kernel fit with
   weighted KL (log-space normalization; full-gradient FD — both bugs
   found by checks), tied-ring capacity mode, exact 32-config chain
   propagation, trajectory report, model-visited q.
   `bun run check:z1` chains fabric + walk suites, all green.
4. Split-meter component; visitation glow.
5. λ-shift, mixing-dial, embedding, meta-EBM figures.
6. Checks per figure family in `scripts/check-z1.ts` (degree/coloring/
   layering BUILT green; kernel/leak checks as built).

## Risks

(1) Every hardware number is unverified until RESEARCH.md closes — the
article cannot enter Stage 4 before that pass; (2) trajectory-leak
magnitude must be *measured* honestly — if the 5-node walk's leak is too
small to see, choose the walk the papers themselves use or a biased
variant until the effect is figure-scale, and confess the choice; (3)
asymmetric couplings tempt scope creep — one fenced figure, no more;
(4) the meta-EBM act is the likely week-scale item; it is the finale and
can ship behind `draft` last.
