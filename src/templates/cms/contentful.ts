import { getDisableDraftRoute, getDraftRoute } from "../app.js";
import type { CmsAdapter } from "./types.js";

// ---------------------------------------------------------------------------
// src/contentful/client.ts
// ---------------------------------------------------------------------------

export const getContentfulClient = (): string => {
  return `import { createClient } from "contentful";

interface InitOptions {
  preview?: boolean;
}

const contentfulSpaceId = process.env.CONTENTFUL_SPACE_ID as string;
const contentfulContentDeliveryToken = process.env
  .CONTENTFUL_CONTENT_DELIVERY_API_KEY as string;
const contentfulPreviewToken = process.env.CONTENTFUL_PREVIEW_API_KEY as string;

const client = createClient({
  space: contentfulSpaceId,
  accessToken: contentfulContentDeliveryToken,
});

const previewClient = createClient({
  space: contentfulSpaceId,
  accessToken: contentfulPreviewToken,
  host: "preview.contentful.com",
});

export const contentfulClient = ({ preview = false }: InitOptions) => {
  if (preview) {
    return previewClient;
  }

  return client;
};
`;
};

// ---------------------------------------------------------------------------
// src/contentful/helpers.ts
// ---------------------------------------------------------------------------

export const getContentfulHelpers = (): string => {
  return `import type { EntryFieldTypes } from "contentful";

export type ExtractSymbolType<T> =
  T extends EntryFieldTypes.Symbol<infer U> ? U : never;

// Forces every key of T to be present in the value (optional keys included).
// Apply to a parser's return type to catch silently dropped fields.
export type ContentfulParseShape<T> = Pick<T, RequiredKeys<T>> & {
  [K in Exclude<keyof T, RequiredKeys<T>>]-?: T[K] | undefined;
};

type RequiredKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends { [P in K]: T[K] }
    ? never
    : K;
}[keyof T];

export type ContentfulRequiredKeys<TFields> = Exclude<
  RequiredKeys<TFields>,
  "entryTitle"
>;

type ContentfulRequiredSet<TFields, TAdditionalKeys extends string> =
  | ContentfulRequiredKeys<TFields>
  | TAdditionalKeys;

type ContentfulAllowedKeys<
  TFields,
  TAdditionalKeys extends string,
  TOptionalAdditionalKeys extends string,
> = keyof TFields | TAdditionalKeys | TOptionalAdditionalKeys | "entryTitle";

type ContentfulTypeCheckMissingFields<
  TFields,
  TAdditionalKeys extends string,
  TParsedType,
> = Exclude<keyof TFields | TAdditionalKeys, keyof TParsedType | "entryTitle">;

type ContentfulTypeCheckMissingRequired<
  TFields,
  TAdditionalKeys extends string,
  TParsedType,
> = Exclude<
  ContentfulRequiredSet<TFields, TAdditionalKeys>,
  RequiredKeys<TParsedType>
>;

type ContentfulTypeCheckExtraRequired<
  TFields,
  TAdditionalKeys extends string,
  TParsedType,
> = Exclude<
  RequiredKeys<TParsedType>,
  ContentfulRequiredSet<TFields, TAdditionalKeys>
>;

type ContentfulTypeCheckExtraFields<
  TFields,
  TAdditionalKeys extends string,
  TOptionalAdditionalKeys extends string,
  TParsedType,
> = Exclude<
  keyof TParsedType,
  ContentfulAllowedKeys<TFields, TAdditionalKeys, TOptionalAdditionalKeys>
>;

export type ContentfulTypeCheck<
  TParsedType,
  TFields,
  TAdditionalKeys extends string = never,
  TOptionalAdditionalKeys extends string = never,
> = [
  ContentfulTypeCheckMissingFields<TFields, TAdditionalKeys, TParsedType>,
] extends [never]
  ? [
      ContentfulTypeCheckMissingRequired<TFields, TAdditionalKeys, TParsedType>,
    ] extends [never]
    ? [
        ContentfulTypeCheckExtraRequired<TFields, TAdditionalKeys, TParsedType>,
      ] extends [never]
      ? [
          ContentfulTypeCheckExtraFields<
            TFields,
            TAdditionalKeys,
            TOptionalAdditionalKeys,
            TParsedType
          >,
        ] extends [never]
        ? true
        : {
            extraFields: ContentfulTypeCheckExtraFields<
              TFields,
              TAdditionalKeys,
              TOptionalAdditionalKeys,
              TParsedType
            >;
          }
      : {
          extraRequired: ContentfulTypeCheckExtraRequired<
            TFields,
            TAdditionalKeys,
            TParsedType
          >;
        }
    : {
        missingRequired: ContentfulTypeCheckMissingRequired<
          TFields,
          TAdditionalKeys,
          TParsedType
        >;
      }
  : {
      missingFields: ContentfulTypeCheckMissingFields<
        TFields,
        TAdditionalKeys,
        TParsedType
      >;
    };
`;
};

