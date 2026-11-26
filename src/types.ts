export type AgentTooling = "cursor" | "claude";

export type Hosting = "vercel" | "other";

export type TestRunner = "jest" | "vitest";

export const CMS_IDS = ["none", "contentful", "prismic"] as const;

/** Content source for pages. "none" keeps all content in code. */
export type Cms = (typeof CMS_IDS)[number];

export const PROJECT_TYPES = [
  "marketing",
  "careers",
  "content",
  "app",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export interface ProjectAnswers {
  projectName: string;
  useCurrentDir: boolean;
  /** Cursor (.cursor/) or Claude Code (.claude/) agent hooks for handbook enforcement. */
  agentTooling: AgentTooling;
  /**
   * Hands-off Claude → GitHub → Vercel pipeline (requires agentTooling "claude"):
   * trunk-based CI on main, Claude workflows + review gate, auto-merge, CODEOWNERS,
   * Playwright preview/production checks with automatic rollback.
   */
  includeClaudePipeline: boolean;
  /**
   * Where the site is deployed. "vercel" adds the Vercel deploy page, release
   * checks, and env vars; "other" leaves them out. Defaults to "vercel" when an
   * answers file omits it.
   */
  hosting: Hosting;
  /** What the site is for; drives the recommended add-ons. Defaults to "marketing". */
  projectType: ProjectType;
  /** One or two sentences about the project, written into CLAUDE.md and the handbook. */
  projectDescription: string;
  /** react-hook-form + zod for validated forms. */
  includeForms: boolean;
  /** Playwright smoke and accessibility tests in e2e/ (always on with the Claude pipeline). */
  includePlaywright: boolean;
  /** Unit test runner for specs and page objects. Defaults to "jest". */
  testRunner: TestRunner;
  /** Extra npm packages to add, pinned to their newest release that is at least 7 days old. */
  extraPackages: string[];
  siteName: string;
  prodUrl: string;
  stagingUrl: string;
  devPort: number;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  includeI18n: boolean;
  /** Where page content comes from. Defaults to "none" (content lives in code). */
  cms: Cms;
  includeGA: boolean;
  includeResend: boolean;
  includeRecaptcha: boolean;
}
