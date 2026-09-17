import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRss } from './scripts/rss'

// GitHub Pages project sites use /<repo>/; custom domains serve from root.
// public/CNAME is the domain's source of truth and Vite copies it into dist,
// so deploying cannot erase a domain that was configured only on gh-pages.
// The router reads BASE_URL too, keeping navigation and assets on the same base.
const onGitHubPages = process.env.GITHUB_PAGES === 'true'
const customDomain = existsSync('public/CNAME')
  ? readFileSync('public/CNAME', 'utf8').trim()
  : undefined
if (customDomain === '') throw new Error('public/CNAME must contain the custom domain.')
const base = onGitHubPages && !customDomain ? '/wave-physics-0to1/' : '/'

// GitHub Pages has no SPA fallback: a deep-link reload (/lesson/foo) 404s
// unless a 404.html exists. Serving a copy of index.html there lets the
// client router take over. Only needed for the Pages build.
//
// This hangs off writeBundle, not closeBundle, and reads the real outDir
// instead of a hardcoded 'dist'. Under closeBundle the copy raced the write:
// on a tree that already had a stale dist/ it silently worked, but on a FRESH
// checkout it threw ENOENT — and that ENOENT then masked the actual build
// error underneath it (measured 2026-09-06: a genuine "Could not resolve
// ../sims/JacobiRelax" surfaced only as a confusing missing-dist/index.html).
const spa404 = {
  name: 'spa-404-fallback',
  writeBundle(options: { dir?: string }) {
    if (!onGitHubPages) return
    const dir = options.dir ?? 'dist'
    copyFileSync(join(dir, 'index.html'), join(dir, '404.html'))
  },
}

// MDX must run before the React plugin (enforce: 'pre') so lesson files
// compile to JSX that plugin-react then transforms. remark-math + rehype-katex
// give us `$...$` / `$$...$$` LaTeX inside lessons; remark-gfm gives us pipe
// tables, which lesson 04 needs for content that genuinely is a table (the
// error budget, the cross-field map) and which base MDX renders as literal
// pipe characters. Every URL in every lesson already lives inside a proper
// `[text](url)`, so GFM's autolinking changes nothing that already shipped.
export default defineConfig({
  base,
  // honor PORT so preview tooling can assign a free port when 5173 is taken
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    spa404,
    {
      name: 'lesson-rss',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'rss.xml', source: createRss(readFileSync('src/lessons/registry.ts', 'utf8')) })
      },
    },
  ],
})
