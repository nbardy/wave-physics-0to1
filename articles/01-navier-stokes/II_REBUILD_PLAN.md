# Building Navier–Stokes — version II revision plan

Recorded 2026-09-11 after Nick approved the direction and requested a committed
baseline plus a separate copy for parallel reading.

## Starting point

Version I is the complete construction-lesson revision checkpointed at `ca79202`.
It already includes the September 10 transport, diffusion, cell-flux, pressure,
term-comparison, timestep, and live-solver workbenches. Preserve those gains.

Version II was initially copied from that article. The revision below was built
on 2026-09-12; its version note now names the revised experiments. Current
implementation, verification, and release state live in [HANDOFF.md](HANDOFF.md).
The implementation uses a matched periodic shear flow for Reynolds similarity
and calculated plate/pipe readings for the material transfer; neither is presented
as a turbulence experiment or laboratory validation.

The existing selector is reused: `/lesson/navier-stokes` opens I and
`/lesson/navier-stokes?v=II` opens II. The history lesson remains a separate
article. Its [Predicting Water sketch](../03-navier-stokes-history/V2_STORY_SKETCH.md)
supplies selected experiment ideas, not a third article or a replacement history.

## Keep the article's job

Explain the parts of fluid motion and how they become a computation the reader
can inspect. Keep the sequence from a velocity field through transport, momentum
exchange, volume balance, pressure correction, equation assembly, and a complete
timestep. Historical disputes and chronology stay in the history lesson.

## First pass: the parcel and viscosity

**Following a Parcel.** Replace the stationary dye patch with a steady narrowing
channel. A fixed probe reports unchanging local velocity while a tracked parcel
accelerates through the narrowing. Keep the probe and parcel visible together,
with their measurements on compatible scales. Use an explicitly specified,
volume-preserving field; identify any approximation to a real channel flow.
The experiment must connect directly to material acceleration. Retain the
derivative and its stationary/uniform boundary checks after the figure.

**Viscosity.** Retain the new fixed-time diffusion comparison, but make its
profiles readable as motion of neighbouring fluid layers. Use marked parcels or
displacement traces alongside the velocity profiles when that adds information.
Distinguish momentum diffusion, molecular dye diffusion, and numerical diffusion
in the surrounding text. Introduce dynamic viscosity and kinematic viscosity
with their relation and units; the current inventory of liquids mixes them.
Any enhanced version of DiffusionLab must be opt-in so I keeps its original view.

Read those changes in the page before expanding the article further. A working
experiment needs clear input, a visible consequence, and a meaningful return
trip through its controls. More prose is not a substitute for that comparison.

## Next comparisons

**Reynolds similarity.** Replace the single-specimen argument with matched
geometry and initial/boundary conditions at the same Reynolds number. Change
speed and kinematic viscosity together, keeping length fixed. Compare equal
dimensionless times, use normalized speed/color scales with their meaning
stated, and include a mismatched case so the supposed agreement can fail.
Use a bounded, validated regime; numerical agreement must survive refinement.

**After equation assembly: measure a property, use it elsewhere.** Introduce
one staged plate-to-pipe investigation after pressure has been taught. Infer
dynamic viscosity from plate force, speed, area, and gap; keep the fluid,
temperature, and resulting value fixed in the pipe calculation. Split one tube
into four or sixteen narrower tubes at equal total open area, equal length,
and equal pressure drop. Keep a reference tube and collecting vessel visible;
start both collections together and hold the measured interval for inspection.
The modern laminar circular-pipe model predicts bundle flow fractions of 1/4
and 1/16 under these conditions, with entrance/manifold losses excluded.

Then expose the wall assumption on that same apparatus. Keep the fluid property
fixed while changing the specified slip condition. Source and verify the
boundary relation and its physical range before implementation. A large
illustrative slip length must not imply an ordinary pipe coating has that effect.

Treat calculated readings as calculated readings. A formula generating both a
measurement and a prediction is not experimental validation. Independent plate
and pipe data must match fluid, temperature, units, and apparatus conditions
before an agreement can be described as evidence from experiment. Verify exact
solutions, limits, and collection ratios independently of the renderer.

These ideas replace or consolidate weaker material; do not append three new
sections simply because the sketch proposed three experiments. The viscosity
measurement and its pipe application can be one staged investigation after the
full equation, with a short callback to the earlier viscosity section.

## Finish and compare

Let the complete timestep, live workbench, and returning wing finish the
argument. Shorten the separate wave excursion to a precise link/bridge if it
creates another ending. Correct remaining physical qualifications in II without
silently changing I. Keep the two-dimensional and discretization limits clear.

For each changed figure: check the claimed quantity independently, render both
revealing states, exercise controls and reset/pause behavior, and inspect desktop
and narrow layouts. Verify version switching remounts the figures and direct
`?v=II` navigation works. Run typecheck, build, construction checks, and targeted
new checks. Update the version note and HANDOFF when II actually diverges.

## File ownership and preservation

- Baseline prose: `src/lessons/lesson-01-navier-stokes.I.mdx`.
- Revision prose: `src/lessons/lesson-01-navier-stokes.II.mdx`.
- New experiments: separate components or additive props defaulting to I's
  behavior. Shared components are not frozen just because the MDX was copied.
- Per-article state and validation belong in HANDOFF; this document owns only
  the accepted revision plan.

The baseline commit preserves all dependent source as well as the article. If
an exact historical rendering is needed later, use that commit in a separate
checkout rather than assuming a prose copy freezes the shared simulation code.
