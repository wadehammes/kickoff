import {
  type ChildProcess,
  execSync,
  spawn,
  spawnSync,
} from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { generateProject } from "./generator.js";
import {
  DEFAULT_VERSIONS,
  KEEP_PINNED,
  type Versions,
} from "./templates/config.js";
import type { ProjectAnswers } from "./types.js";
import { validateProjectAnswers } from "./validateAnswers.js";
import {
  fetchFromNpm,
  refreshVersions,
  resolveExtraPackages,
} from "./versions/refreshVersions.js";

const SCAFFOLD_CHECKS = [
  "tsc:ci",
  "lint:ci",
  "lint:css",
  "test:ci",
  "knip:ci",
] as const;

const SERVER_PORT = 3999;
const SERVER_BASE_URL = `http://localhost:${SERVER_PORT}`;
const SERVER_START_TIMEOUT_MS = 60_000;
const RUN_PLAYWRIGHT = process.env.SCAFFOLD_E2E_PLAYWRIGHT === "1";
const ONLY_FIXTURES = (process.env.SCAFFOLD_E2E_ONLY ?? "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);
const NEXT_DOCS_INDEX_MARKER = "<!-- NEXT-AGENTS-MD-START -->";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const fixturesDir = path.join(repoRoot, "fixtures", "scaffold-e2e");

const writeMinimalEnvLocal = (root: string, answers: ProjectAnswers): void => {
  const lines = [
    "ENVIRONMENT=staging",
    "ENABLE_EXPERIMENTAL_COREPACK=1",
    "VERCEL_API_TOKEN=e2e-vercel-token",
    "VERCEL_TEAM_ID=e2e-vercel-team",
  ];

  if (answers.includeContentful) {
    lines.push(
      "CONTENTFUL_SPACE_ID=e2e-space",
      "CONTENTFUL_CONTENT_DELIVERY_API_KEY=e2e-delivery",
      "CONTENTFUL_PREVIEW_API_KEY=e2e-preview",
      "CONTENTFUL_PREVIEW_SECRET=e2e-preview-secret",
      "CONTENTFUL_CMA_TOKEN=e2e-cma",
    );
  }

  if (answers.includeGA) {
    lines.push("GA_MEASUREMENT_ID=G-E2E000000");
  }

  if (answers.includeResend) {
    lines.push(
      "RESEND_API_KEY=e2e-resend",
      "RESEND_GENERAL_AUDIENCE_ID=e2e-audience",
    );
  }

  if (answers.includeRecaptcha) {
    lines.push(
      "RECAPTCHA_SITE_KEY=e2e-recaptcha-site",
      "RECAPTCHA_SECRET_KEY=e2e-recaptcha-secret",
    );
  }

  writeFileSync(
    path.join(root, ".env.local"),
    `${lines.join("\n")}\n`,
    "utf-8",
  );
};

const runInProject = (
  root: string,
  script: (typeof SCAFFOLD_CHECKS)[number],
) => {
  execSync(`pnpm ${script}`, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
};

const startServer = (root: string): ChildProcess =>
  spawn("pnpm", ["exec", "next", "start", "-p", String(SERVER_PORT)], {
    cwd: root,
    detached: true,
    env: process.env,
    stdio: "ignore",
  });

const stopServer = (server: ChildProcess): void => {
  if (server.pid !== undefined) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }
};

const waitForServer = async (): Promise<void> => {
  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      await fetch(SERVER_BASE_URL);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(
    `next start did not respond within ${SERVER_START_TIMEOUT_MS}ms`,
  );
};

const expectPage = async (
  pathname: string,
  status: number,
  lang?: string,
): Promise<void> => {
  const response = await fetch(`${SERVER_BASE_URL}${pathname}`, {
    redirect: "manual",
  });
  const body = await response.text();
  if (response.status !== status) {
    throw new Error(
      `GET ${pathname}: expected ${status}, got ${response.status}`,
    );
  }
  if (lang !== undefined && !body.includes(`<html lang="${lang}"`)) {
    throw new Error(`GET ${pathname}: expected <html lang="${lang}">`);
  }
  console.log(`    GET ${pathname} -> ${status}`);
};

const smokeTestBuild = async (
  root: string,
  answers: ProjectAnswers,
): Promise<void> => {
  console.log("  pnpm build");
  execSync("pnpm build", { cwd: root, env: process.env, stdio: "inherit" });

  console.log(`  next start (port ${SERVER_PORT})`);
  const server = startServer(root);
  try {
    await waitForServer();
    await expectPage("/", 200, "en");
    await expectPage("/kickoff-e2e-missing-page", 404);
    if (answers.includeI18n) {
      await expectPage("/es", 200, "es");
      await expectPage("/es/kickoff-e2e-missing-page", 404, "es");
    }

    if (answers.includePlaywright && RUN_PLAYWRIGHT) {
      console.log("  playwright install chromium");
      execSync(
        `pnpm exec playwright install ${process.env.CI ? "--with-deps " : ""}chromium`,
        { cwd: root, env: process.env, stdio: "inherit" },
      );
      console.log("  pnpm test:e2e");
      execSync("pnpm test:e2e", {
        cwd: root,
        env: { ...process.env, BASE_URL: SERVER_BASE_URL },
        stdio: "inherit",
      });
    }
  } finally {
    stopServer(server);
  }
};

const kickoffBin = path.join(repoRoot, "dist", "index.js");

const runKickoff = (args: string[], cwd: string, input?: string) =>
  spawnSync("node", [kickoffBin, ...args], {
    cwd,
    encoding: "utf-8",
    env: process.env,
    input,
  });

const driftHook = (root: string, answers: ProjectAnswers): string =>
  answers.agentTooling === "claude"
    ? path.join(root, ".claude/hooks/handbook-drift-check.mjs")
    : path.join(
        repoRoot,
        "scaffold-assets/claude-hooks/handbook-drift-check.mjs",
      );

const verifyHandbookTooling = (root: string, answers: ProjectAnswers): void => {
  console.log("  handbook drift check on a clean commit");
  execSync(
    "git init -q && git add -A && git -c user.email=e2e@example.com -c user.name=E2E commit -qm scaffold",
    { cwd: root, stdio: "inherit" },
  );
  const drift = spawnSync("node", [driftHook(root, answers)], {
    cwd: root,
    encoding: "utf-8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    input: "{}",
  });
  if (drift.status !== 0 || drift.stdout.trim() !== "") {
    throw new Error(
      `handbook drift check reported problems:\n${drift.stdout}${drift.stderr}`,
    );
  }

  console.log("  kickoff handbook --dry-run");
  const pages = readdirSync(path.join(root, "docs/handbook")).filter((name) =>
    name.endsWith(".md"),
  ).length;
  const dryRun = runKickoff(["handbook", "--dry-run"], root);
  if (
    dryRun.status !== 0 ||
    !dryRun.stdout.includes(
      `# Build the handbook for ${answers.projectName}`,
    ) ||
    !dryRun.stdout.includes(`\`docs/handbook/\` already has ${pages} pages`)
  ) {
    throw new Error(
      `kickoff handbook --dry-run did not describe the project:\n${dryRun.stdout}${dryRun.stderr}`,
    );
  }
};

const expectExit = (
  label: string,
  result: ReturnType<typeof runKickoff>,
  status: number,
  text?: string,
): void => {
  const combined = `${result.stdout}${result.stderr}`;
  if (result.status !== status || (text && !combined.includes(text))) {
    throw new Error(
      `${label}: expected exit ${status}${text ? ` and "${text}"` : ""}, got ${result.status}:\n${combined}`,
    );
  }
  console.log(`  ${label} -> ${status}`);
};

const verifyHandbookCommand = (): void => {
  const root = mkdtempSync(path.join(tmpdir(), "kickoff-handbook-e2e-"));
  const answersFile = path.join(fixturesDir, "claude-static.json");

  console.log("\n→ kickoff handbook");

  try {
    expectExit(
      "kickoff handbook --answers",
      runKickoff(["handbook", "--answers", answersFile], root),
      0,
      "Wrote docs/handbook/",
    );
    if (readdirSync(root).join(",") !== "docs") {
      throw new Error("kickoff handbook --answers wrote outside docs/handbook");
    }
    expectExit(
      "kickoff handbook --answers again",
      runKickoff(["handbook", "--answers", answersFile], root),
      1,
      "already has files",
    );
    expectExit(
      "kickoff handbook --answers --force",
      runKickoff(["handbook", "--answers", answersFile, "--force"], root),
      0,
    );

    writeFileSync(path.join(root, "package.json"), '{"name":"e2e-repo"}');
    const record = path.join(root, "agent-args.txt");
    const agent = path.join(root, "fake-agent.sh");
    writeFileSync(
      agent,
      `#!/usr/bin/env bash\nprintf '%s' "$1" > "${record}"\n`,
    );
    chmodSync(agent, 0o755);

    expectExit(
      "kickoff handbook --agent <cli>",
      runKickoff(["handbook", "--agent", agent], root),
      0,
    );
    if (
      !readFileSync(record, "utf-8").startsWith(
        "# Build the handbook for e2e-repo",
      )
    ) {
      throw new Error("the agent did not receive the handbook prompt");
    }
    expectExit(
      "kickoff handbook (no terminal)",
      runKickoff(["handbook"], root, ""),
      0,
      "# Build the handbook for e2e-repo",
    );
    console.log("✔ kickoff handbook");
  } finally {
    rmSync(root, { force: true, maxRetries: 3, recursive: true });
  }
};

const resolveVersions = async (): Promise<Versions> => {
  if (process.env.SCAFFOLD_E2E_REFRESH === "0") {
    console.log("\n→ using kickoff's tested package versions");
    return DEFAULT_VERSIONS;
  }

  console.log("\n→ refreshing package versions from npm");
  const result = await refreshVersions({
    fetchMetadata: fetchFromNpm,
    keep: KEEP_PINNED,
    versions: DEFAULT_VERSIONS,
  });

  for (const { from, name, to } of result.updated) {
    console.log(`  ${name} ${from} -> ${to}`);
  }

  for (const failure of result.failed) {
    console.log(`  could not check ${failure}`);
  }

  return result.versions;
};

const loadFixture = (fixturePath: string): ProjectAnswers => {
  const raw = JSON.parse(readFileSync(fixturePath, "utf-8")) as unknown;
  const validated = validateProjectAnswers(raw);
  if (typeof validated === "string") {
    throw new Error(`${fixturePath}: ${validated}`);
  }
  return validated;
};

const verifyFixture = async (
  fixturePath: string,
  prevCwd: string,
  versions: Versions,
): Promise<void> => {
  const fixtureName = path.basename(fixturePath);
  const answers = loadFixture(fixturePath);
  const tmpRoot = mkdtempSync(path.join(tmpdir(), "kickoff-scaffold-e2e-"));

  console.log(
    `\n→ ${fixtureName} (${answers.agentTooling}, scaffold into temp dir)`,
  );

  try {
    process.chdir(tmpRoot);
    const extras = await resolveExtraPackages({
      fetchMetadata: fetchFromNpm,
      names: answers.extraPackages,
    });
    if (extras.problems.length > 0) {
      throw new Error(`extra packages: ${extras.problems.join("; ")}`);
    }
    await generateProject(answers, {
      versions: { ...versions, ...extras.versions },
    });
    writeMinimalEnvLocal(tmpRoot, answers);

    console.log("  pnpm install");
    execSync("pnpm install", {
      cwd: tmpRoot,
      env: process.env,
      stdio: "inherit",
    });

    console.log("  pnpm next:agents-md");
    execSync("pnpm next:agents-md", {
      cwd: tmpRoot,
      env: process.env,
      stdio: "inherit",
    });
    if (
      !readFileSync(path.join(tmpRoot, "CLAUDE.md"), "utf-8").includes(
        NEXT_DOCS_INDEX_MARKER,
      )
    ) {
      throw new Error(
        "pnpm next:agents-md did not add the docs index to CLAUDE.md",
      );
    }

    for (const check of SCAFFOLD_CHECKS) {
      console.log(`  pnpm ${check}`);
      runInProject(tmpRoot, check);
    }

    verifyHandbookTooling(tmpRoot, answers);

    if (answers.includeContentful) {
      console.log("  skip build: next build needs a real Contentful space");
    } else {
      await smokeTestBuild(tmpRoot, answers);
    }

    console.log(`✔ ${fixtureName}`);
  } finally {
    process.chdir(prevCwd);
    rmSync(tmpRoot, { force: true, maxRetries: 3, recursive: true });
  }
};

const main = async () => {
  if (!existsSync(fixturesDir)) {
    console.error(`Missing fixtures directory: ${fixturesDir}`);
    process.exit(1);
  }

  const fixtures = readdirSync(fixturesDir)
    .filter((name) => name.endsWith(".json"))
    .filter(
      (name) =>
        ONLY_FIXTURES.length === 0 ||
        ONLY_FIXTURES.includes(name.replace(/\.json$/, "")),
    )
    .sort()
    .map((name) => path.join(fixturesDir, name));

  if (fixtures.length === 0) {
    console.error(`No JSON fixtures found in ${fixturesDir}`);
    process.exit(1);
  }

  const prevCwd = process.cwd();

  try {
    verifyHandbookCommand();

    const versions = await resolveVersions();

    for (const fixturePath of fixtures) {
      await verifyFixture(fixturePath, prevCwd, versions);
    }
  } catch (error) {
    console.error(
      "\n✖ Scaffold E2E failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }

  console.log(`\n✔ Scaffold E2E passed (${fixtures.length} fixture(s))\n`);
};

await main();
