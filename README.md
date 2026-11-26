# kickoff

A command-line tool that generates a complete Next.js and TypeScript project, ready for a team or an AI agent to build on.

You answer a few questions (or pass a JSON file), and kickoff writes out a repo with the framework, tooling, CI, Vercel helpers, and a project handbook that agents read before changing anything. Optional modules add a CMS, i18n, analytics, email, reCAPTCHA, and a hands-off pipeline where Claude opens pull requests and automated checks stand in for human review.

## Quick start

kickoff isn't published to npm yet. Clone it, build it, and link it:

```sh
git clone https://github.com/wadehammes/kickoff.git
cd kickoff
pnpm install
pnpm build
npm link
```

Then, from wherever you want the new project:

```sh
kickoff
```

You need Node 24 and pnpm 12 (see [`.tool-versions`](.tool-versions)). `corepack enable` or mise/asdf will pick up the right versions.

## What you get

Every generated project includes:

| Area | What's included |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, strict TypeScript 7 |
| Styling | CSS Modules, PostCSS Preset Env, design tokens from your brand colors |
| UI | Base UI primitives, SVGs as components, React Query for client data |
| Quality | Biome (lint and format), Stylelint, Jest with Testing Library, knip for dead code |
| SEO and security | Sitemap, robots, web manifest, JSON-LD helpers, security headers with a Content Security Policy |
| Deployment | Vercel, plus a token-protected page for triggering a redeploy |
| CI | GitHub Actions with every action pinned to a commit, Dependabot, PR labeling |
| Dependencies | pnpm 12, installs limited to package versions published at least 7 days ago |
| Agent tooling | A handbook in `docs/handbook/` with a non-negotiables page, a routing page that maps tasks and files to pages for agents, `CLAUDE.md`, and hooks for Cursor or Claude Code that block edits breaking the conventions, plus a `/handbook-review` command that checks a branch against the handbook |
| Upgrades | `pnpm next:upgrade` and `pnpm next:agents-md`, which wrap the official Next.js codemods |

## Options

| Option | Adds |
| --- | --- |
| Contentful | Contentful client, getters and parsers, draft mode routes, and type generation (`pnpm types:contentful`) |
| i18n | English at `/` and Spanish at `/es` with next-intl. Copy in `src/copy/` is typed per language, so a missing translation fails the typecheck. Includes a language switcher. |
| Google Analytics | GA through `@next/third-parties` |
| Resend | The Resend email package and env vars |
| reCAPTCHA | `react-google-recaptcha` and env vars |
| Agent tooling | Cursor (`.cursor/` hooks, rules, and commands) or Claude Code (`.claude/` settings, hooks, and commands) |
| Claude pipeline | The hands-off pipeline below. Requires Claude Code tooling. |

## The hands-off Claude pipeline

With `includeClaudePipeline`, the project is set up so that people who aren't engineers can ask Claude for changes and have them ship without anyone reviewing routine PRs:

1. Someone asks Claude for a change at claude.ai/code, in the Claude mobile app, or with `@claude` on a GitHub issue.
2. Claude works on a `claude/*` branch and opens a PR.
3. Required checks run: lint, typecheck and tests; a Claude review gate that fails on blocking issues; and Playwright with accessibility tests against the Vercel preview. If a check fails, Claude tries to fix it twice before asking an engineer.
4. The PR merges itself, unless it touches protected files listed in CODEOWNERS (CI, config, dependencies, API routes). Those wait for an engineer's approval.
5. Vercel holds the production build while a staging smoke test runs on your staging domain. Production only switches over if it passes.
6. A production smoke test runs after launch. If it fails, the site rolls back automatically and the team gets a GitHub issue.

A monthly workflow also runs the official Next.js upgrade codemod and opens a PR for an engineer to approve. The generated `docs/working-with-claude.md` explains all of this to requesters, and the generated README lists the GitHub and Vercel settings to configure.

## Using kickoff

### Interactive

