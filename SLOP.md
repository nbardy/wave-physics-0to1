# SLOP.md — the detector

What slop is, how to catch it in this repo's prose. Companion to `NICKS_VOICE.md`
(which says what we sound like) and `ESSENCE_OF_VOICE_AND_DESIGN.md` (which says how
articles are built). This doc says what we must *not* sound like, with the tells.

**Slop is not a style — it's the absence of one.** It's the model's prior showing
through: sentences any LLM would write about any topic, arranged in shapes that feel
like writing. Because slop is generic-ness itself, it cannot be banned by word-list.
**This is not a grep gate.** Every entry below is a *tell* that demands a judgment
call. (We learned this the hard way: compliance-by-pattern produced its own slop —
see family 11.)

---

## The four tests

Run these against any suspect sentence. They're the whole doc in miniature.

1. **Topic-swap test.** If the sentence survives unchanged in an article about a
   different subject, it carries no content. "In this article we'll build, piece by
   piece, the equation that governs it" — swap the equation for anything; nothing
   breaks. Fails.
2. **Delete test.** Remove the sentence. If nothing is lost, it was narration *about*
   the article rather than the article. Delete it for real.
3. **Who's-talking test.** Does this sound like the physicist watching the phenomenon,
   or a tour guide walking backwards through the museum? The tour guide is slop.
4. **The Nick test.** His diagnosis of our own intro, verbatim: "It literal just says
   'in this article well do X' … basically just restating the meta rules themselves
   while being the most boring generic instatition of them it can be." If a sentence
   merely *instantiates a rule from our own docs*, it fails — the rules are load-bearing
   structure, not content.

---

## The families

**1. Promissory narration.** Sentences that schedule understanding instead of
delivering it: "By the end of this article you will know…", "we'll soon see…",
"you'll have assembled every term…". The repo's founding slop incident — real
before/after from the fix (commit `b78d9f6`):

> ✗ "The top picture is the one the textbooks print. By the end of this article you
> will know why the bottom one is the more honest of the two."
> ✓ "The top picture is the familiar one. The bottom picture is the honest one — and
> the distance between those two sentences is this whole article."

