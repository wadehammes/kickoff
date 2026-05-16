import path from "node:path";
import fsExtra from "fs-extra";

const { ensureDir, writeFile } = fsExtra;

import {
  getApiHelpers,
  getApiUrls,
  getAppError,
  getAppErrorCSS,
  getAppFonts,
  getAppLayout,
  getAppLoading,
  getAppManifest,
  getAppNotFound,
  getAppPage,
  getAppProviders,
  getAppRobots,
  getArrayHelpers,
  getArrayHelpersSpec,
  getBaseFactory,
  getBasePageObject,
  getBiomeConfig,
  getBrowserslistrc,
  getCIWorkflow,
  getClaude,
  getCommonInterfaces,
  getConstants,
  getContentfulCacheConfig,
  getContentfulCacheKeys,
  getContentfulClient,
  getContentfulHelpers,
  getContentfulPagination,
  getContentfulUtilHelpers,
  getCopyGlobal,
  getCssPropsDeclaration,
  getDependabotConfig,
  getDevWithPreview,
  getDisableDraftRoute,
  getDraftRoute,
  getEditorConfig,
  getEnvironmentHelpers,
  getEnvironmentHelpersSpec,
  getEnvLocalExample,
  getExitDraftModeLink,
  getFactoryHelpers,
  getFooterComponent,
  getFooterCSS,
  getGenerateSitemap,
  getGitignore,
  getGlobalError,
  getGlobalsCSS,
  getHandbookArchitecture,
  getHandbookComponents,
  getHandbookContentful,
  getHandbookConventions,
  getHandbookDistribution,
  getHandbookIntegrations,
  getHandbookLlms,
  getHandbookPatterns,
  getHandbookPlatform,
  getHandbookReadme,
  getHandbookSourceLayout,
  getI18nRequest,
  getI18nRouting,
  getJestConfig,
  getKeysMatch,
  getKnipConfig,
  getLabelerWorkflow,
  getLabelerYml,
  getLocaleLayout,
  getLocalePage,
  getLocaleSlugPage,
  getMakefile,
  getMakeSitemapJs,
  getMockIntersectionObserver,
  getMockMatchMedia,
  getMockNextNavigation,
  getNavigationComponent,
  getNavigationCSS,
  getNextConfig,
  getNextEnvDeclaration,
  getNotFoundPageComponent,
  getNotFoundPageCSS,
  getNpmrc,
  getPackageJson,
  getParseContentfulAsset,
  getPnpmWorkspace,
  getPostcssConfig,
  getPreviewLocal,
  getProxyTs,
  getReadme,
  getRefreshContentPage,
  getReleaseWorkflow,
  getRichText,
  getRichTextDocumentFactory,
  getRuntimeVariablesJson,
  getScaffoldSh,
  getSchema,
  getScriptsTsConfig,
  getSetEnvVars,
  getSetupTests,
  getSitemapIndex,
  getStringHelpers,
  getStringHelpersSpec,
  getStyleHelpers,
  getStylelintConfig,
  getToolVersions,
  getTsConfig,
  getTypesReactDts,
  getUrlHelpers,
  getUrlHelpersSpec,
  getUseIsBrowser,
  getVariablesCSS,
  getVerifyVercelForReleaseSh,
  getVerifyVercelRelease,
} from "./templates/index.js";
import type { ProjectAnswers } from "./types.js";

async function write(
  root: string,
  filePath: string,
  content: string,
): Promise<void> {
  const full = path.join(root, filePath);
  await ensureDir(path.dirname(full));
  await writeFile(full, content, "utf-8");
}

