import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import prompts from "prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runHandbookCommand } from "./command.js";

vi.mock("prompts", () => ({ default: vi.fn() }));

const fixture = (name: string) =>
  path.resolve(import.meta.dirname, "../../fixtures/scaffold-e2e", name);

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit ${code}`);
  }
}

let root: string;
let bin: string;
let stdout: string[];
let stderr: string[];
const originalPath = process.env.PATH;
const originalStdinTty = process.stdin.isTTY;
const originalStdoutTty = process.stdout.isTTY;

const output = () => stdout.join("\n");
const errors = () => stderr.join("\n");

const run = async (...args: string[]): Promise<number | null> => {
  try {
    await runHandbookCommand(args);
    return null;
  } catch (error) {
    if (error instanceof ExitError) {
      return error.code;
    }
    throw error;
  }
};

const writeRepoFile = (file: string, content: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), content);
};

const writeAgent = (name: string, body: string) => {
  const file = path.join(bin, name);
  writeFileSync(file, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(file, 0o755);
  return file;
};

const setTty = (value: boolean) => {
  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value,
  });
  Object.defineProperty(process.stdout, "isTTY", {
    configurable: true,
    value,
  });
};

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "kickoff-command-"));
  bin = mkdtempSync(path.join(tmpdir(), "kickoff-bin-"));
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
  setTty(false);
  vi.mocked(prompts).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env.PATH = originalPath;
  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value: originalStdinTty,
  });
  Object.defineProperty(process.stdout, "isTTY", {
    configurable: true,
    value: originalStdoutTty,
  });
  rmSync(root, { force: true, recursive: true });
  rmSync(bin, { force: true, recursive: true });
});

describe("kickoff handbook command", () => {
  it("prints help", async () => {
    expect(await run("--help")).toBe(0);
    expect(output()).toContain("Usage: kickoff handbook [options]");
    expect(output()).toContain("claude, codex, cursor, gemini");
  });

  it("rejects an unknown option", async () => {
    expect(await run("--bogus")).toBe(1);
    expect(errors()).toContain("Unknown option '--bogus'");
  });

  it("writes only kickoff's handbook from answers and lists links it can't satisfy", async () => {
    expect(
      await run("--dir", root, "--answers", fixture("claude-static.json")),
    ).toBeNull();
    expect(readdirSync(root)).toEqual(["docs"]);
    expect(readdirSync(path.join(root, "docs"))).toEqual(["handbook"]);
    expect(
      existsSync(path.join(root, "docs/handbook/non-negotiables.md")),
    ).toBe(true);
    expect(errors()).toContain("Wrote docs/handbook/ for E2E Claude Static.");
    expect(errors()).toContain("a full kickoff project has");
    expect(errors()).toContain("components.md: ../../src/app/layout.tsx");
  });

  it("refuses to overwrite a handbook unless forced", async () => {
    writeRepoFile("docs/handbook/README.md", "# Our handbook\n");

    expect(
      await run("--dir", root, "--answers", fixture("claude-static.json")),
    ).toBe(1);
    expect(errors()).toContain("already has files");
    expect(
      readFileSync(path.join(root, "docs/handbook/README.md"), "utf-8"),
    ).toBe("# Our handbook\n");

    expect(
      await run(
        "--dir",
        root,
        "--answers",
        fixture("claude-static.json"),
        "--force",
      ),
    ).toBeNull();
    expect(
      readFileSync(path.join(root, "docs/handbook/README.md"), "utf-8"),
    ).toContain("# E2E Claude Static handbook");
  });

  it("writes nothing on a dry run with answers", async () => {
    expect(
      await run(
        "--dir",
        root,
        "--answers",
        fixture("claude-static.json"),
        "--dry-run",
      ),
    ).toBeNull();
    expect(readdirSync(root)).toEqual([]);
    expect(output()).toContain("docs/handbook/llms.md");
    expect(errors()).toContain("Dry-run complete");
  });

  it("rejects --answers with --out or --agent", async () => {
    expect(
      await run("--answers", fixture("claude-static.json"), "--out", "x"),
    ).toBe(1);
    expect(
      await run(
        "--answers",
        fixture("claude-static.json"),
        "--agent",
        "claude",
      ),
    ).toBe(1);
    expect(errors()).toContain("drop --out and --agent");
  });

  it("reports an unreadable answers file", async () => {
    expect(
      await run("--dir", root, "--answers", path.join(root, "nope.json")),
    ).toBe(1);
    expect(errors()).toContain("Could not read or parse JSON from:");
  });

  it("stops when the folder has no code", async () => {
    expect(await run("--dir", root)).toBe(1);
    expect(errors()).toContain("No codebase found");
  });

  it("prints the prompt on a dry run and points at other handbooks", async () => {
    writeRepoFile("package.json", JSON.stringify({ name: "site" }));
    writeRepoFile("conventions/llms.md", "# Routing\n");

    expect(await run("--dir", root, "--dry-run")).toBeNull();
    expect(output()).toContain("# Build the handbook for site");
    expect(errors()).toContain("Found handbook-style docs in conventions/");
  });

  it("normalizes --out before looking for an existing handbook", async () => {
    writeRepoFile("package.json", JSON.stringify({ name: "site" }));
    writeRepoFile("docs/handbook/README.md", "# Handbook\n");

    expect(
      await run("--dir", root, "--out", "./docs//handbook/", "--dry-run"),
    ).toBeNull();
    expect(output()).toContain("`docs/handbook/` already has 1 pages");
    expect(errors()).toContain("updating 1 existing pages");
  });

  it("rejects --out outside the repo", async () => {
    writeRepoFile("package.json", "{}");

    expect(await run("--dir", root, "--out", "../elsewhere")).toBe(1);
    expect(await run("--dir", root, "--out", ".")).toBe(1);
    expect(errors()).toContain("--out must be a folder inside");
  });

  it("prints the prompt when output isn't a terminal or the agent is none", async () => {
    writeRepoFile("package.json", JSON.stringify({ name: "site" }));

    expect(await run("--dir", root)).toBeNull();
    expect(output()).toContain("# Build the handbook for site");

    stdout = [];
    setTty(true);

    expect(await run("--dir", root, "--agent", "none")).toBeNull();
    expect(output()).toContain("# Build the handbook for site");
    expect(prompts).not.toHaveBeenCalled();
  });

  it("prints the prompt instead of a menu when output is piped from a terminal", async () => {
    writeRepoFile("package.json", JSON.stringify({ name: "site" }));
    Object.defineProperty(process.stdin, "isTTY", {
      configurable: true,
      value: true,
    });

    expect(await run("--dir", root)).toBeNull();
    expect(prompts).not.toHaveBeenCalled();
    expect(output()).toContain("# Build the handbook for site");
  });

  it("starts the agent in the repo with the prompt and passes its exit code on", async () => {
    writeRepoFile("package.json", JSON.stringify({ name: "site" }));
    const record = path.join(bin, "record");
    const agent = writeAgent(
      "fake-agent",
      `pwd > "${record}"; printf '%s\\n' "$@" >> "${record}"; exit 3`,
    );

    expect(await run("--dir", root, "--agent", agent)).toBe(3);

    const [cwd, ...args] = readFileSync(record, "utf-8").split("\n");

    expect(cwd.endsWith(path.basename(root))).toBe(true);
    expect(args[0]).toBe("# Build the handbook for site");
  });

  it("passes a harness's flags before the prompt", async () => {
    writeRepoFile("package.json", JSON.stringify({ name: "site" }));
    const record = path.join(bin, "record");
    writeAgent("gemini", `printf '%s\\n' "$@" > "${record}"`);
    process.env.PATH = `${bin}${path.delimiter}${originalPath}`;

    expect(await run("--dir", root, "--agent", "gemini")).toBe(0);
    expect(readFileSync(record, "utf-8").split("\n").slice(0, 2)).toEqual([
      "-i",
      "# Build the handbook for site",
    ]);
  });

  it("fails when the agent is killed by a signal", async () => {
    writeRepoFile("package.json", "{}");
    const agent = writeAgent("killed-agent", "kill -TERM $$");

    expect(await run("--dir", root, "--agent", agent)).toBe(1);
    expect(errors()).toContain("stopped (SIGTERM)");
  });

  it("fails when the agent isn't installed", async () => {
    writeRepoFile("package.json", "{}");

    expect(
      await run("--dir", root, "--agent", path.join(bin, "missing-agent")),
    ).toBe(1);
    expect(errors()).toContain("Could not start");
  });

  it("offers the installed agents in a terminal", async () => {
    writeRepoFile("package.json", JSON.stringify({ name: "site" }));
    writeAgent("claude", "exit 0");
    process.env.PATH = bin;
    setTty(true);
    vi.mocked(prompts).mockResolvedValueOnce({ agent: "none" });

    expect(await run("--dir", root)).toBeNull();

    const [question] = vi.mocked(prompts).mock.calls[0] as [
      { choices: { title: string; value: string }[] },
    ];

    expect(question.choices).toEqual([
      { title: "Claude Code", value: "claude" },
      { title: "Print the prompt (use any other agent)", value: "none" },
    ]);
    expect(output()).toContain("# Build the handbook for site");
  });

  it("stops quietly when the agent choice is cancelled", async () => {
    writeRepoFile("package.json", "{}");
    setTty(true);
    vi.mocked(prompts).mockResolvedValueOnce({});

    expect(await run("--dir", root)).toBe(0);
    expect(errors()).toContain("Cancelled.");
  });

  it("summarizes a repo by language when no known libraries are found", async () => {
    writeRepoFile("go.mod", "module api\n");

    expect(await run("--dir", root, "--dry-run")).toBeNull();
    expect(errors()).toContain("files; Go");
  });
});
