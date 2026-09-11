# Part 2 — prose: make the reasoning readable

Companion to [the revision workflow](METHODOLOGY_PART_2.md). For voice and structure,
use NICKS_VOICE, ESSENCE, SLOP, and INTROS. This guide records what the history
revision taught us about editing prose that already exists.

## Start with the reader's unfinished thought

“Does the mercury expand?” was more useful than a request for a nicer paragraph.
It revealed a missing causal step: tilting increases the volume occupied inside
the tube, and that mercury comes from the dish. Once the reservoir was included,
the prose could describe a transfer the reader could see.

Treat such questions as evidence about the explanation, even when the reader's
proposed physics is wrong. Answer the reasonable inference. Do not begin with a
defensive sentence explaining that the figure is correct.

Before editing a section, identify what the reader knows on entering, what they
will observe, and what that observation permits them to conclude. Introduce a
name when it helps describe that conclusion. Avoid requiring unexplained symbols
to operate the figure that is supposed to introduce those symbols.

## Write the two sides of the experiment

Above a figure, establish the object, what is held fixed, and a useful action.
Below it, identify the visible difference and explain its cause. These need not
be three sentences or follow a repeated template.

For a controlled pipe experiment, “Keep the pressure drop fixed and halve the top
pipe's radius” gives the reader something specific to try. Afterward, explain
why a sixteenfold reduction in flow is more than the fourfold reduction in area:
the mean speed also falls. A printed power law alone leaves that second effect
unexplained.

For a solver, distinguish the physical model from the numerical method and the
display. Viscosity smooths velocity; interpolation can also blur a field; dye
marks fluid that already exists. Calling all three effects “mixing” conceals the
very distinctions the article needs to teach.

## Let the reasoning supply the pace

The history draft often compressed several people, metaphors, and conclusions
into one dramatic paragraph. Nick singled out the passage about “fictional
molecules,” “blood and brass,” and a “Cambridge hermit.” Its concrete point was
much simpler: the equations described measured steady flows, while rapidly
changing flows remained hard to calculate.

Keep the people and incidents that explain a discovery. Give a causal step room
when understanding it changes the next experiment. Compress repetition and
ceremony. A small sentence can land well; a succession of fragments can force the
reader to reconstruct connections that the writer should have supplied.

The same applies to failure stories. A failed update should be a plausible attempt
with a specific defect. Explain why the repair addresses that defect. Repeating
“something is missing” between unrelated demonstrations creates suspense without
developing an argument.

## Copyedit without sanding everything flat

Read paragraphs aloud and repair where the syntax makes a second reading necessary.
Common fixes in this thread were joining detached fragments to their subjects,
replacing vague pronouns with the quantity they meant, and removing metaphors that
changed halfway through an explanation.

For example:

- “Viscosity is the assassin of every vortex” became “Viscosity also weakens
  vortices.” The following demonstration supplied the interesting part.
- “Pressure has no equation” became “Pressure has no independent time-evolution
  equation here.” The smaller claim remains compatible with the Poisson equation
  immediately below it.
- The repeated language of debts, crimes, verdicts, and equations behaving like
  people was reduced where it displaced an actual physical relation.

These examples are diagnoses, not a blacklist. Keep an unusual phrase when it
helps the reader see something. Keep warmth, curiosity, and the occasional joke.
Do not turn a local request for smoother prose into a new outline or enforce a
quota of short sentences, metaphors, questions, or figures.

## Check prose against the implementation

Read every sentence containing “same,” “only,” “always,” “zero,” or a numerical
comparison against the experiment. Equal current settings do not establish equal
past conditions. A smooth-looking simulation does not establish accuracy. Two
colors overlapping do not establish molecular mixing.

When a visual changes, update its setup and interpretation in the same pass. Link
to the previous lesson at the sentence that invokes it. Further reading should
lead to the actual resource and explain what the reader can learn there. Internal
navigation must survive the production base path.
