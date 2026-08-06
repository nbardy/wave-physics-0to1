# RESEARCH — claims-to-verify ledger (Part 2)

Every claim below entered the design via a second-hand summary of the two
2026-08-04 papers (pasted into the build thread by an external agent). The
verification pass of 2026-08-06 read both primary sources directly and
closed the ledger. Statuses below are now VERIFIED / DISCREPANCY /
NOT FOUND against the papers themselves.

Primary sources:
- arXiv:2608.01612 — "A Framework for Stochastic Differentiable
  Programming" (Verdon, Tyrpak, Lockwood, Morton, Neagoe, Sugolov,
  MacCormack, Amico). Submitted 2026-08-03. This is the **Torx** paper.
- arXiv:2608.01615 — "Thermalizing Stochastic Programs" (Amico, Jelinčič,
  Nancarrow, Tyrpak, Roberts, Morton, Sakthivadivel, Gopal, Verdon).
  Submitted 2026-08-03. This is the **Thermalizers** paper.

---

## VERIFICATION PASS (2026-08-06)

**What was fetched and read, in full:**
- Torx: `https://arxiv.org/html/2608.01612v1` — full LaTeXML HTML, 748 KB,
  all sections I–VII plus Appendices A–D. Complete.
- Thermalizers: **no HTML version exists** on arXiv (`/html/2608.01615v1`,
  `v2`, `v3` all return 404; the abs page offers only a PDF link).
  Fetched `https://arxiv.org/pdf/2608.01615` (2.0 MB) and extracted text
  with `pdftotext -layout`. All sections I–V and Appendices A–M readable.
  Complete.
- THRML public repo: `https://github.com/extropic-ai/thrml` — README read.

**Access limitations, stated honestly:**
1. The Thermalizers text came from a two-column PDF extraction. Column
   interleaving occasionally splices adjacent columns mid-sentence. Every
   quoted number and equation below was read in its own reconstructed
   context, but equation *typography* (subscript placement, some Greek)
   is degraded relative to the source. Nothing below rests on a character
   whose identity the extraction made ambiguous.
2. **Figures were not seen as images.** Figure claims below are verified
   from figure *captions* and the surrounding body text, not from the
   rendered plots. Where a number appears only on a plot axis and not in
   caption or body, that is stated.
3. The `extropic-ai/thermalizers` repo cited in the paper's own reference
   [80] returns **HTTP 404** — not public as of this pass. Only `thrml`
   is public.
4. Section pointers below use the papers' own numbering. The Thermalizers
   paper has one internal inconsistency in its own equation references
   (see the error-floor line); it is recorded, not resolved.

**Tally:** 11 checkbox lines + 24 third-pull claims resolved.
See the summary at the bottom.

---

## Checkbox ledger

- [x] **Z1 offset rules** — **VERIFIED (Thermalizers §II B 1).** Verbatim:
      a node at position (x, y) with connection rule (a, b) is connected
      to the four nodes at (x+a, y+b), (x−b, y+a), (x−a, y−b), (x+b, y−a)
      — i.e. the four 90° rotations of the offset. "All nodes in Z1 have
      connection rules (1,0), (2,1), (2,3), (4,1), giving degree 16."
      Longest edge is √17 ≈ 4.1 grid units. Fig 2(c) shows a 21×21 grid.
      **Boundary: NOT a torus.** Degree 16 holds "except at grid
      boundaries where some edges fall outside the grid" — a truncated
      grid with degree-deficient borders.

- [x] **"Two different couplings per edge"** — **VERIFIED (Thermalizers
      §II B), the paper's own phrasing.** "a sparse, locally connected,
      2-colorable graph, where each node supports two different couplings
      per edge (one per direction)". The programming model is directional:
      J_vu need not equal J_uv. Equilibrium caveat is explicit: if any
      edge is asymmetric the Gibbs dynamics "no longer obeys detailed
      balance"; a stationary distribution still exists (all couplings
      finite) but "generally does not admit a closed-form expression, and
      it is unclear how to train such a model." The paper calls a learning
      rule for the asymmetric case "very impactful" but "unlikely given
      that the problem appears intractable," and restricts the rest of the
      document to the symmetric (Boltzmann-machine) case.

- [x] **Node count** — **VERIFIED (Thermalizers §II B): "the entire chip
      has ∼250,000 nodes."** Confirmed a second time in §IV E as a
      "250,000-p-bit Z1 array". **269,568: NOT FOUND** — the precise
      figure appears nowhere in either paper. The Part 1 scrub was
      correct. "Mostly regular" is also the paper's own phrasing: "The
      graph is mostly regular with degree 16, and is locally connected."

- [x] **Iteration rate and per-iteration energy** — **VERIFIED
      (Thermalizers §II B): "each Gibbs iteration is estimated to cost
      approximately 3 × 10⁻¹⁰ J, and the chip will perform between 10⁶
      and 10⁷ Gibbs iterations per second."** One Gibbs iteration = both
      block updates (V₁ then V₂).
      **DISCREPANCY (internal to the paper) — do not quote 3×10⁻¹⁰ J as
      the paper's final number.** Appendix B supersedes it with a
      SPICE-based per-node breakdown (Table IV): sampling costs
      **7.09 fJ per pBIT node per Gibbs cycle at 50 MHz**. At ~250,000
      nodes that is ≈1.8 × 10⁻⁹ J per full-chip iteration — about **6×
      higher** than the §II B estimate. Appendix B says so directly for
      the reference workload: the refined estimate is "higher by a factor
      of 9.8" than the earlier coarse projection, "while remaining within
      one order of magnitude." Appendix B also states the pBIT now
      supports **50 MHz** Gibbs update speed, above the §II B range of
      10⁶–10⁷/s. Prose must either cite §II B's estimate *as* an estimate
      or cite Appendix B's per-node figure — never blend them.

