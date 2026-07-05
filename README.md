# Wave Physics 0 → 1

A from-scratch **self-study in wave physics**, built to climb from the fundamentals to the
PhD-level mathematics of wave simulation. Each lesson pairs rigorous derivation with an
**interactive simulation** you can poke at.

This is a *learning* repo (distinct from the `wave_sim` research workspace). No auth, no billing —
just a static site.

## Stack

- **Vite + React + TypeScript**
- **MDX** for lessons — prose + LaTeX + embedded interactive sims in one file
- **KaTeX** for math (`$…$` inline, `$$…$$` display)
- **Cloudflare Pages** for hosting (static, `*.pages.dev` subdomain)

## Run locally

```bash
bun install
bun run dev        # http://localhost:5173
bun run build      # → dist/
bun run typecheck  # tsc --noEmit
```

## Layout

```
src/
  pages/        Home (curriculum index), LessonView, StackCheck
  components/   Layout, Sim (canvas framework), TeX (KaTeX for .tsx)
  sims/         reusable interactive sims (StringWaveDemo — scaffold demo)
  lessons/      registry.ts + one .mdx per lesson
```

## Add a lesson

1. Create `src/lessons/lesson-NN-slug.mdx` — write prose, math (`$$…$$`), and drop in sims
   with `<Sim create={…} />`. `<Sim>` and `<TeX>` are available in MDX without imports.
2. Register it in `src/lessons/registry.ts` (`id`, `order`, `title`, `blurb`, `status`).
3. Flip `status` from `{ kind: 'planned' }` → `draft` → `published` as it matures.

The `/stack-check` page and `StringWaveDemo` are scaffolding to prove the pipeline — delete them
once real lessons exist.

## Curriculum

| # | Lesson | Status |
|---|--------|--------|
| 01 | Building the Navier–Stokes Equations (part-by-part deep dive) | Draft |
| 02 | Fiber Bundles, the Universal Medium | Planned |
| 03 | The History of Navier–Stokes (who discovered what, and when) | Planned |

## Deploy (Cloudflare Pages)

```bash
bun run build
bunx wrangler pages deploy dist --project-name wave-physics-0to1
# → https://wave-physics-0to1.pages.dev
```

> The Pages project name is fixed on first deploy and **cannot be renamed** — keep it
> `wave-physics-0to1`.
