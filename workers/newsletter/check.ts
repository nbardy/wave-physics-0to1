import { strict as assert } from 'node:assert'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { createRss } from '../../scripts/rss'

const built = await Bun.build({ entrypoints: [new URL('./index.ts', import.meta.url).pathname], target: 'browser', format: 'esm' })
assert(built.success, 'Worker bundles')
const origin = 'https://physics.nicholasbardy.com'
const mf = new Miniflare(convertV4MiniflareOptions({
  modules: true, script: await built.outputs[0].text(), compatibilityDate: '2026-09-11',
  d1Databases: ['DB'], bindings: { ALLOWED_ORIGINS: origin, ANALYTICS_READ_TOKEN: 'local-read-token' },
  ratelimits: {
    SIGNUP_LIMIT: { namespace_id: '2410911', simple: { limit: 10, period: 60 } },
    ANALYTICS_LIMIT: { namespace_id: '2410912', simple: { limit: 120, period: 60 } },
  },
}))
try {
  const db = await mf.getD1Database('DB')
  await db.exec((await Bun.file(new URL('./migrations/0001_subscribers.sql', import.meta.url)).text()).replaceAll('\n', ' '))
  await db.exec((await Bun.file(new URL('./migrations/0002_analytics.sql', import.meta.url)).text()).replaceAll('\n', ' '))
  let requestId = 0
  const send = (data: unknown, overrides: Record<string, string> = {}) => mf.dispatchFetch('https://example.test/subscribe', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': `192.0.2.${++requestId}`, ...overrides }, body: JSON.stringify(data),
  })
  const now = Date.now()
  const signup = { email: '  READER@example.com ', source: '/lesson/navier-stokes', consent: true,
    placement: 'top', analytics: { visitorId: 'visitor-1', sessionId: 'session-1', pageId: 'visit-1' } }
  const response = await send(signup)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
  assert.deepEqual(await response.json(), { ok: true })
  const duplicateResponse = await send(signup)
  assert.deepEqual(await duplicateResponse.json(), { ok: true }, 'Existing membership response is identical')
  const rows = await db.prepare('SELECT * FROM subscribers').all()
  assert.equal(rows.results.length, 1, 'Duplicates normalize to one subscriber')
  assert.equal(rows.results[0].email, 'reader@example.com')
  assert.equal(rows.results[0].consent_text, 'Get emailed every new visual explainer')
  assert.equal(rows.results[0].source, '/lesson/navier-stokes')
  assert(rows.results[0].subscribed_at)
  const token = rows.results[0].unsubscribe_token
  assert.equal(typeof token, 'string')
  const completions = await db.prepare("SELECT * FROM analytics_events WHERE name='newsletter_signup_completed'").all()
  assert.equal(completions.results.length, 1, 'Only a new subscriber records a completion')
  assert.equal(completions.results[0].source, 'server')
  assert.equal(completions.results[0].visitor_id, 'visitor-1')
  assert.equal(completions.results[0].session_id, 'session-1')
  assert.equal(completions.results[0].path, '/lesson/navier-stokes')
  assert.deepEqual(JSON.parse(String(completions.results[0].properties)), { placement: 'top', pageId: 'visit-1' })
  assert(!JSON.stringify(completions.results).includes('reader@example.com'))
  assert(!JSON.stringify(completions.results).includes(String(token)))
  assert(!JSON.stringify(completions.results).includes('192.0.2.'))
  assert.equal((await send({ ...signup, email: 'bad-email' })).status, 400)
  assert.equal((await send({ ...signup, consent: false })).status, 400)
  assert.equal((await send({ ...signup, email: 'bad-attribution@example.com', analytics: { visitorId: 'v' } })).status, 400)
  assert.equal((await send({ ...signup, email: 'bad-placement@example.com', placement: 'middle' })).status, 400)
  assert.equal((await send(signup, { Origin: 'https://unrelated.example' })).status, 403)
  assert.equal((await send(signup, { 'Content-Type': 'text/plain' })).status, 415)
  assert.equal((await send({ ...signup, email: 'bot@example.com', website: 'bot' })).status, 200)
  assert.equal((await db.prepare('SELECT count(*) AS n FROM subscribers').first()).n, 1)
  assert.equal((await send({ ...signup, source: 'x'.repeat(3000) })).status, 413)

  await send({ ...signup, email: 'private@example.com', analytics: false, placement: 'bottom' })
  await send({ ...signup, email: 'dnt@example.com', placement: 'bottom' }, { DNT: '1' })
  assert.equal((await db.prepare("SELECT count(*) AS n FROM analytics_events WHERE name='newsletter_signup_completed'").first()).n, 1,
    'Explicit privacy signals create no analytics event')

  const browserEvent = (name: string, properties: Record<string, unknown>, path = '/lesson/navier-stokes') => ({
    v: 1, id: crypto.randomUUID(), siteId: 'visual-explainers', visitorId: 'visitor-1', sessionId: 'session-1',
    name, kind: name === 'page_view' ? 'page' : 'event', timestamp: Date.now(), path, properties,
  })
  const collectEvent = (event: unknown, overrides: Record<string, string> = {}) => mf.dispatchFetch('https://example.test/collect', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0',
      'CF-Connecting-IP': `203.0.113.${++requestId}`, ...overrides }, body: JSON.stringify(event),
  })
  assert.equal((await collectEvent(browserEvent('newsletter_signup_completed', { pageId: 'visit-1' }))).status, 403,
    'Browser cannot forge a confirmed signup')
  assert.equal((await collectEvent(browserEvent('page_view', { pageId: 'visit-1', version: 'II', email: 'must-not-persist@example.com' }))).status, 204)
  assert.equal((await collectEvent(browserEvent('scroll_depth', { pageId: 'visit-1', percent: 20, version: 'II', email: 'must-not-persist@example.com' }))).status, 204)
  assert.equal((await collectEvent(browserEvent('newsletter_form_viewed', { pageId: 'visit-1', placement: 'top' }))).status, 204)
  for (const name of ['newsletter_signup_started', 'newsletter_signup_failed', 'rss_copy', 'rss_open']) {
    assert.equal((await collectEvent(browserEvent(name, {
      pageId: 'visit-1', placement: 'top', email: 'must-not-persist@example.com', token: 'must-not-persist',
    }))).status, 204)
  }
  assert.equal((await collectEvent(browserEvent('rss_open', {
    pageId: 'visit-1', placement: 'footer', email: 'must-not-persist@example.com',
  }))).status, 204)
  assert.equal((await collectEvent(browserEvent('article_link_clicked', {
    pageId: 'visit-1', fromPath: '/lesson/navier-stokes?secret=gone', toPath: '/lesson/fiber-bundles?token=gone',
    placement: 'more-articles', email: 'must-not-persist@example.com',
  }))).status, 204)
  assert.equal((await collectEvent(browserEvent('scroll_depth', { pageId: 'private-visit', percent: 30 }), { 'Sec-GPC': '1' })).status, 204)
  assert.equal((await collectEvent(browserEvent('scroll_depth', { pageId: 'evil-private-visit', percent: 30 }),
    { 'Sec-GPC': '1', Origin: 'https://unrelated.example' })).status, 403, 'Privacy opt-out does not bypass origin checks')
  const browserRows = await db.prepare("SELECT properties FROM analytics_events WHERE source='browser'").all()
  assert(!JSON.stringify(browserRows.results).includes('must-not-persist@example.com'), 'Collector persists only whitelisted properties')
  assert(!JSON.stringify(browserRows.results).includes('must-not-persist'), 'Collector strips tokens and unknown fields')
  assert(!JSON.stringify(browserRows.results).includes('private-visit'), 'Collector honors explicit privacy headers')
  assert.deepEqual(JSON.parse(String((await db.prepare("SELECT properties FROM analytics_events WHERE name='page_view'").first()).properties)),
    { pageId: 'visit-1', version: 'II' }, 'Page events retain bounded version')
  for (const name of ['newsletter_signup_started', 'newsletter_signup_failed', 'rss_copy', 'rss_open']) {
    assert.deepEqual(JSON.parse(String((await db.prepare("SELECT properties FROM analytics_events WHERE name=? AND json_extract(properties, '$.placement')='top'").bind(name).first()).properties)),
      { pageId: 'visit-1', placement: 'top' }, `${name} retains its reporting dimensions`)
  }
  assert.deepEqual(JSON.parse(String((await db.prepare("SELECT properties FROM analytics_events WHERE name='rss_open' AND json_extract(properties, '$.placement')='footer' AND bot=0").first()).properties)),
    { pageId: 'visit-1', placement: 'footer' }, 'Footer RSS events retain their reporting dimensions')

  assert.equal((await collectEvent(browserEvent('rss_open', {
    pageId: 'crawler-rss-visit', placement: 'footer',
  }), { 'User-Agent': 'ExampleCrawler/1.0' })).status, 204)
  assert.equal((await db.prepare("SELECT bot FROM analytics_events WHERE name='rss_open' AND visitor_id='visitor-1' AND json_extract(properties, '$.pageId')='crawler-rss-visit'").first()).bot, 1,
    'A recognizable crawler RSS event is classified as bot')

  await send({ ...signup, email: 'crawler@example.com', analytics: {
    visitorId: 'crawler-visitor', sessionId: 'crawler-session', pageId: 'crawler-visit',
  } }, { 'User-Agent': 'ExampleCrawler/1.0' })
  assert.equal((await db.prepare("SELECT bot FROM analytics_events WHERE visitor_id='crawler-visitor'").first()).bot, 1,
    'A recognizable crawler subscription is classified as bot')

  const reportUrl = `https://example.test/reports?from=${now - 10_000}&to=${Date.now() + 10_000}`
  assert.equal((await mf.dispatchFetch(reportUrl)).status, 403, 'Reports require a bearer token')
  assert.equal((await mf.dispatchFetch(reportUrl, { headers: { Authorization: 'Bearer wrong-token' } })).status, 403)
  assert.equal((await mf.dispatchFetch('https://example.test/reports?report=reading&to=100', {
    headers: { Authorization: 'Bearer local-read-token' },
  })).status, 400, 'Reading reports require both time bounds')
  const statsResponse = await mf.dispatchFetch(reportUrl, { headers: { Authorization: 'Bearer local-read-token' } })
  assert.equal(statsResponse.status, 200)
  assert.deepEqual(await statsResponse.json(), { pageviews: 1, visitors: 1, sessions: 1, events: 9 })
  const readingResponse = await mf.dispatchFetch(`${reportUrl}&report=reading`, {
    headers: { Authorization: 'Bearer local-read-token' },
  })
  assert.equal(readingResponse.status, 200)
  const reading = await readingResponse.json() as Record<string, Array<Record<string, unknown>>>
  assert.deepEqual(reading.pages, [{ path: '/lesson/navier-stokes', pageVisits: 1, pageviews: 1, visitors: 1, sessions: 1 }])
  assert.deepEqual(reading.scroll, [{ path: '/lesson/navier-stokes', percent: 20, pageVisits: 1, visitors: 1, sessions: 1 }])
  assert.deepEqual(reading.newsletterForms, [{ path: '/lesson/navier-stokes', placement: 'top', pageVisits: 1, views: 1, visitors: 1, sessions: 1 }])
  assert.deepEqual(reading.signups, [{ path: '/lesson/navier-stokes', placement: 'top', pageVisits: 1, signups: 1, visitors: 1, sessions: 1 }])
  assert.deepEqual(reading.signupAttempts, [{ path: '/lesson/navier-stokes', name: 'newsletter_signup_started', placement: 'top', pageVisits: 1, events: 1, visitors: 1, sessions: 1 }])
  assert.deepEqual(reading.signupsFailed, [{ path: '/lesson/navier-stokes', name: 'newsletter_signup_failed', placement: 'top', pageVisits: 1, events: 1, visitors: 1, sessions: 1 }])
  assert.deepEqual(reading.rss, [
    { path: '/lesson/navier-stokes', name: 'rss_copy', placement: 'top', pageVisits: 1, events: 1, visitors: 1, sessions: 1 },
    { path: '/lesson/navier-stokes', name: 'rss_open', placement: 'footer', pageVisits: 1, events: 1, visitors: 1, sessions: 1 },
    { path: '/lesson/navier-stokes', name: 'rss_open', placement: 'top', pageVisits: 1, events: 1, visitors: 1, sessions: 1 },
  ])
  assert.deepEqual(reading.articleLinks, [{ path: '/lesson/navier-stokes', toPath: '/lesson/fiber-bundles', placement: 'more-articles', pageVisits: 1, clicks: 1, visitors: 1, sessions: 1 }])
  assert(!JSON.stringify(reading).includes('visit-1'), 'Aggregate reports do not expose page-visit IDs')

  const burstIp = '203.0.113.250'
  for (let i = 0; i < 120; i++) {
    assert.equal((await collectEvent(browserEvent('page_view', { pageId: `burst-${i}` }), {
      'CF-Connecting-IP': burstIp,
    })).status, 204, `Analytics event ${i + 1} stays inside its dedicated budget`)
  }
  assert.equal((await collectEvent(browserEvent('page_view', { pageId: 'burst-capped' }), {
    'CF-Connecting-IP': burstIp,
  })).status, 429, 'Dedicated analytics budget caps the 121st event')

  const optout = `https://example.test/unsubscribe?token=${token}`
  assert.equal((await mf.dispatchFetch(optout)).status, 200)
  assert.equal((await db.prepare('SELECT unsubscribed_at FROM subscribers').first()).unsubscribed_at, null, 'Scanners do not unsubscribe')
  assert.equal((await mf.dispatchFetch(optout, { method: 'POST' })).status, 200)
  const suppressedResponse = await send(signup)
  assert.deepEqual(await suppressedResponse.json(), { ok: true }, 'Suppressed membership response is identical')
  assert((await db.prepare('SELECT unsubscribed_at FROM subscribers').first()).unsubscribed_at, 'An opt-out stays suppressed')
  assert.equal((await db.prepare("SELECT count(*) AS n FROM analytics_events WHERE name='newsletter_signup_completed' AND visitor_id='visitor-1'").first()).n, 1,
    'Suppressed retry does not duplicate completion')
  for (let i = 0; i < 10; i++) assert.equal((await send(signup, { 'CF-Connecting-IP': '198.51.100.1' })).status, 200)
  assert.equal((await send(signup, { 'CF-Connecting-IP': '198.51.100.1' })).status, 429)
  assert.equal((await mf.dispatchFetch('https://example.test/subscribers')).status, 404, 'No public list endpoint')
  await db.prepare('DROP TABLE analytics_events').run()
  const failed = await send({ ...signup, email: 'rollback@example.com' })
  assert.equal(failed.status, 503)
  assert.equal((await db.prepare("SELECT count(*) AS n FROM subscribers WHERE email='rollback@example.com'").first()).n, 0,
    'Analytics failure rolls back the subscriber insert')
  console.log('Newsletter: atomic signup analytics, shared collector/reports, privacy, duplicate handling, validation, CORS, spam checks, suppression, and rate limit passed.')
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
