import type { ProjectAnswers } from "../types.js";

// ---------------------------------------------------------------------------
// src/proxy.ts
// ---------------------------------------------------------------------------

export function getProxyTs(): string {
  return `import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
`;
}

// ---------------------------------------------------------------------------
// src/utils/helpers.ts
// ---------------------------------------------------------------------------

export function getHelpers(a: ProjectAnswers): string {
  return `export const isBrowser = () => {
  return Boolean(typeof window !== "undefined");
};

export const envUrl = () => {
  if (process.env.ENVIRONMENT === "staging") {
    return "${a.stagingUrl}";
  }

  return "${a.prodUrl}";
};

export const createImageUrl = (src: string) => {
  if (!src) {
    return "";
  }

  if (src.startsWith("http")) {
    return src;
  }

  return \`https:\${src}\`;
};

export const isVideo = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }

  return url.includes("videos.ctfassets.net");
};

export const isNonNullable = <T>(value: T): value is NonNullable<T> => {
  return value !== null && value !== undefined;
};
`;
}

// ---------------------------------------------------------------------------
// src/utils/constants.ts
// ---------------------------------------------------------------------------

export function getConstants(): string {
  return `export const NAVIGATION_ID = "navigation-global";

export const HOME_PAGE_SLUG = "home";

export const EXCLUDED_PAGE_SLUGS_FROM_BUILD = [HOME_PAGE_SLUG];
`;
}

// ---------------------------------------------------------------------------
// src/interfaces/common.interfaces.ts
// ---------------------------------------------------------------------------

export function getCommonInterfaces(): string {
  return `export const Environments = {
  Staging: "staging",
  Production: "production",
} as const;
export type Environment = (typeof Environments)[keyof typeof Environments];

export const FontWeight = {
  Regular: 400,
  Bold: 700,
} as const;
export type FontWeight = (typeof FontWeight)[keyof typeof FontWeight];

export type Alignment = "Left" | "Center" | "Right";

export type LinkTarget = "_blank" | "_self";
`;
}

// ---------------------------------------------------------------------------
// Updated common.interfaces.ts (with Environments enum)
// ---------------------------------------------------------------------------

export function getCommonInterfacesEnhanced(): string {
  return `export const Environments = {
  Staging: "staging",
  Production: "production",
} as const;
export type Environment = (typeof Environments)[keyof typeof Environments];

export const FontWeight = {
  Regular: 400,
  Bold: 700,
} as const;
export type FontWeight = (typeof FontWeight)[keyof typeof FontWeight];

export type Alignment = "Left" | "Center" | "Right";

export type LinkTarget = "_blank" | "_self";
`;
}

// ---------------------------------------------------------------------------
// src/hooks/useIsBrowser.ts
// ---------------------------------------------------------------------------

export function getUseIsBrowser(): string {
  return `import { useEffect, useState } from "react";

export const useIsBrowser = () => {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsBrowser(true);
    }
  }, []);

  return isBrowser;
};
`;
}

// ---------------------------------------------------------------------------
// src/copy/global.ts
// ---------------------------------------------------------------------------

export function getCopyGlobal(a: ProjectAnswers): string {
  return `// Global static copy for ${a.siteName}.
// Add shared strings here to keep them DRY across components.

export const COPY = {
  siteName: "${a.siteName}",
} as const;
`;
}
