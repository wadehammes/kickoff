import type { Cms, ProjectAnswers } from "../../types.js";

type FileList = readonly (readonly [path: string, content: string])[];

/**
 * Everything that changes between content sources. Shared templates read these
 * fields instead of naming a CMS, so adding one means writing one adapter.
 *
 * Every adapter writes `<dir>/getPages.ts` exporting `fetchPages({ preview })`
 * and `fetchPage({ slug, preview })`. Pages carry `pageSlug`, `pageTitle`,
 * `pageDescription`, `enableIndexing`, and `updatedAt`. The shared `[slug]`
 * route and the sitemap read pages through that contract. Previews run in
 * Next.js draft mode, which the shared layout shows a banner for.
 */
export type CmsAdapter = {
  id: Exclude<Cms, "none">;
  /** Product name, as it appears in prose. */
  name: string;
  /** Source folder for the client, getters, and parsers. */
  dir: string;
  /** Generated files and folders (folders end in "/"); agents and hooks keep hands off. */
  generatedPaths: readonly string[];
  /** package.json script that regenerates the content types. */
  typesScript: { command: string; name: string };
  /** How draft content is previewed. */
  preview: {
    /** Route Handlers that start and end a preview session. */
    routes: () => FileList;
    /** Where the "Exit Draft Mode" link goes; it appends `?redirect=<path>`. */
    exitPath: string;
    /**
     * Env var the preview route checks. `pnpm dev:preview` opens draft mode
     * with it. Omit when the CMS starts previews itself.
     */
    secretEnv?: string;
    /** Rendered inside `<html>` after `<body>` in the root layout. */
    layout?: { element: string; imports: readonly string[] };
  };
  /** Package names; versions live in DEFAULT_VERSIONS. */
  dependencies: readonly string[];
  devDependencies: readonly string[];
  /** Lines added to `.env.local.example`. */
  envExample: readonly string[];
  /** Entries for the `env` block in next.config.ts, rendered as source lines. */
  nextConfigEnv: readonly string[];
  /** Hosts next/image may load from. */
  imageHosts: readonly string[];
  /** Hosts added to Content Security Policy directives. */
  csp: {
    childSrc: readonly string[];
    imgSrc: readonly string[];
    scriptSrc: readonly string[];
  };
  /** Origins the root layout preconnects to. */
  preconnectOrigins: readonly string[];
  /** Packages added to `experimental.optimizePackageImports`. */
  optimizePackageImports: readonly string[];
  /** Extra tsconfig `paths` entries, so imports stay absolute. */
  tsconfigPaths: Readonly<Record<string, string>>;
  /** Files the adapter owns: client, getters, parsers, helpers, config. */
  files: () => FileList;
  /** `src/tests/factories/RichTextDocument.factory.ts` for this CMS's rich text. */
  richTextDocumentFactory: () => string;
  /** The CMS handbook page. */
  handbook: { content: (a: ProjectAnswers) => string; file: string };
  /** Prose that only applies to this CMS; shared pages place it. */
  docs: {
    /** api-routes.md section on the preview routes. */
    apiRoutesPreview: string;
    /** Architecture page section that tours `dir`. */
    architectureDir: string;
    /** conventions.md bullets on generated types and data rules. */
    conventions: string;
    /** Claude Stop hook reminder when a session touched `dir`. */
    driftReminder: string;
    /** env.md bullet naming the CMS env vars. */
    envSummary: string;
    /** env.md bullets on starting, ending, and reading previews. */
    envPreview: string;
    /** platform.md script rows. */
    platformScriptRows: string;
    /** README "Getting started" commands after install. */
    readmeGettingStarted: string;
    /** README section on previewing drafts. */
    readmePreview: string;
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
