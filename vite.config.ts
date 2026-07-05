import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { copyFileSync } from 'node:fs'

// GitHub Pages serves project sites from a subpath (/<repo>/); Cloudflare
// Pages serves from root. GITHUB_PAGES (set by the deploy workflow) switches
// the base so the same build works on both hosts. The router reads this back
// via import.meta.env.BASE_URL, so links stay correct on either.
const onGitHubPages = process.env.GITHUB_PAGES === 'true'
const base = onGitHubPages ? '/wave-physics-0to1/' : '/'

// GitHub Pages has no SPA fallback: a deep-link reload (/lesson/foo) 404s
// unless a 404.html exists. Serving a copy of index.html there lets the
// client router take over. Only needed for the Pages build.
const spa404 = {
  name: 'spa-404-fallback',
  closeBundle() {
    if (onGitHubPages) copyFileSync('dist/index.html', 'dist/404.html')
  },
}

// MDX must run before the React plugin (enforce: 'pre') so lesson files
// compile to JSX that plugin-react then transforms. remark-math + rehype-katex
// give us `$...$` / `$$...$$` LaTeX inside lessons.
export default defineConfig({
  base,
  // honor PORT so preview tooling can assign a free port when 5173 is taken
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    spa404,
  ],
})
