// ---------------------------------------------------------------------------
// src/tests/factories/RichTextDocument.factory.ts
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProjectAnswers } from "../types.js";

const srcTestsUtilsAssetDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../scaffold-assets/src-tests-utils",
);

export const getRichTextDocumentFactory = (a: ProjectAnswers): string => {
  if (!a.includeContentful) {
    return `import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

/** Minimal rich-text document stub for tests when Contentful is not scaffolded. */
export type RichTextDocumentStub = {
  content: unknown[];
  data: Record<string, never>;
  nodeType: string;
};

type RichTextDocumentFactoryOptions = Record<string, never>;

class RichTextDocumentFactory extends BaseFactory<
  RichTextDocumentStub,
  RichTextDocumentFactoryOptions
> {
  build(
    attributes?: Partial<RichTextDocumentStub>,
    _options?: RichTextDocumentFactoryOptions,
  ) {
    const instance = {
      content: [],
      data: {},
      nodeType: "document",
    } satisfies RichTextDocumentStub;

    const factoryBuilt: RichTextDocumentStub = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      RichTextDocumentStub,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const richTextDocumentFactory = new RichTextDocumentFactory();
`;
  }

  return `import {
  BLOCKS,
  type Document,
  type TopLevelBlock,
} from "@contentful/rich-text-types";
import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

type RichTextDocumentFactoryOptions = Record<string, never>;

const paragraphWithText = (text: string): TopLevelBlock => ({
  content: [{ data: {}, marks: [], nodeType: "text", value: text }],
  data: {},
  nodeType: BLOCKS.PARAGRAPH,
});

class RichTextDocumentFactory extends BaseFactory<
  Document,
  RichTextDocumentFactoryOptions
> {
  build(
    attributes?: Partial<Document>,
    _options?: RichTextDocumentFactoryOptions,
  ) {
    const instance = {
      content: [
        paragraphWithText(faker.lorem.sentence()),
        paragraphWithText(faker.lorem.sentence()),
      ],
      data: {},
      nodeType: BLOCKS.DOCUMENT,
    } satisfies Document;

    const factoryBuilt: Document = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<Document, typeof instance> =
      undefined;

    return factoryBuilt;
  }
}

export const richTextDocumentFactory = new RichTextDocumentFactory();
`;
};

// ---------------------------------------------------------------------------
// src/tests/basePageObject.po.ts
// ---------------------------------------------------------------------------

export const getBasePageObject = (): string => {
  return `// eslint-disable testing-library/no-node-access

export interface BasePageObjectProps {
  debug?: boolean;
  raiseOnFind?: boolean;
}

export class BasePageObject {
  debug: boolean;
  raiseOnFind: boolean;

  constructor(
    { debug, raiseOnFind }: BasePageObjectProps = {
      debug: false,
      raiseOnFind: false,
    },
  ) {
    this.debug = Boolean(debug);
    this.raiseOnFind = Boolean(raiseOnFind);
  }
}
`;
};

// ---------------------------------------------------------------------------
// src/tests/factories/BaseFactory.ts
// ---------------------------------------------------------------------------

export const getBaseFactory = (): string => {
  return `import { faker } from "@faker-js/faker";

export abstract class BaseFactory<
  FactoryType,
  Options extends object = Record<string, never>,
> {
  protected generateId() {
    return faker.string.uuid();
  }

  public abstract build(
    attributes?: Partial<FactoryType>,
    options?: Options,
  ): FactoryType;

  public buildList(
    quantity: number,
    attributes?: Partial<FactoryType>,
    options?: Options,
  ) {
    return Array.from({ length: quantity }).map(() =>
      this.build(attributes ?? {}, options),
    );
  }
}
`;
};

// ---------------------------------------------------------------------------
// .jest/setEnvVars.ts
// ---------------------------------------------------------------------------

export const getSetEnvVars = (): string => {
  return `process.env.ENVIRONMENT = "staging";
`;
};

// ---------------------------------------------------------------------------
// .jest/setupTests.ts
// ---------------------------------------------------------------------------

export const getSetupTests = (): string => {
  return `import "@testing-library/jest-dom/jest-globals";
import { setupIntersectionObserverMock } from "src/tests/mocks/mockIntersectionObserver";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

global.beforeAll(() => {
  setupIntersectionObserverMock();
  setupMockMatchMedia();
});

global.beforeEach(() => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

global.afterAll(() => {
  jest.resetAllMocks();
});
`;
};