export async function generateProject(a: ProjectAnswers): Promise<void> {
  const root = a.useCurrentDir
    ? process.cwd()
    : path.resolve(process.cwd(), a.projectName);

  await ensureDir(root);

  // ── Root config files ──────────────────────────────────────────────────────
  await write(root, "package.json", getPackageJson(a));
  await write(root, "tsconfig.json", getTsConfig());
  await write(root, "biome.json", getBiomeConfig());
  await write(root, "stylelint.config.ts", getStylelintConfig());
  await write(root, "postcss.config.json", getPostcssConfig());
  await write(root, ".tool-versions", getToolVersions());
  await write(root, ".editorconfig", getEditorConfig());
  await write(root, ".npmrc", getNpmrc());
  await write(root, ".browserslistrc", getBrowserslistrc());
  await write(root, ".gitignore", getGitignore());
  await write(root, "pnpm-workspace.yaml", getPnpmWorkspace());
  await write(root, "Makefile", getMakefile(a));
  await write(root, "jest.config.ts", getJestConfig());
  await write(root, "knip.json", getKnipConfig());
  await write(root, "cssprops.d.ts", getCssPropsDeclaration());
  await write(root, "next-env.d.ts", getNextEnvDeclaration());
  await write(root, "next.config.ts", getNextConfig(a));
  await write(root, ".env.local.example", getEnvLocalExample(a));
  await write(root, "README.md", getReadme(a));

  // ── CLAUDE.md ──────────────────────────────────────────────────────────────
  await write(root, "CLAUDE.md", getClaude(a));

  // ── docs/handbook/ ─────────────────────────────────────────────────────────
  await write(root, "docs/handbook/README.md", getHandbookReadme(a));
  await write(root, "docs/handbook/llms.md", getHandbookLlms(a));
  await write(
    root,
    "docs/handbook/architecture.md",
    getHandbookArchitecture(a),
  );
  await write(root, "docs/handbook/conventions.md", getHandbookConventions(a));
  await write(root, "docs/handbook/contentful.md", getHandbookContentful(a));
  await write(root, "docs/handbook/components.md", getHandbookComponents(a));
  await write(root, "docs/handbook/patterns.md", getHandbookPatterns(a));
  await write(root, "docs/handbook/platform.md", getHandbookPlatform(a));
  await write(
    root,
    "docs/handbook/integrations.md",
    getHandbookIntegrations(a),
  );
  await write(
    root,
    "docs/handbook/distribution.md",
    getHandbookDistribution(a),
  );
  await write(
    root,
    "docs/handbook/source-layout.md",
    getHandbookSourceLayout(a),
  );

  // ── public/ ────────────────────────────────────────────────────────────────
  await write(root, "public/sitemap-index.xml", getSitemapIndex(a));

  // ── .github/ ───────────────────────────────────────────────────────────────
  await write(root, ".github/workflows/ci.yml", getCIWorkflow());
  await write(root, ".github/workflows/release.yml", getReleaseWorkflow());
  await write(root, ".github/dependabot.yml", getDependabotConfig());
  await write(root, ".github/labeler.yml", getLabelerYml());
  await write(root, ".github/workflows/labeler.yml", getLabelerWorkflow());

  // ── .jest/ ─────────────────────────────────────────────────────────────────
  await write(root, ".jest/setEnvVars.ts", getSetEnvVars());
  await write(root, ".jest/setupTests.ts", getSetupTests());

  // ── scripts/ ───────────────────────────────────────────────────────────────
  await write(root, "scripts/scaffold.sh", getScaffoldSh());
  await write(root, "scripts/make_sitemap.js", getMakeSitemapJs(a));
  await write(root, "scripts/tsconfig.json", getScriptsTsConfig());
  await write(
    root,
    "scripts/verify-vercel-release.ts",
    getVerifyVercelRelease(),
  );
  await write(
    root,
    "scripts/verify-vercel-for-release.sh",
    getVerifyVercelForReleaseSh(),
  );
  await write(root, "scripts/lib/preview-local.ts", getPreviewLocal());
  await write(root, "scripts/dev-with-preview.ts", getDevWithPreview(a));

  // ── src/@types/ ────────────────────────────────────────────────────────────
  await write(root, "src/@types/react.d.ts", getTypesReactDts());

  // ── src/app/ ───────────────────────────────────────────────────────────────
  await write(root, "src/app/layout.tsx", getAppLayout(a));
  await write(root, "src/app/page.tsx", getAppPage());
  await write(root, "src/app/providers.tsx", getAppProviders());
  await write(root, "src/app/fonts.ts", getAppFonts());
  await write(root, "src/app/error.tsx", getAppError());
  await write(root, "src/app/error.module.css", getAppErrorCSS());
  await write(root, "src/app/loading.tsx", getAppLoading());
  await write(root, "src/app/not-found.tsx", getAppNotFound());
  await write(root, "src/app/robots.ts", getAppRobots(a));
  await write(root, "src/app/manifest.ts", getAppManifest(a));
  await write(root, "src/app/fonts/.gitkeep", "");
  await write(root, "src/app/global-error.tsx", getGlobalError());
  await write(
    root,
    "src/app/refresh-content/page.tsx",
    getRefreshContentPage(a),
  );

  // ── src/app/[slug]/ ──────────────────────────────────────────────────────────
  await write(root, "src/app/[slug]/page.tsx", getSlugPage());

  // ── src/app/api/ ───────────────────────────────────────────────────────────
  await write(root, "src/app/api/draft/route.ts", getDraftRoute());
  await write(
    root,
    "src/app/api/disable-draft/route.ts",
    getDisableDraftRoute(),
  );

  // ── src/components/ ────────────────────────────────────────────────────────
  await write(
    root,
    "src/components/Navigation/Navigation.component.tsx",
    getNavigationComponent(a),
  );
  await write(
    root,
    "src/components/Navigation/Navigation.module.css",
    getNavigationCSS(),
  );
  await write(
    root,
    "src/components/Footer/Footer.component.tsx",
    getFooterComponent(a),
  );
  await write(root, "src/components/Footer/Footer.module.css", getFooterCSS());
  await write(
    root,
    "src/components/ExitDraftModeLink/ExitDraftModeLink.component.tsx",
    getExitDraftModeLink(),
  );
  await write(
    root,
    "src/components/NotFoundPage/NotFoundPage.component.tsx",
    getNotFoundPageComponent(),
  );
  await write(
    root,
    "src/components/NotFoundPage/NotFoundPage.module.css",
    getNotFoundPageCSS(),
  );

  // ── src/contentful/ ────────────────────────────────────────────────────────
  await write(root, "src/contentful/client.ts", getContentfulClient());
  await write(root, "src/contentful/helpers.ts", getContentfulHelpers());
  await write(
    root,
    "src/contentful/cacheConfig.ts",
    getContentfulCacheConfig(),
  );
  await write(
    root,
    "src/contentful/parseContentfulAsset.ts",
    getParseContentfulAsset(),
  );
  await write(root, "src/contentful/richText.tsx", getRichText());
  await write(root, "src/contentful/types/.gitkeep", "");
  await write(root, "src/contentful/cacheKeys.ts", getContentfulCacheKeys());
  await write(
    root,
    "src/contentful/contentfulPagination.ts",
    getContentfulPagination(),
  );

  // ── src/types/ ───────────────────────────────────────────────────────────────
  await write(root, "src/types/KeysMatch.ts", getKeysMatch());

  // ── src/api/ ───────────────────────────────────────────────────────────────
  await write(root, "src/api/helpers.ts", getApiHelpers());
  await write(root, "src/api/urls.ts", getApiUrls());

  // ── src/copy/ ───────────────────────────────────────────────────────────────
  await write(root, "src/copy/global.ts", getCopyGlobal(a));

  // ── src/hooks/ ───────────────────────────────────────────────────────────────
  await write(root, "src/hooks/useIsBrowser.ts", getUseIsBrowser());

  // ── src/interfaces/ ────────────────────────────────────────────────────────
  await write(
    root,
    "src/interfaces/common.interfaces.ts",
    getCommonInterfaces(),
  );

  // ── src/lib/ ───────────────────────────────────────────────────────────────
  await write(root, "src/lib/generateSitemap.ts", getGenerateSitemap(a));
  await write(root, "src/lib/schema.ts", getSchema(a));

  // ── src/styles/ ────────────────────────────────────────────────────────────
  await write(root, "src/styles/globals.css", getGlobalsCSS(a));
  await write(root, "src/styles/variables.css", getVariablesCSS(a));
  await write(
    root,
    "src/styles/runtime-variables.json",
    getRuntimeVariablesJson(),
  );

  // ── src/tests/ ─────────────────────────────────────────────────────────────
  await write(root, "src/tests/basePageObject.po.ts", getBasePageObject());
  await write(root, "src/tests/test-utils.tsx", getTestUtils());
  await write(
    root,
    "src/tests/mocks/mockIntersectionObserver.ts",
    getMockIntersectionObserver(),
  );
  await write(root, "src/tests/mocks/mockMatchMedia.ts", getMockMatchMedia());
  await write(
    root,
    "src/tests/mocks/mockNextNavigation.ts",
    getMockNextNavigation(),
  );

  // ── src/tests/factories/ ───────────────────────────────────────────────────
  await write(root, "src/tests/factories/BaseFactory.ts", getBaseFactory());
  await write(
    root,
    "src/tests/factories/RichTextDocument.factory.ts",
    getRichTextDocumentFactory(),
  );

  // ── src/utils/ ─────────────────────────────────────────────────────────────
  await write(root, "src/utils/constants.ts", getConstants());
  await write(root, "src/utils/array.helpers.ts", getArrayHelpers());
  await write(root, "src/utils/array.helpers.spec.ts", getArrayHelpersSpec());
  await write(root, "src/utils/string.helpers.ts", getStringHelpers());
  await write(root, "src/utils/string.helpers.spec.ts", getStringHelpersSpec());
  await write(root, "src/utils/url.helpers.ts", getUrlHelpers());
  await write(root, "src/utils/url.helpers.spec.ts", getUrlHelpersSpec());
  await write(
    root,
    "src/utils/environment.helpers.ts",
    getEnvironmentHelpers(a),
  );
  await write(
    root,
    "src/utils/environment.helpers.spec.ts",
    getEnvironmentHelpersSpec(a),
  );
  await write(
    root,
    "src/utils/contentful.helpers.ts",
    getContentfulUtilHelpers(),
  );
  await write(root, "src/utils/style.helpers.ts", getStyleHelpers());
  await write(root, "src/utils/factory.helpers.ts", getFactoryHelpers());

  // ── src/proxy.ts ───────────────────────────────────────────────────────────────
  await write(root, "src/proxy.ts", getProxyTs());

  // ── i18n (conditional) ───────────────────────────────────────────────────────
  if (a.includeI18n) {
    await write(root, "src/i18n/routing.ts", getI18nRouting());
    await write(root, "src/i18n/request.ts", getI18nRequest());
    await write(root, "src/app/[locale]/layout.tsx", getLocaleLayout(a));
    await write(root, "src/app/[locale]/page.tsx", getLocalePage());
    await write(root, "src/app/[locale]/[slug]/page.tsx", getLocaleSlugPage());
    await write(root, "src/app/[locale]/not-found.tsx", getAppNotFound());
  }
}

