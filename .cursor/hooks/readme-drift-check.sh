#!/usr/bin/env bash
set -euo pipefail

# stop: if the session changed README-relevant files but not README.md,
# follow up once. loop_count prevents repeat loops.

input="$(cat)"
loop_count="$(printf '%s' "$input" | jq -r '.loop_count // 0')"

if [ "$loop_count" -ge 1 ]; then
  exit 0
fi

root="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$root" ] && cd "$root"

changed="$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null || true)"

readme_triggers="$(printf '%s\n' "$changed" | grep -E '^src/index\.ts$|^src/types\.ts$|^src/validateAnswers\.ts$|^src/generator\.ts$|^src/verifyScaffoldE2e\.ts$|^src/templates/agents\.ts$|^src/templates/config\.ts$|^package\.json$|^\.github/workflows/ci\.yml$|^fixtures/scaffold-e2e/|^src/templates/.+\.ts$' | grep -v '^src/templates/docs\.ts$' || true)"
readme_changed="$(printf '%s\n' "$changed" | grep -E '^README\.md$' || true)"

if [ -n "$readme_triggers" ] && [ -z "$readme_changed" ]; then
  reason="$(printf 'README-drift check: this session changed kickoff behavior or scaffold outputs but not README.md. If prompts, ProjectAnswers, scripts, CI, stack versions, agent hooks, fixtures, or generated structure changed, update root README.md now. If nothing user-facing changed, reply that README is still accurate.\n\nChanged files:\n%s' "$readme_triggers")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

exit 0
