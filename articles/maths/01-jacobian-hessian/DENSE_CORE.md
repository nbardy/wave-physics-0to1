# DENSE CORE — maths/01: The Jacobian and the Hessian

Written first; wins conflicts with later drafts. First article of the **maths track**:
same methodology, same voice system, but the subject is a mathematical object rather
than a physical phenomenon — so the "phenomenon" is a *picture* the reader can hold,
and the wonder gap is the gap between having used a thing for years and never having
seen it.

## Thesis (one sentence)

**A derivative is the linear map you find when you zoom in — the Jacobian is that map
written as a matrix, and the Hessian is nothing new: it is the Jacobian of the
gradient, the quadratic shape left standing where the arrows die.**

Two objects, one instrument (the zoom), one move applied twice.

## Why these two (the commission)

Nick, verbatim: the Jacobian and the Hessian are "the two things here I have never
felt like I understood." The failure mode of every standard treatment is the same:
both objects are *defined by their formulas* (a box of ∂fᵢ/∂xⱼ; a box of ∂²f/∂xᵢ∂xⱼ)
and never *shown being anything*. The reader can compute both and picture neither.
This article is the inversion: the picture first, the box of partials last, as the
bookkeeping for something already seen.

## The hook / wonder gap

You already trust the 1-D story: zoom into any smooth curve and it flattens into a
line; the derivative is that line's slope. One number, because a line through a point
needs one number. The gap: **what do you find when you zoom into a *map* — a function
that moves points of the plane?** Answer, visible on screen: a mangled grid becomes a
clean parallelogram lattice. A parallelogram lattice needs four numbers. That's the
Jacobian — not a box of partials, a *landing report* for two arrows.

## The persistent protagonist

**The stamp**: a small amber square (with a dot marking its corner-orientation)
dropped anywhere in the plane, and the **loupe** that zooms on it. The stamp survives
the whole article: mangled by the warp, straightened by the zoom, measured by the
determinant, carried into the landscape act (where the stamp rides the gradient
field), and returned in the coda riding lesson 01's flow. The Jacobian is *what the
map does to the stamp*; the Hessian is *what the landscape does to the stamp of
arrows*.

## The ranked insights (payoff order)

1. **Zoom is the definition.** Differentiability *means* "looks linear close up."
   The Jacobian isn't derived from partials; partials are how you *file* it.
2. **Columns are landings.** J's first column is where the unit east arrow lands;
   second column, unit north. The matrix is read, not computed.
3. **det J is the stamp's area receipt** — the local area magnification, signed;
   negative means the stamp got flipped. This cashes out the |det J| in every change
   of variables (the r in r dr dθ), and det J = 0 is the picture of "locally
   uninvertible": the stamp crushed to a needle.
4. **The gradient of a landscape is itself a map** (point ↦ arrow is ℝ² → ℝ²), so it
   *has* a Jacobian. That Jacobian is the Hessian. No new machinery — the same move,
   aimed at the gradient.
5. **At a critical point the linear story dies** (∇f = 0), and the Hessian is the
   *next* impostor: zoom into a summit or a pass and the contours become perfect
   ellipses or crossing hyperbolas. Eigenvectors = the axes of that quadric;
   eigenvalues = the curvatures along them; the second-derivative test is just
   reading the signs; det H < 0 ⇔ saddle (the determinant returns as a character).
6. **The Hessian is why Newton's method turns**: gradient descent zig-zags down an
   anisotropic valley because it only knows the arrow; the Newton step multiplies by
   H⁻¹ — it un-stretches the valley before stepping. The Hessian is the lens that
   makes a stretched bowl round.
7. **Coda tie to the site**: lesson 01's solver drags a stamp along every particle
   path; incompressibility is the sentence "det J = 1, forever." The maths track and
   the waves track are one subject.

## Misconceptions to kill

- *"The Jacobian is the determinant"* (common usage collapses the matrix into its
  det) — kill by **debunk**: keep the two names separated on screen, matrix as
  landing report, det as its area receipt.
- *"The Hessian is just curvature = one number"* — kill by **showing** the pass:
  curvature has a direction; at a saddle the same point curves up one way and down
  the other. One number cannot say that; a symmetric 2×2 box can.
- *"Second derivatives = ∂²f/∂x² and ∂²f/∂y², the mixed term is bookkeeping"* — kill
  by **rotation**: a diagonal-only Hessian applied to a rotated valley gets the axes
  wrong; the mixed term is what lets the bowl tilt. Shown in the eigen-axes figure.
- Omission: total derivative vs. partial pedantry, differentials-as-infinitesimals
  debates, tensor language. Not named at all.

## The math budget (earned, in order)

1. 1-D: f(a+h) ≈ f(a) + f′(a)·h (recalled, not derived).
2. The landing report: J = [image of ê₁ | image of ê₂], entries as four partials
   *after* the arrows are seen.
3. f(a+h) ≈ f(a) + J·h — the linear impostor, boundary-checked (identity map,
   pure rotation).
4. Area factor: det J, sign = orientation; |det J| in change of variables, cashed
   on polar coordinates in one line.
5. H = J of ∇f; symmetry noted honestly (equality of mixed partials, one sentence,
   no proof).
6. f(a+h) ≈ f(a) + ∇f·h + ½ hᵀH h — the quadratic impostor, boundary-checked
   (flat plane → H = 0 leaves the linear story).
7. Eigen story: H v = λ v, read as "along v, the bowl is a 1-D parabola with
   curvature λ." Second-derivative test as sign-reading; det H = λ₁λ₂.
8. Newton step: x ← x − H⁻¹∇f, read as "un-stretch, then walk to the bottom."

## Hero figure

The swirl warp with a draggable loupe: full pane shows a checkered grid mangled by a
closed-form swirl; the loupe pane shows the neighborhood of the probe at increasing
zoom — at high zoom the mangling is gone and a clean parallelogram lattice stands
there, different at every probe point. Plant: those four numbers per point are the
whole article. Return (coda): same figure, now wearing its matrix, its det meter,
and revealed as a flow map.

## What this article is NOT

Not a linear-algebra course (eigenvectors are met as bowl axes, not defined in
generality); not a multivariable-calc syllabus (no chain rule ceremony, no implicit
function theorem); not optimization beyond the one Newton payoff. Scope is the two
objects Nick named, seen properly, once.