// ---------------------------------------------------------------------------
// src/tests/mocks/mockIntersectionObserver.ts
// ---------------------------------------------------------------------------

export const getMockIntersectionObserver = (): string => {
  return `/**
 * Utility function that mocks the \`IntersectionObserver\` API. Necessary for
 * components that rely on it, otherwise the tests will crash.
 * Recommended to execute inside \`beforeAll\`.
 */
export function setupIntersectionObserverMock({
  root = null,
  rootMargin = "",
  scrollMargin = "",
  thresholds = [],
  disconnect = () => null,
  observe = () => null,
  takeRecords = () => [],
  unobserve = () => null,
} = {}): void {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = root;
    readonly rootMargin: string = rootMargin;
    readonly scrollMargin: string = scrollMargin;
    readonly thresholds: ReadonlyArray<number> = thresholds;
    disconnect: () => void = disconnect;
    observe: (target: Element) => void = observe;
    takeRecords: () => IntersectionObserverEntry[] = takeRecords;
    unobserve: (target: Element) => void = unobserve;
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });

  Object.defineProperty(global, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}
`;
};

// ---------------------------------------------------------------------------
// src/tests/mocks/mockMatchMedia.ts
// ---------------------------------------------------------------------------

export const getMockMatchMedia = (): string => {
  return `export function setupMockMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
`;
};

// ---------------------------------------------------------------------------
// src/tests/mocks/mockNextNavigation.ts
// ---------------------------------------------------------------------------

export const getMockNextNavigation = (): string => {
  return `// Mock for next/navigation (App Router).
// jest.mock("next/navigation", ...) is already set up globally in .jest/setupTests.ts.
// Import these helpers in individual tests when you need to configure return values.

export const mockPush = jest.fn();
export const mockReplace = jest.fn();
export const mockPrefetch = jest.fn();
export const mockBack = jest.fn();
export const mockForward = jest.fn();
export const mockUsePathname = jest.fn(() => "/");
export const mockUseParams = jest.fn(() => ({}));
export const mockUseSearchParams = jest.fn(() => new URLSearchParams());

export function mockUseRouter(
  overrides?: Partial<{
    push: jest.Mock;
    replace: jest.Mock;
    prefetch: jest.Mock;
    back: jest.Mock;
    forward: jest.Mock;
  }>,
) {
  const { useRouter } =
    jest.requireMock<typeof import("next/navigation")>("next/navigation");
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
    forward: mockForward,
    ...overrides,
  });
}
`;
};

// ---------------------------------------------------------------------------
// src/tests/mocks/svgMock.tsx
// ---------------------------------------------------------------------------

export const getSvgMock = (): string => {
  return `import { forwardRef, type SVGProps } from "react";

const SvgMock = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) => <svg ref={ref} {...props} />,
);
SvgMock.displayName = "SvgMock";

export default SvgMock;
`;
};

export const getAppToastMock = (): string => {
  return `export const appToast = {
  error: jest.fn(),
  success: jest.fn(),
  warning: jest.fn(),
};
`;
};

