import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
  readFileSync(path.resolve(import.meta.dirname, "..", file), "utf-8");

describe("kickoff's release", () => {
  it("stages the npm version for a maintainer to approve instead of publishing it", () => {
    const workflow = read(".github/workflows/release.yml");

    expect(workflow).toContain("npm stage publish");
    expect(workflow).not.toMatch(/^\s*npm publish\b/m);
  });

  it("installs a pinned npm that has npm stage before staging", () => {
    const workflow = read(".github/workflows/release.yml");
    const install = workflow.search(/npm install -g npm@\d+\.\d+\.\d+\b/);

    expect(install).toBeGreaterThan(-1);
    expect(install).toBeLessThan(workflow.indexOf("npm stage publish"));
  });

  it("tells the maintainer how to approve the staged version", () => {
    expect(read("scripts/watch-release.sh")).toContain("npm stage approve");
  });

  it("follows the run for the tagged commit, not an older run of the same tag", () => {
    expect(read("scripts/watch-release.sh")).toMatch(
      /gh run list[^\n]*--commit "\$\{sha\}"/,
    );
  });
});
