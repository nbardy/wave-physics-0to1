# Domain and email launch — 2026-09-11

Final address: **https://physics.nicholasbardy.com/**. This uses Nick’s existing
`nicholasbardy.com` domain; no separate purchase is needed. The earlier
`math.nicholasbardy.com` proposal was superseded by Nick’s September 10 choice.

## Hosting

Cloudflare Workers Static Assets serves the site with HTTPS. Its configuration
and committed-source build live in the sibling Namesake repository at
`hosting/physics/`. GitHub Pages is the older secondary address, not the host
behind the physics domain. `/build-info.json` identifies the deployed source.

To release a committed, reviewed source revision:

```sh
cd ../namesake/hosting/physics
PHYSICS_SOURCE_REF=<commit> bunx wrangler deploy --config wrangler.jsonc
```

Set `PHYSICS_SOURCE_REPO` to use an isolated checkout. This is the safe release
path while other tasks are editing articles in the shared source tree.

## Newsletter collection

Nick chose an owned Cloudflare Worker + D1 list on September 11, replacing the
Substack signup handoff. Buttondown is not required. Existing Substack
subscribers have not been imported, and no announcement has been sent.

- Worker: `visual-explainers-newsletter`
- API: `https://visual-explainers-newsletter.nicholasbardy.workers.dev`
- D1: `visual-explainers-newsletter` (`57cce9ea-ed30-4a0d-ab38-ae29239105cd`)
- Configuration and migration: `workers/newsletter/`
- `POST /subscribe`: JSON `{email, source, consent: true, website: ""}`; requests
  come from the allowed site origins. `website` is an empty honeypot field.
- `GET /health`: verifies the database is reachable.
- `GET /unsubscribe?token=...`: confirmation page; POST to the same URL opts out.
  Merely opening a link does not unsubscribe someone.

The endpoint validates and normalizes addresses, prevents duplicates, limits
signup bursts, bounds request bodies, and stores consent copy, source article,
and signup time. It stores no IP addresses. The list and unsubscribe tokens
have no public read endpoint. Previously opted-out addresses remain suppressed;
restoring one requires the owner to verify the subscriber’s request.

```sh
bun run check:newsletter
bun run typecheck:newsletter
bunx wrangler d1 migrations apply visual-explainers-newsletter --remote --config workers/newsletter/wrangler.jsonc
bun run deploy:newsletter
```

Read or export the list only through authenticated D1 access. A future sender
must select rows with `unsubscribed_at IS NULL`, include each row’s tokenized
unsubscribe link, and re-check suppression before delivery. **This release
collects subscribers; email delivery and new-article campaigns are not
implemented.** A verified sending service is the remaining work before sending
announcements. There is no confirmation email in the collection-only flow.

## Shared article template and RSS

Every page uses `NewsletterSignup`, with the copy
“Get emailed every new visual explainer” in a light-blue box. `NewsletterIntro`
places the first box below the page heading or introductory header. Articles use
MDX’s shared `LessonTitle` mapping, so their title appears before the box.
`Layout` adds the second box at the end of every page. The email button says “Sign up”; the
RSS icon button copies the canonical feed URL and confirms the copy. If the
browser blocks clipboard access, a selectable URL appears for manual copying.
Both paths also offer an “Open feed” link. `/subscribe` leads to the homepage form. The two Navier–Stokes articles have
reciprocal light-blue related-reading cards. Every thermodynamic-computing
part has “Check out the whole series →” above its title.

`/rss.xml` is generated from published entries in `src/lessons/registry.ts`
at build time. Stable article URLs are the item IDs; draft lessons are excluded.
Signup boxes, the site footer, and HTML autodiscovery all link to the feed.

## Verification

September 15 analytics release: live source
`1c1c7d4171212d42324d6c5f723bb9cb7acbb29c` on
`codex/blog-funnel-analytics`, based on the previously live `c9b91d6`.
Static Worker version `1e3346eb-c894-4ca3-bcc6-84674db2423f`;
newsletter Worker version `7392903d-8847-4f23-810c-bbb3eb796303`.
The additive D1 analytics migration is applied and the private report token
is configured. Event definitions, read commands and measurement limits live
in [ANALYTICS.md](ANALYTICS.md).

The isolated release passed frontend and Worker TypeScript, production build,
React lifecycle tests, and Worker/D1/RSS integration tests. Live Chrome checks
confirmed 10%–100% scroll milestones, both signup placements with server
confirmation, RSS copying, article-link attribution, ordered page flows, and
one visitor surviving reload. RSS returned four published entries; reports
returned 403 without authentication. The two synthetic `.invalid` subscribers
and their browser's analytics records were removed after verification.
Email delivery remains unimplemented.

TypeScript, production build, and the local Worker/D1 integration checks pass.
The deployed API passed signup, duplicate, persistence, and unsubscribe checks
with a disposable address; the exact test row was removed. No email was sent.
The release uses the previously live article revision plus these launch changes,
so ongoing article and simulation edits are not included.

Live release verification: site source `e8b391f6c23b9012b996fb0ac419fac52326b33a`
(on `codex/newsletter-rss-launch`), static Worker version
`18522dda-b1fa-41a9-8502-e3031f079e2f`, newsletter Worker version
`ad01b8aa-e842-4dc3-ae24-9a856e3ad08d`. The live form succeeded in Chrome and
the exact D1 row contained the article route and consent text. RSS returned
HTTP 200 with `application/rss+xml` and four published entries. `/subscribe`
redirected to `/#newsletter`. The light-blue forms and related cards passed
desktop and 390px mobile review; the series banner stacks on narrow screens.
Hosting redirect/docs are committed in Namesake as `3cbb8fb`.

September 11 follow-up: “Sign up” and an RSS icon button now share the controls
row. `Layout` owns both placements on every route. Verified exactly two forms
on the homepage, index, series, article, and stack-check pages; desktop and
390px layouts; RSS copy without email validation; and the selectable URL
fallback with clipboard rejection simulated in a local fixture. Production
build and TypeScript checks passed.

Follow-up deployed from `5caba995cdd3f0cc8787b3fa52d5adc1e5a38078`, static Worker
version `e9403aa7-dd95-4101-84e0-e475ef2c84dc`. Live index and article placements
and RSS copy confirmation verified in Chrome.

Opening placement restored below headings/introductory headers in `c9b91d6`
(static Worker `ca8f77e7-b902-4b18-b037-7d9cc35b14ce`). Two forms per page and
heading-first order verified across page types; live article order checked.
