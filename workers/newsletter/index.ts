import {
  createEvent,
  normalizePath,
  type AnalyticsEvent,
  type EventSink,
  type Properties,
  type StoredEvent,
} from '@nick/analytics'
import { createD1Store } from '@nick/analytics/d1'
import { createCollector, verifyBearer } from '@nick/analytics/http'
import { createReportApi } from '@nick/analytics/report-api'

const CONSENT = 'Get emailed every new visual explainer'
const MAX_BODY = 2048
const SITE_ID = 'visual-explainers'
const NEWSLETTER_COMPLETION = 'newsletter_signup_completed'

interface SignupAttribution {
  visitorId: string
  sessionId: string
  pageId: string
}

class RequestError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}

// Bound the actual bytes, including requests without Content-Length.
async function readBody(request: Request): Promise<string> {
  if (!request.body) throw new RequestError(400, 'Enter your email address.')
  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let text = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY) {
        await reader.cancel()
        throw new RequestError(413, 'The signup was too large. Please try again.')
      }
      text += decoder.decode(value, { stream: true })
    }
    return text + decoder.decode()
  } finally { reader.releaseLock() }
}

function page(body: string, status = 200): Response {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Visual explainer emails</title><style>body{font:18px/1.6 system-ui;color:#173d62;background:#fcfcfa;margin:12vh auto;padding:24px;max-width:540px}main{background:#eaf4ff;padding:28px;border-radius:12px}h1{font-size:24px}button{font:inherit;background:#215d91;color:white;border:0;border-radius:6px;padding:10px 18px;cursor:pointer}</style><main>${body}</main></html>`, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
    },
  })
}

async function unsubscribe(request: Request, env: Env): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token') ?? ''
  if (!/^[a-f0-9]{64}$/.test(token)) return page('<h1>Invalid unsubscribe link</h1><p>Use the unsubscribe link from your email.</p>', 400)
  if (request.method === 'GET') {
    // Email scanners follow links; viewing the page must not change a subscription.
    return page('<h1>Stop visual explainer emails?</h1><form method="post"><button>Unsubscribe</button></form>')
  }
  if (request.method !== 'POST') return page('<h1>Method not allowed</h1>', 405)
  await env.DB.prepare("UPDATE subscribers SET unsubscribed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE unsubscribe_token = ? AND unsubscribed_at IS NULL").bind(token).run()
  return page('<h1>You’re unsubscribed.</h1><p>You won’t receive new visual explainers by email.</p>')
}

function allowedOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
}

function hasPrivacyOptOut(request: Request): boolean {
  return request.headers.get('Sec-GPC') === '1' || request.headers.get('DNT') === '1'
}

function asAttribution(value: unknown): SignupAttribution | false | undefined {
  if (value === undefined || value === false) return value
  if (!value || typeof value !== 'object') throw new RequestError(400, 'Invalid analytics attribution.')
  const record = value as Record<string, unknown>
  const visitorId = typeof record.visitorId === 'string' ? record.visitorId : ''
  const sessionId = typeof record.sessionId === 'string' ? record.sessionId : ''
  const pageId = typeof record.pageId === 'string' ? record.pageId : ''
  if (![visitorId, sessionId, pageId].every(item => item.length >= 1 && item.length <= 255)) {
    throw new RequestError(400, 'Invalid analytics attribution.')
  }
  return { visitorId, sessionId, pageId }
}

function analyticsInsert(db: D1Database, event: AnalyticsEvent, email: string, token: string, bot: boolean) {
  return db.prepare(`INSERT INTO analytics_events
    (site_id,event_id,visitor_id,session_id,user_id,name,kind,timestamp,received_at,path,referrer,properties,source,bot)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?
    WHERE EXISTS (SELECT 1 FROM subscribers WHERE email = ? AND unsubscribe_token = ?)
    ON CONFLICT(site_id,source,event_id) DO NOTHING`).bind(
    event.siteId, event.id, event.visitorId ?? null, event.sessionId ?? null, event.userId ?? null,
    event.name, event.kind, event.timestamp, Date.now(), event.path, event.referrer ?? null,
    JSON.stringify(event.properties), 'server', bot ? 1 : 0, email, token,
  )
}

function propertyString(properties: Properties, key: string, maxLength = 255): string | undefined {
  const value = properties[key]
  return typeof value === 'string' && value.length >= 1 && value.length <= maxLength ? value : undefined
}

