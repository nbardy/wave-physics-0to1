# Building IV — promotion package (2026-09-23)

Everything needed to make IV the reader's default for `navier-stokes`, ready to
apply after Nick's read. Nothing here has been applied: `registry.ts`,
`check-publication.ts`, and the history MDX were not touched (another session
owns the history blurb and MDX today). The IV-owned code this depends on
(`createReturnPreview`, the dye-total readout, the slider relabel) is already
in the tree.

## 1. `src/lessons/registry.ts` — the `navier-stokes` entry

Replace the entry at lines ~236–270 with:

```ts
  {
    id: 'navier-stokes',
    preview: { poster: new URL('../assets/lesson-previews/navier-stokes.png', import.meta.url).href,
      width: 720, height: 440, warmup: 0,
      load: () => import('../sims/construction-v4/ReturnExperiment').then(m => m.createReturnPreview()) },
    field: 'waves',
    order: 1,
    title: 'Building a Fluid Simulation',
    blurb:
      'A grid carries two patches of dye out and back along the same paths and returns 16% of them. How a fluid simulation moves numbers between cells, computes its own velocity, and which of its checks that passes.',
    tags: ['fluids', 'pde', 'simulation'],
    status: { kind: 'published' },
    versions: [
      {
        label: 'IV',
        author: 'baseline',
        note: 'Published default · 23 September 2026 · put the dye back: how grid updates move fluid, lose detail, and correct volume',
        Content: Lesson01IV,
      },
      {
        label: 'I',
        author: 'baseline',
        status: { kind: 'draft' },
        note: 'Previous default · 11 September 2026 construction revision',
        Content: Lesson01I,
      },
      {
        label: 'II',
        author: 'working draft',
        status: { kind: 'draft' },
        note: 'Revised experiments · parcels, viscosity, matched flows, and plate-to-pipe prediction',
        Content: Lesson01II,
      },
      {
        label: 'III',
        author: 'baseline',
        status: { kind: 'draft' },
        note: 'As it stood before the September revision · 30 July reader-ToM redraft, mounted 16 September for side-by-side reading',
        Content: Lesson01III,
      },
    ],
  },
```

What changed and why:

- **`title`** → IV's H1. The index card, version switch, and the history's
  back-link context all read this field. `id` stays `'navier-stokes'`; the URL
  and the history's `<Link to="../navier-stokes">` depend on it.
- **`blurb`** — the current one describes I's chain of failures and is itself
  promissory ("meet each piece… then assemble"). The replacement states the
  hero's result and the three things the article does, in the declarative
  register of the neighbouring blurbs. Longer alternative if wanted: "Two
  patches of dye are carried out along prescribed paths and back again. Exact
  arithmetic returns them; a 48-cell grid returns 16%. How a computer moves
  numbers between grid points, computes its own velocity, and which of its
  checks that passes."
- **Version order.** `defaultVersion` is `versions[0]` (`registry.ts:493`), so
  IV moves to the front and drops its `status: { kind: 'draft' }` (it inherits
  `published`). I moves second and gains `status: { kind: 'draft' }` so it
  stays reachable at `?v=I&draft=true` but leaves the reader's version list.
  IV's `author` becomes `'baseline'` (the published copy); II keeps
  `'working draft'`.
- **Preview.** The card currently runs `createHistoryFlow('prandtl')` — the
  wing, which IV never shows. `createReturnPreview()` (added today in
  `src/sims/construction-v4/ReturnExperiment.tsx`) is the hero at *Returned*
  on the 48² grid: exact discs on the left, the 16% smear on the right. It
  uses a `document.createElement('canvas')` raster so it runs both in the
  browser and in the bun poster script (which shims `document.createElement`
  but has no `OffscreenCanvas`); verified today with that shim — renders,
  and two consecutive draws are byte-identical. The figure is static, so
  `warmup: 0`; `height: 440` matches the figure's wide layout (the old 360
  would clip the meters). Then re-shoot the poster:
  `bun run render:previews` (writes `src/assets/lesson-previews/navier-stokes.png`),
  and run `bun run check:previews`.

## 2. `scripts/check-publication.ts`

Five assertions hard-code I as the reader's version. Change them to:

