# STORY_CANDIDATES — ten core stories for Jacobian + Hessian (2026-07-31)

Nick's verdict on v1: "not sure it's a great thesis, or great presentation."
Diagnosis before the branch, so the candidates aim at the actual disease:

**What v1 gets right**: the mechanism (zoom → lattice; H = J of the gradient) is
correct, unifying, and the figures deliver it honestly.

**What v1 gets wrong**:
1. **No wonder gap.** A swirled checkerboard is not daily-familiar. Ciechanowski's
   hooks live in the gap between something you meet every day and its hidden
   mechanism; nobody meets a swirl warp. The hero is "not yet understandable" but
   also not *desired* — the reader has no reason to want those four numbers.
2. **Stakes arrive last.** Newton's method — the first moment the matrices *do*
   anything — is §8 of 9. Everything before it is anatomy.
3. **Definitional spine.** "The derivative is what you find when you zoom" is a
   definition presented as a story. Definitions make instruments, not plots.

So: the zoom-lattice machinery should survive as the **instrument** in whichever
story wins. It should stop being the **thesis**.

---

## The ten

**1. The Zoom (incumbent).**
*Thesis*: a derivative is the linear map at the bottom of a zoom; the Hessian is
the same zoom aimed at the gradient. *Hero*: swirled grid + loupe.
*Strength*: cleanest possible mechanism; both objects fall out of one move.
*Cost*: all three diseases above. Keep the machinery, kill the framing.

**2. Every Map Lies (cartography + terrain).**
*Thesis*: the Jacobian and Hessian are the two instruments cartographers have
drawn on real maps for 150 years — you've seen both without knowing their names.
*Act 1*: every flat map of the earth lies; Greenland vs. Africa. The instrument
that shows the lie is Tissot's indicatrix — little circles inked on the globe,
printed as ellipses on the map. The indicatrix IS the Jacobian, drawn; det J is
Greenland's inflation factor; conformal vs. equal-area is a fight over which half
of J to sacrifice. *Act 2*: terrain. Hillshading, ridge lines, valley networks on
relief maps are extracted from elevation data by the Hessian's eigenvalues —
principal curvatures; pit/pass/peak is how hydrologists actually classify DEM
points (and det H vs. trace H is how vision systems find blobs vs. edges — SIFT).
*Hero*: a draggable Mercator with live Tissot circles; returns as "you can now
read every atlas's confession." *Strength*: strongest wonder gap of the ten;
both matrices land as instruments people already trust; zoom survives as the
mechanism inside Tissot. *Cost*: two specimens (globe, terrain) to keep coherent;
sphere→plane maps need care to stay 2D-honest.

**3. What the Optimizer Knows (ML-native).**
*Thesis*: training is walking a loss landscape blind; the gradient is the cane,
the Hessian is the eyes, and the Jacobian is how the cane's taps propagate back
through the layers. *Act 1*: gradient descent zig-zags a valley; learning-rate
ceiling η < 2/λmax is a Hessian fact; conditioning, momentum, Newton/quasi-Newton
as the lens. *Act 2 (or interleaved)*: backprop IS a chain of Jacobians — the
four-numbers-per-layer freight that every training step ships. *Hero*: a live
2-parameter training run with a loss bowl. *Strength*: stakes are Nick's daily
life; the Hessian half is native and deep; "why does my LR explode" is a real
mystery readers own. *Cost*: J is the supporting actor, not co-lead; leans the
maths track toward an ML audience.

**4. Two Knobs, Two Gauges (the sensitivity table / robot arm).**
*Thesis*: J is the influence table between inputs and outputs — turn knob i a
hair, gauge j moves J_ji hairs — and a machine dies where its table drops rank.
*Hero*: a draggable 2-link robot arm; J live; the playable failure is the
singularity (arm straight → det J = 0 → a whole direction of motion vanishes;
this is why real robot wrists lock up). *Strength*: tactile; det J = 0 becomes a
mechanical THUNK you can feel; engineering-real. *Cost*: the Hessian has no
native home — it would be bolted on. Fails the two-object commission.

**5. Newton's One Idea.**
*Thesis*: one algorithm — guess, linearize, invert, repeat — and the two matrices
are what "linearize" means in its two habitats: J when solving equations
(x ← x − J⁻¹F), H when descending landscapes (x ← x − H⁻¹∇f), because descending
is solving ∇f = 0. The Hessian-is-Jacobian-of-gradient identity stops being a
remark and becomes the plot twist that fuses the halves. *Hero*: dual-pane Newton
hunting a root and a minimum simultaneously, same code. *Strength*: cleanest
intellectual unification; both objects co-lead; ends with the reader owning THE
workhorse algorithm of scientific computing. *Cost*: algorithm-first — the
objects are met as gears in a machine rather than sights; drier hook.

