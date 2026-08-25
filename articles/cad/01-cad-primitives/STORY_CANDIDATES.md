# STORY_CANDIDATES — hero pass for cad/01 (2026-08-18)

The suspicion under review, from HANDOFF item 4: the hero (`OneObject.tsx`) is a
cube that becomes a sphere that gets cut into six faces, and a Ciechanowski-grade
opening for a CAD article wants a *part* — something with a fillet and a hole —
not a primitive. The standing rule this invokes is recorded in the maths-01
postmortem and in memory: **a hero everyone has seen is anti-hook for this site;
novelty of the presentation is part of the commission.**

Scope discipline, also from that postmortem: the fix must match the complaint.
The complaint here is about the hero **object**. It is not about the thesis
(three kinds of question, one part in layers), not about the lens mechanism
(fade cage → surface → partition), and not about the six body figures. Candidates
that quietly rewrite the spine are over-answering.

---

## Verdict on the incumbent: the object dies, the mechanism survives

**The prose opening mostly passes the four tests.** Running SLOP.md against the
actual paragraphs:

1. *Topic-swap*: "Open any mechanical CAD file and five words fall out… the menu
   is wrong" — the nouns are load-bearing, the predicate breaks if you swap the
   subject. Passes.
2. *Delete*: one borderline line — "The rest of this lesson takes those layers
   apart one at a time and puts a meter on each" is a reading itinerary
   (family 1) wearing a concrete verb. A voice-pass item, not a hook defect.
3. *Who's-talking*: the verdict voice ("the menu is wrong") is the physicist, not
   the tour guide. Passes.
4. *Nick test*: the figure-adjacent sentences name the knob and read out the
   invariant; they are setup/readout, not doctrine recited. Passes.

So the hook's *language* is healthy. The hero *object* is the problem, and on
honest inspection the case against it is stronger than the familiarity rule
alone:

1. **Familiarity, the recorded kill.** A cube subdividing toward a sphere is
   arguably the single most reproduced image in computer graphics — Blender's
   default SubD demo, every graphics course, every Catmull–Clark paper since
   1978. The maths-01 postmortem says this test runs *opposite* to
   Ciechanowski's: his readers need the familiar; this site's readers need the
   never-seen. The lens mechanism is novel; the object it operates on is the
   genre's most worn specimen, and the object is what the opening frame shows.
2. **The prose-figure contract is violated.** The opening's thesis sentence says
   "a single **part** uses all of them at once, in layers." The figure shows a
   primitive. AGENTS.md's figure rule — show the contrast the prose claims — is
   broken at the exact sentence the article exists to demonstrate. A reader who
   owns Fusion or SolidWorks thinks in fillets, bosses, through-holes; shown a
   cube, that reader files this under "graphics article wearing CAD words."
3. **The topology layer of the cube is vacuous.** The right end of the lens cuts
   the sphere into six faces because the cage was a cube — a partition with no
   design content: no inner wire, genus 0, R = 0, the trivial case of the very
   balance (`V − E + F − R = 2(S − G)`) the article's best meter exists to
   compute. Reader-pass question 3 ("how would I know if it were lying?") has no
   answer at the hero's topology end; a third of the thesis is decoration on the
   opening object.
4. **The surface layer is weakest on the one object chosen.** The article's own
   SubD section teaches that Catmull–Clark equals a bicubic B-spline only at
   valence 4, and that away from it there is no closed form. Every corner of the
   cube has valence 3 — all eight extraordinary. The hero's middle layer
   ("surface geometry — B-spline/NURBS live here") is precisely the layer the
   cube *cannot* honestly carry: near its corners that surface is no B-spline at
   all. The incumbent hero demonstrates the thesis on the object where the
   thesis is most asterisked.

Verdict: **the cube hero dies; the lens survives.** Points 3 and 4 mean this is
not only taste — the incumbent object structurally under-delivers two of the
three layers it exists to unify.

### Was replacing the source's opening an improvement?

