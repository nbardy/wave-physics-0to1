# SCOUT 1 — RAW NOTES: photonic matmul & the O(1) claim

Haiku scout output, 2026-08-26. Raw web-research notes, unconsolidated.
Statuses here are the scout's own; nothing is VERIFIED for prose until the
RESEARCH.md ledger says so.

---

## RAW NOTES: PHOTONIC MATRIX MULTIPLICATION & THE O(1) CLAIM

### 1. MZI MESH MECHANISM & THE O(1) LATENCY CLAIM

**Core mechanism:**
- N×N matrix-vector multiply implemented via mesh of O(N²) Mach-Zehnder interferometers (MZIs), each performing 2×2 matrix operation
- Light propagates through mesh; phase shifters in MZI arms set weights
- Interference of light beams performs multiply-accumulate in analog optical domain
- https://www.science.org/doi/10.1126/sciadv.ads7475 (complex-valued matrix-vector multiplication, 2025)
- https://www.nature.com/articles/s41377-022-00717-8 (photonic matrix multiplication review, Light: Science & Applications)

**Latency (O(1) precisely):**
- **Constant per MAC**: light transit time ~15 ps (small chip), ~30 ps (multimode system), ~100 ps (larger 64×64 mesh) — independent of N
- NOT O(1) in area or reprogramming time
- https://www.nature.com/articles/s41377-024-01404-6 "processing delay of 15 picoseconds according to the light propagation time" (system-on-chip microwave photonic processor)
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12764859/ "optical processing latency of 30 ps" (hybrid multimode-multiwavelength processor)
- IEEE Spectrum article: "time-of-flight...about 100 picoseconds" enabling 2×10^15 operations/sec (https://spectrum.ieee.org/the-future-of-deep-learning-is-photonic)

**What O(1) does NOT mean:**
- O(N²) **hardware area**: full mesh requires N² phase shifters and beamsplitters
- O(N²) **reprogramming time**: all N² weights must be updated serially (update speed ~100 kHz to 10+ GHz per phase shifter)
- No constant energy advantage over electronics (DAC/ADC conversion dominates energy budget)
- https://arxiv.org/pdf/2403.14806 (Photonic-Electronic Integrated Circuits review, 2024): "micron-scale dimensions of optical elements...significantly larger than transistors"

---

### 2. RECK & CLEMENTS DECOMPOSITION

**Reck decomposition:**
- Any N-dimensional unitary can be decomposed into cascaded 2×2 unitaries (beamsplitter + phase shifter pairs)
- Requires N(N-1)/2 ≈ O(N²) beamsplitters, O(N²) phase shifters
- Circuit depth (number of layers): O(N)
- Asymmetric: different input modes see different numbers of beamsplitters (loss tolerance issue)
- https://arxiv.org/html/1909.01297 (directionally-unbiased unitary optical devices)

**Clements decomposition:**
- Rectangular symmetric architecture: reduces path length vs Reck
- Each mode encounters same number of beamsplitters → better loss tolerance (uniform phase error distribution)
- Circuit depth: N layers (minimal for spatial circuits)
- Widely adopted over Reck for integrated photonics
- https://arxiv.org/pdf/2505.11371 (compactifying linear optical unitaries with multiport beamsplitters, 2025)
- https://arxiv.org/html/1909.01297 mentions Clements' symmetric design advantages

---

### 3. SVD TRICK FOR ARBITRARY (NON-UNITARY) MATRICES

**Decomposition:**
- Arbitrary matrix A = U Σ V†, where U, V unitary (Reck/Clements-decomposable), Σ diagonal with non-negative singular values
- Σ encodes loss/amplification per output mode (non-unitary part)
- https://arxiv.org/pdf/2408.00669 (non-unitary matrix-vector multiplication, 2024): "compact low-depth beam-splitter meshes...amplitude and phase masks"

**Hardware:**
- Two programmable unitary interferometer meshes (U, V) + one row of N parallel **amplitude modulators** for diagonal Σ
- Circuit depth: ~2N + 3 layers
- Alternative: use N MZIs with electro-absorption or phase-change material for amplitude control
- https://arxiv.org/pdf/2408.00669; https://arxiv.org/html/2312.05648 (Learning Arbitrary Complex Matrices via amplitude/phase masks)

**Key limitation:**
- Amplitude modulators (for Σ diagonal) lossy; add insertion loss per element
- Must be implemented via external modulation or lossy materials (PCM, electro-absorption)

---

### 4. ALTERNATIVE PHOTONIC MATMUL SCHEMES

**Frequency-comb tensor core (Feldmann et al., Nature 2021):**
- Integrated photonic processor: chip-based optical frequency combs + phase-change-material (PCM) arrays
- Performs parallel convolutions (multiple independent MACs batched in wavelength)
- Speed: trillions of MACs per second (10^12 MAC/s reported)
- https://www.nature.com/articles/s41586-020-03070-1 (Parallel convolutional processing, Nature 589, pp 52-58, 2021)
- Also: https://www.nature.com/articles/s41566-023-01313-x (higher-dimensional processing with continuous-time data, Nature Photonics 2023)

**Crossbar arrays with PCM:**
- m×n weight array stored nonvolatile in phase-change material (e.g., Ge₂Sb₂Te₅, HfO₂)
- Each crosspoint: optical input × PCM transmittance = output
- Scalability limit: crystalline GST cells show high loss (-14.97 dB at 2×2 μm²)
- Calibration methods enable operation despite nonuniformity
- https://link.springer.com/article/10.1557/s43577-022-00358-7 (phase-change materials for photonic memory and computing, MRS Bulletin)
- https://www.researchgate.net/publication/360381890_Coherent_Photonic_Crossbar_Arrays_for_Large-Scale_Matrix-Matrix_Multiplication

**Wavelength-division multiplexing (WDM):**
- Batch multiple MACs in parallel across wavelength channels
- Each wavelength carries independent data → single light pulse performs multiple independent multiplies
- Achieves "batch matrix-matrix multiply in one clock cycle"
- https://arxiv.org/pdf/2002.03780 (Photonic tensor cores for machine learning)
- https://www.nature.com/articles/s41467-026-69084-x (neuromorphic photonic computing with electro-optic analog memory, Nature Comm. 2026)

**Mode-division multiplexing (MDM):**
- Multiple spatial modes in a single waveguide, each independent MZI mesh
- Cited: ~3.8 TOPS via time-wavelength multiplexing
- https://arxiv.org/pdf/2404.03582 (Recent Advancements in MDM for Silicon Photonics)

**Diffractive/free-space optical computing:**
- Compute via phase manipulation and diffraction of light in free space (no integrated MZI meshes)
- All-optical inference with passive optical components
- High throughput, low power for inference-only workloads
- https://www.nature.com/articles/s41467-024-45982-w (Diffractive optical computing in free space, Nature Comm. 2024)
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8873412/ (Space-efficient diffractive neural networks)

---

### 5. CONCRETE NUMBERS FOR TEACHING

**Latency per operation:**
- Light propagation: 15 ps (small chip, ~1 mm), 30 ps (multimode), 100 ps (64×64 mesh) → **~1 ps/mm effective**
- Total latency independent of N (constant for same chip geometry)

**Modulation/phase shifter speeds:**
- Thermo-optic phase shifters: ~100 kHz update rate (slow but low power, >0.1 W per shifter)
- Electro-optic (lithium niobate): 17.5 GHz to 104 GHz bandwidth depending on design
  - Topological cavity modulator: 104 GHz (Nature 2023)
  - Photonic crystal nanobeam: 17.5 GHz
  - Thin-film LN: 38-60 GHz
- https://www.nature.com/articles/s41467-020-17950-7 (LN photonic-crystal modulator, Nature Comm. 2020)
- https://www.nature.com/articles/s41377-023-01251-x (topological interface state modulation, 104 GHz, Light: Science & Applications)

**Bit precision achieved in real demos:**
- Early systems: 4-8 bits (both weights and activations)
- https://arxiv.org/html/2403.14806 "4–8 bits of precision in both activations and weights...suitable for inference"
- Recent (Hamerly et al., 2025): 6-bit precision at 128 GS/s (giga-symbols/sec) with 9-bit amplitude-phase decoupling
- https://arxiv.org/abs/2503.24356: "single-shot matrix-matrix multiplication" achieving 96.4% accuracy on image classification
- GHz-scale rates for matrix sizes up to 64×64: https://arxiv.org/pdf/2011.00111 (Photonics for AI and neuromorphic computing)

**Energy per MAC:**
- Claimed: 20 attojoules/MAC (Hamerly et al., 2025)
  - https://arxiv.org/abs/2503.24356 "20 attojoules (aJ) per multiply-and-accumulate"
- Range: femtojoule → attojoule → zeptojoule depending on design and process
- https://www.researchgate.net/publication/339417010_Femtojoule_per_MAC_Neuromorphic_Photonics_An_Energy_and_Technology_Roadmap
- Zeptojoule (20–100 zJ/bit) achieved in extreme cases (energy harvesting modulators)
  - https://www.nature.com/articles/s41467-019-09724-7 (plasmonic IQ modulators, Nature Comm. 2019)
  - https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8055879/ (sub-attojoule per bit, 2022)

**Compute density:**
- Photonic: ~555 GMAC/s/mm² (5-bit precision, PIC-based)
- Electronic (Google TPU): ~150 GMAC/s/mm² (8-bit precision)
- https://arxiv.org/html/2403.14806

**ADC/DAC energy dominance:**
- DAC: ~40% power reduction claimed with PCM-based design (vs conventional)
- ADC: >70-98% power reduction with linear-in-bits scaling
- ADC/DAC often dominate total energy budget for small networks
- https://www.spiedigitallibrary.org/conference-proceedings-of-spie/13581/135810B/ (Integrated PCM-based DAC/ADC design, SPIE 2025)

---

### 6. THE LENS FOURIER TRANSFORM FACT (O(1) ANALOG)

**4f correlator (optical correlator):**
- A thin converging lens performs Fourier transform of light field in O(1) time (speed of light)
- Configuration: input at distance f from lens → FT plane at distance f from lens → output at distance 2f (or 4f for double-lens correlator with filtering in middle)
- All-optical convolution/correlation realized by: FT → multiply by filter mask → inverse FT
- https://doi.org/10.3390/jimaging9110241 (Scalable optical CNNs with SLMs, 2023)
- Standard textbook: Joseph W. Goodman, **"Introduction to Fourier Optics"** (4th Edition, Macmillan, 2017)
  - Chapters on "Fourier Transforming Properties of Lenses" and "Image Formation"
  - https://www.macmillanlearning.com/college/us/product/Introduction-to-Fourier-Optics/p/1319119166

**Why O(1):**
- Propagation time through optics ≈ optical path length / c
- For lens-based system of fixed size, this is constant regardless of signal complexity
- Computation is "analog" and massively parallel across spatial dimensions

**Connection to neural networks:**
- Spatial light modulators (SLMs) used to program filters or weights in optical domain
- Each update of SLM takes O(1) light transit time; weight storage/reprogramming takes O(number of SLM pixels) time
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10672105/ mentions "real-time processing" with SLMs in correlator setups

---

### 7. RECK/CLEMENTS AREA SCALING CHALLENGE

**Standard approach:**
- N × N unitary matrix: O(N²) MZIs + O(N²) phase shifters
- Recent alternative: exploit "real part" of non-universal mesh → O(N log N) MZIs
- Loss in representability: ~2-5% capability loss on some tasks
- https://arxiv.org/pdf/2602.20701 (Native QR Factorization on Programmable Photonic Meshes)

**Scalability bottleneck:**
- "Optical depth" (number of layers light traverses) scales with N
- Each layer adds loss (beamsplitter insertion loss ~0.5-1 dB typical, accumulates)
- Larger N → higher total loss → weaker signals → SNR degrades → need higher power input or lower precision
- https://www.nature.com/articles/s44310-025-00075-4 (Large-scale photonic processors, npj Nanophotonics, 2025)

---

### 8. PETER McMAHON REVIEW (Nature Reviews Physics, 2023)

**Citation:**
- Peter L. McMahon, "The physics of optical computing," Nature Reviews Physics **5**, 717–734 (2023)
- https://www.nature.com/articles/s42254-023-00645-5
- Also on NSF Public Access: https://par.nsf.gov/biblio/10494915-physics-optical-computing

**Key claims:**
- Enumerates 11 physical features of optics that can benefit computing (bandwidth, parallelism, speed, energy)
- Systematic explanation of why/how optics might give speed or energy advantage
- Resurgence in optical computing motivated by neural-network acceleration since ~2010

---

### 9. RYAN HAMERLY'S WORK (MIT Lincoln Lab, 2024–2025)

**Recent: Single-Shot Matrix-Matrix Multiply (arXiv 2503.24356, submitted March 2025):**
- Coherent homodyne lithium niobate photonics
- 292,616 weight parameters, spatial-wavelength-temporal multiplexing
- 6-bit precision at 128 GS/s, 6 ns latency
- Claims **20 attojoules per MAC**
- 96.4% classification accuracy on image tasks
- https://arxiv.org/abs/2503.24356

**Earlier: General matrix multiply chip (2024):**
- ~1,000 TOPS aggregate throughput
- "Staying in optical domain until readout" enables ultralow latency
- https://news.mit.edu/2024/photonic-processor-could-enable-ultrafast-ai-computations-1202

---

### 10. UNVERIFIED CLAIMS (could not find source)

- O(N^2) **time to reprogram all weights** (found general statements about "reprogramming bottleneck" but no explicit N² time scaling formula in sources)
- Specific breakdown of energy budget: what fraction DAC vs ADC vs optical compute vs losses (only found general statement that ADC dominates for small networks)
- Exact phase shifter count comparison: Reck vs Clements vs reduced-O(N log N) designs in a side-by-side experiment
- Precise "efficiency advantage" of photonics over GPUs in wall-clock time including DAC/ADC overhead (claimed but hard to find matched benchmarks)

---

### KEY TAKEAWAY FOR ARTICLE

**The "O(1) claim" is PRECISE but NARROW:**
- Latency of MAC operation: constant (picoseconds, independent of N)
- Area of chip: O(N²) — scales quadratically with matrix size
- Reprogramming time: O(N²) in worst case (all N² phase shifters must be set)
- Energy dominance: edge conversion (DAC/ADC), not optical computation itself
- Advantage: ultrafast **inference** once weights are loaded; poor for rapid retraining or dynamic adjustment

**Teaching angle:** Use light-transit time (1 ps/mm) as the "why O(1)" hook, then immediately clarify the O(N²) area and O(N²) tuning costs. The comparison to lens Fourier transform reinforces the O(1) intuition: simple fixed-geometry optics compute in constant time.
