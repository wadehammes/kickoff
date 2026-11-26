import type { ProjectAnswers } from "../types.js";
import { getCms, getLayoutPreview, usesCms } from "./cms/index.js";
import { sortImports } from "./imports.js";

// ---------------------------------------------------------------------------
// src/app/layout.tsx
// ---------------------------------------------------------------------------

export const getAppLayout = (a: ProjectAnswers): string => {
  const gaImport = a.includeGA
    ? `import { GoogleAnalytics } from "@next/third-parties/google";\n`
    : "";

  const gaElement = a.includeGA
    ? `      {process.env.GA_MEASUREMENT_ID ? (
        <GoogleAnalytics gaId={process.env.GA_MEASUREMENT_ID} />
      ) : null}`
    : "";

  const draftImports = usesCms(a)
    ? [
        'import { draftMode } from "next/headers";',
        'import { ExitDraftModeLink } from "src/components/ExitDraftModeLink/ExitDraftModeLink.component";',
      ]
    : [];

  const preconnectCms = (getCms(a)?.preconnectOrigins ?? [])
    .map((origin) => `        <link rel="preconnect" href="${origin}" />\n`)
    .join("");

  const draftBanner = usesCms(a)
    ? `  const draft = await draftMode();

`
    : "";

  const draftUi = usesCms(a)
    ? `        {draft.isEnabled ? (
          <div className="draftMode">
            You are previewing in draft mode!{" "}
            <ExitDraftModeLink style={{ textDecoration: "underline" }} />
          </div>
        ) : null}
`
    : "";

  const preview = getLayoutPreview(a);
  // The global CSS import ends Biome's first sorted run of imports.
  const componentImports = sortImports([
    ...(gaImport ? [gaImport.trim()] : []),
    ...preview.imports,
    ...draftImports,
    'import Providers from "src/app/providers";',
    'import { Footer } from "src/components/Footer/Footer.component";',
    'import { Navigation } from "src/components/Navigation/Navigation.component";',
  ]).join("\n");

  return `${componentImports}
import "src/styles/globals.css";
import type { Metadata } from "next";
import { envUrl } from "src/utils/environment.helpers";

export const generateMetadata = (): Metadata => {
  return {
    metadataBase: new URL(\`\${envUrl()}/\`),
    applicationName: "${a.siteName}",
    creator: "${a.siteName}",
    formatDetection: {
      address: false,
      email: false,
      telephone: false,
    },
    publisher: "${a.siteName}",
    referrer: "origin-when-cross-origin",
  };
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
${draftBanner}  return (
    <html lang="en">
      <head>
${preconnectCms}        <link
          rel="sitemap"
          type="application/xml"
          title="Sitemap"
          href="/sitemap.xml"
        />
      </head>
      <body>
${draftUi}        <Providers>
          <div className="page">
            <Navigation />
            <main className="page-content appRoot">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
${preview.element}${gaElement ? `      ${gaElement}\n` : ""}    </html>
  );
};

export default RootLayout;
`;
};

// ---------------------------------------------------------------------------
// src/app/page.tsx
// ---------------------------------------------------------------------------

export const getAppPage = (): string => {
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

export const generateMetadata = async (): Promise<Metadata> => {
  const url = envUrl();

  return {
    metadataBase: new URL(url),
    alternates: { canonical: "/" },
    title: "Home",
    robots:
      process.env.ENVIRONMENT === "production"
        ? "index, follow"
        : "noindex, nofollow",
  };
};

const Home = async () => {
  const draft = await draftMode();

  // TODO: fetch your home page data from your CMS here
  // const page = await fetchPage({ slug: "home", preview: draft.isEnabled });
  // if (!page) return notFound();

  void draft; // remove once used

  const pageUrl = envUrl();
  const publisher = createOrganizationSchema();
  const breadcrumb = createBreadcrumbSchema([{ name: "Home", url: pageUrl }]);

  const webPage = createWebPageSchema({
    url: pageUrl,
    name: "Home",
    breadcrumb,
    publisher,
  });

  const schemaGraph = createSchemaGraph([webPage]);

  return (
    <>
      {/* TODO: Add JsonLd component */}
      <pre style={{ display: "none" }}>{JSON.stringify(schemaGraph)}</pre>
      <div className="page-container">
        <div className="page-header">
          <h1>Welcome</h1>
          <p>
            Your new site is ready. Start editing <code>src/app/page.tsx</code>.
          </p>
        </div>
      </div>
    </>
  );
};

export default Home;
`;
};

// ---------------------------------------------------------------------------
// src/app/providers.tsx
// ---------------------------------------------------------------------------

export const getAppProviders = (): string => {
  return `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { ToastHost } from "src/components/Toast/ToastHost.component";

interface ProvidersProps {
  children: ReactNode;
}

const Providers = (props: ProvidersProps) => {
  const { children } = props;

  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastHost>{children}</ToastHost>
    </QueryClientProvider>
  );
};

