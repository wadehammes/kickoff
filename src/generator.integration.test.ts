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
  bgColor: "#ffffff",
  devPort: 3000,
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