// ---------------------------------------------------------------------------
// src/contentful/cacheConfig.ts
// ---------------------------------------------------------------------------

export const getContentfulCacheConfig = (): string => {
  return `import safeJsonStringify from "safe-json-stringify";

export const CONTENTFUL_CACHE_REVALIDATE_SECONDS = 60 * 60 * 24 * 30;

export const sanitizeForCache = <T>(value: T): T => {
  return safeJsonStringify.ensureProperties(value) as T;
};
`;
};

// ---------------------------------------------------------------------------
// src/contentful/cacheKeys.ts
// ---------------------------------------------------------------------------

export const getContentfulCacheKeys = (): string => {
  return `export const CONTENTFUL_CACHE_TAG = "contentful";

export const CONTENTFUL_TAGS = {
  navigation: "contentful-navigation",
  page: "contentful-page",
  pages: "contentful-pages",
} as const;

const contentfulKey = (parts: string[]): string[] => {
  return ["contentful", ...parts];
};

export const cacheKeys = {
  navigation: (slug: string, preview: boolean) => ({
    key: contentfulKey(["navigation", slug, String(preview)]),
    tags: [CONTENTFUL_CACHE_TAG, CONTENTFUL_TAGS.navigation],
  }),
  page: (slug: string, preview: boolean) => ({
    key: contentfulKey(["page", slug, String(preview)]),
    tags: [CONTENTFUL_CACHE_TAG, CONTENTFUL_TAGS.page],
  }),
  pages: (preview: boolean) => ({
    key: contentfulKey(["pages", String(preview)]),
    tags: [CONTENTFUL_CACHE_TAG, CONTENTFUL_TAGS.pages],
  }),
};
`;
};

// ---------------------------------------------------------------------------
// src/contentful/contentfulPagination.ts
// ---------------------------------------------------------------------------

export const getContentfulPagination = (): string => {
  return `/** \`limit\` per Contentful \`getEntries\` call in paginated fetch loops (API max is 1000). */
export const CONTENTFUL_BATCH_LIMIT = 500;
`;
};

// ---------------------------------------------------------------------------
// src/contentful/parseContentfulAsset.ts
// ---------------------------------------------------------------------------

export const getParseContentfulAsset = (): string => {
  return `import type { Asset, AssetLink } from "contentful";

export interface ContentfulAsset {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

type LinkedAsset = Asset<"WITHOUT_UNRESOLVABLE_LINKS">;

export const parseContentfulAsset = (
  asset?: LinkedAsset | { sys: AssetLink },
): ContentfulAsset | null => {
  if (!asset) {
    return null;
  }

  if (!("fields" in asset)) {
    return null;
  }

  const file = asset.fields.file;

  return {
    id: asset.sys.id,
    src: file?.url ?? "",
    alt: asset.fields.description ?? "",
    width: file?.details?.image?.width ?? 0,
    height: file?.details?.image?.height ?? 0,
  };
};
`;
};

// ---------------------------------------------------------------------------
// src/contentful/richText.tsx
// ---------------------------------------------------------------------------