- [x] **Readout cost and coupling reflash** — **VERIFIED (Thermalizers
      §II B 2).** Three non-sampling operations, verbatim: (1) Readout
      "costs about as much **energy** as 10²–10³ Gibbs iterations" —
      note this is an energy ratio, not a time cost; (2) Coupling
      flashing "is significantly more expensive than readout"; (3)
      Clamping is "about as expensive as coupling flashing" (a detail the
      ledger did not have). Constraint: "As long as coupling re-flashing
      is infrequent (no more than about once per second)" the chip
      retains its speed/energy advantage.
      Quantified in Appendix B Table IV: E_read = 1.692 pJ/node,
      E_write = 153.6 pJ/node — flashing is ≈**91×** readout per node —
      and "a Gibbs update consumes roughly three orders of magnitude less
      energy than a read or write operation."

- [x] **Thermodynamic-kernel formalism** — **VERIFIED (Thermalizers
      §II A Eq (5), restated §III A Eqs (18)–(19); Fig 1 caption).**
      Forward law: P̃F(y | x; φ) = ψ_φ(x,y) / Z^F(x; φ), with affinity
      ψ_φ(x,y) := Σ_w e^{−E_φ(x,w,y)} (Eq 18) and Z^F(x; φ) := Σ_{y′}
      ψ_φ(x, y′) (Eq 19). Operationally, verbatim: "It is sampled by
      clamping x, Gibbs-sampling (w, y), and reading out y."
      Our clamp–marginalize–normalize statement is the paper's own: the
      Fig 1 caption describes the kernel as "obtained from an EBM by
      clamping the input spins x (orange), marginalizing hidden spins w
      (yellow) and normalizing over the output spins y (maroon)."

- [x] **Context-matching loss form** — **VERIFIED (Thermalizers §III B).**
      Three choices of training input distribution μ_ℓ, verbatim: (i)
      target inputs μ_ℓ = q_{ℓ−1} ("This is the default"); (ii) model
      inputs μ_ℓ = q̃_{ℓ−1}; (iii) generic inputs, e.g. uniform.
      Re-optimizing under (i)/(ii) is named **target-CM** / **model-CM**.
      REINFORCE enters *after* context matching (§III D), explicitly last
      in the pipeline: "Generic inputs enter only through pre-compiled
      libraries, repaired by context matching after placement (§III C).
      REINFORCE post-training comes last (§III D)." Standing preference:
      "Whenever possible, however, one should always aim to train using
      target inputs." Case (c) trajectory data *rules out* model-CM
      because the data fixes the input distribution.

- [x] **λ(x) shift invariance** — **VERIFIED (Thermalizers §II A,
      Eqs (7)–(9)).** Shifted energy E_{φ,λ}(x,w,y) := E_φ(x,w,y) − λ(x)
      (Eq 7). Forward: "Because e^{λ(x)} depends only on x, it factors
      out of the sums over w and y in the forward normalization and
      cancels," giving P̃F_λ(y | x) = P̃F(y | x) (Eq 8) — "The forward is
      invariant under this shift." Backward: "The backward is not,"
      P̃B_λ(x | y) ∝ e^{λ(x)} Σ_w e^{−E_φ(x,w,y)} (Eq 9), which
      reweights the implicit prior to p_{φ,λ}(x) ∝ e^{λ(x)} Z^F(x).
      Consequence stated in §III A: forward compilation determines an
      *equivalence class* of energies; the choice of λ "is just a
      convention when considering a single conditional but it starts to
      matter once forward-compiled conditionals are tiled together."
      Appendix H develops backward compilation.

- [x] **Mixing–expressivity tradeoff** — **VERIFIED (Thermalizers
      Appendix L 1, titled "The mixing–expressivity tradeoff"; introduced
      in §III A and Fig 4).** Note Appendix L as a whole is titled
      "Thermodynamic consistency models"; MET is its §L 1.
      What is capped: nothing is *capped* by MET itself — it is a
      tension, not a constraint. Worked two-spin example: E(s₁,s₂) =
      −J s₁s₂, bimodal data {(+1,+1), (−1,−1)}; barrier height 2J,
      crossing probability ∝ e^{−2J}, "the mixing time scales as e^{2J}."
      "Modeling the data faithfully requires large J, while sampling
      within any fixed budget requires small J."
      Where it bites, verbatim: "The tradeoff enters twice, biasing the
      truncated CD phases of Eq. (23) during training and inflating the
      number of sweeps the kernel needs per sample at deployment."
      Key exemption for our figures: **"Clamped spins do not enter this
      tradeoff."** A clamped spin shifts neighbors' local fields but
      "creates no barrier among them," so kernel inputs and conditioning
      "may therefore be coupled arbitrarily strongly to the free spins at
      no cost in mixing time." Mitigation is the adaptive correlation
      penalty (ACP) of Ref. [21], which "bounds the mixing time
      throughout training and keeps the estimator reliable" (§III A).

- [x] **Meta-EBM demo parameters** — **VERIFIED with one correction
      (Thermalizers §IV D).** d = 12 spins, "small enough that the full
      2¹² -state distribution is enumerable"; 18 pairwise couplings and
      20 three-body hyperedges drawn uniformly at random from the pairs
      and triples of the 12 sites; fields and coupling magnitudes i.i.d.
      from N(0, 0.6²); kernels compiled variationally under uniform input
      measure μ_ℓ = U, "with no context matching."
      **DISCREPANCY: "12-spin fully-connected" is wrong as a description
      of the target.** The *target* is sparse (18 of the 66 possible
      pairs, 20 triples). "Fully connected" describes the *compilation*:
      "the kernels are compiled over a fully connected spin set with only
      the imposed dynamic-range constraint, so J_max is the single
      tunable knob." The topology residual is deliberately excluded from
      this measurement: "The connectivity residual would also contribute
      but is not simulated here."

