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
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { findBrokenLinks } from "../scaffold-assets/claude-hooks/handbook-drift-check.mjs";
import { generateProject } from "./generator.js";
import { CMS_IDS, type Cms, type ProjectAnswers } from "./types.js";

type Tooling = Pick<
  ProjectAnswers,
  "agentTooling" | "hosting" | "includeClaudePipeline" | "testRunner"
>;
type Options = Pick<
  ProjectAnswers,
  | "includeForms"
  | "includeGA"
  | "includeI18n"
  | "includePlaywright"
  | "includeRecaptcha"
  | "includeResend"
>;

const jest = { testRunner: "jest" } as const;
const vitest = { testRunner: "vitest" } as const;

const TOOLINGS: Tooling[] = [
  {
    agentTooling: "cursor",
    hosting: "vercel",
    includeClaudePipeline: false,
    ...jest,
  },
  {
    agentTooling: "claude",
    hosting: "vercel",
    includeClaudePipeline: false,
    ...jest,
  },
  {
    agentTooling: "claude",
    hosting: "vercel",
    includeClaudePipeline: true,
    ...jest,
  },
  {
    agentTooling: "cursor",
    hosting: "other",
    includeClaudePipeline: false,
    ...jest,
  },
  {
    agentTooling: "claude",
    hosting: "other",
    includeClaudePipeline: false,
    ...jest,
  },
  {
    agentTooling: "cursor",
    hosting: "vercel",
    includeClaudePipeline: false,
    ...vitest,
  },
  {
    agentTooling: "claude",
    hosting: "vercel",
    includeClaudePipeline: true,
    ...vitest,
  },
];

