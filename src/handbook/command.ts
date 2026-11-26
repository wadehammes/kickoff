import { spawnSync } from "node:child_process";
import { accessSync, constants } from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import chalk from "chalk";
import prompts from "prompts";
import { generateHandbook } from "../generator.js";
import { readAnswersFile } from "../validateAnswers.js";
import { detectCodebase, looksLikeCodebase } from "./detect.js";
import { getHandbookBuildPrompt } from "./prompt.js";

type Harness = {
  bin: string;
  flags?: string[];
  label: string;
};

const HARNESSES: Record<string, Harness> = {
  claude: { bin: "claude", label: "Claude Code" },
  codex: { bin: "codex", label: "Codex CLI" },
  cursor: { bin: "cursor-agent", label: "Cursor CLI" },
  gemini: { bin: "gemini", flags: ["-i"], label: "Gemini CLI" },
};

const NO_AGENT = "none";

const KICKOFF_HANDBOOK_DIR = "docs/handbook";

const log = (...parts: unknown[]) => console.error(...parts);

const printHelp = () => {
  console.log(`Usage: kickoff handbook [options]

In an existing codebase, scans the repo and has an AI agent study the code and
write a handbook (or update the one there). With --answers, writes kickoff's own
handbook for a new project and nothing else.

Options:
  --dir <path>       Repo to document (default: current directory)
  --out <path>       Handbook folder, relative to --dir (default: ${KICKOFF_HANDBOOK_DIR})
  --agent <name>     ${Object.keys(HARNESSES).join(", ")}, any CLI that takes a prompt as its
                     first argument, or "${NO_AGENT}" to print the prompt instead
  --answers <path>   Write kickoff's handbook from ProjectAnswers JSON
  --dry-run          Show what kickoff found and the prompt (or the files it would write)
  --verbose          Log each file as it is written (--answers only)
  -h, --help         Show this help
`);
};

const isInstalled = (bin: string): boolean =>
  (process.env.PATH ?? "").split(path.delimiter).some((dir) => {
    try {
      accessSync(path.join(dir, bin), constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });

const harnessFor = (name: string): Harness =>
  HARNESSES[name] ?? { bin: name, label: name };

const chooseAgent = async (requested: string | undefined): Promise<string> => {
  if (requested) {
    return requested;
  }

  if (!process.stdin.isTTY) {
    return NO_AGENT;
  }

  const installed = Object.entries(HARNESSES).filter(([, harness]) =>
    isInstalled(harness.bin),
  );
  const { agent } = await prompts({
    choices: [
      ...installed.map(([name, harness]) => ({
        title: harness.label,
        value: name,
      })),
      { title: "Print the prompt (use any other agent)", value: NO_AGENT },
    ],
    message: "Which agent should study the code and write the handbook?",
    name: "agent",
    type: "select",
  });

  if (agent === undefined) {
    log(chalk.yellow("\n⚠  Cancelled."));
    process.exit(0);
  }

  return agent as string;
};

const writeKickoffHandbook = async (
  answersPath: string,
  root: string,
  dryRun: boolean,
  verbose: boolean,
) => {
  const answers = readAnswersFile(answersPath);

  if (typeof answers === "string") {
    log(chalk.red(`✖ ${answers}`));
    process.exit(1);
  }

  await generateHandbook(answers, root, { dryRun, verbose });

  log(
    dryRun
      ? chalk.gray("\nDry-run complete — no files were written.")
      : `\n${chalk.green("✔")} Wrote ${chalk.bold(`${KICKOFF_HANDBOOK_DIR}/`)} for ${chalk.bold(answers.siteName)}.`,
  );
};

const parseHandbookArgs = (args: string[]) => {
  try {
    return parseArgs({
      allowPositionals: false,
      args,
      options: {
        agent: { type: "string" },
        answers: { type: "string" },
        dir: { type: "string" },
        "dry-run": { default: false, type: "boolean" },
        help: { default: false, short: "h", type: "boolean" },
        out: { type: "string" },
        verbose: { default: false, type: "boolean" },
      },
      strict: true,
    }).values;
  } catch (error) {
    log(
      chalk.red("✖"),
      error instanceof Error ? error.message : error,
      "\n  Run kickoff handbook --help for options.",
    );
    process.exit(1);
  }
};

export const runHandbookCommand = async (args: string[]): Promise<void> => {
  const values = parseHandbookArgs(args);

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const root = path.resolve(process.cwd(), values.dir ?? ".");
  const dryRun = values["dry-run"] ?? false;

  if (values.answers !== undefined) {
    if (values.out !== undefined || values.agent !== undefined) {
      log(
        chalk.red(
          `✖ --answers writes kickoff's handbook to ${KICKOFF_HANDBOOK_DIR}/ without an agent; drop --out and --agent.`,
        ),
      );
      process.exit(1);
    }

    await writeKickoffHandbook(
      path.resolve(process.cwd(), values.answers),
      root,
      dryRun,
      values.verbose ?? false,
    );
    return;
  }

  if (!looksLikeCodebase(root)) {
    log(
      chalk.red(`✖ No codebase found in ${root}.`),
      "\n  Run this in a repo, or pass --answers to write kickoff's handbook for a new project.",
    );
    process.exit(1);
  }

  const handbookDir = (values.out ?? KICKOFF_HANDBOOK_DIR).replace(/\/$/, "");
  const facts = detectCodebase(root, handbookDir);
  const prompt = getHandbookBuildPrompt(facts, handbookDir);

  log(
    `${chalk.cyan("→")} Scanned ${chalk.bold(facts.name)}: ${facts.fileCount} files; ${facts.stack.slice(0, 8).join(", ") || facts.languages.join(", ") || "no known libraries"}${facts.existingHandbookPages > 0 ? chalk.dim(` (updating ${facts.existingHandbookPages} existing pages)`) : ""}`,
  );

  if (values.out === undefined && facts.otherHandbooks.length > 0) {
    log(
      chalk.yellow("⚠"),
      `Found handbook-style docs in ${facts.otherHandbooks.map((dir) => `${dir}/`).join(", ")}. To update one instead of starting ${handbookDir}/, pass --out <that folder>.`,
    );
  }

  if (dryRun) {
    console.log(prompt);
    return;
  }

  const agent = await chooseAgent(values.agent);

  if (agent === NO_AGENT) {
    console.log(prompt);
    log(
      chalk.gray(
        `\nPaste the prompt above into your agent from ${root}, or pipe it: kickoff handbook --agent ${NO_AGENT} | pbcopy`,
      ),
    );
    return;
  }

  const harness = harnessFor(agent);

  log(
    `${chalk.cyan("→")} Starting ${chalk.bold(harness.label)} in ${root}. It will study the code and write ${chalk.bold(`${handbookDir}/`)}.\n`,
  );

  const result = spawnSync(harness.bin, [...(harness.flags ?? []), prompt], {
    cwd: root,
    stdio: "inherit",
  });

  if (result.error) {
    log(
      chalk.red(`✖ Could not start ${harness.bin}:`),
      result.error.message,
      `\n  Install it, or run with --agent ${NO_AGENT} to print the prompt.`,
    );
    process.exit(1);
  }

  process.exit(result.status ?? 0);
};
