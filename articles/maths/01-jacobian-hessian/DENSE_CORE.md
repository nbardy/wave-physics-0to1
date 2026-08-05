# DENSE CORE — maths/01: Every Map Lies (the Jacobian and the Hessian)

v2, 2026-07-31. Supersedes the v1 "zoom" core after Nick's verdict ("not sure
it's a great thesis, or great presentation") and the ten-story branch in
STORY_CANDIDATES.md. v1's mechanism survives as the instrument; the story is new.

## Thesis (one sentence)

**The Jacobian and the Hessian are the two instruments cartographers have been
printing on real maps for 150 years — the ellipse that confesses a projection's
lie, and the curvature box that reads terrain — and once you can read them on an
atlas page you can read them anywhere.**

## The wonder gap

On the wall map in every classroom, Greenland is the size of Africa. Africa is
fourteen times larger. Every reader has stared at this lie for years; almost no
reader knows the lie is (a) mathematically mandatory, (b) precisely measurable,
and (c) *printed with its own measuring instrument* in serious atlases — Tissot's
indicatrix, little ellipses inked over the map. The gap: you have been looking at
Jacobians since grade school without being told.

The second half has the same shape: everyone has seen contour maps, summits,
basins, mountain passes; almost nobody knows that "pass" is a statement about
eigenvalue signs, or that terrain software finds every peak and col on Earth by
running exactly the second-derivative test the reader half-remembers from
calculus.

## The persistent protagonist

**The probe circle** — a small circle drawn on the ground (on the globe in Act 1,
on the island in Act 2) and watched through the map. It replaces v1's abstract
stamp. In Act 1 the map is a projection and the circle lands as an ellipse (the
Tissot indicatrix — the Jacobian, drawn). In Act 2 the "map" is the gradient of
terrain and the circle of directions comes back as curvatures (the Hessian). One
probe, two instruments.

## Ranked insights (payoff order)

1. **Every flat map of the earth must lie** — not for lack of cleverness; a
   sphere and a plane disagree about distances, provably. So the honest question
   is never "is this map distorted?" but "*which* lie did it choose?"
2. **The lie is local and linear.** Draw a ground circle and shrink it: however
   bent the big blob was, the small one is always a perfect ellipse. That
   emergence — blob → ellipse as the circle shrinks — IS differentiability, met
   in the wild (v1's zoom-lattice, now with a reason to zoom).
3. **The ellipse is the Jacobian.** Where east and north land = the columns; the
   ellipse is the image of the ground's unit circle; Tissot published exactly
   this picture in 1859 and atlases print it still.
4. **det J is the area receipt.** Mercator at latitude φ inflates areas by
   sec²φ — at Greenland's latitude that is ×10 and climbing; the hero's lie gets
   its exact number. Change of variables (the r in r dr dθ) is the same receipt
   paid inside every integral. det = 0 is a fold (paper-map interlude); negative
   is a mirror.
5. **You must choose your lie.** J factors into shape × size. Mercator keeps the
   ellipse a circle (conformal: angles true, compass courses straight) and pays
   in area; equal-area maps pin det = 1 and pay in shear. No projection escapes
   both — the impossibility from insight 1, cashed as a theorem about J.
6. **The gradient of terrain is itself a map, so it has a Jacobian: the
   Hessian.** The hinge survives from v1 verbatim — point ↦ steepest-uphill
   arrow is ℝ² → ℝ², and its landing report is symmetric.
7. **Summit, basin, pass are eigenvalue signs.** Zoom a topo map at a col: the
   contours cross — the reading hikers are taught, now derived. Principal
   curvatures = eigenvalues; the second-derivative test is sign-reading;
   det H < 0 is the pass. The determinant catches folds in Act 1 and cols in
   Act 2 — same bookkeeper, both instruments.
8. **The Hessian is the automatic surveyor.** Classify every point of a terrain
   by its eigen-signs and peaks/basins/saddles light up by themselves — how DEM
   software and blob detectors (SIFT's det-H test) actually work. The reader's
   calculus incantation turns out to run the world's mapping software.
9. **Newton in the fog**: descending terrain you cannot see, the arrow alone
   zig-zags; H⁻¹ un-stretches the valley. (v1's race, reskinned; the payoff is
   why it belongs to the same article as the atlas.)
10. **Coda**: the site's fluid solver drags det J = 1 along every particle path —
    the incompressibility tie, one paragraph, prose-only.

## Misconceptions to kill

- *"Mercator is just badly made / old"* — debunk: it is optimal for exactly one
  thing (rhumb lines straight; conformality), and its area lie is the price, not
  a bug. The duel figure stages the trade.
- *"The Jacobian is the determinant"* — kill by keeping ellipse (matrix) and
  receipt (det) visually separate instruments all article.
- *"Curvature is one number"* — the pass kills it: same point curves up one way,
  down the other; a symmetric 2×2 is the smallest honest container.
- Omission: Gauss's Theorema Egregium is *named once* as the impossibility's
  pedigree, never developed; no differential-geometry vocabulary (metric,
  curvature tensor) is admitted.

## Math budget (earned, in order)

1. Ground arrows: at latitude φ, one degree of longitude is cos φ shorter than
   a degree of latitude — the single spherical fact the article needs.
2. Landing report J = [east-landing | north-landing]; entries as partials after
   the arrows are seen; F(p+h) ≈ F(p) + J·h with the blob→ellipse figure as its
   meaning. Boundary check: the untilted equator point of a cylindrical map.
3. det J as area factor; Mercator's sec²φ; ∬ g |det J| = ∬ g under change of
   variables, cashed on r dr dθ in one line.
4. Shape × size: J = (rotation)(stretch) informally via the ellipse's axes;
   conformal ⇔ ellipse circular; equal-area ⇔ det = 1. (No SVD ceremony — the
   ellipse's axes carry it.)
5. H = J of ∇f; symmetry (mixed partials agree, one sentence).
6. f(c+h) ≈ f(c) + ½hᵀHh at critical points; eigen as principal curvatures;
   second-derivative test as sign table; det H = λ₁λ₂.
7. Newton step x ← x − H⁻¹∇f as un-stretching.

## Hero figure

A Mercator world map. Greenland is draggable: grab it and pull it to the
equator — the outline deflates continuously (true rigid motion on the sphere,
reprojected live), with a violet area receipt counting down from ×10-ish to ×1.
The IOU: the machinery that computes that receipt at every point. Returns in the
coda wearing Tissot ellipses and the receipt formula.

## What this article is NOT

Not a projections survey (two projections plus the naive one; Snyder gets the
Further Reading nod); not differential geometry (sphere facts are used, never
theorized); not an optimization course (one race, one payoff). The commission is
unchanged: the two objects Nick named, finally seen — now on maps he has
actually held.
