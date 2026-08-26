# SCOUT 3 — RAW NOTES: academic paper timeline

Haiku scout output, 2026-08-26. Raw web-research notes, unconsolidated.
CAUTION: several entries garble details (Shen MZI/matrix arithmetic, Pai
2023 volume/page numbers, "32-bit parity" for Lightmatter). Consolidation
pass must re-verify before anything binds prose.

---

### FOUNDATION ERA (1960s–1970s)

**Goodman, Joseph W.** | *Introduction to Fourier Optics* | **1968** | McGraw-Hill
- Seminal textbook consolidating Fourier optics; mathematical framework for coherent optical computing.
- Teachable: Fourier optical systems perform convolution/correlation in free space — natural parallelism.

**Vander Lugt** | complex matched filters | **1964**
- 4f optical correlator for pattern matching using complex filters.
- Teachable: 4f correlator topology performs 2D convolution at optical speed.
- Cited in: "Optical Computing: A 60-Year Adventure" (Ambs 2010) https://www.researchgate.net/publication/239663941_Optical_Computing_A_60Year_Adventure

**Weaver & Goodman** | joint-transform correlator | **1966**
- Simpler alternative correlator architecture (single lens).
- https://onlinelibrary.wiley.com/doi/10.1155/2010/372652

### EARLY OPTICAL NEURAL NETWORKS (1980s–1990s: BOOM & BUST)

**Psaltis & Farhat** | *Optical information processing based on an associative-memory model of neural nets* | **1985** | Optics Letters 10(2):98–100
- Optical implementation of Hopfield networks using LEDs, photodetectors, anamorphic optics; 32–64 neurons.
- https://www.osapublishing.org/abstract.cfm?uri=ol-10-2-98

**Boom & collapse (why it failed):**
- CMOS Moore's Law outpaced optical innovation; material bottlenecks (modulators, detectors); electronic clocks rose ~10×; by ~2000 analog optics had lost to digital electronics.
- Sources: Ambs 2010 (60-Year Adventure); "A short history of optical computing" (SPIE 2009)

### RENAISSANCE: COHERENT SILICON PHOTONICS (2017–2019)

