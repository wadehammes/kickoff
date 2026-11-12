import path from "node:path";
import process from "node:process";
import fsExtra from "fs-extra";

const { ensureDir, writeFile } = fsExtra;

import {
  type AgentHookScriptName,
  getAgentHookScriptContent,
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
  getAppToast,
  getAppToastMock,
  getArrayHelpers,
  getArrayHelpersSpec,
  getBaseFactory,
  getBasePageObject,
  getBiomeConfig,
  getBrowserslistrc,
  getButtonComponent,
  getButtonCSS,
  getCIWorkflow,
  getClaude,
  getClaudeHookScriptNames,
  getClaudeHooksLib,
  getClaudeHooksReadme,
  getClaudeSettingsJson,
  getCollapsibleComponent,
  getCollapsibleCSS,
  getCommonInterfaces,
  getConstants,
  getContentfulCacheConfig,
  getContentfulCacheKeys,
  getContentfulClient,
  getContentfulGetPages,
  getContentfulHelpers,
  getContentfulPagination,
  getContentfulUtilHelpers,
  getCopyGlobal,
  getCssPropsDeclaration,
  getCursorHandbookGuardRunnerSpec,
  getCursorHookScriptNames,
  getCursorHooksJson,
  getCursorHooksLib,
  getCursorHooksReadme,
  getCursorRulesHandbook,
  getDependabotConfig,
  getDeployActiveRoute,
  getDeployBuildStatsComponent,
  getDeployBuildStatsRoute,
  getDeployButtonComponent,
  getDeployButtonPO,
  getDeployButtonTest,
  getDeployPageComponent,
  getDeployPageCSS,
  getDeployProgressStorage,
  getDeployProgressStorageSpec,
  getDeployQueryKeys,
  getDeployRoute,
  getDeployStatusRoute,
  getDeployTypes,
  getDevWithPreview,
  getDisableDraftRoute,
  getDraftRoute,
  getEditorConfig,
  getEnvironmentHelpers,
  getEnvironmentHelpersSpec,
  getEnvLocalExample,
  getExitDraftModeLink,
  getFactoryHelpers,
  getFieldErrorMessageComponent,
  getFooterComponent,
  getFooterCSS,
  getGenerateSitemap,
  getGitCommitSh,
  getGithooksCommitMsg,
  getGitignore,
  getGlobalError,
  getGlobalsCSS,
  getHandbookAgentWorkflow,
  getHandbookApiRoutes,
  getHandbookArchitecture,
  getHandbookComponents,
  getHandbookContentful,
  getHandbookConventions,
  getHandbookDataStorage,
  getHandbookDecisions,
  getHandbookDistribution,
  getHandbookDriftCheckMjs,
  getHandbookEditGuard,
  getHandbookEditGuardSpec,
  getHandbookFactories,
  getHandbookGlossary,
  getHandbookIntegrations,
  getHandbookLlms,
  getHandbookPatterns,
  getHandbookPlatform,
  getHandbookReadme,
  getHandbookSourceLayout,
  getHandbookSyncCheckSh,
  getHandbookTestRules,
  getHandbookTestRulesSpec,
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
  getRefreshContentAccess,
  getRefreshContentAccessSpec,
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
  getStopChecksSh,
  getStringHelpers,
  getStringHelpersSpec,
  getStyleHelpers,
  getStylelintConfig,
  getSvgMock,
  getToastHostComponent,
  getToastHostCSS,
  getToolVersions,
  getTsConfig,
  getTypesReactDts,
  getUiReadme,
  getUrlHelpers,
  getUrlHelpersSpec,
  getUseDeployBuildStatsQuery,
  getUseDeployMonitor,
  getUseIsBrowser,
  getUseTriggerDeployMutation,
  getVariablesCSS,
  getVercelDeploymentStatus,
  getVercelDeploymentStatusSpec,
  getVerifyVercelForReleaseSh,
  getVerifyVercelRelease,
  getVerifyVercelReleaseTestMjs,
  getWatchReleaseSh,
} from "./templates/index.js";
import type { ProjectAnswers } from "./types.js";

