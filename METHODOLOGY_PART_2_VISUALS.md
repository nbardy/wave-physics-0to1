# Part 2 — visuals: build an experiment worth touching

Companion to [the revision workflow](METHODOLOGY_PART_2.md). The simulation honesty
rules remain in AGENTS; this guide explains the design decisions behind our
September 2026 history revisions.

## Give the figure a reason to exist

Choose the question before the renderer:

- **A model gains a capability.** Adding pressure correction lets a proposed
  velocity field satisfy incompressibility. Show the proposed flow and corrected
  flow, with the same flux measurement on both.
- **An isolated relation becomes visible.** Tilting a barometer changes column
  length while pressure fixes its vertical head. Show both rulers, and account
  for the mercury that moves between vessels.

A pleasant animation can introduce an object. It cannot carry every later
argument about that object. Reusing the same wing in every section does not make
pressure, diffusion, and numerical transport distinguishable.

## Choose an interaction that belongs to the question

| Reader task | Useful interaction | What must remain visible |
| --- | --- | --- |
| Compare a parameter | Slider with a fixed reference | Both states, same scale and elapsed time |
| Change an assumption | Named alternatives | What is removed; shared initial conditions |
| Inspect a computation | Discrete steps or an iteration scrubber | Input, output, and the quantity that changed |
| Measure a field | Visible probe plus separate readout | Where the sample comes from |
| Intervene in a flow | Stir, inject dye, or move a boundary | Which state the intervention changes |
| Compare historical models | Notched timeline with a keyed overlay | Model identity and the meaning of the overlap |

The timeline's cyan comparison layer was a display overlay of independently
computed flows. It did not interpolate equations. Its nearest era retained the
normal palette, while the other era faded in toward the midpoint. That made
differences legible without pretending a half-Euler, half-Navier fluid exists.

Prefer a large, informative change over a broad nominal range. Check whether an
automatic scale cancels the effect: our ideal-flow force arrows originally kept
the same length as speed changed because their normalization changed too. A fixed
force scale revealed the quadratic dependence.

## Design the experiment's memory

State is part of the teaching. Decide what happens when a control changes:

- A comparison of collection rates starts a fresh interval on **both** pipes.
- An iteration scrubber selects a result computed from the same original error.
- A pipeline advances one state through successive operations; running one
  operation repeatedly answers a different question.
- A passive dye pulse changes the marker field, while stirring changes velocity.
- A history slider preserves control focus and pointer capture while selecting
  cached states. Recreating the slider during a drag breaks the experiment.

Test the return trip. A control that works only on the first drag is broken.
Test it while paused. A parameter sets the rule for future evolution; a direct
intervention changes the current state. In the construction workbench, adding dye
or applying a push works while paused, so the reader can inspect the change before
resuming time. The push is projected immediately to preserve incompressibility;
adding dye leaves velocity unchanged.

Static investigations need no Play button. They also need no Reset button if
recreating the figure just redraws the selected parameter values: that button has
no observable effect. Give a restart a precise meaning, such as restoring initial
conditions or starting a new collection interval. Do not erase an interesting
failure with an unexplained automatic reset; let the reader inspect it and restart
deliberately.

## Make the evidence legible

Draw geometry, arrows, contours, and labels at display resolution. A numerical
grid can be coarse while the obstacle outline remains crisp. If the grid itself
is the subject, show its cells deliberately and explain where quantities live.
Do not imply that interpolation adds physical resolution.

Separate controls, labels, and readouts from the action. The fixed boundary-layer
profile was easier to use than a loupe sitting on and hiding the cursor. On a
narrow screen, stack comparisons instead of shrinking their labels into two
unreadable columns. Show units, references, and selected values in ordinary text.
Color reinforces a named role; it should not be the only way to identify a state.

Use traces to reveal motion and landmarks to reveal scale. A curve down a pipe
must read as the current positions of dye parcels, not an accumulated graph of a
single parcel's history. A pale wake is unmarked fluid unless another measurement
establishes that fluid is actually missing.

## Verify the phenomenon separately from the picture

The wake investigation needed both kinds of evidence. Passive markers entered
regions the inlet dye missed, but an independent inlet/outlet measurement also
found a real mass-balance error. The repair changed the pressure discretization;
decorative vortices would have hidden the defect.

Choose a check that could fail for the specific wrong reason:

- Equal-radius pipes collect equal volume; a half-radius pipe collects 1/16.
- Mercury gained by the tubes equals mercury lost by the reservoir.
- A pressure correction reduces measured divergence and preserves the compatible
  rotational part of a test field.
- A zero-drag integration responds to a deliberately asymmetric pressure test.
- A timestep comparison produces the same state under different render cadences.

Then inspect the rendered evidence. Measure the relevant dye, column, arrow, or
bar rather than “non-background pixels.” Exercise endpoints, a middle value,
rapid reversals, reset, pause, keyboard control, and a narrow viewport where they
apply. Check that an off-screen or visibility-hidden canvas is actually advancing
before diagnosing a frozen solver. A changed DOM readout does not establish that
the canvas has drawn that state yet. In this thread, sampling too soon produced
false failures on every slider's return trip. Wait for the requested value to
appear in the rendered figure before comparing images. Reload after code changes
when an existing stepper still holds an old closure; do not diagnose hot-reload
state as a physics failure.

Finally, state the limits at the point of inference: prescribed motion is an
illustration, a coarse two-dimensional wake is not resolved three-dimensional
turbulence, and a residual close to zero checks a discrete constraint rather than
the accuracy of the entire simulation. Those distinctions make an experiment
more useful to explore.
