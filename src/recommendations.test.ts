import { describe, expect, it } from "vitest";
import {
  ADD_ONS,
  CMS_CHOICES,
  recommendedAddOns,
  recommendedCms,
} from "./recommendations.js";
import { CMS_IDS, PROJECT_TYPES } from "./types.js";

describe("recommendations", () => {
  it("recommends add-ons that fit each kind of project", () => {
    expect(recommendedAddOns("marketing")).toEqual([
      "includeGA",
      "includeForms",
      "includeRecaptcha",
      "includePlaywright",
    ]);
    expect(recommendedAddOns("careers")).toEqual([
      "includeI18n",
      "includeGA",
      "includeForms",
      "includePlaywright",
    ]);
    expect(recommendedAddOns("content")).toEqual([
      "includeGA",
      "includePlaywright",
    ]);
    expect(recommendedAddOns("app")).toEqual([
      "includeForms",
      "includeResend",
      "includePlaywright",
    ]);
  });

  it("recommends a CMS only for content sites", () => {
    expect(recommendedCms("content")).toBe("contentful");

    for (const type of ["marketing", "careers", "app"] as const) {
      expect(recommendedCms(type)).toBe("none");
    }
  });

  it("offers every CMS kickoff supports", () => {
    expect(CMS_CHOICES.map((choice) => choice.value)).toEqual([...CMS_IDS]);
  });

  it("only recommends add-ons the checklist offers", () => {
    const offered = ADD_ONS.map((addOn) => addOn.key);

    for (const type of PROJECT_TYPES) {
      expect(
        recommendedAddOns(type).filter((key) => !offered.includes(key)),
      ).toEqual([]);
    }
  });
});
