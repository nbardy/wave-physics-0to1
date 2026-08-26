# SCOUT 2 — RAW NOTES: company & industry landscape (2025–2026)

Haiku scout output, 2026-08-26. Raw web-research notes, unconsolidated.
CAUTION: haiku scouts garble details; acquisition/IPO claims below must be
re-verified by the consolidation pass before any of this binds prose.

---

### LIGHTMATTER
**Status:** Actively scaling; not pivoting
- **Compute chip:** Envise — photonic AI accelerator; performs matrix multiplication with 512 light beams through 200k+ optical components
  - Nature paper April 2025: "Universal photonic artificial intelligence acceleration" (Nature 640, pp. 368–374)
  - Demonstrated ResNet, BERT, Atari DRL; claims near-electronic precision for practical AI
  - https://www.nature.com/articles/s41586-025-08854-x
- **Interconnect product:** Passage M1000 — 3D photonic "superchip" interposer
  - Announced March 2025; 114 Tbps total optical bandwidth
  - Passage L200 (2026): 32–64 Tbps optical I/O for GPU interconnect
  - https://futurumgroup.com/insights/lightmatter-solving-how-to-interconnect-millions-of-chips/
- **Funding:** $400M Series D, October 2024 → $4.4B valuation; total raised $850M (T. Rowe Price, Fidelity, Google Ventures)
  - https://www.businesswire.com/news/home/20241016498931/
- **Manufacturing:** GlobalFoundries, ASE, Amkor partnerships; targeting late 2025 deliveries
  - https://www.datacenterdynamics.com/en/news/lightmatter-turns-to-globalfoundries-to-bring-photonics-interconnect-to-market-in-2025/
- **Customers:** Not disclosed publicly; targeting hyperscalers

### LIGHTELLIGENCE
**Status:** Public company (IPO April 2026, HKEX: 1879); dual compute + interconnect
- **Compute chip:** PACE 2 optoelectronic accelerator (2025) — 128×128 matrix support; 40,000+ photonic devices
  - https://picmagazine.net/article/123802/Lightelligence_advances_optical_AI_compute
- **Interconnect:** LightSphere X — distributed optical interconnect + optical switching GPU supernode; SAIL Award at 2025 World AI Conference; xPU-CPO co-packaged prototype
- **IPO (April 28, 2026):** raised HK$2.4B (≈$306M) at HK$183.20/share; cornerstone investors incl. Alibaba, GIC, BlackRock, Temasek; first-day surge 383.6% to HK$886; market cap HK$81.5B; called "world's first AI silicon photonics chip stock"
  - https://www.scmp.com/tech/tech-trends/article/3351551/
  - https://www.caixinglobal.com/2026-04-28/lightelligence-sets-record-ipo-gain-with-383-surge-on-hong-kong-debut-102438977.html
- **Revenue/Loss:** 2025: 106M yuan revenue, 1.3B yuan net loss
  - https://startupfortune.com/lightelligences-600x-oversubscribed-hk-ipo-proves-the-market-wants-photonic-ai-chips/

### CELESTIAL AI
**Status:** [CLAIMED] Acquired by Marvell Technology; pivoted to optical interconnect — RE-VERIFY
- **Product:** Photonic Fabric — in-die optical I/O interconnect; "world's first SoC with in-die optical I/O"; Hot Chips 2025; TSMC 5nm ASIC, 8 Tbps switch, 2× HBM3e, 4× DDR5, 7.2 Tbps optical connectivity
  - https://www.servethehome.com/celestial-ai-photonic-fabric-module-at-hot-chips-2025/
- **Acquisition:** Marvell definitive agreement, $3.25B (cash + stock)
  - https://investor.marvell.com/news-events/press-releases/detail/1000/

### AYAR LABS
**Status:** Scaling CPO chiplets; not pivoting
- **Product:** TeraPHY optical I/O chiplet (3rd gen, 2025) — 8 Tbps bidirectional; first UCIe optical chiplet (April 2025)
  - https://www.businesswire.com/news/home/20250331044779/en/
- **Partnership:** Alchip + TSMC for co-packaged optics (TSMC OIP 2025)
  - https://www.hpcwire.com/off-the-wire/ayar-labs-and-alchip-to-scale-ai-infrastructure-with-co-packaged-optics/
- **Customers:** "Hyperscalers and enterprise AI customers" (not named)