const OPTION_KEYS: (keyof Options)[] = [
  "includeForms",
  "includeGA",
  "includeI18n",
  "includePlaywright",
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

const scenarioName = (tooling: Tooling, cms: Cms, options: Options): string => {
  const enabled = OPTION_KEYS.filter((key) => options[key]).map((key) =>
    key.replace("include", "").toLowerCase(),
  );
  const toolingName = tooling.includeClaudePipeline
    ? "claude-pipeline"
    : tooling.agentTooling;
  const hostName = tooling.hosting === "other" ? "selfhost" : null;
  const runnerName = tooling.testRunner === "vitest" ? "vitest" : null;
  const cmsName = cms === "none" ? null : cms;
  return [toolingName, hostName, runnerName, cmsName, ...enabled]
    .filter(Boolean)
    .join("-");
};

const SCENARIOS = TOOLINGS.flatMap((tooling) =>
  CMS_IDS.flatMap((cms) =>
    optionCombinations().map((options) => ({
      answers: {
        ...tooling,
        ...options,
        cms,
        bgColor: "#ffffff",
        devPort: 3000,
        extraPackages: [],
        projectDescription: "",
        projectType: "marketing",
        primaryColor: "#000000",
        prodUrl: "https://example.com",
        projectName: scenarioName(tooling, cms, options),
        siteName: "Matrix Site",
        stagingUrl: "https://staging.example.com",
        textColor: "#000000",
        useCurrentDir: false,
      } satisfies ProjectAnswers,
      name: scenarioName(tooling, cms, options),
    })),
  ),
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

// Hook scripts match both runners, so "(jest|vi)" and "(?:jest|vitest)" are fine.
const JEST_MENTION = /\bjest\b|@jest\/|\bJest\b/;
// The Vitest setup also defines a jest global so Testing Library's waitFor drives fake timers.
const BOTH_RUNNERS = /\((?:\?:)?jest\|vi(?:test)?\)|jest-dom|\{ jest: vi \}/g;

const findJestMentions = (root: string): string[] =>
  listFiles(root)
    .filter((file) => !file.includes(`${path.sep}node_modules${path.sep}`))
    .flatMap((file) =>
      readFileSync(file, "utf-8")
        .split("\n")
        .flatMap((line, index) =>
          JEST_MENTION.test(line.replace(BOTH_RUNNERS, ""))
            ? [`${path.relative(root, file)}:${index + 1}: ${line.trim()}`]
            : [],
        ),
    );

const findMentions = (root: string, pattern: RegExp): string[] =>
  listFiles(root)
    .filter((file) => !file.includes(`${path.sep}node_modules${path.sep}`))
    .flatMap((file) =>
      readFileSync(file, "utf-8")
        .split("\n")
        .flatMap((line, index) =>
          pattern.test(line)
            ? [`${path.relative(root, file)}:${index + 1}: ${line.trim()}`]
            : [],
        ),
    );

// Every CMS a project does not use, as a pattern for its name.
const otherCmsNames = (cms: Cms): RegExp | null => {
  const others = CMS_IDS.filter((id) => id !== "none" && id !== cms);

  return others.length > 0
    ? new RegExp(`\\b(${others.join("|")})\\b`, "i")
    : null;
};

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
  // Exact tsconfig paths entries (like "prismic.config.json") resolve to a file.
  const aliases = Object.entries(
    (
      JSON.parse(readFileSync(path.join(root, "tsconfig.json"), "utf-8")) as {
        compilerOptions: { paths: Record<string, string[]> };
      }
    ).compilerOptions.paths,
  ).filter(([alias]) => !alias.includes("*"));

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
      const alias = aliases.find(([name]) => name === specifier);
      if (alias) {
        return alias[1].some((target) =>
          resolvesToFile(path.join(root, target)),
        )
          ? []
          : [where];
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

const sourceFiles = (root: string): string[] =>
  listFiles(path.join(root, "src")).filter((file) => /\.tsx?$/.test(file));

const componentFiles = (root: string): string[] =>
  sourceFiles(root).filter((file) => file.endsWith(".component.tsx"));

const componentName = (file: string): string =>
  path.basename(file, ".component.tsx");

const scriptFiles = (root: string): string[] =>
  existsSync(path.join(root, "scripts"))
    ? listFiles(path.join(root, "scripts")).filter((file) =>
        file.endsWith(".ts"),
      )
    : [];

const findFunctionDeclarations = (root: string): string[] =>
  [...sourceFiles(root), ...scriptFiles(root)].flatMap((file) =>
    readFileSync(file, "utf-8")
      .split("\n")
      .flatMap((line, index) =>
        /^\s*(export\s+)?(default\s+)?(async\s+)?function\b/.test(line)
          ? [`${path.relative(root, file)}:${index + 1}: ${line.trim()}`]
          : [],
      ),
  );

const linesOf = (
  root: string,
  check: (line: string, previous: string) => boolean,
): string[] =>
  [...sourceFiles(root), ...scriptFiles(root)].flatMap((file) =>
    readFileSync(file, "utf-8")
      .split("\n")
      .flatMap((line, index, lines) =>
        check(line, lines[index - 1] ?? "")
          ? [`${path.relative(root, file)}:${index + 1}: ${line.trim()}`]
          : [],
      ),
  );

const findMissingBlankLines = (root: string): string[] =>
  linesOf(
    root,
    (line, previous) =>
      /^\s*(const|let) .*;\s*$/.test(previous) &&
      /^\s*(if|return|for|while|switch|try)\b/.test(line),
  );

const findIfsWithoutBraces = (root: string): string[] =>
  linesOf(root, (line) =>
    /^\s*(if|else if) ?\(.*\)\s*[^{\s].*;\s*$/.test(line),
  );

const isCompoundPrimitive = (file: string, content: string): boolean =>
  file.includes(`${path.sep}src${path.sep}ui${path.sep}`) &&
  !content.includes(`export const ${componentName(file)} `) &&
  [...content.matchAll(/^export const [A-Z]\w* = /gm)].length > 1;

const findComponentsMissingExports = (root: string): string[] =>
  componentFiles(root).flatMap((file) => {
    const content = readFileSync(file, "utf-8");
    const name = componentName(file);

    if (isCompoundPrimitive(file, content)) {
      return [];
    }

    return [
      ...(content.includes(`export const ${name} `)
        ? []
        : [`${path.relative(root, file)}: no named export ${name}`]),
      ...(content.includes(`export default ${name};`)
        ? []
        : [`${path.relative(root, file)}: no default export ${name}`]),
    ];
  });

const findComponentsMissingTestIds = (root: string): string[] =>
  componentFiles(root)
    .filter((file) =>
      file.includes(`${path.sep}src${path.sep}components${path.sep}`),
    )
    .filter(
      (file) =>
        !readFileSync(file, "utf-8").includes(
          `data-testid="rh${componentName(file)}"`,
        ),
    )
    .map(
      (file) =>
        `${path.relative(root, file)}: no data-testid="rh${componentName(file)}"`,
    );

const findVercelMentions = (root: string): string[] =>
  listFiles(root).flatMap((file) =>
    readFileSync(file, "utf-8")
      .split("\n")
      .flatMap((line, index) =>
        /vercel|refresh-content|refreshContent|DeployButton|DeployPage|useDeployMonitor|deployProgress|deploy hook/i.test(
          line,
        )
          ? [`${path.relative(root, file)}:${index + 1}: ${line.trim()}`]
          : [],
      ),
  );

const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

const TOKEN_BUDGETS = {
  // CLAUDE.md, plus what the session-start hook injects: the non-negotiables
  // (always loaded by design, so agents never skip them) and the routing table.
  alwaysLoaded: 2_750,
  handbookPage: 1_500,
  reviewCommand: 1_500,
};

const findOverBudget = (root: string): string[] => {
  const read = (file: string) =>
    existsSync(path.join(root, file))
      ? readFileSync(path.join(root, file), "utf-8")
      : "";
  const over = (label: string, tokens: number, budget: number) =>
    tokens > budget ? [`${label}: ~${tokens} tokens (budget ${budget})`] : [];
  const handbookDir = path.join(root, "docs/handbook");
  const reviewCommand =
    read(".claude/commands/handbook-review.md") ||
    read(".cursor/commands/handbook-review.md");

  return [
    ...over(
      "always loaded (CLAUDE.md + session-start non-negotiables and routing table)",
      estimateTokens(
        read("CLAUDE.md") +
          read("docs/handbook/non-negotiables.md") +
          read("docs/handbook/llms.md")
            .split("\n")
            .filter((line) => line.startsWith("|"))
            .join("\n"),
      ),
      TOKEN_BUDGETS.alwaysLoaded,
    ),
    ...readdirSync(handbookDir)
      .filter((name) => name.endsWith(".md"))
      .flatMap((name) =>
        over(
          `docs/handbook/${name}`,
          estimateTokens(read(`docs/handbook/${name}`)),
          TOKEN_BUDGETS.handbookPage,
        ),
      ),
    ...over(
      "/handbook-review",
      estimateTokens(reviewCommand),
      TOKEN_BUDGETS.reviewCommand,
    ),
  ];
};

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

// Remove each project as soon as its checks finish; deleting all of them in
// afterAll outlasts the hook timeout on CI runners.
afterEach(() => {
  for (const entry of readdirSync(matrixRoot)) {
    rmSync(path.join(matrixRoot, entry), {
      force: true,
      maxRetries: 3,
      recursive: true,
    });
  }
});

afterAll(() => {
  process.chdir(previousCwd);
  rmSync(matrixRoot, { force: true, maxRetries: 3, recursive: true });
});

describe("generation matrix", () => {
  it("covers every tooling and option combination", () => {
    expect(SCENARIOS).toHaveLength(
      TOOLINGS.length * CMS_IDS.length * 2 ** OPTION_KEYS.length,
    );
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
    expect(
      findOverBudget(root).join("\n"),
      "token budgets for what agents read",
    ).toBe("");
    if (answers.testRunner === "vitest") {
      expect(
        findJestMentions(root).slice(0, 40).join("\n"),
        "Vitest projects should not mention Jest",
      ).toBe("");
    }
    const otherCms = otherCmsNames(answers.cms);
    if (otherCms) {
      expect(
        findMentions(root, otherCms).slice(0, 40).join("\n"),
        "projects should not mention a CMS they do not use",
      ).toBe("");
    }
    if (answers.hosting === "other") {
      expect(
        findVercelMentions(root).slice(0, 40).join("\n"),
        "projects not hosted on Vercel should not mention it",
      ).toBe("");
    }
    expect(
      findFunctionDeclarations(root).join("\n"),
      "function declarations (the handbook requires arrow functions)",
    ).toBe("");
    expect(
      findMissingBlankLines(root).join("\n"),
      "blank line after declarations before control flow or return",
    ).toBe("");
    expect(
      findIfsWithoutBraces(root).join("\n"),
      "if statements need braces",
    ).toBe("");
    expect(
      findComponentsMissingExports(root).join("\n"),
      "components need a named and a default export",
    ).toBe("");
    expect(
      findComponentsMissingTestIds(root).join("\n"),
      "components need a root data-testid",
    ).toBe("");
    expect(findBrokenDocLinks(root).join("\n"), "broken markdown links").toBe(
      "",
    );
    expect(
      findTypeScriptSyntaxErrors(root).join("\n"),
      "TypeScript syntax errors",
    ).toBe("");
  });
});
