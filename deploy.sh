#!/bin/bash
# Build the portfolio and publish it to https://oli.show via the box (replaces
# the FTP GitHub Action). Assets first, index.html last, so new asset URLs only
# appear once their files are complete. Usage: ./deploy.sh [--dry-run]
set -euo pipefail
cd "$(dirname "$0")"
yarn install --frozen-lockfile
yarn run build
yarn run generate-sitemap
yarn run generate-static
v=$(git rev-parse --short=8 HEAD)
stage=$(mktemp -d); trap 'rm -rf "$stage"' EXIT
cp -r static projects.html sitemap.txt robots.txt LICENSE.txt "$stage/"
# New asset URLs on every deploy, so neither browsers nor caches reuse old copies.
sed "s|static/bundle.js|static/bundle.js?v=$v|; s|static/index.css|static/index.css?v=$v|" index.html > "$stage/index.html"
cd "$stage"
if [ "${1:-}" = --dry-run ]; then find . -type f | sort; echo "would run: box site - <assets>, then box site - index.html"; exit 0; fi
~/Code/infra/box site - static projects.html sitemap.txt robots.txt LICENSE.txt
~/Code/infra/box site - index.html
