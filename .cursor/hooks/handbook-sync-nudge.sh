#!/usr/bin/env bash
set -euo pipefail

# postToolUse (Write|StrReplace): remind to update the matching handbook chapter in docs.ts.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

chapter=""
case "$file" in
  src/templates/docs.ts | */src/templates/docs.ts) exit 0 ;;
  src/templates/app.ts | */src/templates/app.ts | src/templates/i18n.ts | */src/templates/i18n.ts)
    chapter="getHandbookArchitecture, getHandbookPatterns (and getHandbookContentful if routes touch CMS)" ;;
  src/templates/components.ts | */src/templates/components.ts)
    chapter="getHandbookComponents, getHandbookConventions (CSS)" ;;
  src/templates/contentful.ts | */src/templates/contentful.ts)
    chapter="getHandbookContentful" ;;
  src/templates/styles.ts | */src/templates/styles.ts)
    chapter="getHandbookConventions (CSS)" ;;
  src/templates/testing.ts | */src/templates/testing.ts)
    chapter="getHandbookConventions (testing), getHandbookComponents (factories)" ;;
  src/templates/config.ts | */src/templates/config.ts | src/templates/scripts.ts | */src/templates/scripts.ts | src/templates/github.ts | */src/templates/github.ts | src/templates/next.ts | */src/templates/next.ts | src/templates/public.ts | */src/templates/public.ts)
    chapter="getHandbookPlatform, getReadme" ;;
  src/templates/utils.ts | */src/templates/utils.ts | src/templates/lib.ts | */src/templates/lib.ts | src/templates/api.ts | */src/templates/api.ts | src/templates/types.ts | */src/templates/types.ts)
    chapter="getHandbookSourceLayout, getHandbookConventions" ;;
  src/generator.ts | */src/generator.ts)
    chapter="getHandbookSourceLayout, getHandbookArchitecture (if scaffold file list changed)" ;;
  src/templates/*.ts | */src/templates/*.ts)
    chapter="the matching getHandbook* getter in docs.ts" ;;
  *)
    exit 0 ;;
esac

ctx="Handbook-sync check: you just edited $file. If this change shifts documented behavior or conventions, update src/templates/docs.ts ($chapter) in the same change so the generated handbook stays accurate."

advise_context "$ctx"
exit 0
