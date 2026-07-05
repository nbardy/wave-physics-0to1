# RESEARCH — The History of Navier–Stokes: Who Built What, and When

Subject-matter grounding for the history lesson (`articles/03-navier-stokes-history/PLAN.md`), the
partner to lesson 01. Lesson 01 assembles the equation *pedagogically*, term by term;
this lesson tells how humanity assembled it *historically*, name by name — and the two
orders turn out to be nearly the same, because history was also driven by visible
failures. Citations are inline here (research doc); the lesson itself quarantines
sources to Further Reading per the house anti-checklist.

The organizing facts, up front:

1. **Writing the equation took ~160 years** (Newton's viscosity hypothesis, 1687 →
   Stokes's derivation, 1845).
2. **It was discovered at least five times, independently**: Navier (1822), Cauchy
   (1823), Poisson (1829), Saint-Venant (1837), Stokes (1845) — each ignoring or
   criticizing his predecessors ([Bistafa, *200 Years of the Navier–Stokes Equation*,
   arXiv:2401.13669](https://arxiv.org/abs/2401.13669); the definitive scholarly
   treatment is Olivier Darrigol, *Worlds of Flow*, OUP 2005).
3. **Its central paradox stood for 152 years** (d'Alembert 1752 → Prandtl 1904) and
   was resolved in a ten-minute conference talk.
4. **Understanding it is still open**: whether smooth 3D solutions always exist is a
   Clay Millennium Prize problem (announced May 2000, problem statement by Charles
   Fefferman, [claymath.org](https://www.claymath.org/millennium-problems/)).

---

## 1. Prehistory — what antiquity could and couldn't do

**Archimedes, *On Floating Bodies* (c. 250 BC)** — hydro*statics* solved: buoyancy,
floating equilibrium, pressure balance in still fluid. The toolkit is exact and it
dies the moment the water moves.

**Leonardo da Vinci (c. 1500–1513)** — the great observer of moving water. His
notebooks (Codex Leicester and the Windsor water studies) contain hundreds of drawings
of eddies, wakes, and hydraulic jumps; he used and effectively named the phenomenon
***la turbolenza***. He could *draw* what nobody could write for another three
centuries — his sketches of vortices behind obstacles are recognizably the wake our
lesson-01 cylinder sheds. Story asset: turbulence had a name ~340 years before it had
an equation, and ~400 before it had a number (Reynolds).

**Evangelista Torricelli (1643–44)** — the mercury barometer; "*Noi viviamo sommersi
nel fondo d'un pelago d'aria*" — we live submerged at the bottom of an ocean of air.
Pressure becomes a measurable thing. **Blaise Pascal (1648)** — the Puy-de-Dôme
experiment (run by his brother-in-law Périer): the mercury column drops with altitude,
so pressure is the weight of the fluid above; plus Pascal's law of pressure
transmission. Between them, the *pressure* character of our story gets its birth
certificate — as a static quantity. Its dynamic role (the instant fixer of lesson 01
§10) waits for Euler.

## 2. Newton, 1687 — the first guess and the first public miss

*Principia*, Book II — the book about motion in resisting media, the least-read and
most-wrong book of the three, and the founding document anyway.

- **The viscosity hypothesis** (Book II, Section IX): "The resistance arising from
  the want of lubricity in the parts of a fluid … is proportional to the velocity
  with which the parts of the fluid are separated from one another." That sentence
  *is* the definition of a Newtonian fluid: shear stress ∝ velocity gradient — the
  content of lesson 01 §6, stated as a hypothesis 158 years before it sat correctly
  inside an equation of motion.
- **The corpuscular drag model**: Newton computed resistance by imagining independent
  particles bombarding the front of a body — no collective flow, no wake. It gives
  drag laws that are quantitatively wrong for ordinary fluids (though, in a good
  irony, roughly right again for hypersonic rarefied flow).
- **The speed of sound** (Book II, Props. 48–50): the first prediction of a wave speed
  from mechanics — and it came out ~15% low (~979 ft/s vs. the measured ~1142 ft/s),
  because Newton assumed the compressions were isothermal. He papered over the gap
  with fudge factors ("crassitude" of air particles). **Laplace (1816)** supplied the
  adiabatic correction, √(γ) ≈ 1.18, closing the gap exactly. For a wave-physics
  course this is a gift: the very first act of the fluid-equation story is a *wave
  calculation*, wrong for a subtle thermodynamic reason.

## 3. The Bernoullis, 1738 — energy in pipes, and the ugliest priority dispute in science

**Daniel Bernoulli, *Hydrodynamica* (1738)** — coined the word "hydrodynamics";
established the pressure–velocity tradeoff along a flow (energy bookkeeping in pipes
and orifices); Chapter 10 contains a kinetic theory of gases a century early. What it
is *not*: a general equation of motion. It is conservation accounting along a tube —
powerful, but it cannot tell you what a fluid does in the open, and it knows nothing
of friction.

**Johann Bernoulli, *Hydraulica* (dated 1732, actually written c. 1739)** — Daniel's
father published his own treatise and **backdated it** to before his son's, to claim
priority. Daniel to Euler: "I am robbed of my entire Hydrodynamics, of which I truly
did not owe one iota to my father." (The episode is standard in the historical
literature, e.g. Truesdell's editorial essays and Darrigol.) Story asset: the field's
founding book provoked history's worst case of scientific parental theft — and the
judge in the middle of it was Euler, both men's correspondent, about to supersede both.

House note: lesson 01 *omits Bernoulli's principle* deliberately (attractive wrong
frame). This lesson keeps the omission for the physics but tells the *story* — the
principle appears as a historical character, not as an explanatory tool.

## 4. d'Alembert — the wave equation, then the zero

**1747: the vibrating string.** D'Alembert derived and solved the one-dimensional wave
equation for a plucked string (Mémoires of the Berlin Academy) — the first partial
differential equation of physics, and the literal founding equation of this course.
The tools that will write the fluid equations are invented *for a wave problem*.

**1749–1752: the paradox.** Applying the new calculus of PDEs to steady flow of an
ideal (frictionless, incompressible) fluid past a body, d'Alembert proved the drag is
**exactly zero** — fore-aft pressure symmetry, no net force ("Essai d'une nouvelle
théorie de la résistance des fluides," 1752, developed from his 1749 Berlin Academy
prize entry; the Academy declined to award the prize, in part because theory and
experiment disagreed so badly). His later verdict (*Opuscules*, 1768): "a singular
paradox which I leave to future Geometers to elucidate"
([overview](https://en.wikipedia.org/wiki/D%27Alembert%27s_paradox)).

This is the **central manufactured problem of the whole story**, supplied by history
itself: the best theory of the age proves that ships need no sails and birds cannot
be held up — perfect theory, absurd conclusion. It stands 152 years.

## 5. Euler, 1757 — the field, the pressure, the equations (minus one term)

**"Principes généraux du mouvement des fluides"** (Mémoires de l'Académie de Berlin,
1757; part of a 1755–57 trilogy with the continuity paper). Euler's contributions are
exactly the conceptual moves of lesson 01 §§2–4 and §8:

- **The velocity field** u(x, y, z, t) — describing the flow at fixed points rather
  than following individual bodies. (Both the "Eulerian" and the so-called
  "Lagrangian" descriptions are in fact Euler's; the naming is a historical accident.)
- **Internal pressure as a field** p(x, y, z, t) acting within the fluid, not just on
  walls — the character Torricelli and Pascal met only at rest, now dynamic.
- **Newton's second law per parcel**, yielding the **Euler equations**: ∂u/∂t +
  (u·∇)u = −∇p/ρ (+ gravity), plus ∇·u = 0. Every term of lesson 01's final equation
  except the green one.

Euler knew what was missing. He explicitly set aside friction, and famously located
the remaining difficulty in the mathematics: if we cannot fully grasp fluid motion,
he wrote, it is not mechanics or the principles that fail us but *analysis itself*.
D'Alembert's paradox survives Euler untouched — an ideal-fluid theory, however
beautiful, still predicts zero drag.

## 6. Navier, 1822 — the missing term, from imaginary molecules

**Claude-Louis Navier** (1785–1836): not a professor of mathematics but a *bridge
engineer* — star of the École des Ponts et Chaussées, editor of the standard
engineering texts of his day. Biographical asset with a cruel edge: his showcase
suspension bridge over the Seine, the Pont des Invalides, developed cracks (a burst
sewer undermined an anchorage) and was abandoned in 1826, to public mockery — the man
who wrote the law of water couldn't finish his bridge across it. (See the bicentenary
review [*From Navier to Stokes*, Fluids 9(1):15, 2024](https://www.mdpi.com/2311-5521/9/1/15)
and [Bistafa, arXiv:2401.13669](https://arxiv.org/abs/2401.13669).)

**"Mémoire sur les lois du mouvement des fluides"** — read to the Académie des
Sciences on **March 18, 1822**; published in the Mémoires in 1827. Navier modeled a
fluid as molecules exerting velocity-dependent attractions and repulsions on their
neighbors, summed the interactions Laplace-style, and out fell the Euler equations
**plus a new term: ε∇²u** — the viscous diffusion of momentum, lesson 01 §6's green
Laplacian, exactly right.

The catch, and the lesson's honest beat: **the derivation's physics was fiction**
(the molecular model was wrong in detail; the coefficient ε was a molecular constant
Navier could neither measure nor connect to any tabulated property of a real liquid),
yet **the term was right**. Right equation, wrong reasons — a standing rebuke to the
tidy picture of scientific method.

## 7. 1822–1845 — discovered five times; the eponymy lottery

The same equation was then re-derived, essentially independently, four more times —
each author dissatisfied with the foundations of the last
([Bistafa](https://arxiv.org/abs/2401.13669); Darrigol, *Worlds of Flow*):

| Year | Who | Route | Fate in the name |
|---|---|---|---|
| 1822 | **Navier** | molecular forces | first name |
| 1823 | **Cauchy** | general stress principle | got the *stress tensor* named instead |
| 1829 | **Poisson** | elastic-molecular, compressible | a different equation bears his name |
| 1837 | **Saint-Venant** | viscous stress ∝ strain rate, continuum (published 1843) | nothing — beaten to eponymy by both ends |
| 1845 | **Stokes** | continuum, linear isotropic stress–rate-of-strain | second name |

- **Cauchy (1822–28)**: invented the **stress tensor** and the general momentum
  equation of a continuum (the Cauchy momentum equation) — the conceptual container
  into which any material's constitutive law can be dropped. The deepest single
  contribution in the table, arguably.
- **Saint-Venant (1837, pub. 1843)**: the first fully *continuum* derivation with the
  modern reading — internal shear stress proportional to the rate of transverse
  strain — two years before Stokes, and he even acknowledged predecessors, which none
  of the others did. He is the great eponymy casualty of physics (consolation: the
  shallow-water equations are his).
- **Stokes (1845)**: "On the Theories of the Internal Friction of Fluids in Motion"
  (Trans. Camb. Phil. Soc.) — the derivation modern textbooks teach: pure continuum
  assumptions (linearity, isotropy, no molecular story needed), careful treatment of
  boundary conditions. Stokes then made the equation *earn its keep*: his 1851
  pendulum memoir derived **Stokes drag** F = 6πμRU for a slow sphere and matched
  pendulum data, turning ν from a fudge factor into a measured property of air and
  water — and settling the **no-slip condition** (fluid sticks to walls), which had
  been genuinely controversial for decades.
- **Navier and Stokes never met, never corresponded**: 23 years apart, opposite sides
  of the Channel; Navier died in 1836, nine years before Stokes's paper. The
  ampersand in "Navier–Stokes" was installed by posterity (the joint name becomes
  standard only in the 20th century).

**First quantitative triumph — pipe flow.** Physician **Jean Poiseuille** (experiments
1838–46, on capillary tubes, motivated by blood flow) and engineer **Gotthilf Hagen**
(1839, brass pipes) independently found the law Q ∝ r⁴Δp/L. Deriving it from the new
equation (done cleanly by the 1850s–60s, Wiedemann/Hagenbach) gave exact agreement —
the equation's first laboratory verification, courtesy of a doctor measuring blood.

## 8. Reynolds, 1883 — one number decides

**Osborne Reynolds, "An Experimental Investigation of the Circumstances Which
Determine Whether the Motion of Water Shall Be Direct or Sinuous…"** (Phil. Trans.
1883). The iconic apparatus: a glass tube drawing water from a tank, a filament of
dye down its axis. At low speed the filament runs straight the length of the tube
("direct" flow); past a threshold it erupts into eddies and mixes ("sinuous" flow) —
and, in Reynolds's flash-illuminated view, resolves into "a mass of more or less
distinct curls, showing eddies." The transition is governed not by speed, size, or
viscosity separately but by their single combination **UL/ν** — dimensionless,
apparatus-independent (transition near ~2000 in his tubes, though with care he
delayed it to ~13,000, showing the transition's sensitivity to disturbances).

- The name "**Reynolds number**" is not Reynolds's: **Arnold Sommerfeld** coined it
  ("Reynolds'sche Zahl") in his 1908 Rome ICM lecture.
- **Reynolds 1895**: splitting the velocity into mean + fluctuation, u = ū + u′, and
  averaging the equation — Reynolds averaging, the founding move of practical
  turbulence modeling (RANS), and the confession built into it: above transition we
  stop computing the flow and start computing its *statistics*.

This section is the historical twin of lesson 01 §7 (the Re slider), and the lesson-01
sim family recreates the 1883 apparatus almost verbatim.

## 9. Prandtl, 1904 — ten minutes in Heidelberg

**August 12, 1904, Third International Congress of Mathematicians, Heidelberg:**
Ludwig Prandtl — 29 years old, then at the Technische Hochschule Hannover — delivers a
**ten-minute talk**, "Über Flüssigkeitsbewegung bei sehr kleiner Reibung" ("On fluid
motion with very small friction"), about eight pages in the proceedings
([Anderson, "Ludwig Prandtl's Boundary Layer," *Physics Today* 58(12), 2005](https://pubs.aip.org/physicstoday/article-abstract/58/12/42/394694)).

The idea: at high Reynolds number, friction does not disappear — it **hides in a thin
layer** against the surface (the boundary layer), where the velocity drops from the
free-stream value to zero (no-slip) across a distance that shrinks like 1/√Re.
Outside the layer, Euler's ideal theory is essentially correct; inside it, viscosity
rules; and the layer can **separate**, shedding vorticity into the wake. Separation
breaks the fore-aft pressure symmetry — and with it, **d'Alembert's paradox, standing
since 1752, dissolves**: the ideal theory wasn't wrong, it was wrong *in a
sliver*, and the sliver controls the drag.

Consequences cascade: Blasius's flat-plate solution (1908), **von Kármán's vortex
street** (1911 — the very street lesson 01's hero sheds; Henri Bénard had photographed
it in 1908), Prandtl's wing theory, and the entire discipline of aerodynamics. The
resolution of the paradox by a thin layer is also the historical justification for
lesson 01's no-slip contract.

## 10. The equation outruns its authors — turbulence and the open problem

- **Richardson, 1922** — *Weather Prediction by Numerical Process*: attempted a
  6-hour pressure forecast **by hand** (it failed spectacularly — a predicted rise of
  ~145 mb, absurd, due to unbalanced initial data); imagined a "forecast factory" of
  64,000 human computers; and left the cascade in verse: "Big whirls have little
  whirls that feed on their velocity, and little whirls have lesser whirls and so on
  to viscosity." The poem is a correct physical theory in rhyme.
- **Leray, 1934** — "Sur le mouvement d'un liquide visqueux emplissant l'espace"
  (Acta Mathematica): global-in-time **weak solutions** in 3D, which he pointedly
  called *solutions turbulentes* — allowing for the possibility that smoothness fails.
  Whether it ever actually does is precisely what remains open.
- **Kolmogorov, 1941** — the statistical theory of the cascade (K41): universal
  small-scale statistics set by the dissipation rate alone; the 2/3 structure-function
  law and the −5/3 energy spectrum (the spectral form via Obukhov, same year). The
  awe-fact: the theory says the *statistics* of stirred coffee and of a galaxy's gas
  share the same exponent.
- **Ladyzhenskaya (1950s)** — in two dimensions, global existence, uniqueness, and
  smoothness are theorems. The whole difficulty is the third dimension (vortex
  stretching).
- **Clay Millennium Prize, May 2000** — "Navier–Stokes existence and smoothness,"
  problem statement by Charles Fefferman
  ([claymath.org](https://www.claymath.org/millennium-problems/)): prove (or refute)
  that smooth, finite-energy 3D solutions exist for all time. $1M, unclaimed.
  **Tao (2016)** proved finite-time blowup for an *averaged* version of the equation
  — evidence the question is hard for a structural reason, not lack of cleverness.

## 11. The machine age — the lesson-01 solver as the newest chapter

- **1950**: the first computerized weather forecast (Charney, Fjørtoft, von Neumann,
  on ENIAC) — Richardson's factory, realized in vacuum tubes.
- **1965**: **Harlow & Welch, the MAC method** (Los Alamos T3 group) — the staggered
  grid and pressure treatment underlying most incompressible solvers since.
- **1968**: **Chorin's projection method** — advance velocity ignoring the constraint,
  then project onto divergence-free fields by solving the pressure Poisson equation.
  This *is* lesson 01 §10–12, published sixty years ago.
- **1999**: **Jos Stam, "Stable Fluids"** (SIGGRAPH) — unconditionally stable
  semi-Lagrangian advection + projection
  ([PDF](https://www.dgp.toronto.edu/people/stam/reality/Research/pdf/ns.pdf)); the
  exact algorithm running lesson 01's hero figure. The ring for the whole pair of
  lessons: the reader's toy is this history's latest sentence.

## 12. The mathematical sub-blocks — where the tools themselves came from

The equation could not be written until its mathematics existed; each block has its
own history, and several arrived *because of* the fluid problem, not before it.

- **Calculus (1665–87 / 1684)** — Newton had fluxions but wrote the *Principia*
  geometrically; the notation that made continuum mechanics *writable* was
  **Leibniz's**, spread by **Johann Bernoulli** (who taught it to both l'Hôpital and
  Euler). The Newton–Leibniz priority war had a real casualty: British mathematics
  clung to fluxion notation for a century, which is a large part of why the
  1687→1845 story is Swiss/French/German until its very last chapter. Cambridge only
  re-imported continental calculus in the 1810s (the Analytical Society — Babbage,
  Herschel, Peacock — campaigning for "the principles of pure d-ism against the
  dot-age of the university"). **Stokes was a direct beneficiary**: he belonged to
  the first Cambridge generation trained in continental methods, one generation
  after they arrived. No Analytical Society, plausibly no Stokes 1845.
- **Partial differential equations (1747–1750s)** — did not exist before
  d'Alembert's vibrating string; Euler immediately generalized the machinery. So the
  PDE, as a mathematical object, is *native to wave physics* — fluids didn't borrow
  the tool, the tool was invented next door and both problems share a birth decade.
- **The vibrating-string controversy (1747–1770s)** — d'Alembert, Euler, and Daniel
  Bernoulli publicly fought over what counts as a *solution*: d'Alembert's arbitrary
  functions vs. Daniel's trigonometric series. Nobody won; the fight was settled two
  generations later by **Fourier (1807/1822)**, whose heat-equation analysis made
  series-of-modes rigorous enough to use. This is the wave course's own founding
  quarrel, and it feeds the fluid story directly (next bullet).
- **The Laplacian / diffusion operator** — potential theory grew in *celestial*
  mechanics (Laplace's equation, 1780s); the **∇² as smoothing-toward-neighbors**
  reading that lesson 01 §6 teaches is the mathematics of **Fourier's heat
  conduction (1807/1822)**. The personal link is direct: **Fourier was Navier's
  mentor and friend** (Navier was his protégé and later his literary executor's
  circle). Navier's viscous term is formally the heat operator applied to momentum —
  invented one desk away.
- **The stress tensor (1822)** — Cauchy's answer to "what is force *inside* a
  material?", provoked by refereeing **Navier's own 1821 elasticity memoir**. Linear
  algebra of stress before the word "tensor" existed (Voigt coins it in 1898). This
  is the container concept: once you have Cauchy's tensor, *any* material is one
  constitutive law away from an equation of motion — fluids, elastic solids, and
  eventually general relativity's stress-energy all live in it.
- **Vector notation (1880s–1900s)** — the form everyone recognizes, with ∇, div, and
  curl, is **younger than the equation by ~60 years**: Hamilton's quaternions
  (1843) → Gibbs's and Heaviside's vector calculus (1880s–90s). Navier, Poisson,
  Saint-Venant, and Stokes all wrote three separate scalar component equations. The
  compact $\partial_t\mathbf{u} + (\mathbf{u}\cdot\nabla)\mathbf{u} = -\nabla p/\rho
  + \nu\nabla^2\mathbf{u}$ is a *20th-century typographical object* — even the
  equation's familiar *face* had to be discovered.
- **Dimensional analysis** — implicit in Stokes 1851, explicit in Reynolds 1883,
  systematized only in 1914 (Buckingham's Π theorem). $Re$ predates the general
  theory of dimensionless groups by thirty years.
- **Functional analysis (1900s–30s)** — Lebesgue integration (1902) and the ideas
  that became Sobolev spaces and distributions. **Leray (1934) essentially invented
  weak derivatives for this problem** — Sobolev's papers came after (1936–38),
  Schwartz's distributions a decade later. The equation didn't just consume
  mathematics; at both ends of its life (PDEs at birth, weak solutions in old age)
  it *generated* the mathematics that studies it.

## 13. The network — who met whom, who read whom, who refused

The story is not a relay of strangers; it is three tight clusters and one hermit.

**Cluster 1 — Basel/St. Petersburg/Berlin (1720s–1760s).** Johann Bernoulli taught
Euler (Basel). Daniel Bernoulli and Euler were close friends and daily colleagues at
the St. Petersburg Academy (1727–33) and corresponded for forty years — hydrodynamics
gestated *inside that correspondence*, and it's to Euler that Daniel mailed the "I am
robbed of my entire Hydrodynamics" complaint about his own father. Euler and
d'Alembert were wary rivals who read each other closely: Euler's Berlin Academy
effectively judged (and declined to award) d'Alembert's 1749 resistance essay —
d'Alembert felt robbed and feuded for years — and Euler's 1757 equations visibly
build on d'Alembert's methods with less credit than d'Alembert wanted. So *both*
foundational documents (Bernoulli's and d'Alembert's) arrive wrapped in a priority
grievance, with Euler as the common correspondent, judge, and beneficiary.

**Cluster 2 — Paris, 1820s–40s.** Navier, Cauchy, Poisson, Fourier, and (a
generation younger) Saint-Venant all orbited the same three institutions: the
Académie des Sciences, the École Polytechnique, and the Ponts et Chaussées. They did
not merely fail to cite each other — they argued in person and in print: Cauchy's
stress theory was sparked while refereeing Navier's elasticity memoir; **Navier and
Poisson fought a public polemic (1828–29)** over molecular vs. continuum foundations
(the exact fault line the equation's five derivations straddle); Saint-Venant's 1834
memoir sat unpublished at the Académie for years (hence his priority date, 1837, and
his consolation note of 1843). The five derivations were not five isolated flashes —
within Paris they were **one continuous argument** about what a fluid *is*.

**The hermit — Stokes (Cambridge, 1840s).** Stokes derived his equations essentially
alone and discovered the French literature *afterwards* — his 1845 paper opens by
acknowledging that Navier, Poisson, and Saint-Venant got there first, and proceeds
anyway, because his continuum route (no molecules) was the one worth keeping. The
Channel, plus a century of notational schism (§12), had made two separate worlds.

**The bridge — Stokes to Reynolds.** Stokes, as Secretary of the Royal Society,
was the referee who handled **Reynolds's 1883 dye paper**; the dimensionless group
Reynolds isolated already appears embryonically in Stokes's own 1851 pendulum memoir.
The two men close the loop between "the equation as written" and "the equation as it
behaves" across a thirty-year mentorship-at-a-distance.

**The fateful ten minutes — Prandtl to Göttingen.** In the Heidelberg audience for
Prandtl's 1904 talk sat **Felix Klein**, who recognized what he'd heard and recruited
Prandtl to Göttingen that same year. Everything downstream — Blasius, von Kármán,
the Göttingen school, modern aerodynamics — flows through that single act of
listening. (Eckert and Bodenschatz–Eckert document the scene.)

**Turbulence's odd couple.** Richardson (Quaker pacifist, ambulance driver, wrote
the cascade as a poem) and Kolmogorov (Moscow probabilist) never met; K41 is the
poem made rigorous, via Obukhov, Kolmogorov's student. Garnish: **Heisenberg's 1923
doctoral thesis, under Sommerfeld, was on turbulence** — the man who made
uncertainty a principle cut his teeth on the equation that still keeps one.

## 14. The gaps ledger — what stayed undiscovered, and for how long

| The missing piece | Stated / needed | Landed | Gap |
|---|---|---|---|
| viscosity law → sitting in an equation of motion | 1687 (Newton's hypothesis) | 1822 (Navier) | **135 yr** |
| a law of motion for fluids at all | 1687 (*Principia*) | 1757 (Euler) | 70 yr |
| the drag paradox → its resolution | 1752 (d'Alembert) | 1904 (Prandtl) | **152 yr** |
| the boundary condition (slip vs. no-slip) | 1822 (Navier proposes *slip*) | ~1850s (Stokes + Poiseuille data settle no-slip) | ~30 yr of open controversy |
| trusting the equation (five derivations to consensus) | 1822 | ~1850s (Stokes drag + Poiseuille match) | ~30 yr |
| what the vorticity does | 1757 (implicit in Euler) | 1858 (Helmholtz's vortex theorems) | 100 yr |
| when flow goes turbulent | known to everyone forever | 1883 (Reynolds's number) | — |
| the equation's familiar vector *form* | 1845 (content complete) | ~1900s (Gibbs–Heaviside notation adopted) | ~60 yr |
| the joint name "Navier–Stokes" | 1845 | early 20th century usage | ~60–80 yr |
| does a solution even *exist*? | 1822 (question implicit) | 1934 (Leray, weak; 3D smooth **still open**) | **112 yr → 204 yr and counting** |

Two footnotes with modern teeth: Navier's "wrong" slip boundary condition was
rehabilitated — slip lengths are real and measured in **microfluidics and
nanochannels**, so the 1822 controversy is current research again; and the
molecular-vs-continuum fault line of the Paris polemics is exactly the modern
boundary between molecular dynamics and continuum CFD.

## 15. Story assets — quotes, numbers, ironies (collected for the plan)

- Timeline spine: **1687** Newton's hypothesis → **1738/39** the Bernoulli theft →
  **1747** the wave equation → **1752** the zero → **1757** Euler's field →
  **1822** Navier's term → **1823/29/37/45** the rediscoveries → **1883** Reynolds's
  dye → **1904** Prandtl's ten minutes → **1934** Leray's warning → **1941** K41 →
  **2000** the bounty → **1999→today** the reader's solver.
- Ironies, ranked: the equation named for the first and last of five discoverers who
  never met; the term derived correctly from wrong physics; the paradox resolved not
  by fixing the equation but by looking at a sliver; the father who backdated a book
  against his son; the physician and the bridge engineer as experimental and
  theoretical founders; turbulence named by a painter.
- Numbers as dessert: 152 years of paradox; five derivations; ten minutes / ~8 pages;
  64,000 imagined human computers; a 145-millibar forecast bust; $1,000,000 unclaimed
  after a quarter century; r⁴ in a capillary.
- The one-sentence thesis: *lesson 01's pedagogical order (field → advection →
  viscosity → pressure → constraint → solver) is, almost move for move, the
  historical order — because history, like the lesson, advanced by watching the
  current theory fail visibly.*

## 16. Sources

Primary modern scholarship, for Further Reading candidates:

- **Olivier Darrigol, *Worlds of Flow: A History of Hydrodynamics from the Bernoullis
  to Prandtl*** (Oxford, 2005) — the definitive history; source of the
  five-derivations framing.
- **Michael Eckert, *The Dawn of Fluid Dynamics*** (Wiley, 2006) — Prandtl,
  Göttingen, and the boundary-layer century.
- **John D. Anderson Jr., "Ludwig Prandtl's Boundary Layer,"** [*Physics Today* 58(12)
  42–48 (2005)](https://pubs.aip.org/physicstoday/article-abstract/58/12/42/394694).
- **Sylvio Bistafa, "200 Years of the Navier–Stokes Equation,"**
  [arXiv:2401.13669](https://arxiv.org/abs/2401.13669) — bicentenary survey with the
  derivation-by-derivation chronology; companion piece
  [*From Navier to Stokes*, Fluids 9(1):15 (2024)](https://www.mdpi.com/2311-5521/9/1/15).
- **O. Reynolds (1883)**, Phil. Trans. R. Soc. 174 — open access at the Royal Society;
  the dye-experiment plates are reproducible as figures.
- **C. Fefferman, "Existence and Smoothness of the Navier–Stokes Equation"** — the
  official [Clay problem statement](https://www.claymath.org/millennium-problems/).
- **J. Stam, "Stable Fluids"** (SIGGRAPH 1999) — already in lesson 01's Further
  Reading; here it re-enters as *history*.
