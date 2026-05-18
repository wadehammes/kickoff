import type { ProjectAnswers } from "../types.js";

// ---------------------------------------------------------------------------
// CLAUDE.md
// ---------------------------------------------------------------------------

export function getClaude(a: ProjectAnswers): string {
  const cmsClause = a.includeContentful ? "Contentful/CMS changes, " : "";
  return `# Agent instructions

Before **substantive** work in this repo—features, refactors, ${cmsClause}patterns that touch the App Router or API routes, CI or env, analytics—read **\`docs/handbook/README.md\`** and the handbook **chapter** that matches the task. Use **\`docs/handbook/llms.md\`** for a compact task→chapter map (helpful for routing or for pasting into other tools).

Follow documented patterns.

**Keep the handbook accurate:** Whenever a change would make the handbook wrong or incomplete—new flows (CI, env, tags), moved files, scaffold or convention changes, Contentful/parser patterns, or anything a future reader would be misled by—update the relevant **\`docs/handbook/*.md\`** in the **same PR** when practical, or in a small follow-up right away. Do not leave docs stale on purpose.

You can skip a full handbook pass for **narrow** edits (typos, single obvious lines, mechanical fixes) that do not change behavior or documented expectations.
`;
}

// ---------------------------------------------------------------------------
// README.md (generated project)
// ---------------------------------------------------------------------------