export const getRichText = (): string => {
  return `import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import type { Document as RichTextDocument } from "@contentful/rich-text-types";

type RichTextProps = {
  document: RichTextDocument | null;
};

export const RichText = (props: RichTextProps) => {
  const { document } = props;

  if (!document) {
    return null;
  }

  return <>{documentToReactComponents(document)}</>;
};
`;
};

// ---------------------------------------------------------------------------
// src/contentful/getPages.ts  (stub until getters are implemented)
// ---------------------------------------------------------------------------

export const getContentfulGetPages = (): string => {
  return `/**
 * Replace with real Contentful queries as you add content types and parsers.
 * \`pnpm types:contentful\` generates models under \`src/contentful/types/\`.
 */

export const fetchPages = async (_opts: {
  preview: boolean;
}): Promise<ParsedPage[]> => {
  return [];
};

export type ParsedPage = {
  enableIndexing: boolean;
  pageDescription: string;
  pageSlug: string;
  pageTitle: string;
  publishDate?: string;
  updatedAt: string;
};

export const fetchPage = async (_opts: {
  preview: boolean;
  slug: string;
}): Promise<ParsedPage | null> => {
  return null;
};
`;
};

// ---------------------------------------------------------------------------
// src/utils/contentful.helpers.ts
// ---------------------------------------------------------------------------

export const getContentfulUtilHelpers = (): string => {
  return `export const createImageUrl = (src: string): string => {
  if (!src) {
    return "";
  }

  if (src.startsWith("http")) {
    return src;
  }

  return \`https:\${src}\`;
};

export const isVideo = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }

  return url.includes("videos.ctfassets.net");
};

export const getContentfulEntryWebUrl = (entryId: string): string | null => {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;

  if (!spaceId || !entryId) {
    return null;
  }

  return \`https://app.contentful.com/spaces/\${spaceId}/entries/\${entryId}\`;
};
`;
};

// ---------------------------------------------------------------------------
// src/tests/factories/RichTextDocument.factory.ts
// ---------------------------------------------------------------------------

export const getContentfulRichTextDocumentFactory = (): string => {
  return `import {
  BLOCKS,
  type Document,
  type TopLevelBlock,
} from "@contentful/rich-text-types";
import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

type RichTextDocumentFactoryOptions = Record<string, never>;

const paragraphWithText = (text: string): TopLevelBlock => ({
  content: [{ data: {}, marks: [], nodeType: "text", value: text }],
  data: {},
  nodeType: BLOCKS.PARAGRAPH,
});

class RichTextDocumentFactory extends BaseFactory<
  Document,
  RichTextDocumentFactoryOptions
> {
  build(
    attributes?: Partial<Document>,
    _options?: RichTextDocumentFactoryOptions,
  ) {
    const instance = {
      content: [
        paragraphWithText(faker.lorem.sentence()),
        paragraphWithText(faker.lorem.sentence()),
      ],
      data: {},
      nodeType: BLOCKS.DOCUMENT,
    } satisfies Document;

    const factoryBuilt: Document = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<Document, typeof instance> =
      undefined;

    return factoryBuilt;
  }
}

export const richTextDocumentFactory = new RichTextDocumentFactory();
`;
};

// ---------------------------------------------------------------------------
// docs/handbook/contentful.md
// ---------------------------------------------------------------------------

export const getHandbookContentful = (): string => {
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
5. **Component**: Implement the UI with CSS Modules per [css.md](css.md).

## Rich Text

Rich Text is rendered with \`@contentful/rich-text-react-renderer\`. Reuse shared options and typography patterns from nearby components so links and marks stay consistent.

The \`RichText\` component in \`src/contentful/richText.tsx\` is the standard wrapper. For components that need custom rendering options, pass an \`options\` object to \`documentToReactComponents\` directly.

## Client and environment

- **Client**: \`src/contentful/client.ts\` is the one place we construct Contentful clients for delivery and preview.
- Do **not** create ad-hoc clients in random files—reuse this module and the getters/parsers so tokens and behavior stay aligned.

## Cache

- **\`src/contentful/cacheConfig.ts\`**: \`sanitizeForCache\` and the revalidation seconds constant. Wrap getter calls with \`unstable_cache\` here to enable on-demand revalidation.
- **\`src/contentful/cacheKeys.ts\`**: Typed cache key constants and cache tags so keys are consistent across getters and revalidation routes.

## Pagination

Use \`CONTENTFUL_BATCH_LIMIT\` (defined in \`src/contentful/contentfulPagination.ts\`) when fetching large sets. Batch requests using \`skip\`/\`limit\` with a stable \`order\` so pagination is deterministic.
`;
};

