# Cursor hooks

Project hooks that keep agent work aligned with kickoff conventions and the generated handbook. Adapted from [filtermydiscogs `.cursor/`](https://github.com/rhythmengineering/filtermydiscogs/tree/main/.cursor) for kickoff's template + `docs.ts` workflow.

Config: [`.cursor/hooks.json`](../hooks.json). Scripts: [`.cursor/hooks/`](./).

Shared team files under `.cursor/` are tracked in git (`hooks.json`, `hooks/`, `rules/`). Local/runtime Cursor state (`mcp.json`, `*.log`, `settings.local.json`, checkpoints, etc.) stays gitignored — see root [`.gitignore`](../../.gitignore).

## Event mapping (Claude → Cursor)

| Claude | Cursor |
|--------|--------|
| `UserPromptSubmit` | `sessionStart` (injects `AGENTS.md` once per session) |
| `PreToolUse` | `preToolUse` (matchers: `Write`, `StrReplace`) |
| `PostToolUse` | `postToolUse` |
| `Stop` | `stop` (`followup_message` instead of `decision: block`) |

## Hooks

| Script | Event | What it does |
|--------|-------|--------------|
| `session-handbook-routing.sh` | `sessionStart` | Injects kickoff agent instructions (`AGENTS.md`) into session context. |
| `block-added-comments.sh` | `preToolUse` | Denies edits that add code comments in kickoff tool code (excludes `src/templates/`). |
| `block-toplevel-media.sh` | `preToolUse` | Denies top-level `@media` in CSS — nest inside selectors. Also checks CSS template strings in `styles.ts`, `components.ts`, `app.ts`. |
| `block-custom-media.sh` | `preToolUse` | Denies `@custom-media` / `@media (--var)` — use range syntax. |
| `block-margin-top.sh` | `preToolUse` | Denies `margin-top` in CSS (use flex `gap`); ignores `margin-top: 0` and `scroll-margin-top`. |
| `block-placeholder-names.sh` | `preToolUse` | Denies generic placeholder names (`raw`, `tmp`, `val`, `foo`, etc.) in TS/TSX bindings and params. |
| `block-barrel-files.sh` | `preToolUse` (`Write`) | Denies new `index.ts`/`index.tsx` barrels under `src/` (except `src/templates/index.ts`). |
| `handbook-sync-nudge.sh` | `postToolUse` | Advisory reminder to update the matching `getHandbook*` chapter in `src/templates/docs.ts`. |
| `readme-sync-nudge.sh` | `postToolUse` | Advisory reminder to update root `README.md` when CLI, scaffold, scripts, or CI files change. |
| `check-css-nesting.sh` | `postToolUse` | Advisory when CSS nests selectors 4+ levels deep. |
| `handbook-drift-check.sh` | `stop` | One follow-up if templates or `generator.ts` changed without `docs.ts` / `AGENTS.md`. |
| `readme-drift-check.sh` | `stop` | One follow-up if README-relevant files changed without `README.md`. |

### Not ported (scaffolded-app only)

These apply to generated Next.js projects, not the kickoff tool repo:

- **`enforce-scaffold.sh`** — generated apps use `pnpm scaffold <Name>`; kickoff authors edit template getters directly.
- **`enforce-factory-location.sh`** — factories live in `src/tests/factories/` in generated apps; enforced via handbook conventions, not kickoff repo layout.

## Requirements

- `bash`, `jq`, `git` on `PATH`
- Hook scripts must be executable (`chmod +x .cursor/hooks/*.sh`)

## Adding or changing a hook

1. Add or edit a script under `.cursor/hooks/` (read JSON from **stdin**; use `_lib.sh` helpers).
2. Wire it in `.cursor/hooks.json` with the right event and matcher.
3. `chmod +x` the script and document it in the table above.
4. Blocking hooks return `{ "permission": "deny", ... }` on `preToolUse`; advisory hooks return `{ "additional_context": "..." }` on `postToolUse`; `stop` uses `{ "followup_message": "..." }`.

Debug via Cursor **Settings → Hooks** or the **Hooks** output channel. Reload happens on `hooks.json` save; restart Cursor if hooks do not pick up.
