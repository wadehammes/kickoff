#!/usr/bin/env bash
set -euo pipefail

# postToolUse (Write|StrReplace): remind to update kickoff README.md when tool-facing files change.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

section=""
case "$file" in
  README.md | */README.md) exit 0 ;;
  src/index.ts | */src/index.ts)
    section="Usage (interactive prompts), Non-interactive (--answers JSON), CLI flags" ;;
  src/types.ts | */src/types.ts | src/validateAnswers.ts | */src/validateAnswers.ts)
    section="Non-interactive answers example (ProjectAnswers keys and validation)" ;;
  src/generator.ts | */src/generator.ts)
    section="Generated project structure tree and scaffold notes" ;;
  src/templates/agents.ts | */src/templates/agents.ts)
    section="Optional add-ons (Agent hooks), generated .cursor/.claude note" ;;
  src/templates/config.ts | */src/templates/config.ts)
    section="Stack table (versions, TS pin), generated config filenames in structure tree" ;;
  src/verifyScaffoldE2e.ts | */src/verifyScaffoldE2e.ts | fixtures/scaffold-e2e/* | */fixtures/scaffold-e2e/*)
    section="Developing kickoff (test:scaffold-e2e), CI scaffold-e2e job, fixture list" ;;
  package.json | */package.json)
    section="Developing kickoff scripts table, Installation test commands" ;;
  .github/workflows/ci.yml | */.github/workflows/ci.yml)
    section="Developing kickoff CI, CI/CD (This repo)" ;;
  src/templates/docs.ts | */src/templates/docs.ts) exit 0 ;;
  src/templates/*.ts | */src/templates/*.ts)
    section="Generated project structure (if scaffold paths or outputs changed)" ;;
  *)
    exit 0 ;;
esac

ctx="README-sync check: you just edited $file. If this change shifts kickoff behavior, CLI prompts, scripts, CI, or generated scaffold layout, update root README.md ($section) in the same change."

advise_context "$ctx"
exit 0
