# Closeout — session `44cad31c`, 2026-09-02 → 2026-09-06

The session that produced this folder ended cleanly at 11:56 local on 2026-09-06,
its last turn a proposal awaiting a yes, and was then orphaned by a machine
reboot seven minutes later. **It did not die mid-task.** Nothing was in flight,
nothing is half-written, and there is no partial state to repair. This note
exists so the reasoning does not have to be recovered from a 4.4 MB transcript a
second time.

Written 2026-09-06 as a capture pass. No article, sim, or voice doc was touched
by that pass.

## What landed, all committed

`1946df1` → `95ec4d0`, eight scoped commits.

| what | where | state |
|---|---|---|
| Voice-doc critique | `00_VOICE_DOCS_CRITIQUE.md` (this folder) | complete; **nothing applied to the docs** |
| Judge notes | `01_JUDGE_NOTES.md` (76 KB) | six verdicts + eight structured returns, recovered from the workflow journal before the session limit could lose them |
| Eleven reimagined outlines and intros | `<lesson>/REIMAGINE.md` × 11 | first drafts, unrevised, **all eleven unread by Nick** |
| Waves 05, *Where the Simulation Is Wrong* | `src/lessons/lesson-05-where-simulation-is-wrong.mdx`, registry id `where-the-simulation-is-wrong` | live, `draft`, ~6,650 words; **never viewed rendered** |
| The problem brief | `articles/08-learned-solver/PROBLEM.md` | complete — five things a model is, five error bins, the Mori–Zwanzig form of the closure, the check ladder |
| Two invention passes | `articles/08-learned-solver/INVENTION_A_closure.md`, `INVENTION_B_system.md` | complete, gems ranked; **two experiments worth running, neither run** |
| The landscape article | `articles/08-learned-solver/LANDSCAPE.md` | complete, ~10,600 words, every citation marked verified-by-fetch or secondary. Waves 05's source ledger |
| I · II · III version switch | registry, `VersionSwitch.tsx`, `LessonView.tsx` | working, verified in a browser; **only lesson 04 has versions** |

Lesson 04 keeps I (the old baseline) and II (the narrow pressure-seam rewrite
Nick called a mis-scope, kept only as a comparison point). The map that was
briefly filed as its version III was promoted to its own lesson at `95ec4d0`,
because it is a different article and not a version of that one.

## What the session got wrong, once, on the record

Nick stated the scope three times — *comprehensive: how Navier–Stokes models work
and every way deep learning can make them better, not just faster* — and got
documents about the article three times instead of the article. His words:
*"are you dodging what I asked for."* He was right. **When the commission has
been stated three times, that is the checkpoint; write the thing.** Recorded in
memory as `commission-scope-beats-story-test`.

Cost note from the same session: the fan-out launched 44 agents and completed 14
for ~3.5M subagent tokens, three times the fleet the request named. The judge,
revise, and sibling stages were the overspend.

## The gate: the eleven outlines are unread, and they block the rest

This is the single most useful thing to know about the state of this repo.

Four separate lines of work are downstream of Nick reading
`02_INDEX.md` and picking spines: version II of the other ten lessons cannot
start, the three spine swaps (navier-stokes, navier-stokes-history,
jacobian-hessian) need his explicit yes, the flagged physics lines cannot be
fixed against an unaccepted outline, and the voice-doc fold is guessing at which
lines to retire without knowing which spines survive.

`02_INDEX.md` is 5 KB and carries a verdict on each of the eleven intros. It
stands in for the eleven long files. **Read that one file** and most of the
queue unblocks.

## The open proposal, and where it now lives

The session's final turn answered *"could we replace Navier–Stokes?"* with a
constructive build proposal and stopped for a yes that never came. That
reasoning is now written down as
**`articles/08-learned-solver/PROPOSAL_thirty_two_cells.md`** — the Mori–Zwanzig
framing, the three-lane forced Kolmogorov box, the energy-ledger operator with
correlated noise, the cost, and the named failure mode. It is marked UNAPPROVED
at the top and is awaiting a go/no-go.

Everything else that is open is filed in **`RESEARCH_QUEUE.md`** at the repo
root, which this note's items point into rather than duplicate.

## One incident worth not repeating

While filing the new lesson, a repair script truncated `src/lessons/registry.ts`
before its own assertion fired, which also wiped a concurrent MUSE session's
Einstein–Grossmann registry entry from the working tree. The entry was restored
verbatim from a diff printed earlier, and typecheck and build are green with it
in place. A `git commit --amend` in the same chain then committed a stale index,
so a broken registry sat at HEAD for two commits.

**The cause and the safe pattern are written up in the
`shared-worktree-atomic-writes` memory note** — compute-assert-then-write
atomically, never chain a risky script with `--amend`, and stage only your own
hunks of a shared file with `hash-object` + `update-index`. Not repeated here;
that note is the home.

The standing fact behind it: Nick runs several Claude sessions in this one
working tree. **Diff before you write, every time.**
