import { describe, expect, it } from "vitest";
import type { ProjectAnswers } from "../types.js";
import { DEFAULT_VERSIONS, getPackageJson } from "./config.js";
import {
  getProductionSmokeWorkflow,
  getStagingSmokeWorkflow,
} from "./github.js";

const answers = (overrides: Partial<ProjectAnswers> = {}): ProjectAnswers => ({
  extraPackages: [],
  hosting: "vercel",
  includeForms: false,
  includePlaywright: false,
  projectDescription: "",
  projectType: "marketing",
  agentTooling: "cursor",
  bgColor: "#ffffff",
  devPort: 3000,
  includeContentful: true,
  includeGA: false,
  includeI18n: false,
  includeRecaptcha: false,
  includeResend: false,
  primaryColor: "#000000",
  prodUrl: "https://example.com",
  projectName: "pkg-test",
  siteName: "Pkg Test",
  stagingUrl: "https://staging.example.com",
  textColor: "#000000",
  useCurrentDir: true,
  ...overrides,
});

type PkgJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  name: string;
  scripts?: Record<string, string>;
};

const parse = (a: ProjectAnswers): PkgJson =>
  JSON.parse(getPackageJson(a)) as PkgJson;

describe("getPackageJson", () => {
  it("includes Contentful packages and types script when includeContentful is true", () => {
    const pkg = parse(answers());
    expect(pkg.dependencies?.contentful).toBe("^11.12.10");
    expect(pkg.devDependencies?.["cf-content-types-generator"]).toBe("^3.0.1");
    expect(pkg.scripts?.["types:contentful"]).toContain(
      "cf-content-types-generator",
    );
  });

  it("omits Contentful packages and types script when includeContentful is false", () => {
    const pkg = parse(answers({ includeContentful: false }));
    expect(pkg.dependencies?.contentful).toBeUndefined();
    expect(pkg.devDependencies?.["cf-content-types-generator"]).toBeUndefined();
    expect(pkg.scripts?.["types:contentful"]).toBeUndefined();
  });

  it("adds next-intl when includeI18n is true", () => {
    const pkg = parse(answers({ includeI18n: true }));
    expect(pkg.dependencies?.["next-intl"]).toBe("^4.14.9");
  });

  it("adds resend when includeResend is true", () => {
    const pkg = parse(answers({ includeResend: true }));
    expect(pkg.dependencies?.resend).toBe("^6.35.0");
  });

  it("adds react-google-recaptcha and types when includeRecaptcha is true", () => {
    const pkg = parse(answers({ includeRecaptcha: true }));
    expect(pkg.dependencies?.["react-google-recaptcha"]).toBe("^3.1.0");
    expect(pkg.devDependencies?.["@types/react-google-recaptcha"]).toBe(
      "^2.1.9",
    );
  });

  it("sets package name from projectName", () => {
    const pkg = parse(answers({ projectName: "my-widget" }));
    expect(pkg.name).toBe("my-widget");
  });

  it("includes Base UI and omits react-aria", () => {
    const pkg = parse(answers());
    expect(pkg.dependencies?.["@base-ui/react"]).toBe("^1.9.0");
    expect(pkg.dependencies?.["react-aria"]).toBeUndefined();
    expect(pkg.devDependencies?.["@svgr/webpack"]).toBe("^8.1.0");
  });

  it("uses turbopack by default for dev scripts", () => {
    const pkg = parse(answers({ devPort: 3000 }));
    expect(pkg.scripts?.dev).toBe("next dev -p 3000");
    expect(pkg.scripts?.dev).not.toContain("--webpack");
  });

  it("includes full lint and knip scripts", () => {
    const pkg = parse(answers());
    expect(pkg.scripts?.["lint:check"]).toContain("origin/staging");
    expect(pkg.scripts?.["lint:all"]).toContain("knip:ci");
    expect(pkg.scripts?.knip).toBe("knip");
    expect(pkg.devDependencies?.knip).toBe("^6.43.0");
  });

  it("lists every package any option can add in DEFAULT_VERSIONS", () => {
    const everything = parse(
      answers({
        agentTooling: "claude",
        includeClaudePipeline: true,
        includeContentful: true,
        includeGA: true,
        includeI18n: true,
        includeRecaptcha: true,
        includeResend: true,
      }),
    );
    const names = [
      ...Object.keys(everything.dependencies ?? {}),
      ...Object.keys(everything.devDependencies ?? {}),
    ];

    expect(names.filter((name) => !(name in DEFAULT_VERSIONS))).toEqual([]);
  });

  it("uses the versions it is given, including the codemod and Vercel CLI pins", () => {
    const versions = {
      ...DEFAULT_VERSIONS,
      "@next/codemod": "16.9.0",
      next: "^16.9.0",
      vercel: "65.20.0",
    };
    const pipeline = answers({
      agentTooling: "claude",
      includeClaudePipeline: true,
    });
    const pkg = JSON.parse(getPackageJson(pipeline, versions)) as PkgJson;

    expect(pkg.dependencies?.next).toBe("^16.9.0");
    expect(pkg.scripts?.["next:upgrade"]).toContain("@next/codemod@16.9.0");
    expect(getStagingSmokeWorkflow(pipeline, versions)).toContain(
      "vercel@65.20.0",
    );
    expect(getProductionSmokeWorkflow(pipeline, versions)).toContain(
      "vercel@65.20.0",
    );
  });

  it("adds form libraries with the forms add-on", () => {
    const pkg = parse(answers({ includeForms: true }));

    expect(pkg.dependencies?.["react-hook-form"]).toBe("^7.92.0");
    expect(pkg.dependencies?.zod).toBe("^4.6.7");
    expect(pkg.dependencies?.["@hookform/resolvers"]).toBe("^7.0.7");
    expect(parse(answers()).dependencies?.zod).toBeUndefined();
  });

  it("adds Playwright without the pipeline when asked", () => {
    const pkg = parse(answers({ includePlaywright: true }));

    expect(pkg.devDependencies?.["@playwright/test"]).toBe("^1.65.0");
    expect(pkg.scripts?.["test:e2e"]).toBe("playwright test");
    expect(parse(answers()).scripts?.["test:e2e"]).toBeUndefined();
  });

  it("adds extra packages at their resolved versions", () => {
    const pkg = JSON.parse(
      getPackageJson(answers({ extraPackages: ["date-fns", "clsx"] }), {
        ...DEFAULT_VERSIONS,
        "date-fns": "^4.1.0",
      }),
    ) as PkgJson;

    expect(pkg.dependencies?.["date-fns"]).toBe("^4.1.0");
    expect(pkg.dependencies?.clsx).toBe("latest");
  });
});
