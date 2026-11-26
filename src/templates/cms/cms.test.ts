import { describe, expect, it } from "vitest";
import { CMS_IDS, type ProjectAnswers } from "../../types.js";
import { DEFAULT_VERSIONS } from "../config.js";
import { getCms, usesCms } from "./index.js";

const answersFor = (cms: ProjectAnswers["cms"]) =>
  ({ cms }) as Pick<ProjectAnswers, "cms"> as ProjectAnswers;

const ADAPTERS = CMS_IDS.filter((id) => id !== "none").map((id) => {
  const cms = getCms(answersFor(id));

  if (!cms) {
    throw new Error(`no adapter for ${id}`);
  }

  return cms;
});

describe("CMS adapters", () => {
  it("has no adapter when content lives in code", () => {
    expect(getCms(answersFor("none"))).toBeUndefined();
    expect(usesCms(answersFor("none"))).toBe(false);
  });

  it.each(ADAPTERS)("$name meets the adapter contract", (cms) => {
    const files = new Map(cms.files());
    const envNames = cms.envExample.map((line) => line.split("=")[0]);

    expect(files.get(`${cms.dir}/getPages.ts`)).toMatch(
      /export const fetchPages[\s\S]*export const fetchPage\b/,
    );
    expect(cms.generatedTypesDir.startsWith(`${cms.dir}/`)).toBe(true);
    expect(cms.typesScript.command).toContain(cms.generatedTypesDir);
    expect(envNames).toContain(cms.previewSecretEnv);
    expect(cms.handbook.file).toMatch(/^[a-z-]+\.md$/);
    expect(
      [...cms.dependencies, ...cms.devDependencies].filter(
        (name) => !(name in DEFAULT_VERSIONS),
      ),
    ).toEqual([]);
  });
});