export default Providers;
`;
};

// ---------------------------------------------------------------------------
// src/app/fonts.ts
// ---------------------------------------------------------------------------

export const getAppFonts = (): string => {
  return `// Add your custom fonts here using next/font/local
// Example:
//
// import localFont from "next/font/local";
//
// export const myFont = localFont({
//   src: "./fonts/MyFont-Regular.woff2",
//   variable: "--font-my-font",
//   display: "swap",
// });

export {};
`;
};

// ---------------------------------------------------------------------------
// src/app/error.tsx
// ---------------------------------------------------------------------------

export const getAppError = (): string => {
  return `"use client";

import styles from "./error.module.css";

const ErrorBoundary = ({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  return (
    <div className={styles.errorContainer}>
      <h2>Something went wrong!</h2>
      <button type="button" onClick={reset} className={styles.errorButton}>
        Try again
      </button>
    </div>
  );
};

export default ErrorBoundary;
`;
};

// ---------------------------------------------------------------------------
// src/app/error.module.css
// ---------------------------------------------------------------------------

export const getAppErrorCSS = (): string => {
  return `.errorContainer {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100vh;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  width: 100%;
}

.errorButton {
  background: var(--color-text);
  border: none;
  border-radius: 4px;
  color: var(--color-bg);
  cursor: pointer;
  padding: 0.75rem 1.5rem;
}

.errorButton:hover {
  opacity: 0.9;
}
`;
};

// ---------------------------------------------------------------------------
// src/app/loading.tsx
// ---------------------------------------------------------------------------

export const getAppLoading = (): string => {
  return `const Loading = () => (
  <div className="loading-container">
    <div className="loading-spinner" />
  </div>
);

export default Loading;
`;
};

// ---------------------------------------------------------------------------
// src/app/not-found.tsx
// ---------------------------------------------------------------------------

export const getAppNotFound = (): string => {
  return `import { NotFoundPage } from "src/components/NotFoundPage/NotFoundPage.component";

const NotFound = () => <NotFoundPage />;

export default NotFound;
`;
};

// ---------------------------------------------------------------------------
// src/app/robots.ts
// ---------------------------------------------------------------------------

export const getAppRobots = (a: ProjectAnswers): string => {
  return `import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "${a.prodUrl}/sitemap.xml",
  };
};

export default robots;
`;
};

// ---------------------------------------------------------------------------
// src/app/sitemap.ts  (served by Next.js at /sitemap.xml)
// ---------------------------------------------------------------------------

export const getAppSitemap = (a: ProjectAnswers): string => {
  const cms = getCms(a);
  const imports = [
    'import type { MetadataRoute } from "next";',
    ...(cms ? [`import { fetchPages } from "${cms.dir}/getPages";`] : []),
    ...(a.includeI18n
      ? ['import { type Locale, routing } from "src/i18n/routing";']
      : []),
    ...(cms ? ['import { HOME_PAGE_SLUG } from "src/utils/constants";'] : []),
    'import { envUrl } from "src/utils/environment.helpers";',
  ];
  const importBlock = sortImports(imports).join("\n");

  const cmsRoutes = cms
    ? `