- [x] **Fig 2 layered-by-distance construction** — **VERIFIED
      (Thermalizers §II B 1 and Fig 2 caption).** Construction, verbatim:
      "When using a grid of L² nodes as a BM for d-dimensional data, we
      randomly designate d of the L² nodes as visible (one per data
      dimension); the remaining L² − d nodes become hidden. The hidden
      nodes' effective depth is determined by their graph distance to the
      nearest visible node, giving rise to an emergent layer structure
      akin to a deep Boltzmann machine."
      Fig 2 caption: (a) grid with randomly chosen visible nodes, colored
      in a bipartite pattern, "all nodes of one color can be updated
      simultaneously during Gibbs sampling"; (b) "The same graph
      rearranged into layers based on graph distance from the nearest
      visible node, revealing an emergent deep Boltzmann machine
      structure"; (c) Z1 connectivity on a 21×21 grid, all edges from one
      highlighted node in red. Our Z1Layers reproduces the construction
      as stated. Caveat per the access note: the caption and body were
      read; the rendered figure was not.

- [x] **THRML public repo** — **VERIFIED (README, github.com/extropic-ai/
      thrml).** "a JAX library for building and sampling probabilistic
      graphical models, with a focus on efficient block Gibbs sampling
      and energy-based models." Supports blocked Gibbs for PGMs and
      heterogeneous graphical models; the README example does two-color
      block Gibbs with alternating blocks. API surface named in the
      README: `SpinNode`, `Block`, `SamplingSchedule`, `sample_states()`,
      `IsingEBM`, `IsingSamplingProgram`. Python 3.10+, Apache-2.0.
      **The `extropic-ai/thermalizers` repo cited as reference [80] of
      the Thermalizers paper returns HTTP 404** — not public as of this
      pass. Do not cite it as available.

---

## Third pull — claim-by-claim resolution

### Torx internals

- **Backends** — **VERIFIED (Torx §IV.2).** Three software backends:
  `SampleSimulator` draws from ρ_out "by sampling sequentially through
  the gates"; `HybridSampleSimulator` "mirrors it for registers that mix
  discrete and continuous wires"; `StateVectorSimulator` "instead
  propagates the full probability vector, returning ρ_out exactly up to
  floating-point error," of size 2ⁿ and so "primarily useful for
  small-scale prototyping." Hardware backend: "replaces the software
  pseudorandom generator (e.g. Threefry) with a physical randomness
  source. Any gate that needs a random draw can source it directly in
  hardware." All four clauses verbatim-supported.

- **XTR-0 / X0 calibration and rates** — **VERIFIED (Torx §IV.2 and
  Appendix D).** X0 is "a subthreshold CMOS test chip accessed through
  the XTR-0 desktop platform, carrying pbits, pdits, Gaussian samplers,
  and mixture-of-Gaussian samplers as physically separated primitives."
  Software-defined topology, verbatim: "The host and FPGA set their
  parameters and route samples and control, so the logical interaction
  topology is software-defined (Figure 6)." Energy/rate: "hundreds of
  attojoules to single femtojoules per sample at rates of tens of MHz."
  Calibration: "before sampling for the first time each pbit undergoes a
  Bayesian-optimization-based calibration that maps digital controls to
  bias voltage, with typical per-site calibration errors around 5% in
  absolute probability." Relaxation: "rates set by the device relaxation
  time (∼100 ns)."

- **Z1 contrast with XTR-0** — **VERIFIED (Torx §IV.2, Fig 7 caption).**
  Verbatim: Z1 "hardwires a degree-16 sparse interaction graph directly
  in silicon and executes chromatic Gibbs sweeps without FPGA mediation,
  communicating only h_i and J_ij between sweeps." And: "XTR-0
  reconstructs any k-local generator off-chip via the FPGA, paying a
  per-gate round-trip latency for arbitrary topology, while Z1 evaluates
  2-local Glauber generators natively in a single sweep but requires
  compilation of the logical PSC to a hardware-compatible
  representation." Fig 7 caption: "each pbit (black dot) is physically
  coupled to 16 neighbors via on-die wiring that extends beyond
  nearest-neighbor positions."

- **Walk = Trotterized CTMC; PSWAP identity** — **VERIFIED (Torx §V.1).**
  PSWAP_ij(p) = I − p(e_i − e_j)(e_i − e_j)ᵀ; "setting p = w_ij τ gives
  PSWAP_ij(w_ij τ) = I + τ Q_ij." Exact exponential also available:
  PSWAP_ij((1 − e^{−2 w_ij τ})/2) = e^{τ Q_ij}.

- **Edge coloring gives the Trotter groups** — **VERIFIED (Torx §V.1,
  and generally §III.2).** "Since Q_ij and Q_kl commute whenever edges
  {i,j} and {k,l} are vertex-disjoint (they act on disjoint coordinates),
  an edge coloring of 𝒢 groups commuting generators together, reducing
  the number of Trotter groups to k = χ′(𝒢) the edge chromatic number."

- **Trotter error orders** — **VERIFIED (Torx §III.2).** Lie–Trotter:
  single-step error O(t²k²/N²), "and since the errors of the N steps
  accumulate at most additively (the telescoping bound), the global error
  is O(t²k²/N). This is a first-order method, doubling N halves the
  global error." Strang: "a local error of O(t³k³/N³), hence a global
  error of O(t³k³/N²), at the cost of 2k−1 rather than k gate
  applications per step." Selection rule (extra detail worth having):
  "When only Euler kernels are available, both splittings incur an
  additional O(k t²/N) Euler error that dominates at any practical N, so
  Lie–Trotter is simpler and sufficient. When exact local exponentials
  are available, Strang is preferable for N ≳ kt steps."

- **"PAsymSwap is the biased-walk gate"** — **DISCREPANCY.** The string
  "PAsymSwap" (and "Asym" in any form) **does not appear anywhere in the
  Torx paper**, including its gate appendix. Appendix A of Torx lists
  PReset, PCNOT, PSWAP, PJUMP, PDEMUX, PCopy, PditShift, PditSWAP — no
  asymmetric-swap gate. Torx's own random-walk demonstration (§V.1) is
  **unbiased** graph diffusion: "the graph Laplacian decomposes into one
  generator per edge, and each factor is a single PSWAP gate."
  PAsymSwap is named only in the **Thermalizers** paper, §IV A: "This is
  the asymmetric stochastic swap gate PAsymSwap in the torx library
  [10]" — i.e. the gate exists in the torx *library* but the biased walk
  is a Thermalizers demonstration, not a Torx one. Prose must not
  attribute PAsymSwap or the biased walk to the Torx paper.

