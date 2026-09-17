import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { createRss } from './rss'
import { parseDraftParam, resolveAudience, type Remembered } from '../src/lessons/audience'
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

const READER = { kind: 'reader' } as const
const EDITOR = { kind: 'editor' } as const

const source = readFileSync('src/lessons/registry.ts', 'utf8')
const table = registry(source)
const reader = table.catalogue(READER)
const editor = table.catalogue(EDITOR)
const published = table.lessons.filter(lesson => lesson.status.kind === 'published')
const drafts = table.lessons.filter(lesson => lesson.status.kind !== 'published')
assert.ok(drafts.length > 0, 'The registry must retain draft specimens for this regression')

// One build, two catalogues: the editor reaches everything, the reader only published work.
assert.equal(editor.lessons.length, table.lessons.length)
assert.equal(reader.lessons.length, published.length)
for (const lesson of drafts) {
  assert.ok(table.lessonById(editor, lesson.id), `${lesson.id}: an editor can open it`)
  assert.equal(table.lessonById(reader, lesson.id), undefined, `${lesson.id}: a reader cannot`)
  assert.ok(!table.allLessons(reader).some(item => item.id === lesson.id), `${lesson.id}: absent from the reader index`)
}
for (const lesson of published) {
  assert.equal(table.lessonById(reader, lesson.id)?.title, lesson.title)
}

// Versions: the reader's Building lesson is its one published version; the
// editor holds every reading copy, and `?v=` on a draft label misses loudly.
const readerBuilding = table.lessonById(reader, 'navier-stokes')!
const editorBuilding = table.lessonById(editor, 'navier-stokes')!
assert.deepEqual(readerBuilding.versions.map(v => v.label), ['I'])
assert.deepEqual(editorBuilding.versions.map(v => v.label), ['I', 'II', 'III'])
assert.equal(table.versionOf(readerBuilding, 'II'), undefined)
assert.ok(table.versionOf(editorBuilding, 'III'))
assert.equal(table.defaultVersion(readerBuilding).label, 'I')
assert.ok(!table.tagsInUse(reader).some(({ tag }) => tag === 'quantum'))
assert.ok(table.tagsInUse(editor).some(({ tag }) => tag === 'quantum'))
for (const series of reader.series) {
  for (const id of series.lessonIds) assert.ok(table.lessonById(reader, id))
}

// Rewrite one lesson's own status regardless of its current kind. Matching
// only the expected kind (e.g. `'published'`) lets the lazy `[\s\S]*?` run past
// a lesson that is already a draft and rewrite the NEXT lesson's status: when
// the thermo trilogy was unpublished (2026-09-16) the old demotion check
// silently demoted navier-stokes instead and then crashed on a missing series.
function withStatus(text: string, id: string, kind: 'draft' | 'published'): string {
  const pattern = new RegExp(`(id: '${id}'[\\s\\S]*?status: \\{ kind: )'(?:draft|published|planned)'`)
  assert.match(text, pattern, `${id}: lesson entry with a literal status`)
  return text.replace(pattern, `$1'${kind}'`)
}

// Promotion is a status edit alone; inherited versions come with it.
const promoted = registry(withStatus(source, 'learned-solver', 'published'))
assert.equal(promoted.lessonById(promoted.catalogue(READER), 'learned-solver')!.versions.length, 2)

// Demoting a series member removes it from the reader's series links and part
// counts, and leaves the editor's series whole. Publish the whole trilogy
// first so the check holds whatever is live today.
const trilogySource = ['pbits', 'z1-compiler', 'ebm-diffusion']
  .reduce((text, id) => withStatus(text, id, 'published'), source)
const demoted = registry(withStatus(trilogySource, 'z1-compiler', 'draft'))
const demotedReader = demoted.catalogue(READER)
assert.equal(demoted.seriesById(demotedReader, 'thermo')!.lessonIds.length, 2)
assert.equal(demoted.seriesForLesson(demotedReader, 'z1-compiler'), undefined)
assert.equal(demoted.seriesForLesson(demotedReader, 'ebm-diffusion')!.index, 1)
assert.equal(demoted.seriesById(demoted.catalogue(EDITOR), 'thermo')!.lessonIds.length, 3)

// A published lesson whose every version is a draft is an authoring error. It
// fails when the registry loads, not silently on one route.
const orphaned = source.replace(
  /(label: 'I',\s*author: 'baseline',\s*)(note: 'Construction revision)/,
  "$1status: { kind: 'draft' },\n        $2",
)
assert.notEqual(orphaned, source, 'the Building lesson\'s version I entry was not found')
assert.throws(() => registry(orphaned), /navier-stokes: a published lesson needs at least one published version/)

// RSS has the reader's membership, without importing browser components.
const rss = createRss(source)
assert.equal((rss.match(/<item>/g) ?? []).length, reader.lessons.length)
for (const lesson of drafts) assert.ok(!rss.includes(`/lesson/${lesson.id}<`))

// The flag: what `?draft=` means, what memory means, and which wins.
const nothing: Remembered = { kind: 'absent' }
assert.deepEqual(parseDraftParam('?draft=true'), { kind: 'on' })
assert.deepEqual(parseDraftParam('?v=III&draft=false'), { kind: 'off' })
assert.deepEqual(parseDraftParam('?v=III'), { kind: 'absent' })
assert.deepEqual(parseDraftParam('?draft=yes'), { kind: 'unknown', raw: 'yes' })
assert.equal(resolveAudience({ kind: 'on' }, nothing, 'production').kind, 'editor')
assert.equal(resolveAudience({ kind: 'off' }, { kind: 'on' }, 'development').kind, 'reader')
assert.equal(resolveAudience({ kind: 'absent' }, nothing, 'production').kind, 'reader')
assert.equal(resolveAudience({ kind: 'absent' }, nothing, 'development').kind, 'editor')
assert.equal(resolveAudience({ kind: 'absent' }, { kind: 'on' }, 'production').kind, 'editor')
assert.equal(resolveAudience({ kind: 'absent' }, { kind: 'off' }, 'development').kind, 'reader')
assert.equal(resolveAudience({ kind: 'unknown', raw: 'yes' }, { kind: 'unavailable' }, 'production').kind, 'reader')
assert.equal(resolveAudience({ kind: 'absent' }, { kind: 'unknown', raw: 'maybe' }, 'production').kind, 'reader')

console.log(`Publication checks passed: ${table.lessons.length} lessons in the table, ${reader.lessons.length} reachable by a reader, ${editor.lessons.length} by an editor; versions, series, promotion, RSS, and the ?draft flag checked.`)
