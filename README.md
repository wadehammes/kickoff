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

## Requirements

- Node 18+ (to run the CLI itself)
- pnpm installed globally

## Installation

### Link from source (recommended until published)

```sh
cd /path/to/kickoff
pnpm install
pnpm build
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

## Usage

Running `kickoff` starts an interactive prompt:

```
🚀 kickoff — Next.js + Contentful + TypeScript project scaffolder

? Project name (kebab-case): my-new-site
? Scaffold into the current directory instead of a new subfolder? No
? Site display name: My New Site
? Production URL: https://www.mynewsite.com
? Staging URL: https://staging.mynewsite.com
? Dev port: 3000
? Primary color hex: #000000
? Background color hex: #ffffff
? Text color hex: #000000
? Include i18n (next-intl)? No
? Include Google Analytics? Yes
? Include Resend email? No
? Include reCAPTCHA? No
```

After answering, the scaffold is written to `./<project-name>/` (or the current directory if selected).

## After generation

```sh
cd <project-name>

# Copy and fill in environment variables
cp .env.local.example .env.local

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
├── stylelint.config.ts
└── tsconfig.json
```

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

See `.env.local.example` in the generated project for the full list. Key variables:

| Variable | Description |
|---|---|
| `CONTENTFUL_SPACE_ID` | Your Contentful space ID |
| `CONTENTFUL_CONTENT_DELIVERY_API_KEY` | CDA token |
| `CONTENTFUL_PREVIEW_API_KEY` | Preview API token |
| `CONTENTFUL_PREVIEW_SECRET` | Secret for draft mode |
| `CONTENTFUL_CMA_TOKEN` | CMA token for type generation |
| `ENVIRONMENT` | `staging` \| `production` |

## CI / CD

- **CI**: GitHub Actions runs TSC, Biome, Stylelint, and Jest on every PR targeting `staging`.
- **Release**: Push a `v*` tag to trigger a GitHub Release and reset the `main` branch.
- **Deployment**: Configure Vercel to deploy from `staging` (preview) and `main` (production).

## Releasing kickoff itself

```sh
make release tag=v1.0.0
```

Pushes the tag → triggers `.github/workflows/release.yml` → creates a GitHub release.

## License

MIT
