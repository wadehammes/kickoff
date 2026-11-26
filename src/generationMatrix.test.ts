import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { builtinModules, stripTypeScriptTypes } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findBrokenLinks } from "../scaffold-assets/claude-hooks/handbook-drift-check.mjs";
import { generateProject } from "./generator.js";
import type { ProjectAnswers } from "./types.js";

type Tooling = Pick<ProjectAnswers, "agentTooling" | "includeClaudePipeline">;
type Options = Pick<
  ProjectAnswers,
  | "includeContentful"
  | "includeGA"
  | "includeI18n"
  | "includeRecaptcha"
  | "includeResend"
>;

const TOOLINGS: Tooling[] = [
  { agentTooling: "cursor", includeClaudePipeline: false },
  { agentTooling: "claude", includeClaudePipeline: false },
  { agentTooling: "claude", includeClaudePipeline: true },
];

const OPTION_KEYS: (keyof Options)[] = [
  "includeContentful",
  "includeGA",
  "includeI18n",
  "includeRecaptcha",
  "includeResend",
];

const PNPM_BUILTIN_COMMANDS = new Set([
  "add",
  "approve-builds",
  "dlx",
  "exec",
  "i",
  "install",
  "run",
  "store",
]);

const NODE_BUILTINS = new Set(builtinModules);

/** Bare words checked as script names; others after "pnpm" are usually prose ("pnpm is ..."). */
const LIKELY_SCRIPT_NAMES = new Set([
  "build",
  "dev",
  "knip",
  "lint",
  "scaffold",
  "start",
  "test",
  "typecheck",
]);

const optionCombinations = (): Options[] =>
  Array.from({ length: 2 ** OPTION_KEYS.length }, (_, mask) =>
    Object.fromEntries(
      OPTION_KEYS.map((key, index) => [key, Boolean(mask & (1 << index))]),
    ),
  ) as Options[];

const scenarioName = (tooling: Tooling, options: Options): string => {
  const enabled = OPTION_KEYS.filter((key) => options[key]).map((key) =>
    key.replace("include", "").toLowerCase(),
  );
  const toolingName = tooling.includeClaudePipeline
    ? "claude-pipeline"
    : tooling.agentTooling;
  return [toolingName, ...enabled].join("-");
};

const SCENARIOS = TOOLINGS.flatMap((tooling) =>
  optionCombinations().map((options) => ({
    answers: {
      ...tooling,
      ...options,
      bgColor: "#ffffff",
      devPort: 3000,
      primaryColor: "#000000",
      prodUrl: "https://example.com",
      projectName: scenarioName(tooling, options),
      siteName: "Matrix Site",
      stagingUrl: "https://staging.example.com",
      textColor: "#000000",
      useCurrentDir: false,
    } satisfies ProjectAnswers,
    name: scenarioName(tooling, options),
  })),
);

const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });

const listDirs = (dir: string): string[] =>
  readdirSync(dir)
    .map((entry) => path.join(dir, entry))
    .filter((full) => statSync(full).isDirectory())
    .flatMap((full) => [full, ...listDirs(full)]);

const isDynamicSegment = (name: string): boolean => name.startsWith("[");

const findAmbiguousRoutes = (root: string): string[] => {
  const appDir = path.join(root, "src/app");
  return [appDir, ...listDirs(appDir)].flatMap((dir) => {
    const dynamicChildren = readdirSync(dir).filter(
      (entry) =>
        isDynamicSegment(entry) &&
        statSync(path.join(dir, entry)).isDirectory(),
    );
    return dynamicChildren.length > 1
      ? [`${path.relative(root, dir)}: ${dynamicChildren.join(", ")}`]
      : [];
  });
};

const findPagesWithoutSingleHtmlLayout = (root: string): string[] => {
  const appDir = path.join(root, "src/app");
  const pages = listFiles(appDir).filter(
    (file) => path.basename(file) === "page.tsx",
  );
  return pages.flatMap((page) => {
    const relativeDirs = path
      .relative(appDir, path.dirname(page))
      .split(path.sep);
    const layoutDirs = relativeDirs.map((_, index) =>
      path.join(appDir, ...relativeDirs.slice(0, index)),
    );
    layoutDirs.push(path.dirname(page));
    const htmlLayouts = [...new Set(layoutDirs)]
      .map((dir) => path.join(dir, "layout.tsx"))
      .filter(
        (layout) =>
          existsSync(layout) && readFileSync(layout, "utf-8").includes("<html"),
      );
    return htmlLayouts.length === 1
      ? []
      : [`${path.relative(root, page)}: ${htmlLayouts.length} <html> layouts`];
  });
};

const IMPORT_PATTERN =
  /^\s*(?:import|export)\s[^;]*?\sfrom\s+["']([^"']+)["']|^\s*import\s+["']([^"']+)["']|\bimport\(\s*["']([^"'`$]+)["']\s*\)/gm;

const resolvesToFile = (base: string): boolean => {
  const withoutJs = base.replace(/\.js$/, "");
  return [base, withoutJs].some((stem) =>
    ["", ".ts", ".tsx", ".d.ts", ".js", ".mjs"].some((extension) => {
      const candidate = `${stem}${extension}`;
      return existsSync(candidate) && statSync(candidate).isFile();
    }),
  );
};

const packageNameOf = (specifier: string): string => {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
};

