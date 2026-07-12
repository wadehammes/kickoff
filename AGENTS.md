# Agent instructions

## What this repo is

`kickoff` is a CLI scaffolding tool that generates new Next.js + TypeScript projects, with optional Contentful CMS. It asks a series of prompts and writes a full project structure to disk.

## Source layout

```
src/
├── index.ts              ← CLI entry (argv, prompts or --answers → generateProject)
├── types.ts              ← ProjectAnswers interface
├── validateAnswers.ts    ← Strict JSON validation for --answers
├── generator.ts          ← Orchestrates all write() calls; getScaffoldRoot, dry-run / verbose
├── verifyScaffoldE2e.ts  ← E2E: generate fixture projects and run their CI scripts
└── templates/
    ├── index.ts          ← Barrel re-export
    ├── agents.ts         ← .cursor/ and .claude/ hooks, rules, READMEs for generated projects
    ├── api.ts            ← src/api/ helpers and urls
    ├── app.ts            ← src/app/ layout, pages, routes, error, manifest
    ├── components.ts     ← Navigation, Footer, ExitDraftModeLink, NotFoundPage
    ├── config.ts         ← package.json, tsconfig, biome, jest, postcss, env...
    ├── contentful.ts     ← client, helpers, cache, parsers, richText
    ├── docs.ts           ← CLAUDE.md, README, all 11 handbook pages (generated projects)
    ├── github.ts         ← CI, release, dependabot, labeler workflows
    ├── i18n.ts           ← routing, request, locale layout/pages
    ├── lib.ts            ← schema.ts, generateSitemap.ts
    ├── next.ts           ← next.config.ts
    ├── public.ts         ← sitemap-index.xml
    ├── scripts.ts        ← scaffold.sh, make_sitemap.js, verify-vercel...
    ├── styles.ts         ← globals.css, variables.css, runtime-variables
    ├── testing.ts        ← BasePageObject, BaseFactory, mocks, setupTests, RichTextDocument factory
    ├── types.ts          ← KeysMatch, PropsWithChildrenOnly
    └── utils.ts          ← array/string/url/environment/contentful/style/factory helpers, constants, interfaces

fixtures/scaffold-e2e/     ← Answer JSON for scaffold E2E (cursor-static, claude-static)
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
- Add a new prompt/option → update `getHandbookPlatform` scripts table and `getReadme`, and root `README.md` (prompts, `--answers` example, structure tree)
- Add or change agent hooks → update `src/templates/agents.ts`, handbook `platform.md`, and root `README.md` (optional add-ons, structure notes)

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
- **Inside template literals** (`return \`...\`` in template modules) you are emitting **the user’s project**. That text must follow handbook rules for the generated app. Do not rewrite embedded snippets just to change kickoff’s outer style—lines like `export function generateMetadata()` inside a string are intentional output, not kickoff module declarations.

## Cursor hooks (this repo)

Kickoff ships **`.cursor/hooks.json`** and scripts under **`.cursor/hooks/`** that enforce conventions while editing the tool itself. See **`.cursor/hooks/README.md`**. Session start injects **`AGENTS.md`** (this file). Generated projects get their own hook set via `agentTooling` (`cursor` or `claude`) from `src/templates/agents.ts`.

## Scripts

```sh
pnpm build              # tsc compile to dist/
pnpm dev                # tsc --watch
pnpm lint               # biome check
pnpm lint:fix           # biome check --fix
pnpm test               # vitest (generator integration tests)
pnpm test:scaffold-e2e  # generate fixture projects and run their CI scripts
node dist/index.js      # run the CLI (interactive; or --answers / --dry-run / --help)
```

## Releasing

```sh
make release tag=v1.0.0
```

Pushes the tag → triggers `.github/workflows/release.yml` → creates a GitHub release.
