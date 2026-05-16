# kickoff

> CLI scaffolding tool for Next.js + Contentful + TypeScript projects.

`kickoff` generates a complete, production-ready project scaffold based on battle-tested patterns from real projects. One command gets you a fully configured repo with Contentful CMS integration, TypeScript, Biome linting, Jest testing, CSS Modules, CI/CD, and more.

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

- **i18n** — next-intl
- **Google Analytics** — @next/third-parties GA
- **HubSpot** — @hubspot/api-client
- **Resend** — transactional email
- **reCAPTCHA** — react-google-recaptcha

## Requirements

- Node 18+ (to run the CLI itself)
- pnpm installed globally

## Installation

### Run directly (recommended)

```sh
npx kickoff
```

### Install globally

```sh
npm install -g kickoff
kickoff
```

### Clone & run from source

```sh
git clone <this-repo>
cd kickoff
pnpm install
pnpm build
node dist/index.js
```

## Usage

Running `kickoff` starts an interactive prompt:

```
🚀 kickoff — Next.js + Contentful + TypeScript project scaffolder

? Project name (kebab-case): my-new-site
? Site display name: My New Site
? Production URL: https://www.mynewsite.com
? Staging URL: https://staging.mynewsite.com
? Dev port: 3000
? Primary color hex: #000000
? Background color hex: #ffffff
? Text color hex: #000000
? Include i18n (next-intl)? No
? Include Google Analytics? Yes
? Include HubSpot? No
? Include Resend email? No
? Include reCAPTCHA? No
```

After answering, the scaffold is written to `./<project-name>/`.

## After generation

```sh
cd <project-name>

# Copy and fill in environment variables
cp .env.local.example .env.local
# Edit .env.local with your Contentful space ID, API keys, etc.

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
│   └── workflows/
│       ├── ci.yml          # Runs on PRs to staging
│       └── release.yml     # Triggered by v* tags
├── .jest/
│   ├── setEnvVars.ts
│   └── setupTests.ts
├── public/
├── scripts/
│   ├── make_sitemap.js
│   ├── scaffold.sh         # Component scaffolder
│   └── tsconfig.json
├── src/
│   ├── @types/
│   ├── app/                # Next.js App Router
│   │   ├── [slug]/         # Dynamic page route
│   │   ├── api/draft/      # Contentful draft mode
│   │   └── api/disable-draft/
│   ├── components/         # Starter components
│   ├── contentful/         # Client, helpers, cache config
│   ├── hooks/
│   ├── interfaces/
│   ├── lib/                # Schema, sitemap generation
│   ├── styles/             # globals.css, variables.css
│   ├── tests/              # Mocks, base page object, test utils
│   └── utils/              # Constants, helpers
├── .env.local.example
├── biome.json
├── jest.config.ts
├── next.config.ts
├── package.json
├── stylelint.config.ts
└── tsconfig.json
```

## Component scaffolding

Once inside a generated project, create a new component with:

```sh
pnpm scaffold MyComponent
```

This creates:
- `MyComponent.component.tsx`
- `MyComponent.module.css`
- `MyComponent.interfaces.ts`
- `MyComponent.spec.tsx`
- `MyComponent.po.tsx`
- `MyComponent.factory.ts`

## Environment variables

See `.env.local.example` in the generated project for the full list. Key variables:

| Variable | Description |
|---|---|
| `CONTENTFUL_SPACE_ID` | Your Contentful space ID |
| `CONTENTFUL_CONTENT_DELIVERY_API_KEY` | CDA token |
| `CONTENTFUL_PREVIEW_API_KEY` | Preview API token |
| `CONTENTFUL_PREVIEW_SECRET` | Secret for draft mode |
| `CONTENTFUL_CMA_TOKEN` | CMA token for type generation |
| `ENVIRONMENT` | `local` \| `staging` \| `production` |

## CI / CD

- **CI**: GitHub Actions runs TSC, Biome, Stylelint, and Jest on every PR targeting `staging`.
- **Release**: Push a `v*` tag to trigger a GitHub Release and reset the `main` branch.
- **Deployment**: Configure Vercel to deploy from `staging` (preview) and `main` (production).

## License

MIT
