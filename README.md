# kickoff

> CLI scaffolding tool for Next.js + Contentful + TypeScript projects.

`kickoff` generates a complete, production-ready project scaffold based on battle-tested patterns from real projects. One command gets you a fully configured repo with Contentful CMS integration, TypeScript, Biome linting, Jest testing, CSS Modules, CI/CD, a full handbook, and more.

## Stack

Every generated project includes:

| Concern | Technology |
|---|---|
| Framework | Next.js ^16 (App Router) |
| Language | TypeScript ^6, strict mode |
| CMS | Contentful ^11, draft mode, type generation |
| Package manager | pnpm 10.33.3 |
| Node | 24.15.0 (via asdf `.tool-versions`) |
| Linting | Biome 2.4.15 + Stylelint ^17 |
| Testing | Jest ^30 + Testing Library + ts-jest |
| Styling | CSS Modules + PostCSS Preset Env |
| SVG | @svgr/webpack |
| Data fetching | @tanstack/react-query ^5 |
| Forms | react-hook-form ^7 |
| Schema | schema-dts (JSON-LD) |
| Deployment | Vercel |
| CI | GitHub Actions (PRs to `staging`) |

Optional add-ons selected during prompts:

- **i18n** — next-intl with `[locale]` App Router structure
- **Google Analytics** — @next/third-parties GA
- **Resend** — transactional email
- **reCAPTCHA** — react-google-recaptcha
- **Agent hooks** — Cursor (`.cursor/`) or Claude Code (`.claude/`) handbook-enforcement hooks

## Requirements

- Node 18+ (to run the CLI itself)
- pnpm installed globally

## Installation

### Link from source (recommended until published)

```sh
cd /path/to/kickoff
pnpm install
pnpm build
pnpm test   # generator integration tests (Vitest)
pnpm test:scaffold-e2e   # E2E: scaffold fixtures + run generated project CI checks
npm link
```

Then run from anywhere:

```sh
kickoff
```

To unlink: `npm unlink -g kickoff`

### Run directly without linking

```sh
node /path/to/kickoff/dist/index.js
```

### Shell alias

Add to your `~/.zshrc` or `~/.bashrc`:

```sh
alias kickoff="node /path/to/kickoff/dist/index.js"
```

## Greenfield prerequisites (outside the codebase)

When you spin up a **new** client project—not day-to-day work inside an existing repo—do these in order so GitHub Actions, releases, Vercel, and Contentful line up with the scaffold expectations:

1. **GitHub repository** — Create an empty repo for the new site (no conflicting default branch/commit if you plan to overwrite history with the scaffold).
2. **`staging` as default branch** — Create `staging`, set it as the **default branch** under repository settings so PRs target it (CI runs on PRs into `staging`).
3. **Branch protection** — For `staging` and `main`, add rules appropriate to your team: require pull requests before merge, required status checks (include the CI workflow once it exists), block force-push, restrict who can dismiss reviews, etc.
4. **Initial GitHub Release** — Manually create a **`v0.0.0`** (or earliest) **Release** once the repo exists. The generated **`create-release`** workflow builds on tagged releases/changelog tooling; seeding avoids first-tag quirks.
5. **Run kickoff and update the repo** — Run `kickoff` locally, then commit and push the scaffold to `staging` (and ensure `main` exists if your flow expects it—you can align `main` with your branching policy).
6. **Contentful** — Create a space/environment, add content types, and gather tokens so you can fill **Contentful** entries in **`.env.local.example`** (see **After generation** and the generated project README).
7. **Vercel project and env** — Create a Vercel project linked to this GitHub repo. Map preview vs production (PRs/`staging` → preview, **`main`** → production). In **Settings → Environment Variables**, add **every** variable named in **`.env.local.example`**, for each scope you use (Preview / Development / Production), using the same names as the example file.
8. **Pull env into the repo** — From the project directory, run **`npx vercel link`** once so the CLI is tied to that Vercel project, then **`npx vercel env pull .env.local`** to download values into **`.env.local`** (gitignored). Run **pull** again whenever Vercel env changes.

After the repo exists, operators and collaborators use the **generated** project `README.md` for the full host-by-host checklist wording.

## Usage

Running `kickoff` starts an interactive prompt:

```
🚀 kickoff — Next.js + TypeScript project scaffolder

? Project name (kebab-case): my-new-site
? Scaffold into the current directory instead of a new subfolder? No
? Site display name: My New Site
? Production URL: https://www.mynewsite.com
? Staging URL: https://staging.mynewsite.com
? Dev port: 3000
? Primary color hex: #000000
? Background color hex: #ffffff
? Text color hex: #000000
? Include Contentful CMS? (no = static / API-only; skips CMS layer, draft routes, types codegen) Yes
? Include i18n (next-intl)? No
? Include Google Analytics? Yes
? Include Resend email? No
? Include reCAPTCHA? No
? Agent tooling (project hooks for handbook enforcement)? Cursor
```

