# SCOUT 5 — RAW NOTES: adjacent wave-computing architectures + teaching hooks

Haiku scout output, 2026-08-26. Raw web-research notes, unconsolidated.
This scout ranked simulation potential for the lesson figures and found
the explicit p-bit ↔ photonic-Ising bridge.

---

### 1. LENS AS ANALOG FOURIER-TRANSFORM COMPUTER

- Single lens produces the Fourier transform of the incident field in its back focal plane; a 4f system (lens–filter–lens) computes filtered convolution entirely in glass.
- Vander Lugt (1964): complex matched filters for pattern matching. Goodman, *Introduction to Fourier Optics* (4th ed. 2017) is the canonical text.
- Convolution theorem implemented physically: F{x*h} = F{x}·F{h}; put a mask in the Fourier plane, get convolution at the output plane.
- Modern hybrids: SLM-based 4f systems (digital control, analog optical path).
- Teaching kit exists: Thorlabs Fourier Optics Educational Kit (EDU-FOP2).
- Sources: https://arxiv.org/pdf/2103.09044 (optical CNN review) ; https://arxiv.org/pdf/1810.08533 (teaching convolution via Fourier optics) ; https://www.thorlabs.com/newgrouppage9.cfm?objectgroup_id=11829&pn=EDU-FOP2
- **Simulation potential: HIGHEST** — interference → math with nothing but propagation; masks swappable live.

### 2. DIFFRACTIVE DEEP NEURAL NETWORKS (D2NN)

- Passive 3D-printed/lithographed phase layers designed by backprop; light propagating through them classifies at the speed of light; zero energy in the forward path.
- Ozcan group (UCLA): Science 2018 (MNIST + fashion, 0.4 THz); THz imaging elements; recent complex-valued ops under incoherent light.
- Limits: linear only (no optical nonlinearity between layers), intensity detection loses phase, accuracy below electronic CNNs, fixed once fabricated.
- Teaching angle: learning encoded in GEOMETRY — network weights become a phase surface.
- Sources: https://www.science.org/doi/10.1126/science.aat8084 ; https://arxiv.org/pdf/1804.08711
- **Simulation potential: HIGH** (angular-spectrum propagation sim is straightforward; could train a small D2NN in-browser — echoes the p-bit series' train-in-browser finale).

### 3. PHOTONIC ISING MACHINES — the p-bit bridge

**A) Coherent Ising Machine (CIM), NTT:**
- Network of degenerate optical parametric oscillator (DOPO) pulses in a fiber ring; each pulse's phase (0/π) is a spin.
- Measurement-feedback coupling: homodyne-measure pulses, FPGA multiplies by coupling matrix J, feedback modulates pulses — all-to-all connectivity by time multiplexing.
- Scale: 2048 coupled DOPOs demonstrated; 2000-node max-cut in <0.01 s (with caveats vs classical heuristics).
- Chaotic Amplitude Control (CAC) to escape local minima.
- Single-photon CIM (2025, NTT/Tohoku): ~1 photon/pulse, claimed orders-of-magnitude energy reduction. https://iopscience.iop.org/article/10.1088/2058-9565/addde5
- Sources: https://pubs.aip.org/aip/apl/article/117/16/160501/1061343/ ; https://arxiv.org/pdf/2006.05649 ; https://www.rd.ntt/e/brl/latesttopics/2016/10/latest_topics_201610201319.html

**B) Spatial Photonic Ising Machines (SPIM):**
- One SLM + free-space propagation; spins encoded across the wavefront; interactions via spatial interference — huge N in one shot, but SLM update ~10–100 Hz.
- Sources: https://arxiv.org/pdf/2105.04696 ; https://arxiv.org/pdf/2004.02208

**Explicit thermodynamic/p-bit connection (for the series bridge):**
- Both CIM and p-bit networks minimize/sample H = −Σ Jᵢⱼsᵢsⱼ; noise (quantum in DOPOs, thermal in MTJs) is the resource; both frame as Boltzmann sampling.
- Photonic p-bits paper: https://www.nature.com/articles/s42005-025-01953-1 (stochastic logic in photonic p-bits)
- Sparse Ising machines training Boltzmann networks: https://www.nature.com/articles/s41928-024-01182-4
- **Simulation potential: MEDIUM** — coupled-oscillator network sim; direct callback to physics-02-pbits.

