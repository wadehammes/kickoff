export type AgentTooling = "cursor" | "claude";

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
  siteName: string;
  prodUrl: string;
  stagingUrl: string;
  devPort: number;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  includeI18n: boolean;
  /** When false, omits Contentful client, getters, draft routes, and CMS handbook. */
  includeContentful: boolean;
  includeGA: boolean;
  includeResend: boolean;
  includeRecaptcha: boolean;
}
