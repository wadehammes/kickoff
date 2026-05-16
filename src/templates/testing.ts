// ---------------------------------------------------------------------------
// src/tests/factories/RichTextDocument.factory.ts
// ---------------------------------------------------------------------------

export function getRichTextDocumentFactory(): string {
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
}

// ---------------------------------------------------------------------------
// src/tests/basePageObject.po.ts
// ---------------------------------------------------------------------------

export function getBasePageObject(): string {
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
}

// ---------------------------------------------------------------------------
// src/tests/factories/BaseFactory.ts
// ---------------------------------------------------------------------------

export function getBaseFactory(): string {
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
}

// ---------------------------------------------------------------------------
// .jest/setEnvVars.ts
// ---------------------------------------------------------------------------

export function getSetEnvVars(): string {
  return `process.env.ENVIRONMENT = "staging";
`;
}

// ---------------------------------------------------------------------------
// .jest/setupTests.ts
// ---------------------------------------------------------------------------

export function getSetupTests(): string {
  return `import "@testing-library/jest-dom";
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
}

// ---------------------------------------------------------------------------
// src/tests/mocks/mockIntersectionObserver.ts
// ---------------------------------------------------------------------------

export function getMockIntersectionObserver(): string {
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
}

// ---------------------------------------------------------------------------
// src/tests/mocks/mockMatchMedia.ts
// ---------------------------------------------------------------------------

export function getMockMatchMedia(): string {
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
}

// ---------------------------------------------------------------------------
// src/tests/mocks/mockNextNavigation.ts
// ---------------------------------------------------------------------------

export function getMockNextNavigation(): string {
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

export function mockUseRouter(overrides?: Partial<{
  push: jest.Mock;
  replace: jest.Mock;
  prefetch: jest.Mock;
  back: jest.Mock;
  forward: jest.Mock;
}>) {
  const { useRouter } = jest.requireMock<typeof import("next/navigation")>("next/navigation");
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
}