- **Discrete-diffusion demo** — **VERIFIED (Torx §V.2, Fig 11).** The
  tau-leaping reverse step is exactly the PSC ⊗_i PNOT(θ⁽ⁱ⁾), one
  independent gate per pixel, parametrized by the denoiser output; the
  top K = 50 pixel pairs by |c_{j→i}| get one PCNOT(c_{j→i}) each,
  giving n + K gates. Result verbatim: "on 28×28 binary MNIST … the PSC
  augmentation reduces bit-error rate from 0.114 (tau-leaping) to 0.113
  and closes 41% of the FID gap between corrupted and clean
  distributions."

- **SGNN demo** — **VERIFIED with one softening (Torx §V.3, Fig 12).**
  "one wire per node, one parametrized PIsing gate per edge, with
  parameters tied under any automorphism that permutes the edges" —
  verbatim. Experiment: "On a random 3-regular graph (n = 8, |E| = 12)
  with one PIsing gate per edge, N = 5 sweeps, and S = 1024 samples per
  step, the trained SGNN outperforms a uniform sampler and recovers the
  optimal cut in the majority of runs." Optimal cut = 12.
  **DISCREPANCY (mild):** the ledger's "Max-Cut 3-regular 8-site
  optimal" reads as a clean solve. The paper claims the optimum only "in
  the majority of runs." Prose must carry that hedge.

- **Jump-diffusion demo** — **VERIFIED (Torx §V.4, Figs 13–14).**
  One-step propagator splits as T_Trotter(Δt) = T_MoG(Δt) T_PditCycle(Δt):
  a `PditCycle` gate on a K-state wire (forward rate λ₊, backward λ₋,
  p_± = λ_± Δt, p₀ = 1 − (λ₊+λ₋)Δt) followed by the hybrid `MoG` gate
  applying regime-conditioned Gaussian dynamics. Parameters: K = 3
  regimes, μ = (1.0, 0.0, −0.8), σ = (0.3, 1.0, 0.5), λ₊ = 0.5,
  λ₋ = 0.3, T = 10. Error is linear in Δt since A_S and A_X do not
  commute. (Note the gate is written `MoG`, not `PMoG`.)

- **Ising ring, PColor** — **VERIFIED (Torx §V.5, Eq (60)).**
  PColor_i = PNOT(2β ℓ_i) ∘ PReset(∞), "which resets σ_i to 0 and
  resamples it from the exact Gibbs conditional," with
  ℓ_i = h_i + Σ_{j∈N(i)} J_ij (2σ_j − 1). Setting: 8-site ring, random
  J_ij and h_i, β = 1.5, two-colorable into evens/odds. Honesty note the
  paper volunteers: ℓ_i is computed "classically in Python, although on
  our Z1 chip this can be done natively."

- **Edge-tiled vs chromatic TV (0.402 vs 0.052)** — **VERIFIED (Torx
  §V.5, Fig 16).** Chromatic Gibbs: "Over 6000 chains and 240 sweeps
  this achieves a total-variation distance of 0.052 from the exact
  Boltzmann distribution." Edge-tiled PIsing on the same 8-site ring:
  "this yields TV distance 0.402, nearly eight times worse than
  chromatic Gibbs." Fig 16 "confirms that the per-site gate matches the
  exact distribution, while edge-tiled PIsing does not." This is the
  paper's own version of our §5–§6 result and the numbers are exact as
  recorded.

- **20,000 hardware-drawn samples** — **VERIFIED (Torx §V.6, Fig 17).**
  Metropolis–Hastings and self-normalized importance sampling both run
  on Bernoulli randomness from a calibrated X0 pbit via XTR-0, at the
  β = 1.5 8-site ring of §V.5; π available by full enumeration over 2⁸
  configurations. "Both methods achieve a total variation distance
  consistent with software baselines, using 20,000 hardware-drawn
  samples." Framing to preserve: "The logical PSC is unchanged between
  the two runs, and the only difference between them is the randomness
  provider."

- **Three gradient estimators** — **VERIFIED (Torx §III.3).**
  (1) REINFORCE / score-function, unbiased from a single batch of S
  trajectories; requires G_j(z⁽ʲ⁾ | z⁽ʲ⁻¹⁾) > 0 on the support, i.e.
  parameters kept away from p ∈ {0,1} — "In the case of the sigmoid
  parametrization of Eq. (17), this is enforced automatically."
  (2) Parameter shift: for the sigmoid-mixture family,
  ∂G(θ)/∂θ = G(θ) − G(θ⁻) (Eq 37) with θ⁻ = −ln((1+e^{−θ})² − 1)
  (Eq 36), defined by σ(θ⁻) = σ(θ)². Two stated limitations: it applies
  only to gates of the Eq (17) sigmoid-mixture form, and "each parameter
  requires a separate shifted circuit evaluation, so unlike REINFORCE
  the full gradient cannot be obtained from a single batch of runs" —
  though only downstream gates need resampling.
  (3) Energy-based: ∇_θ log G(θ)(y|x) = −∇_θ E(x,y;θ) +
  E_{y′∼G(θ)(·|x)}[∇_θ E(x,y′;θ)] (Eq 43).

- **PSC definition and typed wires** — **VERIFIED (Torx §I, §III).**
  "A PSC is an ordered sequence of layers of stochastic gates acting on
  binary, categorical, and continuous wires, where each gate is a local
  conditional transition rule with tunable settings." The three wire
  types are pbit / pdit / pmode (§III.1 subsections). "A Parametrized
  Stochastic Circuit is the circuit-shaped specialization of the directed
  factor graph… kernels in the same layer have disjoint state spaces and
  execute in parallel, while layers compose in series."

### Thermalizers internals

