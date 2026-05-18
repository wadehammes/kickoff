import { describe, expect, it } from "vitest";
import type { ProjectAnswers } from "../types.js";
import { getPackageJson } from "./config.js";

const answers = (overrides: Partial<ProjectAnswers> = {}): ProjectAnswers => ({
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
    expect(pkg.dependencies?.contentful).toBe("latest");
    expect(pkg.devDependencies?.["cf-content-types-generator"]).toBe("latest");
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
    expect(pkg.dependencies?.["next-intl"]).toBe("latest");
  });

  it("adds resend when includeResend is true", () => {
    const pkg = parse(answers({ includeResend: true }));
    expect(pkg.dependencies?.resend).toBe("latest");
  });

  it("adds react-google-recaptcha and types when includeRecaptcha is true", () => {
    const pkg = parse(answers({ includeRecaptcha: true }));
    expect(pkg.dependencies?.["react-google-recaptcha"]).toBe("latest");
    expect(pkg.devDependencies?.["@types/react-google-recaptcha"]).toBe(
      "latest",
    );
  });

  it("sets package name from projectName", () => {
    const pkg = parse(answers({ projectName: "my-widget" }));
    expect(pkg.name).toBe("my-widget");
  });
});