export function getReadme(a: ProjectAnswers): string {
  const prereqBlock = a.includeContentful
    ? `6. **Contentful space** — Provision the space/environment, create or import content types (\`Page\`, etc.), and collect the tokens you need for the **Contentful** variables in **\`.env.local.example\`** (then see **[Contentful setup](#contentful-setup)**).
7. **Vercel project and env** — Create a Vercel project linked to this repository. Map **preview** deployments to PRs /\`staging\` and **production** to **\`main\`** (see [Deployment](#deployment)). In the Vercel dashboard, add **every** variable listed in **\`.env.local.example\`** under **Environment Variables**, for each scope you rely on (Preview / Development / Production), matching the example file names.
8. **Pull env into this repo** — In your local clone, run **\`npx vercel link\`** once so the CLI targets the right project, then **\`npx vercel env pull .env.local\`** to sync secrets into **\`.env.local\`**. Re-run **pull** when values change in Vercel; keep **\`.env.local\`** out of version control.`
    : `6. **Vercel project and env** — Create a Vercel project linked to this repository. Map **preview** deployments to PRs /\`staging\` and **production** to **\`main\`** (see [Deployment](#deployment)). In the Vercel dashboard, add **every** variable listed in **\`.env.local.example\`** under **Environment Variables**, for each scope you rely on (Preview / Development / Production), matching the example file names.
7. **Pull env into this repo** — In your local clone, run **\`npx vercel link\`** once so the CLI targets the right project, then **\`npx vercel env pull .env.local\`** to sync secrets into **\`.env.local\`**. Re-run **pull** when values change in Vercel; keep **\`.env.local\`** out of version control.`;

  const gettingStartedExtra = a.includeContentful
    ? `
# Generate Contentful TypeScript types (requires CONTENTFUL_SPACE_ID + CONTENTFUL_CMA_TOKEN in .env.local)
pnpm types:contentful
`
    : "";

  const scriptsTypesRow = a.includeContentful
    ? "| `pnpm types:contentful` | Regenerate `src/contentful/types/` from Contentful space |\n"
    : "";

  const devPreviewDesc = a.includeContentful
    ? "Start dev server and auto-open Contentful draft mode"
    : "Start dev server (starts Next only—no CMS draft URL)";

  const contentfulSection = a.includeContentful
    ? `## Contentful setup

1. Create a Contentful space and add a \`Page\` content type
2. Fill in \`CONTENTFUL_SPACE_ID\`, \`CONTENTFUL_CONTENT_DELIVERY_API_KEY\`, \`CONTENTFUL_PREVIEW_API_KEY\`, \`CONTENTFUL_PREVIEW_SECRET\`, and \`CONTENTFUL_CMA_TOKEN\` in \`.env.local\`
3. Run \`pnpm types:contentful\` to generate TypeScript types in \`src/contentful/types/\`
4. Add getters in \`src/contentful/get*.ts\` and parsers in \`src/contentful/parse*.ts\`

See \`docs/handbook/contentful.md\` for full guidance.

`
    : "";

  const draftSection = a.includeContentful
    ? `## Draft mode

Visit \`/api/draft?previewSecret=YOUR_SECRET&redirect=/\` to enable draft mode.
Visit \`/api/disable-draft\` to exit.

Or use \`pnpm dev:preview\` which auto-opens draft mode after the server starts.

`
    : "";

  return `# ${a.siteName}

## Prerequisites (greenfield bootstrap)

These steps happen **outside application code**: GitHub repository settings, the **kickoff** scaffolding CLI on your machine,${a.includeContentful ? " Vercel, and Contentful." : " and Vercel."} Work through them once when standing up this repo—not for every contributor clone.

If you joined an existing project, skip ahead to **[Getting started](#getting-started)**.

1. **GitHub repository** — Create the repo your team will use for this site.
2. **\`staging\` as default branch** — Create a \`staging\` branch and set it as the **default** branch (\`Settings\` → \`General\`). CI runs on pull requests targeting \`staging\`.
3. **Branch protection** — Protect \`staging\` and \`main\` with rules your org requires—for example require PRs before merge, **required status checks** (once \`.github/workflows/ci.yml\` exists, require that workflow), block force-push, and approver counts as needed.
4. **Initial GitHub Release** — In **Releases**, manually publish **\`v0.0.0\`** (or similar first tag). The \`create-release\` workflow (triggered when you push \`v*\` tags) and changelog generation assume there is existing release/tag history so the first prod release behaves predictably.
5. **Scaffold with kickoff and push** — From your machine, run the **kickoff** CLI that generated this scaffold, compare or regenerate if needed, then commit and push the tree to **\`staging\`** (\`git push origin staging\`) following your branching rules.
${prereqBlock}

## Getting started

\`\`\`sh
# Environment variables: start from the example, then edit by hand and/or sync from Vercel
cp .env.local.example .env.local

# After Vercel stores the same keys (see Prerequisites), you can pull instead of pasting:
# npx vercel link
# npx vercel env pull .env.local

# Install dependencies
pnpm install
${gettingStartedExtra}# Start dev server on port ${a.devPort}
pnpm dev
\`\`\`

## Scripts

| Command | Description |
|---|---|
| \`pnpm dev\` | Start Next.js dev server on port ${a.devPort} |
| \`pnpm dev:preview\` | ${devPreviewDesc} |
| \`pnpm build\` | Production build + generate sitemap |
| \`pnpm start\` | Start production server |
| \`pnpm tsc:ci\` | TypeScript strict check |
| \`pnpm lint\` | Run Biome linter |
| \`pnpm lint:fix\` | Auto-fix Biome lint issues |
| \`pnpm lint:css\` | Run Stylelint |
| \`pnpm lint:css:fix\` | Auto-fix Stylelint issues |
| \`pnpm test:ci\` | Run Jest test suite |
${scriptsTypesRow}| \`pnpm scaffold MyComponent\` | Scaffold a new component with all standard files |

${contentfulSection}${draftSection}## Component scaffolding

\`\`\`sh
pnpm scaffold MyComponent
\`\`\`

Creates:
- \`src/components/MyComponent/MyComponent.component.tsx\`
- \`src/components/MyComponent/MyComponent.module.css\`
- \`src/components/MyComponent/MyComponent.interfaces.ts\`
- \`src/components/MyComponent/MyComponent.spec.tsx\`
- \`src/components/MyComponent/MyComponent.po.tsx\`
- \`src/tests/factories/MyComponent.factory.ts\`

## Handbook

Project conventions, architecture, and patterns are documented in \`docs/handbook/\`.
See \`docs/handbook/README.md\` for the index or \`docs/handbook/llms.md\` for a task→chapter map.

## Deployment

- Connect your repository to [Vercel](https://vercel.com)
- Add **all** env vars from \`.env.local.example\` to Vercel (**Settings** → **Environment Variables**) for the Preview / Development / Production scopes you use
- Locally, use **\`npx vercel link\`** and **\`npx vercel env pull .env.local\`** to mirror those values into \`.env.local\` (see **[Prerequisites (greenfield bootstrap)](#prerequisites-greenfield-bootstrap)**)
- PRs to \`staging\` → preview deployments
- Merge to \`main\` → production deployment at ${a.prodUrl}

## Releases

\`\`\`sh
make release tag=v1.0.0
\`\`\`

Runs the Vercel membership check, pushes the tag → triggers the release workflow → creates a GitHub Release and resets \`main\`.

## CI

PRs to \`staging\` run: TypeScript strict check, Biome lint, Stylelint, Jest tests.
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/README.md
// ---------------------------------------------------------------------------

export function getHandbookReadme(a: ProjectAnswers): string {
  const s = a.siteName;
  const introSecond = a.includeContentful
    ? "how Contentful feeds the UI"
    : "how the app is structured";

  const howToRead = a.includeContentful
    ? `1. **Orientation** — [architecture.md](architecture.md): stack, folders, App Router, and how data gets from Contentful to the screen.
2. **Day-to-day coding** — [conventions.md](conventions.md): TypeScript, React, CSS, tests, accessibility.
3. **CMS work** — [contentful.md](contentful.md): types, getters, parsers, sections and content blocks.
4. **UI structure** — [components.md](components.md): folders, files, tests.
5. **App patterns** — [patterns.md](patterns.md): App Router data loading, React Query, API routes, forms, SEO.
6. **Operations & tooling** — [platform.md](platform.md): CI, env, and \`proxy.ts\`.
7. **Analytics & tags** — [integrations.md](integrations.md): GA, data layer, third parties.
8. **Sitemaps** — [distribution.md](distribution.md): sitemap generation and public output.
9. **Where things live** — [source-layout.md](source-layout.md): interfaces, \`src/utils\`, \`src/lib\`.`
    : `1. **Orientation** — [architecture.md](architecture.md): stack, folders, App Router.
2. **Day-to-day coding** — [conventions.md](conventions.md): TypeScript, React, CSS, tests, accessibility.
3. **UI structure** — [components.md](components.md): folders, files, tests.
4. **App patterns** — [patterns.md](patterns.md): App Router data loading, React Query, API routes, forms, SEO.
5. **Operations & tooling** — [platform.md](platform.md): CI, env, and \`proxy.ts\`.
6. **Analytics & tags** — [integrations.md](integrations.md): GA, data layer, third parties.
7. **Sitemaps** — [distribution.md](distribution.md): sitemap generation and public output.
8. **Where things live** — [source-layout.md](source-layout.md): interfaces, \`src/utils\`, \`src/lib\`.`;

  const indexTable = a.includeContentful
    ? `| [architecture.md](architecture.md) | Tech stack, directory map, \`src/app\`, data flow, key config. Start here. |
| [conventions.md](conventions.md) | TypeScript, Biome, CSS Modules, testing, test IDs, accessibility, comments, editor, React Query hook rules. |
| [contentful.md](contentful.md) | Generated types, getters, parsers, sections vs modules, Rich Text, client. |
| [components.md](components.md) | Component folder layout, \`pnpm scaffold\`, test IDs, exports, dynamic imports, links. |
| [patterns.md](patterns.md) | Server components, serialization, React Query, \`src/api\`, forms, layout, metadata, JSON-LD. |
| [platform.md](platform.md) | GitHub CI, common \`pnpm\` scripts, \`next.config\` (env, redirects), draft mode APIs, \`src/proxy.ts\`. |
| [integrations.md](integrations.md) | Google Analytics, data layer, related env. |
| [distribution.md](distribution.md) | Sitemap generation and \`public/\` output. |
| [source-layout.md](source-layout.md) | \`src/interfaces\`, \`src/utils\` map, \`src/lib\`. |
| [llms.md](llms.md) | Task-to-chapter routing for tools; copy-paste blurb for non-Cursor agents. |`
    : `| [architecture.md](architecture.md) | Tech stack, \`src/app\`, key config. Start here. |
| [conventions.md](conventions.md) | TypeScript, Biome, CSS Modules, testing, test IDs, accessibility, comments, editor, React Query hook rules. |
| [components.md](components.md) | Component folder layout, \`pnpm scaffold\`, test IDs, exports, dynamic imports, links. |
| [patterns.md](patterns.md) | Server components, serialization, React Query, \`src/api\`, forms, layout, metadata, JSON-LD. |
| [platform.md](platform.md) | GitHub CI, common \`pnpm\` scripts, \`next.config\` (env, redirects), \`src/proxy.ts\`. |
| [integrations.md](integrations.md) | Google Analytics, data layer, related env. |
| [distribution.md](distribution.md) | Sitemap generation and \`public/\` output. |
| [source-layout.md](source-layout.md) | \`src/interfaces\`, \`src/utils\` map, \`src/lib\`. |
| [llms.md](llms.md) | Task-to-chapter routing for tools; copy-paste blurb for non-Cursor agents. |`;

  const devSetupPrereq = a.includeContentful
    ? "GitHub, Vercel, Contentful"
    : "GitHub, Vercel";

  return `# ${s} handbook

This is the **${s} handbook**: how the site is put together, how we write code, ${introSecond}, and where to look when you are debugging or adding a feature.

You do not have to read everything in one sitting. Skim the index, bookmark what you need, and come back when you touch that area. **Do keep these docs honest**—when behavior in the repo changes, update the matching page here so the next person (or tool) is not led astray.

**For tools and LLMs** (custom GPTs, other agents): **[llms.md](llms.md)** is a compact **task → chapter** map and a short copy-paste instruction blurb.

## How to read this handbook

The order below is the path we recommend for a full onboarding. If you are in a hurry, read **[architecture.md](architecture.md)** first, then jump to the chapter that matches your task.

${howToRead}

## Index of docs

| File | What it covers |
|------|----------------|
${indexTable}

## Development setup

Ordered **greenfield prerequisites** (${devSetupPrereq}) and everyday machine setup (ASDF, pnpm, env pull, first \`pnpm dev\`) live in the root **[README.md](../../README.md)**.
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/llms.md
// ---------------------------------------------------------------------------

export function getHandbookLlms(a: ProjectAnswers): string {
  const s = a.siteName;

  const taskRows = a.includeContentful
    ? `| Stack, folders, App Router layout, Contentful → page render flow | [architecture.md](architecture.md) |
| TypeScript / React style, Biome, CSS Modules, tests, test IDs, a11y, \`next/image\`, React Query hooks | [conventions.md](conventions.md) |
| Contentful types/codegen, getters, parsers, sections vs content blocks, ContentRenderer, Rich Text | [contentful.md](contentful.md) |
| Component folder layout, \`pnpm scaffold\`, exports, dynamic imports, internal/external links | [components.md](components.md) |
| Server components, caching, React Query, \`src/api\`, forms, metadata / JSON-LD | [patterns.md](patterns.md) |
| CI, \`pnpm\` scripts, \`next.config\` (env, redirects), draft APIs, \`src/proxy.ts\` | [platform.md](platform.md) |
| Google Analytics, \`dataLayer\`, client analytics | [integrations.md](integrations.md) |
| Sitemaps, \`public/\` XML output | [distribution.md](distribution.md) |
| \`src/interfaces\`, \`src/utils\` map, \`src/lib\` | [source-layout.md](source-layout.md) |`
    : `| Stack, folders, App Router layout | [architecture.md](architecture.md) |
| TypeScript / React style, Biome, CSS Modules, tests, test IDs, a11y, \`next/image\`, React Query hooks | [conventions.md](conventions.md) |
| Component folder layout, \`pnpm scaffold\`, exports, dynamic imports, internal/external links | [components.md](components.md) |
| Server components, caching, React Query, \`src/api\`, forms, metadata / JSON-LD | [patterns.md](patterns.md) |
| CI, \`pnpm\` scripts, \`next.config\` (env, redirects), \`src/proxy.ts\` | [platform.md](platform.md) |
| Google Analytics, \`dataLayer\`, client analytics | [integrations.md](integrations.md) |
| Sitemaps, \`public/\` XML output | [distribution.md](distribution.md) |
| \`src/interfaces\`, \`src/utils\` map, \`src/lib\` | [source-layout.md](source-layout.md) |`;

  const prereqOutside = a.includeContentful
    ? "Greenfield prerequisites (GitHub, Vercel, Contentful bootstrap order); local install, env, first run"
    : "Greenfield prerequisites (GitHub, Vercel bootstrap order); local install, env, first run";

  return `# Handbook routing (for tools and LLMs)

Use this page to choose **which markdown file to read first**. It mirrors the full handbook index in **[README.md](README.md)**—paste the relevant paths (or this whole file) into custom GPT instructions, other agents, or docs that do not load Cursor rules.

**Convention:** paths are relative to \`docs/handbook/\`.

<!-- site: ${s} -->

## Task → chapter

| Task or question | Read first |
|------------------|------------|
${taskRows}

## Outside this folder

| Task | Location |
|------|----------|
| ${prereqOutside} | Repo root **[README.md](../../README.md)** |
| Agent defaults (read handbook, keep it updated) | Repo root **[CLAUDE.md](../../CLAUDE.md)** |

## Suggested instruction blurb (copy-paste)

\`\`\`text
Before substantive edits, read docs/handbook/README.md and the chapter that matches the task (see docs/handbook/llms.md for a task→chapter map). When your change affects behavior, setup, or how features should be built, update the relevant docs/handbook/*.md in the same PR or an immediate follow-up so the handbook stays accurate.
\`\`\`
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/architecture.md
// ---------------------------------------------------------------------------

export function getHandbookArchitecture(a: ProjectAnswers): string {
  const s = a.siteName;
  if (!a.includeContentful) {
    return `# Architecture

If you are new here, this page is your map. It explains how the site is structured, which technologies we rely on, and how the App Router renders UI.

<!-- site: ${s} -->

## Tech stack

- **Framework**: Next.js 16 with the **App Router**. Routes live under \`src/app/\`.
- **UI**: React 19, TypeScript.
- **Data**: Server Components for request/build-time data; **React Query** for client mutations. This scaffold was generated **without** Contentful.
- **Styling**: **CSS Modules** with tokens in \`src/styles/globals.css\`.
- **Tooling**: pnpm, Biome, Stylelint, Jest.

## Config and deployment

- **\`next.config.ts\`** — env exposure, images, Turbopack/SVG rules, security headers, redirects.
- **\`biome.json\`** — lint and format. Run \`pnpm lint\`, \`pnpm lint:fix\`.
- **Branching**: Default branch is \`staging\`. Releases use \`make release tag=vX.X.X\`.
- **Provisioning**: Greenfield steps (GitHub, Vercel) live in the repo root **README** under **Prerequisites (greenfield bootstrap)**.
`;
  }

  return `# Architecture

If you are new here, this page is your map. It explains how the site is structured, which technologies we rely on, and how a request goes from the App Router through Contentful data to UI.

<!-- site: ${s} -->

## Tech stack

- **Framework**: Next.js 16 with the **App Router**. Routes live under \`src/app/\` (\`page.tsx\`, \`layout.tsx\`, Route Handlers under \`src/app/api/\`).
- **UI**: React 19, TypeScript.
- **CMS**: Contentful. Content types are generated into \`src/contentful/types/\`; getters and parsers live in \`src/contentful/\`.
- **Data fetching**: Server Components and Contentful getters at request/build time; **React Query** (TanStack) for client-side mutations and any future client queries. Mutation hooks live in \`src/hooks/mutations/\` and call the API surface in \`src/api/urls.ts\`.
- **Styling**: **CSS Modules** (\`.module.css\`) with modern CSS (nesting, custom properties). Global tokens and reset live in \`src/styles/globals.css\`.
- **Tooling**: pnpm, Biome for lint and format, Stylelint for CSS, Jest for tests (page-object pattern).

## Directory map

### \`src/app/\`

Next.js App Router entrypoints.

- **\`layout.tsx\`** — Root layout: fonts, global CSS, \`Providers\`, navigation, footer, draft-mode UI, analytics when configured.
- **\`page.tsx\`** — Home route; nested folders define segments (e.g. \`[slug]/page.tsx\` for CMS pages).
- **\`api/**/route.ts\`** — Route Handlers (email, draft mode, Vercel hooks, etc.).
- **\`refresh-content/page.tsx\`** — Token-gated page to trigger a content refresh/redeploy.

### \`src/components/\`

One folder per feature component under \`src/components/<ComponentName>/\`. See [components.md](components.md).

### \`src/contentful/\`

- **Client**: \`src/contentful/client.ts\` — delivery vs preview clients from env.
- **Getters**: \`get*.ts\` files — async functions that call Contentful with \`preview\` flag.
- **Parsers**: \`parse*.ts\` — normalize raw entries into typed app shapes.
- **Cache**: \`cacheConfig.ts\` + \`cacheKeys.ts\` — \`unstable_cache\` wrappers and typed cache keys with Vercel tags.
- **Types**: \`src/contentful/types/\` — generated; run \`pnpm types:contentful\`.

### \`src/hooks/\`

Custom hooks; mutations under \`src/hooks/mutations/\` use React Query and \`src/api/urls.ts\`.

### \`src/api/\`

- **\`urls.ts\`** — \`api\` object for client-side calls to same-origin Route Handlers.
- **\`helpers.ts\`** — \`fetchOptions\`, \`FetchMethods\`, \`fetchResponse\`.

### \`src/lib/\`

Server-oriented helpers: \`generateSitemap.ts\`, \`schema.ts\` (JSON-LD). See [distribution.md](distribution.md).

### \`src/utils/\`

Shared helpers and \`constants.ts\` for slugs and navigation IDs. See [source-layout.md](source-layout.md).

### \`src/types/\`

Shared TypeScript utility types (e.g. \`KeysMatch.ts\`).

### \`src/copy/\`

Static copy strings kept DRY across components (e.g. \`global.ts\`).

### \`src/tests/\`

- \`basePageObject.po.ts\` — base class for page objects.
- \`test-utils.tsx\` — custom \`render\` with app providers.
- \`mocks/\` — Jest doubles for \`next/navigation\`, \`IntersectionObserver\`, \`matchMedia\`.
- \`factories/\` — \`BaseFactory\` + per-type factory classes.

## Data flow

1. A \`page.tsx\` calls Contentful getters with \`preview\` from \`draftMode()\`.
2. Getters return raw entries; parsers produce typed shapes for components.
3. Page components compose layout pieces and pass parsed data into feature components.
4. Forms and interactive flows use React Query mutations and Route Handlers.

\`\`\`mermaid
flowchart LR
  subgraph server [Server / RSC]
    Page[app/.../page.tsx]
    Get[Contentful getters]
    Parse[Parsers]
    Page --> Get --> Parse
  end
  subgraph tree [React tree]
    Comp[Components]
    Parse --> Comp
  end
\`\`\`

## Config and deployment

- **\`next.config.ts\`** — env exposure, images, Turbopack/SVG rules, security headers, redirects.
- **\`biome.json\`** — lint and format (includes CSS). Run \`pnpm lint\`, \`pnpm lint:fix\`.
- **Branching**: Default branch is \`staging\`. Releases use \`make release tag=vX.X.X\`.
- **Provisioning**: Hosting bootstrap (GitHub, Vercel, Contentful) is documented under **Prerequisites (greenfield bootstrap)** in the repo root README.
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/conventions.md
// ---------------------------------------------------------------------------

export function getHandbookConventions(_a: ProjectAnswers): string {
  return `# Conventions

