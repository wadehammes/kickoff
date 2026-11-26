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

  it("tells the maintainer how to approve the staged version", () => {
    expect(read("scripts/watch-release.sh")).toContain("npm stage approve");
  });
});