const fetchCmsRoutes = async (): Promise<SitemapRoute[]> => {
  const pages = await fetchPages({ preview: false });

  return pages
    .filter((page) => page.enableIndexing)
    .map((page) => ({
      lastModified: page.updatedAt,
      route: page.pageSlug === HOME_PAGE_SLUG ? "/" : \`/\${page.pageSlug}\`,
    }));
};
`
    : "";

  const collectRoutes = cms
    ? `const collectRoutes = async (): Promise<SitemapRoute[]> => {
  const cmsRoutes = await fetchCmsRoutes();
  const cmsPaths = new Set(cmsRoutes.map((entry) => entry.route));
  const staticRoutes = STATIC_ROUTES.filter(
    (route) => !cmsPaths.has(route),
  ).map((route) => ({ lastModified: new Date(), route }));

  return [...staticRoutes, ...cmsRoutes];
};`
    : `const collectRoutes = async (): Promise<SitemapRoute[]> =>
  STATIC_ROUTES.map((route) => ({ lastModified: new Date(), route }));`;

  const toEntries = a.includeI18n
    ? `const localizedUrl = ({
  locale,
  route,
}: {
  locale: Locale;
  route: string;
}): string => {
  const prefix = locale === routing.defaultLocale ? "" : \`/\${locale}\`;
  const path = route === "/" ? "" : route;

  return \`\${envUrl()}\${prefix}\${path}\`;
};

const toEntries = ({
  lastModified,
  route,
}: SitemapRoute): MetadataRoute.Sitemap => {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, localizedUrl({ locale, route })]),
  );

  return routing.locales.map((locale) => ({
    alternates: { languages },
    lastModified,
    url: localizedUrl({ locale, route }),
  }));
};`
    : `const toEntries = ({
  lastModified,
  route,
}: SitemapRoute): MetadataRoute.Sitemap => [
  {
    lastModified,
    url: \`\${envUrl()}\${route === "/" ? "" : route}\`,
  },
];`;

  return `${importBlock}

/** Routes that are not generated from content. Add new pages here so search engines find them. */
const STATIC_ROUTES = ["/"];

interface SitemapRoute {
  lastModified: Date | string;
  route: string;
}
${cmsRoutes}
${collectRoutes}

${toEntries}

const sitemap = async (): Promise<MetadataRoute.Sitemap> =>
  (await collectRoutes()).flatMap(toEntries);

export default sitemap;
`;
};

// ---------------------------------------------------------------------------
// src/app/manifest.ts
// ---------------------------------------------------------------------------

export const getAppManifest = (a: ProjectAnswers): string => {
  return `import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => {
  return {
    name: "${a.siteName}",
    short_name: "${a.siteName}",
    description: "${a.siteName}",
    start_url: "/",
    display: "standalone",
    background_color: "${a.bgColor}",
    theme_color: "${a.primaryColor}",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
};

export default manifest;
`;
};

// ---------------------------------------------------------------------------
// src/app/api/draft/route.ts
// ---------------------------------------------------------------------------

export const getDraftRoute = (previewSecretEnv: string): string => {
  return `import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export const GET = async (request: Request) => {
  const draft = await draftMode();
  const { searchParams } = new URL(request.url);

  if (
    searchParams.get("previewSecret") !== process.env.${previewSecretEnv}
  ) {
    return new Response("Invalid token", { status: 401 });
  }

  draft.enable();

  redirect(searchParams.get("redirect") || "/");
};
`;
};

// ---------------------------------------------------------------------------
// src/app/api/disable-draft/route.ts
// ---------------------------------------------------------------------------

export const getDisableDraftRoute = (): string => {
  return `import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export const GET = async (request: Request) => {
  const draft = await draftMode();
  const { searchParams } = new URL(request.url);

  draft.disable();

  redirect(searchParams.get("redirect") || "/");
};
`;
};

// ---------------------------------------------------------------------------
// src/app/global-error.tsx
// ---------------------------------------------------------------------------

export const getGlobalError = (): string => {
  return `"use client";

import NextError from "next/error";

const GlobalError = ({
  error: _error,
}: {
  error: Error & { digest?: string };
}) => {
  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
};

export default GlobalError;
`;
};
