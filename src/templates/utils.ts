import type { ProjectAnswers } from "../types.js";

// ---------------------------------------------------------------------------
// src/proxy.ts
// ---------------------------------------------------------------------------

export const getProxyTs = (): string => {
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
};

// ---------------------------------------------------------------------------
// src/utils/constants.ts
// ---------------------------------------------------------------------------

export const getConstants = (): string => {
  return `export const NAVIGATION_ID = "navigation-global";

export const HOME_PAGE_SLUG = "home";

export const EXCLUDED_PAGE_SLUGS_FROM_BUILD = [HOME_PAGE_SLUG];
`;
};

// ---------------------------------------------------------------------------
// src/utils/array.helpers.ts
// ---------------------------------------------------------------------------

export const getArrayHelpers = (): string => {
  return `export const compact = <T>(
  arr: (T | null | undefined)[] | null | undefined,
): T[] => {
  return arr?.filter((item): item is T => item != null) ?? [];
};

/**
 * Do not use for data fetched from Contentful; order at fetch time via the
 * API \`order\` parameter instead.
 */
export const alphabetize = <T>(array: T[], key: keyof T): T[] => {
  if (typeof array !== "object") {
    return array;
  }

  return array.sort((a, b) => {
    const keyIsString =
      typeof a[key] === "string" && typeof b[key] === "string";

    if (keyIsString) {
      if (a[key] < b[key]) {
        return -1;
      }
      if (a[key] > b[key]) {
        return 1;
      }
    }

    return 0;
  });
};
`;
};

// ---------------------------------------------------------------------------
// src/utils/array.helpers.spec.ts
// ---------------------------------------------------------------------------

export const getArrayHelpersSpec = (): string => {
  return `import { alphabetize, compact } from "src/utils/array.helpers";

describe("compact", () => {
  it("removes null and undefined from an array", () => {
    expect(compact([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
  });

  it("returns an empty array when given null", () => {
    expect(compact(null)).toEqual([]);
  });
});

describe("alphabetize", () => {
  it("alphabetizes an array of objects by key", () => {
    const array = [{ name: "wade" }, { name: "hello" }];

    expect(alphabetize(array, "name")).toEqual([
      { name: "hello" },
      { name: "wade" },
    ]);
  });

  it("returns the array unchanged when the key value is not a string", () => {
    const array = [{ count: 2 }, { count: 1 }];

    expect(alphabetize(array, "count")).toEqual(array);
  });
});
`;
};

// ---------------------------------------------------------------------------
// src/utils/string.helpers.ts
// ---------------------------------------------------------------------------

export const getStringHelpers = (): string => {
  return `export const capitalizeWords = (text: string): string =>
  text.replace(/\\b\\w/g, (l) => l.toUpperCase());

export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return \`\${text.slice(0, maxLength).trimEnd()}…\`;
};

export const replaceNbsp = (text: string): string => {
  if (!text) {
    return "";
  }

  return text.replace(/\\u00a0/g, " ").replace(/\\u2028/g, "");
};
`;
};

// ---------------------------------------------------------------------------
// src/utils/string.helpers.spec.ts
// ---------------------------------------------------------------------------

export const getStringHelpersSpec = (): string => {
  return `import {
  capitalizeWords,
  replaceNbsp,
  truncate,
} from "src/utils/string.helpers";

describe("capitalizeWords", () => {
  it("capitalizes the first letter of every word", () => {
    expect(capitalizeWords("hello world")).toBe("Hello World");
  });
});

describe("truncate", () => {
  it("returns the original string when within maxLength", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and appends ellipsis when over maxLength", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });
});

describe("replaceNbsp", () => {
  it("replaces non-breaking spaces with regular spaces", () => {
    const text = \`hello\${String.fromCharCode(160)}world\`;
    expect(replaceNbsp(text)).toBe("hello world");
  });

  it("returns an empty string when given an empty string", () => {
    expect(replaceNbsp("")).toBe("");
  });
});
`;
};

// ---------------------------------------------------------------------------
// src/utils/url.helpers.ts
// ---------------------------------------------------------------------------

export const getUrlHelpers = (): string => {
  return `export const convertRelativeUrl = (url: string | undefined): string => {
  if (!url) {
    return "";
  }

  if (url.startsWith("//")) {
    return \`https:\${url}\`;
  }

  return url;
};

export const ensureLeadingSlash = (path: string | undefined): string => {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : \`/\${path}\`;
};

/** Like \`new URL(value)\` but returns null when the string is not a valid absolute URL. */
export const tryParseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};
`;
};

// ---------------------------------------------------------------------------
// src/utils/url.helpers.spec.ts
// ---------------------------------------------------------------------------

