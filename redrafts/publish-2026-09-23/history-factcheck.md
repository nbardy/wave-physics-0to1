# History lesson fact-check (2026-09-23)

Target: `src/lessons/lesson-03-navier-stokes-history.mdx` (not edited).
Quality tags: AUDITED/REGISTRY = primary source or official statement; PRESS; CLAIM (self-reported); GUESS (my inference).

## Top priority: the Millennium Prize paragraph is out of date (lines 722-732; also 801-802)

Something changed in the last 16 days. The paragraph (and Final Words) says the problem is open, which is now contradicted by an official Clay statement. Fix this before anything else.

### What the sources say (as of 2026-09-23)

- **8 Sep 2026: OpenAI claimed a proof of finite-time blowup for forced 3D Navier–Stokes.** The 166-page paper ("Finite time blowup for Navier–Stokes", attributed to OpenAI) proves this: for every ν > 0 there is a smooth force, compactly supported in space and time, with zero initial velocity, such that the velocity becomes unbounded at t = 1 while the kinetic energy stays bounded. The paper says this "establishes alternative (C)" of Fefferman's statement, and via compact support also (D) on the torus. It comes with a Lean formalization. [CLAIM] https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf (I read the abstract, Theorem 1.1 and §1.1 directly.)
- **Fefferman's statement explicitly allows a smooth force in the breakdown alternatives.** (C) and (D) both say "there exist a smooth, divergence-free u° … and a smooth f(x,t)". So a correct forced blowup is a full negative resolution of the prize problem. Some press and blog pieces say "the forced variant is not covered by the prize", and that is wrong. [AUDITED] https://www.claymath.org/wp-content/uploads/2022/06/navierstokes.pdf (p. 3)
- **11 Sep 2026: Clay's statement.** It says the Navier–Stokes problem "has apparently been settled". Its evaluation process is "deliberately unhurried", with updates to come. No prize has been awarded, and the rules require peer-reviewed publication first. [AUDITED] https://www.claymath.org/news/navier-stokes-announcement
- **Quanta, 8 Sep 2026.** The headline is "AI Has Solved One of Math's $1 Million Millennium Prize Problems". It reports that the result is Lean-checked, and it also notes that humans still have to confirm the Lean statement matches the intended theorem. [PRESS] https://www.quantamagazine.org/ai-has-solved-one-of-maths-1-million-millennium-prize-problems-20260908/. My summarizer rendered one quoted mathematician's name as "Charles Feffinger". That is probably Fefferman, but I have not verified it, so do not quote it.
- **7 Sep 2026: Alpöge (Anthropic) and Buckmaster (NYU).** They posted proofs of forced finite-time blowup for IPM, 2D Boussinesq and 3D incompressible Euler, built on Córdoba–Martínez-Zoroa. The proofs are AI-assisted and Lean-formalized. Tao says they "have not quite" reached Navier–Stokes itself, and that forced NS blowup is "now widely expected". [AUDITED: Tao's blog] https://terrytao.wordpress.com/2026/09/07/finite-time-blowup-with-smooth-forcing-term-for-the-incompressible-porous-medium-boussinesq-and-incompressible-euler-equations/
- **A priority dispute followed.** Buckmaster alleged that OpenAI drew on his unpublished work. On 11 Sep an open letter from 26+ Fields medalists criticized the practice. [PRESS/wiki, secondary] https://en.wikipedia.org/wiki/Navier%E2%80%93Stokes_priority_controversy and Nature news doi:10.1038/d41586-026-02842-5 (paywalled; not read).
- **Context the paragraph should not contradict:**
  - Chen–Hou gave a computer-assisted proof of blowup for 2D Boussinesq and 3D axisymmetric Euler, from smooth data and in the presence of a boundary, with no forcing. https://arxiv.org/abs/2210.07191 and https://arxiv.org/abs/2305.05660
  - Wang, Lai, Gómez-Serrano, Buckmaster et al. with Google DeepMind (Sep 2025) numerically discovered unstable self-similar singularities. That work is numerics, not a Navier–Stokes proof. https://arxiv.org/abs/2509.14185
  - Buckmaster–Vicol (2019) and Albritton–Brué–Colombo (2022) proved non-uniqueness of weak and Leray–Hopf solutions. Both are cited in §1.1 of the OpenAI paper.
- **What remains open [GUESS, but grounded in Fefferman's (A) plus the OpenAI theorem's use of a force]:**
  - Whether smooth *unforced* data (f = 0) can blow up.
  - Whether the claimed proof survives independent verification and peer review.

### Line-by-line verdicts

| Text | Verdict | Sources |
|---|---|---|
| "In May 2000 the Clay Mathematics Institute named it one of seven Millennium Prize Problems" | **Correct.** The announcement was 24 May 2000 at the Collège de France. | https://www.claymath.org/millennium-problems/ |
| "a bounty and a problem statement six pages long" | **Correct.** `pdfinfo` on the Clay PDF reports 6 pages. The bounty is $1M. | Clay PDF above |
| "in 2016 Terence Tao showed that a slightly averaged cousin of the equation does blow up in finite time" | **Correct.** The paper is J. Amer. Math. Soc. 29 (2016) 601–674, arXiv 1402.0290. It averages over rotations, dilations and order-zero Fourier multipliers and keeps the energy identity. "Slightly" is editorial but tolerable. | https://arxiv.org/abs/1402.0290 |
| "The strongest recent evidence cuts the wrong way for optimists" | **Wrong now. Before September 2026 it was already overstated.** Tao framed 2016 as a *barrier*: any regularity proof must use finer structure than the energy identity plus harmonic-analysis estimates. He offered it as a program toward blowup, not as evidence about the true equation. Since Sep 2026 it is not the strongest evidence in any sense: there are forced Euler/Boussinesq/IPM blowup proofs, and a claimed forced-NS blowup proof. | arXiv abstract; Tao blog |
| "Whatever protects the real equation — if anything does — is something subtler than anything yet written down." | **Contradicted by the pending claim.** If OpenAI's proof holds, nothing protects the forced equation. Tao's 2016 message only licenses a narrower statement: a proof of smoothness would need structure beyond energy conservation. | as above |
| "Whether three-dimensional solutions always stay smooth is, as of this sentence, unknown." | **Needs updating.** An announced proof of breakdown, endorsed provisionally by Clay, is under verification. | Clay news |
| Final Words (801-802), "is still open" | **Same problem.** | Clay news |

**Minimal content a corrected passage must carry:**
1. Clay named it a Millennium Problem in May 2000. Fefferman's statement is six pages, and its breakdown alternatives allow a smooth external force.
2. Tao (2016) proved blowup for an averaged version that keeps the energy identity. This showed that energy conservation alone cannot guarantee smoothness. It was a barrier to proofs, not a verdict on the real equation.
3. In September 2026, Alpöge and Buckmaster proved forced blowup for 3D Euler and two simpler models. A day later OpenAI announced a machine-found, Lean-formalized proof of forced blowup for 3D Navier–Stokes itself, from rest.
4. On 11 Sep 2026 Clay said the problem "has apparently been settled", with verification and peer review still pending. There is also a live priority dispute.
5. Still open regardless: whether *unforced* smooth flows can blow up.
6. Since this is time-sensitive, date the sentence ("as of September 2026") rather than writing "as of this sentence". Final Words must match.

## 1. Poiseuille and Hagen (lines 511-514, 527-529)

**Verdict: wrong in two places, and it misattributes.** The main source is Sutera & Skalak, "The History of Poiseuille's Law", *Annu. Rev. Fluid Mech.* 25 (1993) 1–20 [AUDITED-quality secondary, quoting primaries]. https://web.iitd.ac.in/~pmvs/courses/mcl702/poiseuille.pdf (also https://www.annualreviews.org/content/journals/10.1146/annurev.fl.25.010193.000245)

What the sources support:
- **Fluid.** Poiseuille measured **distilled water** in **glass capillaries**, not blood. His motive was blood circulation: in 1835 he had observed blood flow in the vessels of living animals. The Academy's commission (Arago, Babinet, Piobert, Regnault, 1842) had him run extra trials with **mercury and ethyl ether**. In 1847 he extended the measurements to many liquids, including bovine serum, all compared against water. Blood never flowed through the glass tubes.
- **Tube size.** Glass bores ranged from **0.015 to 0.6 mm** in nominal diameter, which is about the size of arterioles and venules and larger than human capillaries (5–10 µm). Temperature ranged from 0 to 45 °C.
- **Dates.**
  - 1838: oral report to the Société Philomatique.
  - 1839: sealed packet deposited with the Académie.
  - 1840–41: communications excerpted in the Comptes rendus.
  - 1842: commission report (published 1843).
  - 1846: full memoir in the *Mémoires des savants étrangers*.
  - 1847: final paper.
  - "in the 1840s" is acceptable. "1838–1846" is more precise.
- **Hagen.** Gotthilf Hagen was a Berlin hydraulic engineer. In **1839** he published water flow through **three brass tubes** of diameter 2.55, 4.01 and 5.91 mm. His least-squares diameter exponent was −4.12, and he proposed −4. His results were independent of Poiseuille's and published first. "German engineer … brass pipes independently" is **correct**.
- **Theory came later.** The D⁴ law was an empirical discovery. It had also gone against the D³ laws accepted at the time (Navier 1823, Young 1809).
  - Stokes (1845) wrote the pipe solution but left the wall velocity U open, and did not publish a comparison. He found his formulas disagreed with Bossut's and Du Buat's large-pipe data, and he was apparently unaware of Poiseuille.
  - The first derivation from Navier–Stokes with no slip is usually credited to **Hagenbach (1860)**, who also named it Poiseuille's law. **Jacobson (1860)** published another, based on Franz Neumann's lectures. Helmholtz (1860), Stefan (1862) and Mathieu (1863) followed.
  - Poiseuille's constant reproduces modern water viscosity to about 0.1% (Bingham 1922, cited by Sutera & Skalak).

Judgments on the specific phrases:
- "measuring blood flow through fine glass capillaries": **wrong.** He measured water.
- "The equation reproduced the dependence measured in the capillaries, giving the viscous term a direct experimental test": **the physics is fair, the implied chronology is not.** The fit was retrospective: the measurements came in 1838–46 and the derivation in 1860. The derivation also required the no-slip wall, so the test was of the viscous term plus no-slip, not the viscous term alone. It was one of the cleanest confirmations. Positioned after Stokes 1851 and labelled "first exact laboratory triumph", it implies a prediction confirmed by measurement, when in fact the equation explained data taken first. Describing the flow as "in the capillaries" is fine if the text says water.
- "nothing to do with any of the five": roughly fair. Stokes did write the pipe solution in 1845 but did not fix the wall condition or compare it with Poiseuille. The phrase may be kept.

**Minimal content:**
- Poiseuille, a physician studying circulation, measured **water** in glass tubes 0.015–0.6 mm wide (1838–1846).
- Hagen, a Berlin hydraulic engineer, got the same D⁴ law independently in brass tubes (1839), and published first.
- Both results were empirical.
- The fourth-power law was derived from Navier–Stokes with a non-slipping wall only around 1860 (Hagenbach; Neumann/Jacobson). The equation then matched the earlier measurements, testing the viscous term together with no-slip.

## 2. Navier's slip "survives in one place: channels a few nanometres wide" (lines 508-509; see also 439-442)

**Verdict: overstated. "One place" is wrong, and "a few nanometres" is too narrow.**
Main source: Lauga, Brenner & Stone, "Microfluidics: the no-slip boundary condition", *Springer Handbook of Experimental Fluid Mechanics* (2007), §19.1. https://www.damtp.cam.ac.uk/user/lauga/papers/19.pdf

- Navier's linear slip condition (slip velocity ∝ wall shear, set by a slip length λ) "remains the standard characterization of slip used today". Maxwell (1879) proposed it again for gases. [AUDITED secondary]
- Established settings where slip matters:
  - **Rarefied gas flow** when the Knudsen number reaches about 0.1. Maxwell 1879, *Phil. Trans.* 170: 231–256. https://royalsocietypublishing.org/rstl/article/doi/10.1098/rstl.1879.0067/119127/
  - **Polymer and other non-Newtonian fluids**, where apparent slip occurs.
  - **Moving contact lines**, where slip removes the stress singularity.
  - **Newtonian liquids on hydrophobic or smooth surfaces**, with measured slip lengths of about 1 nm–1 µm. Surface-force-apparatus work supports no-slip down to a few nm on wetting surfaces.
- Water in carbon nanotubes shows radius-dependent slip lengths of hundreds of nm. Secchi et al., *Nature* 537 (2016). https://www.nature.com/articles/nature19315. Bocquet & Charlaix, *Chem. Soc. Rev.* (2010), is the standard nanofluidics review.
- Minor point on "decades-old argument" settled by 1851: Stokes was "quite sure" of no-slip by 1851 (Sutera & Skalak p. 12). But the debate ran through the 19th century (Couette, Helmholtz, Maxwell, and others, per Lauga §19.1). "**settled**" by Stokes 1851 is **overstated**. Something like "Stokes adopted no-slip, and the pendulum data supported it" is accurate.

**Minimal content:**
- For ordinary liquids at ordinary scales, no-slip holds to within nanometres.
- Navier's slip-length condition is still the standard model wherever slip does matter: rarefied gases (Maxwell 1879), water on hydrophobic surfaces and in carbon nanotubes (slip lengths from nm up to hundreds of nm), polymer melts, and moving contact lines.
- Keep "survives", drop "in one place".

## 4. Other dated claims spot-checked

Checked and fine, no action:
- Navier dead nine years (d. 1836); 23 years 1822→1845.
- Torricelli 1643, 760 mm.
- Périer 19 Sep 1648, 3 in 1.5 lines ≈ 8.5 cm (3 pouces ≈ 81 mm + 1.5 lignes ≈ 3.4 mm).
- Hydrodynamica 1738.
- Hydraulica backdated to 1732, per MacTutor: https://mathshistory.st-andrews.ac.uk/Biographies/Bernoulli_Johann/
- d'Alembert string 1747.
- Euler 1757.
- Stokes 1845/1851.
- Reynolds 1883/1895; Sommerfeld 1908; Stokes aged 63 as referee.
- Prandtl aged 29 in Aug 1904.
- 1687→1904 = 217 years.
- Richardson 1922, 64,000 computers.
- Harlow–Welch 1965, Chorin 1968, Stam 1999.
- Grant–Stewart–Moilliet 1962: the paper gives ship length 217 ft, tides up to 15 knots, and Re = 2.8×10⁸ for a 12-knot tide (versus a pipe at 5×10⁵, so about 2.7 orders of magnitude, and "three orders" is fair). https://www.damtp.cam.ac.uk/user/tong/fluids/vancouver.pdf

Real problems, ordered by importance:
1. **Ladyzhenskaya "later fenced off the flat world" (lines 722-726): credit is incomplete.** Leray's 1933 thesis already proved global well-posedness for 2D flow in the whole plane. Ladyzhenskaya (1958–59) extended global existence, uniqueness and regularity to bounded 2D domains, and her inequality is the standard tool. Source: Ożański & Pooley's review of Leray 1934, https://arxiv.org/abs/1708.09787. Minimal fix: "Leray (for the plane) and Ladyzhenskaya (for bounded domains, 1959) showed 2D is smooth."
2. **"Stokes's 1851 analysis … settled a decades-old argument about the wall" (lines 507-508): overstated.** See §2 above.
3. **Cauchy "entered the argument in 1823" (line 451): soft.** He presented the stress concept to the Académie on 30 Sep 1822, and the summary appeared in 1823. I could not confirm online that he refereed Navier's 1821 elastic-solids memoir. Darrigol's *Worlds of Flow* is the place to check. "1822" is safer.
4. **Berlin prize "Its 1749 prize" (line 332): minor.** The question was set in 1748 and d'Alembert submitted in 1749. The competition is usually called the prize for 1750. Source: Grimberg, Pauls & Frisch, "Genesis of d'Alembert's paradox", https://arxiv.org/abs/0801.3014. Acceptable as written, though "1749 competition" or "the prize question of 1748" is more precise.

Not verified (flag only):
- Kolmogorov submission dates (28 Dec 1940 and 30 Apr 1941).
- The "calculations fail in Paris" newspaper quote.
- Richardson's "six weeks".
- Prandtl's talk on 12 Aug rather than another congress day (Anderson 2005 is the source used; not re-read).

## Honest gaps

- The Nature news piece (paywalled) was not read, and neither was the OpenAI blog page (403). The OpenAI claim is taken from its own PDF plus Clay, Quanta, Tao and Wikipedia.
- No independent verification of the OpenAI proof exists yet. Treat it as CLAIM plus Clay's provisional "apparently settled".
- The Quanta quote attributed to "Feffinger" needs checking before anyone quotes it.
- Primary Poiseuille and Hagen texts were not read; I relied on Sutera & Skalak, who quote them.
