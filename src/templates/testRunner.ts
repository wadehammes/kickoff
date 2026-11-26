import type { ProjectAnswers } from "../types.js";

export const usesVitest = (a: ProjectAnswers): boolean =>
  a.testRunner === "vitest";

const TEST_RUNNERS = {
  jest: {
    config: "jest.config.ts",
    globals: "@jest/globals",
    mock: "jest",
    name: "Jest",
    setupDir: ".jest",
  },
  vitest: {
    config: "vitest.config.ts",
    globals: "vitest",
    mock: "vi",
    name: "Vitest",
    setupDir: ".vitest",
  },
} as const;

/** Names, files, and modules that differ between the supported test runners. */
export const getTestRunner = (a: ProjectAnswers) => TEST_RUNNERS[a.testRunner];

const MOCK_TYPES = ["MockedFunction", "Mocked", "Mock"] as const;

// Biome's line width.
const MAX_LINE = 80;

const GLOBALS_IMPORT = /^import \{([^}]*)\} from "@jest\/globals";\n/m;
const TOP_LEVEL_IMPORT = /^import (?:[^;]*? from )?"([^"]+)";\n/gm;

const moduleIdentifier = (specifier: string): string =>
  `${specifier
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? part : part[0].toUpperCase() + part.slice(1),
    )
    .join("")}Module`;

/** Blanks out template literal contents (keeping offsets) so fixture text isn't read as code. */
const blankTemplates = (text: string): string => {
  let inTemplate = false;
  let out = "";

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (inTemplate && char === "\\") {
      out += "  ";
      index++;
      continue;
    }

    if (char === "`") {
      inTemplate = !inTemplate;
      out += " ";
      continue;
    }

    out += inTemplate && char !== "\n" ? " " : char;
  }

  return out;
};

/** Blanks out strings and comments (keeping offsets) so only code is left to read. */
const blankStringsAndComments = (text: string): string => {
  let quote = "";
  let comment = "";
  let out = "";

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const pair = text.slice(index, index + 2);

    if (comment) {
      const ends = comment === "//" ? char === "\n" : pair === "*/";

      if (ends) {
        comment = "";
      }

      out += char === "\n" ? "\n" : " ";
      continue;
    }

    if (quote) {
      if (char === "\\") {
        out += "  ";
        index++;
      } else {
        quote = char === quote ? "" : quote;
        out += char === "\n" ? "\n" : " ";
      }
      continue;
    }

    if (pair === "//" || pair === "/*") {
      comment = pair;
      out += " ";
    } else if (char === '"' || char === "'" || char === "`") {
      quote = char;
      out += " ";
    } else {
      out += char;
    }
  }

  return out;
};

// Biome's import order: node: builtins, then bare and src/ paths, then relative paths.
const importSortKey = (source: string): string => {
  const rank = source.startsWith("node:") ? 0 : source.startsWith(".") ? 2 : 1;

  return `${rank}${source.toLowerCase()}`;
};

const insertImport = (text: string, line: string, source: string): string => {
  const imports = [...blankTemplates(text).matchAll(TOP_LEVEL_IMPORT)];

  if (imports.length === 0) {
    return `${line}\n\n${text.replace(/^\n+/, "")}`;
  }

  const key = importSortKey(source);
  const next = imports.find((match) => importSortKey(match[1]) > key);
  const last = imports[imports.length - 1];
  const at = next ? next.index : last.index + last[0].length;

  return `${text.slice(0, at)}${line}\n${text.slice(at)}`;
};

const specifierName = (specifier: string): string =>
  specifier.replace(/^type /, "").toLowerCase();

/**
 * Translates a Jest test, mock, or page object file to Vitest. Templates are
 * written once for Jest; Vitest projects get them through this function.
 */
export const toVitest = (source: string): string => {
  let text = source
    .replaceAll(
      "@testing-library/jest-dom/jest-globals",
      "@testing-library/jest-dom/vitest",
    )
    .replaceAll(".jest/setupTests", ".vitest/setupTests");

  if (!/\bjest\./.test(text) && !text.includes("@jest/globals")) {
    return text;
  }

  const moduleImports: { line: string; source: string }[] = [];

  text = text.replace(
    /jest\.requireMock(?:<[^>]*>)?\(\s*"([^"]+)"\s*\)/g,
    (_, specifier: string) => {
      const identifier = moduleIdentifier(specifier);
      moduleImports.push({
        line: `import * as ${identifier} from "${specifier}";`,
        source: specifier,
      });
      return `vi.mocked(${identifier})`;
    },
  );

  const specifiers = new Set<string>();

  for (const name of MOCK_TYPES) {
    text = text.replace(new RegExp(`\\bjest\\.${name}\\b`, "g"), () => {
      specifiers.add(`type ${name}`);
      return name;
    });
  }

  // A requireMock call that needed its own line fits beside the assignment once shortened.
  text = text.replace(
    /^(.*=)\n[ \t]+(vi\.mocked\([^()\n]*\);)$/gm,
    (match, assignment: string, call: string) =>
      `${assignment} ${call}`.length <= MAX_LINE
        ? `${assignment} ${call}`
        : match,
  );

  if (
    /\bjest\./.test(blankStringsAndComments(text)) ||
    moduleImports.length > 0
  ) {
    specifiers.add("vi");
  }

  text = text.replace(/\bjest\./g, "vi.");

  const globals = GLOBALS_IMPORT.exec(blankTemplates(text));

  if (globals) {
    for (const name of text
      .slice(globals.index, globals.index + globals[0].length)
      .replace(GLOBALS_IMPORT, "$1")
      .split(",")) {
      if (name.trim()) {
        specifiers.add(name.trim());
      }
    }

    text =
      text.slice(0, globals.index) +
      text.slice(globals.index + globals[0].length);
  }

  // Imports quoted inside test fixtures are translated in place.
  text = text.replace(
    /import \{([^}]*)\} from "@jest\/globals";/g,
    (_, names: string) =>
      `import {${names.replace(/\bjest\b/g, "vi")}} from "vitest";`,
  );

  for (const { line, source: specifier } of moduleImports) {
    text = insertImport(text, line, specifier);
  }

  if (specifiers.size > 0) {
    const names = [...specifiers].sort((a, b) =>
      specifierName(a).localeCompare(specifierName(b)),
    );

    const line = `import { ${names.join(", ")} } from "vitest";`;

    text = insertImport(
      text,
      line.length <= MAX_LINE
        ? line
        : `import {\n${names.map((name) => `  ${name},\n`).join("")}} from "vitest";`,
      "vitest",
    );
  }

  return text;
};