const findBrokenImports = (root: string): string[] => {
  const pkg = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf-8"),
  ) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const declared = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);

  const sourceFiles = listFiles(root).filter(
    (file) => /\.(ts|tsx|mjs|js)$/.test(file) && !file.endsWith(".d.ts"),
  );

  return sourceFiles.flatMap((file) => {
    const content = readFileSync(file, "utf-8");
    const specifiers = [...content.matchAll(IMPORT_PATTERN)].map(
      ([, fromClause, sideEffect, dynamic]) =>
        fromClause ?? sideEffect ?? dynamic,
    );
    return specifiers.flatMap((specifier) => {
      const where = `${path.relative(root, file)} -> ${specifier}`;
      if (specifier.startsWith("src/")) {
        return resolvesToFile(path.join(root, specifier)) ? [] : [where];
      }
      if (specifier.startsWith(".")) {
        return resolvesToFile(path.resolve(path.dirname(file), specifier))
          ? []
          : [where];
      }
      if (specifier.startsWith("node:") || NODE_BUILTINS.has(specifier)) {
        return [];
      }
      return declared.has(packageNameOf(specifier))
        ? []
        : [`${where} (not in package.json)`];
    });
  });
};

const SCRIPT_REFERENCE_PATTERN = /\bpnpm\s+(?:run\s+)?([a-z][\w:-]*)/g;

const findMissingScriptReferences = (root: string): string[] => {
  const pkg = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf-8"),
  ) as {
    scripts: Record<string, string>;
  };
  const scripts = new Set(Object.keys(pkg.scripts));

  const referencingFiles = listFiles(root).filter((file) => {
    const relative = path.relative(root, file);
    return (
      relative.startsWith(".github/") ||
      relative.startsWith(".claude/") ||
      relative.startsWith(".cursor/") ||
      relative.startsWith("docs/") ||
      relative === "Makefile" ||
      relative === "README.md" ||
      relative === "CLAUDE.md" ||
      relative === "package.json"
    );
  });

  return referencingFiles.flatMap((file) => {
    const content = readFileSync(file, "utf-8");
    return [...content.matchAll(SCRIPT_REFERENCE_PATTERN)]
      .map(([, script]) => script.replace(/:+$/, ""))
      .filter(
        (script) => script.includes(":") || LIKELY_SCRIPT_NAMES.has(script),
      )
      .filter((script) => !PNPM_BUILTIN_COMMANDS.has(script))
      .filter((script) => !scripts.has(script))
      .map((script) => `${path.relative(root, file)}: pnpm ${script}`);
  });
};

const findMissingScriptFiles = (root: string): string[] => {
  const pkg = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf-8"),
  ) as {
    scripts: Record<string, string>;
  };
  return Object.entries(pkg.scripts).flatMap(([name, command]) =>
    [...command.matchAll(/\bscripts\/[\w./-]+/g)]
      .map(([reference]) => reference)
      .filter((reference) => !existsSync(path.join(root, reference)))
      .map((reference) => `${name}: ${reference}`),
  );
};

/** Parses each generated .ts file; catches template escaping bugs that tsc would only find after install. */
const findTypeScriptSyntaxErrors = (root: string): string[] =>
  listFiles(root)
    .filter((file) => file.endsWith(".ts"))
    .flatMap((file) => {
      try {
        stripTypeScriptTypes(readFileSync(file, "utf-8"));
        return [];
      } catch (error) {
        return [
          `${path.relative(root, file)}: ${String(error).split("\n")[0]}`,
        ];
      }
    });

const findInvalidJson = (root: string): string[] =>
  listFiles(root)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
      try {
        JSON.parse(readFileSync(file, "utf-8"));
        return [];
      } catch (error) {
        return [`${path.relative(root, file)}: ${String(error)}`];
      }
    });

const findBrokenDocLinks = (root: string): string[] =>
  findBrokenLinks(listFiles(root).filter((file) => file.endsWith(".md"))).map(
    (problem: string) => problem.replaceAll(`${root}/`, ""),
  );

let matrixRoot: string;
let previousCwd: string;

beforeAll(() => {
  previousCwd = process.cwd();
  matrixRoot = mkdtempSync(path.join(tmpdir(), "kickoff-matrix-"));
  process.chdir(matrixRoot);
});

afterAll(() => {
  process.chdir(previousCwd);
  rmSync(matrixRoot, { force: true, maxRetries: 3, recursive: true });
});

describe("generation matrix", () => {
  it("covers every tooling and option combination", () => {
    expect(SCENARIOS).toHaveLength(TOOLINGS.length * 2 ** OPTION_KEYS.length);
  });

  it.each(SCENARIOS)("$name", async ({ answers }) => {
    await generateProject(answers);
    const root = path.join(matrixRoot, answers.projectName);

    expect(
      findAmbiguousRoutes(root).join("\n"),
      "ambiguous dynamic routes",
    ).toBe("");
    expect(
      findPagesWithoutSingleHtmlLayout(root).join("\n"),
      "pages need exactly one <html> layout",
    ).toBe("");
    expect(findBrokenImports(root).join("\n"), "unresolved imports").toBe("");
    expect(
      findMissingScriptReferences(root).join("\n"),
      "pnpm scripts referenced but not defined",
    ).toBe("");
    expect(
      findMissingScriptFiles(root).join("\n"),
      "package.json script files",
    ).toBe("");
    expect(findInvalidJson(root).join("\n"), "invalid JSON").toBe("");
    expect(findBrokenDocLinks(root).join("\n"), "broken markdown links").toBe(
      "",
    );
    expect(
      findTypeScriptSyntaxErrors(root).join("\n"),
      "TypeScript syntax errors",
    ).toBe("");
  });
});
