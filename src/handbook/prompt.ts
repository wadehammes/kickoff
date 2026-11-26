import type { CodebaseFacts } from "./detect.js";

const list = (items: string[], empty = "none found"): string =>
  items.length > 0 ? items.join(", ") : empty;

const getFactsSection = (facts: CodebaseFacts): string => {
  const scripts =
    facts.scripts.length > 0
      ? facts.scripts.map((name) => `\`${name}\``).join(", ")
      : "none found";
  const dirs = facts.topLevelDirs
    .map(({ dir, files }) => `\`${dir}/\` (${files} files)`)
    .join(", ");
  const docs =
    facts.agentDocs.length > 0
      ? facts.agentDocs.map((file) => `- \`${file}\``).join("\n")
      : "- none found";

  return `## What kickoff found

These came from a quick scan of the repo. Confirm them in the code before you rely on them.

- Name: ${facts.name}
- Languages: ${list(facts.languages)}
- Libraries and tools: ${list(facts.stack)}
- Package manager: ${list(facts.packageManagers, "not detected")}
- Workspace: ${list(facts.workspace, "single package")}
- Default branch: ${facts.defaultBranch ?? "not detected"}
- Scripts${facts.scriptsFrom ? ` (from \`${facts.scriptsFrom}\`)` : ""}: ${scripts}
- Largest top-level folders: ${dirs || "none"}
- Files scanned: ${facts.fileCount}

Existing docs and agent instructions to fold in (they may be out of date; the code wins when they disagree):

${docs}`;
};

const getModeSection = (facts: CodebaseFacts, handbookDir: string): string =>
  facts.existingHandbookPages > 0
    ? `## This repo already has a handbook

\`${handbookDir}/\` already has ${facts.existingHandbookPages} pages. Update it instead of starting over: keep pages that are still accurate, fix the ones the code has moved away from, add pages for areas that have none, and bring the layout in line with the structure below. List every change you made in your reply.`
    : `## Start a new handbook

\`${handbookDir}/\` doesn't exist yet. Create it with the structure below.${
        facts.otherHandbooks.length > 0
          ? ` The repo already has handbook-style docs in ${facts.otherHandbooks.map((dir) => `\`${dir}/\``).join(", ")}. Read them first, link to them instead of repeating what they cover, and note any overlap in your reply.`
          : ""
      }`;

export const getHandbookBuildPrompt = (
  facts: CodebaseFacts,
  handbookDir: string,
): string => `# Build the handbook for ${facts.name}

Study this codebase and write a handbook in \`${handbookDir}/\` that describes how the code is built today: one page per part of the work, with the rules the team follows and a short example for each rule, taken from this repo. People read it to onboard and in review; agents read it before every change.

Only write files under \`${handbookDir}/\`. Don't change code, configs, or other docs. If you think another file should point at the handbook (\`AGENTS.md\`, \`CLAUDE.md\`, \`.cursor/rules/\`), say so at the end of your reply instead of editing it.

${getFactsSection(facts)}

${getModeSection(facts, handbookDir)}

## 1. Study the code

Do this before writing anything.

1. Read the root configs: package manifests, TypeScript, lint, format, test, and build configs. Note the scripts people run.
2. Read every doc and instruction file listed above. Treat them as claims to check, not facts.
3. Map the folders. For each area of the work (for example components, styling, data fetching, state, forms, routing, tests, build and deploy), open at least three real files and note how they're written.
4. Run \`git log --since="6 months ago" --name-only --format=""\` (or similar) to see which areas change most. Read recent files in those areas. When old and new code disagree, the pattern in recent code is the current rule and the old one is legacy.
5. Note anything the code does inconsistently, with a file on each side. Don't pick a winner; list these as open questions at the end.

## 2. Pick the pages

Make one page per part of the work that exists in this repo, named for the work, like \`components.md\`, \`data.md\`, \`state-and-forms.md\`, \`routing.md\`, \`styling.md\`, \`testing.md\`, \`libraries.md\`, or \`platform.md\` (build, CI, env, deploy). Skip areas the repo doesn't have, and merge areas that are too thin to stand alone. Most repos need five to eight pages. A monorepo with separate apps can have a page per app area, or a sub-folder per app with its own \`README.md\` and \`llms.md\`.

Every handbook also has these four pages:

- \`README.md\`: the index for people. One line on what the handbook covers, then a table with the columns \`Page\` and \`Read it when you…\`, where each row finishes the sentence ("Add or change a React component, style it, or pick a component library"). End with a "Keep it accurate" section: the pages describe what the code does today; when a change affects how the team builds something, the matching page is updated in the same PR; rules also apply to older code that doesn't follow them yet, but only code being added or rewritten has to follow them.
- \`llms.md\`: routing for agents. A table with the columns \`Task or file\` and \`Read first\`. Rows name tasks ("Adding a feature or fixing a bug, before writing any code") or file patterns (\`*.spec.tsx\`, \`src/api/**\`, \`*.module.css\`), and link to a page, or a section with an anchor. The first row is "Any change, before anything else" → \`non-negotiables.md\`. End with: "When a change seems to affect how we build something, describe the update you'd make to the matching page and ask the engineer you're working with before editing it. The pages are team agreements: a broken link or typo can be fixed directly, but a rule changes only with the engineer's go-ahead."
- \`non-negotiables.md\`: the rules every change follows, on one page. Group them under headings like Building, Data and state, and Tests. Each group is a table with the columns \`Always\`, \`Never\`, and \`Page\`, where Page links to the section that explains the rule. Include only rules the code follows consistently in recent files, or that a linter, hook, or existing doc enforces. Aim for 15 to 25 rows.
- \`glossary.md\`: a table of the terms the handbook uses that a new person wouldn't know (project-specific names, helpers, patterns), each with a one-line meaning and a link to the page that covers it.

## 3. Write each page

- Open with one line saying when to read the page ("Read this when you write or change a spec, a page object, or a factory.").
- Give each rule its own section or bullet, followed by a short code block copied or trimmed from a real file. Name the file the example came from the first time, as a path from the repo root.
- After the example, say what not to do when people get it wrong in practice: "Not \`fireEvent\`, and not \`userEvent.click(...)\` without \`setup()\`."
- When the repo has an old way and a new way, say which is which: "Some older factories use rosie's \`Factory.define\`; don't add new ones that way."
- Name the commands people run, exactly as they are in the scripts (\`pnpm test\`, \`pnpm nx test <project>\`), and how to run a single test.
- If the repo has a scaffold or generator, say which files must come from it.
- If tests exist, include a "Write the test first" section on the testing page describing the red, green, refactor loop with this repo's test command, and link to it from \`non-negotiables.md\`.
- Use tables only for the index, routing, non-negotiables, glossary, and short lookups (like which project to test). Everything else is prose and bullets.

## Style

- Write for a teammate in their first week. Plain words, short sentences, second person ("Run…", "Put…").
- No em dashes, no bold at the start of bullets, no filler ("It's worth noting", "In this section"), no unicode arrows in prose (\`→\` is fine inside table cells and link labels).
- Describe the code as it is. Don't invent a rule the code doesn't follow, and don't recommend libraries or patterns the repo doesn't use.
- Keep each page under about 200 lines. Link to another page instead of repeating it.

## 4. Check your work

Before you finish:

- Every relative link and \`#anchor\` resolves. Anchors are GitHub heading slugs: lowercase, punctuation removed, spaces turned into hyphens.
- Every command you name exists in a package manifest or a script.
- Every file path you name exists.
- Every page is in both \`README.md\` and \`llms.md\`, and every row in \`non-negotiables.md\` links to a section that explains it.

## 5. Reply

When you're done, reply with:

- the pages you wrote or changed, one line each
- open questions: places where the code is inconsistent or the rule wasn't clear, with a file on each side, so an engineer can decide
- files outside \`${handbookDir}/\` that should point at the handbook, and the line you'd add
`;
