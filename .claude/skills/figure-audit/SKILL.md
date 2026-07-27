---
name: figure-audit
description: Audit interactive figures in a lesson by looking at them as a reader — screenshot each one, answer the three reader questions, bind every prose claim to visible evidence, and exercise every knob to both ends. Use before publishing a lesson, after building or changing any figure, or whenever prose and figures were authored separately.
---

# Figure audit — read it, don't measure it

This skill exists because of one incident. An automated pass certified a lesson's
figures as clean: every canvas painted, zero console errors, all knobs present. A
human then glanced at two screenshots and found, within seconds, that three of the
six hero eras were **blank boxes**, a fourth-power law was shown with **one
specimen**, and the prose promised a drag readout the figure **did not have**.

The automation asked *did it render?* The reader asked *does this teach me
anything?* Only the second question has ever mattered.

## The prime directive

**Look at the figure. With your eyes. At a rendered screenshot.**

Counting non-transparent pixels is not looking. A background wash makes an empty
pane score 100% painted — that exact false negative is how the blank hero eras
shipped. Any health check whose output is a single number is measuring a proxy;
the proxy is not the thing.

## Procedure

### 0. Render the article

Start the dev server (`.claude/launch.json` has a `dev` config) and open the lesson.
If figures freeze off-screen behind an IntersectionObserver, scroll each into view
and let it run several seconds before judging it — a figure caught mid-warmup is not
evidence.

### 1. Per figure, screenshot it and answer three questions in writing

1. **What am I looking at?** One sentence, without consulting the source. If you
   can't, it isn't legible — that is a finding, not a note.
2. **Why is it doing that?** If the mechanism lives only in the prose and never on
   the canvas, the figure asserts rather than demonstrates.
3. **How would I know if it were lying?** Name the visible thing that would change if
   the physics were wrong. If nothing would, the figure is decoration and its number
   is a caption in disguise.

### 2. Bind every prose claim to visible evidence

Read the sentences immediately before and after each figure and extract every
**checkable claim** — anything of the form *X causes Y*, *X differs from Z*,
*Y scales as Rⁿ*, or an instruction like *read the N off it* / *slide it and watch M*.

For each claim, point at the pixels that deliver it. **A claim with no on-screen
evidence is a defect of the same severity as a crash**, and it is the most common
one shipped when prose and figures are authored by different passes — neither owns
the join, so nobody checks it.

Real examples caught this way:
- "Slide the two layers and read the drag between them" — no drag readout existed,
  and the layers' speeds were constants.
- "You can read the chapter's dates right off its four steps" — no dates on it.
- "Halve the radius and it collapses to a sixteenth" — 1/16 appeared only as a
  printed decimal; nothing on screen was sixteen times anything.

### 3. Exercise every knob to both ends

A range that changes nothing across part of its span is furniture pretending to be
an instrument. Watch for: a slider that only sets a *rate*, so after a few seconds
every setting looks identical; a gauge mounted where the quantity is mathematically
pinned; a knob that mutates a running state so the before/after is never visible
from one frame.

### 4. Apply the two structural rules (AGENTS.md, honesty rules for sims)

- **A figure must show the contrast its prose claims, in one frame** — a live
  counterfactual, a second specimen, or a frozen "before" ghost. Never a single state
  plus a printed number.
- **Verify by what it teaches, not by whether it painted.**

## Reporting

Return a ranked list. Per finding: severity (breaks-the-teaching / weak / nit), the
exact prose claim, what the figure actually shows, which check it failed, and a
**concrete** fix — a specific visual change, never "make it clearer."

List the figures that pass, explicitly. A clean bill is a real result; do not invent
findings to look thorough.

## When the environment fights you

Concurrent edits to sim files hot-reload the page and invalidate a verification run
in progress. Do not audit while other agents are writing to the same files — the
audit will be measuring a moving target, and its conclusions will be worthless.
Serialize: finish the edits, then audit.
