# Agent instructions

## What this repo is

`kickoff` is a CLI scaffolding tool that generates new Next.js + TypeScript projects, with optional Contentful CMS. It asks a series of prompts and writes a full project structure to disk.

## Source layout

```
src/
├── index.ts              ← CLI entry (argv, prompts or --answers → generateProject)
├── types.ts              ← ProjectAnswers interface
├── validateAnswers.ts    ← Strict JSON validation for --answers (optional profile keys get defaults)
├── recommendations.ts    ← Project types, the add-on checklist, and which add-ons each type pre-selects
├── versions/
│   └── refreshVersions.ts ← Picks the newest npm version in range that is 7+ days old; used before generating
├── generator.ts          ← Orchestrates all write() calls; getScaffoldRoot, dry-run / verbose
├── verifyScaffoldE2e.ts  ← E2E: generate fixture projects and run their CI scripts
├── handbook/
│   ├── command.ts        ← `kickoff handbook`: args, agent choice, --answers handbook-only mode
│   ├── detect.ts         ← Scans an existing repo (stack, scripts, docs, existing handbooks)
│   └── prompt.ts         ← Harness-neutral prompt that has an agent study the code and write the handbook
└── templates/
    ├── index.ts          ← Barrel re-export
    ├── agents.ts         ← .cursor/ and .claude/ hooks, rules, commands, READMEs for generated projects
    ├── api.ts            ← src/api/ helpers and urls
    ├── app.ts            ← src/app/ layout, pages, routes, error, manifest, robots, sitemap
    ├── components.ts     ← Navigation, Footer, ExitDraftModeLink, NotFoundPage
    ├── config.ts         ← package.json, tsconfig, biome, jest, postcss, env...
    ├── contentful.ts     ← client, helpers, cache, parsers, richText
    ├── docs.ts           ← CLAUDE.md, README, handbook index/llms/non-negotiables/core chapters (generated projects)
    ├── handbook-agent.ts ← glossary, decisions, agent-workflow, api-routes, factories, data-storage
    ├── github.ts         ← CI, release, dependabot, labeler workflows; Claude pipeline workflows, CODEOWNERS, PR template
    ├── i18n.ts           ← routing, request, proxy, [locale] root layout/pages, per-locale copy, LanguageSwitcher
    ├── lib.ts            ← schema.ts
    ├── next.ts           ← next.config.ts
    ├── scripts.ts        ← scaffold.sh, verify-vercel...
    ├── styles.ts         ← globals.css, variables.css, runtime-variables
    ├── testing.ts        ← BasePageObject, BaseFactory, mocks, setupTests, RichTextDocument factory, Playwright config + e2e smoke spec
    ├── types.ts          ← KeysMatch, PropsWithChildrenOnly
    └── utils.ts          ← array/string/url/environment/contentful/style/factory helpers, constants, interfaces

fixtures/scaffold-e2e/     ← Answer JSON for scaffold E2E (cursor-static, cursor-selfhost-i18n, claude-static, claude-pipeline, claude-pipeline-i18n, cursor-contentful-all)
.cursor/                   ← Cursor hooks for this repo (see .cursor/hooks/README.md)
```

## The most important rule

**Templates and handbook must stay in sync.**

The handbook (`src/templates/docs.ts`) documents the conventions, patterns, and structure that the scaffolded files (`src/templates/*.ts`) implement. If you change one, you must update the other in the same change.

Examples:
- Add a new util file → update `getHandbookSourceLayout` in `docs.ts`
- Change the factory pattern → update `getHandbookConventions` and `getHandbookComponents`
- Add a new feature file to the scaffold → update the relevant handbook chapter and `getHandbookArchitecture`
- Change import paths (e.g. `src/utils/helpers` → `src/utils/environment.helpers`) → update any handbook chapter that references it
- Add a new prompt/option → update `getHandbookPlatform` scripts table and `getReadme`, and root `README.md` (Options table, `--answers` example, Working in a generated project)
- Add or change agent hooks → update `src/templates/agents.ts`, handbook `platform.md`, and root `README.md` (What you get, Options)
- Change a rule in `getHandbookConventions` or another chapter → update the matching row in `getHandbookNonNegotiables`, and check `getHandbookLlms` still routes the files it covers
- Change the handbook layout (`getHandbookReadme`, `getHandbookLlms`, `getHandbookNonNegotiables`) → make the same change to the structure `src/handbook/prompt.ts` asks agents to write, so existing repos and new projects get the same handbook
- Add anything Vercel-specific to a generated project → put it behind `usesVercel(a)` (`config.ts`); the generation matrix fails if a `hosting: "other"` project mentions Vercel, refresh-content, or the deploy components
- Add an add-on → add its key to `ProjectAnswers` and `OPTIONAL_KEYS` (with a default), to `ADD_ONS` and the `RECOMMENDED` lists in `recommendations.ts`, and to `OPTION_KEYS` in the generation matrix
- Add a package to a generated project → add it to `DEFAULT_VERSIONS` in `config.ts` (the refresh only updates packages listed there), and to `KEEP_PINNED` if it must stay exactly pinned
- Change the `/handbook-review` command (`getHandbookReviewCommand` in `agents.ts`) → keep its list of hook rules in step with the hooks tables in `getClaudeHooksReadme` / `getCursorHooksReadme`
- Change the Claude pipeline (`includeClaudePipeline`: workflows in `github.ts`, quality gate in `agents.ts`, Playwright in `testing.ts`) → update `getHandbookPipelineSection` / `getPipeline*` helpers in `docs.ts`, `getClaudePipelineInstructions` (generated `CLAUDE.md`), `getWorkingWithClaudeGuide` (`docs/working-with-claude.md` for non-technical requesters), root `README.md`, and `fixtures/scaffold-e2e/claude-pipeline.json` if answers change

