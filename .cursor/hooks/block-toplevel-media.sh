#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write|StrReplace): deny top-level @media blocks in CSS (or CSS template strings).

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.css) ;;
  *)
    is_template_css_file "$file" || exit 0
    ;;
esac

added="$(tool_added_text)"

violations="$(printf '%s\n' "$added" | grep -nE '^@media' || true)"

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked: this edit adds a top-level @media block. Scaffolded CSS convention is mobile-first base styles with @media (width >= 800px/1120px) nested INSIDE each selector, not top-level @media blocks that group selectors. Move each media query inside the rule it modifies. Update getHandbookConventions in src/templates/docs.ts if needed.\n\nOffending lines:\n%s' "$violations")"
  deny_tool "$reason"
fi

exit 0
