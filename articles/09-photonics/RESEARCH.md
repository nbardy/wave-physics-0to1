# RESEARCH — photonic computing, claims ledger (series seed)

Built 2026-08-26 by a five-scout (haiku) web sweep + one sonnet
verification pass over the twelve highest-stakes claims. Raw scout notes
live in `research/photonics/scout-1..5-*.md` (repo root) — those files are
the unfiltered record
and contain known garbles; **this ledger overrides them wherever they
disagree.** Statuses: VERIFIED (checked against primary or 2+ independent
quality sources), CORRECTED (scout claim was wrong; correct fact given),
PRESS (convergent trade-press only, not filing/paper-verified),
UNVERIFIED (no source found), CONTRADICTED.

**Ledger state: OPEN.** The twelve priority claims below are settled at
sweep level, but five full-paper reads are still owed (see GAPS) before
this ledger can close and gate prose — same process as the p-bit series,
where RESEARCH.md closed only after the opus full-read pass.

---

## THE O(1) CLAIM — the canonical careful statement

This is the hook that started the series idea, so it gets the fullest
treatment. Anchor source: McMahon, "The physics of optical computing,"
Nature Reviews Physics 5:717–734 (2023); preprint arXiv:2308.00088.

- **CORRECTED by full-read pass 1 — real but narrower than first
  written.** One transit of a programmed mesh performs all N² MACs at
  once, but transit LATENCY is honestly **O(N) with a picosecond
  constant**, not N-independent: "latency in photonic circuits is only
  limited by the optical path length, which scales linearly with matrix
  size … the growth factor of optical MAC latency is only several
  picoseconds … close to one-thousandth of TPUs" (Hua et al., §"Optical
  MAC for heuristic recurrent algorithm"; a Clements mesh is 2N−1
  layers deep). The genuinely N-independent-latency optical computer is
  the LENS/4f system (fixed path regardless of pixel count). Timing
  anchors: **5 ns per full loop cycle demonstrated, 3 ns projected**
  ("a latency of 3 ns could be realized in future devices") on
  Lightelligence's 64×64 PACE — the cycle includes the electronics,
  optical transit is never isolated; NEVER write 3 ns as demonstrated.
  ~15 ps (s41377-024-01404-6) still UNVERIFIED — full read owed before
  it anchors any hook. "The interference is the multiply-accumulate"
  holds for COHERENT MZI meshes (Shen 2017, Lightmatter) but NOT for
  PACE, which is an incoherent intensity-modulation + photocurrent
  architecture — never cite Hua under an interference sentence.
- **VERIFIED + SHARPENED — "speed of light" is NOT why.** McMahon §II,
  verbatim: "there is an explanation for optical computing's potential
  advantage that is neat, plausible, and wrong: the fact that light
  travels fast." His numbers: vacuum c; silicon-photonic waveguide
  ~0.4c; PCB trace ~0.43c; CMOS wires ~0.2c — the 5× is vacuum-vs-CMOS,
  and **light in a silicon waveguide is SLOWER than a signal on a PCB
  trace**. "More useful to think of ['computing at the speed of light']
  as a goal for an optical computer, rather than a cause of advantage."
  The advantage is *doing all N² MACs in one pass*, not faster signals.