export const getHandbookTestRules = (): string => {
  return `import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export type HandbookTestViolation = {
  filePath: string;
  line: number;
  rule: string;
  message: string;
  excerpt: string;
};

const FEATURE_TEST_SUFFIXES = [
  ".spec.ts",
  ".spec.tsx",
  ".test.ts",
  ".test.tsx",
  ".po.tsx",
] as const;

const HANDBOOK_TEST_RULES_ALLOWLIST = [
  /^src\\/tests\\/utils\\/handbookTestRules\\.spec\\.ts$/,
  /^src\\/tests\\/utils\\/handbookEditGuard\\.spec\\.ts$/,
] as const;

const QUERY_HOOK_IMPORT_PATTERN =
  /from\\s+["']src\\/hooks\\/queries\\/use[A-Za-z0-9]+["']/;

const MUTATION_HOOK_IMPORT_PATTERN =
  /from\\s+["']src\\/hooks\\/mutations\\/use[A-Za-z0-9]+["']/;

const FORBIDDEN_HOOK_LAYER_SPEC_PATH =
  /^src\\/hooks\\/(mutations|queries)\\/.+\\.(spec|test|po)\\.(ts|tsx)$/;

const FORBIDDEN_HOOK_LAYER_SPEC_MESSAGE =
  "Do not add specs under src/hooks/queries/ or src/hooks/mutations/. Cover read/write behavior at call sites (components, feature hooks) with mocked api.*. See docs/handbook/conventions.md (Do not test React Query).";

const QUERY_HOOK_MOCK_LINE_RULES = [
  {
    message:
      "Do not jest.mock query hooks under src/hooks/queries/. Mock src/api/urls and let the real query hook run in TestProviders. See docs/handbook/conventions.md (Do not test React Query).",
    pattern: /jest\\.mock\\s*\\(\\s*["']src\\/hooks\\/queries\\//,
    rule: "jest-mock-query-hook",
  },
] as const;

const MUTATION_HOOK_MOCK_LINE_RULES = [
  {
    message:
      "Do not jest.mock mutation hooks under src/hooks/mutations/. Mock src/api/urls and assert outcomes in components or feature hooks. See docs/handbook/conventions.md (Do not test React Query).",
    pattern: /jest\\.mock\\s*\\(\\s*["']src\\/hooks\\/mutations\\//,
    rule: "jest-mock-mutation-hook",
  },
] as const;

const jestMockedQueryHookPattern =
  /jest\\.mocked\\s*\\(\\s*use[A-Z][a-zA-Z0-9]*Query\\s*\\)/;

const jestMockedMutationHookPattern =
  /jest\\.mocked\\s*\\(\\s*use[A-Z][a-zA-Z0-9]*Mutation\\s*\\)/;

export const isFeatureTestFile = (relativePath: string): boolean =>
  FEATURE_TEST_SUFFIXES.some((suffix) => relativePath.endsWith(suffix));

export const isHandbookTestRulesAllowlisted = (relativePath: string): boolean =>
  HANDBOOK_TEST_RULES_ALLOWLIST.some((pattern) => pattern.test(relativePath));

const listFeatureTestFiles = (rootDir: string): string[] => {
  const files: string[] = [];

  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const absolutePath = join(directory, entry);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      const relativePath = relative(rootDir, absolutePath).replace(/\\\\/g, "/");

      if (isFeatureTestFile(relativePath)) {
        files.push(relativePath);
      }
    }
  };

  walk(join(rootDir, "src"));
  return files.sort();
};

const validateFeatureTestPath = (filePath: string): HandbookTestViolation[] => {
  if (isHandbookTestRulesAllowlisted(filePath)) {
    return [];
  }

  if (!FORBIDDEN_HOOK_LAYER_SPEC_PATH.test(filePath)) {
    return [];
  }

  return [
    {
      excerpt: filePath,
      filePath,
      line: 1,
      message: FORBIDDEN_HOOK_LAYER_SPEC_MESSAGE,
      rule: "forbidden-hook-layer-spec",
    },
  ];
};

export const validateFeatureTestSource = (
  filePath: string,
  source: string,
): HandbookTestViolation[] => {
  const pathViolations = validateFeatureTestPath(filePath);

  if (isHandbookTestRulesAllowlisted(filePath)) {
    return pathViolations;
  }

  const importsQueryHook = QUERY_HOOK_IMPORT_PATTERN.test(source);
  const importsMutationHook = MUTATION_HOOK_IMPORT_PATTERN.test(source);
  const violations: HandbookTestViolation[] = [...pathViolations];

  for (const [index, line] of source.split("\\n").entries()) {
    for (const { rule, pattern, message } of QUERY_HOOK_MOCK_LINE_RULES) {
      if (pattern.test(line)) {
        violations.push({
          excerpt: line.trim(),
          filePath,
          line: index + 1,
          message,
          rule,
        });
      }
    }

    for (const { rule, pattern, message } of MUTATION_HOOK_MOCK_LINE_RULES) {
      if (pattern.test(line)) {
        violations.push({
          excerpt: line.trim(),
          filePath,
          line: index + 1,
          message,
          rule,
        });
      }
    }

    if (importsQueryHook && jestMockedQueryHookPattern.test(line)) {
      violations.push({
        excerpt: line.trim(),
        filePath,
        line: index + 1,
        message:
          "Do not jest.mocked() query hooks from src/hooks/queries/. Mock src/api/urls instead. See docs/handbook/conventions.md (Do not test React Query).",
        rule: "jest-mocked-query-hook",
      });
    }

    if (importsMutationHook && jestMockedMutationHookPattern.test(line)) {
      violations.push({
        excerpt: line.trim(),
        filePath,
        line: index + 1,
        message:
          "Do not jest.mocked() mutation hooks from src/hooks/mutations/. Mock src/api/urls instead. See docs/handbook/conventions.md (Do not test React Query).",
        rule: "jest-mocked-mutation-hook",
      });
    }
  }

  return violations;
};

export const collectHandbookTestViolations = (
  rootDir: string,
): HandbookTestViolation[] =>
  listFeatureTestFiles(rootDir).flatMap((filePath) => {
    const source = readFileSync(join(rootDir, filePath), "utf8");
    return validateFeatureTestSource(filePath, source);
  });

export const formatHandbookTestViolations = (
  violations: HandbookTestViolation[],
): string =>
  violations
    .map(
      (violation) =>
        \`\${violation.filePath}:\${violation.line} [\${violation.rule}] \${violation.message}\\n  \${violation.excerpt}\`,
    )
    .join("\\n\\n");
`;
};

