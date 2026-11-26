import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ProjectAnswers } from "../types.js";
import { getBaseBranch } from "./config.js";
import { getHandbookChangePolicy } from "./docs.js";

const scaffoldAssetsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../scaffold-assets",
);
const cursorHooksAssetDir = path.join(scaffoldAssetsDir, "cursor-hooks");
const cursorHooksExtraDir = path.join(scaffoldAssetsDir, "cursor-hooks-extra");
const claudeHooksAssetDir = path.join(scaffoldAssetsDir, "claude-hooks");

const readScaffoldAsset = (dir: string, name: string): string =>
  readFileSync(path.join(dir, name), "utf8");

export const AGENT_HOOK_SCRIPT_NAMES = [
  "session-handbook-routing.sh",
  "block-added-comments.sh",
  "block-toplevel-media.sh",
  "block-custom-media.sh",
  "block-margin-top.sh",
  "block-placeholder-names.sh",
  "enforce-scaffold.sh",
  "block-barrel-files.sh",
  "enforce-factory-location.sh",
  "handbook-sync-nudge.sh",
  "check-css-nesting.sh",
  "handbook-drift-check.sh",
] as const;

export const CLAUDE_ONLY_HOOK_SCRIPT_NAMES = [
  "block-destructive-git.sh",
  "block-co-authored-by-commit.sh",
  "block-generated-types.sh",
] as const;

export const CURSOR_EXTRA_HOOK_SCRIPT_NAMES = [
  "block-query-hook-mocks.sh",
  "enforce-handbook-edit.sh",
  "lint-all-check.sh",
  "handbook-test-drift-check.sh",
  "session-stop-checks.sh",
  "block-destructive-git.sh",
  "block-co-authored-by-commit.sh",
] as const;

export const getClaudeHookScriptNames = (a: ProjectAnswers): string[] => [
  ...AGENT_HOOK_SCRIPT_NAMES.filter(
    (name) => name !== "handbook-drift-check.sh",
  ),
  ...CLAUDE_ONLY_HOOK_SCRIPT_NAMES.filter(
    (name) => name !== "block-generated-types.sh" || a.includeContentful,
  ),
];

export const getCursorHookScriptNames = (a: ProjectAnswers): string[] => [
  ...AGENT_HOOK_SCRIPT_NAMES,
  ...CURSOR_EXTRA_HOOK_SCRIPT_NAMES,
  ...(a.includeContentful ? ["block-generated-types.sh"] : []),
];

export const getCursorHooksLib = (): string => {
  return `#!/usr/bin/env bash
# Shared helpers for Cursor hooks (adapted from rhythm-marketing .claude hooks).

hook_input() {
  INPUT="$(cat)"
}

project_dir() {
  local from_input
  from_input="$(printf '%s' "$INPUT" | jq -r '.cwd // empty')"
  if [ -n "$from_input" ]; then
    printf '%s' "$from_input"
  else
    pwd
  fi
}

tool_file_path() {
  printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""'
}

tool_added_text() {
  printf '%s' "$INPUT" | jq -r '
    [
      .tool_input.new_string?,
      .tool_input.content?,
      .tool_input.string?,
      (.tool_input.edits[]?.new_string)
    ]
    | map(select(. != null))
    | join("\\n")
  '
}

abs_path() {
  local file="$1"
  local root
  root="$(project_dir)"
  case "$file" in
    /*) printf '%s' "$file" ;;
    *) printf '%s' "$root/$file" ;;
  esac
}

deny_tool() {
  local reason="$1"
  jq -n --arg r "$reason" '{
    permission: "deny",
    user_message: $r,
    agent_message: $r
  }'
}

advise_context() {
  local ctx="$1"
  jq -n --arg c "$ctx" '{ additional_context: $c }'
}

session_context() {
  local ctx="$1"
  jq -n --arg c "$ctx" '{ additional_context: $c }'
}

stop_followup() {
  local reason="$1"
  jq -n --arg r "$reason" '{ followup_message: $r }'
}
${readScaffoldAsset(cursorHooksAssetDir, "lib-stop-helpers.sh")}`;
};

export const getClaudeHooksLib = (): string => {
  return `#!/usr/bin/env bash
# Shared helpers for Claude Code hooks (adapted from rhythm-marketing .claude hooks).

hook_input() {
  INPUT="$(cat)"
}

project_dir() {
  local from_input
  from_input="$(printf '%s' "$INPUT" | jq -r '.cwd // empty')"
  if [ -n "$from_input" ]; then
    printf '%s' "$from_input"
  else
    pwd
  fi
}

tool_file_path() {
  printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""'
}

tool_added_text() {
  printf '%s' "$INPUT" | jq -r '
    [
      .tool_input.new_string?,
      .tool_input.content?,
      (.tool_input.edits[]?.new_string)
    ]
    | map(select(. != null))
    | join("\\n")
  '
}

abs_path() {
  local file="$1"
  local root
  root="$(project_dir)"
  case "$file" in
    /*) printf '%s' "$file" ;;
    *) printf '%s' "$root/$file" ;;
  esac
}

deny_tool() {
  local reason="$1"
  jq -n --arg r "$reason" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $r
    }
  }'
}

advise_context() {
  local ctx="$1"
  jq -n --arg c "$ctx" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: $c
    }
  }'
}

session_context() {
  local ctx="$1"
  jq -n --arg c "$ctx" '{
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: $c
    }
  }'
}

stop_followup() {
  local reason="$1"
  jq -n --arg r "$reason" '{
    hookSpecificOutput: {
      hookEventName: "Stop",
      additionalContext: $r
    }
  }'
}
`;
};

export const getSessionHandbookRoutingSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# Session start: inject handbook routing map once per agent session.

source "$(dirname "$0")/_lib.sh"
hook_input

root="$(project_dir)"
map_file="$root/docs/handbook/llms.md"

[ -f "$map_file" ] || exit 0

map_content="$(<"$map_file")"

session_context "$(
  printf 'Handbook routing — read the chapter matching this task BEFORE editing code (from docs/handbook/llms.md):\\n\\n%s' "$map_content"
)"

exit 0
`;
};

export const getBlockAddedCommentsSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write|StrReplace|Edit): deny edits that add code comments.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs | *.css) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

violations="$(printf '%s\\n' "$added" | grep -nE '^[[:space:]]*(//|/\\*|\\*)' || true)"

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked: this edit adds code comments. Do not add explanatory comments — write self-documenting code (clear names, small functions) instead. Remove the comment lines and retry.\\n\\nOffending lines:\\n%s' "$violations")"
  deny_tool "$reason"
fi

exit 0
`;
};

export const getBlockToplevelMediaSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# preToolUse: deny top-level @media blocks in CSS.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.css) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

violations="$(printf '%s\\n' "$added" | grep -nE '^@media' || true)"

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked: this edit adds a top-level @media block. CSS convention here is mobile-first base styles with @media (width >= 800px/1120px) nested INSIDE each selector, not top-level @media blocks that group selectors. Move each media query inside the rule it modifies. See docs/handbook/css.md (CSS).\\n\\nOffending lines:\\n%s' "$violations")"
  deny_tool "$reason"
fi

exit 0
`;
};

export const getBlockCustomMediaSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# preToolUse: deny @custom-media in CSS.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.css) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

violations="$(printf '%s\\n' "$added" | grep -nE '@custom-media|@media[[:space:]]*\\(--' || true)"

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked: this edit uses @custom-media (or an @media (--var) reference), which is unreliable here. Use range-syntax media queries instead, e.g. @media (width >= 800px) or @media (width >= 1120px). See docs/handbook/css.md (CSS).\\n\\nOffending lines:\\n%s' "$violations")"
  deny_tool "$reason"
fi

exit 0
`;
};

export const getBlockMarginTopSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# preToolUse: deny margin-top in CSS.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.css) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

violations="$(printf '%s\\n' "$added" \\
  | grep -nE 'margin-top[[:space:]]*:' \\
  | grep -v 'scroll-margin-top' \\
  | grep -vE 'margin-top[[:space:]]*:[[:space:]]*0[a-z%]*[[:space:]]*;?' \\
  || true)"

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked: this edit adds margin-top. Do not use margin-top for spacing — put siblings in a flex container and use gap (e.g. display: flex; flex-direction: column; gap: var(--sizing-1)). See docs/handbook/css.md (CSS → Style rules).\\n\\nOffending lines:\\n%s' "$violations")"
  deny_tool "$reason"
fi

exit 0
`;
};

export const getBlockPlaceholderNamesSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# preToolUse: deny generic placeholder identifiers in TS/TSX.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

names='raw|tmp|temp|val|thing|foo|bar|stuff'

violations="$(printf '%s\\n' "$added" | grep -nE \\
  "(\\b(const|let|var)[[:space:]]+($names)\\b)|(\\(($names)[[:space:]]*(:|,|\\)))|(,[[:space:]]*($names)[[:space:]]*(:|,|\\)))|(\\b($names)[[:space:]]*=>)" \\
  || true)"

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked: this edit names a const/let/var binding or a function parameter with a generic placeholder (one of: raw, tmp, temp, val, thing, foo, bar, stuff). Use a semantic name that describes what the value IS — its domain meaning, format, or source (e.g. encodedValue, cookieString, metadataEntry, apiResponse, candidateSlug, trimmedDescription). See docs/handbook/conventions.md (TypeScript → semantic parameter and variable names).\\n\\nOffending lines:\\n%s' "$violations")"
  deny_tool "$reason"
fi

exit 0
`;
};

export const getEnforceScaffoldSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write): steer new component creation through \`pnpm scaffold\`.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

[ -z "$file" ] && exit 0

if [[ ! "$file" =~ (^|/)src/components/([^/]+)/([^/]+)\\.component\\.tsx$ ]]; then
  exit 0
fi

folder="\${BASH_REMATCH[2]}"
base="\${BASH_REMATCH[3]}"

if [ "$base" != "$folder" ] || [[ ! "$folder" =~ ^[A-Z] ]]; then
  exit 0
fi

dir="$(dirname "$(abs_path "$file")")"

if [ -d "$dir" ]; then
  exit 0
fi

reason="Blocked: create new components with the scaffold, not by hand. Run \\\`pnpm scaffold \${folder}\\\` — it stubs the component, CSS module, interfaces, page object, and spec under src/components/\${folder}/, plus a factory in src/tests/factories/, so the folder matches the documented layout. Then edit those files. See docs/handbook/components.md."

deny_tool "$reason"
exit 0
`;
};

