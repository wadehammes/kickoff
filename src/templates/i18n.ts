import type { ProjectAnswers } from "../types.js";

// ---------------------------------------------------------------------------
// src/i18n/routing.ts  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export const getI18nRouting = (): string => {
  return `import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  defaultLocale: "en",
  localePrefix: "as-needed",
  locales: ["en", "es"],
});

export type Locale = (typeof routing.locales)[number];

export const { Link, usePathname, useRouter } = createNavigation(routing);
`;
};

// ---------------------------------------------------------------------------
// src/i18n/request.ts  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export const getI18nRequest = (): string => {
  return `import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "src/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: {},
  };
});
`;
};

// ---------------------------------------------------------------------------
// src/proxy.ts  (i18n variant: next-intl locale routing)
// ---------------------------------------------------------------------------

export const getI18nProxyTs = (): string => {
  return `import createMiddleware from "next-intl/middleware";
import { routing } from "src/i18n/routing";

export const proxy = createMiddleware(routing);

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\\\..*).*)",
};
`;
};

// ---------------------------------------------------------------------------
// src/app/layout.tsx  (i18n variant: [locale]/layout.tsx renders <html>)
// ---------------------------------------------------------------------------

export const getI18nRootLayout = (): string => {
  return `import type { ReactNode } from "react";

const RootLayout = ({ children }: { children: ReactNode }) => children;

export default RootLayout;
`;
};

// ---------------------------------------------------------------------------
// src/app/not-found.tsx  (i18n variant: requests outside any locale)
// ---------------------------------------------------------------------------

export const getI18nRootNotFound = (): string => {
  return `"use client";

import NextError from "next/error";

const NotFound = () => (
  <html lang="en">
    <body>
      <NextError statusCode={404} />
    </body>
  </html>
);

export default NotFound;
`;
};

// ---------------------------------------------------------------------------
// src/app/[locale]/layout.tsx  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export const getLocaleLayout = (a: ProjectAnswers): string => {
  const gaImport = a.includeGA
    ? `import { GoogleAnalytics } from "@next/third-parties/google";\n`
    : "";
  const gaElement = a.includeGA
    ? `      {process.env.GA_MEASUREMENT_ID ? (
        <GoogleAnalytics gaId={process.env.GA_MEASUREMENT_ID} />
      ) : null}
`
    : "";

  const draftModeImport = a.includeContentful
    ? `import { draftMode } from "next/headers";\n`
    : "";
  const exitDraftImport = a.includeContentful
    ? `import { ExitDraftModeLink } from "src/components/ExitDraftModeLink/ExitDraftModeLink.component";\n`
    : "";

  const preconnectCtf = a.includeContentful
    ? `        <link rel="preconnect" href="https://images.ctfassets.net" />
        <link rel="preconnect" href="https://assets.ctfassets.net" />
`
    : "";

  const draftBlock = a.includeContentful
    ? `  const draft = await draftMode();
`
    : "";

  const draftUi = a.includeContentful
    ? `        {draft.isEnabled ? (
          <div className="draftMode">
            You are previewing in draft mode!{" "}
            <ExitDraftModeLink style={{ textDecoration: "underline" }} />
          </div>
        ) : null}
`
    : "";

  return `${gaImport}import type { Metadata } from "next";
${draftModeImport}import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import Providers from "src/app/providers";
${exitDraftImport}import { Footer } from "src/components/Footer/Footer.component";
import { Navigation } from "src/components/Navigation/Navigation.component";
import { routing } from "src/i18n/routing";
import "src/styles/globals.css";
import { envUrl } from "src/utils/environment.helpers";

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export const generateMetadata = (): Metadata => ({
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
});

export const generateStaticParams = () =>
  routing.locales.map((locale) => ({ locale }));

const LocaleLayout = async ({ children, params }: LocaleLayoutProps) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
${draftBlock}
  return (
    <html lang={locale}>
      <head>
${preconnectCtf}        <link
          rel="sitemap"
          type="application/xml"
          title="Sitemap"
          href="/sitemap-index.xml"
        />
      </head>
      <body>
${draftUi}        <NextIntlClientProvider>
          <Providers>
            <div className="page">
              <Navigation />
              <main className="page-content appRoot">{children}</main>
              <Footer />
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
${gaElement}    </html>
  );
};

export default LocaleLayout;
`;
};

