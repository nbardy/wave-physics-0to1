import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { publishedRegistry } from './published-lessons'
import { createRss } from './rss'
import type * as Registry from '../src/lessons/registry'

// Execute the real metadata and lookup functions, stubbing only MDX rendering.
function registry(source: string): typeof Registry {
  const exports = {}
  const code = ts.transpileModule(source.replaceAll('import.meta.url', "'file:///src/lessons/registry.ts'"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  runInNewContext(code, {
    exports,
    URL,
    require(path: string) {
      assert.ok(path.endsWith('.mdx'), `Unexpected runtime dependency: ${path}`)
      return { default: () => null }
    },
  })
  return exports as typeof Registry
}

const source = readFileSync('src/lessons/registry.ts', 'utf8')
const dev = registry(source)
const transformed = publishedRegistry(source)
const production = registry(transformed.code)
const published = dev.lessons.filter(lesson => lesson.status.kind === 'published')
const drafts = dev.lessons.filter(lesson => lesson.status.kind !== 'published')
assert.ok(drafts.length > 0, 'Dev must retain draft specimens for this regression')
assert.equal(production.lessons.length, published.length)
for (const lesson of drafts) {
  assert.ok(dev.lessonById(lesson.id), `${lesson.id}: available in development`)
  assert.equal(production.lessonById(lesson.id), undefined, `${lesson.id}: direct route unavailable`)
  assert.ok(!production.allLessons().some(item => item.id === lesson.id), `${lesson.id}: absent from index`)
}
for (const lesson of published) {
  assert.equal(production.lessonById(lesson.id)?.title, lesson.title)
}
for (const path of transformed.excludedImports) {
  assert.ok(!transformed.code.includes(path), `${path}: no import in production`)
}
assert.ok(transformed.excludedImports.includes('./lesson-04-learned-solver.I.mdx'))
assert.ok(transformed.excludedImports.includes('./lesson-04-learned-solver.II.mdx'))
assert.ok(transformed.excludedImports.includes('./lesson-01-navier-stokes.II.mdx'))
assert.ok(dev.versionOf(dev.lessonById('navier-stokes')!, 'II'))
assert.equal(production.versionOf(production.lessonById('navier-stokes')!, 'II'), undefined)
assert.equal(production.defaultVersion(production.lessonById('navier-stokes')!).label, 'I')
assert.ok(!production.tagsInUse().some(({ tag }) => tag === 'quantum'))
for (const series of production.SERIES) {
  for (const id of series.lessonIds) assert.ok(production.lessonById(id))
}

// Promotion needs only a status edit: no separate production import list.
const promotedSource = source.replace(/(id: 'learned-solver'[\s\S]*?status: \{ kind: )'draft'/, "$1'published'")
const promoted = registry(publishedRegistry(promotedSource).code)
assert.ok(promoted.lessonById('learned-solver'))
assert.equal(promoted.lessonById('learned-solver')!.versions.length, 2)

// Demoting a series member removes it from the series links and part counts.
const demotedSource = source.replace(/(id: 'z1-compiler'[\s\S]*?status: \{ kind: )'published'/, "$1'draft'")
const demoted = registry(publishedRegistry(demotedSource).code)
assert.equal(demoted.seriesById('thermo')!.lessonIds.length, 2)
assert.equal(demoted.seriesForLesson('z1-compiler'), undefined)
assert.equal(demoted.seriesForLesson('ebm-diffusion')!.index, 1)

// RSS has the same published membership, without importing browser components.
const rss = createRss(source)
assert.equal((rss.match(/<item>/g) ?? []).length, published.length)
for (const lesson of drafts) assert.ok(!rss.includes(`/lesson/${lesson.id}<`))

assert.throws(() => publishedRegistry('export const lessons = loadEverything()'))
assert.throws(() => publishedRegistry(source.replace("status: { kind: 'draft' }", "status: { kind: 'typo' }")))
assert.throws(() => publishedRegistry(source.replace("status: { kind: 'draft' }", "status: getStatus()")))
console.log(`Publication checks passed: ${dev.lessons.length} dev lessons, ${production.lessons.length} production lessons; drafts, versions, imports, series, tags, RSS, and promotion checked.`)
