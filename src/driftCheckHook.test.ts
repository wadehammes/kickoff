import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  collectFindings,
  findBrokenLinks,
  headingSlugs,
} from "../scaffold-assets/claude-hooks/handbook-drift-check.mjs";
import { getHandbookDriftCheckMjs } from "./templates/agents.js";
import { contentful } from "./templates/cms/contentful.js";
import { prismic } from "./templates/cms/prismic.js";

const hook = path.resolve(
  import.meta.dirname,
  "../scaffold-assets/claude-hooks/handbook-drift-check.mjs",
);

let root: string;
const previousCwd = process.cwd();

const write = (file: string, content: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), content);
};

const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: root, stdio: "ignore" });

const commitAll = () => {
  git("add", "-A");
  git(
    "-c",
    "user.email=test@example.com",
    "-c",
    "user.name=Test",
    "commit",
    "-qm",
    "base",
  );
};

const runHook = (input: string, hookPath = hook) =>
  spawnSync("node", [hookPath], {
    cwd: root,
    encoding: "utf-8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    input,
  });

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "kickoff-drift-"));
  git("init", "-q");
  write("package.json", JSON.stringify({ scripts: { lint: "biome check" } }));
  write("docs/handbook/README.md", "# Handbook\n\n## Pages\n");
  write("src/app/page.tsx", "export default () => null;\n");
  commitAll();
  process.chdir(root);
});

afterEach(() => {
  process.chdir(previousCwd);
  rmSync(root, { force: true, recursive: true });
});

