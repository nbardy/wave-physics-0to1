# HANDOFF — Lesson 03: The History of Navier–Stokes

**State: BUILT END-TO-END (2026-07-06). Stages 1–3 complete plus full prose at
near-final quality; status `draft` in the registry. Mission of the next thread:
real-browser QA, the Stage-4 voice pass, Stage-5 audits, then publish.**

## Prose copyedit — 2026-09-10, local

Nick requested modest prose improvements across this article and its lesson-01
companion. Repaired fragments, reduced repeated theatrical metaphors and recaps,
and made the final paragraphs state the contributions and remaining question
directly. Historical quotations, section order, component tags/props, and display
equations remain intact. Removed the obsolete claim that the last slider stop is
blank; corrected the repeated solver description to the existing 108×54 staggered
grid. The recently added source links and relative lesson links remain intact.
MDX build/typecheck pass; no figure code changed. V2 sketch untouched. Not deployed.

## Ideal-flow force balance — implemented 2026-09-10

Nick could not tell what the d’Alembert figure was showing or why it belonged.
The speed slider moved tracers but normalized away speed from the pressure map,
arrows, and force meter. Rebuilt `IdealFlow.tsx` around the cancellation: exact
streamline guides and gray moving parcels around a fixed cylinder, brown/indigo
horizontal surface-force components, a symmetry line, and large opposing totals
on a single fixed scale. A gray reference retains the 1× arrow lengths. At 0.5×,
1×, and 2× speed, each directional total reads 0.25, 1, and 4; net drag comes from
an independent pressure integral. Controls update forces while paused.

The pressure is relative to the undisturbed stream; the force partition is by
SIGN, not geometric front/back halves (shoulder suction matters). One force unit
is one directional total at reference speed. No heatmap, renormalization by the
current speed, or hardcoded zero. Exact potential field, RK2 passive transport at
120 Hz, deterministic reset, pure draw. No shared solver changes.

Revised only this section’s setup/readout and its waypoint: distinguish water
motion from forces on the body, demonstrate speed-squared scaling, explain
pressure recovery and mirrored contributions, and name the failed prediction
that motivates the later boundary-layer section. Explicitly restrict zero drag
to this attached potential-flow solution; preserve the later back-hill callback.
Added the Cambridge/Sydney derivation as the primary-source link. The original
article remains in place and the V2 story sketch is untouched.

`bun run check:ideal`: 26 checks, including all 151 slider stops, a deliberately
asymmetric pressure sampler that must return nonzero drag, frame-rate invariance,
30-second no-penetration transport, measured force-arrow growth in its own colors,
paused changes, and reset. Typecheck/build/diff checks pass (existing bundle-size
warning). Chrome desktop and 390px phone inspected after revealing the Predict;
actual held pointer drag went 2→0.5→1.58 without losing capture or moving controls.
No overflow or browser errors. Local only; reload for the new stepper.

## Timeline wake and incompressibility repair — implemented 2026-09-10

Nick found the 1999 hero looked like a vacuum behind the wing instead of a
turbulent wake. Two defects: inlet-only dye/tracers left recirculating fluid
unmarked, and the collocated solver lost through-flow. Measured at 12 simulated
seconds: inlet flux 4,104, outlet 2,595.68 (~63.2%); divergence RMS 0.482. Only
weak reverse flow appeared by ~30 seconds. The earlier motion/pixel checks did
not test incompressibility and therefore missed this.

Timeline viscous eras now use `history/wake.ts`: bounded MacCormack transport,
implicit diffusion with solid faces kept zero DURING every sweep, and a matched
MAC divergence/gradient pair. `history/pressure.ts` solves the pressure graph
with warm-started IC(0)-preconditioned CG to a measured residual. The existing
pressure comparison now shares this operator; its 24 checks and measured values
still pass. Other lessons keep their existing FluidSolver. SolverRenderer's
input type accepts either solver's unchanged dye/solid/pressure fields.

The wake grid is 108×54 (2-unit cells), scaling speed and viscosity consistently
to preserve Re and physical time; body and parcel curves render at display
resolution. No scripted eddies, force noise, or vorticity confinement. The high-Re
case develops 210 reverse-flow cells behind the wing by 4 seconds. Across the
12-second sampled runs, worst channel-flux error is 3.37e-6, divergence RMS
4.58e-6. A separate 30-second run keeps every solid face impermeable and speeds
bounded (peak 2.94× inlet speed). These are coarse 2D vortices, not resolved 3D
turbulence; the article now states that distinction and explains that the Euler
view is a PARTICULAR steady irrotational solution, not all Euler flows.

Gray passive markers sample fluid across the channel, including undyed regions.
“Mark the wake” releases a blue batch behind the wing without adding momentum,
advancing time, or changing volume. It works while paused and marks both active
eras during an overlap. Blue markers do not reset on an age timer; they persist
until exiting/being removed at the numerical wall. Comparison markers retain
the requested cyan role. Both timeline instances share the repair; year dragging
still retains state and uses the same midpoint color handoff.

55 history, 40 timeline, and 24 pressure checks pass; typecheck/build/diff checks
pass. Tests now measure the claimed physics, early recirculation, and passive
wake injection as well as pixels. Desktop Chrome measured 151 frames in ~2.5s
(16.65 ms/frame); pause/mark/play works. At 390px, a held drag from the endpoint
back and forth ends at 4.61, with 1904 cyan 39% / 1999 normal 61%, unchanged input
position, no overflow or browser errors. Desktop/mobile screenshots inspected.
Existing bundle-size warning remains. Local only; reload existing pages to
replace old simulation instances. V2 sketch remains untouched.

## Finite reservoir and volume transfer — implemented 2026-09-10

Nick requested the reservoir's volume be part of the visualization. Replaced the
fixed-bath approximation with an exact finite-volume equilibrium. Both column
surfaces descend with the reservoir, retaining 760 mm of vertical head. The tank
outline and initial-level ghost stay fixed; its actual mercury surface falls.
Tube mouths remain submerged across 0–55°, and both rigid glass lengths stay
1,600 mm. The bath and tubes now use one physical drawing scale.

A fixed-length volume bar shows the reservoir losing precisely what the columns
above its surface gain, with both amounts and their changes in mL. Illustrated
rectangular vessels have 10 mm depth into the page, 80 mm bore width, and a
1,780 × 220 mm reservoir section. Total mercury is 5,132 mL. At 55°, 452 mL moves
into the above-bath columns and the bath falls 25.4 mm. Balance is
`A_res * drop = A_bore * h * (sec(theta) - 1)`; submerged tube contents are counted
inside the reservoir volume to avoid double counting. Prose explains the bar,
moving datum, and illustrative vessel dimensions; no longer claims the bath drop
is omitted. Still a sequence of static equilibria, not transient fluid motion.

48 barometer checks pass: all 56 control settings conserve volume, independently
integrating the drawn liquid polygons agrees with the total, and both desktop
and mobile pixels show the falling bath and changing inventory split. Tests also
guard the mercury connection through newly exposed tube sections, catching a
paint-order gap before completion. Chrome End/Home retained focus, updated the
accessible amounts, and restored the original volume; desktop/mobile screenshots
inspected, no overflow or browser errors. Typecheck/build/diff checks pass, with
the existing build-size warning. Local only.

## Barometer volume explanation — implemented 2026-09-10