## Conventions the scaffolded code must follow

The generated code must follow the same conventions documented in the handbook. Before writing or changing any template, verify it against these rules:

- **Arrow functions only** — no `function` declarations for components, pages, or helpers. Use `const Foo = () => {}` and `export default Foo`.
- **Named + default exports** — every component must have both a named export (`export const Foo`) and a default export (`export default Foo`).
- **`classnames` for conditional classes** — never use template literals or ternaries to combine CSS module class names. Use `classNames(styles.a, { [styles.b]: condition })`.
- **Absolute imports** — all `src/` imports use `src/...` paths, not relative `../` paths. Exception: co-located CSS modules use `./`.
- **No barrel files** — do not add `index.ts` re-exports inside `src/` of the scaffolded project.
- **No `React.FC`** — type props explicitly; let return type be inferred.
- **No `any`** — use proper types throughout.
- **`as const` not enums** — use `as const` objects with derived union types, never TypeScript enums.
- **Factory pattern** — factories extend `BaseFactory`, live in `src/tests/factories/`, and use `KeysMatch` to enforce exhaustive instance coverage.
- **Test IDs** — root elements use `data-testid="rh<ComponentName>"`.
- **CSS alphabetized** — properties within each rule block are alphabetized.
- **No `margin-top`** — use flexbox `gap` for spacing between siblings.

## Kickoff tool code vs scaffolded file contents

- **This repo’s TypeScript** (`src/index.ts`, `src/generator.ts`, `src/templates/*.ts`, tests, etc.) should follow the same arrow-style preference as the handbook (`const fn = () => {}`, `export const getThing = (): string => {}`). Use `function` only where the language requires it (e.g. generators) or for small inline callbacks if that already matches surrounding code.
- **Inside template literals** (`return \`...\`` in template modules) you are emitting **the user’s project**. That text must follow handbook rules for the generated app, including arrow functions for Next.js exports (`export const generateMetadata = async () => {}`, `export const GET = async (request: Request) => {}`, `const robots = () => {}; export default robots;`). The generation matrix fails on any `function` declaration under a generated `src/`.

## Cursor hooks (this repo)

Kickoff ships **`.cursor/hooks.json`** and scripts under **`.cursor/hooks/`** that enforce conventions while editing the tool itself. See **`.cursor/hooks/README.md`**. Session start injects **`AGENTS.md`** (this file). Generated projects get their own hook set via `agentTooling` (`cursor` or `claude`) from `src/templates/agents.ts`.

## Testing generation scenarios

- `src/generationMatrix.test.ts` generates every tooling × option combination (96 projects) in seconds and checks structural invariants. Add an invariant there when you fix a class of generator bug.
- `fixtures/scaffold-e2e/*.json` covers each option at least once for the slow end-to-end run. Add a fixture when a new option or combination needs a real install, build, or browser test.
- Write the test first and watch it fail for the reason you expect before you change the code. When you add tests for code that already exists, break the code on purpose to prove the test catches it.
- `pnpm test:coverage` must stay above the thresholds in `vitest.config.ts`. Code that only runs as a separate process (the CLI and hook entry points) is covered by subprocess tests and the scaffold E2E instead.

## Scripts

```sh
pnpm build              # tsc compile to dist/
pnpm dev                # tsc --watch
pnpm lint               # biome check
pnpm lint:fix           # biome check --fix
pnpm test               # vitest (generator integration tests)
pnpm test:coverage      # vitest with coverage; CI fails below the thresholds in vitest.config.ts
pnpm test:scaffold-e2e  # generate fixture projects, run their CI scripts, build/serve/smoke non-CMS fixtures
SCAFFOLD_E2E_PLAYWRIGHT=1 pnpm test:scaffold-e2e  # also run generated Playwright suites
SCAFFOLD_E2E_ONLY=claude-static pnpm test:scaffold-e2e  # run only the named fixtures
SCAFFOLD_E2E_REFRESH=0 pnpm test:scaffold-e2e  # use the tested package versions instead of refreshing from npm
node dist/index.js      # run the CLI (interactive; or --answers / --dry-run / --help)
node dist/index.js handbook --dry-run   # scan the current repo and print the handbook build prompt
```

## Releasing

```sh
git switch staging && git pull
make release tag=v1.3.0
```

Same flow as filtermydiscogs, minus the Vercel check (kickoff isn't deployed). PRs merge into `staging`. `make release` runs only from `staging`: it tags `staging`, pushes the tag, and `scripts/watch-release.sh` follows the run. `.github/workflows/release.yml` fast-forwards `main` to the tag with the `RELEASE_PUSH_TOKEN` secret (a personal access token whose owner can bypass the `main` ruleset), then publishes `@wadehammes/kickoff` to npm and creates the GitHub release.

The tag sets the published version (`npm version` runs in the workflow), so `package.json`'s `version` doesn't need a bump commit. npm uses trusted publishing: the package's npm settings trust `wadehammes/kickoff` and `.github/workflows/release.yml`, and the job's `id-token: write` permission is what authenticates `npm publish`.

What ships is `files` in `package.json`: built `dist/`, `scaffold-assets/` (read at runtime), the README, and the license. Run `pnpm verify:package` after changing what the CLI reads from disk; it packs, installs the tarball in a temp folder, and generates a project with it.
