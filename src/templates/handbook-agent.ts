import type { ProjectAnswers } from "../types.js";

export const getHandbookGlossary = (_a: ProjectAnswers): string => {
  return `# Glossary

Terms agents see in this scaffold. Paths are under **\`src/\`** unless noted.

## App and routing

| Term | Meaning |
| ---- | ------- |
| **App Router** | \`src/app/\` — \`page.tsx\`, \`layout.tsx\`, Route Handlers under \`api/\`. |
| **RSC** | React Server Components — default in App Router; client boundaries need \`"use client"\`. |
| **Route Handler** | \`src/app/api/**/route.ts\` — server HTTP endpoints. |
| **\`src/proxy.ts\`** | Next request proxy (env headers, redirects) — see [platform.md](platform.md). |

## Data and CMS

| Term | Meaning |
| ---- | ------- |
| **Getter** | Contentful (or other) read function that returns raw entries — parsers shape UI props. |
| **Parser** | Maps CMS entry → typed component props ([contentful.md](contentful.md) when CMS enabled). |
| **Draft mode** | Preview unpublished CMS content via \`/api/draft\` when Contentful is scaffolded. |
| **Generated types** | \`src/contentful/types/\` — output of \`pnpm types:contentful\`; do not hand-edit. |

## Client API surface

| Term | Meaning |
| ---- | ------- |
| **\`api.*\`** | Client fetch helpers in [\`src/api/urls.ts\`](../../src/api/urls.ts) — browser code must not sprinkle raw \`/api/...\` strings. |
| **Deploy target** | \`staging\` vs \`production\` (or project-specific) for refresh-content deploy hooks — see [patterns.md](patterns.md). |
| **Refresh token** | Gate for deploy/refresh routes — parsed in \`src/lib/refreshContentAccess.ts\`. |

## Testing

| Term | Meaning |
| ---- | ------- |
| **PO (page object)** | \`*.po.tsx\` — render helpers and mocks; specs query via PO, not inline \`screen\` in PO. |
| **\`rh<Name>\`** | Root \`data-testid\` on components (e.g. \`rhNavigation\`). |
| **Factory** | \`src/tests/factories/*.factory.ts\` — \`BaseFactory\` + Faker; see [factories.md](factories.md). |
| **Handbook test rules** | \`src/tests/utils/handbookTestRules.ts\` — no query/mutation hook specs; mock \`api.*\`. |

## Ops

| Term | Meaning |
| ---- | ------- |
| **\`staging\`** | Default integration branch; PRs target \`staging\`, not \`main\`. |
| **Handbook** | \`docs/handbook/*.md\` — source of truth with code; route via [llms.md](llms.md). |

Pattern choices: [decisions.md](decisions.md). API map: [api-routes.md](api-routes.md).
`;
};

