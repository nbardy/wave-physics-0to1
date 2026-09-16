import ts from 'typescript'
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'

function property(object: ts.ObjectLiteralExpression, key: string) {
  return object.properties.find((p): p is ts.PropertyAssignment =>
    ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))
    && p.name.text === key)
}

function published(object: ts.ObjectLiteralExpression, inherit = false): boolean {
  const status = property(object, 'status')?.initializer
  if (!status && inherit) return true
  if (!status || !ts.isObjectLiteralExpression(status)) throw new Error('Lesson status must be a literal object')
  const kind = property(status, 'kind')?.initializer
  if (!kind || !ts.isStringLiteral(kind)) throw new Error('Lesson status.kind must be a string literal')
  switch (kind.text) {
    case 'published': return true
    case 'draft':
    case 'planned': return false
    default: throw new Error(`Unknown lesson status: ${kind.text}`)
  }
}

function object(expression: ts.Expression): ts.ObjectLiteralExpression {
  if (!ts.isObjectLiteralExpression(expression)) throw new Error('Lessons and versions must be literal objects')
  return expression
}

/** Strip unpublished entries AND their imports before Vite follows dependencies.
 * Hiding links alone would leave the complete drafts in a downloadable bundle.
 * Development keeps the original registry; status remains the only publish switch.
 */
export function publishedRegistry(source: string): { code: string; excludedImports: string[] } {
  const file = ts.createSourceFile('registry.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let found = false
  const result = ts.transform(file, [context => {
    const visit: ts.Visitor = node => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'lessons') {
        found = true
        if (!node.initializer || !ts.isArrayLiteralExpression(node.initializer)) throw new Error('Expected a literal lessons array')
        const entries = node.initializer.elements.map(object).filter(entry => published(entry)).map(entry => {
          const versions = property(entry, 'versions')
          if (!versions) throw new Error('Published lesson has no versions')
          if (!ts.isArrayLiteralExpression(versions.initializer)) return entry // sole(Content)
          const visible = versions.initializer.elements.map(object).filter(version => published(version, true))
          if (visible.length === 0) throw new Error('Published lesson needs at least one published version')
          return ts.factory.updateObjectLiteralExpression(entry, entry.properties.map(p => p === versions
            ? ts.factory.updatePropertyAssignment(versions, versions.name, ts.factory.createArrayLiteralExpression(visible, true))
            : p))
        })
        return ts.factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type,
          ts.factory.createArrayLiteralExpression(entries, true))
      }
      return ts.visitEachChild(node, visit, context)
    }
    return root => ts.visitNode(root, visit) as ts.SourceFile
  }])
  try {
    if (!found) throw new Error('Publication filter could not find the lessons registry')
    const transformed = result.transformed[0]
    const used = new Set<string>()
    const collect = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) return
      if (ts.isIdentifier(node)) used.add(node.text)
      ts.forEachChild(node, collect)
    }
    collect(transformed)
    const excludedImports: string[] = []
    const statements = transformed.statements.filter(statement => {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)
        || !statement.moduleSpecifier.text.endsWith('.mdx')) return true
      const binding = statement.importClause
      if (!binding?.name || binding.namedBindings) throw new Error('Lesson MDX imports must use a default component binding')
      if (used.has(binding.name.text)) return true
      excludedImports.push(statement.moduleSpecifier.text)
      return false
    })
    return { code: ts.createPrinter().printFile(ts.factory.updateSourceFile(transformed, statements)), excludedImports }
  } finally {
    result.dispose()
  }
}

export function publishedLessons(): Plugin {
  const excludedModules = new Set<string>()
  return {
    name: 'published-lessons-only',
    apply: 'build',
    enforce: 'pre',
    buildStart() { excludedModules.clear() },
    transform(source, id) {
      if (!id.endsWith('/src/lessons/registry.ts')) return
      const { code, excludedImports } = publishedRegistry(source)
      for (const path of excludedImports) excludedModules.add(resolve(dirname(id), path))
      return { code, map: null }
    },
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        for (const id of Object.keys(output.modules)) {
          if (excludedModules.has(id.split('?')[0])) this.error(`Unpublished lesson leaked into build: ${id}`)
        }
      }
    },
  }
}
