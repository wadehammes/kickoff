import { execFileSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateHandbook } from "../generator.js";
import type { ProjectAnswers } from "../types.js";
import { detectCodebase, looksLikeCodebase } from "./detect.js";
import { getHandbookBuildPrompt } from "./prompt.js";

const answers: ProjectAnswers = {
  agentTooling: "claude",
  bgColor: "#ffffff",
  devPort: 3000,
  includeClaudePipeline: false,
  includeContentful: false,
  includeGA: false,
  includeI18n: false,
  includeRecaptcha: false,
  includeResend: false,
  primaryColor: "#000000",
  prodUrl: "https://example.com",
  projectName: "handbook-only",
  siteName: "Handbook Only",
  stagingUrl: "https://staging.example.com",
  textColor: "#000000",
  useCurrentDir: false,
};

let root: string;

const writeRepoFile = (file: string, content: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), content);
};

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "kickoff-handbook-"));
});

afterEach(() => {
  rmSync(root, { force: true, recursive: true });
});

describe("kickoff handbook", () => {
  it("detects the stack, scripts, and docs of a nested frontend", () => {
    writeRepoFile("pyproject.toml", "[project]\nname = 'api'\n");
    writeRepoFile(
      "web/package.json",
      JSON.stringify({
        dependencies: { "@tanstack/react-query": "5", react: "19" },
        devDependencies: { vitest: "4" },
        name: "web",
        scripts: { lint: "biome check", test: "vitest" },
      }),
    );
    writeRepoFile("web/pnpm-lock.yaml", "");
    writeRepoFile("web/nx.json", "{}");
    writeRepoFile("web/src/App.tsx", "export const App = () => null;\n");
    writeRepoFile("AGENTS.md", "# Agents\n");
    writeRepoFile("conventions/frontend/llms.md", "# Routing\n");

    const facts = detectCodebase(root, "docs/handbook");

    expect(facts.languages).toEqual(["JavaScript", "Python"]);
    expect(facts.stack).toEqual(["React", "Vitest", "TanStack Query"]);
    expect(facts.packageManagers).toEqual(["pnpm (web/)"]);
    expect(facts.workspace).toEqual(["Nx (web/)"]);
    expect(facts.scriptsFrom).toBe("web/package.json");
    expect(facts.scripts).toEqual(["lint", "test"]);
    expect(facts.agentDocs).toEqual(
      expect.arrayContaining(["AGENTS.md", "conventions/frontend/llms.md"]),
    );
    expect(facts.otherHandbooks).toEqual(["conventions/frontend"]);
    expect(facts.existingHandbookPages).toBe(0);
  });

  it("asks the agent to update a handbook that already exists", () => {
    writeRepoFile("package.json", JSON.stringify({ name: "site" }));
    writeRepoFile("docs/handbook/README.md", "# Handbook\n");

    const prompt = getHandbookBuildPrompt(
      detectCodebase(root, "docs/handbook"),
      "docs/handbook",
    );

    expect(prompt).toContain("# Build the handbook for site");
    expect(prompt).toContain("## This repo already has a handbook");
    expect(prompt).toContain("`non-negotiables.md`");
    expect(prompt).toContain("Only write files under `docs/handbook/`");
  });

  it("only treats folders with code as a codebase", () => {
    expect(looksLikeCodebase(root)).toBe(false);

    writeRepoFile("api/go.mod", "module api\n");

    expect(looksLikeCodebase(root)).toBe(true);
  });

  it("writes only docs/handbook from answers", async () => {
    await generateHandbook(answers, root);

    expect(readdirSync(root)).toEqual(["docs"]);
    expect(readdirSync(path.join(root, "docs"))).toEqual(["handbook"]);
    expect(readdirSync(path.join(root, "docs/handbook"))).toContain(
      "non-negotiables.md",
    );
  });
  it("skips dependency, build, and unreadable folders when it has to walk the tree", () => {
    writeRepoFile("package.json", JSON.stringify({ name: "walked" }));
    writeRepoFile("src/index.ts", "export {};\n");
    writeRepoFile("node_modules/react/package.json", "{}");
    writeRepoFile(".venv/lib/site.py", "");
    writeRepoFile("target/debug/app", "");
    writeRepoFile("locked/secret.ts", "");
    chmodSync(path.join(root, "locked"), 0o000);

    const facts = detectCodebase(root, "docs/handbook");

    chmodSync(path.join(root, "locked"), 0o755);

    expect(facts.fileCount).toBe(2);
    expect(facts.topLevelDirs).toEqual([{ dir: "src", files: 1 }]);
    expect(facts.defaultBranch).toBeNull();
  });

  it("lists tracked and untracked files from git, minus ignored ones", () => {
    execFileSync("git", ["init", "-q"], { cwd: root });
    writeRepoFile(".gitignore", "generated/\n");
    writeRepoFile("package.json", JSON.stringify({ name: "tracked" }));
    writeRepoFile("generated/out.ts", "");

    expect(detectCodebase(root, "docs/handbook").fileCount).toBe(2);
  });

  it("reads scripts from the shallowest package.json that has any, and survives bad JSON", () => {
    writeRepoFile("package.json", "{ not json");
    writeRepoFile(
      "apps/web/package.json",
      JSON.stringify({ scripts: { deep: "x" } }),
    );
    writeRepoFile(
      "web/package.json",
      JSON.stringify({ scripts: { dev: "y" } }),
    );
    writeRepoFile("yarn.lock", "");

    const facts = detectCodebase(root, "docs/handbook");

    expect(facts.name).toBe(path.basename(root));
    expect(facts.scriptsFrom).toBe("web/package.json");
    expect(facts.scripts).toEqual(["dev"]);
    expect(facts.packageManagers).toEqual(["yarn"]);
  });

  it("notes package.json workspaces", () => {
    writeRepoFile(
      "package.json",
      JSON.stringify({ name: "mono", workspaces: ["packages/*"] }),
    );
    writeRepoFile("bun.lock", "");

    const facts = detectCodebase(root, "docs/handbook");

    expect(facts.workspace).toEqual(["package.json workspaces"]);
    expect(facts.packageManagers).toEqual(["bun"]);
  });

  it("fills empty facts with plain placeholders in the prompt", () => {
    writeRepoFile("go.mod", "module api\n");

    const prompt = getHandbookBuildPrompt(
      detectCodebase(root, "handbook"),
      "handbook",
    );

    expect(prompt).toContain("- Libraries and tools: none found");
    expect(prompt).toContain("- Package manager: not detected");
    expect(prompt).toContain("- Workspace: single package");
    expect(prompt).toContain("- Scripts: none found");
    expect(prompt).toContain("- Largest top-level folders: none");
    expect(prompt).toContain("- Default branch: not detected");
    expect(prompt).toContain("to fold in");
    expect(prompt).toContain("\n- none found\n");
    expect(prompt).toContain("## Start a new handbook");
    expect(prompt).not.toContain("handbook-style docs");
  });

  it("tells the agent about other handbooks when starting a new one", () => {
    writeRepoFile(
      "package.json",
      JSON.stringify({ name: "site", scripts: { build: "next build" } }),
    );
    writeRepoFile("conventions/frontend/llms.md", "# Routing\n");

    const prompt = getHandbookBuildPrompt(
      detectCodebase(root, "docs/handbook"),
      "docs/handbook",
    );

    expect(prompt).toContain(
      "The repo already has handbook-style docs in `conventions/frontend/`.",
    );
    expect(prompt).toContain("- Scripts (from `package.json`): `build`");
  });

  it("logs each handbook page when verbose", async () => {
    const lines: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((line) => {
      lines.push(String(line));
    });

    await generateHandbook(answers, root, { verbose: true });
    spy.mockRestore();

    expect(lines).toContain("wrote docs/handbook/non-negotiables.md");
  });
});