// ---------------------------------------------------------------------------
// src/app/[locale]/page.tsx  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export const getLocalePage = (): string => {
  return `import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { GLOBAL_COPY } from "src/copy/global";
import { type Locale, routing } from "src/i18n/routing";
import {
  createBreadcrumbSchema,
  createOrganizationSchema,
  createSchemaGraph,
  createWebPageSchema,
} from "src/lib/schema";
import { envUrl } from "src/utils/environment.helpers";

export const revalidate = 2592000;

interface HomeProps {
  params: Promise<{ locale: Locale }>;
}

const localePath = (locale: Locale) =>
  locale === routing.defaultLocale ? "/" : \`/\${locale}\`;

export const generateMetadata = async ({
  params,
}: HomeProps): Promise<Metadata> => {
  const { locale } = await params;

  return {
    alternates: {
      canonical: localePath(locale),
      languages: Object.fromEntries(
        routing.locales.map((option) => [option, localePath(option)]),
      ),
    },
    title: GLOBAL_COPY[locale].homeTitle,
    robots:
      process.env.ENVIRONMENT === "production"
        ? "index, follow"
        : "noindex, nofollow",
  };
};

const Home = async ({ params }: HomeProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const copy = GLOBAL_COPY[locale];
  const pageUrl = \`\${envUrl()}\${localePath(locale)}\`;
  const publisher = createOrganizationSchema();
  const breadcrumb = createBreadcrumbSchema([
    { name: copy.homeTitle, url: pageUrl },
  ]);
  const webPage = createWebPageSchema({
    url: pageUrl,
    name: copy.homeTitle,
    breadcrumb,
    publisher,
  });
  const schemaGraph = createSchemaGraph([webPage]);

  return (
    <>
      <pre style={{ display: "none" }}>{JSON.stringify(schemaGraph)}</pre>
      <div className="page-container">
        <div className="page-header">
          <h1>{copy.homeTitle}</h1>
          <p>{copy.homeIntro}</p>
        </div>
      </div>
    </>
  );
};

export default Home;
`;
};

// ---------------------------------------------------------------------------
// src/app/[locale]/[slug]/page.tsx  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export const getLocaleSlugPage = (): string => {
  return `import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "src/i18n/routing";

interface PageParams {
  locale: Locale;
  slug: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export const generateStaticParams = async (): Promise<PageParams[]> => [];

const isKnownPage = async ({ locale, slug }: PageParams): Promise<boolean> =>
  (await generateStaticParams()).some(
    (page) => page.locale === locale && page.slug === slug,
  );

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { slug } = await params;

  return { title: slug };
};

const Page = async ({ params }: PageProps) => {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!(await isKnownPage({ locale, slug }))) {
    notFound();
  }

  return (
    <div className="page-container">
      <h1>{slug}</h1>
    </div>
  );
};

export default Page;
`;
};

// ---------------------------------------------------------------------------
// src/copy/global.ts  (i18n variant: every locale must be filled in)
// ---------------------------------------------------------------------------

export const getI18nCopyGlobal = (a: ProjectAnswers): string => {
  return `import type { Locale } from "src/i18n/routing";

interface GlobalCopy {
  homeIntro: string;
  homeTitle: string;
  siteName: string;
}

export const GLOBAL_COPY: Record<Locale, GlobalCopy> = {
  en: {
    homeIntro: "Your new site is ready.",
    homeTitle: "Welcome",
    siteName: "${a.siteName}",
  },
  es: {
    homeIntro: "Tu nuevo sitio está listo.",
    homeTitle: "Bienvenido",
    siteName: "${a.siteName}",
  },
};
`;
};

// ---------------------------------------------------------------------------
// src/components/LanguageSwitcher/  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export const getLanguageSwitcherComponent = (): string => {
  return `"use client";

import { useLocale } from "next-intl";
import { Link, type Locale, routing, usePathname } from "src/i18n/routing";
import styles from "./LanguageSwitcher.module.css";

const LANGUAGE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export const LanguageSwitcher = () => {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label="Language"
      className={styles.languageSwitcher}
      data-testid="rhLanguageSwitcher"
    >
      {routing.locales.map((option) => (
        <Link
          aria-current={option === locale ? "true" : undefined}
          href={pathname}
          hrefLang={option}
          key={option}
          lang={option}
          locale={option}
        >
          {LANGUAGE_LABELS[option]}
        </Link>
      ))}
    </nav>
  );
};

export default LanguageSwitcher;
`;
};

export const getLanguageSwitcherCSS = (): string => {
  return `.languageSwitcher {
  display: flex;
  gap: 1rem;
}
`;
};