export const getHandbookDecisions = (a: ProjectAnswers): string => {
  const cmsRow = a.includeContentful
    ? `| CMS page data on the server | **Getters + parsers** in \`src/contentful/\` | Inline SDK calls in components |
| Preview content | **Draft mode** + preview client | Delivery API only in editors |`
    : "";

  const draftPlaybook = a.includeContentful
    ? `
### Contentful getter or parser change

1. [contentful.md](contentful.md) — types, cache keys, parser output shape.
2. Regenerate types if the content model changed (\`pnpm types:contentful\`).
3. Update factories and component specs that build parsed shapes.
4. Handbook: [contentful.md](contentful.md), [architecture.md](architecture.md) data flow.
`
    : "";

  return `# Decisions (X vs Y)

Short **choose-the-right-tool** guide for agents. When a row points to a chapter, read that chapter before editing—not this page alone.

## Quick read (agents)

1. [Data loading](#data-loading)
2. [API and routes](#api-and-routes)
3. [Tests](#testing-which-layer)
4. [Glossary](glossary.md)
5. Full map: [llms.md](llms.md)

## Data loading

| If you need… | Use | Not |
| ------------ | --- | --- |
| Server-rendered page data | **RSC** \`page.tsx\` calling getters/helpers | Client \`useEffect\` fetch for first paint |
| Client polling / mutations after hydration | **React Query** hooks in \`src/hooks/queries/\` and \`src/hooks/mutations/\` | Inline \`useQuery\` in components |
| Shared fetch options / JSON parsing | **\`src/api/helpers.ts\`** | Duplicated fetch wrappers |
${cmsRow}

Details: [architecture.md](architecture.md), [patterns.md](patterns.md).

## App Router and components

| If you need… | Use | Not |
| ------------ | --- | --- |
| Route metadata | \`generateMetadata\` / static metadata exports | Ad-hoc \`<head>\` in client trees |
| Interactive UI | \`"use client"\` components | Marking entire pages client without reason |
| New component tree | **\`pnpm scaffold <Name>\`** | Hand-authored folders |
| Conditional module classes | **\`classnames\`** + CSS module imports | Template literals combining module keys |

Details: [components.md](components.md), [conventions.md](conventions.md).

## API and routes

| If you need… | Use | Not |
| ------------ | --- | --- |
| Browser calls our JSON APIs | **\`api.*\`** in [\`src/api/urls.ts\`](../../src/api/urls.ts) | Hard-coded \`fetch("/api/...")\` in components |
| New Route Handler | \`src/app/api/<segment>/route.ts\` | Logic-only files outside \`app/api\` pretending to be routes |
| Deploy / refresh flows | Documented **refresh-content** routes + \`refreshContentAccess\` | Ungated deploy triggers |

Details: [api-routes.md](api-routes.md), [patterns.md](patterns.md).

## Testing: which layer

| If you are testing… | Prefer | Avoid |
| ------------------- | ------ | ----- |
| Component UI | **\`<Name>.spec.tsx\`** + **\`<Name>.po.tsx\`** | Mocking query hooks under \`src/hooks/queries/\` |
| Hook behavior | **\`*.hook.spec.ts\`** — mock **\`api.*\`**, flat single \`describe\` | Specs under \`src/hooks/queries/\` or \`mutations/\` |
| Pure helpers | Co-located **\`*.spec.ts\`** in \`src/utils/\` | Burying logic only in component tests |
| Route Handler | Co-located **\`route.spec.ts\`** (when added) | Component test as API substitute |

Details: [conventions.md](conventions.md), [factories.md](factories.md).

## Docs and agent finish

| If you changed… | Update |
| --------------- | ------ |
| Behavior, routes, hooks, test patterns | Matching **\`docs/handbook/*.md\`** ([llms.md](llms.md)) |
| User-facing features, setup, stack in README | Root **[README.md](../../README.md)** |
| New \`api.*\` method | [api-routes.md](api-routes.md) |
| Factory or PO conventions | [factories.md](factories.md), [conventions.md](conventions.md) |

Details: [agent-workflow.md](agent-workflow.md), **[CLAUDE.md](../../CLAUDE.md)**.

## Feature playbooks (touch order)

### New UI component

1. **\`pnpm scaffold <Name>\`** — [components.md](components.md).
2. PO for mocks; **\`.spec.tsx\`** uses PO only.
3. Factory in **\`src/tests/factories/\`** when props are non-trivial — [factories.md](factories.md).
4. Mobile-first CSS; \`data-testid="rh<Name>"\` on root — [conventions.md](conventions.md).

### New \`api.*\` method + Route Handler

1. [api-routes.md](api-routes.md) — auth and naming.
2. Handler under \`src/app/api/\`.
3. Wire method in [\`src/api/urls.ts\`](../../src/api/urls.ts) using \`fetchJsonResponse\` / \`fetchOptions\`.
4. React Query hook if the UI needs it — [patterns.md](patterns.md).
5. Update [api-routes.md](api-routes.md) table in the same PR.

### New React Query hook or mutation

1. Do **not** add specs under \`src/hooks/queries/\` or \`src/hooks/mutations/\`.
2. Hook file calls **\`api.*\`** only; components use the hook.
3. Feature tests mock **\`src/api/urls\`** — [conventions.md](conventions.md) (Do not test React Query).
4. Update [patterns.md](patterns.md) if part of a documented flow.
${draftPlaybook}
`;
};

