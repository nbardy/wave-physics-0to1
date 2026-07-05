# PLAN: WebGPU compute port of the Stable Fluids solver

Status: **built** — hero figure (`CylinderFlow`, all four lesson placements) runs on
WebGPU compute at 4× grid resolution with typed CPU fallback. This discharges the
Stage-5 debt in AGENTS.md ("vortex street is a waver … plan called for WebGL").
WebGPU compute was chosen over WebGL fragment-shader ping-pong because storage
buffers keep the GPU code line-for-line comparable to `lib/solver.ts` — a WGSL
kernel per solver method, no texture/FBO ceremony. The teaching artifact stays
readable.

## Architecture

```
src/sims/lib/gpu/
  context.ts     acquireGpu(): Promise<GpuContext>   — typed sum: ready | unavailable
                 one device per page, re-probes on device loss
  compute.ts     f32Buffer / u32Buffer / FieldPair (ping-pong pair) / Kernel / readBack
  solver_gpu.ts  FluidSolverGPU — same surface as FluidSolver (addDisc, addImpulse,
                 visc, toggles, pressureIters, step(dt)) + WGSL kernels
  render_gpu.ts  DyeRendererGPU — fragment-shader colormap at *display* resolution
                 (float field sampled per screen pixel, ramp applied after
                 interpolation → no 8-bit banding, no upscale diamonds), blitted
                 into the Stepper's 2-D canvas so <Sim> stays untouched
```

Backend selection lives in `CylinderFlow.tsx`: `create()` returns a stepper whose
inner sim fills in when the (async, page-shared) GPU probe resolves; `unavailable`
falls back to the CPU solver with the reason logged. No other code asks about GPU
availability.

## What is deliberately the same as the CPU solver

- The scheme (Stam), the pass order, the boundary rules, the bilerp clamps, the
  Neumann solid mirroring, the Re = U·D/ν slider contract (U, D, ν all scale with
  the grid, so displayed Re is backend-independent).
- The src→dst ping-pong discipline. It is two reusable buffers per field with the
  roles swapped per pass — not a history. The CPU does the identical move with
  `u0.set(u)` and pointer swaps.

## What is deliberately different (each is stated in code comments too)

| Difference | Why |
|---|---|
| Multigrid V-cycle pressure solve (Jacobi-smoothed, geometric, solid-aware) | **load-bearing, and the punchline of the Kármán hunt.** A parallel Jacobi sweep moves pressure information one cell; any real-time flat-sweep budget leaves the wake's ~4·D-wavelength mode unconverged, and that unresolved divergence *damps the shedding instability to a standstill*. Measured by kicking the wake and watching the ring: σ ratio 0.10 @ 80 sweeps, 0.48 @ 400, 1.0 @ 800, 2.5 @ 2000. The CPU never had this problem — its in-place Gauss–Seidel sweep is sequential, so one sweep carries information across the whole grid. Multigrid restores that global reach in ~2 V-cycles. |
| MacCormack-corrected advection (Selle/Fedkiw 2008), velocity and dye | **also load-bearing.** Plain first-order semi-Lagrangian advection is so numerically diffusive that the wake sits perfectly steady at any slider Re — measured: transverse-velocity σ/U ≈ 0 at Re 150–400 even at 4× resolution. Necessary but not sufficient (see above). The CPU reference keeps first-order (the lesson's §8 discusses interpolation error). |
| True Jacobi, not the CPU's in-place (accidentally Gauss–Seidel) sweeps | parallel threads can't read freshly-written neighbors; same fixed point per sweep family |
| Dye decay folded into the advection correction kernel | one pass instead of two; same math |
| `boundaries()` is two dispatches (columns+solids, then rows) | wall rules read row 1/NY−2, which column rules write at corners — pass sequencing makes the read race-free |
| Kernels cached per (device, nx, ny) | pipeline compilation measured ~2 s on first dispatch; the four lesson instances share one compiled set |

## Verification (live on /stack-check, `GpuParityCheck`)

Invariant checks, not mirrors: (A) analytic advection — blob centroid translates
exactly U·t in a uniform stream; (B) projection residual — bulk-fluid RMS ∇·u at
CPU-reference level (rim cells excluded: solids are outside the pressure solve on
both backends, so their apparent divergence is not projection's job); (C) CPU/GPU
velocity-field agreement at steady Re 20 (velocity, not dye: MacCormack keeps dye
filaments sharp where first-order smears, so pointwise dye L2 measures scheme
sharpness ~70%, while velocity agrees ≪1%).

Perf (measured, M-series, 576×352): ~0.2 ms JS encode, ~1.45 ms GPU per step with
2 multigrid V-cycles (the V-cycles are cheaper than the 80 flat Jacobi sweeps they
replaced, and converged where those weren't). First-use pipeline compile is ~2 s,
paid once per page via the kernel caches.

Physics acceptance (measured): kick-test σ ratio 1.23 (sustained street) at Re 250;
spontaneous onset from the impulsive start + 4-cell disc offset, no kick — σ/U 5.4%
at t≈15 s (Re 250), 1.4% at the hero's default Re 90; Strouhal ≈ 0.15–0.17.

## Open items

- Other solver sims (TermToggle, SolverXray, JacobiRelax, PressureFix) stay CPU
  on purpose: they are low-res pedagogical X-rays; `FluidSolverGPU` matches the
  `FluidSolver` surface if that ever changes.
- `DyeRendererGPU` implements overlays `none | divergence` (what CylinderFlow
  uses); the CPU renderer's `pressure` overlay has no GPU twin yet.
- The lesson prose (§10 "how many Jacobi sweeps are enough") now has a stronger
  story available than it tells: the GPU hero exists *because* sweep-count
  convergence is physically visible — under-converged pressure kills the vortex
  street. Candidate future figure.