describe("handbook drift-check hook", () => {
  it("slugs headings outside every kind of code fence", () => {
    write(
      "fences.md",
      [
        "# Real `code` heading!",
        "````md",
        "```",
        "# inside four backticks",
        "```",
        "````",
        "## After",
        "~~~",
        "# inside tildes",
        "~~~",
        "  ```sh",
        "# inside an indented fence",
        "  ```",
        "### End",
      ].join("\n"),
    );

    expect([...headingSlugs("fences.md")]).toEqual([
      "real-code-heading",
      "after",
      "end",
    ]);
  });

  it("reports missing files and headings but skips URLs, anchors, and fenced links", () => {
    write(
      "docs/handbook/llms.md",
      [
        "[ok](README.md#pages)",
        "[gone](missing.md)",
        "[bad anchor](README.md#nope)",
        "[site](https://example.com)",
        "[mail](mailto:a@example.com)",
        "[here](#top)",
        "```",
        "[fenced](not-checked.md)",
        "```",
      ].join("\n"),
    );

    expect(findBrokenLinks(["docs/handbook/llms.md"])).toEqual([
      "docs/handbook/llms.md: missing.md (file does not exist)",
      "docs/handbook/llms.md: README.md#nope (no such heading)",
    ]);
  });

  it("checks the handbook, README, and CLAUDE.md by default", () => {
    write("README.md", "[x](nowhere.md)\n");
    write("CLAUDE.md", "[y](docs/handbook/README.md#pages)\n");

    expect(findBrokenLinks()).toEqual([
      "README.md: nowhere.md (file does not exist)",
    ]);
  });

  it("finds nothing when the tree is clean", () => {
    expect(collectFindings()).toEqual([]);
  });

  it("asks for a handbook update when code or config changed without one", () => {
    write("src/app/page.tsx", "export default () => 1;\n");
    write(".github/workflows/ci.yml", "on: push\n");

    const [finding] = collectFindings();

    expect(finding).toContain(
      "This session changed code or config but no handbook chapter.",
    );
    expect(finding).toContain("Changed code:\nsrc/app/page.tsx");
    expect(finding).toContain("Changed config/ops");
    expect(finding).toContain(".github/workflows/ci.yml");
  });

  it("is satisfied when the handbook changed too", () => {
    write("src/app/page.tsx", "export default () => 1;\n");
    write("docs/handbook/README.md", "# Handbook\n\n## Pages\n\nUpdated.\n");

    expect(collectFindings()).toEqual([]);
  });

  it("ignores copy changes", () => {
    write("src/copy/home.ts", "export const home = {};\n");

    expect(collectFindings()).toEqual([]);
  });

  it("flags docs that name scripts package.json doesn't have", () => {
    write(
      "docs/handbook/platform.md",
      "Run `pnpm lint`, `pnpm install`, and `pnpm ship:it`.\n\n```sh\npnpm deploy\n```\n",
    );

    const [finding] = collectFindings();

    expect(finding).toContain(
      "Docs reference pnpm scripts that no longer exist",
    );
    expect(finding).toContain(
      "docs/handbook/platform.md: `pnpm deploy` is not a script in package.json",
    );
    expect(finding).toContain("`pnpm ship:it`");
    expect(finding).not.toContain("`pnpm lint`");
    expect(finding).not.toContain("`pnpm install`");
  });

  it("flags broken links among the findings", () => {
    write("docs/handbook/README.md", "# Handbook\n\n[gone](gone.md)\n");

    expect(collectFindings()[0]).toContain(
      "docs/handbook/README.md: gone.md (file does not exist)",
    );
  });

  it("never reminds about a CMS in projects without one", () => {
    write("src/contentful/getPages.ts", "export const getPages = 1;\n");
    write(".env.local", "CONTENTFUL_SPACE_ID=x\n");

    expect(collectFindings().join("\n")).not.toContain("This session touched");
  });

  it.each([contentful, prismic])(
    "reminds about $name changes only when env is set up",
    async (cms) => {
      const built = path.join(
        mkdtempSync(path.join(tmpdir(), "kickoff-drift-hook-")),
        "handbook-drift-check.mjs",
      );
      writeFileSync(built, getHandbookDriftCheckMjs(cms));
      const { collectFindings: collectCmsFindings } = (await import(built)) as {
        collectFindings: () => string[];
      };

      write(`${cms.dir}/getPages.ts`, "export const getPages = 1;\n");
      write(`docs/handbook/${cms.handbook.file}`, `# ${cms.name}\n`);

      expect(collectCmsFindings()).toEqual([]);

      write(".env.local", "SECRET=x\n");

      expect(collectCmsFindings()).toContain(cms.docs.driftReminder);
    },
  );

  it("asks to grep for paths that moved or were deleted", () => {
    renameSync(
      path.join(root, "src/app/page.tsx"),
      path.join(root, "src/app/home.tsx"),
    );
    write("docs/handbook/README.md", "# Handbook\n\n## Pages\n\nMoved.\n");

    const findings = collectFindings().join("\n");

    expect(findings).toContain("This session renamed or deleted files.");
    expect(findings).toContain(
      "dead link and a wrong instruction behind:\nsrc/app/page.tsx",
    );
  });

  it("blocks the stop with every finding when run as a hook", () => {
    write("docs/handbook/README.md", "# Handbook\n\n[gone](gone.md)\n");

    const result = runHook("{}");
    const output = JSON.parse(result.stdout) as {
      decision: string;
      reason: string;
    };

    expect(result.status).toBe(0);
    expect(output.decision).toBe("block");
    expect(output.reason).toContain("Handbook-drift check:");
    expect(output.reason).toContain("gone.md (file does not exist)");
    expect(output.reason).toContain("Routing: docs/handbook/llms.md.");
  });

  it("stays quiet on a clean tree, on a repeat stop, and on unreadable input", () => {
    expect(runHook("{}").stdout).toBe("");

    write("docs/handbook/README.md", "# Handbook\n\n[gone](gone.md)\n");

    expect(runHook(JSON.stringify({ stop_hook_active: true })).stdout).toBe("");
    expect(runHook("not json").stdout).toContain('"decision":"block"');
  });

  it("runs when reached through a symlink", () => {
    write("docs/handbook/README.md", "# Handbook\n\n[gone](gone.md)\n");
    const linkDir = mkdtempSync(path.join(tmpdir(), "kickoff-hook-link-"));
    symlinkSync(path.dirname(hook), path.join(linkDir, "hooks"));

    const result = runHook(
      "{}",
      path.join(linkDir, "hooks", path.basename(hook)),
    );

    rmSync(linkDir, { force: true, recursive: true });

    expect(result.stdout).toContain('"decision":"block"');
  });
});
