# HANDOFF — A Computer Made of Noise (physics P2)

Canonical per-article state. Design docs: `DENSE_CORE.md` (rev. 2, wins
conflicts), `PLAN.md` (rev. 2 — integrates Nick's feedback round + the
technical review), `OUTLINES.md` (the three candidate shapes; variant B
banked as the sequel), `CRITIQUE.md` (the six-way comparison).

## Where it stands (2026-08-05, end of session 2)

**ALL FOUR ACTS BUILT AND ASSEMBLED** — `draft`, live at `/lesson/pbits`.
~8,500 words, 10 sections, 28 mounted figure instances (35 canvases), 4
Predicts, 4 Waypoints, the mosaic hero opening and closing the ring.
Structure per PLAN rev. 2: Act I the distribution (§1–§4, State Atlas ending
in the conditional derivation), Act II the sampler (§5–§6, write-conflict
discriminator, certified race, gated dashboard, chip fabric), Act III the
machine and its compiler (§7–§8, microscope circuit, manual, triangle,
nonideality, kernel table → hand-compile → XOR-hidden → Torx/Thermalizers/
THRML stack), Act IV the learner (§9–§10, true conditional reverse-diffusion
per level, factorized and synchronous-mislearning beats, wall of dreams,
hierarchy-of-witnesses ending).

**Verification**: `bun run check:pbits` now chains all five suites —
figures + act1 + act2 + act3 + act4 — **all green** (~171 assertions);
`bun run typecheck` and `bun run build` green. Agent-built figures were
eyeballed via `_figure_check/` renders; assembled page verified in-browser
at the DOM level (all sections, zero KaTeX errors) — the browser pane's
visibility kept dropping (the documented rAF trap), so a full scrolling
reader pass of Acts III–IV in a live pane is still owed.

**Build provenance**: Acts were built by four parallel Fable subagents from
PLAN rev. 2 with disjoint file ownership (`lib.ts` frozen); fragments in
`articles/05-pbits/drafts/act{1..4}.mdx`; assembly, hero IOU passage, and
act-boundary bridges by the main thread. Hero weights: `pretrained.ts`,
trained by the repo's own trainer (provenance comment in-file).

## Findings this session (assembly-time)

- **remark-math trap**: a `$$eq … eq$$` display block spanning two lines
  silently swallows the rest of the document (closing `$$` must sit at a
  line start). One offender in §8 truncated Acts IV's headings at render
  time while leaving the text embedded in a failed-math span — found by DOM
  audit, fixed by single-lining the equation. **Rule for this repo: display
  math stays on one line.**
- The synchronous-training damage in F29 exists only if the negative-phase
  hidden statistic is honestly the stale-field one (see comment in
  `denoise.ts`) — a fresh hidden read silently repairs the bias.
- On large glasses synchronous *loses* energy races (sublattice freeze);
  the 4×4 certified race is the honest staging (comment in `Race.tsx`).

## Series architecture (decided 2026-08-05, after Nick's scope question)

Part 1 (this article) stays **substrate-general on purpose** — p-bits /
Ising / Gibbs with Extropic entering as the §6 reveal; that generality IS
the 0→1. Extropic-specific material lives in **Part 2**
(`articles/06-z1-compiler/` — DENSE_CORE + PLAN + RESEARCH written; z1.ts
exact-fabric generator + Z1Layers figure BUILT, `bun run check:z1` green,
including a measured theorem boundary: the layered-machine claim needs
one-color visible sets). **Part 3** (EBM diffusion under Z1's
reflash/readout economics) is seeded at
`articles/07-ebm-diffusion/DENSE_CORE.md`. Part 2's hardware numbers are
UNVERIFIED second-hand until its RESEARCH.md ledger closes against the two
papers. Backlogged Part-1 additions (oscilloscope, clockless/staleness
section) are recorded in OUTLINES.md's header note.

## Fact-hygiene pass (2026-08-05, after second external paper review)

