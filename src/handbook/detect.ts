import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type CodebaseFacts = {
  agentDocs: string[];
  defaultBranch: string | null;
  existingHandbookPages: number;
  fileCount: number;
  languages: string[];
  name: string;
  otherHandbooks: string[];
  packageManagers: string[];
  scripts: string[];
  scriptsFrom: string | null;
  stack: string[];
  topLevelDirs: { dir: string; files: number }[];
  workspace: string[];
};

const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "vendor",
]);

const LIBRARIES: [string, string][] = [
  ["next", "Next.js"],
  ["react", "React"],
  ["vue", "Vue"],
  ["svelte", "Svelte"],
  ["@angular/core", "Angular"],
  ["astro", "Astro"],
  ["@remix-run/react", "Remix"],
  ["react-router", "React Router"],
  ["react-router-dom", "React Router"],
  ["express", "Express"],
  ["@nestjs/core", "NestJS"],
  ["vite", "Vite"],
  ["typescript", "TypeScript"],
  ["jest", "Jest"],
  ["vitest", "Vitest"],
  ["@playwright/test", "Playwright"],
  ["cypress", "Cypress"],
  ["@testing-library/react", "Testing Library"],
  ["storybook", "Storybook"],
  ["@biomejs/biome", "Biome"],
  ["eslint", "ESLint"],
  ["prettier", "Prettier"],
  ["stylelint", "Stylelint"],
  ["knip", "knip"],
  ["tailwindcss", "Tailwind CSS"],
  ["styled-components", "styled-components"],
  ["@emotion/react", "Emotion"],
  ["sass", "Sass"],
  ["@mui/material", "MUI"],
  ["@base-ui/react", "Base UI"],
  ["@radix-ui/react-slot", "Radix UI"],
  ["@tanstack/react-query", "TanStack Query"],
  ["swr", "SWR"],
  ["@reduxjs/toolkit", "Redux Toolkit"],
  ["redux", "Redux"],
  ["jotai", "Jotai"],
  ["zustand", "Zustand"],
  ["react-hook-form", "React Hook Form"],
  ["zod", "Zod"],
  ["yup", "Yup"],
  ["axios", "axios"],
  ["next-intl", "next-intl"],
  ["i18next", "i18next"],
  ["@prisma/client", "Prisma"],
  ["drizzle-orm", "Drizzle"],
  ["contentful", "Contentful"],
  ["@prismicio/client", "Prismic"],
  ["@sentry/nextjs", "Sentry"],
  ["@sentry/react", "Sentry"],
];

const LANGUAGE_MARKERS: [string, string][] = [
  ["tsconfig.json", "TypeScript"],
  ["package.json", "JavaScript"],
  ["pyproject.toml", "Python"],
  ["requirements.txt", "Python"],
  ["go.mod", "Go"],
  ["Gemfile", "Ruby"],
  ["Cargo.toml", "Rust"],
  ["pom.xml", "Java"],
  ["build.gradle", "Java/Kotlin"],
  ["composer.json", "PHP"],
];

const AGENT_DOC_PATTERNS = [
  /^AGENTS\.md$/,
  /^CLAUDE\.md$/,
  /^CONTRIBUTING\.md$/,
  /^\.github\/copilot-instructions\.md$/,
  /^\.cursor\/rules\/.+\.mdc?$/,
  /^\.claude\/rules\/.+\.md$/,
  /^\.claude\/commands\/.+\.md$/,
  /^\.claude\/skills\/.+\/SKILL\.md$/,
  /^\.cursor\/skills\/.+\/SKILL\.md$/,
  /(^|\/)(conventions|docs)\/.+\.md$/,
];

const git = (root: string, args: string[]): string | null => {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf-8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
};

