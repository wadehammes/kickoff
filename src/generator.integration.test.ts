import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateProject } from "./generator.js";
import type { ProjectAnswers } from "./types.js";

const baseAnswers = (
  overrides: Partial<ProjectAnswers> = {},
): ProjectAnswers => ({
  agentTooling: "cursor",
  bgColor: "#ffffff",
  devPort: 3000,
  includeClaudePipeline: false,
  includeContentful: true,
  includeGA: false,
  includeI18n: false,
  includeRecaptcha: false,
  includeResend: false,
  primaryColor: "#000000",
  prodUrl: "https://example.com",
  projectName: "test-site",
  siteName: "Test Site",
  stagingUrl: "https://staging.example.com",
  textColor: "#000000",
  useCurrentDir: true,
  ...overrides,
});

let testPrevCwd: string | undefined;
let testTmpDir: string | undefined;

afterEach(() => {
  if (testPrevCwd !== undefined && testTmpDir !== undefined) {
    process.chdir(testPrevCwd);
    rmSync(testTmpDir, { force: true, maxRetries: 3, recursive: true });
    testPrevCwd = undefined;
    testTmpDir = undefined;
  }
});

const runInTemp = async (answers: ProjectAnswers): Promise<string> => {
  testPrevCwd = process.cwd();
  testTmpDir = mkdtempSync(path.join(tmpdir(), "kickoff-gen-"));
  process.chdir(testTmpDir);
  await generateProject(answers);
  return testTmpDir;
};

