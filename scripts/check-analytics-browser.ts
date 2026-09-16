import { JSDOM } from 'jsdom'
import { strict as assert } from 'node:assert'
import type { AnalyticsEvent } from '@nick/analytics'

// Real React lifecycle/router/form handlers and shared SDK, with controlled
// geometry, observer delivery and network responses (no production requests).
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://physics.nicholasbardy.com/lesson/a' })
for (const key of ['window', 'document', 'location', 'navigator', 'Element', 'HTMLElement', 'Event', 'MouseEvent', 'FormData'] as const) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? dom.window : dom.window[key] })
}
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
Object.defineProperty(dom.window, 'innerHeight', { value: 1000, configurable: true })
let articleTop = 0
Object.defineProperty(dom.window.HTMLElement.prototype, 'scrollHeight', { get() { return this.tagName === 'ARTICLE' ? 5000 : 100 } })
dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
  return { top: articleTop, bottom: articleTop + 5000, left: 0, right: 800, width: 800, height: 5000, x: 0, y: articleTop, toJSON() {} }
}
class Observer {
  static all: Observer[] = []
  elements = new Set<Element>()
  constructor(private callback: (entries: IntersectionObserverEntry[]) => void) { Observer.all.push(this) }
  observe(element: Element) { this.elements.add(element) }
  disconnect() { this.elements.clear() }
  static reveal(placement: string) {
    for (const observer of Observer.all) for (const element of observer.elements) {
      if (element.getAttribute('data-analytics-placement') === placement) observer.callback([{ target: element, isIntersecting: true } as IntersectionObserverEntry])
    }
  }
}
Object.assign(globalThis, { IntersectionObserver: Observer })
let clipboardWorks = true
Object.defineProperty(dom.window.navigator, 'clipboard', { value: { writeText: async () => { if (!clipboardWorks) throw new Error('denied') } } })
const events: AnalyticsEvent[] = []
const submissions: Record<string, unknown>[] = []
let reply: ((response: Response) => void) | undefined
let rejectCollection = false
Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async (url: string, init: RequestInit) => {
  const body = JSON.parse(String(init.body))
  if (url.endsWith('/collect')) {
    events.push(body)
    if (rejectCollection) throw new Error('offline')
    return new Response(null, { status: 204 })
  }
  assert.ok(url.endsWith('/subscribe'))
  submissions.push(body)
  return new Promise<Response>(resolve => { reply = resolve })
} })
const { createElement: h, StrictMode, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { MemoryRouter, Link, useLocation, useNavigate } = await import('react-router-dom')
const { default: AnalyticsTracker } = await import('../src/analytics/Tracker')
const { default: NewsletterSignup } = await import('../src/components/NewsletterSignup')
const { tracker, getAnalyticsContext } = await import('../src/analytics/browser')
let navigate: ReturnType<typeof useNavigate>
function TestPage() {
  navigate = useNavigate()
  const { pathname } = useLocation()
  return h('main', null,
    h('article', null,
      h(NewsletterSignup, { key: `${pathname}-top`, placement: 'top' }),
      h(Link, { id: 'toc', to: `${pathname}#section` }, 'Section'),
      h(Link, { id: 'version', to: `${pathname}?v=II` }, 'Version II'),
      h('aside', { className: 'related-article' }, h(Link, { id: 'related', to: '/lesson/b#section' }, 'Related')),
    ),
    h(NewsletterSignup, { key: `${pathname}-bottom`, placement: 'bottom' }),
    h('footer', null, h('a', { id: 'feed', href: '/rss.xml', onClick: (event: { preventDefault(): void }) => event.preventDefault() }, 'RSS')),
  )
}
const root = createRoot(document.getElementById('root')!)
const wait = (ms = 140) => new Promise(resolve => setTimeout(resolve, ms))
const of = (name: string, pageId?: string) => events.filter(event => event.name === name && (!pageId || event.properties.pageId === pageId))
const click = async (selector: string) => { await act(async () => { document.querySelector(selector)!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); await wait(0) }) }
const move = async (path: string) => { await act(async () => { navigate(path); await wait(0) }) }
const reveal = async (placement: string) => { await act(async () => { Observer.reveal(placement); await wait(0) }) }
const submit = async (placement: string) => {
  await act(async () => {
    const form = document.querySelector<HTMLFormElement>(`form[data-analytics-placement="${placement}"]`)!
    form.querySelector<HTMLInputElement>('[name=email]')!.value = `${placement}@example.invalid`
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await wait(0)
  })
}
await act(async () => { root.render(h(StrictMode, null, h(MemoryRouter, { initialEntries: ['/lesson/a'], future: { v7_startTransition: true, v7_relativeSplatPath: true } }, h(AnalyticsTracker), h(TestPage)))) })
await act(async () => { await wait(); await tracker.flush() })
assert.equal(of('page_view').length, 1, 'StrictMode must not double-count arrival')
const first = getAnalyticsContext()!
assert.ok(first.visitorId && first.sessionId && first.pageId)
assert.deepEqual(of('scroll_depth', first.pageId).map(e => e.properties.percent), [10, 20], 'first viewport exposure')
await reveal('top'); await reveal('top')
assert.equal(of('newsletter_form_viewed', first.pageId).length, 1)
assert.equal(of('newsletter_form_viewed')[0].properties.placement, 'top')
await act(async () => { articleTop = -4000; window.dispatchEvent(new Event('scroll')); await wait() })
await act(async () => { articleTop = 0; window.dispatchEvent(new Event('scroll')); await wait() })
assert.deepEqual(of('scroll_depth', first.pageId).map(e => e.properties.percent), [10,20,30,40,50,60,70,80,90,100])
await reveal('bottom')
assert.deepEqual(of('newsletter_form_viewed', first.pageId).map(e => e.properties.placement), ['top', 'bottom'])
await click('#toc')
assert.equal(of('page_view').length, 1)
assert.equal(of('article_link_clicked').length, 0)
await click('#version')
await reveal('top'); await reveal('bottom')
const version = getAnalyticsContext()!
assert.notEqual(version.pageId, first.pageId)
assert.equal(of('page_view').length, 2)
assert.equal(of('page_view')[1].properties.version, 'II')
assert.equal(of('newsletter_form_viewed', version.pageId).length, 2, 'version route must re-arm both observers')
await submit('top')
assert.equal(submissions[0].placement, 'top')
assert.deepEqual(submissions[0].analytics, { visitorId: version.visitorId, sessionId: version.sessionId, pageId: version.pageId })
await click('#related')
const second = getAnalyticsContext()!
assert.equal(second.path, '/lesson/b')
assert.equal(second.visitorId, first.visitorId)
assert.equal(second.sessionId, first.sessionId)
assert.deepEqual(of('article_link_clicked').map(e => [e.path, e.properties.toPath, e.properties.placement, e.properties.pageId]), [['/lesson/a', '/lesson/b', 'related', version.pageId]])
await act(async () => { reply!(Response.json({ error: 'Try again' }, { status: 503 })); await wait(0) })
const failed = of('newsletter_signup_failed')[0]
assert.equal(failed.path, '/lesson/a', 'delayed failure stays on submission article')
assert.equal(failed.properties.pageId, version.pageId)
assert.equal(failed.properties.placement, 'top')
await submit('bottom')
await act(async () => { reply!(Response.json({ ok: true })); await wait(0) })
assert.equal(submissions[1].placement, 'bottom')
assert.ok(document.querySelector('form[data-analytics-placement="bottom"]')!.textContent!.includes('You’re on the list'))
assert.equal(of('newsletter_signup_completed').length, 0, 'only server can confirm a new subscription')
await click('form[data-analytics-placement="top"] .newsletter-rss-button')
assert.equal(of('rss_copy').length, 1)
clipboardWorks = false
await click('form[data-analytics-placement="top"] .newsletter-rss-button')
assert.equal(of('rss_copy').length, 1, 'failed clipboard operation is not a copy')
await click('#feed')
assert.equal(of('rss_open')[0].properties.placement, 'footer')
await move('/lesson/a')
const revisit = getAnalyticsContext()!
assert.notEqual(revisit.pageId, first.pageId)
assert.equal(revisit.visitorId, first.visitorId)
await reveal('top')
assert.equal(of('newsletter_form_viewed', revisit.pageId).length, 1)
const beforePrivacy = events.length
Object.defineProperty(dom.window.navigator, 'globalPrivacyControl', { value: true, configurable: true })
await move('/lesson/private')
await reveal('top')
await submit('top')
assert.equal(submissions[2].analytics, false, 'privacy opt-out must also reach signup API')
await act(async () => { reply!(Response.json({ ok: true })); await wait() })
assert.equal(events.length, beforePrivacy, 'GPC suppresses all browser analytics')
Object.defineProperty(dom.window.navigator, 'globalPrivacyControl', { value: false, configurable: true })
Object.defineProperty(dom.window.navigator, 'doNotTrack', { value: '1', configurable: true })
await move('/lesson/dnt')
await reveal('top')
assert.equal(events.length, beforePrivacy, 'DNT suppresses events')
Object.defineProperty(dom.window.navigator, 'doNotTrack', { value: '0', configurable: true })
rejectCollection = true
await move('/lesson/offline')
await submit('top')
await act(async () => { reply!(Response.json({ ok: true })); await wait() })
assert.ok(document.querySelector('form[data-analytics-placement="top"]')!.textContent!.includes('You’re on the list'), 'failed analytics cannot prevent signup')
assert.ok(!JSON.stringify(events).includes('example.invalid'), 'email must never enter analytics')
assert.ok(events.every(event => !('visitorId' in event.properties) && !('sessionId' in event.properties)))
await act(async () => { root.unmount() })
dom.window.close()
console.log('Analytics browser: StrictMode, 10–100% depth, revisit/version/hash, both placements, captured async attribution, link flow, RSS, privacy, and offline signup passed.')
