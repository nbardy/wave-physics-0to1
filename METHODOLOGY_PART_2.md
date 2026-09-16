# Methodology, part 2: revising with a reader

This is the revision workflow we learned while rebuilding the Navier–Stokes
history lesson with Nick on September 9–10, 2026. Read it alongside
[METHODOLOGY.md](METHODOLOGY.md), which still owns the five-stage process.
The two practical guides are [prose](METHODOLOGY_PART_2_PROSE.md) and
[visuals](METHODOLOGY_PART_2_VISUALS.md). The voice documents still own voice;
these notes explain how we used reader feedback to improve an existing article.

## What changed our approach

Nick's recurring question was some version of “What am I looking at, why is it
here, and what does touching it let me discover?” Most of the original figures
could animate and still fail that test. More resolution would not have explained
the lattice. A larger drag meter would not have explained why it stayed at zero.
A more dramatic wake would not have established whether the solver conserved fluid.

The useful unit of revision became a **claim, an experiment, and its explanation**.
We revised all three together. Sometimes that meant correcting a label; sometimes
it meant replacing a numerical method. The size of the fix followed the cause.

| Reader observation | What inspection found | What the revision had to do |
| --- | --- | --- |
| Equal pipes collect different amounts | The counters retain different past radii | Start both collection intervals together; integrate volume, not marker arrivals |
| The mercury seems to expand | The picture omits its supply | Show mercury leaving a finite reservoir and conserve the total |
| The wing leaves a vacuum | Inlet dye misses recirculation; the old solver also loses flux | Add passive wake markers **and** repair the pressure solve |
| The filament grows permanent spikes | A spatial dye experiment reads as a clipped time series | Follow separate moving parcels; let disturbances leave the tube |
| The magnifier is hard to use | Cursor, target, and readout occupy the same place | Keep a visible probe on the surface and put its profile beside the flow |
| The algorithm buttons mean nothing | Repeatedly running one operation destroys the state needed for comparison | Use controlled inputs for isolated operations; use successive snapshots for a pipeline |

These are distinct diagnoses. “Make it clearer” should not automatically produce
more explanatory text, and “make it more exciting” should not automatically produce
stronger forces.

## A revision cycle we can repeat

1. **Read the actual page.** Record the reader's interpretation before explaining
   the intended one. A screenshot can expose a misleading shape; motion and control
   use expose the state behind it.
2. **Write the discovery in one sentence.** Name either the capability gained by
   adding something to a model, or the isolated relation being examined. If neither
   is worth a figure, combine or remove it.
3. **Locate the cause.** Separate a prose gap, a bad visual encoding, an interaction
   failure, and a physical or numerical error. Several may coexist.
4. **Make the smallest complete experiment.** Include its comparison, control,
   reset behavior, and measurement. The visual guide describes the choices.
5. **Write around what it actually shows.** Set up the action above; interpret the
   visible result below. Repair nearby transitions when the experiment changes.
6. **Check the claim, then read again.** Verify the relevant quantity independently,
   exercise controls in both directions and while paused, and inspect narrow-screen
   layouts. A passing build establishes none of those things.

Keep a short working ledger: reader observation → diagnosis → change → evidence →
remaining limitation. Close it in the article's HANDOFF. Do not turn every incident
into another repository-wide rule; update an existing principle when the new
evidence improves it.

## Keep neighbouring articles distinct

Before judging an alternate outline, name the existing article's job and compare
it with its neighbours. The history lesson follows changes in what people could
explain and measure. The construction lesson follows changes in what a computation
can do. They can share an equation or a solver without sharing a plot.

A stronger individual experiment does not by itself justify a new article or
replacing the old one. Identify what understanding the proposed article adds.
When its best contribution is a clearer way to teach existing material, fold that
experiment into the appropriate revision and retire the competing outline from
active work. Check its placement: a pipe prediction using pressure belongs after
pressure has been introduced, even if the idea originated in a viscosity sketch.

For the construction lesson, a useful sequence is: store a field, move a quantity,
discover a numerical failure, choose a better update, exchange momentum, measure
unbalanced flow, solve for pressure, then execute one complete timestep. The
reader's progress is an expanding ability to inspect and repair a simulation.
Historical dates belong in the history article unless a date helps this task.

## Where to stop

A revision is finished when the experiment answers its question, its controls keep
answering it under ordinary use, and its explanation reads naturally. Preserve
good sections. Do not replace an article merely because a new outline is possible.
The separate history version-two sketch was useful precisely because it let us
explore a different story without continually destabilizing the working article.

Preserve a reproducible baseline before a larger revision. Two MDX versions can
still share mutable simulation components, so copying the prose does not freeze
the old experience. Keep enhancements opt-in and checkpoint the complete source
needed to render the baseline.

Close the record as well as the code. A successful visual pass does not close a
separate factual review. Reconcile older findings against the current files and
give surviving issues an owner. Put a short current-state summary above historical
handoff notes, distinguishing built, checked, committed, and deployed. Otherwise,
completed work can keep reappearing as a task while unresolved claims disappear
beneath newer entries.