The source (`source/index.html`) opened on a headline claim plus three static
category cards (basis / authoring / topology), with the lens figure demoted to a
"map" section below — and its lens object was a barely-perturbed cuboid (two
vertices nudged, `integration-scene.js`). The port's move — collapse the card
taxonomy into one playable hero — was right by ESSENCE §6: openings are a
playable hero with an IOU, not a survey table; the cards are conclusions-first.
But the port promoted the source's *integration object* along with its
*integration mechanism*, and an object that was defensible as a neutral mid-page
diagram is not defensible as the opening frame, where it must carry the wonder
gap alone. Half-right: right figure promoted, wrong specimen inherited.

---

## The five

**1. The pierced plate, born filleted** *(object swap in place — the GEM).*
*Object*: a rectangular plate with a round-rimmed through-hole and generous
fillets — the limit surface of a 16-vertex, 16-quad, genus-1 cage (square
annulus top and bottom, outer walls, bore walls).
*Opening frame*: a smooth machined-looking spacer plate with a hole through it —
unmistakably a part, at the lens's surface position, orbitable.
*Thesis lands*: same knob as today. Slide left: the plate collapses to sixteen
amber points — the thing a designer edits. Slide right: red wires cut the skin
into its four named faces — top, bottom, outer wall, bore — and the loop around
the bore appears, the wire the B-rep section will later name. Nothing about the
object changed. The technical clincher the cube could never offer: **every
vertex of this cage has valence 4** (check it: each corner touches two annulus
quads and two wall quads), so the limit surface is a uniform bicubic B-spline
*everywhere* — no extraordinary points, no asterisk. And that is not luck: Euler
forces extraordinary vertices on any closed quad mesh except χ = 0 — **the
through-hole part is the one shape that can be all-regular.** On this hero all
three descriptions are simultaneously, provably true; the hole is not a
liability, it is what makes the object fully B-spline.
*Build*: hours to one day. `plateCage()` beside `cubeCage()` (~40 lines,
programmatic); the wire pass groups `ancestor()` by cage-face *label* (top /
bottom / outer / bore) instead of raw index, so the cuts are the four rim loops
rather than sixteen patch borders; camera scale retune. New headless checks fall
out for free: χ(limit) = V − E + F = 0 at every level (catches a miswired cage),
all-valence-4 after one step. Painter's sort on a genus-1 plate is already
proven by `BrepStack`, and subdivided quads are small — low render risk.
*Fails at*: it is humble. A spacer plate is not a hero anyone gasps at; the gasp
has to come from the lens and the all-regular fact, not from the silhouette. Its
fillets are *consequences* of subdivision, not designed features — honest, but a
reader may not read them as "fillet."
*Familiarity*: a plate-with-hole is the hello-world of CAD tutorials — familiar
as an *exercise*, but never seen as one object under three simultaneous true
descriptions, and never seen as "the one all-regular solid." The cube's
familiarity is in the *image*; this object's familiarity is in the *task*. Flagged
for Nick regardless — the rule is his.
*Ring bonus*: the hero literally returns as `BrepStack`'s plate. One honesty
note for the build session: the hero's hole is *geometric* (the bore is
surface); `BrepStack`'s hole is *topological* (planar faces plus an inner wire).
The closing callback must say "the same part, now written the way a kernel
writes it," not "the same model."

**2. The cast bracket** *(object-first, maximal).*
*Object*: an L-bracket with a filleted rib and a through-hole in its base — a
genus-1 cage of ~40–60 vertices, hand-authored.
*Opening frame*: a real casting; nobody mistakes it for a graphics demo.
*Thesis lands*: same lens; the partition end now shows a face structure with
actual design meaning (base, upright, rib flanks, bore).
*Build*: 2–3 days, honestly. The cage is an evening of vertex-pushing, but the
L-concavity plus a rib invites painter's-algorithm cycles at some yaws — the
repo's renderer sorts whole faces by mean depth and has no splitting, so fixing
an artifact means re-modelling the cage or clamping the orbit, both iterative.
The rib also wants extraordinary vertices back (valence 3/5 where it meets the
base), surrendering candidate 1's all-regular clincher.
*Fails at*: cost buys silhouette, not thesis — every claim it can carry, the
plate carries with cleaner math and one-tenth the risk.
*Familiarity*: passes cleanly; no one has seen this image.

