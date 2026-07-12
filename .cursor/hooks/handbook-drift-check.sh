#!/usr/bin/env bash
set -euo pipefail

# stop: if the session changed templates or generator but not docs.ts / AGENTS.md,
# follow up once to prompt a handbook check. loop_count prevents repeat loops.

input="$(cat)"
loop_count="$(printf '%s' "$input" | jq -r '.loop_count // 0')"

if [ "$loop_count" -ge 1 ]; then
  exit 0
fi

root="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$root" ] && cd "$root"

changed="$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null || true)"

template_changed="$(printf '%s\n' "$changed" | grep -E '^src/templates/.+\.ts$' | grep -v '^src/templates/docs\.ts$' || true)"
generator_changed="$(printf '%s\n' "$changed" | grep -E '^src/generator\.ts$' || true)"
docs_changed="$(printf '%s\n' "$changed" | grep -E '^src/templates/docs\.ts$|^AGENTS\.md$|^CLAUDE\.md$' || true)"

code_changed=""
[ -n "$template_changed" ] && code_changed="$template_changed"
[ -n "$generator_changed" ] && code_changed="${code_changed}${code_changed:+$'\n'}$generator_changed"

if [ -n "$code_changed" ] && [ -z "$docs_changed" ]; then
  reason="$(printf 'Handbook-drift check: this session changed scaffold templates or generator.ts but not src/templates/docs.ts or AGENTS.md. If any change shifted documented behavior or conventions, update the matching getHandbook* chapter in docs.ts (and AGENTS.md if agent instructions changed) now. If nothing documented changed, reply that the handbook is still accurate.\n\nChanged files:\n%s' "$code_changed")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

exit 0