function browserProperties(event: StoredEvent): Properties {
  const pageId = propertyString(event.properties, 'pageId')
  const version = propertyString(event.properties, 'version', 64)
  switch (event.name) {
    case 'page_view':
      return pageId ? { pageId, ...(version ? { version } : {}) } : {}
    case 'scroll_depth': {
      const percent = event.properties.percent
      return pageId && typeof percent === 'number' && Number.isInteger(percent)
        && percent >= 10 && percent <= 100 && percent % 10 === 0
        ? { pageId, percent, ...(version ? { version } : {}) } : {}
    }
    case 'newsletter_form_viewed':
    case 'newsletter_signup_started':
    case 'newsletter_signup_failed': {
      const placement = propertyString(event.properties, 'placement')
      return pageId && (placement === 'top' || placement === 'bottom') ? { pageId, placement } : {}
    }
    case 'rss_copy':
    case 'rss_open': {
      const placement = propertyString(event.properties, 'placement')
      return pageId && (placement === 'top' || placement === 'bottom' || placement === 'footer' || placement === 'link')
        ? { pageId, placement } : {}
    }
    case 'article_link_clicked': {
      const placement = propertyString(event.properties, 'placement')
      const fromPath = propertyString(event.properties, 'fromPath')
      const toPath = propertyString(event.properties, 'toPath')
      if (!pageId || !placement || !fromPath || !toPath) return {}
      try {
        return { pageId, placement, fromPath: normalizePath(fromPath), toPath: normalizePath(toPath) }
      } catch { return {} }
    }
    default:
      return {}
  }
}

function browserSink(db: D1Database): EventSink {
  const store = createD1Store(db)
  return {
    write(events) {
      return store.write(events.map(event => ({ ...event, properties: browserProperties(event) })))
    },
  }
}

