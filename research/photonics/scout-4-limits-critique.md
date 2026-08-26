# SCOUT 4 — RAW NOTES: limits & honest critique

Haiku scout output, 2026-08-26. Raw web-research notes, unconsolidated.
The case AGAINST the hype — conversion tax, precision, weight-loading,
loss scaling, economics, and the 1980s history lesson.

---

### 1. CONVERSION TAX: DAC/ADC overhead dominates energy

- Every optical accelerator crosses electrical↔optical boundaries: DAC at input, photodetector+ADC at output. The edges, not the optics, set the energy floor.
- Peripheral circuits (ADCs, DACs, sample-and-hold, sense amps) dominate area and energy in analog accelerator prototypes; ADCs are the single largest contributor.
  - "Data Conversion Bottleneck" https://arxiv.org/pdf/2308.01719
- ~(15 ± 5) fJ per conversion step at 1 GS/s; (16 ± 5) fJ at 10 GS/s
  - PCM-based DAC/ADC for photonic computing, SPIE 2025: https://ui.adsabs.harvard.edu/abs/2025SPIE13581E..0BA/abstract
- Cross-domain conversion + DRAM traffic can dominate energy by ~10× over the photonic compute itself
  - https://www.researchgate.net/publication/398471994_Boosting_Photonic_Computing_Efficiency_with_Photonic_Memory_and_Energy_Efficient_ADCDAC_design
- Mitigation: analog memory co-located with compute → 26× power savings vs SRAM-DAC architectures
  - https://www.nature.com/articles/s41467-026-69084-x