Nick asked whether the longer tilted column means mercury is expanding. Added
the missing transfer mechanism to the surrounding prose: mercury enters through
the submerged open mouth, the vacuum space shrinks, and returning upright sends
the extra mercury back to the reservoir. The rigid glass keeps its internal
volume and the liquid keeps its density. Made the broad-reservoir approximation
explicit: a finite bath would drop slightly, carrying both column tops downward
while preserving their 760 mm height above its new surface.

The figure now labels the fixed 1,600 mm glass length and shared mercury reservoir;
the changing readouts explicitly measure mercury. Accessible text includes the
transfer and omitted reservoir drop. Geometry is unchanged. All 24 barometer
checks pass; desktop/mobile renderings inspected, typecheck passes.

## Steeper wing incidence — implemented 2026-09-10

Nick requested a more interesting angle of attack. Increased the shared rounded
foil incidence from 0.36 radians (~21°) to 35°. The outline, solid mask, analytic
velocity field, timeline eras, and pressure comparison all use the same angle.
The nose now intercepts more of the incoming stream. The existing pressure probe
has one of fourteen outlet faces open before correction (previously six); updated
its geometry-dependent regression measurements. Pressure still restores balance
and both tracer paths reach the outlet without crossing the wing.

Inspected rendered flow, near-wing inset, and pressure comparison. All 36 history,
24 pressure, and 38 timeline checks pass, as do typecheck and diff checks. Local
only; reload the page to replace already-created simulation closures.

## Timeline comparison colors — implemented 2026-09-10

Nick requested different colors for the overlapping era, with the normal-color
role handed to the later era at the midpoint. The nearest era now retains amber
and rose; the other era's dye and parcels use cyan (#087f8c). Before midpoint
the incoming era fades in cyan; at and beyond midpoint the later era becomes
normal and the earlier cyan comparison fades out. The original percentage
weights remain unchanged. Exact notches show the original normal palette only.
Color keys beside the names and accessible value text identify the roles.

`timelinePresentation` owns the midpoint rule. Appearance callbacks recolor the
cached steppers without touching physical state. SolverRenderer accepts an
optional dye palette, defaulting to its original amber/rose values; standalone
figures remain unchanged. Only dye and parcel rendering is recolored, leaving
the shared wing and diagnostic annotations neutral/original. The timeline's cyan
is explicitly a comparison identity, not a pressure measurement or new fluid.

38 timeline tests pass, including all transition fractions and midpoint role
swaps, real tinted-frame pixel composition at 2× resolution, retained gray wing,
and reversible appearance changes without a physics reset. All 36 original
history checks, typecheck/build/diff checks also pass. Chrome drag from 1.35 to
1.65 kept the same input while changing the accessible roles from normal Euler /
cyan Navier to cyan Euler / normal Navier. Desktop/mobile colors inspected;
no overflow or browser errors. Existing bundle-size warning remains. Local only.

## Continuous timeline and crossfade — implemented 2026-09-10

Nick requested notches at every year, uninterrupted dragging, and translucent
overlap between adjacent eras. Both TimelineHero instances now use a continuous
0–5 range with six equally spaced, labeled, clickable year notches. The fixed-height
heading shows both dates and their blend percentages without moving the slider.
The dates are model steps, not proportional calendar spacing; prose explains this.

`history/timeline.ts` creates and retains each era's independent stepper for the
life of the Sim. Scrubbing no longer triggers resetToken, replaces the input,
or reconstructs a solver. Only the visible neighbor(s) advance, each with its
own existing fixed timestep; revisiting an era resumes its cached state. Reset
recreates all era states while keeping the selected blend and pause setting.
Each active frame renders to an offscreen canvas at output backing resolution,
then complete opaque frames crossfade by the requested weights. This avoids
internal renderer globalAlpha/background writes defeating the blend. No physical
parameters or fluid states are interpolated.

`bun run check:timeline` passes 30 checks: all six pure endpoints, 25/50/75%
compositing across all five transitions, active-pair stepping, state retention,
disposal, pure draw, actual Euler/Navier pixel mixtures and motion at 2× resolution.
Typecheck/build/diff checks pass. Real Chrome mouse-down/move/move/reverse/up
gestures traverse multiple eras without interruption on BOTH copies; the input
identity and vertical position remain unchanged. Desktop values traversed
1.10→2.59→4.78→1.27; the second copy at 390px traversed 1.12→2.96→5→2.32.
Year labels, keyboard endpoints and desktop/mobile screenshots inspected; no
horizontal overflow or browser errors. Existing build-size warning remains.
Local changes only; the V2 sketch is untouched.

## Boundary probe UI and comparison — repaired 2026-09-10

Nick found the cursor-following loupe hard to place and its contribution unclear.
Replaced it with a fixed velocity-profile chart under the flow, a visible radial
probe on the disc, Front / Shoulder / Rear presets, and a keyboard-operable
20–160 degree position slider. Probe movement reads the existing flow without
restarting it and works while paused. Removed pointer capture and the sim-stir
wrapper; normal cursor and page scrolling are preserved, with 44px buttons.

The chart compares measured tangential velocity with analytical zero-circulation
cylinder potential flow at the same sample positions. Signed speed uses one
unexaggerated scale; negative samples are red. Axes specify distance/radius and
speed/inlet speed. The surface point explicitly represents the imposed no-slip
boundary value, while off-wall points interpolate the grid. Prose explains that
the ideal unbounded domain and numerical channel differ, so this is not a pure
viscosity ablation or high-Re boundary-layer validation. Pressure drag retains
the integrated, dt-corrected calculation and excludes skin friction.

The fixed moderate-Re solver starts developed. Passive markers recycle at the
displayed window's edges so they cannot all collect unseen at distant walls;
this does not change the solve. The prose names Prandtl's contribution as a
near-wall/outer-flow approximation, adding no new force term. All dragging/hunt
instructions were replaced with the actual controls and chart reading.

`bun run check:loupe` passes 22 checks: profile contrast, ideal fore-aft symmetry,
computed front/rear difference, reverse flow at the rear preset, unchanged physics
under probe movement, finite endpoint samples, cadence independence and pure
rendering with each profile's own-color ink at 340/640px. Typecheck, build and
diff checks pass. Chrome desktop and 390px mobile inspected; paused presets change
the chart, keyboard endpoints retain focus, no overflow or browser errors, cursor
is default and touch-action is auto. Existing build-size warning remains. Local
changes only; the alternate V2 sketch remains untouched.

## Filament artifacts and purpose — repaired 2026-09-10

Nick reported persistent spikes in ReynoldsTube. Its x-sorted polyline joined
unrelated particles; accumulating per-particle random jitter pushed dye toward
slow wall regions. A six-second global reseed hid some deterioration, while an
invented exponential growth law labeled it a transition near Re=2000.

Replaced that cartoon with two simultaneous dye-transport illustrations: straight
flow above, prescribed sideways motion below. A shared pink pulse marks a batch
that travels and exits naturally. A divergence-free streamfunction gives both
channels equal flux and no-slip walls; at zero disturbance they are identical.
Midpoint particle transport uses fixed dt=1/120, deterministic initialization and
a developed first frame. Particles are drawn individually, with no sorted joins,
random walk, wall reflection or automatic reseeding. Every parcel moves downstream
in the supported range. The Sideways motion slider restarts the matched example
while preserving pause and keyboard focus; pulse marking is visible while paused.

