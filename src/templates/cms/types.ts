import type { Cms, ProjectAnswers } from "../../types.js";

/**
 * Everything that changes between content sources. Shared templates read these
 * fields instead of naming a CMS, so adding one means writing one adapter.
 *
 * Every adapter writes `<dir>/getPages.ts` exporting `fetchPages({ preview })`
 * and `fetchPage({ slug, preview })`. Pages carry `pageSlug`, `pageTitle`,
 * `pageDescription`, `enableIndexing`, and `updatedAt`. The shared `[slug]`
 * route and the sitemap read pages through that contract, and preview runs
 * through Next.js draft mode at `/api/draft` and `/api/disable-draft`.
 */
export type CmsAdapter = {
  id: Exclude<Cms, "none">;
  /** Product name, as it appears in prose. */
  name: string;
  /** Source folder for the client, getters, and parsers. */
  dir: string;
  /** Generated content types; agents and hooks keep hands off. */
  generatedTypesDir: string;
  /** package.json script that regenerates the content types. */
  typesScript: { command: string; name: string };
  /** Env var `/api/draft` checks before enabling draft mode. */
  previewSecretEnv: string;
  /** Package names; versions live in DEFAULT_VERSIONS. */
  dependencies: readonly string[];
  devDependencies: readonly string[];
  /** Lines added to `.env.local.example`. */
  envExample: readonly string[];
  /** Entries for the `env` block in next.config.ts, rendered as source lines. */
  nextConfigEnv: readonly string[];
  /** Hosts next/image may load from. */
  imageHosts: readonly string[];
  /** Hosts added to the CSP `img-src` directive. */
  cspImgHosts: readonly string[];
  /** Origins the root layout preconnects to. */
  preconnectOrigins: readonly string[];
  /** Packages added to `experimental.optimizePackageImports`. */
  optimizePackageImports: readonly string[];
  /** Files the adapter owns: client, getters, parsers, helpers. */
  files: () => readonly (readonly [path: string, content: string])[];
  /** `src/tests/factories/RichTextDocument.factory.ts` for this CMS's rich text. */
  richTextDocumentFactory: () => string;
  /** The CMS handbook page. */
  handbook: { content: (a: ProjectAnswers) => string; file: string };
  /** Prose that only applies to this CMS; shared pages place it. */
  docs: {
    /** Architecture page section that tours `dir`. */
    architectureDir: string;
    /** conventions.md bullets on generated types and data rules. */
    conventions: string;
    /** env.md bullet naming the CMS env vars. */
    envSummary: string;
    /** env.md bullet on how getters read preview content. */
    envPreview: string;
    /** platform.md script rows. */
    platformScriptRows: string;
    /** README "Getting started" commands after install. */
    readmeGettingStarted: string;
    /** README prerequisite step (after its number). */
    readmePrerequisite: string;
    /** README scripts table rows. */
    readmeScriptsRow: string;
    /** README setup section. */
    readmeSetup: string;
    /** source-layout.md rows for CMS helpers in src/utils/. */
    sourceLayoutRows: string;
  };
};
