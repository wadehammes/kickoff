import type { CmsAdapter } from "./types.js";

// ---------------------------------------------------------------------------
// prismic.config.json  (`npx prismic init --repo <name>` fills in the name)
// ---------------------------------------------------------------------------

export const getPrismicConfig = (): string => {
  return `${JSON.stringify(
    {
      repositoryName: "your-repository-name",
      routes: [{ path: "/:uid", type: "page" }],
    },
    null,
    2,
  )}\n`;
};

// ---------------------------------------------------------------------------
// src/prismic/client.ts
// ---------------------------------------------------------------------------

export const getPrismicClient = (): string => {
  return `import {
  createClient as baseCreateClient,
  type ClientConfig,
} from "@prismicio/client";
import { enableAutoPreviews } from "@prismicio/next";
import prismicConfig from "prismic.config.json";

/** The Prismic repository named in prismic.config.json. */
export const repositoryName =
  process.env.NEXT_PUBLIC_PRISMIC_ENVIRONMENT || prismicConfig.repositoryName;

/**
 * A Prismic client that follows the routes in prismic.config.json and reads
 * draft content during a preview session.
 */
export const createClient = (config: ClientConfig = {}) => {
  const client = baseCreateClient(repositoryName, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    fetchOptions:
      process.env.NODE_ENV === "production"
        ? { cache: "force-cache", next: { tags: ["prismic"] } }
        : { next: { revalidate: 5 } },
    routes: prismicConfig.routes,
    ...config,
  });

  enableAutoPreviews({ client });

  return client;
};
`;
};

// ---------------------------------------------------------------------------
// src/prismic/getPages.ts
// ---------------------------------------------------------------------------

export const getPrismicGetPages = (): string => {
  return `import {
  type KeyTextField,
  NotFoundError,
  type PrismicDocument,
  type SliceZone,
} from "@prismicio/client";
import { createClient } from "src/prismic/client";

/**
 * The fields this file reads from the "page" type: its slice zone, and the
 * SEO & Metadata fields every page type gets. Swap in \\\`Content.PageDocument\\\` from
 * prismicio-types.d.ts once \\\`pnpm types:prismic\\\` has generated it.
 */
type PageDocument = PrismicDocument<
  {
    meta_description: KeyTextField;
    meta_title: KeyTextField;
    slices: SliceZone;
  },
  "page"
>;

export type ParsedPage = {
  enableIndexing: boolean;
  pageDescription: string;
  pageSlug: string;
  pageTitle: string;
  publishDate?: string;
  slices: SliceZone;
  updatedAt: string;
};

const PAGE_TYPE = "page";

const parsePage = (page: PageDocument): ParsedPage => ({
  enableIndexing: true,
  pageDescription: page.data.meta_description ?? "",
  pageSlug: page.uid ?? "",
  pageTitle: page.data.meta_title ?? page.uid ?? "",
  slices: page.data.slices,
  updatedAt: page.last_publication_date,
});

/**
 * Every "page" document, which prismic.config.json routes to /:uid. The client
 * reads drafts on its own during a preview, so \\\`preview\\\` only keeps the
 * signature every CMS shares.
 */
export const fetchPages = async (_opts: {
  preview: boolean;
}): Promise<ParsedPage[]> => {
  const pages = await createClient().getAllByType<PageDocument>(PAGE_TYPE);

  return pages.map(parsePage);
};

export const fetchPage = async ({
  slug,
}: {
  preview: boolean;
  slug: string;
}): Promise<ParsedPage | null> => {
  try {
    const page = await createClient().getByUID<PageDocument>(PAGE_TYPE, slug);

    return parsePage(page);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
};
`;
};

// ---------------------------------------------------------------------------
// src/prismic/richText.tsx
// ---------------------------------------------------------------------------

export const getPrismicRichText = (): string => {
  return `import type { RichTextField } from "@prismicio/client";
import { PrismicRichText } from "@prismicio/react";

type RichTextProps = {
  field: RichTextField | null;
};

export const RichText = (props: RichTextProps) => {
  const { field } = props;

  if (!field) {
    return null;
  }

  return <PrismicRichText field={field} />;
};
`;
};

