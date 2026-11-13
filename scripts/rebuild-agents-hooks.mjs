import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const agentsPath = path.join(root, "src/templates/agents.ts");

let agents = fs.readFileSync(agentsPath, "utf8");

if (!agents.includes("cursorHooksAssetDir")) {
  agents = agents.replace(
    'import type { ProjectAnswers } from "../types.js";',
    `import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ProjectAnswers } from "../types.js";

const scaffoldAssetsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../scaffold-assets",
);
const cursorHooksAssetDir = path.join(scaffoldAssetsDir, "cursor-hooks");
const cursorHooksExtraDir = path.join(scaffoldAssetsDir, "cursor-hooks-extra");
const claudeHooksAssetDir = path.join(scaffoldAssetsDir, "claude-hooks");

const readScaffoldAsset = (dir: string, name: string): string =>
  readFileSync(path.join(dir, name), "utf8");
`,
  );
}

if (!agents.includes("CURSOR_EXTRA_HOOK_SCRIPT_NAMES")) {
  agents = agents.replace(
    `] as const;

export const getAgentHookScriptPaths = (`,
    `] as const;

export const CLAUDE_ONLY_HOOK_SCRIPT_NAMES = [
  "block-destructive-git.sh",
  "block-co-authored-by-commit.sh",
  "block-generated-types.sh",
] as const;

export const CURSOR_EXTRA_HOOK_SCRIPT_NAMES = [
  "block-query-hook-mocks.sh",
  "lint-all-check.sh",
  "handbook-test-drift-check.sh",
  "session-stop-checks.sh",
  "block-destructive-git.sh",
  "block-co-authored-by-commit.sh",
] as const;

export const getClaudeHookScriptNames = (a: ProjectAnswers): string[] => [
  ...AGENT_HOOK_SCRIPT_NAMES.filter((name) => name !== "handbook-drift-check.sh"),
  ...CLAUDE_ONLY_HOOK_SCRIPT_NAMES.filter(
    (name) => name !== "block-generated-types.sh" || a.includeContentful,
  ),
];

export const getCursorHookScriptNames = (a: ProjectAnswers): string[] => [
  ...AGENT_HOOK_SCRIPT_NAMES,
  ...CURSOR_EXTRA_HOOK_SCRIPT_NAMES,
  ...(a.includeContentful ? ["block-generated-types.sh"] : []),
];

export const getAgentHookScriptPaths = (`,
  );
}

const assetGetters = `
export const getBlockQueryHookMocksSh = (): string =>
  readScaffoldAsset(cursorHooksExtraDir, "block-query-hook-mocks.sh");

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

export const getBlockDestructiveGitSh = (): string =>
  readScaffoldAsset(claudeHooksAssetDir, "block-destructive-git.sh");

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
`;

const cursorFn = `export const getCursorHooksJson = (a: ProjectAnswers): string => {
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
  ];

  if (a.includeContentful) {
    preToolUse.push({
      command: ".cursor/hooks/block-generated-types.sh",
      matcher: "Write|StrReplace",
      timeout: 10,
    });
  }

  return \`\${JSON.stringify(
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
  )}\\n\`;
};
`;

const lines = agents.split("\n");
const startLine = lines.findIndex((l) =>
  l.startsWith("export const getCursorHooksJson"),
);
const endLine = lines.findIndex(
  (l, i) =>
    i > startLine && l.startsWith("export const getClaudeSettingsJson = "),
);

if (startLine !== -1 && endLine !== -1 && !agents.includes("getStopChecksSh")) {
  const replacement = `${assetGetters}\n${cursorFn}`.split("\n");
  agents = [
    ...lines.slice(0, startLine),
    ...replacement,
    ...lines.slice(endLine),
  ].join("\n");
}

if (!agents.includes("readScaffoldAsset(cursorHooksAssetDir, \"lib-stop-helpers.sh\")")) {
  agents = agents.replace(
    `stop_followup() {
  local reason="$1"
  jq -n --arg r "$reason" '{ followup_message: $r }'
}
\`;
};`,
    `stop_followup() {
  local reason="$1"
  jq -n --arg r "$reason" '{ followup_message: $r }'
}
\` +
  readScaffoldAsset(cursorHooksAssetDir, "lib-stop-helpers.sh");
};`,
  );
}

