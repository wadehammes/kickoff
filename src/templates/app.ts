import type { ProjectAnswers } from "../types.js";

// ---------------------------------------------------------------------------
// src/app/layout.tsx
// ---------------------------------------------------------------------------

export function getAppLayout(a: ProjectAnswers): string {
  const gaImport = a.includeGA
    ? `import { GoogleAnalytics } from "@next/third-parties/google";\n`
    : "";

  const gaElement = a.includeGA
    ? `      {process.env.GA_MEASUREMENT_ID ? (
        <GoogleAnalytics gaId={process.env.GA_MEASUREMENT_ID} />
      ) : null}`
    : "";

  return `${gaImport}import { draftMode } from "next/headers";
import { Toaster } from "sonner";
import Providers from "src/app/providers";
import { ExitDraftModeLink } from "src/components/ExitDraftModeLink/ExitDraftModeLink.component";
import { Footer } from "src/components/Footer/Footer.component";
import { Navigation } from "src/components/Navigation/Navigation.component";
import "src/styles/globals.css";
import type { Metadata } from "next";
import { envUrl } from "src/utils/helpers";

export function generateMetadata(): Metadata {
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
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const draft = await draftMode();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.ctfassets.net" />
        <link rel="preconnect" href="https://assets.ctfassets.net" />
        <link
          rel="sitemap"
          type="application/xml"
          title="Sitemap"
          href="/sitemap-index.xml"
        />
      </head>
      <body>
        {draft.isEnabled ? (
          <div className="draftMode">
            You are previewing in draft mode!{" "}
            <ExitDraftModeLink style={{ textDecoration: "underline" }} />
          </div>
        ) : null}
        <Providers>
          <Toaster />
          <div className="page">
            <Navigation />
            <main className="page-content">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
${gaElement ? `      ${gaElement}\n` : ""}    </html>
  );
}
`;
}

// ---------------------------------------------------------------------------
// src/app/page.tsx
// ---------------------------------------------------------------------------

export function getAppPage(): string {
  return `import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import {
  createBreadcrumbSchema,
  createOrganizationSchema,
  createSchemaGraph,
  createWebPageSchema,
} from "src/lib/schema";
import { envUrl } from "src/utils/helpers";

export const revalidate = 2592000;

export async function generateMetadata(): Promise<Metadata> {
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
}

const Home = async () => {
  const draft = await draftMode();

  // TODO: fetch your home page data from Contentful here
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
          <p>Your new site is ready. Start editing <code>src/app/page.tsx</code>.</p>
        </div>
      </div>
    </>
  );
};

export default Home;
`;
}

// ---------------------------------------------------------------------------
// src/app/providers.tsx
// ---------------------------------------------------------------------------

export function getAppProviders(): string {
  return `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers(props: ProvidersProps) {
  const { children } = props;

  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
`;
}

// ---------------------------------------------------------------------------
// src/app/fonts.ts
// ---------------------------------------------------------------------------

export function getAppFonts(): string {
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
}

// ---------------------------------------------------------------------------
// src/app/error.tsx
// ---------------------------------------------------------------------------

export function getAppError(): string {
  return `"use client";

import styles from "./error.module.css";

export default function ErrorBoundary({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.errorContainer}>
      <h2>Something went wrong!</h2>
      <button type="button" onClick={reset} className={styles.errorButton}>
        Try again
      </button>
    </div>
  );
}
`;
}

// ---------------------------------------------------------------------------
// src/app/error.module.css
// ---------------------------------------------------------------------------

export function getAppErrorCSS(): string {
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
}

// ---------------------------------------------------------------------------
// src/app/loading.tsx
// ---------------------------------------------------------------------------

export function getAppLoading(): string {
  return `export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
    </div>
  );
}
`;
}

// ---------------------------------------------------------------------------
// src/app/not-found.tsx
// ---------------------------------------------------------------------------

export function getAppNotFound(): string {
  return `import { NotFoundPage } from "src/components/NotFoundPage/NotFoundPage.component";

export default function NotFound() {
  return <NotFoundPage />;
}
`;
}

// ---------------------------------------------------------------------------
// src/app/robots.ts
// ---------------------------------------------------------------------------

export function getAppRobots(a: ProjectAnswers): string {
  return `import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "${a.prodUrl}/sitemap-index.xml",
  };
}
`;
}

// ---------------------------------------------------------------------------
// src/app/manifest.ts
// ---------------------------------------------------------------------------

export function getAppManifest(a: ProjectAnswers): string {
  return `import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
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
}
`;
}

// ---------------------------------------------------------------------------
// src/app/api/draft/route.ts
// ---------------------------------------------------------------------------

export function getDraftRoute(): string {
  return `import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const draft = await draftMode();
  const { searchParams } = new URL(request.url);

  if (
    searchParams.get("previewSecret") !== process.env.CONTENTFUL_PREVIEW_SECRET
  ) {
    return new Response("Invalid token", { status: 401 });
  }

  draft.enable();

  redirect(searchParams.get("redirect") || "/");
}
`;
}

// ---------------------------------------------------------------------------
// src/app/api/disable-draft/route.ts
// ---------------------------------------------------------------------------

export function getDisableDraftRoute(): string {
  return `import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const draft = await draftMode();
  const { searchParams } = new URL(request.url);

  draft.disable();

  redirect(searchParams.get("redirect") || "/");
}
`;
}

// ---------------------------------------------------------------------------
// src/app/global-error.tsx
// ---------------------------------------------------------------------------

export function getGlobalError(): string {
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
}

// ---------------------------------------------------------------------------
// src/app/refresh-content/page.tsx
// ---------------------------------------------------------------------------

export function getRefreshContentPage(a: ProjectAnswers): string {
  return `import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: "noindex, nofollow",
  title: "Refresh Content | ${a.siteName}",
};

export default async function RefreshContent({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const { token } = (await searchParams) ?? {};

  if (
    process.env.ENVIRONMENT === "production" &&
    (!token || token !== process.env.REFRESH_CONTENT_ACCESS_TOKEN)
  ) {
    return notFound();
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Refresh Content</h1>
      <p>Content has been refreshed. You can close this page.</p>
    </div>
  );
}
`;
}