// ---------------------------------------------------------------------------
// src/app/api/preview/route.ts
// ---------------------------------------------------------------------------

export const getPrismicPreviewRoute = (): string => {
  return `import { redirectToPreviewURL } from "@prismicio/next";
import type { NextRequest } from "next/server";
import { createClient } from "src/prismic/client";

/** Prismic sends editors here with a preview token, then on to the previewed page. */
export const GET = async (request: NextRequest) =>
  redirectToPreviewURL({ client: createClient(), request });
`;
};

// ---------------------------------------------------------------------------
// src/app/api/exit-preview/route.ts
// ---------------------------------------------------------------------------

export const getPrismicExitPreviewRoute = (): string => {
  return `import { exitPreview } from "@prismicio/next";
import { redirect } from "next/navigation";

/**
 * Ends a preview session. The Prismic toolbar calls this without a redirect;
 * the "Exit Draft Mode" link passes the page to return to.
 */
export const GET = async (request: Request) => {
  const response = await exitPreview();
  const target = new URL(request.url).searchParams.get("redirect");

  if (target?.startsWith("/") && !target.startsWith("//")) {
    redirect(target);
  }

  return response;
};
`;
};

// ---------------------------------------------------------------------------
// src/app/api/revalidate/route.ts
// ---------------------------------------------------------------------------

export const getPrismicRevalidateRoute = (): string => {
  return `import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

type WebhookBody = {
  secret?: string;
};

/**
 * Prismic's webhook calls this when content is published or unpublished.
 * Give the webhook the same secret as PRISMIC_WEBHOOK_SECRET.
 */
export const POST = async (request: Request) => {
  const secret = process.env.PRISMIC_WEBHOOK_SECRET;
  const body = (await request.json().catch(() => ({}))) as WebhookBody;

  if (!secret || body.secret !== secret) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  revalidateTag("prismic", "max");

  return NextResponse.json({ revalidated: true });
};
`;
};

// ---------------------------------------------------------------------------
// src/tests/factories/RichTextDocument.factory.ts
// ---------------------------------------------------------------------------

export const getPrismicRichTextDocumentFactory = (): string => {
  return `import { faker } from "@faker-js/faker";
import { type RichTextField, RichTextNodeType } from "@prismicio/client";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

/** A Prismic rich text field, wrapped so the factory can build and override it. */
export type RichTextDocument = {
  field: RichTextField;
};

type RichTextDocumentFactoryOptions = Record<string, never>;

const paragraphWithText = (text: string): RichTextField[number] => ({
  spans: [],
  text,
  type: RichTextNodeType.paragraph,
});

class RichTextDocumentFactory extends BaseFactory<
  RichTextDocument,
  RichTextDocumentFactoryOptions
> {
  build(
    attributes?: Partial<RichTextDocument>,
    _options?: RichTextDocumentFactoryOptions,
  ) {
    const instance = {
      field: [
        paragraphWithText(faker.lorem.sentence()),
        paragraphWithText(faker.lorem.sentence()),
      ],
    } satisfies RichTextDocument;

    const factoryBuilt: RichTextDocument = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      RichTextDocument,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const richTextDocumentFactory = new RichTextDocumentFactory();
`;
};

// ---------------------------------------------------------------------------
// docs/handbook/prismic.md
// ---------------------------------------------------------------------------

