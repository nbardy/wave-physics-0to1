#!/usr/bin/env bash
# Ship the working tree in one command: commit + push main, then build and
# publish the gh-pages branch. Whatever is in the working tree is what ships
# (there is no CI), so the changed-file list below is the last look before
# it all goes public.
#
# Usage: bash scripts/ship.sh ["commit message"]
set -euo pipefail

cd "$(dirname "$0")/.."
MSG="${1:-Ship working tree $(date -u +%Y-%m-%dT%H:%M:%SZ)}"

git add -A
echo "--- shipping tree ---"
git status --short
if git diff --cached --quiet; then
  echo "Nothing new for main — deploying current HEAD."
else
  git commit -m "$MSG"
fi
git push origin main
bash scripts/deploy-pages.sh