**Shen, Harris, Skirlo, et al.** | *Deep learning with coherent nanophotonic circuits* | **2017** | Nature Photonics 11:441–446
- Programmable nanophotonic processor, 56 cascaded MZIs in silicon; optical matrix multiplication; the paper that restarted the field.
- [scout's "56×4 matrix (SU(4) rotations per pair)" is garbled — verify: 56 MZIs implementing 4×4 unitaries, 2-layer NN, vowel recognition]
- https://www.nature.com/articles/nphoton.2017.93

**Lin, Rivenson, Yardimci, et al.** | *All-optical machine learning using diffractive deep neural networks (D2NN)* | **2018** | Science 361(6406):1004–1008
- 3D-printed diffractive layers; inference by wave propagation at 0.4 THz (0.75 mm wavelength); MNIST 91.75% accuracy; fully passive forward pass.
- https://www.science.org/doi/10.1126/science.aat8084

**Hamerly, Sludds, Bernstein, Englund** | *Large-scale optical neural networks based on photoelectric multiplication* | **2019** | Phys. Rev. X 9:021032
- Homodyne-detection scheme scales ONNs to N ≳ 10⁶ neurons; sub-aJ/MAC projected.
- https://journals.aps.org/prx/abstract/10.1103/PhysRevX.9.021032 ; https://arxiv.org/pdf/1812.07614

### FREQUENCY-COMB ERA (2021)

**Feldmann, Youngblood, Karpov, et al.** | *Parallel convolutional processing using an integrated photonic tensor core* | **2021** | Nature 589:52–58
- Soliton microcombs + phase-change memory crossbar; parallel convolutions; TOPS-class throughput; WDM channels from a single comb.
- https://www.nature.com/articles/s41586-020-03070-1

**Xu et al.** | *11 TOPS photonic convolutional accelerator for optical neural networks* | **2021** | Nature 589:44–51
- Kerr soliton microcomb; time-wavelength interleaving; 11 TOPS convolver; 250,000-pixel image processing; ~88% digit accuracy.
- https://www.nature.com/articles/s41586-020-03101-2

### TRAINING BREAKTHROUGHS (2022–2023)

**Wright, Onodera, Stein, et al.** | *Deep physical neural networks trained with backpropagation* | **2022** | Nature 601:549–555
- Physics-aware training: in-silico backprop applied to real noisy physical systems (optical, mechanical, electronic) — trains through fabrication mismatch and drift.
- https://www.nature.com/articles/s41586-021-04223-6

**Pai, et al. (Fan/Miller/Solgaard groups)** | *Experimentally realized in situ backpropagation for deep learning in photonic neural networks* | **2023** | Science 380:398–404
- On-chip photonic gradient measurement — backprop physically implemented in the mesh.
- [scout gave inconsistent details; verify volume/issue/latency claims]
- https://www.science.org/doi/10.1126/science.ade8450 ; https://arxiv.org/abs/2205.08501

**Momeni, Rahmani, Malléjac, del Hougne, Fleury** | *Backpropagation-free training of deep physical neural networks* | **2023** | Science 382:1297–1303
- Forward-forward-style physical local learning (PhyLL) for wave-based physical NNs; no gradient signals needed.
- https://www.science.org/doi/10.1126/science.adi8474 ; https://arxiv.org/abs/2304.11042

### INTEGRATION & SCALING (2024)

**Bandyopadhyay, Sludds, Krastanov, et al. (MIT, Englund group)** | *Single-chip photonic deep neural network with forward-only training* | **2024** | Nature Photonics 18:1335–1343
- Fully integrated coherent ONN: 3 layers, linear + nonlinear ops all on one chip; ~410 ps end-to-end latency per inference; in-situ forward-only training.
- https://www.nature.com/articles/s41566-024-01567-z

**Xue, Zhang, Tang, et al. (Tsinghua)** | *Fully forward mode training for optical neural networks* / **Taichi**: *Large-scale photonic chiplet Taichi empowers 160-TOPS/W artificial general intelligence* | **2024** | Science 384:202–209
- Diffractive-interference hybrid chiplet; millions of neurons; 1000-category classification (91.89% Omniglot); claimed 160 TOPS/W energy efficiency.
- https://www.science.org/doi/10.1126/science.adl1203

### MODERN ERA (2025–2026)

**Ahmed et al. (Lightmatter)** | *Universal photonic artificial intelligence acceleration* | **2025** | Nature 640:368–374
- Photonic processor executing general AI models (ResNet, BERT, Atari RL) with accuracy comparable to electronic accelerators.
- [scout's "near-32-bit floating-point precision" is garbled — verify actual claim: near-parity task accuracy with adaptive techniques, not 32-bit hardware precision]
- https://www.nature.com/articles/s41586-025-08854-x

**2025–2026 industry-reported developments** [UNVERIFIED]: neuromorphic photonic SPAD arrays; Chinese university integrated photonic chips; on-chip laser sources; sub-ns latencies common.

### MAJOR REVIEWS

- **Wetzstein, Ozcan, Gigan, Fan, Englund, Soljačić, Denz, Miller, Psaltis** | *Inference in artificial intelligence with deep optics and photonics* | 2020 | Nature 588:39–47 — https://www.nature.com/articles/s41586-020-2973-6
- **McMahon** | *The physics of optical computing* | 2023 | Nature Reviews Physics 5:717–734 — https://www.nature.com/articles/s42254-023-00645-5
- **Prucnal & Shastri** | *Neuromorphic Photonics* (book, 2017) + reviews — https://arxiv.org/abs/2011.00111

### SCOUT'S SUMMARY TABLE (garble-prone — treat as index, not facts)

| Year | Team | Venue | Result |
|------|------|-------|--------|
| 1968 | Goodman | Book | Fourier optics foundation |
| 1985 | Psaltis & Farhat | Opt. Lett. | Optical Hopfield memory |
| 2017 | Shen et al. | Nat. Photon. | 56-MZI programmable mesh NN |
| 2018 | Lin et al. | Science | D2NN, passive THz diffractive classifier |
| 2019 | Hamerly et al. | PRX | Photoelectric-multiplication scaling to 10⁶ neurons |
| 2021 | Feldmann et al. | Nature | Microcomb + PCM photonic tensor core |
| 2021 | Xu et al. | Nature | 11 TOPS microcomb convolver |
| 2022 | Wright et al. | Nature | Physics-aware backprop training |
| 2023 | Pai et al. | Science | In-situ on-chip backprop |
| 2023 | Momeni et al. | Science | Backprop-free physical local learning |
| 2024 | Bandyopadhyay et al. | Nat. Photon. | Fully-integrated coherent ONN, ~410 ps |
| 2024 | Xue et al. | Science | Taichi chiplet, 160 TOPS/W claim |
| 2025 | Lightmatter | Nature | ResNet/BERT on photonic processor |

### GAPS FLAGGED BY SCOUT
- Lightmatter 2025 Nature full methodology paywalled.
- 2025–2026 trade-press claims not peer-verified.
- Few papers publish training dynamics (vs inference accuracy).
- No cost/yield data anywhere — all single-prototype results.