### SALIENCE LABS
**Status:** Pivoted to photonic SWITCHES (interconnect, not compute)
- Silicon-photonic optical switches + control software for AI datacenters
- **Funding:** £30M Series A (early 2025) + £35M additional (September 2025)
  - https://www.photonics.com/Articles/Salience-Labs-Closes-30M-Funding-Round/a70719
  - https://www.computerweekly.com/blog/CW-Developer-Network/Salience-Labs-goes-all-in-on-all-optical-networking-with-photonics-switches-for-ai-infrastructure

### OPTALYSYS
**Status:** FHE (fully homomorphic encryption) focus; hybrid optical-electronic
- **Product:** LightLocker™ Node servers (2025); hybrid photonic-FPGA; target full ASIC with photonic interconnect layer
  - https://optics.org/news/optalysys-eyes-us-expansion-with-%C2%A323m
- **Funding:** €26.4M Series A extension (January 2026) — Northern Gritstone, imec.xpand, UK NSSIF
  - https://www.eu-startups.com/2026/01/leeds-based-optalysys-raises-e26-4-million-to-accelerate-always-encrypted-data-technology-using-light/

### Q.ANT
**Status:** Shipping commercial photonic processor (2026 target)
- **Product:** NPU 2 (Native Processing Unit 2) — photonic processor for AI/HPC; nonlinear math directly in light; claims 30× lower energy, 50× higher performance vs CMOS; 19-inch Native Processing Server; PCIe + C/C++/Python APIs
  - https://www.hpcwire.com/off-the-wire/q-ant-unveils-its-second-generation-photonic-processor-to-power-the-next-wave-of-ai-and-hpc/
- **Roadmap:** 0.1 GOps (2024) → 100,000 GOps target (2028)
- **Availability:** demoed Supercomputing 2025; shipments early 2026
  - https://thequantuminsider.com/2025/11/19/qant-next-gen-photonic-npu/

### LUMAI
**Status:** Free-space optical inference accelerator; pre-product
- **Technology:** free-space optics (not integrated); Iris architecture: native 2048×2048 optical matrix; 1,024 laser sources; electronic display modulates weights; optical accumulation; targets LLM prefill (compute-bound stage)
- **Claims:** 4× faster than GPUs, 90% cost reduction for inference
  - https://www.hpcwire.com/2026/04/28/lumais-photonic-chip-harnesses-light-for-big-ai-compute-speedup/
- **Funding:** >$10M (April 2025, OFC); Oxford spinout
  - https://www.optica-opn.org/home/industry/2025/april/lumai_lands_funds_to_push_3d_optical_computing/

### AKHETONICS
**Status:** All-optical DIGITAL CPU (contrarian bet); early prototype
- All-optical XPU; data as light throughout; published 2-bit optical CPU architecture; ~30 generations of photonic chips
- **Funding:** €6M (~$6.3M) in 2025; first commercial deployment targeted end of 2026
  - https://www.photonics.com/Articles/Akhetonics-Raises-63M-for-All-Optical-Digital/a70533

### iPRONICS
**Status:** Programmable photonic SWITCH for datacenters
- iPronics ONE — integrated optical switch for AI clusters; claims 10× data processing speedup, 3× power reduction vs current switches; customer testing Q2 2025
  - https://www.eetimes.com/ipronics-raises-e20m-to-deploy-optical-networking-engines-in-data-centers/
- **Funding:** €20M Series A (2025); TU Valencia spinout (2019)
  - https://www.photonics.com/Articles/iPronics_Raises_21M_Series_A/a70695

### NEUROPHOS
**Status:** Optical processor startup; early phase, heavily funded
- Optical Processing Unit (OPU); "micron-scale metamaterial optical modulators" (claimed 10,000× smaller than previous); 1M+ optical processing elements per chip; AI inference focus
- **Funding:** $110M Series A (oversubscribed) → $118M total — Gates Frontier, M12, Aramco Ventures, Bosch
  - https://www.datacenterdynamics.com/en/news/ai-photonic-chip-startup-neurophos-raises-100m-for-optical-processing-unit/
- [UNVERIFIED: commercial timeline]

### NTT RESEARCH
**Status:** Long-term R&D — Coherent Ising Machine (CIM), optimization via nonlinear optics
- Single-photon CIM collaboration with Tohoku University; paper July 2025 "Single photon coherent Ising machines for constrained optimization problems" (Quantum Sci. Technol.)
  - https://www.businesswire.com/news/home/20250709644790/en/