if (!agents.includes("getClaudeSettingsJson = (a: ProjectAnswers)")) {
  agents = agents.replace(
    "export const getClaudeSettingsJson = (): string => {",
    `export const getClaudeSettingsJson = (a: ProjectAnswers): string => {`,
  );
  agents = agents.replace(
    'Stop: [hook(".claude/hooks/handbook-drift-check.sh")],',
    `Stop: [
          hook(".claude/hooks/handbook-drift-check.mjs"),
          ...(a.includeContentful
            ? [hook(".claude/hooks/block-generated-types.sh")]
            : []),
        ],`,
  );
}

if (!agents.includes("type AgentHookScriptName")) {
  agents = agents.replace(
    `export const getAgentHookScriptContent = (
  name: (typeof AGENT_HOOK_SCRIPT_NAMES)[number],
): string => {`,
    `type AgentHookScriptName =
  | (typeof AGENT_HOOK_SCRIPT_NAMES)[number]
  | (typeof CLAUDE_ONLY_HOOK_SCRIPT_NAMES)[number]
  | (typeof CURSOR_EXTRA_HOOK_SCRIPT_NAMES)[number]
  | "block-generated-types.sh";

export const getAgentHookScriptContent = (
  name: AgentHookScriptName,
  options?: { tooling?: "cursor" | "claude" },
): string => {`,
  );

  const switchInsert = `    case "block-query-hook-mocks.sh":
      return getBlockQueryHookMocksSh();
    case "lint-all-check.sh":
      return getLintAllCheckSh();
    case "handbook-test-drift-check.sh":
      return getHandbookTestDriftCheckSh();
    case "session-stop-checks.sh":
      return getSessionStopChecksSh();
    case "block-destructive-git.sh":
      return options?.tooling === "cursor"
        ? getCursorBlockDestructiveGitSh()
        : getBlockDestructiveGitSh();
    case "block-co-authored-by-commit.sh":
      return options?.tooling === "cursor"
        ? getCursorBlockCoAuthoredByCommitSh()
        : getBlockCoAuthoredByCommitSh();
    case "block-generated-types.sh":
      return options?.tooling === "cursor"
        ? getCursorBlockGeneratedTypesSh()
        : getBlockGeneratedTypesSh();`;

  agents = agents.replace(
    `    case "handbook-drift-check.sh":
      return getHandbookDriftCheckSh();
    default:`,
    `    case "handbook-drift-check.sh":
      return getHandbookDriftCheckSh();
${switchInsert}
    default:`,
  );
}

const readmeMarker = "| `handbook-drift-check.sh` | `stop` | One follow-up";
if (agents.includes(readmeMarker)) {
  agents = agents.replace(
    "| `handbook-drift-check.sh` | `stop` | One follow-up if `src/` changed without a handbook update. |\n\n## Requirements\n\n- `bash`, `jq`, `git` on `PATH`\n- Hook scripts must be executable (`chmod +x .cursor/hooks/*.sh`)\n`;\n",
    [
      "| `block-query-hook-mocks.sh` | `preToolUse` | Blocks `jest.mock` / hook-layer specs that violate React Query testing rules. |",
      "| `block-generated-types.sh` | `preToolUse` | Denies hand-edits to `src/contentful/types/` (Contentful scaffolds). |",
      "| `block-destructive-git.sh` | `beforeShellExecution` | Blocks destructive git and force-push to `main` / `staging`. |",
      "| `block-co-authored-by-commit.sh` | `beforeShellExecution` | Blocks raw `git commit` without `scripts/git-commit.sh` / `.githooks`. |",
      "| `session-stop-checks.sh` | `stop` | Orchestrates handbook drift, `lint:all`, and handbook test rules in one follow-up (deduped via `.cursor/hooks-state/`). |",
      "| `handbook-drift-check.sh` | (legacy) | Standalone drift follow-up — not wired in `hooks.json`; use for manual debugging. |",
      "| `handbook-test-drift-check.sh` | (legacy) | Standalone handbook-test Jest check — not wired in `hooks.json`. |",
      "| `lint-all-check.sh` | (legacy) | Standalone `pnpm lint:all` stop hook — not wired in `hooks.json`. |",
      "",
      "## Requirements",
      "",
      "- `bash`, `jq`, `git`, `pnpm` on `PATH` (stop hooks use `run_pnpm` from `_lib.sh`)",
      "- Hook scripts must be executable (`chmod +x .cursor/hooks/*.sh`)",
      "- Per-conversation dedupe state lives under `.cursor/hooks-state/` (gitignored)",
      "`;\n",
    ].join("\n"),
  );
}

fs.writeFileSync(agentsPath, agents);
console.log("agents lines", agents.split("\n").length);
