import { describe, expect, it } from "vitest";
import type { ProjectAnswers } from "./types.js";
import { validateProjectAnswers } from "./validateAnswers.js";

const valid: ProjectAnswers = {
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
  projectName: "my-site",
  siteName: "My Site",
  stagingUrl: "https://staging.example.com",
  textColor: "#000000",
  useCurrentDir: false,
};

describe("validateProjectAnswers", () => {
  it("accepts a valid object", () => {
    const r = validateProjectAnswers(valid);
    expect(typeof r).toBe("object");
    expect((r as ProjectAnswers).projectName).toBe("my-site");
  });

  it("rejects non-objects", () => {
    expect(typeof validateProjectAnswers(null)).toBe("string");
    expect(typeof validateProjectAnswers("x")).toBe("string");
  });

  it("rejects missing keys", () => {
    const { projectName: _, ...rest } = valid;
    expect(typeof validateProjectAnswers(rest)).toBe("string");
  });

  it("rejects unknown keys", () => {
    expect(typeof validateProjectAnswers({ ...valid, extra: true })).toBe(
      "string",
    );
  });

  it("rejects bad projectName", () => {
    expect(
      typeof validateProjectAnswers({ ...valid, projectName: "Bad_Name" }),
    ).toBe("string");
  });

  it("rejects bad agentTooling", () => {
    expect(
      typeof validateProjectAnswers({ ...valid, agentTooling: "codex" }),
    ).toBe("string");
  });

  it("rejects bad URL", () => {
    expect(
      typeof validateProjectAnswers({ ...valid, prodUrl: "not-a-url" }),
    ).toBe("string");
  });
});