The prose and prediction now teach what a dye thread reveals, distinguish spatial
positions from a time-series graph, and explicitly identify prescribed flow rather
than a computed turbulent transition. Removed the Re threshold and its obsolete
transport-speed assertion; Reynolds number remains in the historical discussion.
Also corrected the adjacent implication that turbulence requires switching from
the fluid equation to statistics. This repairs the current version; the separate
V2 sketch remains a proposal and was not implemented.

Validation: `bun run check:filament` passes 27 checks, including independent
divergence/flux checks, one-minute population and wall bounds, complete cohort
flush-out, matched cadence, pure rendering and pink-ink visibility at 340/640px.
The remaining 40 follow-up checks, typecheck and build pass. Chrome desktop and
390px mobile views inspected; no horizontal overflow or browser errors; Home/End
reach both slider endpoints while paused without losing focus. Existing bundle
size warning remains. Changes are local, not deployed.

## Alternate version-two sketch — 2026-09-10

Nick requested a separate story and visual sketch from scratch, preserving the
current article and implementing no new figures. Written in
[V2_STORY_SKETCH.md](V2_STORY_SKETCH.md), working title **Predicting Water**.
Its spine is prediction across experiments: an equal-area pipe-bundle puzzle,
measurement of viscosity, transfer to a new apparatus, boundary conditions,
external flow, disturbance evolution, and numerical checks. It closes on the
opening apparatus under an equal-delivery requirement. Ten reading sections
interleave sample prose with proposed visual interactions and model limits;
the document records omissions and unresolved feasibility/source questions.
This is a proposal alongside the existing article, not an implemented MDX
version, an adopted replacement plan, or authorization to build or publish it.

## Final review refinements — 2026-09-10

Reviewed the accumulated source changes and the revised figures' mobile rendering,
then made four scoped refinements:

- Both TimelineHero instances still keyed the entire Sim by era. This replaced
  the year slider on each change, breaking continuous input and keyboard focus.
  They now use resetToken, restarting only the experiment and preserving controls
  and pause state. Browser checks traverse all six eras on BOTH copies with the
  same connected input, and Home + five ArrowRight presses reach 1999 with focus.
- MomentumExchange exposed both Reset and Kick layers apart for the same action.
  Sim now accepts an optional resetLabel; this figure has one named restart button.
  It still resets the physical state while paused, without silently resuming it.
- BoundaryLayerLoupe's 160 blue markers with long trails crowded out the blue
  velocity arrows being taught. It now uses 90 small amber parcels on a lighter
  speed background; solver, profile samples and pressure calculation are unchanged.
  The prose identifies parcels versus tangential-velocity arrows, and the meter
  identifies the dimensionless pressure-drag coefficient. Corrected the numerical
  comment from implicit Jacobi to Gauss–Seidel. Exported createLoupe for inspection.
- Mobile Sim controls now consistently provide 44px button targets and 28px range
  hit areas, including the older repaired figures. No horizontal overflow at 390px.

Fresh-page Chrome screenshots inspected: barometer, pressure comparison, driven
coupling, pipes, boundary loupe, solver steps and the later timeline era; previous
follow-up screenshots remain relevant. Reloaded after code changes so stored
steppers could not conceal stale code during review. Verified the single kick
button changes the paused canvas. A headless loupe probe at 340/640px verifies
pure draw and visible amber parcels; moving its probe changes its rendered view
(this is not an independent validation of the flow solver).

All nine history-related figure suites pass again, as do typecheck, production
build and diff whitespace checks. Chrome reported no page errors. Existing Vite
bundle-size warning remains. Current changes are still local, with the deployment
constraint below unchanged; this pass does not certify every historical claim or
untouched figure as freshly researched.

## Remaining figure follow-ups — BUILT 2026-09-10

Nick authorized implementing useful changes left over from the review. Q6's three
concrete candidates are now built; earlier local repairs remain intact. No article
spine rewrite, unrelated lesson-01 changes, registry publication, or deployment was
performed. The separate untracked review report was read as context and not edited.

**SoundRace** is now an exact, interactive gas-compression comparison. Matched
pistons impose equal volume changes with heat escaping versus retained; common-scale
pressure-rise bars show the different restoring response and the retained-heat
chamber's temperature rises. Below is a frozen comparison of sound fronts after
0.50 seconds in the respective prepared states, with calculated speeds and 200m
arrival times. “Release compression” restores identical starting thermodynamic
states while retaining the thermal-response difference: ~280 versus 331m/s.
There is no looping race or time-speed slider. This static comparison was chosen
over an animated launch because it keeps the evidence visible while the reader
changes compression. Exact ideal-gas formulas pV=constant / pV^gamma=constant;
gamma=1.4, T0=273.15K, c²=B/rho. It is explicitly a reversible thermodynamic
comparison and small-signal speed calculation, not molecular dynamics or an
acoustic PDE solve. The prose cites OpenStax's speed-of-sound derivation.

**MomentumExchange** replaces ShearBlend ONLY in history; lesson 01's shared
component is preserved. Two matched sets of equal-mass layers start with opposite
velocities. The uncoupled reference keeps its motion; the coupled specimen loses
relative motion while conserving total momentum. Color tracks the original layers,
dots track displacement, signed arrows track velocity. Slider changes restart both
specimens, and “Kick layers apart” repeats the same experiment. FTCS on 48 layers,
zero-flux outer boundaries, dt=1/240; viscosity <= .04 guarantees alpha<=.384.
The setup names the seam and the readout separates relative motion from total
momentum. No water/honey labels pretending to calibrate the normalized geometry.

**WhorlsCascade** replaces prescribed nested orbits with an explicitly simplified
five-compartment energy budget. Both rows receive the same large-scale input;
only the lower row passes energy to smaller scales. Amber bars give energy by
scale and green strips cumulative heat. Input can be added repeatedly, and loss
strength can be varied to restart a matched comparison. Fixed dt=1/120; each bin
exponentially releases its outgoing amount, allocated to the next bin and heat
in the chosen rate ratio. Positive energy and total motion+heat conservation hold
by construction; incoming flux is simultaneous, so the scheme is first order.
Viscous energy decay rate increases as k²; transfer coefficients are chosen and
explicitly not empirical or derived from Navier–Stokes. Last bin has no unresolved
outflow: with zero loss, energy remains there. The toy does not establish the
3D cascade or -5/3 spectrum and is not a 2D fluid simulation. Percentages refer to
cumulative input, stated in prose so adding energy cannot masquerade as destroying
heat. No timed reset or disappearing energy. The graphics deliberately show a
budget rather than counterfeit velocity fields.

**Adjacent unfinished corrections:** ReynoldsTube's axial transport now scales
with Re at fixed diameter/viscosity. Its invented perturbation threshold is disclosed
beside the figure; the prediction no longer promises a particular transition on
doubling speed, and prose acknowledges inlet disturbances. The misleading code
comment suggesting a linear critical instability in pipe flow was removed.
Prandtl's payoff no longer says the ideal attached solution is correct everywhere
outside the thin boundary layer: it names the extended wake and changed pressure
forces. “Every figure is two-dimensional” now refers to planar flow solvers only.
These are scoped repairs, not full validation of the old Reynolds cartoon.