Choose **Cursor** for `.cursor/hooks.json`, hook scripts, and `rules/handbook.mdc`. Choose **Claude Code** for `.claude/settings.json` and hook scripts. Both sets enforce the same handbook rules (no added comments, CSS conventions, `pnpm scaffold` for new components, handbook sync).

After answering, the scaffold is written to `./<project-name>/` (or the current directory if selected).

### Non-interactive (CI / scripts)

Pass a JSON file whose keys match `ProjectAnswers` in this repo’s [`src/types.ts`](src/types.ts) (all fields required; use JSON booleans and numbers, not strings):

```sh
kickoff --answers ./answers.json
```

Useful flags:

| Flag | Meaning |
|------|--------|
| `--answers <path>` | Skip prompts; load answers from JSON |
| `--force` | Allow writing when the target directory already has files |
| `--dry-run` | Print paths that would be written; no files created |
| `--verbose` | Log each file as it is written |
| `-h`, `--help` | Show usage |

Example `answers.json`:

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
  "includeContentful": true,
  "includeI18n": false,
  "includeGA": false,
  "includeResend": false,
  "includeRecaptcha": false,
  "agentTooling": "cursor"
}
```

`agentTooling` is `"cursor"` (`.cursor/` hooks + rules) or `"claude"` (`.claude/settings.json` hooks).

`--dry-run` still applies the same non-empty directory rules as a real run; use `--force` if you need to preview writes into an existing directory.

```sh
cd <project-name>

# Env: copy the example, then either fill by hand or sync from Vercel (after link + env pull)
cp .env.local.example .env.local

# Optional — if vars live in Vercel already:
# npx vercel link
# npx vercel env pull .env.local

# Install dependencies
pnpm install

# Generate Contentful TypeScript types
pnpm types:contentful