export type GenerateProjectOptions = {
  dryRun?: boolean;
  verbose?: boolean;
};

export const getScaffoldRoot = (a: ProjectAnswers): string =>
  a.useCurrentDir ? process.cwd() : path.resolve(process.cwd(), a.projectName);

export const generateProject = async (
  a: ProjectAnswers,
  options?: GenerateProjectOptions,
): Promise<void> => {
  const root = getScaffoldRoot(a);
  const dryRun = options?.dryRun ?? false;
  const verbose = options?.verbose ?? false;

  const write = async (
    relativePath: string,
    content: string,
    options?: { executable?: boolean },
  ): Promise<void> => {
    if (dryRun) {
      console.log(relativePath);
      return;
    }
    const full = path.join(root, relativePath);
    await ensureDir(path.dirname(full));
    const normalized = content.endsWith("\n") ? content : `${content}\n`;
    await writeFile(full, normalized, {
      encoding: "utf-8",
      mode: options?.executable ? 0o755 : undefined,
    });
    if (verbose) {
      console.log(`wrote ${relativePath}`);
    }
  };

  if (!dryRun) {
    await ensureDir(root);
  }

  // ── Root config files ──────────────────────────────────────────────────────
  await write("package.json", getPackageJson(a));
  await write("tsconfig.json", getTsConfig());
  await write("biome.json", getBiomeConfig());
  await write("stylelint.config.mjs", getStylelintConfig());
  await write("postcss.config.json", getPostcssConfig());
  // Detect running Node and pnpm versions to write into .tool-versions
  const nodeVersion = process.version.replace(/^v/, "");
  const pnpmVersion =
    process.env.npm_config_user_agent?.match(/pnpm\/(\S+)/)?.[1] ?? "latest";

  await write(".tool-versions", getToolVersions(nodeVersion, pnpmVersion));
  await write(".editorconfig", getEditorConfig());
  await write(".npmrc", getNpmrc());
  await write(".browserslistrc", getBrowserslistrc());
  await write(".gitignore", getGitignore());
  await write("pnpm-workspace.yaml", getPnpmWorkspace());
  await write("Makefile", getMakefile(a));
  await write("jest.config.ts", getJestConfig());
  await write("knip.json", getKnipConfig(a));
  await write("cssprops.d.ts", getCssPropsDeclaration());
  await write("next-env.d.ts", getNextEnvDeclaration());
  await write("next.config.ts", getNextConfig(a));
  await write(".env.local.example", getEnvLocalExample(a));
  await write("README.md", getReadme(a));

  // ── CLAUDE.md ──────────────────────────────────────────────────────────────
  await write("CLAUDE.md", getClaude(a));

  // ── docs/handbook/ ─────────────────────────────────────────────────────────
  await write("docs/handbook/README.md", getHandbookReadme(a));
  await write("docs/handbook/llms.md", getHandbookLlms(a));
  await write("docs/handbook/glossary.md", getHandbookGlossary(a));
  await write("docs/handbook/decisions.md", getHandbookDecisions(a));
  await write("docs/handbook/agent-workflow.md", getHandbookAgentWorkflow(a));
  await write("docs/handbook/api-routes.md", getHandbookApiRoutes(a));
  await write("docs/handbook/factories.md", getHandbookFactories(a));
  await write("docs/handbook/data-storage.md", getHandbookDataStorage(a));
  await write("docs/handbook/architecture.md", getHandbookArchitecture(a));
  await write("docs/handbook/conventions.md", getHandbookConventions(a));
  await write("docs/handbook/contentful.md", getHandbookContentful(a));
  await write("docs/handbook/components.md", getHandbookComponents(a));
  await write("docs/handbook/patterns.md", getHandbookPatterns(a));
  await write("docs/handbook/platform.md", getHandbookPlatform(a));
  await write("docs/handbook/integrations.md", getHandbookIntegrations(a));
  await write("docs/handbook/distribution.md", getHandbookDistribution(a));
  await write("docs/handbook/source-layout.md", getHandbookSourceLayout(a));

  // ── Agent hooks (Cursor or Claude Code) ────────────────────────────────────
  if (a.agentTooling === "cursor") {
    await write(".cursor/hooks.json", getCursorHooksJson(a));
    await write(".cursor/hooks/_lib.sh", getCursorHooksLib(), {
      executable: true,
    });
    await write(".cursor/hooks/_stop_checks.sh", getStopChecksSh(), {
      executable: true,
    });
    for (const scriptName of getCursorHookScriptNames(a)) {
      await write(
        `.cursor/hooks/${scriptName}`,
        getAgentHookScriptContent(scriptName as AgentHookScriptName, {
          tooling: "cursor",
        }),
        { executable: true },
      );
    }
    await write(".cursor/hooks/README.md", getCursorHooksReadme());
    await write(".cursor/rules/handbook.mdc", getCursorRulesHandbook(a));
  } else {
    await write(".claude/settings.json", getClaudeSettingsJson(a));
    await write(".claude/hooks/_lib.sh", getClaudeHooksLib(), {
      executable: true,
    });
    await write(
      ".claude/hooks/handbook-drift-check.mjs",
      getHandbookDriftCheckMjs(),
      { executable: true },
    );
    for (const scriptName of getClaudeHookScriptNames(a)) {
      await write(
        `.claude/hooks/${scriptName}`,
        getAgentHookScriptContent(scriptName as AgentHookScriptName, {
          tooling: "claude",
        }),
        { executable: true },
      );
    }
    await write(".claude/hooks/README.md", getClaudeHooksReadme());
    await write("scripts/git-commit.sh", getGitCommitSh(), {
      executable: true,
    });
    await write(".githooks/commit-msg", getGithooksCommitMsg(), {
      executable: true,
    });
  }

  // ── public/ ────────────────────────────────────────────────────────────────
  await write("public/sitemap-index.xml", getSitemapIndex(a));

  // ── .github/ ───────────────────────────────────────────────────────────────
  await write(".github/workflows/ci.yml", getCIWorkflow());
  await write(".github/workflows/release.yml", getReleaseWorkflow());
  await write(".github/dependabot.yml", getDependabotConfig());
  await write(".github/labeler.yml", getLabelerYml());
  await write(".github/workflows/labeler.yml", getLabelerWorkflow());

  // ── .jest/ ─────────────────────────────────────────────────────────────────
  await write(".jest/setEnvVars.ts", getSetEnvVars());
  await write(".jest/setupTests.ts", getSetupTests());

  // ── scripts/ ───────────────────────────────────────────────────────────────
  await write("scripts/scaffold.sh", getScaffoldSh());
  await write("scripts/watch-release.sh", getWatchReleaseSh(), {
    executable: true,
  });
  await write("scripts/make_sitemap.js", getMakeSitemapJs(a));
  await write("scripts/tsconfig.json", getScriptsTsConfig());
  await write("scripts/verify-vercel-release.ts", getVerifyVercelRelease());
  await write(
    "scripts/verify-vercel-for-release.sh",
    getVerifyVercelForReleaseSh(),
  );
  await write(
    "scripts/verify-vercel-release.test.mjs",
    getVerifyVercelReleaseTestMjs(),
  );
  await write("scripts/handbook-sync-check.sh", getHandbookSyncCheckSh());
  await write(
    "scripts/cursor-handbook-guard.runner.spec.ts",
    getCursorHandbookGuardRunnerSpec(),
  );
  await write("scripts/lib/preview-local.ts", getPreviewLocal());
  await write("scripts/dev-with-preview.ts", getDevWithPreview(a));

  // ── src/@types/ ────────────────────────────────────────────────────────────
  await write("src/@types/react.d.ts", getTypesReactDts());

  // ── src/app/ ───────────────────────────────────────────────────────────────
  await write("src/app/layout.tsx", getAppLayout(a));
  await write("src/app/page.tsx", getAppPage());
  await write("src/app/providers.tsx", getAppProviders());
  await write("src/app/fonts.ts", getAppFonts());
  await write("src/app/error.tsx", getAppError());
  await write("src/app/error.module.css", getAppErrorCSS());
  await write("src/app/loading.tsx", getAppLoading());
  await write("src/app/not-found.tsx", getAppNotFound());
  await write("src/app/robots.ts", getAppRobots(a));
  await write("src/app/manifest.ts", getAppManifest(a));
  await write("src/app/fonts/.gitkeep", "");
  await write("src/app/global-error.tsx", getGlobalError());
  await write("src/app/refresh-content/page.tsx", getRefreshContentPage(a));

  // ── src/app/[slug]/ ──────────────────────────────────────────────────────────
  await write(
    "src/app/[slug]/page.tsx",
    a.includeContentful ? getSlugPage() : getSlugPageWithoutContentful(),
  );

  // ── src/app/api/ ───────────────────────────────────────────────────────────
  if (a.includeContentful) {
    await write("src/app/api/draft/route.ts", getDraftRoute());
    await write("src/app/api/disable-draft/route.ts", getDisableDraftRoute());
  }

  await write("src/app/api/refresh-content/deploy/route.ts", getDeployRoute());
  await write(
    "src/app/api/refresh-content/deploy/status/route.ts",
    getDeployStatusRoute(),
  );
  await write(
    "src/app/api/refresh-content/deploy/active/route.ts",
    getDeployActiveRoute(),
  );
  await write(
    "src/app/api/refresh-content/deploy/build-stats/route.ts",
    getDeployBuildStatsRoute(),
  );

  // ── src/components/ ────────────────────────────────────────────────────────
  await write(
    "src/components/Navigation/Navigation.component.tsx",
    getNavigationComponent(a),
  );
  await write(
    "src/components/Navigation/Navigation.module.css",
    getNavigationCSS(),
  );
  await write(
    "src/components/Footer/Footer.component.tsx",
    getFooterComponent(a),
  );
  await write("src/components/Footer/Footer.module.css", getFooterCSS());
  await write(
    "src/components/ExitDraftModeLink/ExitDraftModeLink.component.tsx",
    getExitDraftModeLink(),
  );
  await write(
    "src/components/NotFoundPage/NotFoundPage.component.tsx",
    getNotFoundPageComponent(),
  );
  await write(
    "src/components/NotFoundPage/NotFoundPage.module.css",
    getNotFoundPageCSS(),
  );
  await write(
    "src/components/Button/Button.component.tsx",
    getButtonComponent(),
  );
  await write("src/components/Button/Button.module.css", getButtonCSS());
  await write(
    "src/components/DeployPage/DeployPage.component.tsx",
    getDeployPageComponent(a),
  );
  await write(
    "src/components/DeployPage/DeployPage.module.css",
    getDeployPageCSS(),
  );
  await write(
    "src/components/DeployPage/DeployBuildStats.component.tsx",
    getDeployBuildStatsComponent(),
  );
  await write(
    "src/components/Toast/ToastHost.component.tsx",
    getToastHostComponent(),
  );
  await write("src/components/Toast/ToastHost.module.css", getToastHostCSS());
  await write(
    "src/components/DeployButton/DeployButton.component.tsx",
    getDeployButtonComponent(),
  );
  await write(
    "src/components/DeployButton/DeployButton.po.tsx",
    getDeployButtonPO(),
  );
  await write(
    "src/components/DeployButton/DeployButton.test.tsx",
    getDeployButtonTest(),
  );

  // ── src/contentful/ ────────────────────────────────────────────────────────
  if (a.includeContentful) {
    await write("src/contentful/getPages.ts", getContentfulGetPages());
    await write("src/contentful/client.ts", getContentfulClient());
    await write("src/contentful/helpers.ts", getContentfulHelpers());
    await write("src/contentful/cacheConfig.ts", getContentfulCacheConfig());
    await write(
      "src/contentful/parseContentfulAsset.ts",
      getParseContentfulAsset(),
    );
    await write("src/contentful/richText.tsx", getRichText());
    await write("src/contentful/types/.gitkeep", "");
    await write("src/contentful/cacheKeys.ts", getContentfulCacheKeys());
    await write(
      "src/contentful/contentfulPagination.ts",
      getContentfulPagination(),
    );
  }

  // ── src/types/ ───────────────────────────────────────────────────────────────
  await write("src/types/KeysMatch.ts", getKeysMatch());

  // ── src/api/ ───────────────────────────────────────────────────────────────
  await write("src/api/helpers.ts", getApiHelpers());
  await write("src/api/deploy.types.ts", getDeployTypes());
  await write("src/api/urls.ts", getApiUrls());

  // ── src/copy/ ───────────────────────────────────────────────────────────────
  await write("src/copy/global.ts", getCopyGlobal(a));

  // ── src/hooks/ ───────────────────────────────────────────────────────────────
  await write("src/hooks/useIsBrowser.ts", getUseIsBrowser());
  await write("src/hooks/useDeployMonitor.ts", getUseDeployMonitor());
  await write(
    "src/hooks/queries/useDeployBuildStats.query.ts",
    getUseDeployBuildStatsQuery(),
  );
  await write("src/lib/toast/appToast.ts", getAppToast());
  await write(
    "src/hooks/mutations/useTriggerDeploy.mutation.ts",
    getUseTriggerDeployMutation(),
  );
  await write("src/hooks/queries/deployQueryKeys.ts", getDeployQueryKeys());

  // ── src/interfaces/ ────────────────────────────────────────────────────────
  await write("src/interfaces/common.interfaces.ts", getCommonInterfaces());

  // ── src/lib/ ───────────────────────────────────────────────────────────────
  await write("src/lib/generateSitemap.ts", getGenerateSitemap(a));
  await write("src/lib/schema.ts", getSchema(a));
  await write("src/lib/refreshContentAccess.ts", getRefreshContentAccess());
  await write(
    "src/lib/refreshContentAccess.spec.ts",
    getRefreshContentAccessSpec(),
  );
  await write("src/lib/deployProgressStorage.ts", getDeployProgressStorage());
  await write(
    "src/lib/deployProgressStorage.spec.ts",
    getDeployProgressStorageSpec(),
  );
  await write("src/lib/vercelDeploymentStatus.ts", getVercelDeploymentStatus());
  await write(
    "src/lib/vercelDeploymentStatus.spec.ts",
    getVercelDeploymentStatusSpec(),
  );

  // ── src/styles/ ────────────────────────────────────────────────────────────
  await write("src/styles/globals.css", getGlobalsCSS(a));
  await write("src/styles/variables.css", getVariablesCSS(a));
  await write("src/styles/runtime-variables.json", getRuntimeVariablesJson());

  await write("src/ui/README.md", getUiReadme());
  await write(
    "src/ui/Collapsible/Collapsible.component.tsx",
    getCollapsibleComponent(),
  );
  await write("src/ui/Collapsible/Collapsible.module.css", getCollapsibleCSS());
  await write(
    "src/ui/Field/FieldErrorMessage.component.tsx",
    getFieldErrorMessageComponent(),
  );

  // ── src/tests/ ─────────────────────────────────────────────────────────────
  await write("src/tests/basePageObject.po.ts", getBasePageObject());
  await write("src/tests/test-utils.tsx", getTestUtils());
  await write(
    "src/tests/mocks/mockIntersectionObserver.ts",
    getMockIntersectionObserver(),
  );
  await write("src/tests/mocks/mockMatchMedia.ts", getMockMatchMedia());
  await write("src/tests/mocks/mockNextNavigation.ts", getMockNextNavigation());
  await write("src/tests/mocks/svgMock.tsx", getSvgMock());
  await write("src/tests/mocks/appToast.mock.ts", getAppToastMock());
  await write("src/tests/utils/handbookTestRules.ts", getHandbookTestRules());
  await write(
    "src/tests/utils/handbookTestRules.spec.ts",
    getHandbookTestRulesSpec(),
  );
  await write("src/tests/utils/handbookEditGuard.ts", getHandbookEditGuard());
  await write(
    "src/tests/utils/handbookEditGuard.spec.ts",
    getHandbookEditGuardSpec(),
  );

  // ── src/tests/factories/ ───────────────────────────────────────────────────
  await write("src/tests/factories/BaseFactory.ts", getBaseFactory());
  await write(
    "src/tests/factories/RichTextDocument.factory.ts",
    getRichTextDocumentFactory(a),
  );

  // ── src/utils/ ─────────────────────────────────────────────────────────────
  await write("src/utils/constants.ts", getConstants());
  await write("src/utils/array.helpers.ts", getArrayHelpers());
  await write("src/utils/array.helpers.spec.ts", getArrayHelpersSpec());
  await write("src/utils/string.helpers.ts", getStringHelpers());
  await write("src/utils/string.helpers.spec.ts", getStringHelpersSpec());
  await write("src/utils/url.helpers.ts", getUrlHelpers());
  await write("src/utils/url.helpers.spec.ts", getUrlHelpersSpec());
  await write("src/utils/environment.helpers.ts", getEnvironmentHelpers(a));
  await write(
    "src/utils/environment.helpers.spec.ts",
    getEnvironmentHelpersSpec(a),
  );
  if (a.includeContentful) {
    await write("src/utils/contentful.helpers.ts", getContentfulUtilHelpers());
  }
  await write("src/utils/style.helpers.ts", getStyleHelpers());
  await write("src/utils/factory.helpers.ts", getFactoryHelpers());

  // ── src/proxy.ts ───────────────────────────────────────────────────────────────
  await write("src/proxy.ts", getProxyTs());

  // ── i18n (conditional) ───────────────────────────────────────────────────────
  if (a.includeI18n) {
    await write("src/i18n/routing.ts", getI18nRouting());
    await write("src/i18n/request.ts", getI18nRequest());
    await write("src/app/[locale]/layout.tsx", getLocaleLayout(a));
    await write("src/app/[locale]/page.tsx", getLocalePage());
    await write("src/app/[locale]/[slug]/page.tsx", getLocaleSlugPage());
    await write("src/app/[locale]/not-found.tsx", getAppNotFound());
  }
};

