# DENSE CORE — Drag & Turbulence (working slug: 04, ordering unclaimed)

Concept banked 2026-07-06 (Nick, during lesson-01 publish). Nothing below is
planned into the registry yet; this file exists so the idea doesn't evaporate.

## Thesis

Lesson 01 opens with a confession: "the flows in this article are two
dimensional." This lesson is where that confession flips into the thesis —
**real flow is three dimensional, and the third dimension is where drag and
turbulence actually live**. Vortex stretching, the energy cascade, and the
drag crisis are 3D-essential physics: they cannot be staged honestly in the
flat solver, which is exactly why they get their own lesson.

## The hero (Nick's ask, verbatim intent)

A **3D wind tunnel with a car in it** — offset colored streamtubes threading
around the body, roofline separation, the recirculating wake. The reader's
first act: orbit the camera / drag the tunnel speed. "That would be sick" is
the design bar: this is the course's marquee 3D asset, built once, reused
everywhere after.

## Payoff candidates (ranked, first pass)

1. Why a car's drag is almost all pressure drag — the wake IS the bill.
2. d'Alembert's paradox resolved by the boundary layer (hand-off from lesson
   03, which stages the paradox historically).
3. The drag crisis / dimples-on-golf-balls: turbulence *reducing* drag.
4. The energy cascade — big whorls to little whorls (Richardson), 3D-only.

## Feasibility ledger (measured against the existing stack, 2026-07-06)

- Needs a **3D WGSL solver**: rewrite of the ~850-line 2D solver — 3D
  advection/diffusion, 3D multigrid Poisson, ~1–2M cells. Week-scale, not
  evening-scale.
- Needs a **new renderer**: streamtube extraction + 3D camera (current
  renderer is a flat dye blit). This is the second half of the week.
- **No CPU fallback exists at 3D scale** — WebGPU-only figure; the fallback
  story must be decided up front (static? 2D cross-section? honest apology?).
- Fresh tuning from zero: the 2D wing tuning burned a full day on blockage
  locks and mask pathologies; 3D will have its own versions of these.
- What carries over: two-dye-species infrastructure, split inflow, mask
  stamping (extend to voxels), the kick/trip-wire seeding pattern, and
  `KelvinHelmholtz.tsx` (benched, tuned) if this lesson wants shear layers.

## Cheap experiment available any time

A **2D car silhouette** in the existing channel (stamp a car mask instead of
the NACA profile) — one hour, bench route, lets us see a car wake in the
house style before committing to 3D. Not a hero candidate for lesson 01
(its prose is built on the wing); purely a look-development probe for this
lesson.
