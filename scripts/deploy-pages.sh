#!/usr/bin/env bash
# Build the site and publish it to the gh-pages branch.
#
# dist/ is gitignored on main, so the build output is staged through a throwaway
# worktree checked out to gh-pages. That keeps main's history free of bundles
# while leaving gh-pages a normal branch with normal history (no force-push).
set -euo pipefail

cd "$(dirname "$0")/.."
WORKTREE=.gh-pages-deploy

# Refuse to erase a domain added through GitHub's settings. Keep it in
# public/CNAME so Vite preserves it and builds assets for the domain's root.
git fetch origin gh-pages
REMOTE_DOMAIN=$(git show origin/gh-pages:CNAME 2>/dev/null || true)
if [[ -n "$REMOTE_DOMAIN" && ! -s public/CNAME ]]; then
  echo "GitHub Pages uses $REMOTE_DOMAIN, but public/CNAME is missing."
  echo "Add that domain to public/CNAME before deploying."
  exit 1
fi

# GITHUB_PAGES emits the 404.html SPA fallback; public/CNAME decides whether
# assets use the custom domain's root or the default /<repo>/ path.
GITHUB_PAGES=true bun run build

SHA=$(git rev-parse --short HEAD)

git worktree add --force "$WORKTREE" gh-pages
trap 'git worktree remove --force "$WORKTREE" 2>/dev/null || true' EXIT

rsync -a --delete --exclude .git "dist/" "$WORKTREE/"

# Vite never emits .nojekyll, but --delete above would drop it. Without it
# GitHub runs the build through Jekyll, which refuses to publish paths starting
# with an underscore. Recreate it every deploy.
touch "$WORKTREE/.nojekyll"

git -C "$WORKTREE" add -A
if git -C "$WORKTREE" diff --cached --quiet; then
  echo "No change in build output — nothing to deploy."
  exit 0
fi

git -C "$WORKTREE" commit -m "Deploy site (main@${SHA})"
git -C "$WORKTREE" push origin gh-pages
if [[ -s dist/CNAME ]]; then
  DOMAIN=$(tr -d '\r\n' < dist/CNAME)
  echo "Deployed main@${SHA} → https://${DOMAIN}/"
else
  echo "Deployed main@${SHA} → https://nbardy.github.io/wave-physics-0to1/"
fi