- **The four costs that bound the claim (statuses per full-read pass 1):**
  1. **Area O(N²)** — N(N−1)/2 MZIs is standard mesh math but **NOT in
     McMahon**; the ~10⁴ μm²/MZI and ~10 mW/MZI figures need their own
     sources before prose (currently scout-level only). What McMahon
     DOES give (§III "Scale"): a 64×64 commercial mesh does **>100×
     fewer parallel ops than needed to compete on throughput**; targets
     are 1000×1000 (parity with one electronic chip) and 10⁴×10⁴
     (advantage). Largest demos: Lightelligence 64×64 (Hua), Lightmatter
     quad-core 128×128 (Ahmed).
  2. **Loss with depth** — 0.23–0.3 dB/layer, ≈13 dB @16×16, ~10-layer
     cascade cap: **NOT in McMahon; own sources owed.** McMahon fn 4
     even cites simulations of 60 optically executed layers matching
     8-bit digital (needing experimental validation) — friendlier to
     depth than our line. Keep only with independent sourcing.
  3. **Weight loading is slow — VERIFIED, now with a measured number:**
     PACE runs vector modulators at 1 GHz and weight modulators at
     **10 MHz by design** — a 100× asymmetry on one chip (Hua §"System
     and implementation"). McMahon confirms the weight-stationary
     doctrine for inference. Structurally bad for training.
  4. **The conversion tax — VERIFIED in kind, magnitude CORRECTED
     upward:** in an analysis of optical neural networks running large
     Transformers, **optical energy is <1% of total system energy**
     (McMahon §III "Energy costs," citing Anderson et al., "Optical
     Transformers," arXiv:2302.10360 — the correct source; the old
     "~10×"/arXiv:2308.01719 line conflated a speedup ratio with an
     energy ratio). The edges, not the light, are the energy story.
     **Cross-architecture confirmation (pass 2):** the measurement-
     feedback CIM spends 10.45 W of its 15.69 W on transceivers +
     DAC/ADC while an all-digital rival solves the same problems on
     4.09 W total (arXiv:2507.14489 §V) — the same law arrived at in
     an unrelated architecture; a structural spine fact for the whole
     series.
- **CORRECTED — the litmus test applies to throughput/energy ONLY:**
  McMahon §III Strategy 1: N > 10⁴ is the crossover for a "throughput
  or energy-efficiency advantage" (I/O costs O(N), compute O(N²), so
  big matrices amortize the edges; corroborated by Anderson et al.).
  **Latency is explicitly exempt** (fn 60): a processor big enough to
  hold the problem "is big enough and won't necessarily benefit from
  larger scale (from the perspective of latency)." Never run a latency
  claim against this threshold.
- **Effective precision: 4–8 bits** typical, ~9-bit record (dithered
  microrings); shot-noise error floor ~0.2% above ~2 photons/MAC
  (Nahmias 2020 IEEE JSTQE; s41467-021-27774-8). VERIFIED.
- **The free O(1) grandparent:** a lens computes a 2-D Fourier transform
  in its back focal plane; the 4f correlator (Vander Lugt 1964) computes
  filtered convolution entirely in glass. Goodman, *Introduction to
  Fourier Optics*. VERIFIED, and the strongest teaching hook found.

**One-sentence version for prose (rev. 2, post full-read):** photonic
matmul buys *latency* — a whole matrix–vector product per pass, the pass
growing by picoseconds per row where a systolic array grows a
thousandfold faster — and pays for it in silicon area, optical loss, and
weight-loading time, with the energy bill settled at the electrical
edges: in a Transformer-scale analysis the light itself is under 1% of
the total.

---

## PRIORITY-CLAIM VERDICTS (verification pass, 2026-08-26)

1. **Shen et al. 2017 (Nat. Photon. 11:441) — CORRECTED.** 56 MZIs +
   213 phase shifters, Reck mesh implementing a **4×4 unitary**; network
   is 4 layers × 4 neurons (the 4×4 optical unit cascaded, nonlinearity
   applied electronically). Task: 4-class vowel recognition; **76.7%
   experimental vs 91.7% simulated** accuracy — the gap IS the
   phase/detection-noise story. arXiv:1610.02365. (Scout-3's "56×4
   matrix" was garbled.)
2. **Nature 640 pair — RE-CORRECTED by full-read pass 1: they are TWO
   COMPANIES.** **Hua et al., 640:361–367 = LIGHTELLIGENCE** (the PACE
   system; every affiliation is Lightelligence, corresponding author
   Yichen Shen): 64×64 incoherent intensity-modulation architecture
   (NOT an MZI interference mesh), >16k components, 1 GHz data / 10 MHz
   weights, 7.61 ENOB average, 8.19 TOPS at 2.38–4.21 TOPS/W, 5 ns
   demonstrated / 3 ns projected per loop, Ising max-cut workloads only
   — no neural networks. Full text read via PMC11981923.
   **Ahmed et al., 640:368–374 = LIGHTMATTER** (quad-core 128×128 MZI
   cores, 12-nm CMOS control, 65.5 TOPS at 78 W + 1.6 W ≈ 0.8 TOPS/W;
   ResNet/BERT/Atari): **PAYWALLED, no preprint, no mirror** — per-model
   accuracy digits may NOT appear in prose; write the beat qualitatively
   ("near-electronic precision for many workloads," the abstract's own
   hedged wording). The **<1%-vs-FP32** figure is from the 2022 ABFP
   simulation paper (arXiv:2205.06287), where it holds for 4 of 6
   MLPerf models at tile width 128 (6 of 6 only at width 8) — never
   attribute it to the 2025 chip, and never write "near-32-bit
   precision." ABFP mechanism (read in full): per-vector max-abs scales
   in bfloat16, fixed-point analog core, float32 cross-tile
   accumulation, plus an analog gain trick recovering low bits because
   "the distribution of the output of a dot product in a DNN tends to
   not reach the first few most-significant bits."
   Side effect: the PACE fact strengthens claim 5 (Lightelligence IPO'd
   with a Nature hardware paper in hand) and softens "Lightmatter is
   the marquee pivot" slightly (one of the two compute papers was never
   theirs).