export const getHandbookTestRulesSpec = (): string => {
  return `import { describe, expect, it } from "@jest/globals";
import {
  collectHandbookTestViolations,
  formatHandbookTestViolations,
  isFeatureTestFile,
  isHandbookTestRulesAllowlisted,
  validateFeatureTestSource,
} from "src/tests/utils/handbookTestRules";

describe("handbookTestRules", () => {
  it("identifies feature test files and handbook rules spec allowlist paths", () => {
    expect(
      isFeatureTestFile("src/components/ContactForm/ContactForm.spec.tsx"),
    ).toBe(true);
    expect(
      isFeatureTestFile("src/components/ContactForm/ContactForm.po.tsx"),
    ).toBe(true);
    expect(isFeatureTestFile("src/tests/utils/handbookTestRules.ts")).toBe(
      false,
    );

    expect(
      isHandbookTestRulesAllowlisted(
        "src/tests/utils/handbookTestRules.spec.ts",
      ),
    ).toBe(true);
    expect(
      isHandbookTestRulesAllowlisted(
        "src/components/ContactForm/ContactForm.spec.tsx",
      ),
    ).toBe(false);
  });

  it("flags specs under src/hooks/mutations or src/hooks/queries", () => {
    const violations = validateFeatureTestSource(
      "src/hooks/mutations/useSubmitContactFormMutation.spec.ts",
      \`describe("useSubmitContactFormMutation", () => {});\\n\`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        line: 1,
        rule: "forbidden-hook-layer-spec",
      }),
    ]);
  });

  it("flags jest.mock on src/hooks/mutations in feature tests", () => {
    const violations = validateFeatureTestSource(
      "src/components/DeployButton/DeployButton.spec.tsx",
      \`jest.mock("src/hooks/mutations/useDeployHookMutation");\\n\`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        line: 1,
        rule: "jest-mock-mutation-hook",
      }),
    ]);
  });

  it("flags jest.mock on src/hooks/queries in feature tests", () => {
    const violations = validateFeatureTestSource(
      "src/components/DeployButton/DeployButton.spec.tsx",
      \`jest.mock("src/hooks/queries/useExample.query");\\n\`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        line: 1,
        rule: "jest-mock-query-hook",
      }),
    ]);
  });

  it("keeps feature tests free of handbook testing violations", () => {
    const violations = collectHandbookTestViolations(process.cwd());

    expect(violations).toEqual([]);
  });

  it("formats violations for hook and CI output", () => {
    const formatted = formatHandbookTestViolations([
      {
        excerpt: 'jest.mock("src/hooks/queries/useExample.query");',
        filePath: "src/components/DeployButton/DeployButton.spec.tsx",
        line: 12,
        message: "Do not jest.mock query hooks.",
        rule: "jest-mock-query-hook",
      },
    ]);

    expect(formatted).toContain("[jest-mock-query-hook]");
    expect(formatted).toContain("DeployButton.spec.tsx:12");
  });
});
`;
};

export const getHandbookEditGuard = (): string =>
  readFileSync(join(srcTestsUtilsAssetDir, "handbookEditGuard.ts"), "utf8");

export const getHandbookEditGuardSpec = (): string =>
  readFileSync(
    join(srcTestsUtilsAssetDir, "handbookEditGuard.spec.ts"),
    "utf8",
  );