export const getBlockBarrelFilesSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write): deny barrel files under src/.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

[ -z "$file" ] && exit 0

if [[ ! "$file" =~ (^|/)src/(.*/)?index\\.tsx?$ ]]; then
  exit 0
fi

reason="Blocked: no barrel files. Do not add index.ts/index.tsx that re-exports from other modules — import directly from the defining module (e.g. \\\`from \\"src/components/PlanCard/PlanCard.component\\"\\\`). App Router route files use page.tsx/layout.tsx, not index barrels. See docs/handbook/conventions.md."

deny_tool "$reason"
exit 0
`;
};

export const getEnforceFactoryLocationSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write): factories must live in src/tests/factories/.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.factory.ts) ;;
  *) exit 0 ;;
esac

case "$file" in
  */src/tests/factories/* | src/tests/factories/*) exit 0 ;;
esac

base="$(basename "$file")"
reason="Blocked: factories live in src/tests/factories/, not next to the component. Create this as src/tests/factories/\${base} (subclass BaseFactory, export a singleton). Grouping factories in one folder keeps shared test data discoverable and avoids circular imports. See docs/handbook/conventions.md (testing / factories)."

deny_tool "$reason"
exit 0
`;
};

export const getHandbookSyncNudgeSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# postToolUse: remind to update the matching handbook chapter.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