- [UNVERIFIED] Exact pJ/bit OEO conversion cost in production accelerators (startups don't disclose).

### 2. PRECISION: 4–8 effective bits

- Typical photonic NN demos: 4–8 bits effective precision.
  - Nahmias et al. 2020, "Photonic multiply-accumulate operations for neural networks," IEEE JSTQE: https://ieeexplore.ieee.org/ielaam/2944/8764697/8844098-aam.pdf
- Record: ~9-bit with dithering control on microrings https://arxiv.org/pdf/2104.01164
- PIC demo: 2 TMAC/s at 5-bit precision, ~72 fJ/MAC https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11501591/
- Noise sources: shot noise (dominant < ~2 photons/MAC; error min ~0.2% above that — "optical neural network using <1 photon per multiplication" https://www.nature.com/articles/s41467-021-27774-8), thermal crosstalk, phase drift, waveguide process variation.
- Calibration burden: per-MZI characterization incl. parasitics and crosstalk; whole-chip calibration is a real engineering cost.
  - https://arxiv.org/html/2607.09301v1 (NN-based calibration)
- [UNVERIFIED] Whether 4–8 bits suffices for modern LLM inference.

### 3. WEIGHT-LOADING: slow weights, fast activations

- Thermal phase shifters: ~ms response (slow to program); electrostatic/MEMS: 10–100 kHz; modulators for ACTIVATIONS: GHz (5–100 GHz demonstrated).
  - https://doi.org/10.3390/photonics13080783 ; https://arxiv.org/pdf/2405.08836 ; https://arxiv.org/pdf/1903.04579
- Architectural consequence: photonics favors WEIGHT-STATIONARY inference — load matrix once, stream activations at GHz. Bad fit for dynamic weights / online learning.
- The mismatch (GHz activations vs kHz–MHz weights) is the structural reason "photonic matmul" ≠ "photonic training."

### 4. AREA & LOSS SCALING

- N×N mesh: N(N−1)/2 MZIs = O(N²). https://arxiv.org/pdf/2109.05367
- Largest demos: 64×64 (>16,000 components, ~1 GHz, ~3 ns latency) https://pmc.ncbi.nlm.nih.gov/articles/PMC11501939/ ; quad-core 128×128 Lightmatter Envise, 65.5 TOPS @ 78 W https://pmc.ncbi.nlm.nih.gov/articles/PMC11981923/ + https://www.nature.com/articles/s41586-025-08786-6
- Loss accumulates with depth: total transmission ~ (1/N)·α^(N+1); 16×16 mesh ≈ 13 dB insertion loss; ~0.23–0.3 dB per layer best-case.
  - https://www.engr.colostate.edu/~mnikdast/files/papers/Mahdi_J38.pdf ; https://spj.science.org/doi/full/10.34133/icomputing.0047
- Analog error accumulation restricts conventional MZI computing to ~10 cascaded layers; SLiM-style single-layer reuse architectures push to >200 layers.
  - https://arxiv.org/pdf/2511.00186 ; https://www.nature.com/articles/s41467-025-65356-0
- Footprint ~>10,000 μm² per MZI; ~10 mW thermal tuning power per MZI — die-level integration ceiling.
  - https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11501640/

### 5. ECONOMIC CRITIQUE

- 70 years of struggle: startups repeatedly pivot "because the optical accelerator does not provide a large enough improvement in a metric that users care about."
  - https://meningan.tech/optical-computing-photonic-chips-commercial-barriers/
- System cost (lasers, packaging, calibration, control electronics) often outweighs raw efficiency gains. Blockers: precision stability, E/O conversion, yield, packaging, software ecosystem — not raw physics.
  - Yole optical computing report: https://www.yolegroup.com/product/report/optical-computing-2024/
- The CMOS gravity well: GPUs/TPUs ride decades of lithography/tools/software investment; photonics must beat the CURVE, not the point.
- Analyst view: first meaningful compute shipments ~2027–28, custom systems + NRE first; interconnect is the near-term business.
- Nanometer waveguide tolerances → low yield, high production cost today. https://www.azooptics.com/Article.aspx?ArticleID=2773

### 6. HISTORY LESSON: why the 1980s–90s wave died

- Bell Labs optical transistor / digital optical computer program promised THz bandwidths; collapsed ~1988–92.
- Failure modes: (1) cascading photon loss per gate (SNR collapse with depth), (2) no optical RAM, (3) no cheap regeneration/buffering, (4) hype backlash killed funding.
  - Ambs, "Optical Computing: A 60-Year Adventure" (2010): https://onlinelibrary.wiley.com/doi/10.1155/2010/372652
  - SPIE Photonics Focus history: https://spie.org/news/photonics-focus/marapr-2022/harnessing-light-for-photonic-computing
- Which still apply: cascading loss (yes, mitigated not solved), optical memory absence (yes), precision drift (yes), manufacturing tolerance (better, not solved), hype cycle (visibly recurring).

### 7. WHERE PHOTONICS HONESTLY WINS TODAY

**A. Interconnect (SHIPPING, real ROI):** 400 Gbps+/wavelength vs 25–100 Gbps copper lanes; 0.78–5 pJ/bit silicon photonic links; WDM multiplies per-fiber bandwidth; Intel/Broadcom/NVIDIA shipping or sampling CPO.
  - https://arxiv.org/pdf/2506.04820 ; https://newsroom.intel.com/artificial-intelligence/intel-unveils-first-integrated-optical-io-chiplet
**B. Fixed-weight inference (latency niche):** single-shot optical matmul ~10–20 ns; large single-sample latency advantages vs GPU (incl. kernel-launch overhead). Weight-stationary only.
  - https://arxiv.org/pdf/2503.24356 ; https://www.science.org/doi/10.1126/sciadv.adg7904
**C. Fourier/spectral ops:** lens-FFT conceptually O(1); few production systems; radar/imaging niches.
  - https://www.nature.com/articles/s41598-017-13733-1
**D. All-optical nonlinearity (emerging, experimental):** Kerr, stimulated Brillouin, saturable absorption activation functions demonstrated; femtojoule-scale in best cases; precision still limited.
  - https://www.nature.com/articles/s41377-025-02175-4 ; https://www.nature.com/articles/s43588-025-00866-x

### SCOUT'S SUMMARY TABLE

| Dimension | Status |
|-----------|--------|
| Conversion tax | DAC/ADC + memory traffic can be ~10× the photonic compute energy |
| Precision | 4–8 effective bits typical; 9-bit record; shot noise floor ~0.2% |
| Weight loading | ms (thermal) to μs; activations GHz — weight-stationary or bust |
| Area/loss | O(N²) MZIs; 128×128 max demo; ~13 dB @ 16×16; ~10 layers max cascade |
| Economics | must beat the CMOS curve; yield/packaging/software immature |
| 1980s echoes | loss, no optical memory, drift, hype — same physics, better tools |
| Honest wins | interconnect (shipping), fixed-weight low-latency inference, Fourier ops |
