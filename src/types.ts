export interface ProjectAnswers {
  projectName: string;
  useCurrentDir: boolean;
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
