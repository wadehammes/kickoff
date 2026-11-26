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
import { main } from "./index.js";

vi.mock("prompts", () => ({ default: vi.fn() }));

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit ${code}`);
  }
}

const fixture = (name: string) =>
  path.resolve(import.meta.dirname, "../fixtures/scaffold-e2e", name);

const answers = {
  addOns: [] as string[],
  agentTooling: "cursor",
  bgColor: "#ffffff",
  devPort: 4321,
  extraPackages: "",
  hosting: "vercel",
  primaryColor: "#000000",
  projectDescription: "",
  projectType: "marketing",
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

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString();

const stubRegistry = (published: Record<string, Record<string, number>>) => {
  const fetchMock = vi.fn(async (url: string | URL) => {
    const name = decodeURIComponent(
      String(url).replace("https://registry.npmjs.org/", ""),
    );
    const versions = published[name] ?? {};

    return new Response(
      JSON.stringify({
        time: Object.fromEntries(
          Object.entries(versions).map(([version, days]) => [
            version,
            daysAgo(days),
          ]),
        ),
        versions: Object.fromEntries(
          Object.keys(versions).map((version) => [version, {}]),
        ),
      }),
    );
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
};

const packageJson = () =>
  JSON.parse(readFileSync(path.join(root, "package.json"), "utf-8")) as {
    dependencies: Record<string, string>;
    scripts: Record<string, string>;
  };
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
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("offline");
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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
      values: Record<string, string>,
    ) => string | null;

    expect(pipeline("claude", { hosting: "vercel" })).toBe("confirm");
    expect(pipeline("claude", { hosting: "other" })).toBeNull();
    expect(pipeline("cursor", { hosting: "vercel" })).toBeNull();

    const hostingIndex = questions.findIndex((q) => q.name === "hosting");

    expect(question("hosting").type).toBe("select");
    expect(hostingIndex).toBeLessThan(
      questions.findIndex((q) => q.name === "includeClaudePipeline"),
    );
  });

  it("generates a project for another host without Vercel files", async () => {
    vi.mocked(prompts).mockResolvedValueOnce({ ...answers, hosting: "other" });

    expect(await run("--no-refresh")).toBeNull();
    expect(
      existsSync(
        path.join(root, "prompted-site", "scripts/verify-vercel-release.ts"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        path.join(root, "prompted-site", "src/components/DeployButton"),
      ),
    ).toBe(false);
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

  it("refreshes package versions within their major before generating", async () => {
    stubRegistry({
      "@next/codemod": { "16.4.6": 30, "16.9.0": 10 },
      next: { "16.4.3": 60, "16.9.0": 10, "16.10.0": 2, "17.0.0": 9 },
    });

    expect(await run("--answers", fixture("cursor-static.json"))).toBeNull();
    expect(packageJson().dependencies.next).toBe("^16.9.0");
    expect(packageJson().scripts["next:upgrade"]).toContain(
      "@next/codemod@16.9.0",
    );
    expect(output()).toContain("Updated 2 packages");
    expect(output()).toContain("next 17.0.0");
    expect(output()).toContain("--latest-majors");
  });

  it("moves to newer majors with --latest-majors", async () => {
    stubRegistry({ next: { "16.4.3": 60, "17.0.0": 9 } });

    expect(
      await run("--answers", fixture("cursor-static.json"), "--latest-majors"),
    ).toBeNull();
    expect(packageJson().dependencies.next).toBe("^17.0.0");
  });

  it("skips the refresh with --no-refresh and on a dry run", async () => {
    const fetchMock = stubRegistry({ next: { "16.9.0": 10 } });

    expect(
      await run("--answers", fixture("cursor-static.json"), "--no-refresh"),
    ).toBeNull();
    expect(packageJson().dependencies.next).toBe("^16.4.3");

    rmSync(root, { force: true, recursive: true });
    mkdirSync(root);

    expect(
      await run("--answers", fixture("cursor-static.json"), "--dry-run"),
    ).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the tested versions when npm can't be reached", async () => {
    expect(await run("--answers", fixture("cursor-static.json"))).toBeNull();
    expect(packageJson().dependencies.next).toBe("^16.4.3");
    expect(output()).toContain("Couldn't check");
    expect(output()).toContain("kickoff's tested versions");
  });

  it("turns the add-on checklist and extra packages into the project", async () => {
    stubRegistry({ clsx: { "2.1.1": 300 }, "date-fns": { "4.1.0": 30 } });
    vi.mocked(prompts).mockResolvedValueOnce({
      ...answers,
      addOns: ["includeForms", "includePlaywright"],
      extraPackages: "date-fns, clsx",
      projectDescription: "A site for testing kickoff.",
    });

    expect(await run()).toBeNull();

    const site = path.join(root, "prompted-site");
    const pkg = JSON.parse(
      readFileSync(path.join(site, "package.json"), "utf-8"),
    ) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(pkg.dependencies["react-hook-form"]).toBeDefined();
    expect(pkg.dependencies["date-fns"]).toBe("^4.1.0");
    expect(pkg.dependencies.clsx).toBe("^2.1.1");
    expect(pkg.dependencies.contentful).toBeUndefined();
    expect(pkg.devDependencies["@playwright/test"]).toBeDefined();
    expect(existsSync(path.join(site, "e2e/smoke.spec.ts"))).toBe(true);
    expect(readFileSync(path.join(site, "CLAUDE.md"), "utf-8")).toContain(
      "A site for testing kickoff.",
    );
  });

  it("pre-selects the add-ons recommended for the project type", async () => {
    vi.mocked(prompts).mockResolvedValueOnce({});
    await run();

    const [questions] = vi.mocked(prompts).mock.calls[0] as [
      {
        choices?: unknown;
        name: string;
      }[],
    ];
    const addOns = questions.find((q) => q.name === "addOns");

    if (!addOns) {
      throw new Error("no addOns question");
    }

    const choices = (
      addOns.choices as (
        previous: unknown,
        values: { projectType: string },
      ) => { selected: boolean; value: string }[]
    )("", { projectType: "careers" });

    expect(
      choices.filter((choice) => choice.selected).map((choice) => choice.value),
    ).toEqual([
      "includeI18n",
      "includeGA",
      "includeForms",
      "includePlaywright",
    ]);
    expect(questions.some((q) => q.name === "includeContentful")).toBe(false);
  });

  it("stops when an extra package can't be added", async () => {
    stubRegistry({});
    vi.mocked(prompts).mockResolvedValueOnce({
      ...answers,
      extraPackages: "not-a-real-package",
    });

    expect(await run()).toBe(1);
    expect(errors()).toContain("Couldn't add not-a-real-package");
  });

  it("leaves extra packages to pnpm when npm can't be reached", async () => {
    vi.mocked(prompts).mockResolvedValueOnce({
      ...answers,
      extraPackages: "date-fns",
    });

    expect(await run()).toBeNull();

    const pkg = JSON.parse(
      readFileSync(path.join(root, "prompted-site", "package.json"), "utf-8"),
    ) as { dependencies: Record<string, string> };

    expect(pkg.dependencies["date-fns"]).toBe("latest");
    expect(output()).toContain(
      "Couldn't reach npm to check date-fns; pnpm will pick its version at install",
    );
  });
});