Applied to the assembled MDX: "269,568" → ~quarter-million everywhere
(papers say ~250,000; the precise figure is not a paper fact); "under one
watt" scrubbed — replaced with the papers' own per-iteration estimate
(~3×10⁻¹⁰ J ≈ 300 pJ per Gibbs iteration, stated as an estimate); §7
gained the device-model bridge (X0 = subthreshold-CMOS randomness provider
for MH/importance sampling; Z1 = programmable conductance + effective
temperature running Gibbs natively; both land on σ); §8's stack paragraph
now names Torx's three wire types (pbit/pdit/pmode) and confesses this
lesson speaks pbit only. All external-review quotes remain second-hand —
the RESEARCH ledger in articles/06 tracks corroborated-vs-verified status.

## What remains

1. **Reader pass in a live pane** (Acts III–IV especially): drive every new
   knob, check figure legibility at article width, mobile/touch pass.
   (2026-08-06: this session's pane hit the same visibility trap — DOM
   audit + headless renders done; a real scroll-through is still owed.)
2. ~~Stage 4 voice pass~~ **DONE 2026-08-06** — seam sweep over the
   assembled whole (details in the session report): "§3"-style section
   numbers scrubbed (page has no numbering), the lesson-01 "oldest debt"
   skeleton replaced with an "on credit" plant paid verbatim in the wall
   section, Waypoints 2–3 de-templated from the "You hold / And you hold"
   frame, three aphorism-weight competitors removed so Act III's "One spin
   you will never read…" stands alone, one leftover "270-thousand-bit"
   scrubbed to quarter-million (fact-hygiene), fork-rule check passed on
   all four Predicts.
2b. ~~Figure polish~~ **DONE 2026-08-06** except the two reserved items:
   "β = 1 (locked)" now on-canvas in PairCoupler wire modes; StateGraph
   prints "legal sweeps make multi-spin moves too — not the crime" under
   the chord counter (deliberately does not name red/black — not yet
   taught at that point); PNOT/PSWAP named once beside KernelTable;
   MosaicHero re-flows to 6 columns with a smaller paint-box under 520 px
   (was 3.7 px cells at 360 px, now ~7.4 px, verified by headless render).
   STILL OPEN, Nick's call: Z1Layers-into-chip-reveal promotion; optional
   Microscope X0↔Z1 toggle.
3. ~~Further Reading~~ **DONE 2026-08-06** — Torx paper, Thermalizers
   paper, THRML/Torx repos, Geman & Geman 1984; praise kept qualitative
   (no unverified paper numbers, per the Part-2 RESEARCH gate). Ending now
   has explicit Further Reading + Final Words headings (sibling structure).
   **Front epigraph still unwritten** — only if one is wanted.
4. **Performance pass**: 28 live figures on one page (IntersectionObserver
   already freezes off-screen ones; verify on a long scroll + mobile).
5. **WGPU backend** (optional now): CPU carries everything at current
   sizes; the GPU port (`sims/lib/gpu/` pattern) remains banked for the
   hero/mosaic if scale grows.
6. ~~Stage 5 audits~~ **DONE 2026-08-06** (rhythm: no >3-paragraph
   droughts; palette: `<C>` keys type-checked against the contract, no
   orphans; ledger: hero/circuit/β-dial/gray-ghost/energy-corner plants all
   paid; anti-checklist: one "obvious" and one "surely…?" removed) →
   publish flip still to PROPOSE to Nick, never applied.
7. Registry blurb reviewed 2026-08-06 — kept as-is (specific, carries both
   thesis halves).
8. Housekeeping note: a concurrent session's untracked `metaEbm.ts` (Part 2
   WIP, imported by nothing) broke `tsc` on an unused param; renamed it
   `_d` to keep the gate green — revisit if that session resumes.

## Decisions on record

- Field `physics`, P2; `computation` field revisited when the B-sequel
  ships. Fenced-patch honesty; knob-change = fresh evidence; β is always
  inverse temperature in labels; display math single-line; phase tints are
  local constants in `PhaseTrainer.tsx` (promote to palette.ts as
  `phaseData`/`phaseDream` only if a second lesson needs them).
- A concurrent session's WIP snapshot commit (f51c552) captured mid-build
  file states; working tree is canonical. Committing is Nick's call.
