# CONCEPT BANK — designed, assessed, unused

Ideas that were fully worked out during article sessions but lost to a better
candidate. Each was judged viable when cut; steal freely. (Lesson-04's 3D
wind-tunnel car is NOT here — it has its own DENSE_CORE.)

## M2 candidate — "Why the Walker Settles" (Markov chains, detailed balance, mixing)

Banked 2026-08-05, from the p-bit series' scope question "does Gibbs deserve
its own breakdown?" Verdict: Gibbs-the-move is simple and stays inside Part 1
(`physics-02-pbits`); Gibbs-the-guarantee is the real article — the theory the
series proves only empirically. Maths field, optional-depth sibling that Part 1
links to once; the series must never depend on it.

Content: why conditional resampling converges at all (detailed balance,
ergodicity — with the proof that synchronous updating violates it, which
Part 1 only *measures*); how fast (mixing time, spectral gap, the story under
the dashboard's autocorrelation column); the family (Metropolis–Hastings with
Gibbs as the always-accept case); blocked/collapsed variants. Instruments
mostly exist: the p-bit StateGraph is the mixing figure awaiting a spectral
overlay, the exact-ghost meter is the oracle, and the never-built
detailed-balance ledger figure (reader balances a two-state transaction book
by hand — designed as variant C §4 in `articles/05-pbits/OUTLINES.md`, cut in
the merge) is the natural centerpiece. Cost: low-to-medium — prose and two or
three new overlays on built steppers.

## Hero visuals (from the lesson-01 hero exploration, 2026-07-05)

- **Nature versus browser.** A public-domain NASA photo of a Kármán vortex
  street in clouds off Guadalupe or Jeju Island, side by side with the live sim
  tuned to matching geometry — a photograph from space and a computation in the
  browser, same rhythm. The buried gold: atmospheric stratification is what
  makes island wakes quasi-two-dimensional, so **the atmosphere fakes 2D the
  same way our solver does** — it turns the "flows here are 2D" confession into
  an earned, delicious fact. Strong candidate for lesson 03 (history) or any
  turbulence lesson. Cost: one static asset + existing sim.
- **Stir your own cup.** Top-down circular cup, blob of cream dye, the reader's
  finger is the spoon (drag impulses already exist — `.sim-stir`). The most
  familiar fluid gesture a human performs, done by the reader's hand as the
  FIRST act of an article. Needs a circular boundary mask on the solver
  (modest). Cut for lesson 01 because the wing carried the prose; still the
  best "your hand is the physics" opener available.
- **Honey/water twin panes.** Same obstacle, same inflow, two panes at Re
  differing ~1000×: left bows glassily and rejoins, right sheds the street. Two
  solver instances at half grid each. Cut as hero; works anywhere the
  viscosity contrast needs to be *simultaneous* instead of slider-sequential.

## Intros (drafted in full, house voice, for lesson 01)

- **The morning experiment.** "You ran today's experiment before breakfast" —
  milk into coffee, no two pours in your lifetime ever matched, no computer on
  Earth can predict your next cup exactly, but the equation says completely
  *why* it curls. Pairs with the stirred-cup hero. Strongest personal hook of
  the four; lost to the wager only because the wing hero owned the page.
- **Honey and water.** Tip a glass of water and a jar of honey off the same
  table: the water shatters into spray, the honey lowers itself in one
  unbroken amber rope "as if the fall were its own idea." Both obey the same
  equation; the entire difference is one number in one term. Plants a
  viscosity/Re mystery in the first breath.
- **The dimensionless zoom.** The same eddy rhythm peels off a bridge piling,
  a spoon, and entire islands (satellite cloud streets) — one equation at every
  scale, asking only for a single number that says which world you're in.
  Pairs with Nature-versus-browser. True, startling, and almost nobody knows it.

## Figure-furniture idea (unused)

- **The relabeled slider.** A Re slider whose track carries four silhouettes
  fading in as you sweep — spoon-in-honey → creek boulder → smokestack → island
  from orbit — making the true claim that these are literally the same
  simulation. Cheap reframe (art direction only) whenever a Re slider needs to
  carry the scale-invariance point without prose.

## Every Map Lies — the full cartography build (maths-01 v2, built & retired 2026-07-31)

A complete, working alternative telling of the Jacobian/Hessian article:
Greenland-drag Mercator hero (true sphere rotation, measured area receipts),
Tissot loupe with geodesic circles sampled on the sphere and ground Jacobians,
same-size circle trio, Mercator-vs-sinusoidal duel, hypsometric terrain with a
levelness-gated curvature surveyor. Nick's verdict after seeing it live:
"everyone has done a scaling map visual... so weak for a Jacobian and Hessian
explanation" — the familiar hero failed the novelty bar, and the projection
frame made it an article about flattening spheres rather than about the two
operators. Retired whole; the zoom-lattice v1 restored.

Salvage inventory (all still on disk, unregistered): `src/sims/maths/carto.ts`
(projections + exact inverses + ground Jacobians, Rodrigues rotation,
spherical shoelace), `geo.ts` (Natural Earth 110m coastline, 71 KB, public
domain), `MapLies/TissotLoupe/TissotTrio/ProjectionDuel/CurvatureMap/
TerrainField.tsx`, `terrain.ts` (hypsometric tints). The v2 prose lives in git
at f51c552. Honest future uses: a *short* standalone "Every Map Lies" article
in the maths field (the material is good; it was the wrong host for J/H), or
the CurvatureMap surveyor as a cameo figure wherever eigenvalue signs earn a
payoff. The reusable lesson is in the retirement itself: a hero everyone has
seen is anti-hook for this site — novelty of the *presentation* is part of the
commission (recorded in memory + STORY_CANDIDATES postmortem).
