import katex from 'katex'

// Render LaTeX in .tsx pages/components. (Lessons authored in MDX get math for
// free via remark-math / rehype-katex; this is for hand-written React.)
export function TeX({ children, block }: { children: string; block?: boolean }) {
  const html = katex.renderToString(children, {
    displayMode: !!block,
    throwOnError: false, // renders a visible red error node rather than crashing
  })
  const Tag = block ? 'div' : 'span'
  return <Tag className={block ? 'tex-block' : 'tex-inline'} dangerouslySetInnerHTML={{ __html: html }} />
}