- Thin-film lithium niobate PIC nanofabrication breakthrough
  - https://ntt-research.com/2024-upgrade-reality-photonic-integrated-circuit-based-on-thin-film-lithium-niobate/

### MICROSOFT RESEARCH
**Status:** Research prototype — Analog Iterative Machine (AIM), analog optical OPTIMIZATION computer
- Photons + electrons, asynchronous; light propagation 5 ns/m; Barclays one-year trial
  - https://www.microsoft.com/en-us/research/blog/unlocking-the-future-of-computing-the-analog-iterative-machines-lightning-fast-approach-to-optimization/
- [UNVERIFIED: commercialization status]

### LUMINOUS COMPUTING
**Status:** [CLAIMED] acquired by AMD (May 2025) — RE-VERIFY; scout's note mixed Luminous and Elenion history
- Was: hybrid photonic-electronic AI accelerator (optical linear ops + CMOS nonlinearity/control)
  - https://www.crunchbase.com/organization/luminous-computing

### PHOTONIC QUANTUM (distinct field — one line each, do not conflate)
- **Xanadu:** photonic QUANTUM computing; Borealis Gaussian boson sampling (216 squeezed-mode)
- **PsiQuantum:** photonic QUANTUM computing; $700M+; GlobalFoundries fab partnership; utility-scale target ~2027
  - https://www.businesswire.com/news/home/20250912049344/en/

---

## KEY NARRATIVE: COMPUTE → INTERCONNECT PIVOT

**The "Copper Wall" driver:**
- 2024–2025: passive copper reach fell below ~1 meter at 224+ Gbps per lane
- ~30% of AI cluster energy spent moving data between chips
- Solution: Co-Packaged Optics (CPO) — optical engines on the GPU/switch substrate
  - https://markets.financialcontent.com/wss/article/tokenring-2026-1-28-the-photonic-pivot-silicon-photonics-and-cpo-slash-ai-power-demands-by-50-as-the-copper-era-ends

**Energy gains (2025–2026 reporting):**
- ~70% reduction in optical interconnect power vs pluggables (Broadcom claim); 3.5× power-efficiency improvement; 80%+ reduction in "optics tax"
  - https://www.hpcwire.com/2025/10/01/photonic-switches-promise-to-keep-gpus-fed-cool/

**Shipping CPO products (interconnect, NOT compute):**
1. **Broadcom Tomahawk 6 "Davisson"** (102.4 Tbps) — shipped late 2025; TSMC COUPE optical engines; Meta tested Bailly gen-2 at 1M cumulative device-hours flap-free
   - https://investors.broadcom.com/news-releases/news-release-details/broadcom-announces-tomahawkr-6-davisson-industrys-first-1024
   - https://www.nextplatform.com/2025/10/17/the-third-time-will-be-the-charm-for-broadcom-switch-co-packaged-optics/
2. **NVIDIA Quantum-X Photonics** (InfiniBand) — 115 Tb/s per switch; early 2026
   - https://www.hpcwire.com/off-the-wire/nvidia-announces-spectrum-x-co-packaged-optics-networking-switches-ai-factories
3. **NVIDIA Spectrum-X Photonics** (Ethernet) — 409.6 Tb/s; H2 2026
   - https://www.tomshardware.com/networking/nvidia-outlines-plans-for-using-light-for-communication-between-ai-gpus-by-2026

## SHUTDOWNS / FAILURES
- Luminous: lost independence (acquisition claim above — RE-VERIFY)
- [UNVERIFIED] No notable 2024–2026 shutdowns surfaced; sector shows consolidation instead (Marvell/Celestial claim, AMD/Luminous claim, Broadcom CPO shipping)

## SCOUT'S SUMMARY OBSERVATIONS
1. Compute pioneers (Lightmatter, Lightelligence, Q.ANT, Neurophos, Akhetonics) remain active on compute — while ALSO building interconnect lines.
2. Interconnect/CPO exploded as the near-term business: Celestial, Salience, iPronics, Ayar all target interconnect, not compute.
3. Lightelligence IPO (April 2026): market appetite for photonic AI silicon exists — first public pure-play.
4. Copper wall is real and driving hyperscaler adoption (Meta/Broadcom device-hours, Tomahawk 6 production).
5. Microsoft AIM and NTT CIM are optimization/analog research programs, not AI accelerators; unclear commercialization path.