export const getHandbookPrismic = (): string => {
  return `# Prismic integration

Pages come from Prismic. This page covers the content model, generated types, getters and parsers, previews, and publishing.

## Content model and generated types

Prismic's models are the source of truth. \`customtypes/\` holds the models and \`prismicio-types.d.ts\` the TypeScript types; both are **generated** and **must never be edited by hand**.

- Change a model in Prismic's Type Builder, or with the Prismic CLI (\`npx prismic type\`, \`npx prismic field\`, \`npx prismic slice\`), then run \`pnpm types:prismic\` (\`prismic pull\`) to pull the models and regenerate the types.
- \`pnpm types:prismic\` needs \`npx prismic login\` first. Agents pass \`--task-id\` and \`--user-intent\` through: \`pnpm types:prismic --task-id <id> --user-intent "<request>"\` (run \`npx prismic task-id\` for the id).
- Look things up with \`npx prismic docs list\` and \`npx prismic docs view <path>\` rather than guessing at the API.

## Pages and routes

- The shared \`[slug]\` route renders documents of the **\`page\`** type. Give that type a UID field; Prismic adds \`meta_title\` and \`meta_description\` on its SEO & Metadata tab.
- \`prismic.config.json\` routes \`page\` to \`/:uid\`. Keep its routes in step with the folders under \`src/app/\`.
- \`generateStaticParams\` needs at least one published page, so publish one before the first build.

## Getters and parsers

- **Client**: \`src/prismic/client.ts\` — \`createClient()\` reads the repository from \`prismic.config.json\`, sends \`PRISMIC_ACCESS_TOKEN\` when the API is private, and turns on draft reads with \`enableAutoPreviews\`.
- **Getters**: \`src/prismic/get*.ts\` — call \`createClient()\` and return parsed shapes. \`getPages.ts\` implements \`fetchPages\` and \`fetchPage\`, which the \`[slug]\` route and the sitemap use.
- **Parsers**: turn Prismic documents into the props components take. Components never read raw documents.
- After \`pnpm types:prismic\`, replace the local \`PageDocument\` type in \`getPages.ts\` with \`Content.PageDocument\` from \`prismicio-types.d.ts\`.

## Slices

Pages are built from **slices**. The \`[slug]\` route renders a page's slice zone with \`<SliceZone components={components} slices={page.slices} />\`.

- Create a slice with \`npx prismic slice create <Name>\`, add fields with \`npx prismic field add\`, and connect it to the \`page\` type with \`npx prismic slice connect\`. Push the models with \`npx prismic push\`, or model in the Type Builder and run \`pnpm types:prismic\`.
- The CLI writes \`src/slices/<Name>/model.json\` (generated) and a starter \`src/slices/<Name>/index.tsx\`, and regenerates \`src/slices/index.ts\`, the \`components\` map (\`npx prismic gen slice-index\`).
- A slice component stays in \`index.tsx\` because the map imports it by folder. Rewrite the starter to this project's conventions: an arrow function typed with \`SliceComponentProps\` (no \`FC\`), named and default exports, and \`data-testid="rh<Name>"\` on the root.

## Slice simulator

The Page Builder draws live slice previews from \`/slice-simulator\`, which renders \`<SliceSimulator>\`. Tell Prismic where it runs with \`npx prismic preview set-simulator https://<your-site>\` (or \`http://localhost:3000\` while you work). Only that route lets Prismic frame it; every other route still sends \`X-Frame-Options: DENY\`.

## Rich text

Render rich text fields with \`RichText\` from \`src/prismic/richText.tsx\` (it wraps \`PrismicRichText\`). In specs, build fields with \`richTextDocumentFactory\` ([factories.md](factories.md)).

## Previews

- \`/api/preview\` is the preview URL Prismic calls (add it under **Settings → Previews**). It starts draft mode and opens the previewed page.
- \`<PrismicPreview>\` in the root layout adds Prismic's toolbar, which refreshes the page as drafts change and ends the session through \`/api/exit-preview\`.
- The client reads drafts by itself during a session; getters don't pass a ref.

## Publishing

Published content is cached under the \`prismic\` tag. Point a Prismic webhook (**Settings → Webhooks**, triggers: documents published and unpublished) at \`/api/revalidate\` with the secret from \`PRISMIC_WEBHOOK_SECRET\`, and the site refreshes when editors publish.
`;
};

// ---------------------------------------------------------------------------
// src/slices/index.ts  (`npx prismic gen slice-index` rewrites it)
// ---------------------------------------------------------------------------

