import type { ProjectAnswers } from "./types.js";

const REQUIRED_KEYS: (keyof ProjectAnswers)[] = [
  "agentTooling",
  "bgColor",
  "devPort",
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
    if (!REQUIRED_KEYS.includes(key as keyof ProjectAnswers)) {
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
  ] as const) {
    if (typeof o[key] !== "boolean") {
      return `${key} must be a boolean`;
    }
  }

  return o as unknown as ProjectAnswers;
};