chapter=""
case "$file" in
  *.spec.ts | *.spec.tsx | *.test.ts | *.test.tsx)
    chapter="testing.md (page objects, specs, screen queries)" ;;
  *.module.css)
    chapter="css.md (CSS Modules: mobile-first base + nested @media)" ;;
  */src/app/api/* | src/app/api/*)
    chapter="api-routes.md (route map, api.* wiring)" ;;
  */src/tests/factories/* | src/tests/factories/*)
    chapter="factories.md (BaseFactory, KeysMatch)" ;;
  */src/app/* | src/app/*)
    chapter="patterns.md (App Router pages, metadata, layouts)" ;;
  */src/components/* | src/components/*)
    chapter="components.md (folder layout, scaffold, exports)" ;;
  */src/contentful/* | src/contentful/*)
    chapter="contentful.md (getters, parsers, types)" ;;
  */src/lib/* | src/lib/*)
    chapter="patterns.md (JSON-LD, sitemaps) or source-layout.md" ;;
  */src/utils/* | src/utils/*)
    chapter="source-layout.md (utils map) or conventions.md" ;;
  *)
    exit 0 ;;
esac

ctx="Handbook-sync check: you just edited $file. If this edit changes how we build things here, docs/handbook/$chapter needs the same change. Follow CLAUDE.md on whether to ask the engineer before editing the handbook."

advise_context "$ctx"
exit 0
`;
};

export const getCheckCssNestingSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# postToolUse: advisory when a CSS file nests selectors 4+ levels deep.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.css) ;;
  *) exit 0 ;;
esac

abs="$(abs_path "$file")"
[ -f "$abs" ] || exit 0

violations="$(awk '
  BEGIN { FS=""; sp=0; sd=0; buf=""; }
  {
    for (i=1; i<=NF; i++) {
      c = $i;
      if (c == "{") {
        t = buf; gsub(/^[ \\t\\r\\n]+/, "", t); gsub(/[ \\t\\r\\n]+$/, "", t);
        if (t ~ /^@/ || t == "") { typ = "at" } else { typ = "sel" }
        if (typ == "sel") { sd++; if (sd >= 5) { print NR ": " t } }
        sp++; st[sp] = typ; buf = "";
      } else if (c == "}") {
        if (sp >= 1) { if (st[sp] == "sel") sd--; sp-- }
        buf = "";
      } else if (c == ";") { buf = "" }
      else { buf = buf c }
    }
    buf = buf "\\n";
  }
' "$abs" 2>/dev/null || true)"

[ -z "$violations" ] && exit 0

ctx="$(printf 'CSS nesting check: %s nests selectors 4+ levels deep. Up to 3 levels is fine; beyond that, break the deepest rules out to top-level using the full selector (e.g. \\\`.table .tableCell {}\\\` instead of nesting \\\`.tableCell\\\` further). See docs/handbook/css.md (CSS → Style rules).\\n\\nDeeply nested selectors:\\n%s' "$file" "$violations")"

advise_context "$ctx"
exit 0
`;
};

export const getHandbookDriftCheckSh = (): string => {
  return `#!/usr/bin/env bash
set -euo pipefail

# stop: if the session changed code under src/ but touched no handbook chapter,
# follow up once to prompt a handbook check. loop_count prevents repeat loops.

source "$(dirname "$0")/_lib.sh"

input="$(cat)"
loop_count="$(printf '%s' "$input" | jq -r '.loop_count // 0')"

if [ "$loop_count" -ge 1 ]; then
  exit 0
fi

root="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$root" ] && cd "$root"

changed="$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null || true)"

code_changed="$(printf '%s\\n' "$changed" | grep -E '^src/.*\\.(ts|tsx|css)$' || true)"
docs_changed="$(printf '%s\\n' "$changed" | grep -E '^docs/handbook/.*\\.md$' || true)"

if [ -n "$code_changed" ] && [ -z "$docs_changed" ]; then
  reason="$(printf 'Handbook-drift check: this session changed code under src/ but no docs/handbook/*.md. If any change affects how we build things, name the matching page and section (docs/handbook/llms.md routes them) and update it, asking the engineer first if CLAUDE.md says to. If nothing documented changed, reply that the handbook is still accurate.\\n\\nChanged code files:\\n%s' "$code_changed")"
  stop_followup "$reason"
fi

exit 0
`;
};

export const getBlockQueryHookMocksSh = (): string =>
  readScaffoldAsset(cursorHooksExtraDir, "block-query-hook-mocks.sh");

export const getEnforceHandbookEditSh = (): string =>
  readScaffoldAsset(cursorHooksExtraDir, "enforce-handbook-edit.sh");

export const getLintAllCheckSh = (): string =>
  readScaffoldAsset(cursorHooksExtraDir, "lint-all-check.sh");

export const getHandbookTestDriftCheckSh = (): string =>
  readScaffoldAsset(cursorHooksExtraDir, "handbook-test-drift-check.sh");

export const getCursorBlockDestructiveGitSh = (): string =>
  readScaffoldAsset(cursorHooksExtraDir, "block-destructive-git.sh");

export const getCursorBlockCoAuthoredByCommitSh = (): string =>
  readScaffoldAsset(cursorHooksExtraDir, "block-co-authored-by-commit.sh");

export const getCursorBlockGeneratedTypesSh = (): string =>
  readScaffoldAsset(cursorHooksExtraDir, "block-generated-types.sh");

export const getBlockDestructiveGitSh = (trunkBased = false): string => {
  const script = readScaffoldAsset(
    claudeHooksAssetDir,
    "block-destructive-git.sh",
  );
  return trunkBased
    ? script.replace(
        "Branches here are stacked — push a feature branch with gh stack push and open a PR into staging.",
        "Push a claude/* branch and open a PR into main.",
      )
    : script;
};

export const getBlockCoAuthoredByCommitSh = (): string =>
  readScaffoldAsset(claudeHooksAssetDir, "block-co-authored-by-commit.sh");

export const getBlockGeneratedTypesSh = (): string =>
  readScaffoldAsset(claudeHooksAssetDir, "block-generated-types.sh");

export const getHandbookDriftCheckMjs = (): string =>
  readScaffoldAsset(claudeHooksAssetDir, "handbook-drift-check.mjs");

export const getStopChecksSh = (): string =>
  readScaffoldAsset(cursorHooksAssetDir, "_stop_checks.sh");

export const getSessionStopChecksSh = (): string =>
  readScaffoldAsset(cursorHooksAssetDir, "session-stop-checks.sh");

export const getCursorHooksJson = (a: ProjectAnswers): string => {
  const preToolUse = [
    {
      command: ".cursor/hooks/block-added-comments.sh",
      matcher: "Write|StrReplace",
      timeout: 10,
    },
    {
      command: ".cursor/hooks/block-toplevel-media.sh",
      matcher: "Write|StrReplace",
      timeout: 10,
    },
    {
      command: ".cursor/hooks/block-custom-media.sh",
      matcher: "Write|StrReplace",
      timeout: 10,
    },
    {
      command: ".cursor/hooks/block-margin-top.sh",
      matcher: "Write|StrReplace",
      timeout: 10,
    },
    {
      command: ".cursor/hooks/block-placeholder-names.sh",
      matcher: "Write|StrReplace",
      timeout: 10,
    },
    {
      command: ".cursor/hooks/enforce-scaffold.sh",
      matcher: "Write",
      timeout: 10,
    },
    {
      command: ".cursor/hooks/block-barrel-files.sh",
      matcher: "Write",
      timeout: 10,
    },
    {
      command: ".cursor/hooks/enforce-factory-location.sh",
      matcher: "Write",
      timeout: 10,
    },
    {
      command: ".cursor/hooks/block-query-hook-mocks.sh",
      matcher: "Write|StrReplace",
      timeout: 10,
    },
    {
      command: ".cursor/hooks/enforce-handbook-edit.sh",
      matcher: "Write|StrReplace",
      timeout: 45,
      failClosed: false,
    },
  ];

  if (a.includeContentful) {
    preToolUse.push({
      command: ".cursor/hooks/block-generated-types.sh",
      matcher: "Write|StrReplace",
      timeout: 10,
    });
  }

  return `${JSON.stringify(
    {
      version: 1,
      hooks: {
        sessionStart: [
          {
            command: ".cursor/hooks/session-handbook-routing.sh",
            timeout: 10,
          },
        ],
        beforeShellExecution: [
          {
            command: ".cursor/hooks/block-co-authored-by-commit.sh",
            matcher: "git commit",
            timeout: 5,
            failClosed: true,
          },
          {
            command: ".cursor/hooks/block-destructive-git.sh",
            matcher: "git push|git reset|git clean",
            timeout: 5,
            failClosed: true,
          },
        ],
        preToolUse,
        postToolUse: [
          {
            command: ".cursor/hooks/handbook-sync-nudge.sh",
            matcher: "Write|StrReplace",
            timeout: 10,
          },
          {
            command: ".cursor/hooks/check-css-nesting.sh",
            matcher: "Write|StrReplace",
            timeout: 10,
          },
        ],
        stop: [
          {
            command: ".cursor/hooks/session-stop-checks.sh",
            loop_limit: 1,
            timeout: 360,
          },
        ],
      },
    },
    null,
    2,
  )}\n`;
};

export const QUALITY_GATE_HOOK_SCRIPT_NAME = "quality-gate.sh";

/**
 * Claude Code Stop hook for the hands-off pipeline: runs the CI checks when the
 * working tree has changes and blocks the stop (up to 3 times in a row) until they pass.
 */
