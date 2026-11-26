import { describe, expect, it } from "vitest";
import { toVitest } from "./testRunner.js";

describe("toVitest", () => {
  it("imports test globals from vitest and adds vi when the file mocks", () => {
    const source = `import { beforeEach, describe, expect, it } from "@jest/globals";
import { render } from "src/tests/test-utils";

jest.mock("src/api/urls");

describe("Thing", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
});
`;

    expect(
      toVitest(source),
    ).toBe(`import { render } from "src/tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("src/api/urls");

describe("Thing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
});
`);
  });

  it("adds a vi import to files that mock without importing globals", () => {
    expect(toVitest("export const mockToast = { error: jest.fn() };\n")).toBe(
      `import { vi } from "vitest";\n\nexport const mockToast = { error: vi.fn() };\n`,
    );
  });

  it("imports mock types from vitest", () => {
    const source = `import { describe } from "@jest/globals";

let mockFetch: jest.MockedFunction<typeof fetch>;
const handler = jest.fn() as jest.Mock;
`;

    expect(
      toVitest(source),
    ).toBe(`import { describe, type Mock, type MockedFunction, vi } from "vitest";

let mockFetch: MockedFunction<typeof fetch>;
const handler = vi.fn() as Mock;
`);
  });

  it("uses the vitest entry of jest-dom and leaves files without jest alone", () => {
    expect(toVitest(`import "@testing-library/jest-dom/jest-globals";\n`)).toBe(
      `import "@testing-library/jest-dom/vitest";\n`,
    );
    expect(toVitest("export const add = (a: number) => a + 1;\n")).toBe(
      "export const add = (a: number) => a + 1;\n",
    );
  });

  it("turns requireMock into a hoisted vi.mocked import", () => {
    const source = `const nav = jest.requireMock<typeof import("next/navigation")>("next/navigation");\n`;

    expect(toVitest(source)).toBe(
      `import * as nextNavigationModule from "next/navigation";\nimport { vi } from "vitest";\n\nconst nav = vi.mocked(nextNavigationModule);\n`,
    );
  });

  it("points setup-file references at .vitest/", () => {
    expect(
      toVitest(
        "// Set up globally in .jest/setupTests.ts.\nexport const mockPush = jest.fn();\n",
      ),
    ).toBe(
      `import { vi } from "vitest";\n\n// Set up globally in .vitest/setupTests.ts.\nexport const mockPush = vi.fn();\n`,
    );
  });

  it("sorts the vitest import among the other imports, as Biome does", () => {
    const source = `import { describe } from "@jest/globals";
import { useRouter } from "next/navigation";
import { render } from "src/tests/test-utils";
import styles from "./Thing.module.css";

jest.mock("next/navigation");
const nav = jest.requireMock<typeof import("next/router")>("next/router");
`;

    expect(toVitest(source)).toBe(`import { useRouter } from "next/navigation";
import * as nextRouterModule from "next/router";
import { render } from "src/tests/test-utils";
import { describe, vi } from "vitest";
import styles from "./Thing.module.css";

vi.mock("next/navigation");
const nav = vi.mocked(nextRouterModule);
`);
  });

  it("does not import vi when jest only appears inside template literals", () => {
    const source = `import { it } from "@jest/globals";

const fixture = \`jest.mock("src/hooks/queries/useThing");\`;
`;

    expect(toVitest(source)).toBe(`import { it } from "vitest";

const fixture = \`vi.mock("src/hooks/queries/useThing");\`;
`);
  });

  it("does not import vi when jest only appears in strings or comments", () => {
    const source = `import { it } from "@jest/globals";

// jest.mock is set up globally.
it("flags jest.mock on query hooks", () => {
  check('jest.mock("src/hooks/queries/useThing");');
});
`;

    expect(toVitest(source)).toBe(`import { it } from "vitest";

// vi.mock is set up globally.
it("flags vi.mock on query hooks", () => {
  check('vi.mock("src/hooks/queries/useThing");');
});
`);
  });

  it("wraps a vitest import longer than 80 characters, as Biome does", () => {
    const source = `import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

let mockFetch: jest.MockedFunction<typeof fetch>;
jest.clearAllMocks();
`;

    expect(toVitest(source)).toBe(`import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from "vitest";

let mockFetch: MockedFunction<typeof fetch>;
vi.clearAllMocks();
`);
  });

  it("joins a requireMock assignment onto one line when it fits", () => {
    const source = `const { useRouter } =
  jest.requireMock<typeof import("next/navigation")>("next/navigation");
`;

    expect(
      toVitest(source),
    ).toBe(`import * as nextNavigationModule from "next/navigation";
import { vi } from "vitest";

const { useRouter } = vi.mocked(nextNavigationModule);
`);
  });

  it("translates every @jest/globals import, including a jest binding", () => {
    const source = `import { describe, it } from "@jest/globals";

const fixture = \`import {
  afterAll,
  jest,
} from "@jest/globals";
\`;
`;

    expect(toVitest(source)).toBe(`import { describe, it } from "vitest";

const fixture = \`import {
  afterAll,
  vi,
} from "vitest";
\`;
`);
  });
});
