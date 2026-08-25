# DENSE CORE — Teaching a Solver to Guess

Seeded by an external visual proposal (`source/VISUAL_STORYBOARD.md`, delivered
2026-08-19 as a zip: four static diagram scaffolds plus a full story spine under
the working title *The Learned Solver*). The storyboard's spine, palette
discipline, and figure-audit obligations are adopted. v1 built one seam for real;
Nick's verdict (2026-08-25) was that the storyboard's MAP — every insertion point,
explained — is half the commission. v2 keeps the do-it-for-real rule and doubles
the experiments: two seams trained honestly, every other seam mapped honestly.

## Thesis

A neural network can make this fluid solver faster. It does — measurably, in the
reader's browser, from weights that live in the repository. The article is about
what that sentence is worth once you insist on naming the baseline it beat and
the meter that proved it — and its spine, found during the v2 build, is a **tour
of checks in descending strength**: the residual can acquit (pressure seam, first
experiment); conservation can only convict (advection seam, second experiment);
the closure and surrogate seams have no in-loop meter at all (mapped, not faked).

## The hook

The trained network is *89% right about the pressure field* and, by the meter the
solver actually watches, **worse than guessing zero**. Both statements are
measured on the same forward pass, in the same figure, side by side. Relative
field error 0.106; relative residual 2.27, where a cold start scores 1.00 by
definition.

That contradiction is not a paradox and it is not a gotcha. It is the whole
mechanism: Gauss–Seidel destroys rough error in a handful of sweeps and smooth
error almost never, so the useful thing a network can supply is exactly the part
a residual meter is blindest to. Name the error before you claim to reduce it —
the storyboard's key sentence, arrived at through an instrument rather than
asserted.

## The payoff

Three numbers, all recomputed live on the reader's machine, all from the same
809 parameters:

| | held-out fields | out of distribution |
|---|---|---|
| Gauss–Seidel sweeps, cold → warm | 2330 → 840 (**2.77×**) | 1857 → 1180 (1.57×) |
| Conjugate gradients, cold → warm | 140 → 123 (**1.14×**) | 139 → 133 (1.04×) |
| Residual after the solver's real 40-sweep budget | 0.235 → 0.045 | 0.176 → 0.078 |
| Relative error of the raw proposal, as a field | **0.106** | 0.318 |

And the sentence those numbers add up to — counted in **passes over the grid**,
which is the only fair unit, since a conjugate-gradient step costs about three
Gauss–Seidel sweeps: **a cold conjugate-gradient solve beats the warm-started
Gauss–Seidel solve outright.** On the field the figures draw, 420 passes against
792. The neural network delivered a genuine 3.4× speedup over a baseline that a
1952 algorithm beats by 6.4×, and applied to that better baseline the same
weights are worth 1.1×. Every one of those numbers is true. An article that
reports only the first is not lying; it is just not measuring.

(Quote the ratios in raw iterations instead and the gap inflates to six times —
which is exactly the flattery the pass count exists to remove.)

This is not an argument against learning inside solvers. It is the argument for
the one architecture that survives the accounting: the network proposes, the
classical solver disposes, and a residual gate — not a benchmark table — decides
what gets accepted.

## Ranked insights

1. **The residual is not the error.** A smooth guess is 89% of the answer and
   scores worse than zero on the residual meter, because the residual weights the
   roughest modes hardest. This is measurable, counterintuitive, correct, and it
   is why "train on the residual you can see" is the wrong objective.
2. **Name the baseline or the speedup means nothing.** 2.77× against
   Gauss–Seidel; 1.14× against conjugate gradients; and cold CG beating warm GS
   outright. Same network, same fields, same gate.
3. **The headline speedup is a function of the tolerance you stopped at.** 8.3× at
   a gate of 10⁻², 3.4× at 10⁻³, 2.1× at 10⁻⁴ — same field, same weights. And the
   agreement between the two answers moves with it: 6% of peak pressure at 10⁻²,
   0.24% at 10⁻³. Found while building the figure, not before. A speedup quoted
   without its tolerance is quoting nothing.
4. **The gate is the safety contract, not the accuracy.** Corrupt the weights
   with noise — from trained, through 40% wrong, to a random function of the
   input — and the sweeps needed climb past the cold-start line while the
   accepted field stays within 1.24% of the pure cold-start answer at every
   damage level. That bound is set by the gate, not by the weights. A learned
   component behind a verifiable residual can cost you time and cannot cost you
   truth.
5. **Architecture as a statement about frequency.** The network averages 8×8
   blocks before it sees anything, so it is *structurally incapable* of proposing
   high-frequency pressure. That is why it is small (809 parameters), why it is
   fast, and why it helps: it is confined to the half of the spectrum the sweeps
   are bad at.
6. **89% right, accepted directly, rots a rollout.** Take the same proposal, skip
   the sweeps, and the flow accumulates divergence until the wake is wrong. Per
   step, compounding. The gate is the difference between an accelerator and a
   fabrication.
7. **Out of distribution degrades gracefully in time and not at all in truth.**
   Field error triples on an airfoil the network never saw; the answer it helps
   produce is still correct to tolerance, only slower to get.
8. **What the network actually learned is not the operator.** Its impulse
   response is not the Green's function of the Laplacian. It learned what the
   pressure around a wake tends to look like. That is a weaker and more honest
   claim than "it learned to solve Poisson", and it predicts exactly the
   out-of-distribution behaviour above.

## Hero

`WarmStartRace`: one frozen divergence field, two pressure solves running to the
same gate. The cold one crawls outward from nothing; the warm one is fully formed
in frame one and then spends its sweeps being corrected. Two counters, one
tolerance, and the difference between the two accepted answers printed as a
number that stays at the noise floor.

## What this article is not

- Not a learned closure (`AGENTS.md` scale rule: rollout stability and
  generalization are a different article's worth of work).
- Not a whole-solver surrogate. The storyboard's §7 is discussed in prose and
  demonstrated only in its failure mode, which is the part we can build honestly.
- Not a survey of the literature. Named methods appear where they are the thing
  being used.

## Standing risk

The storyboard proposed a *persistent equation dock* as the page's navigation
spine — every term a focus target, all figures re-emphasizing in concert. It is a
good idea and it is not built here: this article is about one seam, and a
five-term navigation spine over a one-seam article is furniture. Banked in
`articles/CONCEPT_BANK.md` for whichever lesson genuinely spans all five terms.