export const getQualityGateSh = (): string => {
  return `#!/usr/bin/env bash
set -uo pipefail

# Stop: when the working tree changed, run the CI checks and block the stop with
# the failures so Claude fixes them. Gives up after 3 consecutive blocked stops.

input="$(cat)"
root="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$root" ] && cd "$root"

attempts_file="$(git rev-parse --git-dir)/claude-quality-gate-attempts"

if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
  rm -f "$attempts_file"
  exit 0
fi

attempts="$(cat "$attempts_file" 2>/dev/null || echo 0)"

failures=""
for script in tsc:ci lint:ci lint:css test:ci knip:ci; do
  if ! output="$(pnpm --silent "$script" 2>&1)"; then
    failures="$(printf '%s\\n\\n--- pnpm %s ---\\n%s' "$failures" "$script" "$(printf '%s' "$output" | tail -n 40)")"
  fi
done

if [ -z "$failures" ]; then
  rm -f "$attempts_file"
  exit 0
fi

if [ "$attempts" -ge 3 ]; then
  rm -f "$attempts_file"
  printf 'Quality gate still failing after 3 attempts; stopping. CI will block the PR.%s\\n' "$failures" >&2
  exit 0
fi

echo $((attempts + 1)) > "$attempts_file"

reason="$(printf 'Quality gate: CI checks fail on the current working tree. Fix every failure below before finishing (do not weaken tests, lint rules, or checks).%s' "$failures")"
jq -n --arg r "$reason" '{ decision: "block", reason: $r }'
exit 0
`;
};

const PIPELINE_PERMISSIONS = {
  allow: [
    "Bash(pnpm install)",
    "Bash(pnpm scaffold:*)",
    "Bash(pnpm tsc:ci)",
    "Bash(pnpm lint:*)",
    "Bash(pnpm test:ci:*)",
    "Bash(pnpm knip:*)",
    "Bash(git status:*)",
    "Bash(git diff:*)",
    "Bash(git log:*)",
    "Bash(git add:*)",
    "Bash(git commit:*)",
    "Bash(git switch:*)",
    "Bash(git fetch:*)",
    "Bash(git revert:*)",
    "Bash(git push origin claude/*)",
    "Bash(gh pr create:*)",
    "Bash(gh pr view:*)",
    "Bash(gh pr checks:*)",
  ],
  deny: [
    "Read(./.env)",
    "Read(./.env.*)",
    "Edit(./.env*)",
    "Edit(./.github/**)",
    "Bash(git push --force:*)",
    "Bash(git push -f:*)",
    "Bash(git push origin main:*)",
  ],
};

export const getClaudeSettingsJson = (a: ProjectAnswers): string => {
  const hook = (command: string) => ({
    hooks: [{ type: "command", command }],
  });

  return `${JSON.stringify(
    {
      ...(a.includeClaudePipeline ? { permissions: PIPELINE_PERMISSIONS } : {}),
      hooks: {
        SessionStart: [hook(".claude/hooks/session-handbook-routing.sh")],
        PreToolUse: [
          {
            matcher: "Write|Edit",
            ...hook(".claude/hooks/block-added-comments.sh"),
          },
          {
            matcher: "Write|Edit",
            ...hook(".claude/hooks/block-toplevel-media.sh"),
          },
          {
            matcher: "Write|Edit",
            ...hook(".claude/hooks/block-custom-media.sh"),
          },
          {
            matcher: "Write|Edit",
            ...hook(".claude/hooks/block-margin-top.sh"),
          },
          {
            matcher: "Write|Edit",
            ...hook(".claude/hooks/block-placeholder-names.sh"),
          },
          {
            matcher: "Write",
            ...hook(".claude/hooks/enforce-scaffold.sh"),
          },
          {
            matcher: "Write",
            ...hook(".claude/hooks/block-barrel-files.sh"),
          },
          {
            matcher: "Write",
            ...hook(".claude/hooks/enforce-factory-location.sh"),
          },
        ],
        PostToolUse: [
          {
            matcher: "Write|Edit",
            ...hook(".claude/hooks/handbook-sync-nudge.sh"),
          },
          {
            matcher: "Write|Edit",
            ...hook(".claude/hooks/check-css-nesting.sh"),
          },
        ],
        Stop: [
          hook(".claude/hooks/handbook-drift-check.mjs"),
          ...(a.includeContentful
            ? [hook(".claude/hooks/block-generated-types.sh")]
            : []),
          ...(a.includeClaudePipeline
            ? [hook(`.claude/hooks/${QUALITY_GATE_HOOK_SCRIPT_NAME}`)]
            : []),
        ],
      },
    },
    null,
    2,
  )}\n`;
};

