import type { ProjectAnswers } from "../types.js";

// ---------------------------------------------------------------------------
// scripts/scaffold.sh
// ---------------------------------------------------------------------------

export function getScaffoldSh(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

factory_export_name() {
  local name="$1"
  local first rest
  first=$(printf '%s' "\${name:0:1}" | tr '[:upper:]' '[:lower:]')
  rest="\${name:1}"
  echo "\${first}\${rest}Factory"
}

create_component_file() {
  touch "\${component_name}.component.tsx"
  {
    echo "import styles from \\"./\${component_name}.module.css\\";"
    echo
    echo "interface \${component_name}Props {"
    echo "  myProperty: string;"
    echo "}"
    echo
    echo "export const \${component_name} = ({ myProperty }: \${component_name}Props) => {"
    echo "  return ("
    echo "    <div className={styles.wrapper} data-testid=\\"rh\${component_name}\\">"
    echo "      {myProperty}"
    echo "    </div>"
    echo "  );"
    echo "};"
    echo
    echo "export default \${component_name};"
  } >> "\${component_name}.component.tsx"
}

create_css_module_file() {
  touch "\${component_name}.module.css"
  {
    echo ".wrapper {"
    echo "  display: block;"
    echo "}"
  } >> "\${component_name}.module.css"
}

create_interfaces_file() {
  touch "\${component_name}.interfaces.ts"
  {
    echo "export interface \${component_name}Type {"
    echo "  id: string;"
    echo "}"
  } >> "\${component_name}.interfaces.ts"
}

create_spec_file() {
  touch "\${component_name}.spec.tsx"
  {
    echo "import { beforeEach, describe, expect, it } from \\"@jest/globals\\";"
    echo "import { \${component_name}PageObject } from \\"src/components/\${component_name}/\${component_name}.po\\";"
    echo "import { screen } from \\"src/tests/test-utils\\";"
    echo
    echo "let po: \${component_name}PageObject;"
    echo
    echo "describe(\\"\${component_name}\\", () => {"
    echo "  beforeEach(() => {"
    echo "    po = new \${component_name}PageObject();"
    echo "  });"
    echo
    echo "  it(\\"renders\\", () => {"
    echo "    po.render\${component_name}();"
    echo "    expect(screen.getByTestId(po.testId)).toBeInTheDocument();"
    echo "  });"
    echo "});"
  } >> "\${component_name}.spec.tsx"
}

create_factory_file() {
  local factory_name factory_path
  factory_name=$(factory_export_name "$component_name")
  factory_path="$repo_root/src/tests/factories/\${component_name}.factory.ts"
  touch "$factory_path"
  {
    echo "import { faker } from \\"@faker-js/faker\\";"
    echo "import type { \${component_name}Type } from \\"src/components/\${component_name}/\${component_name}.interfaces\\";"
    echo "import { BaseFactory } from \\"src/tests/factories/BaseFactory\\";"
    echo "import type { KeysMatch } from \\"src/types/KeysMatch\\";"
    echo
    echo "type \${component_name}FactoryOptions = Record<string, never>;"
    echo
    echo "class \${component_name}Factory extends BaseFactory<"
    echo "  \${component_name}Type,"
    echo "  \${component_name}FactoryOptions"
    echo "> {"
    echo "  build("
    echo "    attributes?: Partial<\${component_name}Type>,"
    echo "    _options?: \${component_name}FactoryOptions,"
    echo "  ) {"
    echo "    const instance = {"
    echo "      id: faker.string.uuid(),"
    echo "    } satisfies \${component_name}Type;"
    echo
    echo "    const factoryBuilt: \${component_name}Type = {"
    echo "      ...instance,"
    echo "      ...(attributes ?? {}),"
    echo "    };"
    echo
    echo "    const _allKeysMustBeInTheInstance: KeysMatch<"
    echo "      \${component_name}Type,"
    echo "      typeof instance"
    echo "    > = undefined;"
    echo
    echo "    return factoryBuilt;"
    echo "  }"
    echo "}"
    echo
    echo "export const \${factory_name} = new \${component_name}Factory();"
  } >> "$factory_path"
}

create_page_object_file() {
  touch "\${component_name}.po.tsx"
  {
    echo "import { \${component_name} } from \\"src/components/\${component_name}/\${component_name}.component\\";"
    echo "import {"
    echo "  BasePageObject,"
    echo "  type BasePageObjectProps,"
    echo "} from \\"src/tests/basePageObject.po\\";"
    echo "import { render } from \\"src/tests/test-utils\\";"
    echo
    echo "export class \${component_name}PageObject extends BasePageObject {"
    echo "  public testId = \\"rh\${component_name}\\";"
    echo
    echo "  constructor("
    echo "    { debug, raiseOnFind }: BasePageObjectProps = {"
    echo "      debug: false,"
    echo "      raiseOnFind: false,"
    echo "    },"
    echo "  ) {"
    echo "    super({ debug, raiseOnFind });"
    echo
    echo "    jest.resetAllMocks();"
    echo "  }"
    echo
    echo "  render\${component_name}() {"
    echo "    render(<\${component_name} myProperty=\\"hello\\" />);"
    echo "  }"
    echo "}"
  } >> "\${component_name}.po.tsx"
}

component_name=\${1:-}

if [ "$component_name" = "" ]; then
  echo "Error: component name not provided."
  echo "ex: pnpm scaffold <ComponentName>"
  exit 1
fi

dir="./src/components/\${component_name}"
repo_root="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -d "$dir" ]; then
  mkdir -p "$repo_root/src/tests/factories"
  mkdir "$dir"
  pushd "$dir" > /dev/null
  create_component_file
  create_css_module_file
  create_interfaces_file
  create_spec_file
  create_page_object_file
  popd > /dev/null
  create_factory_file
  (cd "$repo_root" && pnpm exec biome format --write "$dir" "src/tests/factories/\${component_name}.factory.ts") || true
  echo "✨ Successfully scaffolded \${component_name} ✨"
  echo "Component: src/components/\${component_name}"
  echo "Factory:   src/tests/factories/\${component_name}.factory.ts"
  exit 0
fi

echo "Error: \${component_name} already exists. Aborting scaffolding."
exit 1
`;
}

// ---------------------------------------------------------------------------
// scripts/make_sitemap.js
// ---------------------------------------------------------------------------

export function getMakeSitemapJs(a: ProjectAnswers): string {
  return `const fs = require("node:fs");

const path = ".next/prerender-manifest.json";
const sitemapPath = "public/sitemap.xml";
const baseUrl = "${a.prodUrl}";
const lastModTime = new Date().toISOString();

const manifestContents = fs.readFileSync(path, "utf-8");
const manifest = JSON.parse(manifestContents);

let sitemapStr = \`<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\`;

const addRoute = (route) => {
  sitemapStr += \`
  <url>
    <loc>\${baseUrl}\${route}</loc>
    <lastmod>\${lastModTime}</lastmod>
  </url>\`;
};

const { routes } = manifest;

const IGNORE_ROUTES = ["/404"];

for (const [route] of Object.entries(routes)) {
  if (!IGNORE_ROUTES.includes(route)) {
    addRoute(route);
  }
}

sitemapStr += "</urlset>";

fs.writeFileSync(sitemapPath, sitemapStr);
`;
}

