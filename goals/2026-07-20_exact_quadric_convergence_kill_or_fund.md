# POINTER — goal lives in wave_sim, and is TERMINAL

This file exists only because a `/goal` invocation on 2026-07-27 referenced
this path with the `wave_physics_0to1` repo prefix. The actual goal has
always lived at:

```text
/Users/nicholasbardy/git/wave_sim/goals/2026-07-20_exact_quadric_convergence_kill_or_fund.md
```

It is a `wave_sim` `prototypes/surf_core_v11` lane goal (kill-or-fund the
exact-quadric pressure program via a generic-placement convergence
measurement) and has no relationship to this repo's explorable-explanations
work. This stub is safe to delete.

## Terminal state (2026-07-27)

**STOPPED-RED**, per the goal's own frozen R0 disposition, closed in
`wave_sim` commit `dde8eff8` and independently verified by a second session:

- R0 certificate: C1/C2/C4 GREEN (corner + census/row-registry
  non-degeneracy certifiable at 4.5e-3 margins), **C3 RED** — sphere-screen
  node preflight min naive slack `-4.44e-16` vs the `2^-43` gate.
- Characterization diagnostic: the ORIGINAL placement fails identically
  (4 aborting cells at order 128 at each placement; same cell 77 at ~5 ulps
  at order 64). The degeneracy is STRUCTURAL — collapsing conic event
  intervals put quadrature nodes within ulps of the unit sphere at ANY
  placement. Placement engineering is refuted; the offset was never retuned.
- R1/R2/R3 never ran; the decision number `d5 + 10*eta_A` vs `1e-3` still
  does not exist. Named prerequisite for any re-attempt (separate goal): the
  dual-sign oracle's slack-preserving membership carrier.

Full evidence: `wave_sim` at
`prototypes/surf_core_v11/docs/v11_connected_grid_r4f_generic_placement_certificate_red_adjudication.md`,
`goals/results/2026-07-20_convergence_decision/STATUS.md`, and the
KEY_LEARNINGS graveyard row of 2026-07-27.
