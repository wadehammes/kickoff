import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ProjectAnswers } from "./types.js";
import { readAnswersFile, validateProjectAnswers } from "./validateAnswers.js";

const valid: ProjectAnswers = {
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
  projectName: "my-site",
  siteName: "My Site",
  stagingUrl: "https://staging.example.com",
  textColor: "#000000",
  useCurrentDir: false,
};

describe("validateAnswers", () => {
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

  it("accepts includeClaudePipeline with Claude tooling", () => {
    const r = validateProjectAnswers({
      ...valid,
      agentTooling: "claude",
      includeClaudePipeline: true,
    });
    expect(typeof r).toBe("object");
  });

  it("rejects includeClaudePipeline without Claude tooling", () => {
    expect(
      typeof validateProjectAnswers({ ...valid, includeClaudePipeline: true }),
    ).toBe("string");
  });

  it("rejects bad URL", () => {
    expect(
      typeof validateProjectAnswers({ ...valid, prodUrl: "not-a-url" }),
    ).toBe("string");
  });

  it.each([
    [{ projectName: 7 }, "projectName must be a string"],
    [{ useCurrentDir: "yes" }, "useCurrentDir must be a boolean"],
    [{ siteName: "  " }, "siteName must be a non-empty string"],
    [{ stagingUrl: 3 }, "stagingUrl must be a string"],
    [{ stagingUrl: "nope" }, "stagingUrl must be a valid URL"],
    [{ devPort: 30.5 }, "devPort must be an integer"],
    [{ devPort: "3000" }, "devPort must be an integer"],
    [{ devPort: 0 }, "devPort must be between 1 and 65535"],
    [{ devPort: 65536 }, "devPort must be between 1 and 65535"],
    [{ primaryColor: 1 }, "primaryColor must be a string"],
    [{ bgColor: "white" }, "bgColor must be a valid hex color (e.g. #000000)"],
    [
      { textColor: "#12345" },
      "textColor must be a valid hex color (e.g. #000000)",
    ],
    [{ includeGA: "false" }, "includeGA must be a boolean"],
    [{ includeClaudePipeline: 1 }, "includeClaudePipeline must be a boolean"],
  ])("rejects %o with %s", (override, message) => {
    expect(validateProjectAnswers({ ...valid, ...override })).toBe(message);
  });

  it("accepts three-digit hex colors", () => {
    expect(typeof validateProjectAnswers({ ...valid, bgColor: "#fff" })).toBe(
      "object",
    );
  });

  it("reads and validates an answers file", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "kickoff-answers-"));
    const good = path.join(dir, "good.json");
    const invalid = path.join(dir, "invalid.json");
    const broken = path.join(dir, "broken.json");

    writeFileSync(good, JSON.stringify(valid));
    writeFileSync(invalid, JSON.stringify({ ...valid, devPort: 0 }));
    writeFileSync(broken, "{ not json");

    expect(readAnswersFile(good)).toEqual(valid);
    expect(readAnswersFile(invalid)).toBe(
      "Invalid answers: devPort must be between 1 and 65535",
    );
    expect(readAnswersFile(broken)).toBe(
      `Could not read or parse JSON from: ${broken}`,
    );
    expect(readAnswersFile(path.join(dir, "missing.json"))).toBe(
      `Could not read or parse JSON from: ${path.join(dir, "missing.json")}`,
    );

    rmSync(dir, { force: true, recursive: true });
  });
});