Validation: `bun run check:history-followups` passes 41 checks. Independent gas-law
invariants and small-compression derivatives; Newton/Laplace ratio; momentum and
energy balances; coupling extrema; restart and cadence invariance; cascade exact
uncoupled decay, zero-viscosity transfer, repeated forcing and loss extrema;
Re/transport ratio. Color-specific rendered probes at 640/340px check pressure-bar
contrast, shorter coupled arrows and larger transfer-enabled heat strips. Pure
draw testing caught and fixed a canvas line-width leak in MomentumExchange.
Artifacts: `_figure_check/followups/{640,340}-{sound,exchange,cascade}.png`.
Real Chrome endpoint checks verify all three controls, release/kick/push actions,
pause and 44px touch targets; 390px viewport / DPR2 renders a 340px / 680px canvas
without horizontal overflow. Headless figures and mobile cascade were visually
inspected. All nine history-related figure-check suites pass (the eight earlier
repair suites plus these follow-ups), and typecheck/build pass with the existing
Vite bundle-size warning. Final input QA caught keyed Sim remounts replacing the
range inputs on each change: an additive `resetToken` prop now restarts only the
stepper while preserving DOM controls and pause state. Repeated arrow keys and a
continuous multi-move mouse drag both retain focus and change the value across
the range. The final follow-up suite and build were rerun after this repair.

## Nick's figure-design direction — 2026-09-10

Nick identified the common failure across this review: the visuals did not make
clear either (a) what was added to the model and what became explainable or
predictable, or (b) which isolated phenomenon the reader should attend to.
The interaction itself must invite exploration and connect substantially
different, legible states. The reward can be visual pleasure, informative
contrast, or both. This is the design direction for the continuing review.

Canonical process changes live in METHODOLOGY Stages 2, 3 and 5. In particular,
retired “One knob; sliders default to time-speed,” and replaced the mechanical
one-knob gate with a focused experiment. Do not preserve the old rule through
other wording. A figure brief now states its discovery, the reader's action,
and the revealing states; the reader pass must actually compare those states.

Examples from this session make the direction concrete: tilt while comparing
vertical height against column length; climb while retaining the control tube;
change radius while seeing both collection rates; stir an evolving flow beside
its frozen reference. An invariant is a useful result when the intervention is
large and visible. A dramatic pattern alone is not evidence of a model improvement.

A targeted source review of still-older figures found remaining candidates;
these are design diagnoses, not a completed fresh browser audit. The follow-up
brief and completion tests live in RESEARCH_QUEUE Q6. In particular:
`SoundRace` offers slow motion but never lets the reader change the thermal
assumption; `WhorlsCascade` animates nested prescribed orbits and leaf fading,
with speed as the control, so it cannot demonstrate energy transfer;
`ShearBlend` varies diffusion on an already evolving single specimen without
retaining a no-coupling comparison. No replacements were built in this turn.

## Leonardo: description versus prediction — 2026-09-10

Nick found the old turbulence preview inert: one blurred blob, a speed knob,
and an eight-second restart. The deeper request was to make the historical
addition visible and give the reader a meaningful intervention. The former
`DyeCarry field="vortex"` used a weak prescribed velocity field and reset to
hide numerical dye erosion. It did not simulate evolving vortices. Its other
uses are preserved; history now imports the new `FlowPrediction` instead.

The new experiment starts two views with identical velocities and identical
amber/rose material markers. The upper view keeps its initial velocity field;
the lower solves evolving two-dimensional incompressible flow. Four initially
separated vortices interact and rearrange in the lower view. Dragging in either
view adds the same markers to both but pushes only the evolving fluid; the
setup explicitly states this asymmetry. “Stir the middle” provides a keyboard
alternative. “Add dye only” separates observing motion from changing it.
Pause/Reset remain, the time-speed knob and automatic restart are gone.