Run `kickoff` and answer the prompts: project name, site name, production and staging URLs, dev port, brand colors, the options above, and agent tooling. Choosing Claude Code adds the pipeline question. The project is written to `./<project-name>/`, or to the current directory if you choose that.

### Non-interactive

Pass a JSON file with every answer. kickoff rejects missing or unknown keys, and values must be real JSON booleans and numbers.

```sh
kickoff --answers ./answers.json
```

```json
{
  "projectName": "my-new-site",
  "useCurrentDir": false,
  "siteName": "My New Site",
  "prodUrl": "https://www.mynewsite.com",
  "stagingUrl": "https://staging.mynewsite.com",
  "devPort": 3000,
  "primaryColor": "#000000",
  "bgColor": "#ffffff",
  "textColor": "#000000",
  "includeContentful": false,
  "includeI18n": false,
  "includeGA": false,
  "includeResend": false,
  "includeRecaptcha": false,
  "agentTooling": "claude",
  "includeClaudePipeline": true
}
```

The full shape is `ProjectAnswers` in [`src/types.ts`](src/types.ts). `includeClaudePipeline` requires `agentTooling: "claude"`.

| Flag | Meaning |
| --- | --- |
| `--answers <path>` | Load answers from JSON instead of prompting |
| `--force` | Write into a directory that already has files |
| `--dry-run` | Print the files that would be written, without writing them |
| `--verbose` | Log each file as it's written |
| `-h`, `--help` | Show usage |

### After generating

```sh
cd my-new-site
cp .env.local.example .env.local   # or: npx vercel link && npx vercel env pull .env.local
pnpm install
pnpm next:agents-md                # index the Next.js docs into CLAUDE.md
pnpm dev
```

With Contentful, run `pnpm types:contentful` after filling in the Contentful env vars.

## Generating just a handbook

`kickoff handbook` writes a handbook and nothing else.

In an existing repo, kickoff can't know the conventions from templates, so an AI agent studies the code and writes them down. kickoff scans the repo (languages, libraries, package manager, workspace, scripts, existing docs and agent rules), builds a prompt from that, and starts the agent you pick in the repo:

```sh
cd path/to/repo
kickoff handbook                      # pick an installed agent from a list
kickoff handbook --agent claude       # or cursor, codex, gemini
kickoff handbook --agent none | pbcopy  # print the prompt for any other agent
```

The agent reads the configs, the existing docs, and real files in each area, then writes one page per part of the work with examples taken from the code. Every handbook gets the same four pages as a kickoff project: `README.md` (an index of when to read each page), `llms.md` (task and file routing for agents), `non-negotiables.md` (always and never rules), and `glossary.md`. Where the code is inconsistent, the agent lists the question for an engineer instead of picking a rule. It only writes inside the handbook folder.

If the handbook folder already exists, the agent updates it instead of starting over, so you can rerun it after big changes. If kickoff finds another folder with an `llms.md`, it says so; pass `--out` to update that one.

For a new project, `--answers` writes kickoff's own handbook from a JSON answers file, without an agent:

```sh
kickoff handbook --answers ./answers.json
```

| Flag | What it does |
| --- | --- |
| `--agent <name>` | `claude`, `cursor`, `codex`, `gemini`, any CLI that takes a prompt as its first argument, or `none` to print the prompt |
| `--dir <path>` | Repo to document (default: the current directory) |
| `--out <path>` | Handbook folder, relative to `--dir` (default: `docs/handbook`) |
| `--answers <path>` | Write kickoff's handbook for a new project instead |
| `--dry-run` | Show the prompt, or with `--answers` the files, without running anything |

## Setting up a new site

The generated project's README has the full checklist for its setup. In short:

Standard projects use a `staging` default branch and tagged releases:

1. Create the GitHub repo and a `staging` branch as the default. Protect `staging` and `main`, and let GitHub Actions bypass the `main` rules so the release workflow can push to it.
2. Publish a `v0.0.0` release.
3. Generate the project, then push it to `staging`.
4. Create the Vercel project, add every variable from `.env.local.example`, and run `npx vercel env pull .env.local` locally.
5. Release with `make release tag=vX.Y.Z`.

