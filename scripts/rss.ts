import ts from 'typescript'

const SITE = 'https://physics.nicholasbardy.com'
const escapeXml = (text: string) => text.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[char]!)

// Read the registry's metadata without importing MDX and its browser-only sims.
// TypeScript's parser handles comments, formatting, and nested version arrays;
// unsupported metadata expressions fail the build instead of dropping entries.
export function createRss(registrySource: string): string {
  const file = ts.createSourceFile('registry.ts', registrySource, ts.ScriptTarget.Latest, true)
  let entries: ts.ArrayLiteralExpression | undefined
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'lessons'
        && declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer)) entries = declaration.initializer
    }
  }
  if (!entries) throw new Error('RSS: lessons array not found in the registry')
  const property = (object: ts.ObjectLiteralExpression, key: string): ts.Expression => {
    const entry = object.properties.find(p => ts.isPropertyAssignment(p)
      && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && p.name.text === key)
    if (!entry || !ts.isPropertyAssignment(entry)) throw new Error(`RSS: missing ${key}`)
    return entry.initializer
  }
  const literal = (expression: ts.Expression): string => {
    if (!ts.isStringLiteralLike(expression)) throw new Error('RSS: metadata must be a string literal')
    return expression.text
  }
  const items: string[] = []
  const seen = new Set<string>()
  for (const entry of entries.elements) {
    if (!ts.isObjectLiteralExpression(entry)) throw new Error('RSS: expected a lesson object')
    const status = property(entry, 'status')
    if (!ts.isObjectLiteralExpression(status)) throw new Error('RSS: expected lesson status')
    if (literal(property(status, 'kind')) !== 'published') continue
    const id = literal(property(entry, 'id'))
    if (seen.has(id)) throw new Error(`RSS: duplicate lesson ${id}`)
    seen.add(id)
    const link = `${SITE}/lesson/${encodeURIComponent(id)}`
    items.push(`<item><title>${escapeXml(literal(property(entry, 'title')))}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid><description>${escapeXml(literal(property(entry, 'blurb')))}</description></item>`)
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Nick’s Visual Math Lessons</title><link>${SITE}/</link>
<description>New visual explainers in physics and mathematics.</description><language>en</language>
<atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
</channel></rss>\n`
}