The fix in general: **flat declaratives that carry the promise's content, not its
schedule** ("that single number is the oldest debt in this article; it gets paid,
but not soon"). Debts are planted as facts, not as reading itineraries.

**2. Generic placeholder.** The topic-swap failures: "the fascinating world of X",
"X plays a crucial role in Y", "X has captivated scientists for centuries". Any
sentence whose subject could be swapped without rewriting the predicate.

**3. Meta-narration.** "Let's dive in." "Now that we understand pressure…" "It's
important to note that…" "As mentioned earlier…" Narrating the act of explaining
instead of explaining. (Ciechanowski's "Let's" survives because it's followed by a
concrete act on a concrete object — "Let's zoom away from the world of microscopic
particles" is a camera move, not throat-clearing. That's the judgment call.)

**4. Symmetry filler.** "Not just X, but Y." "It's not about X — it's about Y."
Balanced triads three sentences in a row. The tell: the second half adds nothing the
first didn't already imply; the sentence exists for its rhythm, not its content.
Rhythm is fine; rhythm *instead of* content is the slop.

**5. Awe-inflation.** *Fascinating, remarkable, profound, elegant, beautiful dance,
tapestry, testament to, delve.* Adjectives asserting what evidence should produce.
House physics: awe is carried by the phenomenon, the figure, and numbers-as-dessert
(ESSENCE §2) — never claimed by adjective. If a sentence says the thing is
interesting, the thing wasn't shown being interesting.

**6. Hedge-mush.** "Can play a role", "may help to", "in many ways", "arguably",
"it could be said". Claims sanded until nothing remains to be wrong about. Distinct
from calibrated hedges — "roughly," "at least in principle" attached to genuinely
approximate claims are honest (ESSENCE keeps them). Test: is the hedge doing
epistemic work, or dodging commitment?

**7. Decorative questions.** "But what does this really mean?" — a question with no
candidates and no adjudication. The blend rule (NICKS_VOICE §6) is strict: a printed
question must be a genuine fork — named candidates, physical stakes — and the section
must call the winner. A question that's just cadence is slop wearing curiosity's
clothes.

**8. Summary-itis and the moral.** Recap paragraphs restating what was just read;
"In conclusion"; section-ending life lessons. Sections end with forward hooks — the
freshly created problem the next section answers (ESSENCE §4.2). The one sanctioned
consolidation is the Waypoint, and it inventories *what you can now do*, not what
was said.

**9. Reader-management.** "You might be confused, and that's okay!" "Don't worry if
this seems hard." "Bear with me." Reader competence is axiomatic; coddling is
blame's polite twin. Also in this family: flattery ("As you've cleverly noticed…")
and cheerleading ("You've got this!").

**10. Fake metaphors.** Images that can't be audited: "a symphony of turbulence
dancing across the manifold." A real metaphor — household (ESSENCE) or math-native
(NICKS_VOICE §4) — survives the audit sentence: you can say "an imperfect but
convenient analogy" about it and state *where* it's imperfect. If the image has no
failure mode, it has no content.

**11. Tic pastiche — slop wearing a good author's clothes.** Mechanically reproducing
a studied author's surface markers without the underlying move. **This actually
happened here**: lessons 01 and 02 shipped beat-for-beat identical Final Words
skeletons, and "…is known as" ran at ~10× Ciechanowski's actual rate, because audits
were enforcing tics by grep. A phrasing is a *signature* when one author converges on
it over a decade, and *pastiche* when fresh threads copy it on day one. Prescribe the
move (phenomenon-before-name), never the phrase ("is known as"). Surface skeletons
may not repeat across sibling articles; pedagogy grammar may. (Enforced by
METHODOLOGY's Stage-4 pastiche guard and Stage-5 sibling audit.)

**12. Cadence collapse.** Every sentence the same length and shape; anaphora runs
("It's X. It's Y. It's Z."); the wisdom-fragment cadence (Short. Punchy. Empty.);
em-dash aphorisms three per paragraph. Any *detectable periodicity* in sentence
music is the tell — including Ciechanowski's own 22-word legato applied as a meter.

**13. Process slop.** Hitting figure quotas, word bands, or checklist counts as
numbers instead of judgments — "the plan says ~80 figures, so densify." Mechanical
compliance upstream becomes generic prose downstream, because content gets written
to fill a shape. Scale rules are diagnostics, never quotas (AGENTS.md "heuristics,
not rules"; the 32-vs-80 incident).

**14. Notation inflation.** A new name for an old object, with nothing forbidden.
"We have moved beyond splats" — while the renderer still draws projected discs. The
tell is universality: "If the abstraction can express splats, NeRF, volumes, meshes,
and ray caches, then it is not yet a representation" (Nick). The test is his
challenge verbatim: *what degree of freedom does the new name remove?* If none, it's
a costume. In articles: coin a name only when the name does work — forbids,
compresses, or predicts — and confess what the named thing still is underneath.

**15. The no-kill ending.** Closing on "combine everything", "each approach has its
merits", or a roadmap of all options. Synthesis that refuses to choose is a survey
wearing a conclusion's clothes; Nick's standing rule is that divergence ends in a
verdict — implement, defer, or kill, with reasons. In articles: the ending pays the
planted debts and calls the winner; it does not gesture at the space of possible
payments.

**16. The deflationary rebrand ("the X is just the Y").** Flagged 2026-07-06 on a
fork-hinge draft — "the whole zoo below is just the scoreboard." Nick: "This is
slop. The X is just the Y." The move: swap in a cuter noun and present the swap as
a reveal. The "just" claims a reduction that was never performed — no mechanism got
simpler, only the vocabulary changed. Distinct from family 10: the image may even
be auditable; the slop is the pretense of insight in the copula. Test: delete
"just" and ask what the sentence taught. If the answer is "a synonym," cut it. A
real reduction names what got smaller — degrees of freedom, cases, terms (family
14 is this same crime committed in the naming direction).

**17. Manufactured cleverness (the contrived journey).** Flagged 2026-07-06 on a
staged fork — "What law did we break? Two suspects: maybe our forces are wrong, or
maybe we forgot a force entirely. Neither — we forgot a *constraint*." Nick: "They
both read like manufactured cleverness which is an anti pattern. The user can tell
your taking them on an overly contrived journey. If the insights are suprising let
them be so, don't construct setence narrative to force them that way." The move:
erect suspects you already know are innocent, stage a beat of suspense, detonate
the planned punchline — the reader feels the author's hand on their back. The rule:
**surprise is a property of the physics, not of the sentence order.** This tightens
the fork license (family 7, NICKS_VOICE §6): a printed fork is legitimate only when
its candidates are *live* — hypotheses the author or a reasonable reader would hold
before knowing the answer. Test: did writing the fork require feigning uncertainty?
Then it's theater, and the plain declarative sentence was already the better one.

---

## Where the enforcement lives

This doc is the shared vocabulary; the gates are elsewhere and stay there:
ESSENCE's preamble (measurement, not recipe) and never-do list · METHODOLOGY's
Stage-4 pastiche guard, Stage-5 sibling audit, and audits-may-return-zero-findings
rule · NICKS_VOICE §5 (Nick's flagged lines, verbatim) and §6 (the blend).
When sweeping an article, read for the *families*, decide with the *four tests*,
and never turn any entry here into a grep pattern with an auto-fix.