**6. The Exchange Rate (integration's missing factor).**
*Thesis*: every change of variables smuggles in a mysterious factor (the r in
r dr dθ); it is the Jacobian determinant — the exchange rate between coordinate
currencies — and at the far end, the volume of a valley under e^(−f) is set by
det H (Laplace approximation: the Gaussian the Hessian defines). *Hero*: an
integral meter that only balances when |det J| is paid. *Strength*: pays off two
things standard courses assert (r dr dθ; why Gaussians appear everywhere);
Laplace/det H is genuinely elegant and rarely taught. *Cost*: integration-heavy;
interactives are meters more than toys; wonder gap is classroom-shaped.

**7. The Circle and the Ellipse.**
*Thesis*: at every point, feed the map a tiny circle of directions; what comes
back is an ellipse — J's ellipse (SVD: rotate·stretch·rotate, semi-axes =
singular values), and the landscape's curvature ellipse for H. One protagonist
(the little circle) survives the whole article. *Hero*: a circle-probe you drag
across a warp, live ellipse + axes. *Strength*: prettiest single protagonist;
SVD as a bonus theorem; strong figure economy. *Cost*: it's a re-skin of the
incumbent (same definitional spine, circle instead of square) — fixes none of
the three diseases; 3b1b-adjacent territory raises the pastiche bar.

**8. The Polynomial Microscope (Taylor grown up).**
*Thesis*: every smooth function is secretly polynomial up close; gradient/J is
the degree-1 coefficient box, H the degree-2. *Hero*: overlay fits of degree
0/1/2, watch residuals die by orders. *Strength*: unifying, honest, examinable.
*Cost*: driest of the ten; residual-order plots are the opposite of a toy; no
wonder gap. Kill.

**9. The Stamp Rides the Flow (site-native).**
*Thesis*: lesson 01's solver drags a Jacobian (the deformation gradient) along
every particle path; incompressible means det J = 1 forever. *Hero*: dye + stamp
in the real fluid solver. *Strength*: deepest tie to the site's spine; det J = 1
is gorgeous. *Cost*: the Hessian has no natural home in advection (the pressure
step touches only trace H = ∇²); repeats lesson-01 vocabulary instead of giving
maths its own terms. Fails the two-object commission. Kill as spine; keep as the
coda it already is.

**10. The Field Guide (read any point like a naturalist).**
*Thesis*: smooth maps have a small local taxonomy — rotate, stretch, shear, flip
(J); pit, pass, peak (H) — and the article teaches you to classify any point of
any map or landscape on sight, Morse-theory-lite. *Hero*: a glyph overlay that
stamps every grid point with its local species. *Strength*: ends with a real
transferable skill; good overlay figures. *Cost*: taxonomies are outcomes, not
mysteries — no tension pulling the reader forward. Weak spine, good §-material.

---

## Critique summary and verdict

Kill outright: **8** (dry), **4** and **9** (Hessian bolt-ons — the commission
was both objects). **10** demotes to section-material inside a stronger spine.
**7** is the incumbent in a party dress. **6** and **5** are intellectually the
tightest but hook coldest; **5** is the best of the cold ones because both
objects genuinely co-lead.

**GEM: #2, Every Map Lies.** It is the only candidate where BOTH matrices already
exist as physical, printed, 150-year-old instruments the reader has seen —
Tissot ellipses in atlases, ridge/hillshade lines on relief maps — so the wonder
gap is real ("you have been looking at Jacobians since grade school") and the
payoff is reading the world's maps, not admiring a definition. The zoom-lattice
machinery, the stamp, det-as-area, eigen-axes — everything already built —
survives as the mechanism inside it; what changes is the specimen (globe and
terrain instead of an anonymous swirl) and where the stakes sit (page one).

**Runner-up: #3** if the article should aim at the ML reader — the Hessian half
is the deepest of any candidate (conditioning, LR ceilings, quasi-Newton), and
the backprop-as-Jacobian-chain reveal is strong. Choose #3 over #2 only if the
maths track's audience is "Nick and people like him" rather than "anyone."

One spine only — the losers may each donate at most a figure (family-15: no
"combine everything").