This is the house style: how we format TypeScript and React, how we structure CSS and tests, and the small habits that keep reviews short. The goal is for the repo to read like one careful team wrote it. When something here conflicts with a local shortcut, follow the doc (or open a PR to change the doc if the rule is wrong).

If you are unsure, copy a nearby file that already does the right thing and run **\`pnpm lint\`** before you push.

## TypeScript

- **Blank line after declarations.** After \`const\` / \`let\` declarations in a function or block, leave one blank line before the next statement when that statement is control flow (\`if\`, \`for\`, \`while\`, \`switch\`, \`try\`) or a \`return\`. Do not insert a blank line between consecutive declarations that form one setup block.
- **Use arrow functions always.** Prefer \`const fn = () => {}\` over \`function fn() {}\`.
- **If blocks always use \`{}\`.** Same for \`else\`, \`for\`, \`while\`, and \`do\`—never omit braces for single-line bodies.
- **Never use \`any\`.** Use proper types for all props, state, and function signatures.
- **Components**: Use arrow functions for component definitions (e.g. \`export const MyComponent = (props: Props) => { ... }\`). Do not use \`React.FC\` / \`FC\` or \`function\` declarations.
- **Never use non-null assertion (\`!\`).** Use optional chaining, nullish coalescing (\`??\`), or explicit checks instead.
- **Omit redundant return types.** Do not add an explicit return type annotation when the compiler can infer it. Add return types only when needed for public API clarity or when inference would be wrong or unclear.
- **No nested ternaries.** Use \`if\`/\`else\` or extract to a variable or helper so each branch is clear. A single ternary is fine; nesting is not.
- **No barrel files.** Do not add \`index.ts\` (or \`index.tsx\`) files that re-export from other modules. Import directly from the target module file.
- **Absolute imports (\`src/…\`).** Import application TypeScript and JavaScript modules with paths rooted at \`src/\`. Do not use relative paths (\`./\`, \`../\`) to reach another module under \`src/\` unless an exception below applies.
- **Exceptions to absolute imports:** (1) **CSS Modules** and other static assets co-located with the importing file (e.g. \`import styles from "./MyComponent.module.css"\`). (2) **\`src/contentful/types/\`**—generated; do not hand-edit their import style.
- **Do not re-export types (or values) from another module.** Import from the module that defines them. Never re-export types from a component file so consumers can import from a single place — have them import from the defining module directly.
- **Use a single params object for function parameters.** For any function that takes more than one argument or an optional argument, pass a single object parameter so call sites are self-documenting and order-independent.
- **Use semantic parameter and variable names.** Pick a name that describes what the value *is* — its domain meaning, format, or source — not its lifecycle state. Avoid generic placeholders like \`raw\`, \`data\`, \`val\`, \`tmp\`, \`result\`, \`thing\`. Prefer \`encodedValue\`, \`apiResponse\`, \`candidateSlug\`, \`trimmedDescription\`.
- **Contentful types**: Content types are generated into \`src/contentful/types/\` (run \`pnpm types:contentful\` with Contentful env vars set). Do not edit generated types by hand — for any reason.
- **Contentful ordering**: Do not sort or alphabetize Contentful data in the app. Order at fetch time via the Contentful API \`order\` parameter.
- **App-level types**: Shared slugs, navigation IDs, and similar **constants** live in \`src/utils/constants.ts\`. Feature-scoped interfaces live under \`src/interfaces/\`. Prefer colocating types with a feature when they are not cross-cutting.
- **API and forms**: When adding new API or form payloads, define interfaces in the relevant module, next to \`src/api/urls.ts\`, or alongside the route handler under \`src/app/api/\`.
- **Site constants**: App-wide slugs, Contentful entry IDs, and similar **data constants** belong in \`src/utils/constants.ts\`, not scattered as magic strings.

## React / JSX

We favor plain functions with typed props—no \`React.FC\`—and explicit conditionals so we never accidentally render a stray \`0\` or \`false\`.

- **Component types**: Do not use \`FC\` or \`React.FC\`. Type props explicitly and let the return type be inferred.
- **Conditional components**: Use a ternary (\`condition ? <Component /> : null\`) instead of short-circuit (\`condition && <Component />\`) so the render branch is explicit and avoids accidentally rendering falsy values (e.g. \`0\`). Write conditionals as multi-line statement blocks.
- **Multiple or conditional class names**: Use the \`classnames\` package (import as \`classNames\`) instead of template literals or string concatenation. For **conditional** classes, use **object notation**: \`classNames(styles.a, { [styles.active]: isActive })\` — avoid \`isActive && styles.active\` and avoid ternaries that return class strings. For static lists use multiple arguments: \`classNames(styles.a, styles.b)\`. When accepting an optional \`className\` prop: \`classNames(styles.container, className)\`.
- **Raster images in UI**: Use **\`next/image\`** (\`import Image from "next/image"\`). Avoid bare \`<img>\` for content images unless you have a documented exception. Every \`Image\` needs an \`alt\`.
- **Links**: Use **\`next/link\`**'s **\`Link\`** for all navigational links—internal paths, external URLs, \`mailto:\`, \`tel:\`, and the like—not a bare \`<a>\` unless you have a rare, documented exception. For new tabs, set \`target\` and \`rel="noopener noreferrer"\`.

### Large components and state

- **Extract state into a custom hook when a component has many state items.** If a component uses several \`useState\`/\`useEffect\` calls and many derived values, move that logic into a dedicated hook (e.g. \`useMyComponentState\`) in the same folder. The hook should accept the minimal props/data it needs and return a single object. The main component file stays focused on composition and JSX.

## Formatting and linting

We standardize on **Biome** for both lint and format of TS/JS/CSS, plus **Stylelint** for CSS-specific rules.

- **Braces**: Always use curly braces \`{}\` for control flow, even for single-line bodies. Use statement blocks for all conditionals and early returns—no single-line \`if\` bodies (e.g. \`if (!x) { return null; }\` not \`if (!x) return null\`).
- **Commands**:
  - \`pnpm lint\` – Biome check only
  - \`pnpm lint:fix\` – run \`biome check --write\` (fix what can be fixed)
  - \`pnpm lint:css\` – Stylelint check only
  - \`pnpm lint:css:fix\` – Stylelint with \`--fix\`
- **Config**: \`biome.json\` for Biome (CSS formatter and linter included); \`stylelint.config.ts\` for Stylelint.
- **Notable rules**: no unused imports/variables, no inferrable types, use \`as const\` where appropriate, \`noDangerouslySetInnerHtml\` is a warning.
- Run lint/format before committing so CI passes.

## CSS and styling

### Technology choice

- **Components use CSS Modules** (\`.module.css\`) co-located with the component.

### File naming and location

Place the CSS module next to the component, e.g. \`MyComponent.component.tsx\` and \`MyComponent.module.css\`. Import the module and use the class names object (e.g. \`styles.wrapper\`).

### Modern CSS

- **Nesting**: Use nesting for scoped styles and for nested media queries.
- **Custom properties**: Prefer variables from the global design system. All design tokens live in \`src/styles/variables.css\`, imported by \`globals.css\`. If you need to inject a custom property at render time (inline \`style={{ "--foo": value }}\`), declare it in the same file as \`--foo: initial;\` so Stylelint recognizes it.
- **Runtime font variables**: Next.js \`localFont\` injects font variables via a class on \`<html>\` at runtime. Do not declare them in CSS. Register them in \`src/styles/runtime-variables.json\` for Stylelint.
- **Modern features**: Use \`color-mix()\`, \`clamp()\` where they simplify code. Keep styles DRY.

### Mobile-first

Write base styles for mobile; override for larger viewports.

- **In CSS**: Use standard media queries (e.g. \`@media (min-width: 800px)\`). Do not use \`@custom-media\`.
- **In JS/TS**: Prefer keeping media queries in CSS modules.

### Style rules

- **Alphabetize** CSS properties within each rule block.
- **Nest** selectors where it makes sense, but **avoid deep nesting**. If a block has many nested rules, break it into separate top-level rules. Keep nesting to one level for structure; use flat rules for clarity.
- **Spacing**: Do not use \`margin-top\`. Prefer flexbox with \`gap\` for vertical and horizontal spacing between siblings.
- Do not add redundant comments in CSS; class names and structure should be self-explanatory.

## Testing

Tests use Jest, **page objects** for **render setup, mocks, and shared test data only**. **Do not call \`screen\` / \`queryBy*\`** from page objects—put all DOM queries in **\`<Name>.spec.tsx\`** via **\`screen\`**, **\`userEvent\`**, and **\`within\`** as needed.

### Page object pattern

- **Base class**: \`src/tests/basePageObject.po.ts\` (optional \`debug\`, \`raiseOnFind\`).
- **Per-component page object**: In \`<Name>.po.tsx\`, define a class that extends \`BasePageObject\`, sets \`testId = "rh<ComponentName>"\`, implements \`render<Name>()\` using the custom \`render\` from test-utils, and holds test data and setup (factories, \`jest.resetAllMocks()\`, mock implementations). No \`screen\` queries in the PO.
- **Tests**: In \`<Name>.spec.tsx\`, import **\`describe\`**, **\`it\`**, **\`expect\`**, **\`beforeEach\`** from **\`@jest/globals\`**. Instantiate the page object in \`beforeEach\`, then query the DOM with **\`screen\`** / **\`userEvent\`** (e.g. \`expect(screen.getByTestId(po.testId)).toBeInTheDocument()\`).
- **Custom render**: Always use the \`render\` from \`src/tests/test-utils.tsx\`. It wraps the tree with the same providers as the app.

### Test data

- **\`BaseFactory\`** (\`src/tests/factories/BaseFactory.ts\`) is the base class for all test factories. Subclass it and export a singleton instance. **All factories live in \`src/tests/factories/\`** — never next to the component.
- **Factory shape**: Each factory declares its own \`<Name>FactoryOptions\` type (use \`Record<string, never>\` when no options are needed) and implements \`build(attributes?, _options?)\`. Inside \`build\`, construct an \`instance\` literal with \`satisfies <Type>\`, then return \`{ ...instance, ...(attributes ?? {}) }\`. Include the \`KeysMatch\` guard (\`const _allKeysMustBeInTheInstance: KeysMatch<Type, typeof instance> = undefined;\`) so missing keys break the build instead of silently shipping \`undefined\`.
- **Every key gets random Faker data — no exceptions.** Required, optional, nullable — every property in the \`instance\` literal must be a \`faker.*\` call. Never use hard-coded strings, numbers, \`null\`, or \`undefined\` as defaults. Tests that specifically need a fixed value must override with \`.build({ field: value })\`.
- **For nullable fields (\`T | null\`), use \`nullish\`** from \`src/utils/factory.helpers.ts\`. \`nullish([value])\` randomly returns \`null\` or the provided value, so both branches are exercised across builds. Tests that need a non-null value must override at the call site.
- **One factory per file.** Each \`<Name>.factory.ts\` exports exactly one factory singleton. The filename matches the singleton.
- **Use nested factories for compound shapes.** If a type contains a \`Document\` (rich text), a \`ContentfulAsset\`, etc., use the existing factory (e.g. \`richTextDocumentFactory.build()\`, \`contentfulAssetFactory.build()\`) instead of inlining a literal.
- **No function wrappers.** Each call to \`.build()\` runs the body fresh, so write \`id: faker.string.uuid()\` directly — no \`() => faker.string.uuid()\` wrappers.
- **Explicitly set any field the test queries or asserts on.** If a spec finds an element by a factory-driven string, pass that value to \`.build({ field: "My Label" })\` and use the **literal string** in the query/assertion. Do not read it back via \`po.metadata.field\`.
- **Repeat the literal in the PO and the spec; do not share via a constant.** Two identical literals separated by file is the desired state — the duplication is the point.
- **Use factories for structured test data.** When a factory exists for a type, use it with overrides instead of inline objects.

### What to mock (and what not to)

Default to running **in-repo utilities** for real in component tests — URL builders, string helpers, and other pure helpers in \`src/utils/\`. Stubbing them hides what the component actually produces.

- **Don't mock**: anything under \`src/utils/\` — URL builders, string helpers, etc. Let them run.
- **Do mock**: external dependencies — \`src/api/*\` calls, \`src/lib/analytics\`, \`next/navigation\`, \`next/script\`, \`IntersectionObserver\`, and similar.

### Jest and \`next/script\`

Unit tests that assert on DOM from **\`next/script\`** (e.g. JSON-LD \`<script id="schema-structured-data">\`) should **mock** \`next/script\` so injection is synchronous; the real component loads \`afterInteractive\` and can miss timing in JSDOM.

- **Wiring**: Mocks under \`src/tests/mocks/\` need an explicit factory:

\`\`\`ts
jest.mock("next/script", () => ({
  __esModule: true,
  default: require("src/tests/mocks/yourNextScriptMock").default,
}));
\`\`\`

## Test IDs

- Every component that is tested (or likely to be) should have a **root element** with \`data-testid="rh<ComponentName>"\` (e.g. \`rhNavigation\`, \`rhFooter\`). Use PascalCase to match the component name.
- The page object's **\`testId\`** must match the component root \`data-testid\` so specs can use \`screen.getByTestId(po.testId)\`.
- Do not use generic or non-standard test IDs for the component root.

## Accessibility

Ship UI that works with a keyboard and a screen reader whenever the design allows.

- Use **semantic HTML** first: correct heading levels, \`<button>\` for actions, \`Link\` from \`next/link\` for navigation, lists for list content.
- **Forms**: Associate every input with a label (\`htmlFor\` / \`id\`) or an accessible name via \`aria-label\` / \`aria-labelledby\`.
- **Images**: \`alt\` is required on every \`Image\`—accurate text when the image conveys information; \`alt=""\` when purely decorative. If you introduce a new external image hostname, add it to \`images.remotePatterns\` in \`next.config.ts\`.
- **Keyboard**: Interactive controls must be focusable and operable without a pointer; overlays and menus should not leave focus in a hidden layer.
- **Motion**: Prefer honoring \`prefers-reduced-motion\` for large or looping animations.

## Comments

Avoid redundant comments. Prefer clear names and small, focused functions so that intent is obvious. Add comments only when explaining non-obvious behavior, workarounds, or business rules.

## Editor

The repo uses \`.editorconfig\`: indent 2 spaces, UTF-8, insert final newline, trim trailing whitespace.

## React Query

Keep data-fetching hooks in their own files under \`src/hooks/queries/\` and \`src/hooks/mutations/\`. Components should call a named hook and react to \`data\`, \`isLoading\`, and \`isError\`—not own the \`useQuery\` wiring inline.

- **Always create a dedicated query hook file.** Do not inline \`useQuery\` (or \`useMutation\`) in components. Add hooks under \`src/hooks/queries/\` and \`src/hooks/mutations/\`.
- **Hook params must be a single object.** Pass one argument object to the hook instead of multiple positional arguments.
- **Keep query hooks dumb.** Query files should only call \`useQuery\` / \`useMutation\` with standard options. Do not add side effects or callbacks in the query file.
- **Handle errors and side effects at the call site.**
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/contentful.md
// ---------------------------------------------------------------------------

export function getHandbookContentful(a: ProjectAnswers): string {
  if (!a.includeContentful) {
    return `# Contentful integration

