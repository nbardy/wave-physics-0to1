# Version III — the interferometer story

User direction 2026-09-22: Version I was more interesting; Version II's visuals
were weak. Restore Weinstein's quote and the original ambition, with an ambitious
AB banner and a story readers can investigate. This supersedes REBUILD_II only
for Version III; I and II remain unchanged.

## Discovery and sequence

The same two routes around a confined magnetic flux can produce different
interference outside it. The reader changes the flux, sees the detector respond,
then investigates the extra structure needed to compare phases between positions.
The return to the interferometer distinguishes a physical flux change from a
local change of references. Finally the electromagnetic connection has dynamics,
whose propagating field strength is light. Geometry organizes the physics;
Maxwell dynamics is an additional empirical input, not a theorem of conventions.

1. Quote, cold physical puzzle, wide dark AB scene: two paths, sealed core,
   live screen intensity, simultaneously visible zero-flux reference.
2. Complex amplitudes: the two path contributions, cancellation versus addition.
   Explain screen envelope and the stationary-setting nature of the control.
3. Phase landscape: fibers are possible complex values at each position; amber
   section changes under a phase-gradient control while fibers remain fixed.
4. Reference freedom: two simultaneous equivalent descriptions with zero ticks
   rotating, coordinate angles changing, invariant transported mismatch.
5. Return to AB: expose electromagnetic transport phases along each route and
   common endpoint gauge change. Gauge knob leaves fringes fixed; flux moves them.
6. Loop integral, curvature, excluded-region Stokes condition; AB does not require
   nontrivial bundle topology. Avoid a detached vocabulary tour.
7. Large transverse EM field ribbon from the checked Maxwell solver; derive its
   wave equation, connection/curvature relationship, and limits of 'medium'.

## Reader checks (complete against actual renders)

Banner: source, two alternatives around inaccessible flux, detector/profile.
Half flux period must interchange bright/dark center; full period restores it.
Path phase glyphs are electromagnetic contributions in a stated gauge, never
particle arrows or total wavefunction phase. Slider chooses stationary setups;
no false claim of field-free paths during a real-time flux ramp.

Landscape: continuous field through local complex planes. Magnitude exists;
circles show only unit phases. Coordinate reference movement is not a physical
rotation of the state. Both descriptions visible together.

Wave: E/B share a real numerical evolving state, perpendicular directions and
in-phase rightward pulse. Frozen initial profile gives a visible displacement.
No incorrectly integrating Ay along an x-directed path.

## Scope and sources

Quote supplied in the original article; retain exact wording with source link.
AB1959 (doi10.1103/PhysRev.115.485); WuYang1975 (doi10.1103/PhysRevD.12.3845);
Tong GR§3.2.5 for geometric field strength versus additional Maxwell action.
No claims of forced electromagnetism, aether refutation by naming, or being the
second popular explanation ever. Source facts already audited for Version II.
New visual families isolated under src/sims/bundles-v3; no baseline edits.

## Reader pass, completed 2026-09-22

| Scene | What is visible | What changing it establishes | Evidence that could disagree |
| --- | --- | --- | --- |
| AB banner | Two alternatives around excluded flux; detector and zero-flux trace | Flux changes interference without moving route geometry | Half-period center goes dark, full period restores pattern |
| Fibers | Complex unit circles and selected amber values | Section changes within unchanged spaces of allowed values | Amber geometry changes with gradient; circles do not |
| Gauge | Two same amber sections, different blue local zeros | Coordinate phases and transport change together | Residual stays fixed while zero directions move |
| AB return | Same routes with electromagnetic phase glyphs | Common endpoint gauge factor cancels in route comparison | Gauge changes phases, leaves exact detector pixels fixed |
| Vacuum | Perpendicular red/cyan field profiles and frozen initial ghost | Field pulse propagates under added Maxwell law | Both peak locations move together relative to ghost |

Desktop banner is1040px wide; all diagrams use scoped styles. Mobile banner
reflows its detector below the apparatus. Browser checked1440/390 widths and all
controls; headless render checks340/1000 forAB/landscape,380/720 forvacuum.
Limits are adjacent to each inference in the article: stationary flux settings,
chosen envelope/geometry, phase contribution versus total phase, angular residual
versus full complex difference, complex fibers versus unit-circle slice, and
Maxwell dynamics as additional physics.
