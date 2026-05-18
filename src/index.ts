#!/usr/bin/env node
import chalk from "chalk";
import prompts from "prompts";
import { generateProject } from "./generator.js";
import type { ProjectAnswers } from "./types.js";

const banner = `
${chalk.cyan("🚀 kickoff")} ${chalk.white("—")} ${chalk.gray("Next.js + TypeScript project scaffolder")}
`;

async function main() {
  console.log(banner);

  const answers = await prompts(
    [
      {
        initial: "my-new-site",
        message:
          "Project name (kebab-case, used for folder + package.json name):",
        name: "projectName",
        type: "text",
        validate: (value: string) => {
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
            return "Must be kebab-case (lowercase letters, numbers, and hyphens only)";
          }
          return true;
        },
      },
      {
        type: "confirm",
        name: "useCurrentDir",
        message: `Scaffold into the current directory (${process.cwd()}) instead of a new subfolder?`,
        initial: false,
      },
      {
        initial: "My New Site",
        message: 'Site display name (e.g. "After Avenue"):',
        name: "siteName",
        type: "text",
        validate: (value: string) =>
          value.trim().length > 0 ? true : "Site name is required",
      },
      {
        initial: "https://www.mysite.com",
        message: "Production URL (e.g. https://www.mysite.com):",
        name: "prodUrl",
        type: "text",
        validate: (value: string) => {
          try {
            new URL(value);
            return true;
          } catch {
            return "Must be a valid URL";
          }
        },
      },
      {
        initial: "https://staging.mysite.com",
        message: "Staging URL (e.g. https://staging.mysite.com):",
        name: "stagingUrl",
        type: "text",
        validate: (value: string) => {
          try {
            new URL(value);
            return true;
          } catch {
            return "Must be a valid URL";
          }
        },
      },
      {
        initial: 3000,
        message: "Dev server port:",
        name: "devPort",
        type: "number",
        validate: (value: number) =>
          value > 0 && value < 65536 ? true : "Must be a valid port number",
      },
      {
        initial: "#000000",
        message: "Primary color hex (used in CSS variables):",
        name: "primaryColor",
        type: "text",
        validate: (value: string) =>
          /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
            ? true
            : "Must be a valid hex color (e.g. #000000)",
      },
      {
        initial: "#ffffff",
        message: "Background color hex:",
        name: "bgColor",
        type: "text",
        validate: (value: string) =>
          /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
            ? true
            : "Must be a valid hex color (e.g. #ffffff)",
      },
      {
        initial: "#000000",
        message: "Text color hex:",
        name: "textColor",
        type: "text",
        validate: (value: string) =>
          /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
            ? true
            : "Must be a valid hex color (e.g. #000000)",
      },
      {
        initial: true,
        message: `Include ${chalk.cyan("Contentful")} CMS? ${chalk.dim("(no = static / API-only; skips CMS layer, draft routes, types codegen)")}`,
        name: "includeContentful",
        type: "confirm",
      },
      {
        initial: false,
        message: "Include i18n (next-intl)?",
        name: "includeI18n",
        type: "confirm",
      },
      {
        initial: false,
        message: "Include Google Analytics?",
        name: "includeGA",
        type: "confirm",
      },
      {
        initial: false,
        message: "Include Resend email?",
        name: "includeResend",
        type: "confirm",
      },
      {
        initial: false,
        message: "Include reCAPTCHA?",
        name: "includeRecaptcha",
        type: "confirm",
      },
    ],
    {
      onCancel: () => {
        console.log(chalk.yellow("\n⚠  Scaffolding cancelled."));
        process.exit(0);
      },
    },
  );

  // If prompts were cancelled mid-way (all fields not filled), bail out.
  if (!answers.projectName) {
    console.log(chalk.yellow("\n⚠  Scaffolding cancelled."));
    process.exit(0);
  }

  const projectAnswers = answers as ProjectAnswers;

  const destination = projectAnswers.useCurrentDir
    ? "the current directory"
    : `./${projectAnswers.projectName}/`;

  console.log(
    `\n${chalk.cyan("→")} Generating ${chalk.bold(projectAnswers.siteName)} into ${chalk.bold(destination)} ...\n`,
  );

  try {
    await generateProject(projectAnswers);

    console.log(
      `\n${chalk.green("✔")} ${chalk.bold("Project scaffolded successfully!")}\n`,
    );
    console.log(chalk.white("Next steps:\n"));

    let step = 1;

    if (!projectAnswers.useCurrentDir) {
      console.log(
        `  ${chalk.cyan(`${step++}.`)} ${chalk.white(`cd ${projectAnswers.projectName}`)}`,
      );
    }

    console.log(
      `  ${chalk.cyan(`${step++}.`)} ${chalk.white("cp .env.local.example .env.local")}`,
    );
    if (projectAnswers.includeContentful) {
      console.log(
        `  ${chalk.cyan(`${step++}.`)} ${chalk.white("Fill in your Contentful API keys and other env vars in .env.local")}`,
      );
    } else {
      console.log(
        `  ${chalk.cyan(`${step++}.`)} ${chalk.white("Fill in .env.local (see .env.local.example)")}`,
      );
    }
    console.log(`  ${chalk.cyan(`${step++}.`)} ${chalk.white("pnpm install")}`);
    if (projectAnswers.includeContentful) {
      console.log(
        `  ${chalk.cyan(`${step++}.`)} ${chalk.white("pnpm types:contentful")}  ${chalk.gray("# generate Contentful TypeScript types")}`,
      );
    }
    console.log(
      `  ${chalk.cyan(`${step++}.`)} ${chalk.white("pnpm dev  ")}${chalk.gray(`# starts on port ${projectAnswers.devPort}`)}`,
    );
    console.log();
    console.log(
      chalk.gray(
        `Tip: run ${chalk.white("pnpm scaffold MyComponent")} to scaffold a new component.`,
      ),
    );
    console.log();
  } catch (err) {
    console.error(
      `\n${chalk.red("✖ Error generating project:")}`,
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  }
}

main();
