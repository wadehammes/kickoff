import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateHandbook } from "../generator.js";
import type { ProjectAnswers } from "../types.js";
import { detectCodebase, looksLikeCodebase } from "./detect.js";
import { getHandbookBuildPrompt } from "./prompt.js";

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

    await generateHandbook(answers, root);

    expect(readdirSync(root)).toEqual(["docs"]);
    expect(readdirSync(path.join(root, "docs"))).toEqual(["handbook"]);
    expect(readdirSync(path.join(root, "docs/handbook"))).toContain(
      "non-negotiables.md",
    );
  });
});