**3. The turned part** *(mechanism-and-object fusion).*
*Object*: a shaft with a shoulder and a groove — a 2-D NURBS profile revolved;
left pane the profile with draggable control points, right pane the 3-D solid.
*Opening frame*: dual-pane — a control polygon and curve on the left, the
photorealistic-ish turned part it generates on the right.
*Thesis lands*: drag one profile control point and **only a band of the 3-D
part bulges** — basis locality made solid, on a real part, before the word
"support" exists. The shoulder is a repeated knot: the sharp edge on the shaft
*is* a multiplicity-p knot, and the face-split at the shoulder is where the
topology axis peeks in (edges live at knot lines).
*Build*: 1–2 days. Revolve generator (profile samples × angular samples → quads
into the existing camera/painter kit) plus a two-pane figure; all the spline
machinery exists. Solid-of-revolution sorts cleanly (convex-ish rings).
*Fails at*: the three-axis commission. Basis and authoring co-lead; topology is
a cameo (no inner wire, genus 0 — a shaft has no through-hole unless bored,
which adds candidate 2's costs). As hero it would tilt the article toward "the
basis is the whole story" and demand restructuring the opening's claim. Strong
*figure*; partial *hero*.
*Familiarity*: lathe demos exist but are rare as explainer heroes; the
drag-a-point-and-a-band-of-metal-moves image is effectively unseen.

**4. The hole that isn't there** *(inversion: open on topology, via a failure).*
*Object*: `BrepStack`'s existing plate, promoted to hero, with one new toggle:
*forget the wires*. Flip it and the hole heals — material floods back across the
bore — while a meter reads "surfaces re-fitted: 0," because no geometry changed;
only the inner loops were dropped from the face records.
*Opening frame*: a plate with a hole; one checkbox; the hole is the thing at
stake.
*Thesis lands*: at the flip. The hole was never in the geometry — it lives
entirely in the loop structure. Geometry supplies shape; topology selects
matter.
*Build*: hours — `faces()` already carries the loops; render each face with and
without its inner loop and the even-odd fill does the rest.
*Fails at*: it opens the article on the axis the current structure *closes*
with. Everything from Cox–de Boor to Catmull–Clark would then sit under a hook
it doesn't pay into, so this hero forces a spine reordering (topology-first) —
exactly the over-answer the postmortem warns against. The right home for this
moment is a one-checkbox upgrade to `BrepStack` in its own section, where its
prose already lives.
*Familiarity*: never seen; a hole healing because a loop was deleted is a
genuinely new image.

**5. Three indistinguishable strokes** *(mechanism-first, exactness).*
*Object*: one circular arc drawn three times — exact rational NURBS, best
polynomial B-spline, dense polyline — three visually identical strokes, and an
error lens (×10^k slider) that peels them apart: 2.2e-16, 6.1e-2, chord error.
*Opening frame*: what looks like one stroke and a claim that there are three.
*Thesis lands*: as the lens magnifies and two of the three curves leave.
*Build*: hours; entirely 2-D, entirely on the existing spline kit and the
already-measured numbers in `WeightPull`.
*Fails at*: carries exactly one axis (basis) and would demote the article's
actual thesis to a mid-article reveal. The article already delivers this moment
in §The Denominator, where it belongs.
*Familiarity*: the "zoom until representations diverge" move is uncommon but
not unseen (float-precision explainers use it); as a CAD hero it would be fresh
but thin.

*Considered and killed on cost, for the record*: any hero requiring a real
boolean — two solids subtracted live, a sliver face appearing at a tangency.
That needs trimmed-surface intersection and fragment classification, which is a
week of work in any honest estimate, against a renderer that is an orthographic
camera and a depth sort. The article's boolean paragraph already handles this
in prose, correctly, as testimony rather than simulation.

---

## Critique summary and verdict

Kill **5** (one axis, already in the body) and **4** as *hero* (right moment,
wrong altitude — it forces a spine inversion; keep it as a section-figure
upgrade). **3** is the best pure figure in the batch and the wrong hero — its
topology axis is a cameo; if the maths-track ever wants a "locality" article,
it's the opening figure ready-made. **2** is candidate 1 with a better
silhouette at 3–5× the cost, minus the all-regular clincher, plus real render
risk on this repo's painter-sort renderer.

**GEM: #1, the pierced plate.** It is the only candidate that keeps the scope of
the fix equal to the scope of the complaint — object swapped, lens kept, six
body figures untouched, spine untouched — while *strengthening* the thesis
rather than merely re-skinning it: on this object the three layers are not just
simultaneously drawn but simultaneously *true with no asterisk* (all-regular ⇒
the surface layer is genuinely a B-spline everywhere; genus-1 ⇒ the topology
layer genuinely has a ring to count), and Euler's constraint makes the
through-hole part the canonical such object rather than a lucky one. The hero
returns at `BrepStack` as the article's ring.

**What is rebuilt / kept / prose scope, if #1 is approved:**

- *Rebuilt*: `OneObject.tsx` only — `plateCage()` in `mesh.ts` (~40 lines),
  wire pass grouped by cage-face label, camera scale, layer-name strings. New
  `check-cad.ts` assertions: χ = 0 at every level, valence-4 regularity, counts.
- *Kept*: all six body figures, all sections, both waypoints, the registry
  entry, the palette contract.
- *Prose*: opening only — the paragraph after the hero ("eight points" →
  sixteen; "cut by red boundaries into six named faces" → four named faces and
  the bore loop) plus the closing callback in "Three Axes, Not Five Options"
  ("the part in the first figure" becomes literally true). The all-regular /
  only-the-torus fact is dessert for either the SubD section or the closing —
  build session's call. No restructuring.

---

## CHECKPOINT — Nick decides (nothing built until this is answered)

A hero swap is a thesis-adjacent change and the process rule from maths-01 is
explicit: hook + hero spec get approval before any build. The specific
questions:

1. **Does the cube hero die?** Our verdict: yes — recorded familiarity rule,
   plus the two structural failures (vacuous topology layer; all-extraordinary
   corners undercutting the surface layer). If you disagree and the cube stays,
   items 2–4 are moot and HANDOFF item 4 closes as "assessed, retained."
2. **Is the pierced plate the replacement?** It is a part, but a humble one —
   the hello-world of CAD tutorials. Does CAD-familiar-as-a-task (but
   never-seen-as-an-image) clear your novelty bar, or does the hero need the
   cast bracket's silhouette at 2–3 days and real painter-sort risk instead of
   the plate's day?
3. **Scope confirmation**: object-and-opening-prose only — no spine change, no
   body-figure changes. (The `BrepStack` "forget the wires" toggle from
   candidate 4 is a separate, hours-scale figure upgrade — approve or decline
   independently.)


---

## DECIDED 2026-08-18 (Claude, on Nick's delegation; revisable)

Nick's reply to the checkpoint was "answer it yourself" — per the standing
"no preference means decide" rule, the call was made and recorded rather than
re-asked.

1. **The cube dies.** Grounds are the two structural failures above (vacuous
   topology layer; all-extraordinary surface layer), both machine-verified, not
   the familiarity rule alone.
2. **Candidate 1 ships — the pierced plate.** One correction to the write-up:
   the cage needs **32 vertices** (8 stations × 4 cross-section corners), not
   16 — a 4×4 torus cage is all-regular but reads as a donut, not a plate.
   Verified before building: χ = 0, every vertex valence 4, hole survives
   refinement, limit stays inside the cage.
3. **Scope held.** Hero object + opening-adjacent prose + the SubD clincher
   paragraph + the Euler callback. The BrepStack wire-heal toggle stays banked.
   The Stage-4 voice pass ran in the same session (voice docs read first, in
   the AGENTS.md order).

Build receipts: `plateCage()` in `src/sims/cad/mesh.ts`; `OneObject` now
renders the plate with `heroFace = ancestor % 4` wires; six new `plate/*`
assertions in `scripts/check-cad.ts` (genus, regularity, counts, hole
survival, wire count 256, strip adjacency).