This project was scaffolded **without** Contentful—there is no \`src/contentful/\` tree and no \`pnpm types:contentful\` script.

To adopt Contentful later, add the SDK and codegen dependencies, restore env keys in \`next.config.ts\`, copy the \`src/contentful/\` patterns from a Contentful-enabled kickoff run (or another project handbook), and run type generation against your space.
`;
  }

  return `# Contentful integration

Most pages are driven by Contentful. This guide explains how **generated types**, **getters** (fetch), and **parsers** (normalize) fit together, and how sections and content blocks reach the UI.

## Content types (generated)

All Contentful content type TypeScript definitions live under \`src/contentful/types/\`. They are **generated** from the CMS and **must never be edited by hand — for any reason**.

- **Regenerate**: Run \`pnpm types:contentful\` (requires \`CONTENTFUL_SPACE_ID\` and \`CONTENTFUL_CMA_TOKEN\` in env). The script runs Biome format on the generated types.
- When the CMS schema changes, regenerate and fix any parser or component that breaks.

**Source of truth rule (important):** If you see a type mismatch between app code and a generated Contentful type, **do not fix it by editing \`src/contentful/types/*\`**. Those files are overwritten by codegen.

- If the CMS schema is correct: **update app code** (parsers/components/factories/tests) to match the generated types.
- If the app behavior is correct and the CMS schema is wrong: **update the CMS model** and re-run \`pnpm types:contentful\`.

Common rationalizations that are still wrong: "I'm just renaming a field to match a rename the editor is about to do." "I need to unblock myself since I don't have CMS access." In all cases: do the CMS edit first, then run codegen, then update consumers.

## Getters

**Getters** are async functions that talk to Contentful through \`src/contentful/client.ts\`.

- Each getter file is named \`get<Resource>.ts\` (e.g. \`getPages.ts\`, \`getNavigation.ts\`).
- **Preview**: Pass \`preview: true\` when draft/preview mode is active so the preview client and token are used.
- Getters should be the only place that calls the Contentful client directly.

## Parsers

For every section or content block we render, a **parser** in \`src/contentful/parse*.ts\` turns the raw entry into a shape React can consume.

- **Input**: Raw Contentful entry types from generated \`src/contentful/types/\`.
- **Output**: Normalized app types (plain objects with \`id\` and typed fields).
- **Helpers in \`src/contentful/helpers.ts\`**:
  - \`ExtractSymbolType\` — string union from a Contentful Symbol field.
  - \`ContentfulTypeCheck\` — compile-time check that the parsed **type** matches the Contentful fields.
  - \`ContentfulParseShape\` — compile-time check that the parsed **return literal** sets every key on the type, including optionals. Apply via \`satisfies\` on the terminal return: \`return { ...fields } satisfies ContentfulParseShape<MyType>;\`. Catches silently dropped fields that would otherwise be \`undefined\` at runtime.
- **Assets**: \`src/contentful/parseContentfulAsset.ts\` normalizes assets across parsers.

## Sections vs content blocks

### Sections

Sections are the top-level building blocks attached to a page in Contentful.

- Parsed in a top-level \`parseSections.ts\` and related parser types.
- Rendered by a \`SectionRenderer\` component that switches on section type.

### Content blocks

Modules (content cards, copy blocks, slides, etc.) **live inside** sections.

- Parsed in individual \`parse*.ts\` files.
- Rendered by a \`ContentRenderer\` component that switches on content type, runs the parser, and renders the matching component.

## Adding a new Contentful-driven block (checklist)

1. **Types**: Confirm the content type exists in Contentful, then run \`pnpm types:contentful\`.
2. **Parser**: Add or extend \`src/contentful/parse<Name>.ts\` with a normalized type and \`parseContentful…\` function. Append \`satisfies ContentfulParseShape<MyType>\` to the terminal return literal so every key must be set explicitly. Use \`ContentfulTypeCheck\` and \`ExtractSymbolType\` where appropriate.
3. **ContentRenderer**: Handle the new content type: parse the entry and render the component with typed props.
4. **Section parser**: If the block appears inside a section's content array, ensure the sections parser includes the new type in its content union and parsing logic.
5. **Component**: Implement the UI with CSS Modules per [conventions.md](conventions.md).

## Rich Text

Rich Text is rendered with \`@contentful/rich-text-react-renderer\`. Reuse shared options and typography patterns from nearby components so links and marks stay consistent.

The \`RichText\` component in \`src/contentful/richText.tsx\` is the standard wrapper. For components that need custom rendering options, pass an \`options\` object to \`documentToReactComponents\` directly.

## Client and environment

- **Client**: \`src/contentful/client.ts\` is the one place we construct Contentful clients for delivery and preview.
- Do **not** create ad-hoc clients in random files—reuse this module and the getters/parsers so tokens and behavior stay aligned.

## Cache

- **\`src/contentful/cacheConfig.ts\`**: \`sanitizeForCache\` and the revalidation seconds constant. Wrap getter calls with \`unstable_cache\` here to enable on-demand revalidation.
- **\`src/contentful/cacheKeys.ts\`**: Typed cache key constants and Vercel cache tags so keys are consistent across getters and revalidation routes.

## Pagination

Use \`CONTENTFUL_BATCH_LIMIT\` (defined in \`src/contentful/contentfulPagination.ts\`) when fetching large sets. Batch requests using \`skip\`/\`limit\` with a stable \`order\` so pagination is deterministic.
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/components.md
// ---------------------------------------------------------------------------

export function getHandbookComponents(_a: ProjectAnswers): string {
  return `# Components

