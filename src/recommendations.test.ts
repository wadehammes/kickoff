import { describe, expect, it } from "vitest";
import { ADD_ONS, recommendedAddOns } from "./recommendations.js";
import { PROJECT_TYPES } from "./types.js";

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
      "includeContentful",
      "includeGA",
      "includePlaywright",
    ]);
    expect(recommendedAddOns("app")).toEqual([
      "includeForms",
      "includeResend",
      "includePlaywright",
    ]);
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