```ts
// Versions: the reader's Building lesson is its one published version; the
// editor holds every reading copy, and `?v=` on a draft label misses loudly.
const readerBuilding = table.lessonById(reader, 'navier-stokes')!
const editorBuilding = table.lessonById(editor, 'navier-stokes')!
assert.deepEqual(readerBuilding.versions.map(v => v.label), ['IV'])
assert.deepEqual(editorBuilding.versions.map(v => v.label), ['IV', 'I', 'II', 'III'])
assert.equal(table.versionOf(readerBuilding, 'II'), undefined)
assert.equal(table.versionOf(readerBuilding, 'I'), undefined)
assert.ok(table.versionOf(editorBuilding, 'I'))
assert.ok(table.versionOf(editorBuilding, 'III'))
assert.equal(table.defaultVersion(readerBuilding).label, 'IV')
```

and the orphan check at ~line 94–100, which strips the published version's
status to prove the registry refuses a published lesson with no published
version, must now target IV's entry (its regex is anchored on the note text):

```ts
const orphaned = source.replace(
  /(label: 'IV',\s*author: 'baseline',\s*)(note: 'Published default)/,
  "$1status: { kind: 'draft' },\n        $2",
)
assert.notEqual(orphaned, source, 'the Building lesson\'s version IV entry was not found')
```

(If the note text in §1 is edited, keep the regex's `note: '…` prefix in step.)

## 3. `src/lessons/lesson-03-navier-stokes-history.mdx` lines 737–741

Current:

> In 1950, a team around Jule Charney and John von Neumann ran the first computer
> weather forecast on ENIAC, and Richardson's plan became practical. The solvers
> behind the figures above, built step by step in the
> `<Link to="../navier-stokes" relative="path">previous lesson</Link>`, use numerical
> methods developed over the following decades. After adding any outside pushes,
> a solver has three jobs: carry motion with the flow, exchange momentum between
> neighboring layers, and find the pressure that keeps volume balanced.

The three jobs are IV's second act exactly, so that sentence stands. What no
longer holds is "the solvers behind the figures above, built step by step in
the previous lesson": the history's figures run the wing solver
(`sims/history/flow`); IV builds a periodic lab and says so. Replace the second
sentence only:

> In 1950, a team around Jule Charney and John von Neumann ran the first computer
> weather forecast on ENIAC, and Richardson's plan became practical. The solvers
> behind the figures above use the same numerical steps the
> `<Link to="../navier-stokes" relative="path">previous lesson</Link>` builds on a
> small periodic grid, methods developed over the following decades. After adding
> any outside pushes, a solver has three jobs: carry motion with the flow,
> exchange momentum between neighboring layers, and find the pressure that keeps
> volume balanced.

Apply in coordination with the session editing the history MDX today.

Optional, same file: history cites *Stable Fluids* at
`dgp.toronto.edu/public_user/stam/reality/Research/pdf/ns.pdf` (lines 753,
800); IV's Further Reading uses the Stanford mirror
`graphics.stanford.edu/courses/cs468-05-fall/Papers/p121-stam.pdf`. One URL
across the pair is tidier; the Toronto one is the author's own. Change IV's if
so — a one-line edit in `lesson-01-navier-stokes.IV.mdx`.

## 4. IV → history link

`lesson-01-navier-stokes.IV.mdx` line ~430 already goes through `<IfLesson>`
and describes the history correctly. No change.

## 5. Docs in the same commit

- `articles/01-navier-stokes/HANDOFF.md` header: "Lesson 01: Building the
  Navier–Stokes Equations" → "Lesson 01: Building a Fluid Simulation", and
  the current-state line "Published default: I" → IV.
- `AGENTS.md` does not carry the construction lesson's title in a status line
  (checked 2026-09-23: only path references at lines 29, 226, 232). Nothing
  to change there.

## 6. Verification after applying

```
bun run typecheck
bun run check:publication
bun run check:construction-v4
bun run check:construction
bun run render:previews && bun run check:previews
```

Then a browser look at `/lesson/navier-stokes` (reader mode, no `?v=`) for IV,
`?v=I&draft=true` for the old default, and the index card's poster.

## Queued, not a publish blocker

- **Seed `LabFluid` with the two discs** so the cycle, omissions and live lab
  carry the hero's dye and the ending can point at them on screen (the audit's
  spine verdict: act 2 drops the cast). Not done in this pass.
- `COULD-9` unit label on the live viscosity `<output>` (`SolverWorkbench.tsx:132`,
  shared with I and II — additive but not a cut, so left).