export const contentful: CmsAdapter = {
  csp: { childSrc: [], imgSrc: ["images.ctfassets.net"], scriptSrc: [] },
  dependencies: [
    "@contentful/rich-text-react-renderer",
    "@contentful/rich-text-types",
    "contentful",
    "html-react-parser",
    "safe-json-stringify",
    "server-only",
  ],
  devDependencies: ["@types/safe-json-stringify", "cf-content-types-generator"],
  dir: "src/contentful",
  docs: {
    apiRoutesPreview: `| \`GET /api/draft\` | Enable draft mode (preview secret query param) |
| \`GET /api/disable-draft\` | Exit draft mode |
`,
    architectureDir: `### \`src/contentful/\`

- **Client**: \`src/contentful/client.ts\` — delivery vs preview clients from env.
- **Getters**: \`get*.ts\` files — async functions that call Contentful with \`preview\` flag.
- **Parsers**: \`parse*.ts\` — normalize raw entries into typed app shapes.
- **Cache**: \`cacheConfig.ts\` + \`cacheKeys.ts\` — \`unstable_cache\` wrappers and typed cache keys and cache tags.
- **Types**: \`src/contentful/types/\` — generated; run \`pnpm types:contentful\`.

`,
    conventions:
      "- **Contentful types**: Content types are generated into `src/contentful/types/` (run `pnpm types:contentful` with Contentful env vars set). Do not edit generated types by hand — for any reason.\n- **Contentful ordering**: Do not sort or alphabetize Contentful data in the app. Order at fetch time via the Contentful API `order` parameter.\n",
    driftReminder:
      "This session touched src/contentful/. Confirm the generated types still match the space before you stop: regenerate into a scratch dir and diff (see docs/handbook/contentful.md → Content types (generated)). Also check src/contentful/enums.ts against the live content type ids — it is not the dispatch source and drifts silently.",
    envPreview: `- **Enable draft**: \`src/app/api/draft/route.ts\` checks \`previewSecret\` against **\`CONTENTFUL_PREVIEW_SECRET\`**, enables draft mode, then redirects.
- **Disable draft**: \`src/app/api/disable-draft/route.ts\`.
- **Preview content**: Getters accept \`preview: true\` and use the preview client from \`src/contentful/client.ts\`.`,
    envSummary: `- **Contentful** — space, delivery/preview tokens, preview secret, CMA token for codegen.
`,
    platformScriptRows: `| \`pnpm types:contentful\` | Regenerate \`src/contentful/types\` (needs CMA env vars). |
`,
    readmeGettingStarted: `
# Generate Contentful TypeScript types (requires CONTENTFUL_SPACE_ID + CONTENTFUL_CMA_TOKEN in .env.local)
pnpm types:contentful
`,
    readmePreview: `Visit \`/api/draft?previewSecret=YOUR_SECRET&redirect=/\` to enable draft mode.
Visit \`/api/disable-draft\` to exit.

Or use \`pnpm dev:preview\` which auto-opens draft mode after the server starts.`,
    readmePrerequisite:
      "**Contentful space** — Provision the space/environment, create or import content types (`Page`, etc.), and collect the tokens you need for the **Contentful** variables in **`.env.local.example`** (then see **[Contentful setup](#contentful-setup)**).",
    readmeScriptsRow:
      "| `pnpm types:contentful` | Regenerate `src/contentful/types/` from Contentful space |\n",
    readmeSetup: `## Contentful setup

1. Create a Contentful space and add a \`Page\` content type
2. Fill in \`CONTENTFUL_SPACE_ID\`, \`CONTENTFUL_CONTENT_DELIVERY_API_KEY\`, \`CONTENTFUL_PREVIEW_API_KEY\`, \`CONTENTFUL_PREVIEW_SECRET\`, and \`CONTENTFUL_CMA_TOKEN\` in \`.env.local\`
3. Run \`pnpm types:contentful\` to generate TypeScript types in \`src/contentful/types/\`
4. Add getters in \`src/contentful/get*.ts\` and parsers in \`src/contentful/parse*.ts\`

See \`docs/handbook/contentful.md\` for full guidance.

`,
    sourceLayoutRows:
      "| `contentful.helpers.ts` | `createImageUrl`, `isVideo`, `getContentfulEntryWebUrl` |\n",
  },
  envExample: [
    "# ── Contentful ──────────────────────────────────────────────────────────────",
    "# Your Contentful Space ID (find it in Settings > API keys)",
    "CONTENTFUL_SPACE_ID=",
    "",
    "# Content Delivery API token (public, read-only)",
    "CONTENTFUL_CONTENT_DELIVERY_API_KEY=",
    "",
    "# Content Preview API token (for draft mode)",
    "CONTENTFUL_PREVIEW_API_KEY=",
    "",
    "# Secret used to authenticate draft mode requests",
    "CONTENTFUL_PREVIEW_SECRET=",
    "",
    "# Content Management API token (used for type generation only)",
    "CONTENTFUL_CMA_TOKEN=",
    "",
  ],
  files: () => [
    ["src/contentful/getPages.ts", getContentfulGetPages()],
    ["src/contentful/client.ts", getContentfulClient()],
    ["src/contentful/helpers.ts", getContentfulHelpers()],
    ["src/contentful/cacheConfig.ts", getContentfulCacheConfig()],
    ["src/contentful/parseContentfulAsset.ts", getParseContentfulAsset()],
    ["src/contentful/richText.tsx", getRichText()],
    ["src/contentful/types/.gitkeep", ""],
    ["src/contentful/cacheKeys.ts", getContentfulCacheKeys()],
    ["src/contentful/contentfulPagination.ts", getContentfulPagination()],
    ["src/utils/contentful.helpers.ts", getContentfulUtilHelpers()],
  ],
  generatedPaths: ["src/contentful/types/"],
  handbook: { content: getHandbookContentful, file: "contentful.md" },
  id: "contentful",
  imageHosts: [
    "images.ctfassets.net",
    "downloads.ctfassets.net",
    "videos.ctfassets.net",
  ],
  name: "Contentful",
  nextConfigEnv: [
    `    CONTENTFUL_CONTENT_DELIVERY_API_KEY:
      process.env.CONTENTFUL_CONTENT_DELIVERY_API_KEY,`,
    "    CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,",
  ],
  optimizePackageImports: [
    "@contentful/rich-text-react-renderer",
    "html-react-parser",
  ],
  preconnectOrigins: [
    "https://images.ctfassets.net",
    "https://assets.ctfassets.net",
  ],
  preview: {
    exitPath: "/api/disable-draft",
    routes: () => [
      [
        "src/app/api/draft/route.ts",
        getDraftRoute("CONTENTFUL_PREVIEW_SECRET"),
      ],
      ["src/app/api/disable-draft/route.ts", getDisableDraftRoute()],
    ],
    secretEnv: "CONTENTFUL_PREVIEW_SECRET",
  },
  richTextDocumentFactory: getContentfulRichTextDocumentFactory,
  tsconfigPaths: {},
  typesScript: {
    command:
      "export $(cat .env.local | sed '/^#/d; s/[$\"]//g'); cf-content-types-generator -s $CONTENTFUL_SPACE_ID -t $CONTENTFUL_CMA_TOKEN -o src/contentful/types -r -g && biome format --write src/contentful/types",
    name: "types:contentful",
  },
};