- **Target-spec taxonomy (a)/(b)/(c)** — **VERIFIED (Thermalizers
  §III A, "Target specification," ordered by decreasing access).**
  (a) explicit conditional — closed form, output space enumerable; "A
  Trotter gate given as a small stochastic matrix, as in §IV A, is of
  this kind." (b) conditional sampler — can draw y ∼ P_ℓ(·|x) at any
  prescribed x; Monte Carlo estimates. (c) trajectory data — "we possess
  recorded trajectories z_{0:L} but cannot query the kernels at inputs
  of our choosing… with many (yesterday, today) pairs and no way to
  re-run yesterday. The market simulator of §IV C fits in this
  category." Also verified: (b) and (c) coincide for the gradient, and
  differ only in §III B where (c) "fixes the input distribution, which
  rules out model-context matching."

- **Model taxonomy (1) tractable / ATK, (2) intractable** — **VERIFIED
  (Thermalizers §III A, "Model structure").** (1) "Enumerating the output
  spins costs 2^{n_out} terms, and hidden spins need not be enumerated at
  all when they can be summed out analytically, which is possible in
  closed form whenever they form an independent set. The analytic
  thermodynamic kernel (ATK, Appendix F) generalizes this approach."
  (2) Eq (23): −∇_φ log P̃F(y|x;φ) = E_{(w,y′)∼p_φ(·,·|x)}[Φ_φ(x,w,y′)]
  − E_{w∼p_φ(·|x,y)}[Φ_φ(x,w,y)], with Φ_φ := −∇_φ E_φ "the vector of
  the THM's couplings J_e for each hyperedge, one spin product ∏_{i∈e} s_i
  per hyperedge e and one spin value s_i per spin, read directly off a
  spin configuration." Clamping patterns, verbatim: "The input spins are
  clamped (to x) in both, the hidden spins thermalize freely in both, and
  the output spins thermalize freely in the first term (the negative
  phase) but are clamped to the target's sample y in the second (the
  positive phase). This is the contrastive-divergence estimator of
  Boltzmann-machine learning, in conditional form." Matches our
  PhaseTrainer.