export const getCursorRulesHandbook = (a: ProjectAnswers): string => {
  return `---
description: Mandatory handbook-first workflow before substantive repo work
alwaysApply: true
---

# Handbook first (non-negotiable)

\`docs/handbook/\` is the project source of truth. **\`CLAUDE.md\`** aligns with it.

## Before editing code

On **substantive** work (features, refactors, App Router handlers, CSS/layout, tests for new behavior, CI/env):

1. **Read** \`docs/handbook/non-negotiables.md\`.
2. **Route** the task via \`docs/handbook/llms.md\` → read **every matching chapter** before the first code change.
3. **Reuse documented patterns** — extend existing components and helpers; do not reimplement parallel logic.

**Substantive = read handbook first.** Narrow mechanical fixes (obvious typos, single-line fixes with unchanged behavior) may skip a full pass.

## During implementation

- **Optional props** — \`classNames()\` for module \`className\`; \`definedProps({ ... })\` for other optional spreads ([react.md](docs/handbook/react.md)).
- **CSS** — mobile-first \`(width >= …)\`; nest under block classes per Stylelint ([css.md](docs/handbook/css.md)).
- **Components** — use \`pnpm scaffold <Name>\` for new folders ([components.md](docs/handbook/components.md)).

## Before finishing

- ${getHandbookChangePolicy(a)}
- Run \`/handbook-review\` to check the branch against the handbook.
- Run relevant checks from the chapter (e.g. \`pnpm lint:css\`, targeted tests).

## If unsure

Search the handbook for the feature area; read that chapter. Do not guess project conventions from chat memory alone.
`;
};

export const getAgentDir = (a: ProjectAnswers): ".cursor" | ".claude" =>
  a.agentTooling === "cursor" ? ".cursor" : ".claude";

const getCommandsSection = (dir: string): string => `## Commands

- \`/handbook-review [base branch or file paths]\` ([\`${dir}/commands/handbook-review.md\`](../commands/handbook-review.md)) reviews the branch against the handbook and reports findings without editing anything. Use it on code written outside an agent session, which never went through these hooks.
`;

export const getCursorHooksReadme = (): string => {
  return `# Cursor hooks

Project hooks that keep agent work aligned with \`docs/handbook/\`. Adapted from rhythm-marketing / filtermydiscogs for Cursor's hook format.

Config: [\`.cursor/hooks.json\`](../hooks.json). Scripts: [\`.cursor/hooks/\`](./).

Shared team files under \`.cursor/\` are tracked in git (\`hooks.json\`, \`hooks/\`, \`rules/\`, \`commands/\`). Local/runtime Cursor state stays gitignored — see root [\`.gitignore\`](../../.gitignore).

## Hooks

| Script | Event | What it does |
|--------|-------|--------------|
| \`session-handbook-routing.sh\` | \`sessionStart\` | Injects the handbook routing map (\`llms.md\`) into session context. |
| \`block-added-comments.sh\` | \`preToolUse\` | Denies edits that add code comments. |
| \`block-toplevel-media.sh\` | \`preToolUse\` | Denies top-level \`@media\` in CSS — nest inside selectors. |
| \`block-custom-media.sh\` | \`preToolUse\` | Denies \`@custom-media\` / \`@media (--var)\` — use range syntax. |
| \`block-margin-top.sh\` | \`preToolUse\` | Denies \`margin-top\` in CSS (use flex \`gap\`). |
| \`block-placeholder-names.sh\` | \`preToolUse\` | Denies generic placeholder names in TS/TSX bindings and params. |
| \`enforce-scaffold.sh\` | \`preToolUse\` (\`Write\`) | Steers new components through \`pnpm scaffold <Name>\`. |
| \`block-barrel-files.sh\` | \`preToolUse\` (\`Write\`) | Denies new \`index.ts\`/\`index.tsx\` barrels under \`src/\`. |
| \`enforce-factory-location.sh\` | \`preToolUse\` (\`Write\`) | Denies \`*.factory.ts\` outside \`src/tests/factories/\`. |
| \`handbook-sync-nudge.sh\` | \`postToolUse\` | Advisory reminder to update the matching handbook chapter. |
| \`check-css-nesting.sh\` | \`postToolUse\` | Advisory when CSS nests selectors 4+ levels deep. |
| \`handbook-drift-check.sh\` | \`stop\` | One follow-up if \`src/\` changed without a handbook update. |

${getCommandsSection(".cursor")}
## Requirements

- \`bash\`, \`jq\`, \`git\` on \`PATH\`
- Hook scripts must be executable (\`chmod +x .cursor/hooks/*.sh\`)
`;
};

