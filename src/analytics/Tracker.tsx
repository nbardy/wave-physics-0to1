import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { normalizePath } from '@nick/analytics'
import { beginPage, trackEvent, trackOnce } from './browser'

export default function AnalyticsTracker() {
  const { pathname, search } = useLocation()
  useLayoutEffect(() => {
    beginPage(`${pathname}${search}`)
    let timer: number | undefined
    const measure = () => {
      if (timer !== undefined) return
      timer = window.setTimeout(() => {
        timer = undefined
        const article = document.querySelector('article') ?? document.querySelector('main')
        if (!article) return
        const rect = article.getBoundingClientRect()
        const height = Math.max(rect.height, article.scrollHeight)
        if (height <= 0) return
        // Furthest article depth exposed in the viewport, including the first screen.
        // This records exposure, not proof that the reader read the text.
        const percent = Math.min(100, Math.floor(Math.max(0, window.innerHeight - rect.top) / height * 10) * 10)
        for (let next = 10; next <= percent; next += 10) {
          trackOnce('scroll_depth', `depth:${next}`, { percent: next })
        }
      }, 100)
    }
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return
      const element = event.target instanceof Element ? event.target : null
      const anchor = element?.closest('a')
      if (!anchor?.href) return
      const target = new URL(anchor.href, window.location.href)
      const explicit = anchor.closest('[data-analytics-placement]')?.getAttribute('data-analytics-placement')
      if (target.href === 'https://physics.nicholasbardy.com/rss.xml'
        || (target.origin === window.location.origin && target.pathname.endsWith('/rss.xml'))) {
        void trackEvent('rss_open', { placement: explicit ?? (anchor.closest('footer') ? 'footer' : 'link') })
        return
      }
      if (target.origin !== window.location.origin) return
      const currentLesson = pathname.match(/^\/lesson\/[^/]+/)?.[0]
      const targetLesson = target.pathname.match(/^\/lesson\/[^/]+/)?.[0]
      if (!targetLesson || targetLesson === currentLesson) return
      const placement = explicit ?? (anchor.closest('.related-article') ? 'related'
        : anchor.closest('.series-next,.series-banner') ? 'series'
        : anchor.closest('nav,header') ? 'nav' : anchor.closest('ul,ol') ? 'list' : 'inline')
      void trackEvent('article_link_clicked', { fromPath: normalizePath(pathname), toPath: normalizePath(target.pathname), placement })
    }
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    // Capture before React Router updates the route and its analytics context.
    document.addEventListener('click', onClick, true)
    const article = document.querySelector('article') ?? document.querySelector('main')
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : undefined
    if (article) observer?.observe(article)
    measure()
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      document.removeEventListener('click', onClick, true)
      observer?.disconnect()
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [pathname, search])
  return null
}
