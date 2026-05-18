import type { ProjectAnswers } from "../types.js";

export const getNextConfig = (a: ProjectAnswers): string => {
  const envLines: string[] = ["    ENVIRONMENT: process.env.ENVIRONMENT,"];

  if (a.includeContentful) {
    envLines.unshift(
      `    CONTENTFUL_CONTENT_DELIVERY_API_KEY:
      process.env.CONTENTFUL_CONTENT_DELIVERY_API_KEY,`,
      "    CONTENTFUL_PREVIEW_API_KEY: process.env.CONTENTFUL_PREVIEW_API_KEY,",
      "    CONTENTFUL_PREVIEW_SECRET: process.env.CONTENTFUL_PREVIEW_SECRET,",
      "    CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,",
    );
  }
  if (a.includeGA)
    envLines.push("    GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,");
  if (a.includeRecaptcha) {
    envLines.push("    RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,");
    envLines.push(
      "    RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY,",
    );
  }
  if (a.includeResend) {
    envLines.push("    RESEND_API_KEY: process.env.RESEND_API_KEY,");
    envLines.push(
      "    RESEND_GENERAL_AUDIENCE_ID: process.env.RESEND_GENERAL_AUDIENCE_ID,",
    );
  }
  envLines.push("    VERCEL_API_TOKEN: process.env.VERCEL_API_TOKEN,");
  envLines.push("    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,");

  const remotePatternsBlock = a.includeContentful
    ? `[
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "downloads.ctfassets.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "videos.ctfassets.net",
        port: "",
        pathname: "/**",
      },
    ]`
    : "[]";

  const cspImgSrc = a.includeContentful
    ? "img-src * blob: data: images.ctfassets.net;"
    : "img-src * blob: data:;";

  const optimizePackages = [
    '"@tanstack/react-query"',
    '"html-react-parser"',
    '"react-aria"',
    '"react-intersection-observer"',
    '"sonner"',
  ];
  if (a.includeContentful) {
    optimizePackages.unshift('"@contentful/rich-text-react-renderer"');
  }
  if (a.includeRecaptcha) optimizePackages.push('"react-google-recaptcha"');

  return `import type { NextConfig } from "next";

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
  // Turbopack is the default bundler in Next.js 16.1+
  turbopack: {
    rules: {
      "*.svg": {
        as: "*.js",
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              ref: true,
              svgoConfig: {
                plugins: [
                  {
                    active: false,
                    name: "removeViewBox",
                  },
                ],
              },
              titleProp: true,
            },
          },
        ],
      },
    },
  },
  experimental: {
    inlineCss: true,
    optimizePackageImports: [
      ${optimizePackages.join(",\n      ")},
    ],
  },
  webpack(config, { dev, isServer }) {
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg"),
    );

    config.module.rules.push({
      test: /\\.svg$/i,
      issuer: fileLoaderRule.issuer,
      use: {
        loader: "@svgr/webpack",
        options: {
          svgoConfig: {
            plugins: [
              {
                name: "removeViewBox",
                active: false,
              },
            ],
          },
        },
      },
    });

    fileLoaderRule.exclude = /\\.svg$/i;

    if (!dev && !isServer && process.env.ANALYZE === "true") {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          openAnalyzer: false,
        }),
      );
    }

    return config;
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
  "*.vercel-insights.com",
  "*.vercel.app",
  "vercel.live",
];
const ContentSecurityPolicy = \`
  default-src 'self';
  script-src \${scriptSrc.join(" ")};
  child-src *.google.com *.twitter.com *.vimeo.com *.youtube.com vercel.live;
  style-src 'self' 'unsafe-inline' *.googleapis.com vercel.live;
  ${cspImgSrc}
  media-src * 'self';
  connect-src * 'self';
  font-src data: 'self' vercel.live;
  worker-src 'self' *.vercel.app;
  manifest-src 'self' *.vercel.app;
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

export default nextConfig;
`;
};