export const getHandbookAgentWorkflow = (a: ProjectAnswers): string => {
  const cursorStop =
    a.agentTooling === "cursor"
      ? `## Cursor stop hook (one follow-up per turn)

[\`.cursor/hooks/session-stop-checks.sh\`](../../.cursor/hooks/session-stop-checks.sh) may prompt you to:

- Sync handbook when \`src/\` changed without \`docs/handbook/*.md\`
- Run **\`pnpm lint:all\`** after substantive edits (deduped per conversation)
- Run **\`handbookTestRules.spec.ts\`** when feature test files changed
- Nudge root README when user-facing setup or stack changed

Dedupe state: **\`.cursor/hooks-state/\`** (gitignored); fingerprint includes **file contents** so in-place fixes re-run lint/Jest nags. See [**.cursor/hooks/README.md**](../../.cursor/hooks/README.md).

**preToolUse:** **\`enforce-handbook-edit.sh\`** runs Jest via \`scripts/cursor-handbook-guard.runner.spec.ts\` and blocks only **new** violations (\`newHandbookViolations\` in \`handbookEditGuard.ts\` + \`handbookTestRules.ts\`). Rule \`nested-describe\` ignores multiline \`import { … }\` binding lines.`
      : `## Claude stop / drift

Claude uses **\`handbook-drift-check\`** on stop when code changes without handbook updates. Same finish discipline: [llms.md](llms.md), **\`pnpm handbook:check\`**.`;

  return `# Agent workflow

Checklist for **tools and LLMs** in this repo—complements [CLAUDE.md](../../CLAUDE.md) and session/stop hooks.

## Before the first edit

1. Skim [README.md](README.md) index.
2. Open [llms.md](llms.md) → read **every matching row** for your task.
3. For “which pattern?” questions, read [decisions.md](decisions.md) first.
4. Reuse existing hooks, components, and **\`api.*\`**—no parallel implementations.

## While implementing

| Concern | Handbook |
| ------- | -------- |
| Tests, POs, query-hook rules | [conventions.md](conventions.md) · [factories.md](factories.md) |
| CSS / layout | [conventions.md](conventions.md) (mobile-first, Stylelint) |
| New API | [api-routes.md](api-routes.md) + [patterns.md](patterns.md) |
| Client persistence | [data-storage.md](data-storage.md) |
| Component folders | [components.md](components.md) + **\`pnpm scaffold\`** |

## Before you finish (same turn as last code change)

1. **Handbook** — If \`src/\`, tests, CI, hooks, or conventions changed, update matching **\`docs/handbook/*.md\`** ([llms.md](llms.md)). If nothing was wrong, name the **section headings** you verified.
2. **README** — If user-facing features, routes, setup, or tech stack listed there changed, update root [README.md](../../README.md).
3. **Local checks** (substantive \`src/\` work):

   \`\`\`sh
   pnpm lint:all
   pnpm handbook:check
   \`\`\`

${cursorStop}

## Analysis tools

| Goal | Command |
| ---- | ------- |
| Unsure which chapter | [decisions.md](decisions.md) → [llms.md](llms.md) |
| Dead code / exports | **\`pnpm knip\`** / **\`pnpm knip:ci\`** — [platform.md](platform.md) |
| Handbook drift vs branch | **\`pnpm handbook:check\`** |
`;
};

export const getHandbookApiRoutes = (a: ProjectAnswers): string => {
  const draftSection = a.includeContentful
    ? `## Draft / preview (navigation, not \`api.*\`)

| Route | Role |
| ----- | ---- |
| \`GET /api/draft\` | Enable draft mode (preview secret query param) |
| \`GET /api/disable-draft\` | Exit draft mode |

Details: [platform.md](platform.md), [contentful.md](contentful.md).

`
    : "";

  return `# API routes (agent map)

How **App Router** APIs are organized: the **\`api.*\`** client, starter **refresh-content** deploy routes, and where to extend validation. Deeper App Router patterns: [patterns.md](patterns.md).

## Client integration: \`api.*\` → handler

Browser code should call **[\`api\`](../../src/api/urls.ts)** only. Types live in \`src/api/*.types.ts\`; shared fetch helpers in [\`src/api/helpers.ts\`](../../src/api/helpers.ts).

| \`api\` method | HTTP route (summary) |
| -------------- | -------------------- |
| \`api.deploy.trigger\` | \`POST /api/refresh-content/deploy\` |
| \`api.deploy.active\` | \`GET /api/refresh-content/deploy/active\` |
| \`api.deploy.status\` | \`GET /api/refresh-content/deploy/status\` |
| \`api.deploy.buildStats\` | \`GET /api/refresh-content/deploy/build-stats\` |

When you add **\`api.<name>\`**:

1. Add or extend types under \`src/api/\`.
2. Implement \`src/app/api/.../route.ts\`.
3. Wire the method in **\`urls.ts\`** using \`fetchOptions\` / \`fetchJsonResponse\`.
4. Add a React Query hook/mutation if the UI needs it.
5. Update this table and [patterns.md](patterns.md) in the same PR.

## Auth and gates (refresh-content)

Starter deploy routes use token/metadata helpers from [\`src/lib/refreshContentAccess.ts\`](../../src/lib/refreshContentAccess.ts). Do not expose deploy hooks without the same gates your product requires.

- Parse deploy target and hook metadata consistently with existing routes.
- Return JSON errors via shared patterns in Route Handlers—avoid one-off response shapes.

## Routes without an \`api.*\` wrapper yet

These are valid **Route Handlers** called via navigation, redirects, or server-only code—not via \`src/api/urls.ts\` today:

${draftSection}| \`src/app/robots.ts\`, \`manifest.ts\` | Metadata routes (not under \`api/\`) |

Extend [api-routes.md](api-routes.md) when you add wrappers or new public JSON endpoints.

## Validation and errors

- Validate request bodies/query in the handler (or shared parser) before side effects.
- Prefer **\`ApiError\`** / consistent JSON \`{ error }\` from [\`src/api/helpers.ts\`](../../src/api/helpers.ts).
- Co-locate **\`route.spec.ts\`** when behavior is non-trivial.

## Testing routes

- Prefer **co-located \`route.spec.ts\`** next to \`route.ts\`.
- Feature/component tests mock **\`src/api/urls\`**, not internal route modules.
`;
};

