#!/usr/bin/env bash
set -euo pipefail

# sessionStart: inject kickoff agent instructions once per composer session.

root="$(pwd)"
map_file="$root/AGENTS.md"
[ -f "$map_file" ] || map_file="$root/CLAUDE.md"

[ -f "$map_file" ] || exit 0

map_content="$(<"$map_file")"
map_name="$(basename "$map_file")"

jq -n --arg map "$map_content" --arg name "$map_name" '{
  additional_context: (
    "Kickoff agent instructions — read before substantive edits (from " + $name + "). "
    + "Templates (src/templates/*.ts) and handbook (src/templates/docs.ts) must stay in sync.\n\n"
    + $map
  )
}'

exit 0