export const getClaudeHooksReadme = (a: ProjectAnswers): string => {
  const pipelineRow = a.includeClaudePipeline
    ? `| \`${QUALITY_GATE_HOOK_SCRIPT_NAME}\` | \`Stop\` | When files changed, runs \`tsc:ci\`, \`lint:ci\`, \`lint:css\`, \`test:ci\`, \`knip:ci\` and blocks the stop until they pass (max 3 attempts). |
`
    : "";

  const pipelinePermissions = a.includeClaudePipeline
    ? `
## Permissions (hands-off pipeline)

\`settings.json\` pre-allows the package scripts, local git, pushes to \`claude/*\` branches, and \`gh pr\` create/view/checks so headless sessions do not stall on prompts. It denies reading or editing \`.env*\`, editing \`.github/\`, force pushes, and pushes to \`main\`. These rules steer Claude; the real gate is the GitHub ruleset and CODEOWNERS (see \`docs/handbook/releases.md\`).
`
    : "";

  return `# Claude Code hooks

Project hooks that keep agent work aligned with \`docs/handbook/\`. Adapted from rhythm-marketing for Claude Code's \`.claude/settings.json\` format.

Config: [\`.claude/settings.json\`](../settings.json). Scripts: [\`.claude/hooks/\`](./).

Shared team files under \`.claude/\` are tracked in git (\`settings.json\`, \`hooks/\`, \`commands/\`). Local/runtime Claude state stays gitignored — see root [\`.gitignore\`](../../.gitignore).

## Hooks

| Script | Event | What it does |
|--------|-------|--------------|
| \`session-handbook-routing.sh\` | \`SessionStart\` | Injects the handbook routing map (\`llms.md\`) into session context. |
| \`block-added-comments.sh\` | \`PreToolUse\` | Denies edits that add code comments. |
| \`block-toplevel-media.sh\` | \`PreToolUse\` | Denies top-level \`@media\` in CSS — nest inside selectors. |
| \`block-custom-media.sh\` | \`PreToolUse\` | Denies \`@custom-media\` / \`@media (--var)\` — use range syntax. |
| \`block-margin-top.sh\` | \`PreToolUse\` | Denies \`margin-top\` in CSS (use flex \`gap\`). |
| \`block-placeholder-names.sh\` | \`PreToolUse\` | Denies generic placeholder names in TS/TSX bindings and params. |
| \`enforce-scaffold.sh\` | \`PreToolUse\` (\`Write\`) | Steers new components through \`pnpm scaffold <Name>\`. |
| \`block-barrel-files.sh\` | \`PreToolUse\` (\`Write\`) | Denies new \`index.ts\`/\`index.tsx\` barrels under \`src/\`. |
| \`enforce-factory-location.sh\` | \`PreToolUse\` (\`Write\`) | Denies \`*.factory.ts\` outside \`src/tests/factories/\`. |
| \`handbook-sync-nudge.sh\` | \`PostToolUse\` | Advisory reminder to update the matching handbook chapter. |
| \`check-css-nesting.sh\` | \`PostToolUse\` | Advisory when CSS nests selectors 4+ levels deep. |
| \`handbook-drift-check.sh\` | \`Stop\` | One follow-up if \`src/\` changed without a handbook update. |
${pipelineRow}${pipelinePermissions}
${getCommandsSection(".claude")}
## Requirements

- \`bash\`, \`jq\`, \`git\` on \`PATH\`
- Hook scripts must be executable (\`chmod +x .claude/hooks/*.sh\`)
`;
};

export const getHandbookReviewCommand = (a: ProjectAnswers): string => {
  const base = getBaseBranch(a);
  const dir = getAgentDir(a);
  const keepPaths = [
    "`src/`",
    "`jest.config.ts`",
    "`next.config.ts`",
    ...(a.includeClaudePipeline ? ["`e2e/`", "`playwright.config.ts`"] : []),
    "`docs/handbook/`, when the branch also changes handbook text (check that it is accurate, not its style)",
  ];
  const skipGenerated = a.includeContentful
    ? ", generated Contentful types (`src/contentful/types/`)"
    : "";
  const i18nCheck = a.includeI18n
    ? "- Copy: user-facing text in `src/copy/` with no Spanish (`es`) entry, or a page with hard-coded strings instead of copy ([`docs/handbook/languages.md`](../../docs/handbook/languages.md)).\n"
    : "";

  const frontmatter =
    a.agentTooling === "claude"
      ? '---\ndescription: Review the changes in this branch against docs/handbook and CLAUDE.md.\nargument-hint: "[base branch or file paths]"\n---\n\n'
      : "";
  const argumentsLine =
    a.agentTooling === "claude"
      ? "Arguments: $ARGUMENTS"
      : "Arguments: whatever the engineer typed after the command, if anything.";

  return `${frontmatter}# Handbook review

Review the code this branch changes against the handbook, and report where it doesn't follow it. Don't edit any code or handbook files; this is a review. After the report, the engineer may reply **go** for a separate pass that applies the fixes and runs \`pnpm lint:all\`.

## 1. Find the changes

${argumentsLine}

- If the arguments are paths that exist, review those files and their pairs (\`.po.tsx\`, \`.spec.ts(x)\`).
- If the argument is a branch, diff against it.
- With no arguments, use the PR's base branch (\`gh pr view --json baseRefName -q .baseRefName\`), so a stacked branch is compared with its parent. If there's no PR, or \`gh\` fails, use \`${base}\`.

Use the local base branch if it exists, otherwise \`origin/<base>\` (run \`git fetch origin <base>\` first). \`git diff $(git merge-base HEAD <base>)\` covers committed and uncommitted changes to tracked files. Add untracked files from \`git status --porcelain\`.

Keep changes under:

${keepPaths.map((p) => `- ${p}`).join("\n")}

Skip deleted files, lockfiles, snapshots${skipGenerated}, and \`${dir}/\` edits unless the arguments ask for them. If nothing is left, say so and stop.

## 2. Read the matching chapters

Route every changed file through [\`docs/handbook/llms.md\`](../../docs/handbook/llms.md) before reading any code, and read every chapter it points to in full. Also read:

- [\`docs/handbook/non-negotiables.md\`](../../docs/handbook/non-negotiables.md), always. Most findings come from these rules
- The page that matches each kind of change: [\`conventions.md\`](../../docs/handbook/conventions.md) for TypeScript, [\`react.md\`](../../docs/handbook/react.md) for components, [\`css.md\`](../../docs/handbook/css.md) for styles, [\`testing.md\`](../../docs/handbook/testing.md) for specs and page objects
- [\`docs/handbook/decisions.md#feature-playbooks-touch-order\`](../../docs/handbook/decisions.md#feature-playbooks-touch-order), when the branch adds a component, API route, hook, or factory
- The hooks table in \`${dir}/hooks/README.md\`. Code written outside an agent session never went through those hooks, so check the same rules: added comments, \`margin-top\`, top-level \`@media\`, barrel files, factories outside \`src/tests/factories/\`, and component folders not made with \`pnpm scaffold\`.

Read the whole changed file, not just the hunk, so you can tell new code from code that was already there.

## 3. Run the linters

Run \`pnpm exec biome check <changed files>\`. If the branch changes CSS, also run \`pnpm lint:css\`. Don't pass \`--write\` or \`--fix\`. Report failures in their own group instead of repeating them as findings, and spend the review on what the linters can't catch. When the diff is small, also run \`pnpm handbook:check\` and say whether it fails.

## 4. Check the changed lines

Check each added or changed line against the chapters you read. Look for:

- Every row in non-negotiables.md, and any other rule a chapter states outright.
- Tests: a behavior change or bug fix with no spec change, a new module with no spec, test data built by hand instead of with a factory, and specs that query or mock differently from [\`docs/handbook/testing.md\`](../../docs/handbook/testing.md).
- Patterns that work but don't match how the handbook builds the same thing, like a new helper where a chapter names an existing one, or a raw \`fetch\` where \`api.*\` fits.
${i18nCheck}- Docs: \`src/\` behavior or conventions changed but \`docs/handbook/\` did not. Report it as a process finding, not a line violation.

Report only problems on changed lines. If changed code copies an older pattern from the surrounding file, report it once and say the file already uses it. Don't flag something the handbook doesn't cover as a violation.

## 5. Report

Group findings by file. For each one, give:

- \`path:line\` and the code
- the rule, as a link to the chapter and section, like \`docs/handbook/testing.md#test-ids\`
- the fix, as a short code snippet when it helps

Put the most important findings first: wrong behavior and missing tests, then rule violations, then pattern mismatches, then handbook sync. End with:

- **Linters:** what Biome, Stylelint, and \`handbook:check\` reported, or that they passed.
- **Clean files:** changed files with nothing to report, so the reader knows they were checked.
- **Handbook gaps:** code that follows a pattern the handbook doesn't cover or contradicts. Name the chapter and section you'd update and what you'd write, then ask the engineer. Don't edit the handbook.

If there are no findings, say which files you checked and which chapters you checked them against.
`;
};

