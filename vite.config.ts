import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// MDX must run before the React plugin (enforce: 'pre') so lesson files
// compile to JSX that plugin-react then transforms. remark-math + rehype-katex
// give us `$...$` / `$$...$$` LaTeX inside lessons.
export default defineConfig({
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
  ],
})