// ---------------------------------------------------------------------------
// scripts/tsconfig.json
// ---------------------------------------------------------------------------

export function getScriptsTsConfig(): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        esModuleInterop: true,
        isolatedModules: false,
        module: "CommonJS",
        target: "ES2020",
      },
      extends: "../tsconfig.json",
    },
    null,
    2,
  )}\n`;
}

// ---------------------------------------------------------------------------
// scripts/verify-vercel-release.ts
// ---------------------------------------------------------------------------

export function getVerifyVercelRelease(): string {
  return `import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export type VercelMembershipEvaluation = { allowed: boolean; role: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

export function evaluateMembership(
  membership: Record<string, unknown>,
): VercelMembershipEvaluation {
  const raw = membership.role;
  const role =
    raw == null || raw === ""
      ? ""
      : typeof raw === "string"
        ? raw
        : String(raw);

  if (role === "OWNER" || role === "MEMBER") {
    return { allowed: true, role };
  }

  return { allowed: false, role };
}

async function main(): Promise<void> {
  const jsonRaw = process.env.VC_JSON;
  const token = process.env.VC_TOKEN;
  const teamSlug = process.env.VC_TEAM;

  if (!jsonRaw || !token || !teamSlug) {
    console.error("Missing VC_JSON, VC_TOKEN, or VC_TEAM.");
    process.exit(1);
  }

  let data: unknown;
  try {
    data = JSON.parse(jsonRaw) as unknown;
  } catch {
    console.error("VC_JSON is not valid JSON.");
    process.exit(1);
  }

  const mem = isRecord(data) ? data.membership : undefined;
  const m = isRecord(mem) ? mem : {};
  const { allowed, role } = evaluateMembership(m);

  if (!allowed) {
    console.error(
      \`Release requires Vercel team role Member or Owner. Current role: \${role || "unknown"}.\`,
    );
    process.exit(1);
  }

  let userBlob: unknown;
  try {
    const res = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: \`Bearer \${token}\` },
    });
    if (!res.ok) {
      console.error(\`Could not load Vercel user: \${res.status} \${res.statusText}\`);
      process.exit(1);
    }
    userBlob = (await res.json()) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(\`Could not load Vercel user: \${msg}\`);
    process.exit(1);
  }

  const uRaw = isRecord(userBlob) ? userBlob.user : undefined;
  const u = isRecord(uRaw) ? uRaw : {};
  const username = u.username;
  const email = u.email;
  const name =
    typeof username === "string" && username
      ? username
      : typeof email === "string" && email
        ? email
        : "unknown";

  console.log(
    \`Vercel OK: \${name} — role \${role || "?"} on team \${teamSlug} (release allowed).\`,
  );
}

const invokedAsMain = ((): boolean => {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(entry)).href;
  } catch {
    return false;
  }
})();

if (invokedAsMain) {
  main().catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
`;
}

// ---------------------------------------------------------------------------
// scripts/verify-vercel-for-release.sh
// ---------------------------------------------------------------------------

export function getVerifyVercelForReleaseSh(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

token="\${VERCEL_TOKEN:-}"
if [[ -z "\${token}" ]]; then
  auth_candidates=(
    "\${HOME}/Library/Application Support/com.vercel.cli/auth.json"
    "\${HOME}/.local/share/com.vercel.cli/auth.json"
    "\${HOME}/.config/com.vercel.cli/auth.json"
    "\${HOME}/.config/vercel/auth.json"
    "\${HOME}/.now/auth.json"
  )
  for auth in "\${auth_candidates[@]}"; do
    if [[ -f "\${auth}" ]]; then
      token="$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(j.token||'')" "\${auth}")"
      [[ -n "\${token}" ]] && break
    fi
  done
fi

if [[ -z "\${token}" ]]; then
  echo "Set VERCEL_TOKEN or run vercel login." >&2
  exit 1
fi

team="\${VERCEL_TEAM_ID:-}"
if [[ -z "\${team}" ]]; then
  echo "Set VERCEL_TEAM_ID in .env.local or environment." >&2
  exit 1
fi

url="https://api.vercel.com/v2/teams/\${team}"
json="$(curl -sfS -H "Authorization: Bearer \${token}" "\${url}")" || {
  echo "Could not read Vercel team \${team}. Check VERCEL_TEAM_ID or vercel login." >&2
  exit 1
}

export VC_JSON="\${json}"
export VC_TOKEN="\${token}"
export VC_TEAM="\${team}"
repo_root="$(cd "\${script_dir}/.." && pwd)"
(cd "\${repo_root}" && pnpm exec tsx "\${script_dir}/verify-vercel-release.ts")
`;
}

// ---------------------------------------------------------------------------
// scripts/lib/preview-local.ts
// ---------------------------------------------------------------------------

export function getPreviewLocal(): string {
  return `/**
 * Shared helpers for local draft preview scripts.
 * Parses env files directly since these scripts run outside Next.js.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export type ScriptEnv = NodeJS.ProcessEnv;

const loadEnvFile = (filePath: string): Record<string, string> => {
  if (!fs.existsSync(filePath)) return {};

  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
};

const loadLocalEnv = (root = process.cwd()): Record<string, string> => ({
  ...loadEnvFile(path.join(root, ".env")),
  ...loadEnvFile(path.join(root, ".env.development")),
  ...loadEnvFile(path.join(root, ".env.local")),
  ...loadEnvFile(path.join(root, ".env.development.local")),
});

export const resolveEnvForScripts = (root = process.cwd()): ScriptEnv => ({
  ...loadLocalEnv(root),
  ...process.env,
});

export const getDraftPreviewUrl = (secret: string, base: string): string => {
  const origin = base.replace(/$/, "");
  return \`\${origin}/api/draft?previewSecret=\${encodeURIComponent(secret)}&redirect=/\`;
};

export const openBrowser = (targetUrl: string): void => {
  const platform = process.platform;
  if (platform === "darwin") {
    execFileSync("open", [targetUrl], { stdio: "ignore" });
  } else if (platform === "win32") {
    execFileSync("cmd", ["/c", "start", "", targetUrl], { stdio: "ignore" });
  } else {
    execFileSync("xdg-open", [targetUrl], { stdio: "ignore" });
  }
};
`;
}

// ---------------------------------------------------------------------------
// scripts/dev-with-preview.ts
// ---------------------------------------------------------------------------

export function getDevWithPreview(a: ProjectAnswers): string {
  return `/**
 * Runs \`next dev\` and, when CONTENTFUL_PREVIEW_SECRET is set, waits until
 * the dev server answers then opens /api/draft so draft mode is on.
 */

import { spawn } from "node:child_process";
import https from "node:https";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  getDraftPreviewUrl,
  openBrowser,
  resolveEnvForScripts,
} from "./lib/preview-local.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const nextBin = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");

const PORT = ${a.devPort};
const DEV_ARGS = ["dev", "-p", String(PORT), "--webpack"] as const;

const PING_INTERVAL_MS = 300;
const PING_TIMEOUT_MS = 5_000;
const SERVER_READY_TIMEOUT_MS = 120_000;

const pingDevServer = (origin: string): Promise<void> => {
  const base = origin.replace(//$/, "");
  const isHttps = base.startsWith("https");
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const req = lib.get(
      \`\${base}/\`,
      isHttps ? { rejectUnauthorized: false } : {},
      (res) => {
        clearTimeout(timeoutId);
        res.resume();
        resolve();
      },
    );
    timeoutId = setTimeout(() => {
      req.destroy();
      reject(new Error("ping timeout"));
    }, PING_TIMEOUT_MS);
    req.on("error", (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
};

const waitUntilReady = async (origin: string): Promise<void> => {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      await pingDevServer(origin);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, PING_INTERVAL_MS));
    }
  }
  throw new Error(\`No response from \${origin} within \${SERVER_READY_TIMEOUT_MS}ms\`);
};

const main = async (): Promise<void> => {
  const child = spawn(process.execPath, [nextBin, ...DEV_ARGS], {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });

  child.on("error", (err) => {
    console.error("[dev:preview] Failed to start Next.js:", err);
    process.exit(1);
  });

  process.on("SIGINT", () => child.pid && child.kill("SIGINT"));
  process.on("SIGTERM", () => child.pid && child.kill("SIGTERM"));
  child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));

  const env = resolveEnvForScripts(repoRoot);
  const secret = env.CONTENTFUL_PREVIEW_SECRET;
  const origin = \`http://localhost:\${PORT}\`;

  if (!secret) {
    console.info(
      "\\n[dev:preview] Tip: set CONTENTFUL_PREVIEW_SECRET in .env.local to auto-open draft preview.\\n",
    );
    return;
  }

  try {
    await waitUntilReady(origin);
  } catch (e) {
    console.error("[dev:preview] Dev server not reachable; skipping draft open.", e);
    return;
  }

  const url = getDraftPreviewUrl(secret, origin);
  console.info(\`\\n[dev:preview] Opening draft preview: \${url}\\n\`);
  try {
    openBrowser(url);
  } catch (e) {
    console.error("[dev:preview] Could not open browser; open manually:", url, e);
  }
};

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
`;
}
