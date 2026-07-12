import { execSync } from "node:child_process";
import {
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
import type { ProjectAnswers } from "./types.js";
import { validateProjectAnswers } from "./validateAnswers.js";

const SCAFFOLD_CHECKS = ["tsc:ci", "lint:ci", "lint:css", "test:ci"] as const;

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
): Promise<void> => {
  const fixtureName = path.basename(fixturePath);
  const answers = loadFixture(fixturePath);
  const tmpRoot = mkdtempSync(path.join(tmpdir(), "kickoff-scaffold-e2e-"));

  console.log(
    `\n→ ${fixtureName} (${answers.agentTooling}, scaffold into temp dir)`,
  );

  try {
    process.chdir(tmpRoot);
    await generateProject(answers);
    writeMinimalEnvLocal(tmpRoot, answers);

    console.log("  pnpm install");
    execSync("pnpm install", {
      cwd: tmpRoot,
      env: process.env,
      stdio: "inherit",
    });

    for (const check of SCAFFOLD_CHECKS) {
      console.log(`  pnpm ${check}`);
      runInProject(tmpRoot, check);
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
    .sort()
    .map((name) => path.join(fixturesDir, name));

  if (fixtures.length === 0) {
    console.error(`No JSON fixtures found in ${fixturesDir}`);
    process.exit(1);
  }

  const prevCwd = process.cwd();

  try {
    for (const fixturePath of fixtures) {
      await verifyFixture(fixturePath, prevCwd);
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
