import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import prompts from "prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main } from "./index.js";
import type { ProjectAnswers } from "./types.js";

vi.mock("prompts", () => ({ default: vi.fn() }));

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit ${code}`);
  }
}

const fixture = (name: string) =>
  path.resolve(import.meta.dirname, "../fixtures/scaffold-e2e", name);

const answers: Omit<ProjectAnswers, "includeClaudePipeline"> = {
  agentTooling: "cursor",
  bgColor: "#ffffff",
  devPort: 4321,
  includeContentful: false,
  includeGA: false,
  includeI18n: false,
  includeRecaptcha: false,
  includeResend: false,
  primaryColor: "#000000",
  prodUrl: "https://example.com",
  projectName: "prompted-site",
  siteName: "Prompted Site",
  stagingUrl: "https://staging.example.com",
  textColor: "#000000",
  useCurrentDir: false,
};

let root: string;
let stdout: string[];
let stderr: string[];
const previousCwd = process.cwd();
const previousArgv = process.argv;

const output = () => stdout.join("\n");
const errors = () => stderr.join("\n");

const run = async (...args: string[]): Promise<number | null> => {
  process.argv = ["node", "kickoff", ...args];

  try {
    await main();
    return null;
  } catch (error) {
    if (error instanceof ExitError) {
      return error.code;
    }
    throw error;
  }
};

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "kickoff-cli-"));
  process.chdir(root);
  stdout = [];
  stderr = [];
  vi.spyOn(console, "log").mockImplementation((...parts) => {
    stdout.push(parts.join(" "));
  });
  vi.spyOn(console, "error").mockImplementation((...parts) => {
    stderr.push(parts.join(" "));
  });
  vi.spyOn(process, "exit").mockImplementation((code) => {
    throw new ExitError(Number(code ?? 0));
  });
  vi.mocked(prompts).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  process.argv = previousArgv;
  process.chdir(previousCwd);
  chmodSync(root, 0o755);
  rmSync(root, { force: true, recursive: true });
});

describe("kickoff CLI", () => {
  it("prints help, including the handbook command", async () => {
    expect(await run("--help")).toBe(0);
    expect(output()).toContain("Usage: kickoff [options]");
    expect(output()).toContain("kickoff handbook --answers ./answers.json");
  });

  it("hands the handbook subcommand its own arguments", async () => {
    expect(await run("handbook", "--help")).toBe(0);
    expect(output()).toContain("Usage: kickoff handbook [options]");
  });

  it("generates a project from an answers file and prints next steps", async () => {
    expect(await run("--answers", fixture("cursor-contentful-all.json"))).toBe(
      null,
    );
    expect(existsSync(path.join(root, "package.json"))).toBe(true);
    expect(output()).toContain("Project scaffolded successfully!");
    expect(output()).toContain("Fill in your Contentful API keys");
    expect(output()).toContain("pnpm types:contentful");
  });

  it("reports invalid answers", async () => {
    writeFileSync(path.join(root, "bad.json"), JSON.stringify({ a: 1 }));

    expect(await run("--answers", "bad.json")).toBe(1);
    expect(errors()).toContain("Invalid answers: Missing required field");
  });

  it("refuses a non-empty folder from an answers file unless forced", async () => {
    writeFileSync(path.join(root, "keep.txt"), "x");

    expect(await run("--answers", fixture("claude-static.json"))).toBe(1);
    expect(errors()).toContain("Target directory is not empty");

    expect(
      await run("--answers", fixture("claude-static.json"), "--force"),
    ).toBeNull();
    expect(output()).toContain("--force:");
    expect(existsSync(path.join(root, "keep.txt"))).toBe(true);
    expect(existsSync(path.join(root, "package.json"))).toBe(true);
  });

  it("lists files without writing on a dry run", async () => {
    expect(
      await run("--answers", fixture("claude-static.json"), "--dry-run"),
    ).toBeNull();
    expect(output()).toContain("docs/handbook/non-negotiables.md");
    expect(output()).toContain("Dry-run complete");
    expect(readdirSync(root)).toEqual([]);
  });

  it("generates into a new folder from prompts", async () => {
    vi.mocked(prompts).mockResolvedValueOnce(answers);

    expect(await run()).toBeNull();
    expect(
      existsSync(path.join(root, "prompted-site", "docs/handbook/llms.md")),
    ).toBe(true);
    expect(output()).toContain("cd prompted-site");
    expect(output()).toContain("Fill in .env.local");
    expect(output()).toContain("starts on port 4321");
  });

  it("stops when the prompts are cancelled", async () => {
    vi.mocked(prompts).mockResolvedValueOnce({});

    expect(await run()).toBe(0);
    expect(output()).toContain("Scaffolding cancelled.");
  });

  it("rejects prompted answers that don't validate", async () => {
    vi.mocked(prompts).mockResolvedValueOnce({ ...answers, devPort: 0 });

    expect(await run()).toBe(1);
    expect(errors()).toContain("devPort must be between 1 and 65535");
  });

  it("asks before writing into a non-empty folder", async () => {
    mkdirSync(path.join(root, "prompted-site"));
    writeFileSync(path.join(root, "prompted-site", "keep.txt"), "x");
    vi.mocked(prompts)
      .mockResolvedValueOnce(answers)
      .mockResolvedValueOnce({ proceed: false });

    expect(await run()).toBe(0);
    expect(readdirSync(path.join(root, "prompted-site"))).toEqual(["keep.txt"]);

    vi.mocked(prompts)
      .mockResolvedValueOnce(answers)
      .mockResolvedValueOnce({ proceed: true });

    expect(await run()).toBeNull();
    expect(existsSync(path.join(root, "prompted-site", "package.json"))).toBe(
      true,
    );
  });

  it("reports a failure to write the project", async () => {
    chmodSync(root, 0o500);

    expect(await run("--answers", fixture("cursor-static.json"))).toBe(1);
    expect(errors()).toContain("Error generating project:");
  });
  it("runs the handbook subcommand to completion", async () => {
    expect(
      await run("handbook", "--answers", fixture("claude-static.json")),
    ).toBeNull();
    expect(existsSync(path.join(root, "docs/handbook/llms.md"))).toBe(true);
  });

  it("validates each prompted answer as it's typed", async () => {
    vi.mocked(prompts).mockResolvedValueOnce({});
    await run();

    type Question = {
      name: string;
      type: unknown;
      validate?: (value: never) => true | string;
    };
    const [questions] = vi.mocked(prompts).mock.calls[0] as [Question[]];
    const question = (name: string) => {
      const found = questions.find((q) => q.name === name);

      if (!found) {
        throw new Error(`no question named ${name}`);
      }

      return found;
    };
    const check = (name: string, value: string | number) =>
      question(name).validate?.(value as never);

    expect(check("projectName", "my-site")).toBe(true);
    expect(check("projectName", "My Site")).toContain("kebab-case");
    expect(check("siteName", "Site")).toBe(true);
    expect(check("siteName", "  ")).toBe("Site name is required");
    expect(check("prodUrl", "https://example.com")).toBe(true);
    expect(check("prodUrl", "example")).toBe("Must be a valid URL");
    expect(check("stagingUrl", "https://staging.example.com")).toBe(true);
    expect(check("stagingUrl", "staging")).toBe("Must be a valid URL");
    expect(check("devPort", 3000)).toBe(true);
    expect(check("devPort", 70000)).toBe("Must be a valid port number");
    for (const color of ["primaryColor", "bgColor", "textColor"]) {
      expect(check(color, "#abc")).toBe(true);
      expect(check(color, "blue")).toContain("Must be a valid hex color");
    }

    const pipeline = question("includeClaudePipeline").type as (
      previous: string,
    ) => string | null;

    expect(pipeline("claude")).toBe("confirm");
    expect(pipeline("cursor")).toBeNull();
  });

  it("stops when the prompts are cancelled with Ctrl+C", async () => {
    vi.mocked(prompts).mockImplementationOnce((async (
      _questions: unknown,
      options?: { onCancel?: () => void },
    ) => {
      options?.onCancel?.();
      return {};
    }) as unknown as typeof prompts);

    expect(await run()).toBe(0);
    expect(output()).toContain("Scaffolding cancelled.");
  });
});
