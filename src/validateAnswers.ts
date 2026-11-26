import { readFileSync } from "node:fs";
import { DEFAULT_VERSIONS } from "./templates/config.js";
import { PROJECT_TYPES, type ProjectAnswers } from "./types.js";

const REQUIRED_KEYS: (keyof ProjectAnswers)[] = [
  "agentTooling",
  "bgColor",
  "devPort",
  "includeClaudePipeline",
  "includeContentful",
  "includeGA",
  "includeI18n",
  "includeRecaptcha",
  "includeResend",
  "primaryColor",
  "prodUrl",
  "projectName",
  "siteName",
  "stagingUrl",
  "textColor",
  "useCurrentDir",
];

const OPTIONAL_KEYS: (keyof ProjectAnswers)[] = [
  "extraPackages",
  "hosting",
  "includeForms",
  "includePlaywright",
  "projectDescription",
  "projectType",
  "testRunner",
];

const NPM_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

const validateProfile = (
  o: Record<string, unknown>,
):
  | Pick<
      ProjectAnswers,
      | "extraPackages"
      | "includeForms"
      | "includePlaywright"
      | "projectDescription"
      | "projectType"
      | "testRunner"
    >
  | string => {
  const projectType = o.projectType ?? "marketing";

  if (!PROJECT_TYPES.includes(projectType as (typeof PROJECT_TYPES)[number])) {
    return `projectType must be one of ${PROJECT_TYPES.map((type) => `"${type}"`).join(", ")}`;
  }

  const projectDescription = o.projectDescription ?? "";

  if (typeof projectDescription !== "string") {
    return "projectDescription must be a string";
  }

  for (const key of ["includeForms", "includePlaywright"] as const) {
    if (o[key] !== undefined && typeof o[key] !== "boolean") {
      return `${key} must be a boolean`;
    }
  }

  const testRunner = o.testRunner ?? "jest";

  if (testRunner !== "jest" && testRunner !== "vitest") {
    return 'testRunner must be "jest" or "vitest"';
  }

  const extraPackages = o.extraPackages ?? [];

  if (
    !Array.isArray(extraPackages) ||
    !extraPackages.every(
      (name) => typeof name === "string" && NPM_NAME.test(name),
    )
  ) {
    return "extraPackages must be a list of npm package names";
  }

  const duplicate = extraPackages.find((name) => name in DEFAULT_VERSIONS);

  if (duplicate) {
    return `extraPackages already includes ${duplicate}; kickoff adds it`;
  }

  return {
    extraPackages,
    includeForms: o.includeForms === true,
    includePlaywright:
      o.includePlaywright === true || o.includeClaudePipeline === true,
    projectDescription: projectDescription.trim(),
    projectType: projectType as ProjectAnswers["projectType"],
    testRunner,
  };
};

/**
 * Validates a JSON value against ProjectAnswers (strict keys and types).
 * @returns The answers object, or an error message string.
 */
export const validateProjectAnswers = (
  data: unknown,
): ProjectAnswers | string => {
  if (typeof data !== "object" || data === null) {
    return "Answers must be a JSON object";
  }

  const o = data as Record<string, unknown>;

  for (const key of REQUIRED_KEYS) {
    if (!(key in o)) {
      return `Missing required field: ${key}`;
    }
  }

  for (const key of Object.keys(o)) {
    if (
      !REQUIRED_KEYS.includes(key as keyof ProjectAnswers) &&
      !OPTIONAL_KEYS.includes(key as keyof ProjectAnswers)
    ) {
      return `Unknown field: ${key}`;
    }
  }

  if (typeof o.projectName !== "string") {
    return "projectName must be a string";
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(o.projectName)) {
    return "projectName must be kebab-case (lowercase letters, numbers, hyphens only)";
  }

  if (typeof o.useCurrentDir !== "boolean") {
    return "useCurrentDir must be a boolean";
  }

  if (o.agentTooling !== "cursor" && o.agentTooling !== "claude") {
    return 'agentTooling must be "cursor" or "claude"';
  }

  if (typeof o.siteName !== "string" || o.siteName.trim().length === 0) {
    return "siteName must be a non-empty string";
  }

  for (const [label, key] of [
    ["prodUrl", "prodUrl"],
    ["stagingUrl", "stagingUrl"],
  ] as const) {
    const v = o[key];
    if (typeof v !== "string") {
      return `${label} must be a string`;
    }
    try {
      new URL(v);
    } catch {
      return `${label} must be a valid URL`;
    }
  }

  if (typeof o.devPort !== "number" || !Number.isInteger(o.devPort)) {
    return "devPort must be an integer";
  }
  if (o.devPort <= 0 || o.devPort >= 65536) {
    return "devPort must be between 1 and 65535";
  }

  for (const key of ["primaryColor", "bgColor", "textColor"] as const) {
    const v = o[key];
    if (typeof v !== "string") {
      return `${key} must be a string`;
    }
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) {
      return `${key} must be a valid hex color (e.g. #000000)`;
    }
  }

  for (const key of [
    "includeI18n",
    "includeContentful",
    "includeGA",
    "includeResend",
    "includeRecaptcha",
    "includeClaudePipeline",
  ] as const) {
    if (typeof o[key] !== "boolean") {
      return `${key} must be a boolean`;
    }
  }

  if (o.includeClaudePipeline && o.agentTooling !== "claude") {
    return 'includeClaudePipeline requires agentTooling "claude"';
  }

  const hosting = o.hosting ?? "vercel";

  if (hosting !== "vercel" && hosting !== "other") {
    return 'hosting must be "vercel" or "other"';
  }

  if (o.includeClaudePipeline && hosting !== "vercel") {
    return 'includeClaudePipeline requires hosting "vercel"';
  }

  const profile = validateProfile(o);

  if (typeof profile === "string") {
    return profile;
  }

  return { ...o, hosting, ...profile } as unknown as ProjectAnswers;
};

export const readAnswersFile = (
  answersPath: string,
): ProjectAnswers | string => {
  let raw: unknown;

  try {
    raw = JSON.parse(readFileSync(answersPath, "utf-8")) as unknown;
  } catch {
    return `Could not read or parse JSON from: ${answersPath}`;
  }

  const validated = validateProjectAnswers(raw);

  return typeof validated === "string"
    ? `Invalid answers: ${validated}`
    : validated;
};