# Start the dev server
pnpm dev
```

## Generated project structure

```
<project-name>/
├── .github/
│   ├── labeler.yml
│   └── workflows/
│       ├── ci.yml              # Runs on PRs to staging
│       ├── labeler.yml
│       └── release.yml         # Triggered by v* tags
├── .jest/
│   ├── setEnvVars.ts
│   └── setupTests.ts
├── docs/
│   └── handbook/               # 11-chapter project handbook + llms.md
├── public/
│   └── sitemap-index.xml
├── scripts/
│   ├── lib/
│   │   └── preview-local.ts
│   ├── dev-with-preview.ts     # Opens draft mode after dev starts
│   ├── make_sitemap.js
│   ├── scaffold.sh             # Component scaffolder
│   ├── tsconfig.json
│   ├── verify-vercel-for-release.sh
│   └── verify-vercel-release.ts
├── src/
│   ├── @types/
│   │   └── react.d.ts
│   ├── app/                    # Next.js App Router
│   │   ├── [slug]/
│   │   ├── api/
│   │   │   ├── disable-draft/
│   │   │   └── draft/
│   │   ├── refresh-content/
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── manifest.ts
│   │   ├── not-found.tsx
│   │   ├── page.tsx
│   │   ├── providers.tsx
│   │   └── robots.ts
│   ├── api/                    # Fetch helpers and typed API surface
│   │   ├── helpers.ts
│   │   └── urls.ts
│   ├── components/
│   │   ├── ExitDraftModeLink/
│   │   ├── Footer/
│   │   ├── Navigation/
│   │   └── NotFoundPage/
│   ├── contentful/             # Client, helpers, cache, parsers
│   │   ├── types/              # Generated — do not edit
│   │   ├── cacheConfig.ts
│   │   ├── cacheKeys.ts
│   │   ├── client.ts
│   │   ├── contentfulPagination.ts
│   │   ├── helpers.ts
│   │   ├── parseContentfulAsset.ts
│   │   └── richText.tsx
│   ├── copy/
│   │   └── global.ts           # Static copy strings
│   ├── hooks/
│   │   └── useIsBrowser.ts
│   ├── interfaces/
│   │   └── common.interfaces.ts
│   ├── lib/
│   │   ├── generateSitemap.ts
│   │   └── schema.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── runtime-variables.json
│   │   └── variables.css
│   ├── tests/
│   │   ├── factories/
│   │   │   ├── BaseFactory.ts
│   │   │   └── RichTextDocument.factory.ts
│   │   ├── mocks/
│   │   ├── basePageObject.po.ts
│   │   └── test-utils.tsx
│   ├── types/
│   │   └── KeysMatch.ts
│   ├── utils/
│   │   ├── array.helpers.ts + spec
│   │   ├── constants.ts
│   │   ├── contentful.helpers.ts
│   │   ├── environment.helpers.ts + spec
│   │   ├── factory.helpers.ts
│   │   ├── string.helpers.ts + spec
│   │   ├── style.helpers.ts
│   │   └── url.helpers.ts + spec
│   └── proxy.ts
├── .browserslistrc
├── .editorconfig
├── .env.local.example
├── .gitignore
├── .npmrc
├── .tool-versions
├── biome.json
├── CLAUDE.md                   # Agent instructions
├── cssprops.d.ts
├── jest.config.ts
├── knip.json
├── Makefile
├── next.config.ts
├── package.json
├── pnpm-workspace.yaml
├── postcss.config.json
├── README.md
├── stylelint.config.mjs
└── tsconfig.json
```

Generated projects also include **either** `.cursor/` (hooks + rules) **or** `.claude/` (settings + hooks), depending on `agentTooling`. TypeScript is pinned to **^6.0.x** until Next.js 16.3.

Omit Contentful-specific paths (`src/contentful/`, draft API routes) when `includeContentful` is false. Omit `src/i18n/` and `src/app/[locale]/` when i18n is off.

## Developing kickoff

| Script | Description |
|---|---|
| `pnpm build` | Compile kickoff to `dist/` |
| `pnpm dev` | TypeScript watch |
| `pnpm lint` / `pnpm lint:fix` | Biome on this repo |
| `pnpm test` | Vitest (generator + validation tests) |
| `pnpm test:scaffold-e2e` | E2E: generate `fixtures/scaffold-e2e/*.json` projects and run their `tsc:ci`, `lint:ci`, `lint:css`, `test:ci` |

**CI** (`.github/workflows/ci.yml` on PRs to `main`):

- **Build/Lint** — `pnpm build`, `pnpm lint:ci`, `pnpm test`
- **Scaffold E2E** — `pnpm build`, `pnpm test:scaffold-e2e`

Fixture answers live in [`fixtures/scaffold-e2e/`](fixtures/scaffold-e2e/) (`cursor-static.json`, `claude-static.json`).

## Component scaffolding

Once inside a generated project, create a new component with:

```sh
pnpm scaffold MyComponent
```

This creates:
- `src/components/MyComponent/MyComponent.component.tsx`
- `src/components/MyComponent/MyComponent.module.css`
- `src/components/MyComponent/MyComponent.interfaces.ts`
- `src/components/MyComponent/MyComponent.spec.tsx`
- `src/components/MyComponent/MyComponent.po.tsx`
- `src/tests/factories/MyComponent.factory.ts`

## Environment variables

See `.env.local.example` in the generated project for the full list. For deployments and local parity, add **every** name from that file in the Vercel project’s **Environment Variables**, then run **`npx vercel link`** and **`npx vercel env pull .env.local`** in the repo (see **Greenfield prerequisites** above). Key variables:


| Variable | Description |
|---|---|
| `CONTENTFUL_SPACE_ID` | Your Contentful space ID |
| `CONTENTFUL_CONTENT_DELIVERY_API_KEY` | CDA token |
| `CONTENTFUL_PREVIEW_API_KEY` | Preview API token |
| `CONTENTFUL_PREVIEW_SECRET` | Secret for draft mode |
| `CONTENTFUL_CMA_TOKEN` | CMA token for type generation |
| `ENVIRONMENT` | `staging` \| `production` |
| `ENABLE_EXPERIMENTAL_COREPACK` | Set to `1` in Vercel so installs use Corepack and the `packageManager` version in `package.json` ([Vercel Corepack](https://vercel.com/changelog/corepack-experimental-is-now-available)) |

## CI / CD

### Generated projects

- **CI**: GitHub Actions runs TSC, Biome, Stylelint, and Jest on every PR targeting `staging`.
- **Release**: Push a `v*` tag to trigger a GitHub Release and reset the `main` branch.
- **Deployment**: Configure Vercel to deploy from `staging` (preview) and `main` (production); keep env in sync with **`vercel env pull`** when you change Vercel settings.

### This repo (kickoff)

- **CI**: PRs to `main` run unit tests plus scaffold E2E (see **Developing kickoff**).
- **Release**: `make release tag=v1.0.0` pushes a tag and creates a GitHub release.

## Releasing kickoff itself

```sh
make release tag=v1.0.0
```

Pushes the tag → triggers `.github/workflows/release.yml` → creates a GitHub release.

## License

MIT