Story: Leonardo's documented water studies pose the problem of predicting the
next motion from the present one. We removed unsupported claims about naming
turbulence and matching instruments centuries later. The figure is explicitly
a modern preview of the law the article will assemble, not a reconstruction of
his cascade. After the experiment, prose identifies the added update: carry
local spin, smooth it by viscosity, reconstruct volume-preserving velocity.
The transition to Newton follows this precise missing capacity. Source:
[Royal Collection, RCIN 912663](https://www.rct.uk/collection/912663/recto-studies-of-flowing-water-with-notes-verso-the-head-of-a-woman).

Implementation: `src/sims/history/vorticity.ts` evolves vorticity on a periodic
128×64 grid (domain 2×1, dt=1/60, viscosity 0.00018). Midpoint semi-Lagrangian
transport with bounded MacCormack correction; exact Fourier viscous damping;
Fourier streamfunction inversion yields compatible divergence-free grid
velocities. Mean circulation and Nyquist derivative modes are removed. This
is a hybrid transport/spectral-inversion scheme, not an alias-free nonlinear
pseudospectral method. Formulation checked against [GeophysicalFlows' 2D
Navier–Stokes documentation](https://fourierflows.github.io/GeophysicalFlowsDocumentation/stable/modules/twodnavierstokes/).
A stroke adds the curl of a local velocity impulse and reconstructs its
solenoidal part; it does not prescribe a decorative swirl animation.

Limits named in prose: two-dimensional vortices, periodic opposite edges,
viscous decay without more stirring; not resolved three-dimensional turbulence.
Markers use RK2 and periodic sampling; their short vector trails break at seams.
They do not feed back into velocity. Rendering retains at most 6,500 markers per
pane, retiring the oldest only when more are added; fluid state never resets on
a timer. Grid velocity is spectrally divergence-free; bilinear particle tracing
is an approximation and should not be described as exactly area-preserving.

Validation: `bun run check:prediction` passes 26 checks: complex rectangular FFT
round trip, signed analytic velocity from an oblique Fourier mode, zero spectral
divergence, exact decaying shear solution, forcing direction and zero mean,
identical initial/injected markers, dye-only invariance, frozen/live intervention
contrast, twelve-second continuity, finite fields, deterministic Reset and
20/60Hz equivalence. At 640/340px, separate amber and rose pixel probes verify
both species and actual deformed trails in each view; drawing is pure. Images
live in `_figure_check/prediction/`. Bun stepping measured about 2.2ms per tick.
Real Chrome QA verifies Pause, Reset, dye addition, button stirring and mouse
dragging. A 390px viewport gives a 340px canvas rendered at 680px on DPR2;
no horizontal overflow or browser errors. Buttons are at least 44px tall;
touch dragging is captured only on the canvas, leaving controls scrollable.
Desktop/mobile screenshots were visually inspected. Typecheck/build pass.
These changes remain local under the existing deployment constraint.

## Périer experiment: control, climb, return — 2026-09-10

Nick asked for a more elegant figure, deeper reflection and better storytelling
pace. The old PascalMountain showed a triangle, a tiny moving icon, a mercury
bar and a duplicate “weight of air” bar tied to the same value. It hid the actual
experimental comparison and gave the arbitrary 0–3000m slider no narrative job.
Worse, its H0=12350 exponential was tuned to reproduce the historical drop from
sea level to 1465m, although the experiment started in Clermont, above sea level.
That curve was not a physical atmosphere or recorded data; it is removed.

The new spine is the control experiment, grounded in [Périer's report to Pascal,
22 Sept 1648](https://fr.wikisource.org/wiki/Œuvres_de_Blaise_Pascal/Lettre_de_Florin_Perier_à_Blaise_Pascal):
two matched tubes before departure; a lower reading in the carried tube at the
summit while the control stayed in Clermont; matched readings again on return.
The date of the experiment itself is 19 September. The source explicitly reports
26 pouces 3½ lignes at departure/return and 23 pouces 2 lignes at the summit,
with Father Chastin reporting the control unchanged throughout the day. These
are represented as REPORTED OBSERVATIONS, not a continuous simulation.

The figure now has two simple, upright mercury instruments on a common visual
baseline and scale, labeled Control / Traveling tube. Before, Summit and Return
buttons select observations; a prose paragraph below reads each one and directs
attention to why that comparison matters. The selected state and numeric readings
are available to assistive technology. No fake playback or interpolation. The
same mercury/slate glass vocabulary as the preceding tilt figure provides visual
continuity. Both instruments remain simultaneously visible on mobile.

The record is stored in lignes: 315.5 versus 278, difference 37.5. For familiar
labels it converts approximately using 27.07mm per historical French inch and
12 lignes per inch: about 712mm / 627mm, drop 84.59mm. This is a unit conversion,
not calibration of an atmospheric model; the labels carry ≈ and the prose names
the conversion. [Larousse's historical pouce definition](https://www.larousse.fr/dictionnaires/francais/pouce/63034)
supports the approximate metric conversion. The original units stay in code and
tests. Geometry and the gap bracket use unrounded values; the drop label is
computed. The canvas says Summit, avoiding a font-fallback failure on the accented
place name in the headless renderer; full name remains in prose and accessibility.

Prose pacing: the previous tilt experiment establishes pressure through height;
Pascal's proposed climb supplies a prediction; weather supplies a competing
explanation; the matched pair/control makes that doubt testable; the return
closes the comparison. Removed the old result-before-experiment phrasing and
explained why the tube that stayed behind mattered. The transition into moving
water now follows experimental evidence about still fluids, not a dashboard.

Validation: `bun run check:mountain` passes 24 checks. Original-unit readings and
conversion, shared initial/final readings, unchanged control, and measured ratios
are checked. At 640/340px, mercury-color probes verify actual bar heights through
all three stages, an unchanged control, and a >20px summit drop which reverses
on return. Static draw is pure. Artifacts:
`_figure_check/mountain/{640,340}-{departure,summit,return}.png`.
Browser checks exercise all stages, pressed state, accessible reading and prose
updates; the 390px viewport has a 340px canvas with no overflow or console errors.
Typecheck and build pass. Existing deployment constraint remains unchanged.

## Barometer purpose and geometry repair — 2026-09-10

Nick questioned why the tilted tube was present and whether the top liquid line
should rotate. The useful contrast is **vertical head versus distance along the
tube**, establishing pressure as a measurable static quantity before Pascal's
mountain experiment varies the pressure. The previous single specimen hid that
contrast and contained two geometric errors: its meniscus was perpendicular to
the glass rather than horizontal, and the glass length changed with tilt to
preserve an arbitrary vacuum gap. The 6px submerged foot offset also displaced
the computed level from the 760 guide. Play/Pause suggested nonexistent dynamics.

Kept the experiment, replaced its design. Two equal, rigid 1600mm tubes share one
broad reservoir and pressure: upright reference and adjustable 0–55° specimen.
Both are computed at one fixed world-to-screen scale over the full slider range.
The mercury polygon is clipped by the WORLD horizontal plane h=760, with the
submerged mouth position included in the geometry. Both actual interfaces align
with the common vertical ruler. Separate along-bore dimension marks/readouts show
760mm upright, 928mm at 35°, and 1325mm at 55°. The sealed caps retain vacuum space
over the full range; the reservoir is shown joining the submerged open mouths.

The setup now asks what air supports, length or height, and identifies mercury,
vacuum, reference tube, and adjustable tube. The readout is tied to p=rho*g*h,
leading directly to the mountain comparison: tilt changes length, pressure changes
height. This is settled equilibrium, excluding meniscus curvature, sloshing and
negligible level changes in a broad reservoir. Removed Play/Reset and easing;
the slider directly selects a new equilibrium and reports its angle. The canvas
has an accessible description with both measured lengths and common height.
Hydrostatic reference: [OpenStax, Measuring Pressure](https://openstax.org/books/university-physics-volume-1/pages/14-2-measuring-pressure).

`bun run check:barometer` passes 24 checks: all 56 tilt settings preserve level
surfaces, physical glass length, h=L*cos(theta), and cap clearance; the along-tube
length changes monotonically. At 640/340px and 0/35/55°, pixel probes sample the
mercury's own color (not the guide) to verify BOTH horizontal surfaces and correct
head; the complete tubes fit. Static draw is pure. Artifacts:
`_figure_check/barometer/{640,340}-{0,35,55}.png`. Browser keyboard Home/End updates
0°/760mm to 55°/1325mm; the 390px viewport yields a 340px canvas with no overflow.
Typecheck and build pass. Existing deployment constraint remains unchanged.

## Solver-step redesign — 2026-09-10

Nick rejected SolverXray's appearance, unexplained settings, and unclear purpose.
The old advect/diffuse/project modes repeatedly applied one operator to a warmed
channel; they were ablations, not an explanation of one solver step. The initial
advection-only mode accumulated divergence and saturated a violet overlay. There
was no visible starting state, legend, readout, or explanation before the controls.
Switching modes remounted and synchronously warmed another channel, further hiding
what changed. The “full” button also looked like a fourth operation.

History now uses a new `SolverSteps` component. Its three buttons are **Carry**,
**Smooth**, **Balance**, with the technical name and a short experiment-specific
paragraph above the figure. Every view pairs a fixed initial state with its
computed result at the same geometric scale. These are deliberately static
calculations, with no meaningless Play/Reset or hidden time evolution. Desktop
uses two columns; mobile stacks them. Vector patches and arrows replace the
coarse raster and saturated divergence overlay. Button state is exposed through
aria-pressed, and canvas/description associations expose the experiment to
assistive technology. The old shared SolverXray is retained for lesson 01, whose
prose explicitly describes repeated ablations; changing that article is separate.

- Carry: exact one-second transport in prescribed incompressible shear
  u(y)=0.5-0.45y. Amber and pink material patches shear and travel different
  distances while retaining area (measured by polygon integration).
- Smooth: 65 cell-centered velocity layers, initially opposed, exchange momentum
  for one second using 240 fixed finite-difference steps and no-flux boundaries.
  nu dt/dy²=0.35209 < 1/2, preserving bounds and total momentum. The measured
  largest adjacent-row speed jump decreases from 1 to 0.0612.
- Balance: exact pressure projection on an open square. Proposed velocity is
  rotation plus grad(phi), phi=-0.75(x²+y²); its divergence is -3. Removing the
  pressure gradient leaves the SAME rotation and zero divergence. Integrating
  flux through the dashed box gives net inflow 0.75 before, zero afterward.
  It is not a sealed container or a movie of a time-dependent pressure solve.

The surrounding prose states these are isolated examples, identifies their
mathematical models and normalized units, and explains how a solver combines
operations. The Harlow/Chorin/Stam transition no longer claims the shared CPU
solver lives on a staggered grid or that Stam invented semi-Lagrangian advection.
Stability is distinguished from accuracy, with a link to [Stam's original paper](https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/ns.pdf).

Validation: `bun run check:solver-steps` passes 30 checks, including area and
relative displacement, diffusion momentum/energy/bounds/symmetry, independent
finite-difference divergence/curl, boundary-integrated box flux, pure static
rendering, and quantity-color tests at 640/340px. Pixel probes verify the amber
patch moves farther and the central velocity arrow shortens; they do not merely
count background ink. Artifacts: `_figure_check/solver-steps/{640,340}-{carry,smooth,balance}.png`.
All three buttons change the explanation, pressed state and canvas in browser QA;
390px layout has 340px-wide stacked figures and no overflow or console errors.
Typecheck and production build pass. Existing deployment constraint remains.

## Equal-radius pipe repair — 2026-09-10

Nick observed the lower/pink collector filling faster with both radii at 1.
This was a simulation error, not Poiseuille physics or retained collection totals.
On outlet crossing, a marker was randomly reassigned a lateral position. Slow
near-wall markers stayed longer, so the population aged toward slow streamlines.
A radius change rebuilt only the test pipe's population, while zeroing both
counts: fresh pink markers raced against an aged orange population. Independent
random initial states also meant nominally identical pipes never matched exactly.
The code additionally used the slit average (2/3 of peak speed) for a circular
pipe, whose area-weighted mean is 1/2 of peak speed.

The collector now integrates velocity over 64 equal-area annuli and accumulates
that actual volume flux over a common eight-second window. Midpoint integration
in squared radius is exact for the parabolic profile; the implementation does
not set its meter from a hardcoded R⁴ ratio. Marker dots illustrate the flow;
they no longer define the volume measurement. Deterministic equal-area seeding,
fixed radial streamlines and periodic axial wrapping remove residence-time bias.
At equal radii both populations and both volumes agree. Slider changes reset BOTH
pipes immediately, including when paused. The fixed-step accumulator no longer
has the frame-rate-dependent eight-substep cap.

The figure now states equal pressure drop, length and fluid, shows the current
lower/upper flow percentage, and displays the shared collection time. The prose
specifies volume units (reference pipe's volume), common timing and slider-reset
behavior. The component exposes createPipes/setRadius/measure for verification.

`bun run check:pipes`: 17 checks pass — area-weighted mean speed; all 66 radius
settings against R⁴; half radius = 1/16 flux; equal collection throughout 30 s
after aging at another radius; eight-second turnover; 20/60 fps agreement; pure
draw, immediate paused changes and deterministic reset; each collector's OWN
amber/pink height at 640/340px. Equal-radius heights are both 191 px after 6 s.
Artifacts: `_figure_check/pipes/{640,340}-{equal,half}.png`. Browser QA at 390px:
340px canvas, no overflow; both radius-1 collectors show 0.28 after the same 1.1 s;
Reset, resumed filling and Pause verified. Typecheck and build pass. Existing
constraint on deploying the other task's report remains unchanged.

## Momentum-transfer redesign — 2026-09-10

Nick could not tell what MolecularSprings represented, why it belonged in the
argument, or whether its slider did anything. The problem was pedagogical as well
as visual: unlabelled dots, bonds and a profile demanded three decodings before
showing a consequence. All coupling values approached the same straight profile;
randomly scrambling interior velocities every three seconds concealed the dead
steady-state knob. The “units: ?” joke confused an unknown molecular-to-continuum
relationship with a dimensionless/meaningless coefficient. The eight-substep cap
also accumulated physics time when frame intervals exceeded 1/30 second.

**Replacement:** two versions of the same oscillating-plate experiment, without
and with momentum coupling. An inviscid fluid permits tangential slip and stays
still; viscosity carries horizontal motion down through the fluid. Amber material
parcels, blue velocity arrows, marked moving/fixed plates, and a shaded middle row
make the physical objects and comparison explicit. Gray tracks show full parcel
excursions, preserving the contrast at turning points. The panel readout compares
mid-layer travel with plate travel. Desktop panes sit side by side; mobile stacks
them. No additional unlabelled graph or molecular bond lattice remains.

The Weak–Strong slider maps logarithmically to nondimensional kinematic viscosity
0.008–0.8, with plate spacing and velocity amplitude normalized to one and period
six. The midpoint excursion increases strictly across all 101 positions, from
1.75% to 49.56% of plate excursion. Changing the control selects a new settled
periodic solution at the same phase, including while paused; it does not simulate
the transient of changing fluid viscosity. Reset is deterministic at the selected
coupling. No random kicks or invisible reruns.

`MolecularSprings.tsx` retains its public component name but exports
`createMomentumTransfer`, `layerMotion`, and `response`. The analytic finite-gap
oscillatory Couette solution solves u_t = nu u_yy, with a cosinusoidal upper plate
and fixed lower plate: H(y)=sinh(k y)/sinh(k), k²=i omega/nu. Parcel displacements
are its analytic time integral. Fixed 1/120 phase stepping is independent of frame
rate; analytic evaluation has no CFL restriction. The zero-coupling control uses
tangential slip, not an imposed no-slip condition on an inviscid fluid. This is a
continuum illustration of Navier's missing mechanism, not his molecular model;
the adjacent prose now explicitly distinguishes those claims. Context for the
oscillating-wall construction: [MIT's viscous-flow teaching materials](https://ocw.mit.edu/courses/2-25-advanced-fluid-mechanics-fall-2013/pages/more-complex-viscous-dominated-flows/).

Validation: `bun run check:momentum` passes 16 checks, including an independent
finite-difference PDE residual (7.62e-8), both boundary conditions, displacement's
derivative against velocity, speed bounds, all slider positions, cadence
independence, periodicity, deterministic Reset, and blue-arrow pixel measurements
at 640/340px. Pure draw and paused parameter changes are checked. Artifacts:
`_figure_check/momentum/{640,340}-{weak,strong}.png`. Visual inspection caught a
headless canvas font-parser issue with weight 650; standard weight 600 fixes it.
Browser QA: slider keyboard Home/End changes 0/100 while paused and visibly alters
the canvas; Reset retains the selected parameter and paints immediately. At
390px viewport the canvas is 340px wide, with no horizontal overflow or console
errors. Typecheck and production build pass. Deployment constraint below persists.

## Pressure comparison redesign — 2026-09-10

Nick rejected the pressure-on/off figure's appearance and unclear purpose.
`PressureOff` is now a single **volume-balance experiment**, superseding the
previous purple divergence overlay, mean-divergence meter, and looping wreckage.

- The same rounded wing appears in both views. Two computed streamlines show
  the routes from identical inlet heights; moving dots make the steady flow
  visible. A dashed control volume encloses part of the nose region.
- The top view applies a full pressure projection. The lower view has a
  **Restore pressure** slider from 0–100%; it interpolates the actual pressure
  correction. The readout is **outflow / inflow through the marked box**:
  42.86% initially, 72.84% at half correction, 100% at full correction.
- `sims/history/projection.ts` solves a face-centred MAC projection with matched
  discrete divergence/gradient, impermeable solid faces and channel walls,
  prescribed inlet velocity, and zero outlet pressure. Jacobi-preconditioned
  conjugate gradients reaches relative residual 9.57e-10 in 916 iterations;
  maximum remaining cell divergence is 5.50e-9, including boundary-adjacent
  cells. No excluded cells or tuned display statistics hide the residual.
- This is one elliptic correction with tracers in the resulting velocity field,
  not a time-dependent fluid or density simulation. The prose explicitly states
  that contract and describes compression/imbalance rather than water being
  created or destroyed. It no longer claims pressure is the only mechanism that
  communicates upstream, or that the solver starts from still water.
- Presentation: clean headers, vector wing and streamlines, small measured bars,
  white separation between views, consistent aspect ratio and mobile controls.
  The slider also changes paths/readouts while paused. Sim now paints fresh
  state immediately and avoids clearing its bitmap on redundant resize events;
  browser testing caught and fixed a blank paused Reset.
- Validation: `bun run check:pressure` passes 24 checks (including all 101 slider
  positions), testing the pressure residual, all fluid-cell volume balances,
  impermeability, global flux, box flux, streamline clearance and completion,
  desktop/mobile rendering, pure draw, actual control responses and deterministic
  Reset. Artifacts: `_figure_check/pressure/{640,340}-{removed,restored}.png`.
  Browser QA at 390px: no overflow; Pause, paused slider changes, Reset and resume
  work. Paused Reset retains 1,085 amber pixels and holds them unchanged.
  Typecheck and build pass. The deployment constraint below still applies.

## Figure repair — 2026-09-09

Nick requested repairs to the apparently stalled year stops, rough resolution,
and uninteresting single-disc hero. This supersedes the older hero inventory
and era signatures below. The lesson remains `draft`; no publish-status flip.

- Both TimelineHero instances now share a rounded Joukowski wing, amber/rose
  parcels, and a 216×108 flow grid. Newton uses segment-based elastic impacts;
  Euler uses the exact zero-circulation conformal-map velocity for the SAME
  boundary; later stops use a no-slip numerical flow. Re presets are 12, 180,
  1800, 1800, selected to illustrate viscosity, not reconstruct historical
  experiments. Prandtl adds computed near-wall velocity against an ideal
  reference. Prose now states these limits instead of promising a pipe threshold
  or a resolved turbulent street from the hero.
- Continuous dye in the original steady solver eras advanced but LOOKED frozen
  (verified on the live site at all six stops). Tracers now follow the actual
  velocity, and inlet dye pulses make advection visible. Initial parcels are
  immediately visible; the costly synchronous 300-step warmup is removed.
  Left-exiting Newton particles also recycle, preventing population starvation.
- Opt-in bounded MacCormack advection on the CPU reduces numerical blur; other
  figures retain their first-order scheme. The dye pulse translation check
  measures squared error 0.756 → 0.226, with no new extrema. This is still a
  coarse, finite-iteration graphics solver, not a turbulence calculation.
- Sim resizes its backing canvas at current device pixel ratio, rebuilds
  pixel-space geometry on width changes, and supports a fixed aspect ratio.
  The hero keeps 2:1 proportions on mobile. SolverRenderer draws known discs
  as vector outlines. BoundaryLayerLoupe has an interpolated speed image,
  moving velocity tracers, a correctly named **pressure drag** meter, and
  pointer handling that ignores the control buttons and handles cancellation.
  Its high-Re claims and the rear-pressure explanation were qualified in prose.
- Verification: `bun run check:history` (36 assertions) covers surface tangency,
  zero ideal drag, collisions, scalar transport accuracy/bounds, first-frame
  colors, continuing motion, pure draw, deterministic Reset, visible era
  contrasts, and 30/120 Hz timestep equivalence. Screenshots are regenerated
  under `_figure_check/history/`. Typecheck and production build pass.
  Browser checks: all six stops move at desktop and 390px width; Pause/Reset
  work; no horizontal overflow; backing canvas resizes from 340×170 to
  1276×638 for a 638×319 CSS canvas at 2× DPR. All 22 article figures (including
  Predict reveals) were visually surveyed. This is browser emulation, not a
  physical-device touch pass or a new full mathematical audit of every figure.

Deployment is pending: another active task added
`research/reports/2026-09-09-navier-stokes-review.md` to the shared working tree.
AGENTS.md requires approval before including another session's uncommitted work
in the whole-tree ship. The report has not been changed by this repair.

What exists: `DENSE_CORE.md` (thesis/hook/payoff/ranked insights — wins conflicts),
`RESEARCH.md` (verified chronology/network/gaps), `PLAN.md` (13-section skeleton),
and the article itself — `src/lessons/lesson-03-navier-stokes-history.mdx`:
~5,800 words, 14 sections, 20 live figure instances (22 counting the two Predict
reveals), 2 Predicts, 3 Waypoints, past-for-people / present-for-water tense
regime, no inline citations, ending skeleton deliberately distinct from lessons
01/02.

## What was built (2026-07-06, four parallel subagent batches + hand-written core)

New shared code:
- `src/sims/lib/potential.ts` — analytic potential flow (velocity, surface Cp,
  numerical drag quadrature). Hand-written; the honesty spine of §5.
- `src/components/TermStack.tsx` — the equation-with-birthdays display
  (`items: StackItem[]`, term/sep discriminated union), used twice in prose.

New sims (all Canvas-2D, fixed-timestep, one knob, seeded PRNG, sepia `#78716c`
history furniture): `IdealFlow` (drag meter COMPUTES ∮p·n̂ via potential.ts —
genuine 0.000), `CorpuscleHail` (Newton's model, deliberately wrong, empty shadow
wedge, sibling drag meter), `BuoyancyCrown`, `Barometer` (tilt-invariant height),
`PascalMountain`, `SoundRace` (√γ ratio exact), `BernoulliPipe` (observation-only,
principle untaught), `MolecularSprings` (the "ε (units: ?)" joke slider),
`StressCube` (4 draggable faces, σxy=σyx enforced+explained), `FallingSphere`
(exact linear-drag update, v_t ∝ R²), `PoiseuillePipe` (Q ∝ R⁴), `ReynoldsTube`
(CONFESSED phenomenological instability cartoon, Re_c=2000, seeded, auto-reinject
guard), `WhorlsCascade` (confessed cartoon), `BoundaryLayerLoupe` (real FluidSolver;
loupe shows no-slip profile + rear-shoulder reversal EMERGING from the solver; drag
coefficient integrated from solver.p over mask boundary, EMA-smoothed — the meter
that finally moves), `TimelineHero` (6-era discrete year scrubber, era sum-type
dispatch; era→Re mapping: 1822→Re 4, 1883→Re 45, 1904/1999→Re 140 on a 132×80 CPU
grid; term strip with filling nameplates + permanent blank "smoothness — open").

Reused from lessons 01/02: FlowVis(arrows), DyeCarry(vortex), ShearBlend,
TermToggle, StringSection(string), SolverXray.

`bun run typecheck` and `bun run build` green. Zero console errors with all 20
figures mounted.

## Verification state (updated 2026-07-29 — READER PASS, screenshots + eyes)

Run per `.claude/skills/figure-audit` with a deterministic pump harness
(rAF callbacks queued and driven with synthetic timestamps; IO stub fires via
queueMicrotask — setTimeout is useless in a >5-min-hidden tab, Chrome coalesces
its timers to ~1/min; figure under audit pinned `position:fixed` because JS
scrolling desyncs the hidden compositor; queue purged around every remount or
zombie loops multiply the step cost ~30× and fake blank canvases — TWO false
blanks were chased to this harness artifact before any real verdicts).

VERIFIED WITH EYES (fd14a83 fixes confirmed on screen):
- **TimelineHero, all six eras, distinct signatures**: 1687 corpuscles + disc;
  1757 markers parting around the disc; 1822 honey ooze (dye diffusing, no
  eddies); 1883 persistent stripes, mild wake; 1904 hard separation, wake never
  closes, `wake survey · C_d ≈ 0.43` + dashed survey line; 1999 the eight-row
  street look. WEAK (recorded, not blocking): 1822 vs 1883 read as "more/less
  ooze" — qualitatively distinct regimes only to a careful eye.
- **IdealFlow (the §5 marquee)**: mirrored red lobes nose AND tail, cyan
  shoulders, red press-arrows + cyan suction-fans on the rim, and the ledger —
  `downstream +1.000 / upstream −1.000 / net 0.000` with mirrored balance bars.
  The cancellation is now on screen, not asserted.
- **FallingSphere race**: at ×2 the small ball lands EXACTLY on the drawn ¼
  gridline as the big one touches the floor trailing 7 even strobe rungs;
  weight-∝R³ vs drag-∝R bars carry the why; `size ×2.0 → speed ×4.0` computed.

- **PressureOff panes**: contrast VERIFIED — upper stripes bow around the disc,
  lower stripes drive straight through into a huge violet plume. But reading
  the meters caught a REAL INVERSION: the honest pane reported 6.5% of cells
  vs the broken pane's 3.3% — the fraction-over-floor statistic measures
  SPREAD (diffuse Jacobi residual trips it in more cells than the concentrated
  plume). FIXED same day: meter now reports mean |∇·u| per fluid cell ("% of a
  cell's volume each second"), which orders correctly by magnitude; wreck
  threshold re-based (WRECK_MEAN 0.06). Ordering re-verify owed on screen.

READER PASS COMPLETED 2026-07-30 (agent-browser headless — classifier-free;
sims run live there, no pump harness needed). Every figure eyeballed; verdicts:
PascalMountain (675 mm / 85 mm drop at 1465 m, air bar aligned to mercury) ·
BuoyancyCrown (0.50×water stacked over 50% submerged, arrows at rest) ·
Barometer · SoundRace (both fronts labeled, Laplace footnote) · CorpuscleHail
(ideal-flow ghost underlay, clean shadow) · BernoulliPipe (see-saw: throat
−3.94 / bulge +0.60) · MolecularSprings (bonds + straight-line equilibrium) ·
PoiseuillePipe (counted 121:7 ≈ 17.3:1 → the R⁴ law as column heights) ·
ReynoldsTube (direct/sinuous lamp flips at the marked Re_c tick; eruption
within ~4 s) · WhorlsCascade · hero term strip (all plates correct at 1883,
smoothness permanently blank) — ALL PASS.

FIXED DURING THE PASS (each verified on screen after fixing):
- PressureOff: meter contrast was throttled by its own wreck threshold, then
  still inverted — root cause found in solver.step (boundaries() re-imposed
  AFTER project() manufactures edge divergence no sweep count removes). Meter
  now measures interior-only mean |div| at 160 sweeps: honest 1.8% vs broken
  4.3%-and-climbing.
- BoundaryLayerLoupe: drag meter had the sign INVERTED (face normal built
  fluid→solid, formula assumed solid→fluid — it reported the force on the
  fluid) and was 40× too small (solver p is the dt-scaled projection
  potential). Read −0.029 under the "meter finally moves" paragraph; now reads
  ≈ +1.13 steady. Reversal made legible: backflow arrows flip RED with a
  length floor (sign amplified, magnitude honest); prose retuned to "hunt…
  thin, shifting strip".
- StressCube: the audit's unfixed breaks-the-teaching item — built the ghost
  pair (σyx pinned at 0, they spin, smaller faster) so Cauchy's argument is
  demonstrated, not asserted; prose points at it.
- TimelineHero: solver eras started from empty water (dye takes ~6.5 s to
  cross), so every era switch showed a gray blob — Nick hit exactly this.
  Added the WingFlow-style 300-step pre-roll; era switch now paints developed
  flow within ~0.7 s (verified).

REMAINING before publish: the editorial read per section, a real-device
mobile/touch pass, and Nick's publish call. The deployed site predates ALL
figure fixes — redeploy whenever publish flips.

## What is left (in order)

1. **Real-browser QA pass** (above). Fix what play-testing breaks; lesson 01's
   tilt-to-stall cut is the precedent for letting figures lose to reality.
2. **Editorial read per section** — "does any moment here need a figure it
   doesn't have?" Watch the §11 (Open Question) stretch: it is the proseiest
   section (one figure). Scale rules are heuristics; judge, don't count.
3. **Stage-4 voice pass** against NICKS_VOICE/SLOP/ESSENCE. Known risk spots:
   the §9→§10 hinge ends on a genuine fork (ideal-theory-nearly-right vs.
   drag-hides-in-a-sliver) — check it reads live, not staged (SLOP family 17);
   fork-hinge drafts go to Nick for taste-testing per standing practice; the
   sibling audit (hooks/waypoints/ending must not rhyme with lessons 01/02 —
   the ending was written to a new skeleton: verify).
   Slop sweep 2026-09-04 (main loop, SLOP + INTROS): opening ¶1 clean (cold
   concrete history, no adjectives); ¶2 fails INTROS 2/3 ("This lesson is that
   argument" schedules, article-as-subject, series callback) — rewrite with the
   machine as subject, keeping the thesis-last pair ("The scene never changes.
   The theory drawing it does."); scattered "earned/honest" house-vocab (L283,
   L375, L530) is F18-lite — flatten to facts at the voice pass. L265 debt
   plant is the sanctioned SLOP-1 form; keep.
4. **Stage-5 audits**: palette (sepia never used for physics; term colors match
   lesson 01's), ledger (the §5 zero is visibly paid in §10; every nameplate
   filled by §12 except the blank end; the fluxions plant §3 → Stokes payoff §8;
   Navier's slip plant §7 → §8 microfluidics payoff), tense audit, anti-checklist
   (no inline citations — highest-risk item for a history article).
5. **Decisions (made 2026-07-06, revisable)**:
   - Archival figures: STAYS all-interactive — the plan's ≤6 archival budget
     (deviation b) is retired unused. The figures already recreate what the
     archival images would show (Reynolds's plates = the tube sim; Leonardo's
     storm = the dye figure), rights friction buys nothing.
   - Hero wake quality: DEFERRED — the CPU street-ish wake is honest and the
     behavior (separation, unsteadiness) is real; wiring the GPU backend into
     TimelineHero is a nice-to-have, not a publish blocker.
   - §6 TermToggle reuse: ACCEPTED — a knowing replay of a lesson-01 finale
     figure; its 4 switches are the point of the callback.
6. Registry flip to `published` + README + AGENTS.md updates + deploy — reserved
   for the user (propose, don't surprise).

## Judgment calls reserved for the user

- Publishing. Archival images. GPU hero upgrade. Any section cuts.
- Paradox-spine rebuild (proposed 2026-09-04 worker synthesis: tour→paradox
  re-spine with cut list; standing plan remains editorial read + Stage-4 voice
  pass + publish). Rebuild-vs-publish is Nick's call — no sections cut until then.
