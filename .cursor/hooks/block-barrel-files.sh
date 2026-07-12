#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write): deny barrel files under src/ (except the templates barrel).

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

[ -z "$file" ] && exit 0

case "$file" in
  */src/templates/index.ts | src/templates/index.ts) exit 0 ;;
esac

if [[ ! "$file" =~ (^|/)src/(.*/)?index\.tsx?$ ]]; then
  exit 0
fi

reason="Blocked: no barrel files in scaffolded projects. Do not add index.ts/index.tsx that re-exports from other modules — import directly from the defining module. Kickoff's src/templates/index.ts is the only allowed barrel (template re-exports). Update getHandbookConventions in src/templates/docs.ts if needed."

deny_tool "$reason"
exit 0
