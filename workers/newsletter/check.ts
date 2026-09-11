import { strict as assert } from 'node:assert'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { createRss } from '../../scripts/rss'

const built = await Bun.build({ entrypoints: [new URL('./index.ts', import.meta.url).pathname], target: 'browser', format: 'esm' })
assert(built.success, 'Worker bundles')
const origin = 'https://physics.nicholasbardy.com'
const mf = new Miniflare(convertV4MiniflareOptions({
  modules: true, script: await built.outputs[0].text(), compatibilityDate: '2026-09-11',
  d1Databases: ['DB'], bindings: { ALLOWED_ORIGINS: origin },
  ratelimits: { SIGNUP_LIMIT: { namespace_id: '2410911', simple: { limit: 10, period: 60 } } },
}))
try {
  const db = await mf.getD1Database('DB')
  await db.exec((await Bun.file(new URL('./migrations/0001_subscribers.sql', import.meta.url)).text()).replaceAll('\n', ' '))
  let requestId = 0
  const send = (data: unknown, overrides: Record<string, string> = {}) => mf.dispatchFetch('https://example.test/subscribe', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': `192.0.2.${++requestId}`, ...overrides }, body: JSON.stringify(data),
  })
  const signup = { email: '  READER@example.com ', source: '/lesson/navier-stokes', consent: true }
  const response = await send(signup)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
  assert.deepEqual(await response.json(), { ok: true })
  await send(signup)
  const rows = await db.prepare('SELECT * FROM subscribers').all()
  assert.equal(rows.results.length, 1, 'Duplicates normalize to one subscriber')
  assert.equal(rows.results[0].email, 'reader@example.com')
  assert.equal(rows.results[0].consent_text, 'Get emailed every new visual explainer')
  assert.equal(rows.results[0].source, '/lesson/navier-stokes')
  assert(rows.results[0].subscribed_at)
  const token = rows.results[0].unsubscribe_token
  assert.equal(typeof token, 'string')
  assert.equal((await send({ ...signup, email: 'bad-email' })).status, 400)
  assert.equal((await send({ ...signup, consent: false })).status, 400)
  assert.equal((await send(signup, { Origin: 'https://unrelated.example' })).status, 403)
  assert.equal((await send(signup, { 'Content-Type': 'text/plain' })).status, 415)
  assert.equal((await send({ ...signup, email: 'bot@example.com', website: 'bot' })).status, 200)
  assert.equal((await db.prepare('SELECT count(*) AS n FROM subscribers').first()).n, 1)
  assert.equal((await send({ ...signup, source: 'x'.repeat(3000) })).status, 413)
  const optout = `https://example.test/unsubscribe?token=${token}`
  assert.equal((await mf.dispatchFetch(optout)).status, 200)
  assert.equal((await db.prepare('SELECT unsubscribed_at FROM subscribers').first()).unsubscribed_at, null, 'Scanners do not unsubscribe')
  assert.equal((await mf.dispatchFetch(optout, { method: 'POST' })).status, 200)
  await send(signup)
  assert((await db.prepare('SELECT unsubscribed_at FROM subscribers').first()).unsubscribed_at, 'An opt-out stays suppressed')
  for (let i = 0; i < 10; i++) assert.equal((await send(signup, { 'CF-Connecting-IP': '198.51.100.1' })).status, 200)
  assert.equal((await send(signup, { 'CF-Connecting-IP': '198.51.100.1' })).status, 429)
  assert.equal((await mf.dispatchFetch('https://example.test/subscribers')).status, 404, 'No public list endpoint')
  console.log('Newsletter: real Worker/D1 signup, duplicate handling, validation, CORS, spam checks, suppression, and rate limit passed.')
} finally { await mf.dispose() }

const rss = createRss(`export const lessons = [
  { id: 'public', title: 'Waves & <noise>', blurb: 'A "quote"', status: { kind: 'published' }, versions: [{ arbitrary: [] }] },
  { id: 'draft', title: 'Hidden', blurb: 'Not ready', status: { kind: 'draft' } }
]`)
assert(rss.includes('Waves &amp; &lt;noise&gt;'))
assert(rss.includes('https://physics.nicholasbardy.com/lesson/public'))
assert(!rss.includes('/lesson/draft'))
assert.equal((rss.match(/<item>/g) ?? []).length, 1)
console.log('RSS: published-only entries, stable URLs, and XML escaping passed.')
