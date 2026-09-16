import { createEvent, normalizePath, type Properties } from '@nick/analytics'
import { createBrowserTracker } from '@nick/analytics/browser'
import { createHttpTransport } from '@nick/analytics/transport'

export type SignupPlacement = 'top' | 'bottom'
export type AnalyticsContext = {
  visitorId: string; sessionId: string; pageId: string; path: string; version?: string
}
type PageVisit = { key: string; pageId: string; path: string; version?: string; seen: Set<string> }

const endpoint = import.meta.env.VITE_NEWSLETTER_API_URL
  ?? 'https://visual-explainers-newsletter.nicholasbardy.workers.dev'
const transport = createHttpTransport({ endpoint: `${endpoint}/collect` })
export const tracker = createBrowserTracker({
  siteId: 'visual-explainers', transport,
  enabled: () => !import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_DEV === 'true',
  allowLocalhost: import.meta.env.VITE_ANALYTICS_DEV === 'true',
})

let visit: PageVisit | undefined
export function beginPage(path: string) {
  // Hashes and campaign/query noise do not create a second article visit.
  const key = normalizePath(path, ['v'])
  if (visit?.key === key) return visit
  const version = new URL(path, 'https://analytics.invalid').searchParams.get('v')?.slice(0, 32)
  visit = { key, pageId: crypto.randomUUID(), path: normalizePath(path), ...(version ? { version } : {}), seen: new Set() }
  void tracker.page(visit.path, { pageId: visit.pageId, ...(version ? { version } : {}) })
  return visit
}

export function getAnalyticsContext(): AnalyticsContext | null {
  const ids = tracker.context()
  return ids && visit ? { visitorId: ids.visitorId, sessionId: ids.sessionId,
    pageId: visit.pageId, path: visit.path, ...(visit.version ? { version: visit.version } : {}) } : null
}

// Capture identity and path before awaiting an app operation. A later route change
// must not attribute its result to the next article. The shared core/transport still
// own the event protocol, delivery and acknowledgement; the SDK owns privacy/IDs.
export async function trackEvent(name: string, properties: Properties = {}, context = getAnalyticsContext()) {
  if (!context || !tracker.context()) return
  try {
    await transport.send(createEvent({ siteId: 'visual-explainers', kind: 'event', name,
      visitorId: context.visitorId, sessionId: context.sessionId, path: context.path,
      properties: { ...properties, pageId: context.pageId, ...(context.version ? { version: context.version } : {}) },
    }))
  } catch { /* Analytics is best effort and must never interrupt reading or signup. */ }
}

export function trackOnce(name: string, key: string, properties: Properties = {}) {
  if (!visit || visit.seen.has(key) || !getAnalyticsContext()) return
  visit.seen.add(key)
  void trackEvent(name, properties)
}