3. **Celestial AI → Marvell — VERIFIED, dated.** Announced ~Dec 2 2025,
   closed Feb 2 2026; $1B cash + $2.25B stock, earnout to $5.5B on
   revenue milestones. (investor.marvell.com release 1005; CNBC.)
4. **"AMD acquired Luminous" — CONTRADICTED.** Luminous Computing wound
   down its photonics effort in **May 2023**. Ex-Luminous/Elenion
   engineers founded **Enosemi** (2023, ~16 people), which **AMD
   acquired May 2025** as a CPO acquihire. Scout-2's entry conflated
   three companies. (datacenterdynamics; amd.com blog; techcrunch.)
5. **Lightelligence HKEX IPO — VERIFIED / PRESS numbers.** Ticker
   1879.HK, listed April 28 2026, first pure-play photonic-AI public
   company. HK$183.20 IPO price, ≈US$306–323M raised, first-day close
   ≈HK$886 (+383–384%), market cap ≈HK$81.5B, retail ~5,785×
   oversubscribed. All figures convergent press, NOT prospectus-checked
   — flag as PRESS in prose or omit exact numbers.
6. **Pai et al. 2023 — VERIFIED.** Science 380(6643):398–404, April 28
   2023; on-chip photonic gradient measurement (grating taps +
   bidirectional propagation) — in-situ backprop physically realized.
7. **Taichi — CORRECTED (pass 2): it is XU et al., not Xue.** Xu,
   Zhihao, et al., Science 384:202–209 (2024), DOI
   10.1126/science.adl1203. ("Xue et al. 2024" is the same lab's OTHER
   paper — fully-forward-mode training, Nature 632:280, open at
   PMC11306102.) 160 TOPS/W (precisely 160.82) and 91.89% on
   1,623-category Omniglot CONFIRMED. **The neuron question is
   ANSWERED at ESTIMATE level:** 13.96M is **network scale achieved by
   cascading/distributing chiplets — NOT physical on-chip neurons**
   (one execution unit ≈ 4,256 neurons, ~3.8% reconfigurable;
   triangulated from Adv. Photonics 6:040502 commentary + two
   independent reviews; primary + SM still paywalled). Safe prose: "a
   13.96-million-neuron network run across cascaded photonic
   chiplets"; never "a chip with 13.96 million neurons"; never print
   the 4,256 decomposition (reconstruction, not stated anywhere).
   160 TOPS/W is an **on-chip** figure — Lu Fang's own caveat (IEEE
   Spectrum): the laser and coupling apparatus "take up almost a whole
   table"; exact inclusion list unverified.
8. **Hamerly/Luan single-shot processor (arXiv:2503.24356) — VERIFIED
   with internal-consistency caveat.** 20 aJ/MAC, 96.4% accuracy,
   292,616 weights confirmed; but the paper mixes DEMONSTRATED (4×4
   fiber array, ENOB 6.6, 96 ms/1,000 MNIST) and PROJECTED (30×30,
   1,140 ns/1,000 images) configurations. Do not quote "6-bit,
   128 GS/s, 6 ns" as one demonstrated result without the full read.