### 4. PHOTONIC RESERVOIR COMPUTING

- Fixed random scattering medium (delay loop, microring network, multimode fiber) as an untrained recurrent network; only a linear readout is trained.
- Delay-loop RC: one nonlinear node + time-multiplexed "virtual nodes."
- Teaching angle: chaos/scattering alone has computational power; only the readout learns.
- Sources: https://arxiv.org/pdf/2308.15902 ; https://arxiv.org/pdf/2101.00557 ; https://arxiv.org/pdf/2306.09095 (WATER-WAVE analog reservoir — striking for a wave-physics series)
- **Simulation potential: MEDIUM–HIGH.**

### 5. METAMATERIAL / WAVE-BASED ANALOG COMPUTING

- Silva et al., Science 343:160 (2014), Engheta group: metamaterial blocks perform differentiation/integration/convolution on a wavefront as it propagates — "photonic calculus."
- Experimentally: CNC-milled "Swiss cheese" polystyrene block solving Fredholm integral equations at microwave frequencies; reconfigurable metamaterial processing unit (2024): https://www.nature.com/articles/s41467-024-50483-x
- Teaching hook: "machine a block of plastic, solve an equation" — geometry encodes the Green's function.
- Sources: https://ui.adsabs.harvard.edu/abs/2014Sci...343..160S/abstract ; https://www.engineering.upenn.edu/stories/penn-engineers-demonstrate-metamaterials-that-can-solve-equations-bf9ddb650c12/ ; https://physics.aps.org/articles/v17/52
- **Simulation potential: MEDIUM–HIGH** (wave sim solving an equation live would be a spectacular figure).

### 6. THE NONLINEARITY PROBLEM — the structural obstacle

- Linear optics can't do activation functions; every all-optical deep network hits this wall.
- Approaches, by maturity: (1) optoelectronic detect→ReLU→re-modulate (works, pays the conversion tax every layer); (2) saturable absorbers (fast but high threshold, hard to cascade); (3) MZM sinusoidal transfer as soft nonlinearity; (4) opto-resistive/2D-material switches (early); (5) measurement-based feedback.
- Energy: linear photonic ops ~fJ/MAC; optical nonlinearity typically ~pJ — the nonlinearity, not the matmul, breaks the energy story for deep all-optical nets.
- Sources: https://opg.optica.org/ome/fulltext.cfm?uri=ome-8-12-3851&id=402592 ; https://www.nature.com/articles/s43588-025-00866-x (complete photonic neuron 2025) ; https://www.nature.com/articles/s41377-025-02175-4 (Kerr activators)

### 7. UMBRELLA: "COMPUTING WITH PHYSICS" FAMILY

- McMahon group (Cornell): physical neural networks — train ANY physical medium (optical, mechanical, electronic) with the same algorithm (Wright et al. 2022 descends from this program).
- Reviews: McMahon "The physics of optical computing" (Nat. Rev. Phys. 2023); "Multidimensional photonic computing" (Nat. Rev. Phys. 2025, https://www.nature.com/articles/s42254-025-00843-3); analogue computing with metamaterials (Nat. Rev. Materials).
- Unifying frame for the SERIES: thermodynamic computing (noise as resource) → photonic computing (interference as arithmetic) → both are "let physics do the math" with different physical currencies (entropy vs coherence).
- Shared limits: analog precision, I/O overhead ignored in speed claims, task-specific hardware.

### SCOUT'S RANKED TEACHING HOOKS

1. **Lens as Fourier transform** — direct interference→mathematics; kit exists; sim trivial.
2. **Metamaterial calculus** — "machine a shape, solve an equation."
3. **Photonic Ising machine** — noise + feedback = Boltzmann sampling; explicit p-bit bridge.
4. **D2NN** — learned phase surface; passive inference; trainable in-browser.
5. **Nonlinearity bottleneck** — why all-optical deep nets are hard; motivates hybrids.

### OPEN-SOURCE TOOLS FOUND
- Neurophox (solgaardlab/neurophox) — MZI mesh / unitary NN framework
- Photontorch — PyTorch photonic circuit sim
- Simphony, SiPANN — PIC simulation

### FLAGGED UNVERIFIED
- Silva 2014 full text (paywalled), metamaterial review full text, 200-TOPS silicon RC claim.
