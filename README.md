# Nick's Visual Math Lessons

Explorable lessons in physics and mathematics. Each pairs a rigorous derivation with an
**interactive simulation** you can poke at — one that runs the physics rather than illustrating it.

Lessons are clustered into **fields**, and cut across those fields by **tags**:

| Field | What it is |
|---|---|
| **Broad physics** | Standalone lessons on whatever the physics is actually doing. No order. |
| **Waves, 0 → 1** | The spine this repo started as: fluid and wave simulation from the fundamentals up, read in order. |
| **Maths** | The machinery the physics keeps borrowing, taught on its own terms. |

`/` groups by field · `/all` is every lesson with a tag filter (`/all?tag=quantum`).

This is a *learning* repo (distinct from the `wave_sim` research workspace). No auth, no billing —
just a static site.

## Stack

- **Vite + React + TypeScript**
- **MDX** for lessons — prose + LaTeX + embedded interactive sims in one file
- **KaTeX** for math (`$…$` inline, `$$…$$` display)
- **GitHub Pages** for hosting (static, served from `/wave-physics-0to1/`)

## Run locally

```bash
bun install
bun run dev            # http://localhost:5173
bun run build          # → dist/
bun run typecheck      # tsc --noEmit  (covers src/ and scripts/)
bun run check:figures  # render every physics-01 figure headlessly and assert what it teaches
```

## Layout

```
src/
  pages/        Home (by field), All (by tag), LessonView, StackCheck
  components/   Layout, Toc (shared lesson list), Sim (canvas framework), TeX, Prose
  sims/         one folder per field; lib/ holds palette + shared figure chrome
  lessons/      registry.ts + one .mdx per lesson
scripts/        check-physics-figures.ts — headless render + assertions
```

## Add a lesson

1. Create `src/lessons/<field>-NN-slug.mdx` — prose, math (`$$…$$`), and sims dropped in as
   components. `<Sim>`, `<TeX>`, `<C>`, `<Waypoint>` and `<Predict>` are available in MDX
   without imports.
2. Register it in `src/lessons/registry.ts`: `id`, `field`, `order`, `title`, `blurb`, `tags`,
   `status`. `Field` and `Tag` are closed unions, so a typo is a compile error rather than an
   orphan chip; add a tag only when a second lesson would carry it.
3. Flip `status` from `{ kind: 'planned' }` → `draft` → `published` as it matures.

The `/stack-check` page and `StringWaveDemo` are scaffolding to prove the pipeline — delete them
once real lessons exist.

## Lessons

| # | Lesson | Field | Status |
|---|--------|-------|--------|
| P1 | Is Light a Wave or a Particle? | Broad physics | Draft |
| 01 | Building the Navier–Stokes Equations (part-by-part deep dive) | Waves 0 → 1 | **Published** |
| 02 | Fiber Bundles, the Universal Medium | Waves 0 → 1 | Draft |
| 03 | The History of Navier–Stokes (who discovered what, and when) | Waves 0 → 1 | Draft |
| M1 | The Jacobian and the Hessian | Maths | Draft |

House style docs (read in the order AGENTS.md gives): `ESSENCE_OF_VOICE_AND_DESIGN.md`
(the studied pole) → `NICKS_VOICE.md` (Nick's pole + the blend) → `SLOP.md` (the
detector) → `METHODOLOGY.md` (the five-stage process).

## Deploy

The final site is **https://physics.nicholasbardy.com/**, hosted by Cloudflare
Workers Static Assets. Domain and deployment configuration live in the sibling
Namesake repository’s `hosting/physics/` directory. It builds a committed source
revision, keeping ongoing article edits out of a release. See [LAUNCH.md](LAUNCH.md)
for deployment, the owned Worker + D1 email list, and RSS.

The older GitHub Pages address remains available at
https://nbardy.github.io/wave-physics-0to1/. These commands update that address:

```bash
bun run deploy   # build + publish to the gh-pages branch
bun run ship     # commit + push main, then deploy
```

The build output is committed to `gh-pages`; `main` stays free of bundles.
There is no CI. Review the working tree before shipping, especially while
other tasks are editing articles.
