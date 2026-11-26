import type { ProjectAnswers } from "../types.js";
import { getCms } from "./cms/index.js";
import { usesVercel } from "./config.js";

export const getNextConfig = (a: ProjectAnswers): string => {
  const vercel = usesVercel(a);
  const cms = getCms(a);
  const envLines: string[] = [
    ...(cms?.nextConfigEnv ?? []),
    "    ENVIRONMENT: process.env.ENVIRONMENT,",
  ];

  if (a.includeGA)
    envLines.push("    GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,");
  if (a.includeRecaptcha)
    envLines.push("    RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,");

  const remotePatternsBlock = cms
    ? `[
${cms.imageHosts
  .map(
    (hostname) => `      {
        protocol: "https",
        hostname: "${hostname}",
        port: "",
        pathname: "/**",
      },`,
  )
  .join("\n")}
    ]`
    : "[]";

  const cspImgSrc = `img-src * blob: data:${(cms?.cspImgHosts ?? []).map((host) => ` ${host}`).join("")};`;

  const optimizePackages = [
    "@base-ui/react",
    "@tanstack/react-query",
    ...(cms?.optimizePackageImports ?? []),
    ...(a.includeRecaptcha ? ["react-google-recaptcha"] : []),
  ]
    .sort()
    .map((name) => `"${name}"`);

  const optimizePackageImportsBlock =
    optimizePackages.length <= 2
      ? `[${optimizePackages.join(", ")}]`
      : `[
      ${optimizePackages.join(",\n      ")},
    ]`;

  const intlImport = a.includeI18n
    ? `import createNextIntlPlugin from "next-intl/plugin";\n`
    : "";
  const exportLine = a.includeI18n
    ? `const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);`
    : "export default nextConfig;";

  return `import type { NextConfig } from "next";
${intlImport}
const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  env: {
${envLines.join("\n")}
  },
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 14400,
    remotePatterns: ${remotePatternsBlock},
  },
  // Turbopack is the default bundler in Next.js 16+
  turbopack: {
    rules: {
      "*.svg": {
        as: "*.js",
        loaders: [
          {
            loader: "@svgr/webpack",
            options: { svgo: false },
          },
        ],
      },
    },
  },
  experimental: {
    inlineCss: true,
    optimizePackageImports: ${optimizePackageImportsBlock},
  },
  async redirects() {
    if (process.env.ENVIRONMENT === "production") {
      return [...productionRedirects, ...sharedRedirects];
    }

    return sharedRedirects;
  },
  async headers() {
    const thirtyDays = 60 * 60 * 24 * 30;
    const oneYear = 31536000;
    const htmlCacheControl = \`public, max-age=\${thirtyDays}, s-maxage=\${thirtyDays}, stale-while-revalidate=\${oneYear}\`;

    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, must-revalidate",
          },
          ...securityHeaders,
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: htmlCacheControl,
          },
          ...securityHeaders,
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: htmlCacheControl,
          },
          ...securityHeaders,
        ],
      },
    ];
  },
};

const productionRedirects = [
  {
    source: "/:slug(test-page.*)",
    destination: "/",
    permanent: true,
  },
];

const sharedRedirects = [
  {
    source: "/home",
    destination: "/",
    permanent: true,
  },
];

// https://securityheaders.com
const scriptSrc = [
  "'self'",
  "'unsafe-eval'",
  "'unsafe-inline'",
  "*.youtube.com",
  "*.vimeo.com",
  "*.google.com",
  "*.google-analytics.com",
  "*.gstatic.com",
  "*.googletagmanager.com",
${vercel ? '  "*.vercel-insights.com",\n  "*.vercel.app",\n  "vercel.live",\n' : ""}];
const ContentSecurityPolicy = \`
  default-src 'self';
  script-src \${scriptSrc.join(" ")};
  child-src *.google.com *.twitter.com *.vimeo.com *.youtube.com${vercel ? " vercel.live" : ""};
  style-src 'self' 'unsafe-inline' *.googleapis.com${vercel ? " vercel.live" : ""};
  ${cspImgSrc}
  media-src * 'self';
  connect-src * 'self';
  font-src data: 'self'${vercel ? " vercel.live" : ""};
  worker-src 'self'${vercel ? " *.vercel.app" : ""};
  manifest-src 'self'${vercel ? " *.vercel.app" : ""};
\`;
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\\n/g, ""),
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

${exportLine}
`;
};