// Re-export for use in generator
function getSlugPage(): string {
  return `import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { fetchPage, fetchPages } from "src/contentful/getPages";
import type { SitemapItem } from "src/lib/generateSitemap";
import { outputSitemap } from "src/lib/generateSitemap";
import {
  createBreadcrumbSchema,
  createOrganizationSchema,
  createSchemaGraph,
  createWebPageSchema,
} from "src/lib/schema";
import {
  EXCLUDED_PAGE_SLUGS_FROM_BUILD,
  HOME_PAGE_SLUG,
} from "src/utils/constants";
import { envUrl } from "src/utils/helpers";

export const revalidate = 2592000;
export const dynamicParams = false;

interface PageParams {
  slug: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const pages = await fetchPages({ preview: false });

  if (pages) {
    const routes: SitemapItem[] = pages
      .map((page) => {
        if (!page.enableIndexing) {
          return { route: "", modTime: "" };
        }

        if (page.pageSlug === HOME_PAGE_SLUG) {
          return { route: "/", modTime: page.updatedAt };
        }

        return { route: \`/\${page.pageSlug}\`, modTime: page.updatedAt };
      })
      .filter((item: SitemapItem) => item.route.length > 0);

    outputSitemap(routes, "pages");
  }

  return pages
    .filter((page) => !EXCLUDED_PAGE_SLUGS_FROM_BUILD.includes(page.pageSlug))
    .map((page) => ({ slug: page.pageSlug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const draft = await draftMode();

  const page = await fetchPage({ slug, preview: draft.isEnabled });

  if (!page) {
    return notFound();
  }

  const url =
    page.pageSlug === HOME_PAGE_SLUG
      ? envUrl()
      : \`\${envUrl()}/\${page.pageSlug}\`;
  const title = page.pageTitle;

  return {
    metadataBase: new URL(url),
    alternates: { canonical: "/" },
    title,
    description: page.pageDescription,
    robots:
      page.enableIndexing && process.env.ENVIRONMENT === "production"
        ? "index, follow"
        : "noindex, nofollow",
    openGraph: {
      title,
      description: page.pageDescription,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.pageDescription,
    },
  };
}

async function Page({ params }: PageProps) {
  const { slug } = await params;
  const draft = await draftMode();

  const page = await fetchPage({ slug, preview: draft.isEnabled });

  if (!page) {
    return notFound();
  }

  const pageUrl =
    page.pageSlug === HOME_PAGE_SLUG
      ? envUrl()
      : \`\${envUrl()}/\${page.pageSlug}\`;

  const publisher = createOrganizationSchema();
  const breadcrumbItems: { name: string; url: string }[] = [
    { name: "Home", url: envUrl() },
  ];

  if (page.pageSlug !== HOME_PAGE_SLUG) {
    breadcrumbItems.push({
      name: page.pageTitle,
      url: pageUrl,
    });
  }

  const breadcrumb = createBreadcrumbSchema(breadcrumbItems);

  const webPage = createWebPageSchema({
    url: pageUrl,
    name: page.pageTitle,
    description: page.pageDescription,
    datePublished: page.publishDate,
    dateModified: page.updatedAt,
    breadcrumb,
    publisher,
  });

  const schemaGraph = createSchemaGraph([webPage]);

  return (
    <>
      {/* TODO: Add JsonLd component and page-specific component here */}
      <pre style={{ display: "none" }}>{JSON.stringify(schemaGraph)}</pre>
      <div className="page-container">
        <h1>{page.pageTitle}</h1>
      </div>
    </>
  );
}

export default Page;
`;
}

function getTestUtils(): string {
  return `import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement } from "react";
import type { PropsWithChildrenOnly } from "src/@types/react";

const Providers = ({ children }: PropsWithChildrenOnly) => <>{children}</>;

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) => render(ui, { wrapper: Providers, ...options });

export * from "@testing-library/react";

export { customRender as render };
`;
}
