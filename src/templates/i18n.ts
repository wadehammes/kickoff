import type { ProjectAnswers } from "../types.js";

// ---------------------------------------------------------------------------
// src/i18n/routing.ts  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export function getI18nRouting(): string {
  return `import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  defaultLocale: "en",
  localePrefix: "as-needed",
  locales: ["en", "es"],
});

export const { Link, usePathname, useRouter } = createNavigation(routing);
`;
}

// ---------------------------------------------------------------------------
// src/i18n/request.ts  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export function getI18nRequest(): string {
  return `import { getRequestConfig } from "next-intl/server";
import { routing } from "src/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // Add your message imports here as the project grows, e.g.:
    // messages: (await import(\`../messages/\${locale}.json\`)).default,
    messages: {},
  };
});
`;
}

// ---------------------------------------------------------------------------
// src/app/[locale]/layout.tsx  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export function getLocaleLayout(a: ProjectAnswers): string {
  const gaImport = a.includeGA
    ? `import { GoogleAnalytics } from "@next/third-parties/google";\n`
    : "";
  const gaElement = a.includeGA
    ? "      {process.env.GA_MEASUREMENT_ID ? (\n        <GoogleAnalytics gaId={process.env.GA_MEASUREMENT_ID} />\n      ) : null}"
    : "";

  const draftHeader = a.includeContentful
    ? `import { draftMode } from "next/headers";
import { ExitDraftModeLink } from "src/components/ExitDraftModeLink/ExitDraftModeLink.component";
`
    : "";

  const draftBlock = a.includeContentful
    ? `  const draft = await draftMode();
`
    : "";

  const draftUi = a.includeContentful
    ? `      {draft.isEnabled ? (
        <div className="draftMode">
          You are previewing in draft mode!{" "}
          <ExitDraftModeLink style={{ textDecoration: "underline" }} />
        </div>
      ) : null}
`
    : "";

  return `${gaImport}${draftHeader}import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import Providers from "src/app/providers";
import { Footer } from "src/components/Footer/Footer.component";
import { Navigation } from "src/components/Navigation/Navigation.component";
import { routing } from "src/i18n/routing";
import "src/styles/globals.css";
import type { Metadata } from "next";
import { envUrl } from "src/utils/environment.helpers";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(\`\${envUrl()}/\`),
    applicationName: "${a.siteName}",
    creator: "${a.siteName}",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
${draftBlock}  const messages = await getMessages();

  return (
    <>
${draftUi}      <NextIntlClientProvider locale={locale} messages={messages}>
        <Providers>
          <div className="page">
            <Navigation />
            <main className="page-content">{children}</main>
            <Footer />
          </div>
        </Providers>
      </NextIntlClientProvider>
${gaElement}
    </>
  );
}
`;
}

// ---------------------------------------------------------------------------
// src/app/[locale]/page.tsx  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export function getLocalePage(): string {
  return `import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params: _params }: HomeProps) {
  const draft = await draftMode();

  // TODO: fetch your home page from Contentful here
  // const page = await fetchPage({ slug: "home", preview: draft.isEnabled });
  // if (!page) return notFound();

  void draft;

  return (
    <div className="page-container">
      <h1>Home</h1>
    </div>
  );
}
`;
}

// ---------------------------------------------------------------------------
// src/app/[locale]/[slug]/page.tsx  (only generated when includeI18n)
// ---------------------------------------------------------------------------

export function getLocaleSlugPage(): string {
  return `import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

export const dynamicParams = false;

interface PageParams {
  locale: string;
  slug: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export async function generateStaticParams(): Promise<PageParams[]> {
  // TODO: fetch all pages from Contentful and return locale+slug pairs
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // TODO: fetch page metadata from Contentful
  return { title: slug };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const draft = await draftMode();

  // TODO: fetch page from Contentful
  // const page = await fetchPage({ slug, preview: draft.isEnabled });
  // if (!page) return notFound();

  void draft;

  return (
    <div className="page-container">
      <h1>{slug}</h1>
    </div>
  );
}
`;
}