const walk = (root: string, dir = "", found: string[] = []): string[] => {
  for (const entry of readdirSync(path.join(root, dir), {
    withFileTypes: true,
  })) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const relative = dir ? `${dir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      walk(root, relative, found);
    } else {
      found.push(relative);
    }
  }

  return found;
};

const listFiles = (root: string): string[] => {
  const tracked = git(root, [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
  ]);

  return tracked === null ? walk(root) : tracked.split("\n").filter(Boolean);
};

const readJson = (file: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(readFileSync(file, "utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const dependencyNames = (pkg: Record<string, unknown>): string[] =>
  ["dependencies", "devDependencies", "peerDependencies"].flatMap((field) =>
    Object.keys((pkg[field] as Record<string, string> | undefined) ?? {}),
  );

const MAX_MARKER_DEPTH = 2;

const shallowMatches = (files: string[], name: string): string[] =>
  files.filter(
    (file) =>
      path.basename(file) === name &&
      file.split("/").length <= MAX_MARKER_DEPTH + 1,
  );

const withLocation = (label: string, file: string): string =>
  file.includes("/") ? `${label} (${path.dirname(file)}/)` : label;

const LOCKFILES: [string, string][] = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["package-lock.json", "npm"],
  ["uv.lock", "uv"],
  ["poetry.lock", "Poetry"],
];

const WORKSPACE_MARKERS: [string, string][] = [
  ["nx.json", "Nx"],
  ["turbo.json", "Turborepo"],
  ["lerna.json", "Lerna"],
  ["pnpm-workspace.yaml", "pnpm workspaces"],
];

const labelsFor = (files: string[], markers: [string, string][]): string[] => [
  ...new Set(
    markers.flatMap(([name, label]) =>
      shallowMatches(files, name).map((file) => withLocation(label, file)),
    ),
  ),
];

const detectScripts = (
  root: string,
  files: string[],
): { from: string | null; names: string[] } => {
  const candidates = shallowMatches(files, "package.json").sort(
    (left, right) => left.split("/").length - right.split("/").length,
  );

  for (const file of candidates) {
    const scripts = readJson(path.join(root, file))?.scripts as
      | Record<string, string>
      | undefined;

    if (scripts && Object.keys(scripts).length > 0) {
      return { from: file, names: Object.keys(scripts) };
    }
  }

  return { from: null, names: [] };
};

const detectDefaultBranch = (root: string): string | null => {
  const head = git(root, [
    "symbolic-ref",
    "--short",
    "refs/remotes/origin/HEAD",
  ]);

  return head ? head.trim().replace(/^origin\//, "") : null;
};

export const detectCodebase = (
  root: string,
  handbookDir: string,
): CodebaseFacts => {
  const files = listFiles(root);
  const rootPackage = files.includes("package.json")
    ? readJson(path.join(root, "package.json"))
    : null;
  const dependencies = new Set(
    files
      .filter((file) => path.basename(file) === "package.json")
      .flatMap((file) => {
        const pkg = readJson(path.join(root, file));

        return pkg ? dependencyNames(pkg) : [];
      }),
  );
  const dirCounts = new Map<string, number>();

  for (const file of files) {
    if (file.includes("/")) {
      const dir = file.split("/")[0];
      dirCounts.set(dir, (dirCounts.get(dir) ?? 0) + 1);
    }
  }

  const handbookPrefix = `${handbookDir}/`;
  const scripts = detectScripts(root, files);
  const workspace = labelsFor(files, WORKSPACE_MARKERS);

  if (rootPackage?.workspaces) {
    workspace.push("package.json workspaces");
  }

  return {
    agentDocs: files
      .filter((file) =>
        AGENT_DOC_PATTERNS.some((pattern) => pattern.test(file)),
      )
      .filter((file) => !file.startsWith(handbookPrefix))
      .slice(0, 60),
    defaultBranch: detectDefaultBranch(root),
    existingHandbookPages: files.filter(
      (file) => file.startsWith(handbookPrefix) && file.endsWith(".md"),
    ).length,
    fileCount: files.length,
    languages: [
      ...new Set(
        LANGUAGE_MARKERS.filter(([marker]) =>
          files.some((file) => path.basename(file) === marker),
        ).map(([, label]) => label),
      ),
    ],
    name:
      (typeof rootPackage?.name === "string" ? rootPackage.name : null) ??
      path.basename(root),
    otherHandbooks: files
      .filter(
        (file) =>
          path.basename(file) === "llms.md" && !file.startsWith(handbookPrefix),
      )
      .map((file) => path.dirname(file)),
    packageManagers: labelsFor(files, LOCKFILES),
    scripts: scripts.names,
    scriptsFrom: scripts.from,
    stack: [
      ...new Set(
        LIBRARIES.filter(([dependency]) => dependencies.has(dependency)).map(
          ([, label]) => label,
        ),
      ),
    ],
    topLevelDirs: [...dirCounts.entries()]
      .filter(([dir]) => !IGNORED_DIRS.has(dir))
      .sort((left, right) => right[1] - left[1])
      .slice(0, 15)
      .map(([dir, count]) => ({ dir, files: count })),
    workspace,
  };
};

const hasMarker = (dir: string): boolean =>
  LANGUAGE_MARKERS.some(([marker]) => existsSync(path.join(dir, marker)));

export const looksLikeCodebase = (root: string): boolean =>
  existsSync(root) &&
  (hasMarker(root) ||
    readdirSync(root, { withFileTypes: true }).some(
      (entry) =>
        entry.isDirectory() &&
        !IGNORED_DIRS.has(entry.name) &&
        hasMarker(path.join(root, entry.name)),
    ));