function collect(request: Request, env: Env): Promise<Response> {
  const origins = allowedOrigins(env)
  const origin = request.headers.get('Origin')
  if (request.method === 'POST' && origin && origins.includes(origin)
      && !request.headers.has('Authorization') && hasPrivacyOptOut(request)) {
    const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin' })
    headers.set('Access-Control-Allow-Origin', origin)
    return Promise.resolve(new Response(null, { status: 204, headers }))
  }
  return createCollector({
    siteId: SITE_ID,
    sink: browserSink(env.DB),
    allowedOrigins: origins,
    serverOnlyEvents: [NEWSLETTER_COMPLETION],
    rateLimit: async req => (await env.ANALYTICS_LIMIT.limit({
      key: `collect:${req.headers.get('CF-Connecting-IP') ?? 'unknown'}`,
    })).success,
    onError: error => console.error(JSON.stringify({
      event: 'analytics_write_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })),
  })(request)
}

function reports(request: Request, env: Env): Promise<Response> {
  return createReportApi({
    siteId: SITE_ID,
    reports: () => createD1Store(env.DB),
    authorize: req => verifyBearer(req, env.ANALYTICS_READ_TOKEN),
    onError: error => console.error(JSON.stringify({
      event: 'analytics_report_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })),
  })(request)
}

async function readingReport(request: Request, env: Env): Promise<Response> {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' }
  const json = (value: unknown, status = 200) => Response.json(value, { status, headers })
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET' } })
  if (!await verifyBearer(request, env.ANALYTICS_READ_TOKEN)) return json({ error: 'Forbidden' }, 403)

  const url = new URL(request.url)
  const fromValue = url.searchParams.get('from')
  const toValue = url.searchParams.get('to')
  const from = Number(fromValue)
  const to = Number(toValue)
  if (fromValue === null || toValue === null || !Number.isSafeInteger(from) || !Number.isSafeInteger(to)
      || from < 0 || to <= from || to - from > 366 * 86_400_000) {
    return json({ error: 'Invalid report query' }, 400)
  }
  const bindRange = (sql: string) => env.DB.prepare(sql).bind(SITE_ID, from, to)
  try {
    const results = await env.DB.batch([
      bindRange(`SELECT path,COUNT(DISTINCT json_extract(properties,'$.pageId')) AS pageVisits,
        COUNT(*) AS pageviews,COUNT(DISTINCT visitor_id) AS visitors,COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events WHERE site_id=? AND timestamp>=? AND timestamp<? AND bot=0
          AND kind='page' AND name='page_view' AND json_type(properties,'$.pageId')='text'
        GROUP BY path ORDER BY pageviews DESC,path`),
      bindRange(`SELECT path,CAST(json_extract(properties,'$.percent') AS INTEGER) AS percent,
        COUNT(DISTINCT json_extract(properties,'$.pageId')) AS pageVisits,
        COUNT(DISTINCT visitor_id) AS visitors,COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events WHERE site_id=? AND timestamp>=? AND timestamp<? AND bot=0
          AND kind='event' AND name='scroll_depth' AND json_type(properties,'$.pageId')='text'
          AND json_type(properties,'$.percent')='integer'
          AND CAST(json_extract(properties,'$.percent') AS INTEGER) BETWEEN 10 AND 100
          AND CAST(json_extract(properties,'$.percent') AS INTEGER)%10=0
        GROUP BY path,percent ORDER BY path,percent`),
      bindRange(`SELECT path,json_extract(properties,'$.placement') AS placement,
        COUNT(DISTINCT json_extract(properties,'$.pageId')) AS pageVisits,COUNT(*) AS views,
        COUNT(DISTINCT visitor_id) AS visitors,COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events WHERE site_id=? AND timestamp>=? AND timestamp<? AND bot=0
          AND kind='event' AND name='newsletter_form_viewed' AND source='browser'
          AND json_type(properties,'$.pageId')='text'
          AND json_extract(properties,'$.placement') IN ('top','bottom')
        GROUP BY path,placement ORDER BY path,placement`),
      bindRange(`SELECT path,json_extract(properties,'$.placement') AS placement,
        COUNT(DISTINCT json_extract(properties,'$.pageId')) AS pageVisits,COUNT(*) AS signups,
        COUNT(DISTINCT visitor_id) AS visitors,COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events WHERE site_id=? AND timestamp>=? AND timestamp<? AND bot=0
          AND kind='event' AND name='newsletter_signup_completed' AND source='server'
          AND json_type(properties,'$.pageId')='text'
          AND json_extract(properties,'$.placement') IN ('top','bottom')
        GROUP BY path,placement ORDER BY path,placement`),
      bindRange(`SELECT path,name,json_extract(properties,'$.placement') AS placement,
        COUNT(DISTINCT json_extract(properties,'$.pageId')) AS pageVisits,COUNT(*) AS events,
        COUNT(DISTINCT visitor_id) AS visitors,COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events WHERE site_id=? AND timestamp>=? AND timestamp<? AND bot=0
          AND kind='event' AND name='newsletter_signup_started' AND source='browser'
          AND json_type(properties,'$.pageId')='text'
          AND json_extract(properties,'$.placement') IN ('top','bottom')
        GROUP BY path,name,placement ORDER BY path,name,placement`),
      bindRange(`SELECT path,name,json_extract(properties,'$.placement') AS placement,
        COUNT(DISTINCT json_extract(properties,'$.pageId')) AS pageVisits,COUNT(*) AS events,
        COUNT(DISTINCT visitor_id) AS visitors,COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events WHERE site_id=? AND timestamp>=? AND timestamp<? AND bot=0
          AND kind='event' AND name='newsletter_signup_failed' AND source='browser'
          AND json_type(properties,'$.pageId')='text'
          AND json_extract(properties,'$.placement') IN ('top','bottom')
        GROUP BY path,name,placement ORDER BY path,name,placement`),
      bindRange(`SELECT path,name,json_extract(properties,'$.placement') AS placement,
        COUNT(DISTINCT json_extract(properties,'$.pageId')) AS pageVisits,COUNT(*) AS events,
        COUNT(DISTINCT visitor_id) AS visitors,COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events WHERE site_id=? AND timestamp>=? AND timestamp<? AND bot=0
          AND kind='event' AND name IN ('rss_copy','rss_open') AND source='browser'
          AND json_type(properties,'$.pageId')='text'
          AND json_extract(properties,'$.placement') IN ('top','bottom','footer','link')
        GROUP BY path,name,placement ORDER BY path,name,placement`),
      bindRange(`SELECT path,json_extract(properties,'$.toPath') AS toPath,
        json_extract(properties,'$.placement') AS placement,
        COUNT(DISTINCT json_extract(properties,'$.pageId')) AS pageVisits,COUNT(*) AS clicks,
        COUNT(DISTINCT visitor_id) AS visitors,COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events WHERE site_id=? AND timestamp>=? AND timestamp<? AND bot=0
          AND kind='event' AND name='article_link_clicked' AND source='browser'
          AND json_type(properties,'$.pageId')='text'
          AND json_type(properties,'$.toPath')='text'
          AND json_type(properties,'$.placement')='text'
        GROUP BY path,toPath,placement ORDER BY clicks DESC,path,toPath`),
    ])
    for (const result of results) if (!result.success) throw new Error(result.error ?? 'D1 report failed')
    return json({
      pages: results[0]?.results ?? [],
      scroll: results[1]?.results ?? [],
      newsletterForms: results[2]?.results ?? [],
      signups: results[3]?.results ?? [],
      signupAttempts: results[4]?.results ?? [],
      signupsFailed: results[5]?.results ?? [],
      rss: results[6]?.results ?? [],
      articleLinks: results[7]?.results ?? [],
    })
  } catch (error) {
    console.error(JSON.stringify({
      event: 'analytics_reading_report_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }))
    return json({ error: 'Analytics temporarily unavailable' }, 503)
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') ?? ''
    const allowed = allowedOrigins(env).includes(origin)
    const headers = new Headers({ 'Cache-Control': 'no-store', 'Vary': 'Origin' })
    if (allowed) {
      headers.set('Access-Control-Allow-Origin', origin)
      headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      headers.set('Access-Control-Allow-Headers', 'Content-Type')
    }
    const json = (data: object, status = 200) => Response.json(data, { status, headers })

    try {
      if (url.pathname === '/collect') return await collect(request, env)
      if (url.pathname === '/reports') {
        return url.searchParams.get('report') === 'reading'
          ? await readingReport(request, env)
          : await reports(request, env)
      }
      if (url.pathname === '/health' && request.method === 'GET') {
        await env.DB.prepare('SELECT 1 FROM subscribers LIMIT 1').first()
        return json({ ok: true })
      }
      if (url.pathname === '/unsubscribe') return await unsubscribe(request, env)
      if (url.pathname !== '/subscribe') return json({ error: 'Not found.' }, 404)
      if (!allowed) return json({ error: 'Sign up from the visual explainers website.' }, 403)
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
      if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
      if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
        return json({ error: 'Expected a JSON signup.' }, 415)
      }

      // Anonymous endpoint: cap bursts per IP; no IP is stored in the list.
      // This limit is local to each Cloudflare location, not a global quota.
      const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
      const { success } = await env.SIGNUP_LIMIT.limit({ key: `signup:${ip}` })
      if (!success) {
        headers.set('Retry-After', '60')
        return json({ error: 'Too many attempts. Please try again in a minute.' }, 429)
      }

      let data: unknown
      try { data = JSON.parse(await readBody(request)) }
      catch (error) {
        if (error instanceof RequestError) throw error
        throw new RequestError(400, 'Please enter a valid email address.')
      }
      if (!data || typeof data !== 'object' || !('email' in data)) {
        throw new RequestError(400, 'Please enter a valid email address.')
      }
      if ('website' in data && data.website) return json({ ok: true }) // honeypot
      if (!('consent' in data) || data.consent !== true) throw new RequestError(400, 'Please use the Subscribe button to join the list.')
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
      if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
        throw new RequestError(400, 'Please enter a valid email address.')
      }
      const source = 'source' in data && typeof data.source === 'string'
        && /^\/[a-zA-Z0-9/_-]{0,160}$/.test(data.source) ? data.source : '/'
      const placement = 'placement' in data && data.placement !== undefined
        ? data.placement === 'top' || data.placement === 'bottom'
          ? data.placement
          : (() => { throw new RequestError(400, 'Invalid signup placement.') })()
        : null
      const attribution = asAttribution('analytics' in data ? data.analytics : undefined)
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')
      const statements = [env.DB.prepare(`INSERT INTO subscribers (email, source, consent_text, unsubscribe_token)
        VALUES (?, ?, ?, ?) ON CONFLICT(email) DO NOTHING`).bind(email, source, CONSENT, token)]
      if (attribution !== false && !hasPrivacyOptOut(request)) {
        const event = createEvent({
          siteId: SITE_ID,
          name: NEWSLETTER_COMPLETION,
          kind: 'event',
          path: source,
          ...(attribution ? { visitorId: attribution.visitorId, sessionId: attribution.sessionId } : {}),
          properties: { placement, pageId: attribution?.pageId ?? null },
        })
        const bot = /bot|crawler|spider|headless|curl|wget/i.test(request.headers.get('User-Agent') ?? '')
        statements.push(analyticsInsert(env.DB, event, email, token, bot))
      }
      const results = await env.DB.batch(statements)
      for (const result of results) if (!result.success) throw new Error(result.error ?? 'D1 signup failed')
      // Identical response for new/existing addresses; never expose the list or tokens.
      // An existing opt-out stays suppressed until the owner explicitly restores it.
      return json({ ok: true })
    } catch (error) {
      if (error instanceof RequestError) return json({ error: error.message }, error.status)
      console.error(JSON.stringify({ event: 'newsletter_request_failed', path: url.pathname }))
      return json({ error: 'Signup is unavailable right now. Please try again shortly.' }, 503)
    }
  },
} satisfies ExportedHandler<Env>
