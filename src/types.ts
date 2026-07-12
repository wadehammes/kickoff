export type AgentTooling = "cursor" | "claude";

export interface ProjectAnswers {
  projectName: string;
  useCurrentDir: boolean;
  /** Cursor (.cursor/) or Claude Code (.claude/) agent hooks for handbook enforcement. */
  agentTooling: AgentTooling;
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
