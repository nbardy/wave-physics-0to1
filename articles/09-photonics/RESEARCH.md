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

- **VERIFIED — the claim is real but narrow.** A programmed
  interferometer mesh performs an entire N×N matrix–vector multiply in
  the time light takes to transit the chip: ~15 ps (mm-scale chip) to
  ~3 ns (Lightmatter's 128×128 core), *independent of N* for a given
  geometry (~1 ps/mm of path). The interference itself is the
  multiply-accumulate. Sources: s41377-024-01404-6 (15 ps);
  Hua et al., Nature 640:361 (3 ns/cycle); scout-1 §1.
- **VERIFIED — "speed of light" is NOT why.** McMahon calls that framing
  "neat, plausible, and wrong": optical signal velocity in silicon
  (~0.4c) vs electrical in wires (~0.2–0.43c) differ by ≲5×. The
  advantage is *doing all N² MACs in one pass*, not faster signals.
- **The four costs that bound the claim (all VERIFIED):**
  1. **Area O(N²)** — Reck/Clements meshes need N(N−1)/2 MZIs; ~10⁴ μm²
     and ~10 mW thermal tuning per MZI. Largest demos: 64×64 and
     Lightmatter's quad-core 128×128.
  2. **Loss with depth** — ~0.23–0.3 dB/layer best-case; ≈13 dB at
     16×16; analog error caps naive cascades around ~10 layers
     (SLiM-style layer reuse pushes past 200).
  3. **Weight loading is slow** — thermal phase shifters kHz–ms while
     activation modulators run at GHz. Photonics is therefore
     **weight-stationary**: load the matrix once, stream data through.
     Great for fixed inference, structurally bad for training.
  4. **The conversion tax** — DAC → modulator at the input,
     photodetector → ADC at the output; conversion + memory traffic can
     exceed the optical compute energy by ~10×. This, not the optics,
     sets the energy floor. (arXiv:2308.01719; s41467-026-69084-x.)
- **VERIFIED — the litmus test:** McMahon's crossover condition — the
  optical advantage pays off only at large problem sizes, **N ≳ 10⁴**.
  Any headline number in prose should be run against this.
- **Effective precision: 4–8 bits** typical, ~9-bit record (dithered
  microrings); shot-noise error floor ~0.2% above ~2 photons/MAC
  (Nahmias 2020 IEEE JSTQE; s41467-021-27774-8). VERIFIED.
- **The free O(1) grandparent:** a lens computes a 2-D Fourier transform
  in its back focal plane; the 4f correlator (Vander Lugt 1964) computes
  filtered convolution entirely in glass. Goodman, *Introduction to
  Fourier Optics*. VERIFIED, and the strongest teaching hook found.

**One-sentence version for prose:** photonic matmul is O(1) in *latency*
and O(N²) in *everything else* — silicon, loss, loading time — and the
energy bill is paid at the electrical edges, not in the light.

---

## PRIORITY-CLAIM VERDICTS (verification pass, 2026-08-26)

1. **Shen et al. 2017 (Nat. Photon. 11:441) — CORRECTED.** 56 MZIs +
   213 phase shifters, Reck mesh implementing a **4×4 unitary**; network
   is 4 layers × 4 neurons (the 4×4 optical unit cascaded, nonlinearity
   applied electronically). Task: 4-class vowel recognition; **76.7%
   experimental vs 91.7% simulated** accuracy — the gap IS the
   phase/detection-noise story. arXiv:1610.02365. (Scout-3's "56×4
   matrix" was garbled.)
2. **Lightmatter Nature 2025 — CORRECTED + split in two.** TWO companion
   papers in Nature 640 (April 2025): **Hua et al., 361–367** (hardware:
   >16k components, quad-core 128×128, 1 GHz, 3 ns/cycle; open-access
   mirror PMC11981923) and **Ahmed et al., 368–374** (systems:
   ResNet/BERT/Atari). The precision claim is **Adaptive Block Floating
   Point achieving <1% task-accuracy loss vs FP32** — near-FP32
   *accuracy*, NOT 32-bit hardware precision. Never write the latter.
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
7. **Taichi (Xue et al. 2024) — VERIFIED with a gap.** Science
   384:202–209; claims 160 TOPS/W and "over 13.96M neurons," 91.89% on
   1623-category Omniglot. OWED: full-text read to determine whether
   13.96M counts physical or time-multiplexed virtual neurons before
   the number appears in prose.
8. **Hamerly/Luan single-shot processor (arXiv:2503.24356) — VERIFIED
   with internal-consistency caveat.** 20 aJ/MAC, 96.4% accuracy,
   292,616 weights confirmed; but the paper mixes DEMONSTRATED (4×4
   fiber array, ENOB 6.6, 96 ms/1,000 MNIST) and PROJECTED (30×30,
   1,140 ns/1,000 images) configurations. Do not quote "6-bit,
   128 GS/s, 6 ns" as one demonstrated result without the full read.
9. **McMahon 2023 framing — VERIFIED** (see O(1) section above; the
   "neat, plausible, and wrong" quote is recoverable from the preprint).
10. **4f/lens-FT + Silva et al. 2014 — VERIFIED.** Silva, Monticone,
    Castaldi, Galdi, Alù, Engheta, "Performing Mathematical Operations
    with Metamaterials," Science 343(6167):160–163 (2014) — the
    "machine a block of plastic, solve an equation" result is real.
11. **Feldmann 2021 / Xu 2021 — VERIFIED, one URL fix.** Feldmann,
    Nature 589:52 (microcomb + PCM tensor core; has a published
    correction, s41586-021-03216-9). Xu, Nature 589:44 (11 TOPS
    convolver); correct URL is **s41586-020-03063-0** (scout-3's
    03101-2 link is wrong).
12. **NTT CIM — VERIFIED + controversy found.** Inagaki et al., Science
    354:603 (2016): 2,048 time-multiplexed DOPOs, 2000-node max-cut in
    <10⁻⁴ s. Distinct from the later 100,000-spin CIM (NTT press,
    2021) — never conflate. **The rebuttal that must appear in any CIM
    prose:** Tiunov et al., arXiv:1901.08927 (2019) — a classical GPU
    simulation of the CIM's own equations beats the physical device in
    quality and speed. Survey of the critique landscape:
    arXiv:2507.14489, "CIMs: The Good, The Bad, The Ugly" (2025). This
    is the photonic twin of the p-bit series' "don't oversell the
    physics" instinct.

---

## CONTRADICTION RESOLVED — the Lightmatter pivot

Scout-2 said "not pivoting"; scout-4's economics said the opposite.
**Scout-4 wins.** Lightmatter kept *publishing* compute research (the
two Nature 640 papers) but commercially: Envise/Idiom are out of the
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
   (Shen 2017 → Feldmann/Xu 2021 → Pai 2023 → Taichi 2024 → Lightmatter
   Nature 640 ×2, 2025), but every structural critique stands:
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

## GAPS — owed before this ledger closes and prose opens

1. **Full read: Hamerly/Luan arXiv:2503.24356** — separate demonstrated
   vs projected configurations before quoting any number.
2. **Full read: Taichi (Science 384:202)** — physical vs time-multiplexed
   neuron count behind "13.96M."
3. **Full read: McMahon 2023 (arXiv:2308.00088)** — the article's
   central section should be written against the full paper, not
   search-recovered fragments.
4. **Full read: Hua et al. Nature 640:361 via PMC11981923** (open
   mirror) + best-available access to Ahmed et al. 640:368.
5. **Full read: Tiunov arXiv:1901.08927 + survey arXiv:2507.14489** if
   the CIM cautionary beat is used.
6. All company financials (Lightelligence revenue/loss, Q.ANT claims,
   Neurophos totals, Celestial earnout) are PRESS-level throughout —
   fine for context paragraphs, never for numbers stated as audited
   fact.