// Re-export for use in generator
const getSlugPageWithoutContentful = (): string => {
  return `import type { Metadata } from "next";
import { draftMode } from "next/headers";
import {
  createBreadcrumbSchema,
  createOrganizationSchema,
  createSchemaGraph,
  createWebPageSchema,
} from "src/lib/schema";
import { envUrl } from "src/utils/environment.helpers";

export const revalidate = 2592000;
export const dynamicParams = false;

interface PageParams {
  slug: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export async function generateStaticParams(): Promise<PageParams[]> {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  void slug;

  return {
    title: slug,
    robots:
      process.env.ENVIRONMENT === "production"
        ? "index, follow"
        : "noindex, nofollow",
  };
}

const Page = async ({ params }: PageProps) => {
  const { slug } = await params;
  const draft = await draftMode();
  void draft;

  const pageUrl = \`\${envUrl()}/\${slug}\`;
  const publisher = createOrganizationSchema();
  const breadcrumb = createBreadcrumbSchema([
    { name: "Home", url: envUrl() },
    { name: slug, url: pageUrl },
  ]);
  const webPage = createWebPageSchema({
    url: pageUrl,
    name: slug,
    breadcrumb,
    publisher,
  });
  const schemaGraph = createSchemaGraph([webPage]);

  return (
    <>
      <pre style={{ display: "none" }}>{JSON.stringify(schemaGraph)}</pre>
      <div className="page-container">
        <h1>{slug}</h1>
        <p>
          This project was scaffolded without Contentful. Add routes in{" "}
          <code>generateStaticParams</code> or enable Contentful in kickoff.
        </p>
      </div>
    </>
  );
};

export default Page;
`;
};

const getSlugPage = (): string => {
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
import { envUrl } from "src/utils/environment.helpers";

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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
};

const getTestUtils = (): string => {
  return `import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement } from "react";
import Providers from "src/app/providers";

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) => render(ui, { wrapper: Providers, ...options });

export * from "@testing-library/react";

export { customRender as render };
`;
};
