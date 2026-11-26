import { spawnSync } from "node:child_process";
import { accessSync, constants, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
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
  --force            Overwrite an existing handbook (--answers only)
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

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
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

type KickoffHandbookOptions = {
  dryRun: boolean;
  force: boolean;
  verbose: boolean;
};

const driftCheckHook = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../scaffold-assets/claude-hooks/handbook-drift-check.mjs",
);

const findLinksOutsideHandbook = async (dir: string): Promise<string[]> => {
  const { findBrokenLinks } = (await import(
    pathToFileURL(driftCheckHook).href
  )) as { findBrokenLinks: (docs: string[]) => string[] };

  return findBrokenLinks(
    readdirSync(dir)
      .filter((name) => name.endsWith(".md"))
      .map((name) => path.join(dir, name)),
  ).map((problem) => problem.replace(`${dir}/`, ""));
};

const writeKickoffHandbook = async (
  answersPath: string,
  root: string,
  { dryRun, force, verbose }: KickoffHandbookOptions,
) => {
  const answers = readAnswersFile(answersPath);

  if (typeof answers === "string") {
    log(chalk.red(`✖ ${answers}`));
    process.exit(1);
  }

  const handbookPath = path.join(root, KICKOFF_HANDBOOK_DIR);

  if (
    !force &&
    existsSync(handbookPath) &&
    readdirSync(handbookPath).length > 0
  ) {
    log(
      chalk.red(`✖ ${handbookPath} already has files.`),
      "\n  Pass --force to overwrite them, or run without --answers to have an agent update that handbook.",
    );
    process.exit(1);
  }

  await generateHandbook(answers, root, { dryRun, verbose });

  if (dryRun) {
    log(chalk.gray("\nDry-run complete — no files were written."));
    return;
  }

  log(
    `\n${chalk.green("✔")} Wrote ${chalk.bold(`${KICKOFF_HANDBOOK_DIR}/`)} for ${chalk.bold(answers.siteName)}.`,
  );

  const missing = await findLinksOutsideHandbook(handbookPath);

  if (missing.length > 0) {
    log(
      chalk.yellow("⚠"),
      `These pages link to ${missing.length} files that a full kickoff project has and this repo doesn't. Add them or edit the links:`,
    );
    log(
      chalk.gray(
        missing
          .slice(0, 10)
          .map((line) => `  ${line}`)
          .join("\n"),
      ),
    );
  }
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
        force: { default: false, type: "boolean" },
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
  const dryRun = values["dry-run"];

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
      {
        dryRun,
        force: values.force,
        verbose: values.verbose,
      },
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

  const handbookDir = path
    .relative(root, path.resolve(root, values.out ?? KICKOFF_HANDBOOK_DIR))
    .split(path.sep)
    .join("/");

  if (!handbookDir || handbookDir.startsWith("..")) {
    log(chalk.red(`✖ --out must be a folder inside ${root}.`));
    process.exit(1);
  }
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

  if (result.signal) {
    log(chalk.red(`✖ ${harness.bin} stopped (${result.signal}).`));
    process.exit(1);
  }

  process.exit(result.status ?? 1);
};