export const getHandbookFactories = (_a: ProjectAnswers): string => {
  return `# Test factories

Structured test data for components, hooks, and API shapes.

All factories live under **[\`src/tests/factories/\`](../../src/tests/factories/)** only. Import by concrete path (e.g. \`from "src/tests/factories/RichTextDocument.factory"\`). **No barrel \`index.ts\`.**

## Always use factories

**Default rule:** Domain or API-shaped test data uses a factory under **\`src/tests/factories/\`**, not a large inline object in a spec or PO.

- **PO setup**, hook specs, and component specs: \`.build({ field: "literal" })\` for values the test queries.
- **Missing factory?** Add one in the same PR — do not spread copy-pasted literals across files.

**Exceptions (inline literals are fine):**

- Minimal stubs (\`{ count: 0 }\`, empty objects for unused branches).
- User-visible strings repeated in spec assertions (see [conventions.md → Testing](conventions.md)).

## Base class

Every factory extends [\`BaseFactory\`](../../src/tests/factories/BaseFactory.ts):

- **\`build(attributes?)\`** — one instance; \`Partial<Type>\` overrides for fields the test cares about.
- **\`buildList(n, attributes?)\`** — array of \`n\` instances.

## Canonical \`build()\` shape

\`\`\`typescript
build(attributes?: Partial<MyType>): MyType {
  const instance = {
    id: faker.string.uuid(),
    title: faker.music.songName(),
  } satisfies MyType;

  const _allKeysMustBeInTheInstance: KeysMatch<MyType, typeof instance> = undefined;

  return { ...instance, ...attributes };
}
\`\`\`

Use [\`KeysMatch\`](../../src/types/KeysMatch.ts) on closed types so new fields force factory updates.

## File naming

- **One factory per file**: \`MyWidget.factory.ts\` → export **\`myWidgetFactory\`** (camelCase singleton).
- Created by **\`pnpm scaffold <Name>\`** for new components when you need default test data.

## Related rules

- Factories never live next to components — [conventions.md](conventions.md), Cursor **\`enforce-factory-location\`** hook.
- Hook specs: flat single **\`describe\`** — [conventions.md](conventions.md).
- Enforcement: [agent-workflow.md](agent-workflow.md), \`handbookEditGuard.ts\`.
`;
};

export const getHandbookDataStorage = (_a: ProjectAnswers): string => {
  return `# Data storage (client and server)

Where the **starter scaffold** persists data and what to document when you add user-visible storage.

## Storage map (starter)

| Layer | Location | What it holds |
| ----- | -------- | ------------- |
| **Server** | Route Handlers, CMS, env | Request-scoped and durable data per your features |
| **Client \`localStorage\`** | [\`deployProgressStorage.ts\`](../../src/lib/deployProgressStorage.ts) | Deploy progress UI state for refresh-content flows |
| **Cookies** | Draft mode (when CMS enabled) | Preview/draft session per Next draft APIs |

There is **no** starter IndexedDB or user account DB—add chapters here when you introduce them.

## Deploy progress (\`localStorage\`)

The deploy monitor reads/writes labeled progress via **\`src/lib/deployProgressStorage.ts\`**. If you change keys, retention, or what “clear” means:

1. Update [patterns.md](patterns.md) deploy section if UX changes.
2. Update component specs and any PO setup that seeds storage.
3. If copy promises privacy or persistence, update user-facing README/legal in the same PR.

## When storage code changes

| If you change… | Also verify |
| -------------- | ----------- |
| New \`localStorage\` / \`sessionStorage\` keys | Centralize key constants (avoid ad-hoc strings) |
| Clear-data or logout behavior | Root README, legal/privacy copy if applicable |
| Server-side user records | [architecture.md](architecture.md) data flow |

## Related chapters

- Deploy APIs: [api-routes.md](api-routes.md), [patterns.md](patterns.md)
- Env and security: [platform.md](platform.md)
`;
};
