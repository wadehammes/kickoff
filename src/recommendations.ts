import type { ProjectAnswers, ProjectType } from "./types.js";

export type AddOnKey = keyof Pick<
  ProjectAnswers,
  | "includeContentful"
  | "includeForms"
  | "includeGA"
  | "includeI18n"
  | "includePlaywright"
  | "includeRecaptcha"
  | "includeResend"
>;

export const ADD_ONS: { description: string; key: AddOnKey; title: string }[] =
  [
    {
      description:
        "Contentful client, parsers, draft mode, and type generation",
      key: "includeContentful",
      title: "CMS (Contentful)",
    },
    {
      description: "English at / and Spanish at /es with next-intl",
      key: "includeI18n",
      title: "English and Spanish",
    },
    {
      description: "Google Analytics through @next/third-parties",
      key: "includeGA",
      title: "Analytics",
    },
    {
      description: "react-hook-form with zod schemas for validated forms",
      key: "includeForms",
      title: "Forms",
    },
    {
      description: "Resend for transactional email",
      key: "includeResend",
      title: "Email",
    },
    {
      description: "reCAPTCHA to keep bots off public forms",
      key: "includeRecaptcha",
      title: "reCAPTCHA",
    },
    {
      description: "Playwright smoke and accessibility tests in e2e/",
      key: "includePlaywright",
      title: "Browser tests",
    },
  ];

export const PROJECT_TYPE_CHOICES: {
  description: string;
  title: string;
  value: ProjectType;
}[] = [
  {
    description: "Product or company pages with a contact or signup form",
    title: "Marketing site",
    value: "marketing",
  },
  {
    description: "Job listings and role pages, often in more than one language",
    title: "Careers or landing page",
    value: "careers",
  },
  {
    description: "Articles or pages that editors manage in a CMS",
    title: "Content site or blog",
    value: "content",
  },
  {
    description: "Signed-in screens, forms, and email",
    title: "Web app",
    value: "app",
  },
];

const RECOMMENDED: Record<ProjectType, AddOnKey[]> = {
  app: ["includeForms", "includeResend", "includePlaywright"],
  careers: ["includeI18n", "includeGA", "includeForms", "includePlaywright"],
  content: ["includeContentful", "includeGA", "includePlaywright"],
  marketing: [
    "includeGA",
    "includeForms",
    "includeRecaptcha",
    "includePlaywright",
  ],
};

export const recommendedAddOns = (type: ProjectType): AddOnKey[] =>
  RECOMMENDED[type];
