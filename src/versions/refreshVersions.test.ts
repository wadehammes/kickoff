import { describe, expect, it, vi } from "vitest";
import {
  type PackageMetadata,
  pickVersions,
  refreshVersions,
  resolveExtraPackages,
} from "./refreshVersions.js";

const NOW = new Date("2026-11-25T00:00:00Z");
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 86_400_000).toISOString();

const metadata = (
  published: Record<string, number>,
  deprecated: string[] = [],
): PackageMetadata => ({
  time: Object.fromEntries(
    Object.entries(published).map(([version, days]) => [
      version,
      daysAgo(days),
    ]),
  ),
  versions: Object.fromEntries(
    Object.keys(published).map((version) => [
      version,
      deprecated.includes(version) ? { deprecated: "do not use" } : {},
    ]),
  ),
});

describe("refreshVersions", () => {
  it("picks the newest stable version in range that is at least a week old", () => {
    const next = metadata({
      "16.4.3": 30,
      "16.4.6": 10,
      "16.5.0": 3,
      "16.6.0-canary.1": 20,
      "17.0.0": 9,
    });

    expect(pickVersions(next, "^16.4.3", NOW)).toEqual({
      inRange: "16.4.6",
      newerMajor: "17.0.0",
    });
  });

  it("skips deprecated versions", () => {
    const pkg = metadata({ "2.1.0": 40, "2.2.0": 20 }, ["2.2.0"]);

    expect(pickVersions(pkg, "^2.1.0", NOW).inRange).toBe("2.1.0");
  });

  it("follows npm caret rules below 1.0.0", () => {
    const zeroMinor = metadata({ "0.4.1": 40, "0.4.9": 20, "0.5.0": 20 });
    const zeroZero = metadata({ "0.0.1": 40, "0.0.2": 20, "0.1.0": 20 });

    expect(pickVersions(zeroMinor, "^0.4.1", NOW)).toEqual({
      inRange: "0.4.9",
      newerMajor: "0.5.0",
    });
    expect(pickVersions(zeroZero, "^0.0.1", NOW)).toEqual({
      inRange: "0.0.1",
      newerMajor: "0.1.0",
    });
  });

  it("treats an exact version as the floor of its major", () => {
    const vercel = metadata({ "65.14.0": 30, "65.16.2": 8, "66.0.0": 8 });

    expect(pickVersions(vercel, "65.14.0", NOW)).toEqual({
      inRange: "65.16.2",
      newerMajor: "66.0.0",
    });
  });

  it("moves a prerelease range to the first stable release of that major", () => {
    const stylelint = metadata({
      "17.9.0": 90,
      "18.0.0-next.0": 60,
      "18.0.0": 14,
      "18.1.0": 2,
    });

    expect(pickVersions(stylelint, "^18.0.0-next.0", NOW)).toEqual({
      inRange: "18.0.0",
      newerMajor: null,
    });
  });

  it("keeps the current version when nothing newer is old enough", () => {
    const pkg = metadata({ "1.0.0": 400, "1.0.1": 1 });

    expect(pickVersions(pkg, "^1.0.0", NOW)).toEqual({
      inRange: "1.0.0",
      newerMajor: null,
    });
  });

  it("refreshes ranges and pins, keeps their style, and reports newer majors", async () => {
    const registry: Record<string, PackageMetadata> = {
      next: metadata({ "16.4.3": 30, "16.4.6": 10, "17.0.0": 9 }),
      react: metadata({ "19.3.1": 30 }),
      vercel: metadata({ "65.14.0": 30, "65.16.2": 8 }),
    };
    const fetchMetadata = vi.fn(async (name: string) => registry[name]);

    const result = await refreshVersions({
      fetchMetadata,
      now: NOW,
      versions: { next: "^16.4.3", react: "^19.3.1", vercel: "65.14.0" },
    });

    expect(result.versions).toEqual({
      next: "^16.4.6",
      react: "^19.3.1",
      vercel: "65.16.2",
    });
    expect(result.updated).toEqual([
      { from: "^16.4.3", name: "next", to: "^16.4.6" },
      { from: "65.14.0", name: "vercel", to: "65.16.2" },
    ]);
    expect(result.newerMajors).toEqual([
      { available: "17.0.0", current: "^16.4.6", name: "next" },
    ]);
    expect(result.failed).toEqual([]);
  });

  it("applies newer majors when asked", async () => {
    const result = await refreshVersions({
      fetchMetadata: async () =>
        metadata({ "16.4.3": 30, "17.0.0": 9, "17.1.0": 8 }),
      includeMajors: true,
      now: NOW,
      versions: { next: "^16.4.3" },
    });

    expect(result.versions).toEqual({ next: "^17.1.0" });
    expect(result.newerMajors).toEqual([]);
  });

  it("leaves packages it is told to keep and falls back when the registry fails", async () => {
    const fetchMetadata = vi.fn(async (name: string) => {
      if (name === "next") {
        throw new Error("network down");
      }

      return metadata({ "2.6.6": 30, "2.7.0": 20 });
    });

    const result = await refreshVersions({
      fetchMetadata,
      keep: ["@biomejs/biome"],
      now: NOW,
      versions: { "@biomejs/biome": "2.6.6", next: "^16.4.3" },
    });

    expect(fetchMetadata).not.toHaveBeenCalledWith("@biomejs/biome");
    expect(result.versions).toEqual({
      "@biomejs/biome": "2.6.6",
      next: "^16.4.3",
    });
    expect(result.failed).toEqual(["next: network down"]);
  });

  it("pins extra packages to their newest release that is a week old", async () => {
    const registry: Record<string, PackageMetadata> = {
      clsx: metadata({ "2.1.1": 300 }),
      "date-fns": metadata({ "3.6.0": 400, "4.1.0": 30, "4.2.0": 2 }),
      fresh: metadata({ "1.0.0": 1 }),
    };

    const result = await resolveExtraPackages({
      fetchMetadata: async (name) => {
        if (!registry[name]) {
          throw new Error("registry returned 404");
        }

        return registry[name];
      },
      names: ["date-fns", "clsx", "fresh", "not-a-real-package"],
      now: NOW,
    });

    expect(result.versions).toEqual({ clsx: "^2.1.1", "date-fns": "^4.1.0" });
    expect(result.problems).toEqual([
      "fresh: no release is at least 7 days old yet",
      "not-a-real-package: registry returned 404",
    ]);
  });
});