export type AgentHookScriptName =
  | (typeof AGENT_HOOK_SCRIPT_NAMES)[number]
  | (typeof CLAUDE_ONLY_HOOK_SCRIPT_NAMES)[number]
  | (typeof CURSOR_EXTRA_HOOK_SCRIPT_NAMES)[number]
  | "block-generated-types.sh";

export const getAgentHookScriptContent = (
  name: AgentHookScriptName,
  options?: { tooling?: "cursor" | "claude"; trunkBased?: boolean },
): string => {
  switch (name) {
    case "session-handbook-routing.sh":
      return getSessionHandbookRoutingSh();
    case "block-added-comments.sh":
      return getBlockAddedCommentsSh();
    case "block-toplevel-media.sh":
      return getBlockToplevelMediaSh();
    case "block-custom-media.sh":
      return getBlockCustomMediaSh();
    case "block-margin-top.sh":
      return getBlockMarginTopSh();
    case "block-placeholder-names.sh":
      return getBlockPlaceholderNamesSh();
    case "enforce-scaffold.sh":
      return getEnforceScaffoldSh();
    case "block-barrel-files.sh":
      return getBlockBarrelFilesSh();
    case "enforce-factory-location.sh":
      return getEnforceFactoryLocationSh();
    case "handbook-sync-nudge.sh":
      return getHandbookSyncNudgeSh();
    case "check-css-nesting.sh":
      return getCheckCssNestingSh();
    case "handbook-drift-check.sh":
      return getHandbookDriftCheckSh();
    case "block-query-hook-mocks.sh":
      return getBlockQueryHookMocksSh();
    case "enforce-handbook-edit.sh":
      return getEnforceHandbookEditSh();
    case "lint-all-check.sh":
      return getLintAllCheckSh();
    case "handbook-test-drift-check.sh":
      return getHandbookTestDriftCheckSh();
    case "session-stop-checks.sh":
      return getSessionStopChecksSh();
    case "block-destructive-git.sh":
      return options?.tooling === "cursor"
        ? getCursorBlockDestructiveGitSh()
        : getBlockDestructiveGitSh(options?.trunkBased);
    case "block-co-authored-by-commit.sh":
      return options?.tooling === "cursor"
        ? getCursorBlockCoAuthoredByCommitSh()
        : getBlockCoAuthoredByCommitSh();
    case "block-generated-types.sh":
      return options?.tooling === "cursor"
        ? getCursorBlockGeneratedTypesSh()
        : getBlockGeneratedTypesSh();
    default:
      return "";
  }
};
