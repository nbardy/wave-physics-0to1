import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { createCanvas, ImageData } from '@napi-rs/canvas'
import { PREVIEW_DT, previewBounds, type LessonPreviewSpec } from '../src/components/previewSpec'

// Read the actual registry's preview expressions without evaluating its MDX
// imports. The trusted local expressions retain their real dynamic imports.
const source = readFileSync('src/lessons/registry.ts', 'utf8')
const file = ts.createSourceFile('registry.ts', source, ts.ScriptTarget.Latest, true)
const entries: string[] = []
const property = (o: ts.ObjectLiteralExpression, key: string) => o.properties.find(
  (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText(file) === key,
)?.initializer
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'lessons') {
    assert(node.initializer && ts.isArrayLiteralExpression(node.initializer))
    for (const entry of node.initializer.elements) {
      assert(ts.isObjectLiteralExpression(entry))
      const id = property(entry, 'id')!
      const preview = property(entry, 'preview')
      assert(preview, `${id.getText(file)} needs a preview`)
      const expression = preview.getText(file)
        .replaceAll('import.meta.url', JSON.stringify(pathToFileURL(resolve('src/lessons/registry.ts')).href))
        .replace(/import\('([^']+)'\)/g,
          (_match, path: string) => `import(${JSON.stringify(resolve('src/lessons', path))})`)
      entries.push(`{ id: ${id.getText(file)}, spec: ${expression} }`)
    }
  }
  ts.forEachChild(node, visit)
}
visit(file)
assert(entries.length > 0)

Object.assign(globalThis, { ImageData, document: { createElement: () => createCanvas(1, 1) } })
const temporary = mkdtempSync(join(tmpdir(), 'lesson-previews-'))
const generated = join(temporary, 'registry.ts')
writeFileSync(generated, `export default [${entries.join(',\n')}];`)
const output = '_figure_check/previews'
mkdirSync(output, { recursive: true })
const writePosters = process.argv.includes('--write')
if (writePosters) mkdirSync('src/assets/lesson-previews', { recursive: true })

try {
  const previews: Array<{ id: string; spec: LessonPreviewSpec }> =
    (await import(pathToFileURL(generated).href)).default
  const sheet = createCanvas(960, Math.ceil(previews.length / 2) * 310)
  const sheetCtx = sheet.getContext('2d')
  sheetCtx.fillStyle = '#fcfcfa'
  sheetCtx.fillRect(0, 0, sheet.width, sheet.height)
  for (const [index, { id, spec }] of previews.entries()) {
    const start = performance.now()
    const figure = await spec.load()
    const bounds = previewBounds(spec)
    const canvas = createCanvas(bounds.width, bounds.height)
    const ctx = canvas.getContext('2d')
    ctx.translate(-bounds.x, -bounds.y)
    const draw = () => {
      ctx.save()
      figure.draw(ctx as unknown as CanvasRenderingContext2D, spec.width, spec.height)
      ctx.restore()
      return ctx.getImageData(0, 0, bounds.width, bounds.height).data.slice()
    }
    try {
      for (let step = 0; step < Math.round(spec.warmup / PREVIEW_DT); step++) figure.step(PREVIEW_DT)
      const still = draw()
      assert.deepEqual(draw(), still, `${id}: an idle figure must remain still`)
      const png = canvas.toBuffer('image/png')
      if (writePosters) writeFileSync(`src/assets/lesson-previews/${id}.png`, png)
      writeFileSync(`${output}/${id}-still.png`, png)
      const x = (index % 2) * 480, y = Math.floor(index / 2) * 310
      sheetCtx.font = '16px sans-serif'
      sheetCtx.fillStyle = '#17191d'
      sheetCtx.fillText(id, x + 12, y + 24)
      const scale = Math.min(456 / bounds.width, 262 / bounds.height)
      sheetCtx.drawImage(canvas, x + 12, y + 38, bounds.width * scale, bounds.height * scale)

      // Compare actual pixels with the still throughout a short hover. A
      // background, a static chart, or a no-op stepper cannot pass this.
      let changed = 0
      for (let step = 0; step < 180; step++) {
        figure.step(PREVIEW_DT)
        if (step % 30 !== 29) continue
        const moving = draw()
        let n = 0
        for (let i = 0; i < still.length; i += 4) {
          if (Math.abs(moving[i] - still[i]) + Math.abs(moving[i + 1] - still[i + 1])
            + Math.abs(moving[i + 2] - still[i + 2]) + Math.abs(moving[i + 3] - still[i + 3]) > 40) n++
        }
        changed = Math.max(changed, n)
      }
      assert(changed > 100, `${id}: hovering must visibly animate the figure (${changed} changed pixels)`)
      const paused = draw()
      assert.deepEqual(draw(), paused, `${id}: leaving hover must freeze the current frame`)
      writeFileSync(`${output}/${id}-moving.png`, canvas.toBuffer('image/png'))
      console.log(`${id}: still + motion + pause passed; ${changed} moving pixels; ${Math.round(performance.now() - start)} ms`)
    } finally { figure.dispose?.() }
  }
  writeFileSync(`${output}/contact-sheet.png`, sheet.toBuffer('image/png'))
  console.log(`${previews.length} lesson previews checked${writePosters ? ' and posters generated' : ''}.`)
} finally { rmSync(temporary, { recursive: true, force: true }) }