9. **McMahon 2023 framing — CLOSED (full read, 2026-08-26).** Verbatim
   quotes recovered and integrated into the O(1) section. His list is
   structurally 12 bullets: 11 features + "The speed of light is fast"
   as the closing anti-feature; his "big three" are bandwidth, spatial
   parallelism, nearly dissipationless dynamics. Additional binding
   findings: latency/throughput/energy are three separate metrics
   ((1/latency) ≠ throughput — the assembly-line footnote); accuracy is
   explicitly NOT a metric optics can win; "even matrix-vector
   multiplication, with its O(N²) complexity, does not have a high
   enough ratio of computation to input data" (matmul is his WEAK case,
   not his flagship); general-purpose optical computing "out of reach";
   drop-in accelerator premise rejected (Strategy 2: "don't try to
   directly take on digital electronic processors at their own game");
   his near-term favorite is FREE-SPACE matrix-vector multiplication at
   N≈10⁴, not integrated meshes; niches he backs: optically-native
   inputs, all-optical signal processing inside comms, combinatorial
   optimization, privacy. Bonus teachable: modern CPUs can switch only
   ~3% of transistors per clock (thermal limit) — the strongest
   pro-optics number in the paper. Full extracted text at scratchpad
   `mcmahon.txt` (see FULL-READ PASS 1 note below).
10. **4f/lens-FT + Silva et al. 2014 — VERIFIED.** Silva, Monticone,
    Castaldi, Galdi, Alù, Engheta, "Performing Mathematical Operations
    with Metamaterials," Science 343(6167):160–163 (2014) — the
    "machine a block of plastic, solve an equation" result is real.
11. **Feldmann 2021 / Xu 2021 — VERIFIED, one URL fix.** Feldmann,
    Nature 589:52 (microcomb + PCM tensor core; has a published
    correction, s41586-021-03216-9). Xu, Nature 589:44 (11 TOPS
    convolver); correct URL is **s41586-020-03063-0** (scout-3's
    03101-2 link is wrong).
12. **NTT CIM — RE-CORRECTED by full-read pass 2 (one hard error
    fixed).** Inagaki et al., Science 354:603 (2016): 2,048
    time-multiplexed DOPOs in a 1-km fiber ring, 1 GHz pulse rate,
    5 µs round trip; the 2000-node max-cut took **5.0 ms** (1,000
    round trips) — the ledger's earlier "<10⁻⁴ s" was WRONG by ~50×
    (triple-sourced: Hamerly arXiv:1805.05217 with Inagaki/Takesue as
    co-authors; Tiunov; King). Timing caveats disclosed by the CIM's
    own authors: excludes data transfer to/from the machine; success
    probabilities post-selected for phase stability (~5×/≤10× boost).
    Inagaki primary is PAYWALLED with no preprint — the SA-speedup
    factors (50×/29.6×/12.1×) rest on an NTT company page, CLAIM-level,
    never audited fact. Distinct from the 100,000-spin CIM (Honjo,
    Sci. Adv. 2021) — never conflate.
    **The rebuttal, correctly sized — TWO independent groups:**
    (a) **King et al. (D-Wave), arXiv:1806.08422, June 2018** — plain
    noisy mean-field annealing on a GTX 1080 Ti matched or beat the
    CIM's cuts on Inagaki's own three instances (K2000 mean 32,730 vs
    32,457), ~20× faster per parallelism-adjusted run (12.3 µs vs
    250 µs). (b) **Tiunov et al., arXiv:1901.08927 (2019), SimCIM** —
    simulating the CIM's equations (minus nonlinear loss, saturation
    clamped) on a GTX 1080: better quality on all three graphs, speed
    honestly **"comparable"** (their Results wording; 4 ms amortized
    across 100 parallel runs vs 5 ms — single-run wall-clock 400 ms).
    NEVER write "beats it in quality and speed"; quality yes, speed
    comparable. BLS still beats SimCIM on quality; Leleu's chaotic
    amplitude control beats BLS — the classical pile has a top and
    SimCIM is not it.
    **The mechanism line (best teaching fact in the file):** the
    matrix–vector multiply is DIGITAL in both machines — FPGA in the
    CIM, GPU in the simulator; 2,808 of the cavity's 5,056 pulse slots
    exist solely to stall while the FPGA computes, and the 1 ns FPGA
    deadline forces couplings to J ∈ {0, ±1} — the hardware is less
    expressive than its own simulator. The optics stores spins and
    adds noise; it never multiplies.
    **arXiv:2507.14489 recharacterized:** NOT a critique survey — an
    original benchmarking+theory paper by CIM-adjacent authors (NSF
    CIM Expeditions-funded; 1QBit/IQC/Perimeter) that does not cite
    Tiunov at all and reaches a compatible verdict independently via
    energy accounting: MF-CIM spends 10.45 W of its 15.69 W on
    transceivers+DAC+ADC while an all-digital solver does the whole
    job on 4.09 W; the surviving pro-optics claim is the fully-optical
    DL-CIM's ~100× time-to-solution edge — a PREFACTOR, not scaling,
    ESTIMATED not measured, at N = 20–70, on a machine that does not
    exist at scale. Their reframe: the CIM is an approximate
    overdamped-Langevin integrator whose real niche may be
    continuous-variable optimization. "More optics, not less" is the
    field's own critics' conclusion.
    **McMahon 2023 anchor stands** (pass 1): simulating the equations
    digitally "can yield the same behavior as a physical, optical
    implementation" (§III).
    **Bridge reinforced:** SimCIM has been used as a Boltzmann sampler
    to train Boltzmann machines (Ulanov et al. 2019) — the photonic-
    Ising ↔ p-bit link is literal, same sampling job.
    **Owed:** verify Tiunov's Results-section "comparable" survived
    into the published Opt. Express version (the abstract overclaims;
    the Results walk it back — this tension is load-bearing); read
    Leleu, Commun. Phys. 4:266 (2021), the CIM camp's strongest live
    counter, before the rebuttal beat ships.

