# Predicting Water

*An alternate visual and story sketch for the Navier–Stokes history lesson.*

**Disposition, 2026-09-11:** retained as design material. Nick chose to preserve
the improved history article and prepare parallel versions of the construction
lesson. Selected experiments from this sketch are candidates in its
[version-II revision plan](../01-navier-stokes/II_REBUILD_PLAN.md); this ten-section
story is not an active third-article or replacement-history build.

**2026-09-10 — proposal only.** Written alongside the existing article at Nick's
request. This is a new narrative, with proposed figures designed for it. Nothing
here changes the current lesson, implements a figure, or creates a published
version II. The passages between the visual briefs are a reading draft; the
briefs describe what a future reader would actually see and do.

## The change in the story

The current article contains several stories worth telling: how pressure became
measurable, how internal friction became a law, why an ideal fluid predicts no
drag, and how an equation became something a computer could run. Its chronology
keeps interrupting one with another. A repaired figure can explain its own
phenomenon clearly and still arrive before the reader needs it.

This version follows a prediction from one apparatus to another. **Can a
property measured here predict the water over there, without being adjusted
again?** The same fluid travels through the story. The experiments change because
each asks something the preceding experiment could not settle.

This is also a historical question. At the beginning of his 1845 paper, Stokes
objects to empirical formulas that describe their original observations but do
not extend to another class of phenomena governed by the same causes. That is a
stronger organizing idea than the equation gradually acquiring famous names.
[Stokes's original paper](https://pages.mtu.edu/~fmorriso/cm310/StokesLaw1845.pdf),
pp. 287–288, supplies the historical anchor for this editorial choice.

The sequence below is a modern reconstruction of the questions. It is **not** a
claim that Navier, Stokes, Reynolds, and Prandtl pursued this sequence of
experiments. Their disagreements belong in the story precisely where the tidy
reconstruction breaks: the same equation can emerge from different foundations;
the right equation can still be paired with the wrong wall condition; a useful
approximation can fail in a small region with large consequences.

The strongest existing alternate outline, in
[REIMAGINE.md](../../redrafts/fable-2026-09-02/navier-stokes-history/REIMAGINE.md),
organizes the article around the drag paradox. This sketch takes another route:
**prediction across experiments**, with drag as the hardest transfer rather than
the mystery announced on page one.

---

## 1. One opening, four openings

A pump can drive water through one wide tube or through a bundle of narrower
ones. Four tubes with half the radius have exactly the same total opening.
Give them the same length and the same pressure difference, and an estimate
based on open area gives both arrangements the same flow. Splitting the opening
tests what that estimate leaves out.

### Visual brief — split the pipe

Two transparent apparatuses sit beside each other. The left contains one round
tube. On the right, the reader clicks the opening to divide it into four smaller
round tubes, then sixteen. An end-on view makes the equal total area visible;
the side view makes the equal lengths visible. Thin walls are excluded from the
area accounting, rather than quietly consuming some of the opening.

Before the first run, both collecting vessels are empty. **Run together** starts
one shared clock. Fine amber markers show motion inside the tubes; water levels
show delivered volume. The four-tube bundle delivers one quarter as much as the
single tube. Sixteen delivers one sixteenth. Equal openings, an unmistakable
difference. Each collection lasts the same observation interval, then holds
its result for inspection instead of emptying itself on a loop. Switching the
bundle restarts both collections together.

**Hold fixed:** fluid, temperature, length, total open area, pressure difference.
**Reader changes:** subdivision, not time speed. **Try again:** see whether still
more subdivision makes the discrepancy larger or smaller. The one-tube reference
never disappears, and returning to one tube gives exactly equal collections.

**Model:** exact, steady Hagen–Poiseuille flow in long circular tubes, restricted
to the laminar regime. The vessels integrate the calculated volume flux; particles
are tracers and do not determine how much water has arrived. Omit entrance and
manifold losses explicitly. This is a calculation of the modern law, not an
animation presented as Poiseuille's original experimental evidence.

*After the figure:*

The opening is unchanged. The walls have multiplied. Water at the center of a
wide tube can be far from a wall; inside the narrow tubes, none of it is.

That observation identifies a place to look. It does not yet tell us how a wall
changes motion, or how to turn the change into a number. A rule saying “more wall,
less water” could be fitted to this apparatus and fail in the next one.

In the nineteenth century, that distinction mattered. Hagen and Poiseuille could
measure how flow depended on a tube's dimensions. Navier and Stokes were trying
to write a law that also applied where no tube was present.

## 2. Where the pressure goes

Water speeding through a narrowing needs a force. Water slowing after the
narrowing needs one too. Pressure can provide both. A fall in pressure can
accelerate the stream; a rise can slow it again.

The narrowing therefore poses a different question from our long, straight
tubes. Some pressure changes accompany a reversible change of speed. Others
remain after the speed has returned to what it was before.

### Visual brief — follow the gauges

A smooth constriction is shown above a straight tube. Each has an upstream and
downstream section of equal area. The reader slides a pressure tap along either
apparatus; its height on a common pressure plot follows its position. Both
complete pressure traces remain faintly visible behind the moving measurement.

For the constriction, narrow the throat while holding volume flow and upstream
pressure fixed. The ideal-flow pressure trace develops a deeper dip and returns
to its upstream value. For the fully developed viscous
flow in the straight tube, the trace slopes downward along its length. The speed
there stays the same from one cross-section to the next.

The motion has a different purpose in each view: identical parcels accelerate
and decelerate in the constriction; the straight tube's parcels keep their speed
while the gauge keeps falling. There is no purple failure field to interpret.

**Contrast:** pressure recovered after an ideal constriction versus pressure
lost along a viscous straight tube. **Control:** throat area; moving the tap is
inspection. **Model:** a quasi-one-dimensional, steady, inviscid Bernoulli
calculation above; an exact laminar pipe solution below. These are two specified
cases, not a measured loss curve for a real constriction. A real constriction
can also dissipate energy, especially if its flow separates.

*After the figure:*

In the straight tube, pressure supplies a continuing push without a continuing
increase in speed. Another force balances it.

Euler's fluid equations made pressure part of a law of motion throughout the
water. They could describe acceleration and turning. A frictionless,
fully developed flow in a straight horizontal tube, however, has no mechanism
for balancing a sustained pressure gradient at a steady speed. The missing
force acts where neighboring layers slide past one another.

Torricelli and Périer belong here in a short paragraph about the instrument:
pressure was a measurable quantity before there was a general equation for
moving water. Their full experiments do not need to precede the opening puzzle.

## 3. Motion beside motion

Put fluid between two broad plates. Move the upper plate while keeping the
lower one still. The fluid resists the relative movement. Move both plates
together, with the fluid already traveling with them, and that source of
resistance disappears.

Speed alone cannot specify internal friction. The fluid has to compare the
motion at one place with the motion nearby.

### Visual brief — move it, shear it, turn it

Three large material patches sit on a common, quiet background. Initially they
are identical squares containing a sparse grid of marked parcels.

The reader moves the first patch bodily, drags the upper edge of the second past
its lower edge, and turns the third as a rigid patch. A faint starting outline
stays underneath each. Translation preserves the square. Rigid rotation
preserves it too. Shear changes its angles.

Toggle **Show internal friction**. Tangential traction arrows appear for the
sheared patch. They do not appear merely because the other patches are moving
or rotating. The quantity being compared is viscous stress, not total force:
accelerating a patch or maintaining circular motion can require other forces.

**New distinction:** deformation versus translation or rigid rotation.
**Reader action:** manipulate the motion, then inspect the predicted stress.
**Model:** prescribed local velocity gradients evaluated with the Newtonian
constitutive law. This is a kinematic experiment, not three isolated fluid
squares somehow maintaining their shape in vacuum.

*After the figure:*

Newton proposed a relation between internal resistance and the sliding of
adjacent parts. Navier brought internal interactions into an equation of motion
in 1822, using a molecular picture whose details did not survive.

The subsequent derivations mattered even when they produced the same terms.
Cauchy's account of stress separated the question “what forces cross this
surface?” from “how does this particular material generate those forces?”
Saint-Venant and Stokes could formulate fluid friction through deformation
without making it depend on Navier's molecular construction. Poisson's competing
derivation belongs inside this disagreement, not in a separate room of names.

For the simple sliding experiment, the relation is small enough to write in
one line. A plate of area $A$ moves at speed $U$, a distance $h$ above the stationary
plate:

$$\frac{F}{A}=\mu\frac{U}{h}.$$

Double the relative speed and the shear force doubles. Double the gap and it
halves. The constant $\mu$ is dynamic viscosity, measured in pascal-seconds.

The general law uses the symmetric part of the velocity gradient, which is why
rigid rotation did not count as deformation. For an incompressible Newtonian
fluid with constant viscosity, its contribution to the momentum equation is
$\nu\nabla^2\mathbf u$, where $\nu=\mu/\rho$.

$$\frac{D\mathbf u}{Dt}=-\frac{1}{\rho}\nabla p+\nu\nabla^2\mathbf u,\qquad \nabla\cdot\mathbf u=0.$$

Here $D\mathbf u/Dt$ means the acceleration of water as it moves. Pressure and
viscous stress provide the forces in these horizontal experiments. There is no
row of empty author slots: the equation appears after its missing mechanism
has become something the reader can manipulate.

## 4. Measure once

The sliding plates can measure viscosity. Read the force, speed, area, and gap,
and the equation leaves one unknown. The useful test comes when that number
leaves the apparatus.

### Visual brief — carry the measurement

The plate apparatus now has a force gauge. The reader changes speed and gap;
each setting adds a point to a small plot of shear stress against $U/h$.
One slope fits all the points. A small physical-properties card reads
**Viscosity: … Pa·s** and identifies the sample and its fixed temperature.

Press **Use this measurement**. The card moves next to a pipe apparatus, keeping
its value. Change the pipe's radius. A calculated prediction of flow appears
before its comparison data are revealed. Then return to the original bundle:
the same value accounts for every subdivision.

The proposed historical comparison needs sourced experimental points with their
fluid, temperature, and dimensions. Until those exist, use explicitly labeled
synthetic readings to explain parameter transfer; do not have one formula
generate “measurements” and then announce its agreement as experimental proof.

**New capability:** predict a different geometry without another fitted
coefficient. **Strong contrast:** one radius versus half the radius, shown
together. **Second contrast:** the measured property stays fixed while apparatus
and force distribution change. This is the first long pause in the reading:
there should be enough room to make and test several predictions.

*After the figure:*

For steady laminar flow through a circular tube, the law predicts

$$Q=\frac{\pi R^4\Delta p}{8\mu L}.$$

Two factors of radius come from the cross-sectional area. Two more come from
the change in the velocity profile: at the same pressure gradient, widening
the tube also lets the fluid move faster.

Halving the radius therefore gives one sixteenth of the flow. Four such tubes
give four sixteenths, or one quarter. The first figure's discrepancy now follows
from the local force law and the geometry.

The next prediction could concern a slowly falling sphere, whose resistance has
a different dependence on size. Stokes's sphere result belongs in one short
paragraph here as evidence of the law's reach. It does not need a second race
to interrupt the experiment we have just learned to read.

*Technical grounding for the plate and pipe relations:*
[MIT's Couette and Poiseuille notes](https://ocw.mit.edu/courses/2-25-advanced-fluid-mechanics-fall-2013/resources/mit2_25f13_couet_and_pois/).
The equal-area bundle comparison is our proposed experiment derived from those
relations, not a claimed historical apparatus.

## 5. The fluid stays the same. Change the surface.

The calculation has used another assumption: water immediately against a
stationary wall is stationary too. A viscosity measurement does not establish
that condition. It describes the fluid's internal response; the contact with a
surface still needs to be specified.

### Visual brief — exchange the lining

Keep two identical pipes and the same fluid card. The left has a no-slip wall.
On the right, exchange that condition for a specified slip length. Both velocity
profiles remain visible on the same scale, with a highlighted marker at each
wall. At no slip, that marker is stationary. With slip, it moves and the entire
profile shifts upward at the same imposed pressure gradient.

The reader can pin the two most different states. Collections run together.
The viscosity number never changes. Color identifies the boundary condition on
the lining, rather than recoloring the water as though it had become another
substance.

**New input:** a boundary condition. **Model:** the exact circular-pipe solution
with uniform Navier slip length $b$, giving
$Q_b/Q_0=1+4b/R$. An illustrative $b/R=1$ gives five times the flow. Say plainly
that this is a large slip length relative to the tube radius; it is not a claim
that an ordinary coating makes a household pipe five times faster.

*After the figure:*

Navier's wall condition is part of the history, too. The later success of
no-slip descriptions did not turn a boundary condition into a theorem about
every surface at every scale.

There are now two different ways to repair a failed prediction. The fluid law
may be inappropriate, or the contact with its surroundings may be misdescribed.
Adjusting viscosity until a pipe's flow matches a measurement can conceal the
second error inside the first number.

## 6. Take the walls outside

Inside a tube, the wall surrounds the water. Around a submerged body, the water
surrounds the wall. The same local forces now add up to a push on the body.

A familiar guess is that the water piles up at the front and pushes downstream.
But the force depends on pressure over the entire surface, including the back.

### Visual brief — change the back half

Two side views show a blunt body and a smoothly tapered alternative. The reader
chooses between a few carefully defined shapes, rather than drawing arbitrary
geometry that the calculation cannot handle reliably. The silhouettes are large
enough to be the subject of the figure. Two narrow dye ribbons divide around
them and reveal the downstream flow.

Beside each body is its surface pressure trace. Drag along the surface and the
corresponding contribution to downstream force lights up on the trace. Pressure
and wall-shear contributions have separate, signed totals.

First show the steady, irrotational, inviscid comparison. The integrated drag
cancels for both shapes under its stated assumptions. Then reveal the viscous
calculation beside it. The shape's effect on separation and the wake changes
the pressure distribution, while wall shear supplies another force.

**New question:** can the model transfer to an external flow? **Reader action:**
change the tail, then locate where the force changes. **Reference:** the ideal
pressure trace stays visible. **Model:** analytical or independently checked
potential flow, compared with a resolved two-dimensional viscous calculation
over a bounded parameter range. Do not promise that every longer tail reduces
total drag or that this predicts an aircraft's performance.

*After the figure:*

D'Alembert's zero-drag result predates the viscous equation. It enters here as
an earlier prediction whose assumptions we can now inspect. The cancellation
is real within steady potential flow; it does not say that accelerating a body
requires no force, or that inviscid fluids can never have wakes or lift.

Adding viscosity gave a law capable of describing resistance. It did not make
every useful flow easy to calculate. In fast flows, viscous effects can be weak
over much of the domain while remaining important near a surface. Treating them
as small everywhere loses the very region that can change the wake.

## 7. A smaller layer, still a whole velocity change

At a no-slip surface, velocity must match the wall. Farther away, water can be
moving rapidly. Making the transition region thinner makes the velocity gradient
larger. A small viscosity multiplying a large gradient cannot be dismissed by
looking at viscosity alone.

### Visual brief — change the scale of the ruler

Use a clean, laminar flat-plate case to isolate this idea. Two specimens have
the same external speed and observation distance; one has a quarter of the
other's kinematic viscosity. Their boundary-layer profiles appear together at
the same physical scale. One layer is approximately half as thick.

Now let the reader switch the vertical ruler from physical distance to distance
divided by the layer thickness. The two profiles collapse onto the same curve.
The full drop from external speed to zero was present in both views all along.

**Reader action:** rescale the view, not speed up the movie. **Two revealing
states:** the layer shrinking in ordinary coordinates and retaining its
structure in boundary-layer coordinates. **Model:** the Blasius laminar
flat-plate solution, with $\delta\sim\sqrt{\nu x/U}$; this scaling is not a
universal thickness formula for separated or turbulent layers.

*After the figure:*

Prandtl's 1904 boundary-layer argument changed how the equation could be
approximated. It added no new force term. Near-wall and outer regions had to be
treated at different scales and connected.

Around the back of a body, pressure can rise in the direction of the flow.
Fluid slowed near the wall may reverse, and the flow can separate. The resulting
wake changes pressure over a substantial region: the error is not confined to
the thin layer where it began.

Return briefly to the two body shapes. Their pressure traces are now readable
as consequences of a flow leaving the surface differently, rather than as
colored curves with an unexplained drag number. The flat-plate calculation
explains the scaling idea; the body calculation must independently show the
claimed separation. One is not a substitute for the other.

## 8. Disturb the prediction

The neat pipe profile is a solution of the equation under its assumptions.
That alone does not tell us whether a flow prepared near it will remain near
it. An experiment introduces disturbances through its inlet, walls, and motion.
What those disturbances become is another prediction.

Reynolds made the distinction visible with a thread of dye in pipe flow. His
1883 investigation belongs here, after there is a laminar solution worth
challenging. The dye identifies where water goes; it does not make a second
fluid with a different law.

### Visual brief — put a disturbance somewhere

This is the richest motion in the sketch. Two identical two-dimensional shear
flows start side by side, with amber and rose marking their initial layers.
The reader adds a localized, divergence-free disturbance to the right flow,
choosing its location and strength. The left remains the reference. A faint
initial interface stays in each view.

Small disturbances can roll the interface into large curls in an appropriate
unstable case. In a more strongly damped case, the visible deformation weakens.
The reader can replay the same disturbance at another viscosity, keeping its
shape and amplitude fixed. **Add dye only** provides a control experiment:
changing a tracer must not change the velocity.

There is no short automatic reset. A shared clock, synchronized restart, and
an elapsed-time marker let a disturbance develop. The velocity difference
between the two flows is measured separately from the amount of colored dye.

**New question:** what happens to a perturbation? **Model:** a validated,
two-dimensional shear-layer initial-value problem, with boundaries and initial
profiles disclosed. This demonstrates instability and nonlinear evolution.
It is explicitly not a simulation of Reynolds's three-dimensional pipe
transition, a universal critical Reynolds number, or the three-dimensional
energy cascade. The historical pipe experiment can appear as a small archival
figure rather than a counterfeit live reconstruction.

*After the figure:*

The equation did not acquire a turbulence term when the interface folded.
The motion changed under the same law. In a real pipe, the relation between
disturbances, viscosity, geometry, and transition is more involved than this
two-dimensional example.

The Reynolds number compares inertial and viscous effects,
$Re=UL/\nu$. It organizes comparisons between appropriately similar flows; it
does not specify the geometry, the disturbance, or the answer by itself.
Reynolds's [original investigation](https://www.homepages.ucl.ac.uk/~uceseug/Fluids3/Extra_Reading/Reynolds_1883.pdf)
is the source for the historical experiment, not for our proposed shear-layer
interaction.

## 9. The computer is another approximation

A numerical calculation supplies velocities at finitely many locations and
times. Motion smaller than its grid cannot simply be assumed to be present
because the picture is smooth. The instrument producing our prediction needs
tests of its own.

### Visual brief — keep the water, change the calculation

Bring back one saved disturbance from the previous figure. Run it at matched
physical times on a coarse and a finer grid with the same physical viscosity
and a controlled timestep comparison. Both views occupy equal screen space;
the fine view is not just a larger bitmap.

The reader switches between dye, velocity, and a volume-balance diagnostic.
On dye, interpolation can make the coarse flow look excessively mixed. On
velocity, structures may differ. On volume balance, the reader sees what a
pressure correction specifically repairs. A before-correction state is frozen
beside the corrected state; it is never presented as another physical fluid.

**Reader action:** inspect one saved experiment through different measurements.
**New distinction:** changing physics versus changing the numerical method.
**Model:** an actual discretized solve with measured diagnostics. Agreement
between two resolutions is evidence to investigate, not a proof of convergence;
small divergence alone does not certify the velocity field or dye transport.

*After the figure:*

The machine-age history now has something concrete to explain. Harlow and
Welch's staggered arrangement of variables, Chorin's pressure projection, and
Stam's practical graphics method concern how a fluid equation can be computed.
They did not introduce new kinds of water. Chorin's
[1968 paper](https://math.berkeley.edu/~chorin/chorin68.pdf) supplies the projection
method's primary source.

Bounded animation is useful. Predictive accuracy requires more: suitable
resolution, controlled numerical errors, appropriate conditions, and comparison
with quantities outside the picture. A flowing dye ribbon is not a validation
by itself.

## 10. The same water, one last change

### Visual brief — ask for the same delivery

The opening apparatus returns with the viscosity measurement still attached.
One wide tube, four narrow tubes, equal total opening.

The initial mode is **Same pressure**: the bundle delivers one quarter as much.
The reader changes the requirement to **Same delivery**. Now both vessels rise
together, while the bundle's pressure difference rises to four times the
single tube's. Both pressure gauges stay visible on a common scale.

These are two operating conditions of the same law, not two independently tuned
animations. The reader can choose sixteen tubes and predict the required
pressure before revealing it. Restrict the available settings so every tube
remains within the laminar, fully developed model used throughout.

*Ending:*

Four narrow tubes provide the same total opening as one wide tube. To deliver
the same flow, they need four times the pressure difference. The fluid's
viscosity has not changed between those measurements. Its contact with the
walls gives it a different velocity profile, and the local force law predicts
the difference at the gauges.

Navier's molecular account, Stokes's continuum derivation, the pipe experiments,
and Prandtl's treatment of a thin layer answered different parts of that task.
Writing an equation supplied a relation among forces and motion. Using it
required measurable properties, conditions at surfaces, and a way to find the
flow those conditions produced.

The pressure on the gauge is where all of them meet.

---

## What this version gives up, and why

| Current material | Proposed treatment in this sketch |
|---|---|
| Six-era hero, repeated at the end | Replace with one experiment whose final interaction asks the inverse question. Dates identify developments in the prose; they do not pretend to be a physical control. |
| Archimedes, Torricelli, Périer, Leonardo before the main argument | Keep pressure measurement as a short historical bridge. Bank the full statics and observation stories for an article in which they can be the central experiments. |
| Newton's projectile fluid and sound-speed error | Omit from this version. Neither is needed to explain the transfer from internal stress to pipe flow and drag. Keep Newton's shear hypothesis. |
| Bernoulli family dispute and calculus priority war | Omit the long excursions. Use the actual pressure/speed relation where a reader needs to distinguish recovery from loss. |
| Five derivations, each with a new spectacle | Make their disagreement one substantial passage about what a material law claims. The movement/deformation comparison gives that argument a visible subject. |
| Falling spheres and capillaries as neighboring demonstrations | Make parameter measurement and transfer the organizing experiment. Mention the sphere as another successful prediction; do not require another full visual to make the point. |
| Zero drag as a long-delayed promised payoff | Introduce it when transferring the law from internal to external flow. Read the assumptions and the full force integral before invoking a paradox. |
| Reynolds number as a speed-like knob | Let the reader prepare a disturbance and repeat it under controlled changes. Keep pipe-transition history distinct from the tractable live experiment. |
| Richardson, Kolmogorov, spectra, Leray, Ladyzhenskaya, regularity prize | Give turbulence statistics and mathematical existence their own linked afterword or later lesson. They deserve more than a final procession of names. No claim about the present status of a mathematical problem is needed for this ending. |
| Advection/diffusion/projection buttons | Replace the menu of terms with one saved experiment and specific tests of its calculation. |
| Recap, historical roll call, and open-question finale | End on the opening apparatus, operated under a new requirement. Bibliography follows without another rhetorical ending. |

This is a narrower history of how a fluid law earned predictive reach. It loses
some biography and chronology deliberately. If the title promises an exhaustive
history of Navier–Stokes, the title needs to change with the scope.

## The visual journey as a whole

The progression is spatial as well as conceptual: **an entire apparatus → a
pressure reading → a material patch → a measured property → a different surface
→ a body and its wake → a thin layer → an evolving disturbance → the grid that
calculates it → the original apparatus.** Each change of scale answers a question
left visible in the preceding scene.

The figures should share precise outlines, generous space, and a restrained
palette. Amber and rose identify marked origins in the same fluid; neither
means “wrong.” Pressure uses its own signed scale. Viscous stress is shown at
the surface where it acts. Reference specimens remain fully legible, not gray
ghosts so faint that a comparison is nominal rather than possible.

Controls belong to the apparatus: split an opening, place a tap, deform a patch,
carry a measurement, replace a boundary condition, reshape a tail. Playback
controls only appear where elapsed time teaches something. Static calculations
need no ceremonial Pause button. On a phone, paired specimens stack and retain
common scales; essential labels and meters stay outside the moving fluid.

The quiet figures do important work. A pressure trace recovering its height,
or two boundary profiles collapsing when the ruler changes, can be more
revealing than another vortex. The disturbance experiment earns the richest
motion because, by then, the reader has a law whose ability to predict that
motion is at stake.

## Before turning this sketch into a build

Three proposals carry the most uncertainty. The plate-to-pipe transfer needs
independent, compatible experimental data before it can teach experimental
validation. The shape comparison needs a numerical range where separation,
pressure force, and wall shear are adequately resolved. The disturbance
experiment needs a benchmark that visibly distinguishes growth from damping
without confusing a two-dimensional instability with pipe turbulence.

The slip-pipe relation also needs its own source check before publication; its
large illustrative slip setting must stay clearly separated from claims about
ordinary macroscopic water pipes. Historical derivation details should be
checked against the primary memoirs and Darrigol, rather than copied wholesale
from the current article or its research notes.

Those are feasibility and sourcing questions for a future implementation.
They do not require a new article shell or any code now. The most useful first
prototype would be the opening bundle and the final equal-delivery operation:
if that single apparatus cannot make the reader want to understand the
difference, the rest of this proposed story has not earned a build.