describe("generateProject", () => {
  it("writes a Contentful scaffold with CMS routes and dependencies", async () => {
    const root = await runInTemp(baseAnswers({ projectName: "with-cms" }));
    expect(existsSync(path.join(root, "package.json"))).toBe(true);
    expect(existsSync(path.join(root, "next.config.ts"))).toBe(true);
    expect(existsSync(path.join(root, "src/app/layout.tsx"))).toBe(true);
    expect(existsSync(path.join(root, "src/contentful/client.ts"))).toBe(true);
    expect(existsSync(path.join(root, "src/app/api/draft/route.ts"))).toBe(
      true,
    );

    const pkg = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf-8"),
    ) as { dependencies?: Record<string, string>; name: string };
    expect(pkg.name).toBe("with-cms");
    expect(pkg.dependencies?.contentful).toBe("latest");
  });

  it("omits Contentful when includeContentful is false", async () => {
    const root = await runInTemp(
      baseAnswers({ includeContentful: false, projectName: "static-site" }),
    );
    expect(existsSync(path.join(root, "package.json"))).toBe(true);
    expect(existsSync(path.join(root, "src/contentful/client.ts"))).toBe(false);
    expect(existsSync(path.join(root, "src/app/api/draft/route.ts"))).toBe(
      false,
    );

    const pkg = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf-8"),
    ) as { dependencies?: Record<string, string>; name: string };
    expect(pkg.name).toBe("static-site");
    expect(pkg.dependencies?.contentful).toBeUndefined();
  });

  it("adds i18n routes when includeI18n is true", async () => {
    const root = await runInTemp(
      baseAnswers({ includeI18n: true, projectName: "i18n-site" }),
    );
    expect(existsSync(path.join(root, "src/i18n/routing.ts"))).toBe(true);
    expect(existsSync(path.join(root, "src/app/[locale]/layout.tsx"))).toBe(
      true,
    );

    const pkg = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf-8"),
    ) as { dependencies?: Record<string, string>; name: string };
    expect(pkg.dependencies?.["next-intl"]).toBe("latest");
  });

  it("adds Google Analytics wiring when includeGA is true", async () => {
    const root = await runInTemp(
      baseAnswers({ includeGA: true, projectName: "ga-site" }),
    );
    const layout = readFileSync(path.join(root, "src/app/layout.tsx"), "utf-8");
    expect(layout).toContain("@next/third-parties/google");
    expect(layout).toContain("GoogleAnalytics");
    const env = readFileSync(path.join(root, ".env.local.example"), "utf-8");
    expect(env).toContain("GA_MEASUREMENT_ID");
  });

  it("adds Resend env and dependency when includeResend is true", async () => {
    const root = await runInTemp(
      baseAnswers({ includeResend: true, projectName: "resend-site" }),
    );
    const env = readFileSync(path.join(root, ".env.local.example"), "utf-8");
    expect(env).toContain("RESEND_API_KEY");
    const pkg = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf-8"),
    ) as { dependencies?: Record<string, string> };
    expect(pkg.dependencies?.resend).toBe("latest");
  });

  it("adds reCAPTCHA env and packages when includeRecaptcha is true", async () => {
    const root = await runInTemp(
      baseAnswers({ includeRecaptcha: true, projectName: "captcha-site" }),
    );
    const env = readFileSync(path.join(root, ".env.local.example"), "utf-8");
    expect(env).toContain("RECAPTCHA_SITE_KEY");
    const pkg = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf-8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.["react-google-recaptcha"]).toBe("latest");
    expect(pkg.devDependencies?.["@types/react-google-recaptcha"]).toBe(
      "latest",
    );
  });

  it("generates Cursor agent hooks when agentTooling is cursor", async () => {
    const root = await runInTemp(
      baseAnswers({ agentTooling: "cursor", projectName: "cursor-site" }),
    );
    expect(existsSync(path.join(root, ".cursor/hooks.json"))).toBe(true);
    expect(existsSync(path.join(root, ".cursor/rules/handbook.mdc"))).toBe(
      true,
    );
    expect(existsSync(path.join(root, ".claude/settings.json"))).toBe(false);
  });

  it("generates Claude Code agent hooks when agentTooling is claude", async () => {
    const root = await runInTemp(
      baseAnswers({ agentTooling: "claude", projectName: "claude-site" }),
    );
    expect(existsSync(path.join(root, ".claude/settings.json"))).toBe(true);
    expect(
      existsSync(path.join(root, ".claude/hooks/block-added-comments.sh")),
    ).toBe(true);
    expect(existsSync(path.join(root, ".cursor/hooks.json"))).toBe(false);
  });

  it("keeps server-only secrets out of next.config env", async () => {
    const root = await runInTemp(
      baseAnswers({
        includeRecaptcha: true,
        includeResend: true,
        projectName: "secret-site",
      }),
    );
    const nextConfig = readFileSync(path.join(root, "next.config.ts"), "utf-8");
    for (const secret of [
      "VERCEL_API_TOKEN",
      "RESEND_API_KEY",
      "RECAPTCHA_SECRET_KEY",
      "CONTENTFUL_PREVIEW_API_KEY",
      "CONTENTFUL_PREVIEW_SECRET",
    ]) {
      expect(nextConfig).not.toContain(secret);
    }
    expect(nextConfig).toContain("RECAPTCHA_SITE_KEY");
  });

  it("pins dependency resolution to releases at least 7 days old", async () => {
    const root = await runInTemp(baseAnswers({ projectName: "age-site" }));
    const workspace = readFileSync(
      path.join(root, "pnpm-workspace.yaml"),
      "utf-8",
    );
    expect(workspace).toContain("minimumReleaseAge: 10080");
  });

  it("keeps the staging release flow when includeClaudePipeline is false", async () => {
    const root = await runInTemp(
      baseAnswers({ agentTooling: "claude", projectName: "staging-site" }),
    );
    const ci = readFileSync(
      path.join(root, ".github/workflows/ci.yml"),
      "utf-8",
    );
    expect(ci).toContain("- staging");
    expect(existsSync(path.join(root, ".github/workflows/release.yml"))).toBe(
      true,
    );
    expect(existsSync(path.join(root, ".github/CODEOWNERS"))).toBe(false);
    expect(existsSync(path.join(root, "playwright.config.ts"))).toBe(false);
    const settings = JSON.parse(
      readFileSync(path.join(root, ".claude/settings.json"), "utf-8"),
    ) as { permissions?: unknown };
    expect(settings.permissions).toBeUndefined();
  });

  it("generates the hands-off pipeline when includeClaudePipeline is true", async () => {
    const root = await runInTemp(
      baseAnswers({
        agentTooling: "claude",
        includeClaudePipeline: true,
        projectName: "pipeline-site",
      }),
    );

    for (const file of [
      ".github/workflows/claude.yml",
      ".github/workflows/claude-review.yml",
      ".github/workflows/auto-merge.yml",
      ".github/workflows/preview-e2e.yml",
      ".github/workflows/production-smoke.yml",
      ".github/CODEOWNERS",
      ".github/pull_request_template.md",
      ".claude/hooks/quality-gate.sh",
      "playwright.config.ts",
      "e2e/smoke.spec.ts",
    ]) {
      expect(existsSync(path.join(root, file)), file).toBe(true);
    }
    for (const file of [
      ".github/workflows/release.yml",
      "scripts/verify-vercel-release.ts",
      "scripts/verify-vercel-for-release.sh",
    ]) {
      expect(existsSync(path.join(root, file)), file).toBe(false);
    }

    const ci = readFileSync(
      path.join(root, ".github/workflows/ci.yml"),
      "utf-8",
    );
    expect(ci).toContain("- main");
    expect(ci).not.toContain("- staging");

    const review = readFileSync(
      path.join(root, ".github/workflows/claude-review.yml"),
      "utf-8",
    );
    expect(review).toContain("--json-schema");
    expect(review).toContain("steps.review.outputs.structured_output");

    const smoke = readFileSync(
      path.join(root, ".github/workflows/production-smoke.yml"),
      "utf-8",
    );
    expect(smoke).toContain("BASE_URL: https://example.com");
    expect(smoke).toContain("rollback");

    const pkg = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf-8"),
    ) as {
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["test:e2e"]).toBe("playwright test");
    expect(pkg.scripts.typecheck).toBeDefined();
    expect(pkg.scripts["lint:check"]).toContain("origin/main");
    expect(pkg.devDependencies["@playwright/test"]).toBeDefined();

    const settings = JSON.parse(
      readFileSync(path.join(root, ".claude/settings.json"), "utf-8"),
    ) as {
      hooks: { Stop: { hooks: { command: string }[] }[] };
      permissions: { deny: string[] };
    };
    expect(settings.permissions.deny).toContain("Edit(./.github/**)");
    expect(
      settings.hooks.Stop.map((entry) => entry.hooks[0]?.command),
    ).toContain(".claude/hooks/quality-gate.sh");

    const claudeMd = readFileSync(path.join(root, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("Hands-off pipeline");
    const platform = readFileSync(
      path.join(root, "docs/handbook/platform.md"),
      "utf-8",
    );
    expect(platform).toContain("Hands-off Claude pipeline");
    expect(platform).not.toContain("make release");
  });

  it("generates knip config, svg mock, and CI knip step", async () => {
    const root = await runInTemp(baseAnswers({ projectName: "knip-site" }));
    const knip = JSON.parse(
      readFileSync(path.join(root, "knip.json"), "utf-8"),
    ) as {
      ignore: string[];
      ignoreDependencies: string[];
    };

    expect(knip.ignore).toContain("scripts/**");
    expect(knip.ignoreDependencies).toEqual(
      expect.arrayContaining(["@svgr/webpack", "jest-mock"]),
    );
    expect(existsSync(path.join(root, "src/tests/mocks/svgMock.tsx"))).toBe(
      true,
    );

    const ci = readFileSync(
      path.join(root, ".github/workflows/ci.yml"),
      "utf-8",
    );
    expect(ci).toContain("pnpm knip:ci");
  });

  it("dry-run does not write any files", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const prev = process.cwd();
    const dir = mkdtempSync(path.join(tmpdir(), "kickoff-dry-"));
    try {
      process.chdir(dir);
      await generateProject(baseAnswers({ projectName: "dry-site" }), {
        dryRun: true,
      });
      expect(readdirSync(dir).length).toBe(0);
    } finally {
      logSpy.mockRestore();
      process.chdir(prev);
      rmSync(dir, { force: true, maxRetries: 3, recursive: true });
    }
  });
});