---

## CONTRADICTION RESOLVED — the Lightmatter pivot

Scout-2 said "not pivoting"; scout-4's economics said the opposite.
**Scout-4 wins.** Lightmatter kept *publishing* compute research (Ahmed
et al., Nature 640:368 — the OTHER Nature 640 paper is Lightelligence's,
per claim 2) but commercially: Envise/Idiom are out of the
public product listing, no customer deployments of the compute chips
reported as of May 2026, and the go-to-market is the **Passage**
interconnect line (M1000/L200, NVLink Fusion ecosystem). Sources: IEEE
Spectrum (optical-interposers), Contrary Research report, HPCwire Dec
2025. **For prose: Lightmatter is not the exception to the
compute→interconnect pivot — it is the marquee example**, publishing
Nature compute papers with one hand while selling interconnect with the
other.

---

## THE TWO-STORY STRUCTURE (consolidated picture)

The field in 2026 is two diverged stories, and conflating them is the
biggest correctness risk for this series:

1. **Photonic COMPUTE** — Nature-grade demos advancing on a real arc
   (Shen 2017 → Feldmann/Xu 2021 → Pai 2023 → Taichi 2024 → the Nature
   640 pair 2025: Lightelligence PACE + Lightmatter quad-core), but
   every structural critique stands:
   conversion tax, 4–8 effective bits, weight-stationary-only, O(N²)
   area/loss, and the leading player pivoted its business away from it.
   Active compute companies: Lightelligence (PACE2), Q.ANT (NPU2,
   shipping claim early 2026, 30×-energy claims = PRESS), Lumai
   (free-space 2048×2048, LLM-prefill target), Neurophos ($118M,
   metamaterial modulators), Akhetonics (all-optical DIGITAL contrarian
   bet), Microsoft AIM + NTT CIM (optimization research programs).
2. **Photonic INTERCONNECT** — the shipping, revenue-real business,
   driven by the copper wall (~1 m reach at 224 Gbps/lane; ~30% of
   cluster energy in data movement). Broadcom Tomahawk 6 "Davisson"
   CPO shipping; NVIDIA Quantum-X/Spectrum-X Photonics 2026; Ayar Labs
   TeraPHY/UCIe; Celestial→Marvell $3.25B; Salience and iPronics
   pivoted to switches; Lightmatter Passage. This is where the M&A and
   the IPO actually happened.