New UI lives under \`src/components/<Name>/\`. This page describes the files we expect in that folder, how the **scaffold** works, and how tests and dynamic imports fit in.

## Folder layout

One directory per component under \`src/components/<ComponentName>/\`. Use **PascalCase** for the folder and file names.

### File types and when to use them

| File | Purpose |
|------|---------|
| **\`<Name>.component.tsx\`** | Main React component. Keep it focused on composition and minimal logic. Use CSS Modules (import \`styles\` from \`./<Name>.module.css\`) and apply class names. |
| **\`<Name>.po.tsx\`** | Page object for tests. Extends \`BasePageObject\`, sets \`testId = "rh<Name>"\`, implements \`render<Name>(...)\` with \`render()\` from \`src/tests/test-utils.tsx\`, and holds setup, mocks, and test data. **No \`screen\` queries in the PO** — queries belong in the spec. |
| **\`<Name>.spec.tsx\`** | Jest tests. Import \`describe\`, \`it\`, \`expect\`, \`beforeEach\` from \`@jest/globals\`. After the PO renders, use \`screen\` and \`userEvent\` for all queries and interactions. |
| **\`<Name>.interfaces.ts\`** | Use when the component has **public** props or data types not already defined by a Contentful parser. If the component is driven by Contentful, the "interface" is usually the parsed type from \`src/contentful/parse<Name>.ts\`, so you may not need a separate interfaces file. |
| **\`src/tests/factories/<Name>.factory.ts\`** | Subclass of \`BaseFactory\` for test data when tests need complex or repeated props. **Lives in \`src/tests/factories/\`, not in the component folder** — factories are shared test infrastructure. See the factory rules in [conventions.md](conventions.md). |
| **\`<Name>.module.css\`** | Layout, spacing, typography, responsive rules. Use nesting and \`var(--...)\` from the design system. |
| **\`use<Something>.hook.ts\`** | Optional. When the component has a custom hook used only by that component, place it in the same folder. |

## Scaffold

Run **\`pnpm scaffold <ComponentName>\`** when you want a head start — it drops in the usual filenames and stubs (component, CSS module, interfaces, page object, spec) under \`src/components/<Name>/\`, plus a factory at \`src/tests/factories/<Name>.factory.ts\`.

After scaffolding, follow **[conventions.md \u2192 Testing](conventions.md#testing)** for page object vs spec responsibilities.

**Heads-up:** For Contentful-backed components, treat the scaffold as a starting point only — the default **interfaces** / **factory** are generic stubs, not CMS parsers:

1. Drop or replace the default **interfaces** when your props come from a parser type in \`src/contentful/\`.
2. Wire types and parsers from \`src/contentful/\` as in [contentful.md](contentful.md).
3. Take a prop typed as the parser output (e.g. \`metadata: MyBlockType\`) when the block is CMS-driven.

## Test ID

The root DOM element of a tested component should have **\`data-testid="rh<ComponentName>"\`** (e.g. \`rhNavigation\`). The page object should set **\`testId = "rh<ComponentName>"\`** to match; specs assert with \`screen.getByTestId(po.testId)\`.

## Exports

Export the component as both a **named export** (e.g. \`export const MyComponent\`) and a **default export** (\`export default MyComponent\`) so imports stay consistent with the scaffold and existing folders.

## Dynamic imports

Use **\`next/dynamic\`** when a component is heavy or client-only (\`ssr: false\` when it depends on \`window\` or browser-only APIs).

## Links

Use **\`next/link\`**'s **\`Link\`** for all navigational links — internal paths, external URLs, \`mailto:\`, \`tel:\`, and the like. For new tabs, set \`target\` and \`rel="noopener noreferrer"\` on \`Link\`. See [conventions.md](conventions.md#react--jsx).
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/patterns.md
// ---------------------------------------------------------------------------

export function getHandbookPatterns(a: ProjectAnswers): string {
  const cmsBullets = a.includeContentful
    ? `- **Contentful**: Call getters from \`src/contentful/\` with \`{ preview }\` derived from \`draftMode()\` when you need draft content.
- **Serialization**: Next.js must receive serializable props when passing data from Server to Client Components. Replace \`undefined\` with \`null\` where needed.
- **Not found**: Use \`notFound()\` from \`next/navigation\` when Contentful returns no page for a slug.
`
    : `- **Serialization**: Next.js must receive serializable props when passing data from Server to Client Components. Replace \`undefined\` with \`null\` where needed.
- **Not found**: Use \`notFound()\` from \`next/navigation\` when a route has no data.
`;

  return `# Patterns

This chapter collects **cross-cutting patterns**: how App Router pages load data, how client hooks call Route Handlers, forms, and where SEO metadata lives.

## Server Components and data loading

\`page.tsx\` files under \`src/app/\` are **Server Components** by default unless marked with \`"use client"\`.

${cmsBullets}

## React Query — mutations

Mutation hooks live in **\`src/hooks/mutations/\`**.

- Each hook uses \`useMutation\` with a \`mutationFn\` that calls **api** methods from \`src/api/urls.ts\`.
- Do not scatter raw \`fetch\` in components for app APIs; use the \`api\` object so URLs and request shape stay consistent.

## React Query — queries

When you add client-side queries, place them under **\`src/hooks/queries/\`**, use a stable **\`queryKey\`**, and call through \`src/api/urls.ts\` inside \`queryFn\`. Follow the hook rules in [conventions.md](conventions.md) (single params object, no side effects in the hook file).

## API layer and Route Handlers

- **Client**: \`src/api/urls.ts\` is the front door for browser-initiated calls to same-origin APIs.
- **Server**: Implement behavior in **\`src/app/api/<name>/route.ts\`** (POST/GET as needed), validate input, and return \`Response\` JSON with appropriate status codes.

## Forms

- **Library**: \`react-hook-form\` is used where complex forms exist.
- **Submit**: On submit, call the appropriate mutation hook, which uses the API layer and Route Handlers.

## Layout and page structure

- **Root layout**: \`src/app/layout.tsx\` loads global styles, providers, navigation, and footer data.
- **Page shells**: Feature pages compose layout pieces with CSS Modules.

## Metadata and JSON-LD

- **Metadata**: Use \`generateMetadata\` / \`metadata\` exports on layouts and pages per [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) conventions.
- **JSON-LD**: A \`JsonLd\` component (or equivalent) renders an \`application/ld+json\` script. Graph builders live in \`src/lib/schema.ts\`.

## Dynamic imports

Use **\`next/dynamic\`** for code-splitting when a component is heavy or must be client-only. See [components.md](components.md).
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/platform.md
// ---------------------------------------------------------------------------

export function getHandbookPlatform(a: ProjectAnswers): string {
  const port = a.devPort;
  const intro = a.includeContentful
    ? "This page covers **CI**, **env vars**, **draft preview**, and **`src/proxy.ts`**."
    : "This page covers **CI**, **env vars**, and **`src/proxy.ts`**. (No CMS draft routes—this scaffold was generated without Contentful.)";

  const greenfield = a.includeContentful
    ? "GitHub, Vercel, and Contentful setup that happens **outside** this repo—including default branch (`staging`), branch protections, seeding **`v0.0.0`**, importing the scaffold from kickoff, adding **all** env vars from **`.env.local.example`** in Vercel, and **`npx vercel env pull .env.local`** in the clone—is captured in root **[README.md](../../README.md)** — **Prerequisites (greenfield bootstrap)**."
    : "GitHub and Vercel setup that happens **outside** this repo—including default branch (`staging`), branch protections, seeding **`v0.0.0`**, importing the scaffold from kickoff, adding env vars from **`.env.local.example`** in Vercel, and **`npx vercel env pull .env.local`** in the clone—is captured in root **[README.md](../../README.md)** — **Prerequisites (greenfield bootstrap)**.";

  const scriptRowsExtra = a.includeContentful
    ? `| \`pnpm types:contentful\` | Regenerate \`src/contentful/types\` (needs CMA env vars). |
| \`pnpm dev:preview\` | Dev server with Contentful preview mode enabled. |
`
    : `| \`pnpm dev:preview\` | Starts Next dev only (no \`/api/draft\` auto-open when Contentful is omitted). |
`;

  const notableContentful = a.includeContentful
    ? `- **Contentful** — space, delivery/preview tokens, preview secret, CMA token for codegen.
`
    : "";

  const draftSection = a.includeContentful
    ? `## Preview and draft mode

Draft mode uses App Router APIs:

- **Enable draft**: \`src/app/api/draft/route.ts\` checks \`previewSecret\` against **\`CONTENTFUL_PREVIEW_SECRET\`**, enables draft mode, then redirects.
- **Disable draft**: \`src/app/api/disable-draft/route.ts\`.
- **Preview content**: Getters accept \`preview: true\` and use the preview client from \`src/contentful/client.ts\`.
`
    : `## Preview and draft mode

This scaffold was generated **without** Contentful, so **\`/api/draft\`** and **\`/api/disable-draft\`** are not present. Enable **Contentful** in kickoff or add your own preview workflow.
`;

  return `# Platform, CI, and environment

${intro}

## Greenfield prerequisites

${greenfield}

## Continuous integration

PRs that target **\`staging\`** run \`.github/workflows/ci.yml\`:

1. Checkout
2. **pnpm** + **Node** from \`.tool-versions\`
3. **\`pnpm install\`**
4. **\`pnpm tsc:ci\`** — TypeScript strict
5. **\`pnpm lint:ci\`** — Biome in CI reporter mode
6. **\`pnpm test:ci\`** — Jest

Run **\`pnpm tsc:ci\`**, **\`pnpm lint:ci\`**, and **\`pnpm test:ci\`** locally before pushing when you touch types, lint, or tests.

## Package scripts (local workflow)

| Script | Purpose |
|--------|---------|
| \`pnpm dev\` | Next dev server on port ${port}. |
| \`pnpm build\` / \`pnpm start\` | Production build and serve (\`build\` runs \`make sitemap\`). |
| \`pnpm lint\` / \`pnpm lint:fix\` | Biome (same family as \`lint:ci\`). |
| \`pnpm lint:css\` / \`pnpm lint:css:fix\` | Stylelint. |
| \`pnpm test:ci\` | Jest (CI-style). |
| \`pnpm scaffold\` | New component folder under \`src/components/\` (see [components.md](components.md)). |
${scriptRowsExtra}
The full list lives in **\`package.json\`**.

## Environment variables and \`next.config\`

**\`next.config.ts\`** lists env vars exposed to the app under \`env: { ... }\`. If a name is not listed, the client bundle will not see it. Keep secrets off \`NEXT_PUBLIC_*\`.

Configure values in **Vercel** (or your host) and mirror locally via \`npx vercel env pull\` as described in the root README.

Notable groups:

- **Build (Vercel)** — **\`ENABLE_EXPERIMENTAL_COREPACK\`** — set to **\`1\`** in the Vercel project (and in **\`.env.local.example\`**) so production installs respect **\`packageManager\`** in \`package.json\`; not wired through \`next.config.ts\` (build-time only).
${notableContentful}- **ENVIRONMENT** — drives URLs in helpers such as \`envUrl()\`.
- **Optional** — HubSpot, Resend, reCAPTCHA — used by Route Handlers and forms when configured.

${draftSection}
## Release process

Releases follow a \`make release tag=vX.X.X\` workflow:

1. The Makefile target runs \`scripts/verify-vercel-for-release.sh\` to confirm you are a Vercel project member.
2. It then creates and pushes a git tag.
3. The release workflow (\`.github/workflows/release.yml\`) deploys to production on Vercel.

## \`src/proxy.ts\`

\`src/proxy.ts\` attaches **\`x-pathname\`** to request headers for downstream use. If you add **Next.js middleware**, import and call \`proxy\` from there so the behavior is applied on each request.
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/integrations.md
// ---------------------------------------------------------------------------

export function getHandbookIntegrations(a: ProjectAnswers): string {
  const gaSection = a.includeGA
    ? `## Google Analytics

