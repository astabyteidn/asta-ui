#!/usr/bin/env bash
# Print the CHANGELOG.md section for one version, for the GitHub Release body.
# Usage: scripts/release-notes.sh 0.7.0
set -euo pipefail
v="${1#v}"
notes=$(awk -v v="$v" '
  /^## / { if (found) exit; if ($2 == v) { found = 1; next } }
  found { print }
' CHANGELOG.md | sed -e '/./,$!d')
if [ -z "$notes" ]; then echo "No CHANGELOG.md entry for $v" >&2; exit 1; fi
printf '%s\n\n---\n\n' "$notes"
links="Docs: [ui.astabyte.com](https://ui.astabyte.com) · [Full changelog](https://github.com/astabyteidn/asta-ui/blob/v$v/CHANGELOG.md)"
if curl -sf -o /dev/null "https://registry.npmjs.org/asta-ui/$v"; then links="npm: [asta-ui@$v](https://www.npmjs.com/package/asta-ui/v/$v) · $links"; fi
printf '%s\n' "$links"
