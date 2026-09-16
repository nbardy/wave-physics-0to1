# Blog analytics and subscriptions

The blog uses the same `@nick/analytics@0.3.0` package as Magic Genie and EventMap.
The vendored artifact is `vendor/nick-analytics-0.3.0.tgz`; SHA-256:
`c48eb6c1aa2ee0a2f6a508f79a878c18d5fd6b1600fda7fb38dd2ed1cb01f4a6`.
The browser SDK owns visitor/session IDs and privacy checks. Its core and HTTP
transport also create and send events for app operations whose attribution must
survive navigation. The blog owns its scroll/form/link vocabulary and reports.

## What is measured

| Event | Meaning | Dimensions |
| --- | --- | --- |
| `page_view` | Arrival or navigation to a different page/version | path, pageId, optional version |
| `scroll_depth` | Article exposed through 10%, 20%, …, 100% of its height | path, pageId, percent, optional version |
| `newsletter_form_viewed` | Signup box enters the viewport | path, pageId, top/bottom |
| `newsletter_signup_started` | Valid form submitted | path, pageId, top/bottom |
| `newsletter_signup_failed` | Submission failed | original path/pageId, top/bottom |
| `newsletter_signup_completed` | Server inserted a new subscriber | original path/pageId, top/bottom |
| `article_link_clicked` | Click to another article | fromPath, toPath, pageId, related/series/nav/list/inline |
| `rss_copy` | Feed URL successfully copied | path, pageId, top/bottom |
| `rss_open` | Feed link clicked | path, pageId, top/bottom/footer/link |

Each arrival gets a random `pageId`; returning to the same article after another
page gets a new one. React StrictMode does not duplicate arrivals, form views, or
scroll milestones. Hash links and query noise do not count as new pages; changing
`?v=` does. Article links exclude same-article headings and version switches.

Depth measures viewport exposure, including the first screen and restored scroll
positions. It cannot establish whether someone read the words. Milestones and
form impressions are counted once per page visit, even after scrolling back.
RSS clicks/copies measure interest, not confirmed RSS subscriptions.

Unique visitors are anonymous browser profiles: a random UUID in localStorage,
scoped to this site and origin. Sessions use sessionStorage with 30-minute
inactivity expiry. These are not hardware/machine IDs or verified people.
Different browsers/devices, private windows, clearing storage, and storage blocking
can split one person into multiple visitors. No fingerprint is taken. DNT and GPC
suppress browser analytics and attributed signup analytics. Analytics payloads do
not contain email addresses, unsubscribe tokens, or IP addresses. Known crawler
user agents are marked and excluded from normal reports; bot detection is not perfect.

Delivery is best effort using fetch keepalive. Network failures, blockers and
privacy choices cause undercounting. Signup collection works even when browser
analytics is unavailable. A new subscriber and its server conversion are written
atomically; repeat signups and existing opt-outs do not create another conversion.
An identical public success response prevents revealing list membership. Older
cached clients may create server conversions without browser attribution.

## Reading reports

Run from this repository. `scripts/analytics.ts` uses `ANALYTICS_READ_TOKEN` from
the environment or ignored `workers/newsletter/.dev.vars`; never put that token
in a Vite variable or browser bundle. The read endpoint fails closed without it.

```sh
bun run analytics -- --report stats --days 7
bun run analytics -- --report reading --days 7
bun run analytics -- --report flows --days 7
bun run analytics -- --report funnel --days 30 --steps '[{"name":"page_view"},{"name":"newsletter_signup_completed","source":"server"}]'
```

`stats` gives pageviews, visitors and sessions. `reading` gives per-page depth,
form exposures, attempts, failures, confirmed signups, article links and RSS
activity, with placement where applicable. These arrays are independent aggregates;
dividing them is a descriptive rate, not a strict ordered cohort. `funnel` computes
an ordered visitor/session funnel within its attribution window (default seven
days); recent cohorts may still be incomplete. Do not model 10%→20% using repeated
`scroll_depth` names: the shared funnel filter does not filter JSON properties.
Use the depth breakdown for those milestones.

The same authenticated `/reports` JSON API and CLI can be read by agents. This
blog deployment does not expose a separate MCP endpoint or a graphical dashboard.

## Newsletter and RSS

The top and bottom forms collect addresses in the existing Cloudflare D1 list.
`https://physics.nicholasbardy.com/rss.xml` is generated from published lessons;
feed generation and publication checks run with the build. Unsubscribe links
require an explicit POST; link scanners cannot unsubscribe someone by opening a URL.

**New-article email delivery is not implemented.** Collection, deduplication and
unsubscribe handling work; publishing an article does not yet send an email.
The feed works independently of email delivery.

## Operating the Worker

Worker: `visual-explainers-newsletter`; D1: same name.
The additive `0002_analytics.sql` migration creates the shared canonical analytics
table without altering subscribers. `/collect` has its own 120 requests/minute/IP
limit; signup remains 10/minute/IP. Cloudflare limits are per edge location.
`/reports` requires the read token and returns non-cacheable responses.

```sh
bun run check:analytics
bun run check:newsletter
bun run typecheck
bun run typecheck:newsletter
bun run build
```

Local browser analytics is disabled by default. To test locally, set
`VITE_ANALYTICS_DEV=true` and `VITE_NEWSLETTER_API_URL` to a local Worker configured
with the local origin; do not send development fixtures to production.

Deploy the Worker using `workers/newsletter/wrangler.jsonc`. Deploy static assets
using the Namesake hosting procedure in `LAUNCH.md`, from a committed source
revision. The analytics release branches from the recorded live revision so
uncommitted article and simulation work does not enter this release.
