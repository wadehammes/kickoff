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
} from "@prismicio/client";
import { createClient } from "src/prismic/client";

/**
 * The fields this file reads from the "page" type. Every page type gets them
 * on its SEO & Metadata tab. Swap in \\\`Content.PageDocument\\\` from
 * prismicio-types.d.ts once \\\`pnpm types:prismic\\\` has generated it.
 */
type PageDocument = PrismicDocument<
  { meta_description: KeyTextField; meta_title: KeyTextField },
  "page"
>;

export type ParsedPage = {
  enableIndexing: boolean;
  pageDescription: string;
  pageSlug: string;
  pageTitle: string;
  publishDate?: string;
  updatedAt: string;
};

const PAGE_TYPE = "page";

const parsePage = (page: PageDocument): ParsedPage => ({
  enableIndexing: true,
  pageDescription: page.data.meta_description ?? "",
  pageSlug: page.uid ?? "",
  pageTitle: page.data.meta_title ?? page.uid ?? "",
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
- **Types**: \`prismicio-types.d.ts\` and models in \`customtypes/\` — generated; run \`pnpm types:prismic\`.

`,
    conventions:
      "- **Prismic types**: Models in `customtypes/` and types in `prismicio-types.d.ts` are generated (`pnpm types:prismic`). Change models in Prismic or with the Prismic CLI, never by editing those files.\n- **Prismic ordering**: Do not sort Prismic results in the app. Order at fetch time with the client's `orderings` option.\n",
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
3. Add the preview URL under **Settings → Previews** and a webhook to \`/api/revalidate\` under **Settings → Webhooks**
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
  ],
  generatedPaths: ["prismicio-types.d.ts", "customtypes/"],
  handbook: { content: getHandbookPrismic, file: "prismic.md" },
  id: "prismic",
  imageHosts: ["images.prismic.io"],
  name: "Prismic",
  nextConfigEnv: [],
  optimizePackageImports: [],
  preconnectOrigins: ["https://images.prismic.io"],
  preview: {
    exitPath: "/api/exit-preview",
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
  tsconfigPaths: { "prismic.config.json": "./prismic.config.json" },
  typesScript: { command: "prismic pull", name: "types:prismic" },
};