- **App Router**: \`src/app/layout.tsx\` mounts **\`GoogleAnalytics\`** from \`@next/third-parties/google\` when \`GA_MEASUREMENT_ID\` is configured.
- **Measurement ID** comes from env (wired through \`next.config.ts\`).

Prefer the existing layout pattern when adding or changing measurement IDs so third-party scripts stay in one place.

`
    : "";

  return `# Third-party integrations and client analytics

Use this chapter when changing **analytics**, **tags**, or **client-side tracking** so env and layout stay aligned with production.

${gaSection}## Data layer

- **\`src/lib/analytics.ts\`** — \`trackEvent\` and related helpers push structured payloads to **\`window.dataLayer\`** when present.
- Reach for these helpers instead of ad-hoc \`window.dataLayer.push\` so event names stay consistent.

## Other third parties

Before adding a new script or external loader, **grep the repo for similar env keys** and follow the existing pattern (layout, client component, or Route Handler). If a new origin is required for images or fetches, update **\`images.remotePatterns\`** or security headers in **\`next.config.ts\`** as appropriate.
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/distribution.md
// ---------------------------------------------------------------------------

export function getHandbookDistribution(a: ProjectAnswers): string {
  const url = a.prodUrl;
  return `# Sitemaps and public output

This chapter describes how **sitemap XML** is produced and written for crawlers.