- **Residual sources (Fig 4)** — **VERIFIED (Thermalizers §III A,
  Fig 4).** Three sources, verbatim from the caption: the
  hypothesis-class limitation ("the set of forward conditionals the
  kernel can realize at a fixed hidden-spin count n_h and topology…
  fixed by n_h, topology, and the coupling and bias caps"), the
  optimization residual ("the gap from φ̂ to the true in-class minimizer
  φ*"), and the sampling bias of unmixed phases (labeled MET in the
  figure), which "displaces the achieved point within the class." Fig 4
  shows nested classes n_h = 0 ⊂ n_h = 1 ⊂ n_h ≥ k*.

- **Error-propagation bound** — **VERIFIED (Thermalizers §III A
  Eqs (24)–(25); Eq (43) in §IV D).** η_ℓ = sup_x ‖P̂_ℓ(·|x) −
  P_ℓ(·|x)‖_TV (Eq 24), "the worst-case total-variation error of the
  deployed conditional." Contraction: ‖P_ℓ(p − q)‖_TV ≤ ρ(P_ℓ)‖p − q‖_TV
  (Eq 25). Accumulated error δ̂_ℓ = ‖q̂_ℓ − q_ℓ‖_TV. Depth-independent
  floor, Eq (43): **δ̃_t ≤ ε̄ / (1 − ρ₀)**, with ε̄ = max_ℓ η_ℓ the
  worst-case conditional TV of the compiled kernels and ρ₀ ≡ ρ(P) the
  contraction coefficient of the ideal sweep (Eq (G2)).
  **DISCREPANCY (internal to the paper, record but do not resolve):**
  the floor's appendix equation is cited inconsistently — §III A and the
  Fig 12b caption say **(G9)**, §IV D says **(G10)**. Cite the bound as
  Eq (43) of §IV D, which is unambiguous.

- **ρ₀ = 0.28 and the measured floor** — **VERIFIED (Thermalizers §IV D,
  Fig 12b).** "The measured stationary error tracks this prediction
  across the full cap sweep, spanning over a decade of error, from 0.46
  at the most aggressive cap down to 2.4 × 10⁻² at J_max = 10, at fixed
  ρ₀ = 0.28. The measured floor sits consistently at ≈ 0.6× the bound,
  which makes the bound a reasonably tight upper envelope rather than an
  order-of-magnitude estimate." Fig 12b caption adds that ρ₀ ≈ 0.28 was
  "estimated using exact diagonalization" on the enumerable d = 12
  target, and that the plateau is reached "within t ≈ 3 sweeps, with each
  sweep being a pass over all the color classes."
  Degradation mechanism, verbatim and load-bearing for the §4b figure:
  "As J_max tightens, the floor climbs not because the chain mixes worse,
  since ρ is fixed by the target and not by the substrate, but because
  the per-step residual ε̄ rises as the cap clips sharper and sharper
  logits."

- **Context matching: μ choices and inflation factor c_ℓ** — **VERIFIED
  (Thermalizers §III A, Eq (17)).** Verbatim definition: "let μ_ℓ denote
  the distribution of the inputs under which kernel ℓ is trained and let
  **c_ℓ := max_x q_{ℓ−1}(x)/μ_ℓ(x)** be the largest factor by which the
  target's input marginal exceeds it."
  Eq (17) is the three-level chain:
  D_KL(R#P ‖ R#P̃_φ) ≤ D_KL(P ‖ P̃_φ) = Σ_ℓ ε_ℓ(φ_ℓ) ≤
  Σ_ℓ c_ℓ E_{x∼μ_ℓ}[J_ℓ(x; φ_ℓ)] — labeled left-to-right as **readout
  error**, **trajectory error**, and the inflated per-kernel bound.
  Left inequality is the data-processing inequality; middle equality is
  the KL chain rule at μ_ℓ = q_{ℓ−1}. Specialization for uniform μ on
  n_in input spins: **c_ℓ = 2^{n_in} max_x q_{ℓ−1}(x)** (§III C).
  Bound behavior: "trajectory error grows at worst linearly in program
  depth. This cannot be improved in general, but it is often pessimistic."
  The F8 figure's Eq-17 chain is exactly this display.

- **"Conservation leakage" is their own name** — **VERIFIED
  (Thermalizers §III B and §IV A).** §III B: "(The conservation leakage
  in the random-walk demonstration of §IV A is exactly this failure
  mode)" — the mode being upstream residuals leaking probability onto
  inputs the target never produces, "where a kernel trained under target
  inputs was free to be arbitrarily wrong." §IV A: "the dominant artifact
  is single-particle conservation leakage. The compiled gate conditionals
  assign small non-zero probability to transitions outside the
  one-particle sector, and over many layers the realized marginal
  accumulates multi-particle support." Our walkCompile measured the same
  phenomenon independently (0.487 off-graph at nh = 0); the convergence
  is real and the name is theirs.

- **REINFORCE post-training: gradient, clamping, reward shaping** —
  **VERIFIED (Thermalizers §III D, Eqs (26)–(28)).** Loss L^RF =
  E_{z_{0:L}∼P̃_φ}[F(z_{1:L})] (Eq 26). Gradient (Eq 27):
  ∇_{φ_ℓ} L^RF = E[ F(z_{1:L}) ( Φ_{φ_ℓ}(z_{ℓ−1}, w_ℓ, z_ℓ) −
  E_{(w′,y′)∼p_{φ_ℓ}(·,·|z_{ℓ−1})}[Φ_{φ_ℓ}(z_{ℓ−1}, w′, y′)] ) ] — the
  reward times a centered score, the inner expectation conditional on the
  sampled parent. **Clamping requirement VERIFIED verbatim:** "unlike
  contrastive divergence…, which needs the two clamping patterns to
  compute the gradient (known as the positive and the negative phase),
  REINFORCE only requires inputs to be clamped with all hidden and output
  nodes being free (just like the negative phase of CD)." Appendix I
  gives an unbiased estimator "that costs only one extra 'reference'
  sample per factor."
  Reward shaping (Eq 28): for D(φ) = ‖m_φ − t‖², **F_eff(z_L) =
  2 Σ_i (m_{φ,i} − t_i) f_i(z_L)**, "with m_φ estimated by the minibatch
  mean and held fixed under differentiation (a stop-gradient)."
  Variance caveat that binds our §4 prose: "the score-function gradient
  can have very high variance… REINFORCE becomes effective only once the
  model is already good enough that its samples reach the region where F
  discriminates, and supplying a good starting model is exactly what
  variational compilation and context matching are for."

- **Walk demo: 5.64 → 0.30 → 0.08** — **VERIFIED (Thermalizers §IV A,
  Fig 5).** Verbatim: "Stacking context matching and REINFORCE reduces
  the final-time half-ℓ1 occupancy error from 5.64 (compiled-only) to
  0.30 (context matched) to 0.08 (context matched + REINFORCE), nearly
  two orders of magnitude."
  All parameters confirmed: 5×5 **torus**, M = 10 macro steps,
  δt = 0.05, γ = 2; each PAsymSwap compiled with n_in = n_out = 2,
  n_h = 1; "the median compiled total variation distance for the
  PAsymSwap gates is 0.096." Trained under a **uniform** input
  distribution, then **model**-context matching, then REINFORCE — the
  paper runs the full three-stage pipeline "deliberately… to expose how
  much the input distribution alone matters" (§III B).
  Extra parameters our figures should carry: 6M = **60 layers**;
  "Reported results are measured over **4096 chains**, with each compiled
  layer sampled after **K = 30** block-Gibbs sweeps"; per-site logits
  a_i = 2 sin(2π(2x_i + y_i)/L + 0.2) + 0.75 cos(2π(x_i − 2y_i)/L − 0.4).
  REINFORCE objective (Eq 35): L^RF_rw(φ) = Σ_i (m_{φ,i} − m*_i)²
  against the analytic CTMC marginal m* = (e^{QT} p(0))_i, optimized with
  Eq (28), f_i(z_L) = (z_L)_i, t = m*.
  Crucial interpretive line for the split-meter: "This quantity coincides
  with the total variation between site-occupancy distributions when
  particle number is conserved, but under leakage it is bounded below by
  half the mass discrepancy… The compiled-only occupancies exceed the
  CTMC marginal at every site (Fig. 5c), so the error **5.6 =
  (12.2 − 1)/2 is a pure conservation leak**, half the excess mass of
  panel (a)."

- **Birth–death demo** — **VERIFIED (Thermalizers §IV B).** Capacity
  C = 15, ecosystem size L = 16, two-dimensional grid **on a torus**,
  two species (rabbits, foxes), predation rate swept dp ∈ {4,…,12} with
  all else fixed. Compiled to Analytic Thermodynamic Kernels
  (Appendix F). Verbatim: "Kernels with only four and eight visible nodes
  are capable of reproducing the conditional distributions of the
  migration and reaction processes respectively to a worst-case total
  variation distance of ∼0.01." Note the assignment: **four**-visible →
  migration, **eight**-visible → reaction. Fig 16 shows the Z1-topology
  kernels.

- **Market simulator** — **VERIFIED (Thermalizers §IV C, Table II,
  Fig 9–11, Appendix M).** "The data is a panel of N = 14 … 4,802
  trading days from 2007 to 2026 (Appendix M 1). Each day is discretized
  into x_t ∈ {−1,1}⁵⁶, 4 bits per asset." "The target conditional ranges
  over 2⁵⁶ outputs, and the kernels that compile it carry over a
  thousand hidden spins" — i.e. intractable, target case (c).
  Architecture (Fig 9 caption): the one-day kernel K_θ is "a two-step
  conditional TCM (Appendix L) whose two BMs are both conditioned on the
  clamped context c_t, the noisier BM2 drafts the next day's state, and
  the cleaner BM1 refines that draft, which it receives through the
  denoising coupling." Context length: "The drawing shows B = 3 context
  days for readability; the model uses **B = 5**."
  Composite scores (Table II), each term normalized by the training-free
  baseline built to fail it: indep. Markov chains 2.961; iid
  day-resampling 1.651; **single conditional BM 0.818**; **conditional
  TCM (stage 1) 0.667**; **TCM + REINFORCE (stage 2) 0.486**. Evaluation
  is 256 rollouts of 1,200 days on held-out data; REINFORCE trains on
  20-day rollouts. Generalization claim, stated with its own hedge:
  "the claim is only that the improvement transfers, not that
  post-training improved anything that wasn't already specified as part
  of the reward." Note the 0.818 baseline is the TCM's own noisiest step
  run alone, not an independent model.

- **Meta-EBM: "the compilation of the Gibbs sampling program that
  samples it"** — **VERIFIED verbatim (Thermalizers §IV D).** Full
  sentence: "Rather than compiling the target EBM and then sampling it, a
  meta-EBM is the compilation of the Gibbs sampling program that samples
  it." Correctness argument: each compiled kernel leaves π invariant and
  compositions of π-invariant kernels are π-invariant, so "the schedule
  [is] a runtime choice rather than a property of the couplings" —
  provided parallel updates use a chromatic schedule, since "a
  simultaneous update is a valid Gibbs move only when neither site lies
  in the blanket of the other."

- **"Every Z1-realizable Ising model is RBM-like bipartite"** —
  **VERIFIED verbatim (Thermalizers §IV D).** "Every coupled pair in
  E_Z1 sits at a lattice offset (dx, dy) with dx + dy odd, so the lattice
  is a chessboard, and every Z1-realizable Ising model is an RBM-like
  bipartite model that cannot host a dense interaction graph."
  The consequent placement obstruction (needed for the F15b figure's
  honesty): "On the bipartite chessboard, a spin that is simultaneously a
  pairwise neighbor and a three-body partner of site n cannot keep both
  its affine edge and its bilinear edge, leaving an irreducible per-site
  residual that persists at any value of the cap" (Appendix J 2).

- **Target Eq 40 and kernel logit Eq 41** — **VERIFIED (Thermalizers
  §IV D).** Eq (40): E(x) = −Σ_n W_n x_n − ½ Σ_{(m,n)} W_mn x_m x_n
  − (1/3!) Σ_{(n,m,m′)} W⁽³⁾_{nmm′} x_n x_m x_{m′} — fields, pairwise,
  three-body, sums over ordered tuples of distinct sites with fully
  symmetric couplings. Eq (41): θ_n(x) = W_n + ½ Σ_{(m,n)} W_mn x_m +
  (1/3!) Σ_{(n,m,m′)} W⁽³⁾_{nmm′} x_m x_{m′}. The ledger's "⅙" is
  correct (1/3! = 1/6). Native substrate energy is Eq (39),
  E_native(s) = −Σ_i h_i s_i − ½ Σ_{(i,j)∈E_Z1} J_ij s_i s_j.

- **Soft-product gate formula** — **VERIFIED (Thermalizers §IV D,
  Eq (42)).** θ_y(x) = J_xy ᵀ x + h_y + Σ_{a=1}^{n_h} ½ [ sp(−2(α_aᵀx −
  β_a)) − sp(−2(α_aᵀx + β_a)) ], "where α_a is the input-to-hidden
  coupling of spin a and β_a its coupling to the output." Mechanism:
  "Each bilinear term is reproduced by one hidden spin acting as a soft
  product gate, obtained by aligning its input projection α_a with the
  pair (x_m, x_m′) and driving the coupling large, which sharpens the
  softplus difference toward a ReLU. The contribution of the spin then
  converges to the product x_m x_m′, with a residual that decays
  exponentially in the coupling magnitude." Additivity: "Distinct hidden
  spins do not interact and their contributions add by superposition, so
  one hidden spin per three-body hyperedge touching site n reproduces the
  entire conditional (41), up to **n_h = 8 per site** for the sparse
  target used here." Ideal limit: "On a fully connected substrate with
  unbounded couplings the compilation is exact and the loss infimum is
  zero." Pattern precedent: the closed-form PNOT example of Appendix E,
  "in which affine log-odds require no hidden spins while each
  nonlinearity requires one."

- **J_max sweep and saturation** — **VERIFIED (Thermalizers §IV D).**
  "We sweep the cap from J_max = 10 down to J_max = 0.3, where the
  coupling cap badly clips the conditional logits." "For each compiled
  chain, the layer-wise error saturates within t ≈ 3 sweeps and stays
  flat thereafter, instead of growing linearly in depth as the naive
  budget of (G6) would allow." At J_max = 10: "per-site expectations of
  the compiled chain tracking ideal Gibbs (mean single-site error
  ≈ 5 × 10⁻³) and relaxing onto the exact stationary values within
  roughly three sweeps."

- **Gaussian circuits (Part 3 anchor)** — **VERIFIED (Thermalizers
  §IV E, Appendix K).** Three-layer hierarchy, Eq (44): c ∼ N(0, Q_c⁻¹),
  m | c ∼ N(A_cm c, P_m⁻¹), f | m ∼ N(A_mf m, P_f⁻¹), with c ∈ R¹⁶
  (4×4), m ∈ R⁶⁴ (8×8), f ∈ R²⁵⁶ (16×16), upsampling by bilinear
  interpolation operators. Precisions (Eq 45): Q_c = 0.8(Δ₄ + 0.50²I),
  P_m = 2.6(Δ₈ + 1.4²I), P_f = 6.5(Δ₁₆ + 1.8²I), Δ_L the graph Laplacian.
  **Matérn confirmed:** "A precision of this form, Δ_L + κ²I, is the
  Gaussian-Markov discretization of a Matérn field in its
  stochastic-partial-differential-equation representation, so the
  compiled THM encodes a genuine Gaussian-process prior rather than an
  ad-hoc lattice model." Posterior (Eq 49): Λ_post = Λ₀ + σ⁻²H_zᵀH_z,
  μ_post = σ⁻²Λ_post⁻¹H_zᵀy. Compilation error is exactly zero: "the
  per-factor compilation error ε_ℓ of Sec. III A is exactly zero."
  Fixed-point registers: "we discretize each real-valued variable of the
  process and encode it in a group of spins… each logical spin is
  carried by a chain of strongly coupled p-bits" (minor embedding);
  Appendix K uses u_i = u⁰_i + δ Σ_k 2^k x_ik.
  Design loop: "120 warm-up and 300 measured sweeps across 12 Gibbs
  chains," 30-measurement loops on 24 hidden fields, acquisition =
  largest posterior variance (uncertainty sampling).
  RMSE verbatim: "falls to **0.259 ± 0.005** for the compiled THM and
  **0.260 ± 0.006** for the exact loop, versus **0.305 ± 0.008** for
  random placement." Weaker agreement on individual picks: top-1 match
  35%, top-3 match 63% — "on a near-flat variance map the argmax is a tie
  decided by Monte Carlo noise, and the matched RMSE curves show that
  those ties cost nothing." **This nuance was absent from the ledger and
  belongs in prose that cites the RMSE match.**
  **Scale ceiling VERIFIED verbatim:** "The eight-bit embedding runs to
  roughly **14,000 p-bits**, so a **250,000-p-bit Z1 array reaches a fine
  grid near 32 × 32 to 48 × 48**." Fig 15 shows one logical spin carried
  by a chain of 18 p-bits.

- **Fig 1 three-level stack** — **VERIFIED (Thermalizers Fig 1
  caption).** "(top) At the highest level of abstraction, the stochastic
  program is a directed factor graph of Markov kernels, or equivalently a
  parametrized stochastic circuit, passing wire variables z_ℓ from the
  program's inputs to its output. (middle) Each factor of the DFG is
  compiled to a thermodynamic kernel… (bottom) The compiled kernel is
  laid out spatially on a region of the thermodynamic hardware, a
  **Thermodynamic Sampling Unit (TSU)**, whose physical dynamics samples
  it natively." The TSU name was not in the ledger; the §8 stack figure
  can use it.

---

## Summary

**Checkbox lines: 11 of 11 resolved** — 11 VERIFIED with pointers, of
which 3 carry an embedded correction (node count: the precise 269,568 is
NOT FOUND; energy/rate: §II B estimate vs Appendix B measurement;
meta-EBM: "fully-connected" misdescribes the target).

**Third-pull claims: 24 of 24 resolved** — 21 VERIFIED, 3 DISCREPANCY.

**Inaccessible: 1** — the `extropic-ai/thermalizers` repository (paper
reference [80]) returns HTTP 404. Every paper claim was reachable; no
claim below is marked on abstract-only evidence.

### Every DISCREPANCY, verbatim — these change article prose

1. **PAsymSwap is not a Torx-paper gate.** The ledger listed "PAsymSwap
   is the biased-walk gate" under *Torx internals*. The string does not
   occur anywhere in arXiv:2608.01612, including its gate appendix
   (which lists PReset, PCNOT, PSWAP, PJUMP, PDEMUX, PCopy, PditShift,
   PditSWAP). Torx's own §V.1 walk is **unbiased** graph diffusion:
   "the graph Laplacian decomposes into one generator per edge, and each
   factor is a single PSWAP gate." PAsymSwap appears only in
   Thermalizers §IV A: "This is the asymmetric stochastic swap gate
   PAsymSwap in the torx library [10]." **Prose fix:** attribute the
   biased walk and PAsymSwap to Thermalizers §IV A, never to Torx.

2. **Per-iteration energy: the papers give two numbers, not one.**
   Thermalizers §II B: "each Gibbs iteration is estimated to cost
   approximately 3 × 10⁻¹⁰ J, and the chip will perform between 10⁶ and
   10⁷ Gibbs iterations per second." Appendix B Table IV supersedes with
   a SPICE-based measurement: "Esamp/KN: sampling, per pBIT node per
   Gibbs cycle at 50 MHz … = 7.09 fJ" — ≈1.8 × 10⁻⁹ J across ~250,000
   nodes, roughly 6× the §II B figure, and Appendix B states its own
   refinement is "higher by a factor of 9.8" than the earlier coarse
   projection. Appendix B also cites **50 MHz** Gibbs update speed, above
   the §II B rate range. **Prose fix:** never present 3 × 10⁻¹⁰ J as a
   measured per-iteration energy; either say "estimated at ~3 × 10⁻¹⁰ J
   per iteration (§II B)" or quote the 7.09 fJ per node per cycle from
   Appendix B, and never derive one from the other silently.

3. **Meta-EBM target is sparse, not "12-spin fully-connected."** The
   ledger said "experiment d=12, 18 pairwise + 20 three-body." The
   d = 12 and the counts are right; "fully connected" is not a property
   of the target (18 of 66 possible pairs). It describes the compilation:
   "the kernels are compiled over a fully connected spin set with only
   the imposed dynamic-range constraint, so J_max is the single tunable
   knob of the comparison, and every deviation from ideal behavior is
   attributable to the cap." The paper explicitly excludes topology:
   "The connectivity residual would also contribute but is not simulated
   here." **Prose fix:** the F15b figure and its caption must not imply
   the measured error floor includes the Z1 connectivity penalty.

### Two softenings (not full discrepancies, but binding on prose)

- **SGNN Max-Cut.** Torx §V.3 claims the optimum only "in the majority of
  runs," not deterministically. Do not write that the SGNN solves the
  8-site Max-Cut.
- **Gaussian-circuit acquisition agreement.** The RMSE match
  (0.259 vs 0.260) is strong, but per-pick agreement is not: top-1 35%,
  top-3 63%. Cite both or neither.

### One in-paper inconsistency, recorded not resolved

- The depth-independent error floor is cited as **Eq (G9)** in
  Thermalizers §III A and in the Fig 12b caption, but as **Eq (G10)** in
  §IV D. Cite it as **Eq (43)**, the numbered display in §IV D, which is
  unambiguous: δ̃_t ≤ ε̄/(1 − ρ₀).