export const getUrlHelpersSpec = (): string => {
  return `import {
  convertRelativeUrl,
  ensureLeadingSlash,
  tryParseUrl,
} from "src/utils/url.helpers";

describe("convertRelativeUrl", () => {
  it("prepends https: to protocol-relative URLs", () => {
    expect(convertRelativeUrl("//images.ctfassets.net/foo.jpg")).toBe(
      "https://images.ctfassets.net/foo.jpg",
    );
  });

  it("returns absolute URLs unchanged", () => {
    expect(convertRelativeUrl("https://example.com/img.jpg")).toBe(
      "https://example.com/img.jpg",
    );
  });

  it("returns an empty string when given undefined", () => {
    expect(convertRelativeUrl(undefined)).toBe("");
  });
});

describe("ensureLeadingSlash", () => {
  it("adds a leading slash when missing", () => {
    expect(ensureLeadingSlash("about")).toBe("/about");
  });

  it("does not double-add a slash", () => {
    expect(ensureLeadingSlash("/about")).toBe("/about");
  });

  it("returns / when given undefined", () => {
    expect(ensureLeadingSlash(undefined)).toBe("/");
  });
});

describe("tryParseUrl", () => {
  it("returns a URL object for a valid URL", () => {
    expect(tryParseUrl("https://example.com")).toBeInstanceOf(URL);
  });

  it("returns null for an invalid URL", () => {
    expect(tryParseUrl("not-a-url")).toBeNull();
  });
});
`;
};

// ---------------------------------------------------------------------------
// src/utils/environment.helpers.ts
// ---------------------------------------------------------------------------

export const getEnvironmentHelpers = (a: ProjectAnswers): string => {
  return `export const isBrowser = (): boolean =>
  typeof window !== "undefined";

export const isNonNullable = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined;

export const envUrl = (): string => {
  if (process.env.ENVIRONMENT === "staging") {
    return "${a.stagingUrl}";
  }

  return "${a.prodUrl}";
};
`;
};

// ---------------------------------------------------------------------------
// src/utils/environment.helpers.spec.ts
// ---------------------------------------------------------------------------

export const getEnvironmentHelpersSpec = (_a: ProjectAnswers): string => {
  return `import { isBrowser, isNonNullable } from "src/utils/environment.helpers";

describe("isBrowser", () => {
  it("returns true in a browser environment", () => {
    expect(isBrowser()).toBe(true);
  });
});

describe("isNonNullable", () => {
  it("returns true for non-null values", () => {
    expect(isNonNullable("hello")).toBe(true);
    expect(isNonNullable(0)).toBe(true);
    expect(isNonNullable(false)).toBe(true);
  });

  it("returns false for null and undefined", () => {
    expect(isNonNullable(null)).toBe(false);
    expect(isNonNullable(undefined)).toBe(false);
  });
});
`;
};

// ---------------------------------------------------------------------------
// src/utils/contentful.helpers.ts
// ---------------------------------------------------------------------------

export const getContentfulUtilHelpers = (): string => {
  return `export const createImageUrl = (src: string): string => {
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

export const getContentfulEntryWebUrl = (entryId: string): string | null => {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;

  if (!spaceId || !entryId) {
    return null;
  }

  return \`https://app.contentful.com/spaces/\${spaceId}/entries/\${entryId}\`;
};
`;
};

// ---------------------------------------------------------------------------
// src/utils/style.helpers.ts
// ---------------------------------------------------------------------------

export const getStyleHelpers = (): string => {
  return `/** Tagged template for CSS-in-JS strings — preserves syntax highlighting in editors. */
export const cssStyleTag = String.raw;
`;
};

// ---------------------------------------------------------------------------
// src/utils/factory.helpers.ts
// ---------------------------------------------------------------------------

export const getFactoryHelpers = (): string => {
  return `import { faker } from "@faker-js/faker";

/** Returns either null or one of the provided values at random. Useful for optional fields in factories. */
export const nullish = <T>(values: readonly T[]): T | null =>
  faker.helpers.arrayElement([null, ...values]);
`;
};

// ---------------------------------------------------------------------------
// src/interfaces/common.interfaces.ts
// ---------------------------------------------------------------------------

export const getCommonInterfaces = (): string => {
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
};

// ---------------------------------------------------------------------------
// src/interfaces/common.interfaces.ts (enhanced — same content, kept for compat)
// ---------------------------------------------------------------------------

export const getCommonInterfacesEnhanced = (): string => {
  return getCommonInterfaces();
};

// ---------------------------------------------------------------------------
// src/hooks/useIsBrowser.ts
// ---------------------------------------------------------------------------

export const getUseIsBrowser = (): string => {
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
};

// ---------------------------------------------------------------------------
// src/copy/global.ts
// ---------------------------------------------------------------------------

export const getCopyGlobal = (a: ProjectAnswers): string => {
  return `// Global static copy for ${a.siteName}.
// Add shared strings here to keep them DRY across components.

export const COPY = {
  siteName: "${a.siteName}",
} as const;
`;
};
