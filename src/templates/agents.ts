import type { ProjectAnswers } from "../types.js";

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

export const getAgentHookScriptPaths = (
  tooling: ProjectAnswers["agentTooling"],
): string[] => {
  const prefix = tooling === "cursor" ? ".cursor/hooks" : ".claude/hooks";
  return [
    `${prefix}/_lib.sh`,
    ...AGENT_HOOK_SCRIPT_NAMES.map((name) => `${prefix}/${name}`),
  ];
};

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
`;
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
  reason="$(printf 'Blocked: this edit adds a top-level @media block. CSS convention here is mobile-first base styles with @media (width >= 800px/1120px) nested INSIDE each selector, not top-level @media blocks that group selectors. Move each media query inside the rule it modifies. See docs/handbook/conventions.md (CSS).\\n\\nOffending lines:\\n%s' "$violations")"
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
  reason="$(printf 'Blocked: this edit uses @custom-media (or an @media (--var) reference), which is unreliable here. Use range-syntax media queries instead, e.g. @media (width >= 800px) or @media (width >= 1120px). See docs/handbook/conventions.md (CSS).\\n\\nOffending lines:\\n%s' "$violations")"
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
  reason="$(printf 'Blocked: this edit adds margin-top. Do not use margin-top for spacing — put siblings in a flex container and use gap (e.g. display: flex; flex-direction: column; gap: var(--sizing-1)). See docs/handbook/conventions.md (CSS → Style rules).\\n\\nOffending lines:\\n%s' "$violations")"
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
    chapter="conventions.md#testing (page objects, specs, screen queries)" ;;
  *.module.css)
    chapter="conventions.md (CSS Modules: mobile-first base + nested @media)" ;;
  */src/app/api/* | src/app/api/*)
    chapter="patterns.md (API routes, cache headers)" ;;
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

ctx="Handbook-sync check: you just edited $file. If this change shifts documented behavior or conventions, update docs/handbook/$chapter in the same change so the handbook stays accurate."

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

ctx="$(printf 'CSS nesting check: %s nests selectors 4+ levels deep. Up to 3 levels is fine; beyond that, break the deepest rules out to top-level using the full selector (e.g. \\\`.table .tableCell {}\\\` instead of nesting \\\`.tableCell\\\` further). See docs/handbook/conventions.md (CSS → Style rules).\\n\\nDeeply nested selectors:\\n%s' "$file" "$violations")"

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
  reason="$(printf 'Handbook-drift check: this session changed code under src/ but no docs/handbook/*.md. If any change shifted documented behavior or conventions, update the matching chapter now (see docs/handbook/llms.md for routing). If nothing documented changed, reply that the handbook is still accurate.\\n\\nChanged code files:\\n%s' "$code_changed")"
  stop_followup "$reason"
fi

exit 0
`;
};

export const getCursorHooksJson = (): string => {
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
        preToolUse: [
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
        ],
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
            command: ".cursor/hooks/handbook-drift-check.sh",
            loop_limit: 1,
            timeout: 15,
          },
        ],
      },
    },
    null,
    2,
  )}\n`;
};

export const getClaudeSettingsJson = (): string => {
  const hook = (command: string) => ({
    hooks: [{ type: "command", command }],
  });

  return `${JSON.stringify(
    {
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
        Stop: [hook(".claude/hooks/handbook-drift-check.sh")],
      },
    },
    null,
    2,
  )}\n`;
};

export const getCursorRulesHandbook = (_a: ProjectAnswers): string => {
  return `---
description: Mandatory handbook-first workflow before substantive repo work
alwaysApply: true
---

# Handbook first (non-negotiable)

\`docs/handbook/\` is the project source of truth. **\`CLAUDE.md\`** aligns with it.

## Before editing code

On **substantive** work (features, refactors, App Router handlers, CSS/layout, tests for new behavior, CI/env):

1. **Read** \`docs/handbook/README.md\` (skim index).
2. **Route** the task via \`docs/handbook/llms.md\` → read **every matching chapter** before the first code change.
3. **Reuse documented patterns** — extend existing components and helpers; do not reimplement parallel logic.

**Substantive = read handbook first.** Narrow mechanical fixes (obvious typos, single-line fixes with unchanged behavior) may skip a full pass.

## During implementation

- **Optional props** — \`classNames()\` for module \`className\`; \`definedProps({ ... })\` for other optional spreads ([conventions.md](docs/handbook/conventions.md)).
- **CSS** — mobile-first \`(width >= …)\`; nest under block classes per Stylelint ([conventions.md](docs/handbook/conventions.md)).
- **Components** — use \`pnpm scaffold <Name>\` for new folders ([components.md](docs/handbook/components.md)).

## Before finishing

- If behavior, files, or conventions changed → **update the matching \`docs/handbook/*.md\` chapter** in the same PR (or immediate follow-up). Do not leave the handbook stale.
- Run relevant checks from the chapter (e.g. \`pnpm lint:css\`, targeted tests).

## If unsure

Search the handbook for the feature area; read that chapter. Do not guess project conventions from chat memory alone.
`;
};

export const getCursorHooksReadme = (): string => {
  return `# Cursor hooks

Project hooks that keep agent work aligned with \`docs/handbook/\`. Adapted from rhythm-marketing / filtermydiscogs for Cursor's hook format.

Config: [\`.cursor/hooks.json\`](../hooks.json). Scripts: [\`.cursor/hooks/\`](./).

Shared team files under \`.cursor/\` are tracked in git (\`hooks.json\`, \`hooks/\`, \`rules/\`). Local/runtime Cursor state stays gitignored — see root [\`.gitignore\`](../../.gitignore).

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

## Requirements

- \`bash\`, \`jq\`, \`git\` on \`PATH\`
- Hook scripts must be executable (\`chmod +x .cursor/hooks/*.sh\`)
`;
};

export const getClaudeHooksReadme = (): string => {
  return `# Claude Code hooks

Project hooks that keep agent work aligned with \`docs/handbook/\`. Adapted from rhythm-marketing for Claude Code's \`.claude/settings.json\` format.

Config: [\`.claude/settings.json\`](../settings.json). Scripts: [\`.claude/hooks/\`](./).

Shared team files under \`.claude/\` are tracked in git (\`settings.json\`, \`hooks/\`). Local/runtime Claude state stays gitignored — see root [\`.gitignore\`](../../.gitignore).

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

## Requirements

- \`bash\`, \`jq\`, \`git\` on \`PATH\`
- Hook scripts must be executable (\`chmod +x .claude/hooks/*.sh\`)
`;
};

export const getAgentHookScriptContent = (
  name: (typeof AGENT_HOOK_SCRIPT_NAMES)[number],
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
    default:
      return "";
  }
};