Claude pipeline projects are trunk-based on `main`:

1. Create the repo with `main` as the default branch, turn on auto-merge, and push the generated project.
2. Add a ruleset on `main` with the required checks, Code Owners review, and no bypass. Set the CODEOWNERS team.
3. Install the Claude GitHub App and add the Actions secrets, variables, and `needs-engineer` label from the generated README.
4. Create the Vercel project with Deployment Checks (including Staging Smoke), the production and staging domains, Deployment Protection with an automation bypass secret, and separate production secret values.

## Working in a generated project

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build and sitemap |
| `pnpm lint:all` | Biome on changed files, Stylelint, typecheck, and knip |
| `pnpm test:ci` | Jest |
| `pnpm scaffold MyComponent` | Create a component with its CSS module, interfaces, spec, page object, and test factory |
| `pnpm handbook:check` | Fail if code changed without a matching handbook update |
| `pnpm next:upgrade` | Upgrade Next.js and React to the latest minor with the official codemod |
| `pnpm next:agents-md` | Refresh the Next.js docs index in `CLAUDE.md` |
| `pnpm test:e2e` | Playwright smoke and accessibility tests (pipeline projects) |
| `pnpm types:contentful` | Regenerate Contentful types (Contentful projects) |

The main folders:

```
docs/handbook/      project handbook; agents start at llms.md
src/app/            routes (under src/app/[locale]/ with i18n)
src/components/     components, each with styles, spec and page object
src/copy/           page text and repeated content, kept out of components
src/contentful/     CMS client, getters and parsers (Contentful only)
src/lib/, src/utils/  shared helpers
src/tests/          page objects, factories, mocks
e2e/                Playwright tests (pipeline only)
.github/            CI and, with the pipeline, the Claude workflows and CODEOWNERS
.claude/, .cursor/  agent hooks and settings
```

## Developing kickoff

```
src/index.ts             CLI entry: prompts or --answers, then generateProject
src/generator.ts         writes every file
src/templates/*.ts       file contents for generated projects
scaffold-assets/         hook scripts and test helpers copied into generated projects
fixtures/scaffold-e2e/   answer files for the end-to-end run
```

Templates and the generated handbook (`src/templates/docs.ts`) have to stay in sync. [`AGENTS.md`](AGENTS.md) covers that rule and the conventions generated code follows.

| Command | What it does |
| --- | --- |
| `pnpm build` | Compile to `dist/` |
| `pnpm dev` | Compile in watch mode |
| `pnpm lint` / `pnpm lint:fix` | Biome |
| `pnpm test` | Unit and integration tests, plus a matrix that generates all 96 combinations of tooling and options and checks each one |
| `pnpm test:scaffold-e2e` | Generate each fixture project, install it, run its CI checks, then build, serve and smoke-test the ones without Contentful |

The matrix test (`src/generationMatrix.test.ts`) runs in seconds. For every combination it checks for colliding routes, pages without exactly one `<html>` layout, imports that don't resolve, references to `pnpm` scripts that don't exist, invalid JSON, and TypeScript syntax errors. When you fix a class of generator bug, add a check there.

The end-to-end run is slower and covers each option at least once with a real install. Set `SCAFFOLD_E2E_PLAYWRIGHT=1` to also run the generated Playwright suites for pipeline fixtures. CI does this on every PR to `main`, alongside the build, lint and unit tests.

To release kickoff, run `make release tag=vX.Y.Z` from an up-to-date `staging`. It tags `staging`, pushes the tag, and follows the release workflow, which fast-forwards `main` to the tag and publishes the GitHub release. The workflow needs a `RELEASE_PUSH_TOKEN` repository secret: a personal access token (Contents read/write) whose owner can bypass the `main` ruleset.

## License

MIT
