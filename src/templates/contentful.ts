// ---------------------------------------------------------------------------
// src/contentful/client.ts
// ---------------------------------------------------------------------------

export function getContentfulClient(): string {
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
}

// ---------------------------------------------------------------------------
// src/contentful/helpers.ts
// ---------------------------------------------------------------------------

export function getContentfulHelpers(): string {
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
}

// ---------------------------------------------------------------------------
// src/contentful/cacheConfig.ts
// ---------------------------------------------------------------------------

export function getContentfulCacheConfig(): string {
  return `import safeJsonStringify from "safe-json-stringify";

export const CONTENTFUL_CACHE_REVALIDATE_SECONDS = 60 * 60 * 24 * 30;

export function sanitizeForCache<T>(value: T): T {
  return safeJsonStringify.ensureProperties(value) as T;
}
`;
}

// ---------------------------------------------------------------------------
// src/contentful/cacheKeys.ts
// ---------------------------------------------------------------------------

export function getContentfulCacheKeys(): string {
  return `export const CONTENTFUL_CACHE_TAG = "contentful";

export const CONTENTFUL_TAGS = {
  navigation: "contentful-navigation",
  page: "contentful-page",
  pages: "contentful-pages",
} as const;

function contentfulKey(parts: string[]): string[] {
  return ["contentful", ...parts];
}

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
}

// ---------------------------------------------------------------------------
// src/contentful/contentfulPagination.ts
// ---------------------------------------------------------------------------

export function getContentfulPagination(): string {
  return `/** \`limit\` per Contentful \`getEntries\` call in paginated fetch loops (API max is 1000). */
export const CONTENTFUL_BATCH_LIMIT = 500;
`;
}

// ---------------------------------------------------------------------------
// src/contentful/parseContentfulAsset.ts
// ---------------------------------------------------------------------------

export function getParseContentfulAsset(): string {
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
}

// ---------------------------------------------------------------------------
// src/contentful/richText.tsx
// ---------------------------------------------------------------------------

export function getRichText(): string {
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
}

// ---------------------------------------------------------------------------
// src/contentful/getPages.ts  (stub until getters are implemented)
// ---------------------------------------------------------------------------

export function getContentfulGetPages(): string {
  return `/**
 * Replace with real Contentful queries as you add content types and parsers.
 * \`pnpm types:contentful\` generates models under \`src/contentful/types/\`.
 */

export const fetchPages = async (_opts: { preview: boolean }) => {
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
}
