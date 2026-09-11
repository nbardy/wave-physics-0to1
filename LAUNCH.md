# Domain and email launch — 2026-09-10

Target address: **https://math.nicholasbardy.com/**, a subdomain of Nick's
existing domain. No separate domain purchase is needed.

## Verified state

- `nicholasbardy.com` uses Cloudflare nameservers (`alexis` and `crystal`).
- Public DNS returns NXDOMAIN for `math.nicholasbardy.com` (A and CNAME).
- GitHub Pages reports `cname: null`, serving `gh-pages` at
  https://nbardy.github.io/wave-physics-0to1/ with HTTPS enforced.
- No subscription form or newsletter service is configured in this repository.
- Cloudflare's browser session requires sign-in. The local Wrangler credential
  has no DNS-edit scope.

## Prepared in this pass

Vite now reads `public/CNAME`: when present, the GitHub Pages build uses `/`
for assets and navigation and copies the domain file into the deployment.
Without that file, the existing project URL still works. Both modes retain
the `404.html` fallback used for direct article links.

The deploy script refuses to erase a domain already present on `gh-pages`
when its source copy is missing. Its completion message prints the configured
address. **No domain file has been activated and no deployment has run.**

Validation passed: TypeScript, shell syntax, and two isolated production builds
(project path and custom domain). Each build's actual HTML asset paths,
`404.html`, and domain-file presence were checked.

## Finish the domain

1. Sign in to Cloudflare and confirm access to the `nicholasbardy.com` zone.
2. Add `public/CNAME` containing `math.nicholasbardy.com` on one line. Build
   with `GITHUB_PAGES=true`; check `/assets/` paths, `CNAME`, and `404.html`.
3. Set the repository's GitHub Pages custom domain to
   `math.nicholasbardy.com`, then ship the prepared root-path build.
   Review the shared working tree first: another task has uncommitted
   lesson-03, simulation, stylesheet, package, and methodology changes.
4. Create Cloudflare DNS record: **CNAME**, name **math**, target
   **nbardy.github.io**, **DNS only**, TTL **Auto**. The target contains
   neither a protocol nor the repository path.
5. Once GitHub provisions the certificate, verify HTTPS enforcement, homepage,
   direct article reloads, assets, and redirects from the old project URL.

GitHub's [custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
require adding the domain to the repository before pointing DNS at it.

## Finish the email list

Provider is awaiting Nick's choice. Proposed: Buttondown, with a signup after
each article and on the home page, for announcements of new lessons.
Its [pricing](https://buttondown.com/pricing) currently includes the first 100
subscribers free; paid tiers need a separate choice when relevant.

1. Use Nick's existing newsletter account if there is one, or finish account
   creation for the chosen provider.
2. Record the real list/form URL; use the provider's subscription flow so
   confirmation and unsubscribe are handled there. No private API key belongs
   in the static site's JavaScript.
3. Add the form using the site's typography. Suggested copy: **New lessons,
   by email.** “I'll email you when I publish a new lesson.” Button: **Subscribe**.
4. Configure and verify the sender identity; add only the provider's actual
   DNS records if sending from Nick's domain.
5. With Nick's authorization, test signup and confirmation using his address,
   confirm the subscriber appears in the provider, and test unsubscribe.
   Do not announce the launch to the list as part of setup.

Buttondown supports a [standard HTML subscription form](https://docs.buttondown.com/building-your-subscriber-base),
which fits the existing static hosting.