<!-- prodUrl: ${url} -->

## XML sitemaps

- **Helpers**: \`src/lib/generateSitemap.ts\` — \`generateSitemap\`, **\`outputSitemap(routes, filename)\`**, \`SitemapItem\` with \`route\` and \`modTime\`.
- **Build**: After \`next build\`, **\`make sitemap\`** runs \`scripts/make_sitemap.js\`, which reads **\`.next/prerender-manifest.json\`** and writes **\`public/sitemap.xml\`** with the prerendered route set (see \`package.json\` \`build\` script).
- **Discovery**: Root layout or robots links to the sitemap URL when deployed.

When you add **routes that must appear in search indexes**, confirm they show up in the prerender manifest or extend the sitemap pipeline accordingly.

## Robots and metadata

- **Robots**: \`src/app/robots.ts\` defines robots behavior for the App Router (production host: \`${url}\`).
- **Manifest / social**: See \`manifest.ts\`, opengraph-image, and related files under \`src/app/\` for PWA and sharing metadata.
`;
}

// ---------------------------------------------------------------------------
// docs/handbook/source-layout.md
// ---------------------------------------------------------------------------

export function getHandbookSourceLayout(a: ProjectAnswers): string {
  const contentfulRow = a.includeContentful
    ? "| `contentful.helpers.ts` | `createImageUrl`, `isVideo`, `getContentfulEntryWebUrl` |\n"
    : "";

  return `# Source layout reference

Use this page when you know what you want to do ("add a constant", "find the sitemap helper") but not which folder it lives in.

## \`src/interfaces/\`

Feature-scoped TypeScript contracts (e.g. \`src/interfaces/common.interfaces.ts\`). Prefer **colocating** types with a single feature when they are not shared across the app.

## \`src/utils/\`

Helpers are **split by topic**—there is no barrel \`utils/index.ts\`. Import the module you need directly (see [conventions.md](conventions.md) on barrel files).

| File | What's in it |
|------|-------------|
| \`constants.ts\` | Slugs, navigation IDs, build exclusions |
| \`environment.helpers.ts\` | \`isBrowser\`, \`isNonNullable\`, \`envUrl\` |
| \`array.helpers.ts\` | \`compact\`, \`alphabetize\` |
| \`string.helpers.ts\` | \`capitalizeWords\`, \`truncate\`, \`replaceNbsp\` |
| \`url.helpers.ts\` | \`convertRelativeUrl\`, \`ensureLeadingSlash\`, \`tryParseUrl\` |
${contentfulRow}| \`style.helpers.ts\` | \`cssStyleTag\` tagged template |
| \`factory.helpers.ts\` | \`nullish\` — random null/value for factory optional fields |

Specs: \`*.spec.ts\` next to each module (e.g. \`environment.helpers.spec.ts\`).

## \`src/lib/\`

Server- and shared-oriented modules:

- \`generateSitemap.ts\` — sitemap XML generation (see [distribution.md](distribution.md))
- \`schema.ts\` — JSON-LD / schema.org helpers
- \`analytics.ts\` — client analytics helpers (see [integrations.md](integrations.md))

`;
}