export const getPrismicSliceIndex = (): string => {
  return `// Code generated by Prismic. DO NOT EDIT.

export const components = {};
`;
};

// ---------------------------------------------------------------------------
// src/app/slice-simulator/page.tsx  (under [locale] with i18n)
// ---------------------------------------------------------------------------

export const getPrismicSliceSimulatorPage = (): string => {
  return `import {
  getSlices,
  SliceSimulator,
  type SliceSimulatorParams,
} from "@prismicio/next";
import { SliceZone } from "@prismicio/react";
import type { Metadata } from "next";
import { components } from "src/slices";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

/** Prismic's Page Builder renders slices here to draw live previews. */
const SliceSimulatorPage = async ({ searchParams }: SliceSimulatorParams) => {
  const { state } = await searchParams;
  const slices = getSlices(state);

  return (
    <SliceSimulator>
      <SliceZone components={components} slices={slices} />
    </SliceSimulator>
  );
};

export default SliceSimulatorPage;
`;
};

export const prismic: CmsAdapter = {
  csp: {
    childSrc: ["*.prismic.io"],
    imgSrc: ["images.prismic.io"],
    scriptSrc: ["static.cdn.prismic.io", "*.prismic.io"],
  },
  dependencies: ["@prismicio/client", "@prismicio/next", "@prismicio/react"],
  devDependencies: ["prismic"],
  dir: "src/prismic",
  docs: {
    apiRoutesPreview: `| \`GET /api/preview\` | Start a preview session (Prismic calls it with a preview token) |
| \`GET /api/exit-preview\` | End the preview session |
| \`POST /api/revalidate\` | Refresh cached content (Prismic webhook, checks \`PRISMIC_WEBHOOK_SECRET\`) |
`,
    architectureDir: `### \`src/prismic/\`

- **Client**: \`src/prismic/client.ts\` — \`createClient()\` with routes from \`prismic.config.json\` and draft reads during previews.
- **Getters**: \`get*.ts\` files — async functions that query Prismic and return parsed shapes.
- **Rich text**: \`richText.tsx\` — renders rich text fields.
- **Slices**: \`src/slices/<Name>/index.tsx\` components, mapped by the generated \`src/slices/index.ts\`; \`/slice-simulator\` renders them for the Page Builder.
- **Types**: \`prismicio-types.d.ts\` and models in \`customtypes/\` — generated; run \`pnpm types:prismic\`.

`,
    conventions:
      "- **Prismic types**: Models in `customtypes/` and types in `prismicio-types.d.ts` are generated (`pnpm types:prismic`). Change models in Prismic or with the Prismic CLI, never by editing those files.\n- **Prismic ordering**: Do not sort Prismic results in the app. Order at fetch time with the client's `orderings` option.\n- **Slices**: Slice components live in `src/slices/<Name>/index.tsx`, the one place `index.tsx` is allowed, because the generated `src/slices/index.ts` imports them by folder.\n",
    driftReminder:
      "This session touched src/prismic/. If a model changed, run pnpm types:prismic and check the getters still match the generated types (see docs/handbook/prismic.md → Content model and generated types).",
    envPreview: `- **Start a preview**: Prismic calls \`src/app/api/preview/route.ts\` with a preview token; it enables draft mode and redirects to the page.
- **End a preview**: \`src/app/api/exit-preview/route.ts\`, from the Prismic toolbar or the "Exit Draft Mode" link.
- **Preview content**: \`createClient()\` in \`src/prismic/client.ts\` reads drafts during a preview session; getters don't pass anything.`,
    envSummary: `- **Prismic** — access token for a private API, and the webhook secret for \`/api/revalidate\`. The repository name lives in \`prismic.config.json\`.
`,
    platformScriptRows: `| \`pnpm types:prismic\` | Pull models into \`customtypes/\` and regenerate \`prismicio-types.d.ts\` (needs \`npx prismic login\`). |
`,
    readmeGettingStarted: `
# Pull Prismic models and generate TypeScript types (run npx prismic login first)
pnpm types:prismic
`,
    readmePreview:
      "Add `https://<your-site>/api/preview` (and `http://localhost:3000/api/preview` for local work) under **Settings → Previews** in Prismic. Editors start a preview from Prismic, and the toolbar ends it.",
    readmePrerequisite:
      "**Prismic repository** — Create the repository (or use an existing one) and run `npx prismic init --repo <your-repository-name>` to connect it; that writes the name into `prismic.config.json` and pulls the models. Add a `page` type with a UID field (then see **[Prismic setup](#prismic-setup)**).",
    readmeScriptsRow:
      "| `pnpm types:prismic` | Pull Prismic models and regenerate `prismicio-types.d.ts` |\n",
    readmeSetup: `## Prismic setup

1. Run \`npx prismic init --repo <your-repository-name>\` to connect your repository
2. Add a \`page\` type with a UID field in Prismic, then run \`pnpm types:prismic\`
3. Add the preview URL under **Settings → Previews** and a webhook to \`/api/revalidate\` under **Settings → Webhooks**, and point the slice simulator at your site with \`npx prismic preview set-simulator https://<your-site>\`
4. Fill in \`PRISMIC_WEBHOOK_SECRET\` (and \`PRISMIC_ACCESS_TOKEN\` if the API is private) in \`.env.local\`

See \`docs/handbook/prismic.md\` for full guidance.

`,
    sourceLayoutRows: "",
  },
  envExample: [
    "# ── Prismic ─────────────────────────────────────────────────────────────────",
    "# The repository name lives in prismic.config.json.",
    "# Access token, only when the repository's API is private",
    "PRISMIC_ACCESS_TOKEN=",
    "",
    "# Secret Prismic's webhook sends to /api/revalidate",
    "PRISMIC_WEBHOOK_SECRET=",
    "",
  ],
  files: () => [
    ["prismic.config.json", getPrismicConfig()],
    ["src/prismic/client.ts", getPrismicClient()],
    ["src/prismic/getPages.ts", getPrismicGetPages()],
    ["src/prismic/richText.tsx", getPrismicRichText()],
    ["src/slices/index.ts", getPrismicSliceIndex()],
  ],
  generatedPaths: [
    "prismicio-types.d.ts",
    "customtypes/",
    "src/slices/index.ts",
    "src/slices/*/model.json",
  ],
  handbook: { content: getHandbookPrismic, file: "prismic.md" },
  id: "prismic",
  imageHosts: ["images.prismic.io"],
  name: "Prismic",
  nextConfigEnv: [],
  optimizePackageImports: [],
  preconnectOrigins: ["https://images.prismic.io"],
  preview: {
    exitPath: "/api/exit-preview",
    simulator: {
      frameAncestors: ["https://*.prismic.io"],
      page: getPrismicSliceSimulatorPage,
      route: "slice-simulator",
    },
    layout: {
      element: "<PrismicPreview repositoryName={repositoryName} />",
      imports: [
        'import { PrismicPreview } from "@prismicio/next";',
        'import { repositoryName } from "src/prismic/client";',
      ],
    },
    routes: () => [
      ["src/app/api/preview/route.ts", getPrismicPreviewRoute()],
      ["src/app/api/exit-preview/route.ts", getPrismicExitPreviewRoute()],
      ["src/app/api/revalidate/route.ts", getPrismicRevalidateRoute()],
    ],
  },
  richTextDocumentFactory: getPrismicRichTextDocumentFactory,
  indexComponentDirs: ["src/slices"],
  pageBody: {
    imports: [
      'import { SliceZone } from "@prismicio/react";',
      'import { components } from "src/slices";',
    ],
    jsx: "<SliceZone components={components} slices={page.slices} />",
  },
  tsconfigPaths: { "prismic.config.json": "./prismic.config.json" },
  typesScript: { command: "prismic pull", name: "types:prismic" },
};
