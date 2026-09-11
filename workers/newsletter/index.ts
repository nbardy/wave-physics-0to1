const CONSENT = 'Get emailed every new visual explainer'
const MAX_BODY = 2048

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

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') ?? ''
    const allowed = env.ALLOWED_ORIGINS.split(',').includes(origin)
    const headers = new Headers({ 'Cache-Control': 'no-store', 'Vary': 'Origin' })
    if (allowed) {
      headers.set('Access-Control-Allow-Origin', origin)
      headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      headers.set('Access-Control-Allow-Headers', 'Content-Type')
    }
    const json = (data: object, status = 200) => Response.json(data, { status, headers })

    try {
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
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')
      await env.DB.prepare(`INSERT INTO subscribers (email, source, consent_text, unsubscribe_token)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(email) DO NOTHING`).bind(email, source, CONSENT, token).run()
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