**Series-bridge fact (verified):** photonic Ising machines and p-bit
networks are the same Boltzmann-sampling story with different noise
sources (quantum noise in DOPOs vs thermal noise in MTJs) — explicit
literature bridge at s42005-025-01953-1 (photonic p-bits) and
s41928-024-01182-4 (sparse Ising machines training Boltzmann nets).
And both fields carry a classical-rebuttal cautionary tale (Tiunov for
CIM; the p-bit series' own scrubs) — the skeptical voice ports over.

---

## STORY-SPINE CANDIDATES (NOT decisions — hero choice is Nick's,
per the novel-hero checkpoint rule)

A. **"The matrix multiply made of interference"** — MZI mesh origin
   story (Shen 2017's concrete 76.7%-vs-91.7% gap as the honesty hook)
   → Reck/Clements → the O(1)-latency-but-O(N²)-everything turn →
   conversion tax → the interconnect pivot as the reality ending.
B. **"The lens was always a computer"** — 4f/Fourier optics as the
   genuinely-O(1) ancestor → D2NN (learning frozen into geometry;
   in-browser trainable, echoing the p-bit finale) → metamaterial
   calculus (Silva 2014) → why nonlinearity breaks the all-optical
   dream.
C. **"Waves that anneal"** — photonic Ising machines as the direct
   p-bit sequel (same Hamiltonian, different noise) → CIM mechanism →
   Tiunov rebuttal as the featured skeptical beat.
D. Some braid of A+B (mechanism series) with C as a bridge article.

Simulation-potential ranking from scout-5 (for figure planning): lens-FT
4f (highest; masks swappable live), D2NN (angular-spectrum sim,
trainable in-browser), metamaterial equation-solver, coupled-DOPO Ising,
reservoir computing (incl. a WATER-WAVE reservoir paper,
arXiv:2306.09095 — striking fit for a wave-physics site).

---

## FULL-READ PASS 1 (2026-08-26) — McMahon + Nature 640 pair

Opus researcher, full reads: McMahon complete (ar5iv, all 61 footnotes);
Hua et al. complete (PMC main text; Supplementary Notes A–D unread —
read Note D before leaning on the PACE-vs-A10 GPU comparison as a
result); Ahmed et al. ABSTRACT ONLY (paywalled, no preprint/mirror) —
its ABFP mechanism read from the primary preprint arXiv:2205.06287.
Corrections integrated above (O(1) section, claims 2/9/12). Full
extracted texts banked in **`research/photonics/extracts/`** (all 15
files from both passes: mcmahon, hua, abfp, ot2, tiunov, cim_gbu_flow,
hamerly, king, mcgeoch, taichi_comm, …) — quote from these, with the
line-number locations given in the two researcher reports.

New teachable numbers (sourced, prose-eligible):
- Light in a silicon waveguide (0.4c) is SLOWER than a signal on a PCB
  trace (0.43c) — McMahon §II.
- 1 GHz data vs 10 MHz weights on one chip, by design — Hua.
- Optical energy <1% of system total for large Transformers — McMahon
  §III citing Anderson arXiv:2302.10360; per-MAC optical energy scales
  as 1/d with Transformer width d (Anderson) — the one genuinely
  asymptotic optical advantage.
- 22-bit honest output width for 8-bit×8-bit, n=128 dot products — why
  analog needs ABFP (arXiv:2205.06287 §III-B); analog sums AFTER
  quantization, digital before (§III-A) — the one-line precision story.
- ±5 °C costs one effective bit; PACE needs 537 iterations vs GPU's 347
  (noise costs ~55% more work); laser-off control fails to converge —
  all Hua.
- Lightmatter ~0.8 TOPS/W vs Lightelligence 2.4–4.2 TOPS/W — the
  general-purpose chip is ~3× less efficient than the Ising chip.
  (Beware the arXiv:2509.01262 garble "65.5 TOPS/W" — it is 65.5 TOPS
  AT 78 W.)
- >10,000 pins, not just components, to pass 64×64 — the wall is
  packaging (Hua).
- CPUs switch only ~3% of transistors per clock (thermal) — McMahon.

## FULL-READ PASS 2 (2026-08-26) — Tiunov + CIM paper + Inagaki + Taichi

Opus researcher: Tiunov read in full (arXiv v2); arXiv:2507.14489 read
in full via pdftotext; Inagaki reconstructed at primary-equivalent level
from Hamerly arXiv:1805.05217 (Inagaki/Takesue co-authors) + King +
Tiunov cross-checks; Taichi triangulated (primary paywalled). Extracted
texts banked in **`research/photonics/extracts/`** (copied from the
session scratchpad 2026-08-26). Corrections integrated above
(claims 7, 12; cost #4). The researcher's one-paragraph "honest CIM
verdict" is preserved in its task output and is the working brief for
P3's Act III.

**POISONED-SOURCE WARNING:** the researcher's first automated fetch of
arXiv:2507.14489 returned confidently FABRICATED content (invented
tables, quotes, and a nonexistent "Tiunov et al. 2022" citation),
caught only by cross-reference. Any scout-note content about this paper
in `research/photonics/` is suspect — re-derive from the pdftotext
extraction only.

New teachable numbers (sourced, prose-eligible): 2,808 of 5,056 pulse
slots per CIM round trip idle waiting for the FPGA; 10.45 W of 15.69 W
on conversion vs a 4.09 W all-digital rival; K2000 mean cut 32,730
(GPU mean-field annealing) vs 32,457 (CIM); 12.3 µs vs 250 µs per run;
SimCIM 4 ms amortized vs CIM 5 ms ("comparable" — their word);
J ∈ {0, ±1} forced by the 1 ns FPGA deadline; DL-CIM's ~100× edge is a
prefactor at N = 20–70, estimated; post-selection boosted CIM success
~5×/≤10× (disclosed by its own authors).

## GAPS — still owed before this ledger closes and prose opens

1. **Full read: Hamerly/Luan arXiv:2503.24356** — separate demonstrated
   vs projected configurations before quoting any number.
2. ~~Taichi neuron count~~ — **ANSWERED at ESTIMATE level (pass 2);**
   primary + SM read still owed before any figure beyond the safe
   phrasing in claim 7.
3. ~~McMahon full read~~ — **DONE, claim 9 CLOSED.**
4. ~~Hua full read~~ — **DONE** (Supplementary Notes A–D unread — read
   Note D before leaning on the PACE-vs-A10 comparison as a result).
   **Ahmed et al. remains paywalled** — obtain the PDF via institutional
   access before any per-model accuracy digit appears in prose, or
   write that beat qualitatively with no digits.
5. ~~Tiunov + CIM paper~~ — **DONE, claim 12 rewritten.** Residue: (a)
   verify Tiunov's Results-section "comparable" wording in the
   published Opt. Express version — the abstract-vs-Results tension is
   load-bearing; (b) **read Leleu, Commun. Phys. 4:266 (2021)** —
   chaotic amplitude control, the CIM camp's strongest live counter —
   before P3's rebuttal beat ships, or the article argues against a
   2016 machine while the field moved.
6. All company financials (Lightelligence revenue/loss, Q.ANT claims,
   Neurophos totals, Celestial earnout) are PRESS-level throughout —
   fine for context paragraphs, never for numbers stated as audited
   fact.
7. **The four-costs device numbers** (~10⁴ μm²/MZI, ~10 mW/MZI,
   0.23–0.3 dB/layer, ≈13 dB @16×16, ~10-layer cascade cap, SLiM 200+)
   are scout-level, NOT in McMahon — each needs its own primary source
   or gets dropped from prose.
8. **The 15 ps transit figure** (s41377-024-01404-6) — full read
   before it anchors any hook; it is the only remaining support for a
   sub-nanosecond transit number, and Hua contradicts N-independence.
9. **Inagaki 2016 primary** — paywalled, no preprint (King's
   "arXiv:1607.08222" citation for it is a misprint). Hardware/timing
   figures are primary-equivalent via Hamerly; the SA-speedup factors
   are CLAIM-level (NTT company page) and stay out of prose.
