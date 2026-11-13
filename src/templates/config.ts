import type { ProjectAnswers } from "../types.js";

export const getPackageJson = (a: ProjectAnswers): string => {
  const deps: Record<string, string> = {
    "@base-ui/react": "^1.9.0",
    "@jest/types": "^30.5.1",
    "@tanstack/react-query": "^5.105.0",
    classnames: "^2.5.1",
    "jest-mock": "^30.5.2",
    next: "^16.4.3",
    "postcss-flexbugs-fixes": "^5.0.2",
    "postcss-preset-env": "^11.6.1",
    react: "^19.3.1",
    "react-dom": "^19.3.1",
    "schema-dts": "^2.1.0",
    tslib: "^2.8.1",
  };

  if (a.includeGA) {
    deps["@next/third-parties"] = "^16.4.3";
  }

  if (a.includeContentful) {
    deps["@contentful/rich-text-react-renderer"] = "^16.2.2";
    deps["@contentful/rich-text-types"] = "^17.2.7";
    deps.contentful = "^11.12.10";
    deps["html-react-parser"] = "^6.1.9";
    deps["safe-json-stringify"] = "^1.2.0";
    deps["server-only"] = "^0.0.1";
  }

  if (a.includeI18n) {
    deps["next-intl"] = "^4.14.9";
  }
  if (a.includeResend) {
    deps.resend = "^6.35.0";
  }
  if (a.includeRecaptcha) {
    deps["react-google-recaptcha"] = "^3.1.0";
  }

  const devDeps: Record<string, string> = {
    "@jest/globals": "^30.5.2",
    "@svgr/webpack": "^8.1.0",
    // Pinned: biome.json schema and rule names change between releases
    "@biomejs/biome": "2.6.6",
    "@faker-js/faker": "^10.6.0",
    "@testing-library/dom": "^10.4.2",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@testing-library/user-event": "^14.6.8",
    "@types/jest": "^30.0.0",
    "@types/node": "^26.6.6",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    csstype: "^3.2.3",
    "identity-obj-proxy": "^3.0.0",
    jest: "^30.5.2",
    "jest-environment-jsdom": "^30.5.2",
    knip: "^6.43.0",
    "react-is": "^19.2.4",
    stylelint: "^18.0.0-next.0",
    "stylelint-config-css-modules": "^4.6.0",
    "stylelint-config-standard": "^41.0.0-next.0",
    "stylelint-value-no-unknown-custom-properties": "^6.1.1",
    "ts-jest": "^29.4.15",
    tsx: "^4.20.5",
    typescript: "^7.0.2",
    "typescript-plugin-css-modules": "^5.3.0",
  };

  if (a.includeContentful) {
    devDeps["@types/safe-json-stringify"] = "^1.1.5";
  }

  if (a.includeRecaptcha) {
    devDeps["@types/react-google-recaptcha"] = "^2.1.9";
  }

  if (a.includeContentful) {
    devDeps["cf-content-types-generator"] = "^3.0.1";
  }

  const scripts: Record<string, string> = {
    build: "next build && make sitemap",
    dev: `next dev -p ${a.devPort}`,
    "dev:debug": `NODE_OPTIONS='--inspect' next dev -p ${a.devPort}`,
    "dev:preview": "tsx scripts/dev-with-preview.ts",
    lint: "biome check",
    "lint:ci": "biome ci --reporter=github",
    "lint:fix": "biome check --fix",
    "lint:check":
      "biome check --changed --since origin/staging --no-errors-on-unmatched --verbose --write --diagnostic-level=error",
    "lint:css": 'stylelint "**/*.css"',
    "lint:css:fix": 'stylelint "**/*.css" --fix',
    "lint:all":
      "pnpm lint:check && pnpm lint:css:fix && pnpm tsc:ci && pnpm knip:ci",
    knip: "knip",
    "knip:ci": "knip --no-progress",
    scaffold: "bash scripts/scaffold.sh",
    start: `next start -p ${a.devPort}`,
    "test:ci": "jest --passWithNoTests",
    "test:scripts":
      "node --import tsx --test scripts/verify-vercel-release.test.mjs",
    "tsc:ci": "tsc --strict",
    "handbook:check": "bash scripts/handbook-sync-check.sh",
  };

  if (a.includeContentful) {
    scripts["types:contentful"] =
      "export $(cat .env.local | sed '/^#/d; s/[$\"]//g'); cf-content-types-generator -s $CONTENTFUL_SPACE_ID -t $CONTENTFUL_CMA_TOKEN -o src/contentful/types -r -g && biome format --write src/contentful/types";
  }

  const pkg = {
    dependencies: Object.fromEntries(Object.entries(deps).sort()),
    devDependencies: Object.fromEntries(Object.entries(devDeps).sort()),
    name: a.projectName,
    packageManager: "pnpm@12.18.0",
    private: true,
    scripts,
    version: "0.0.0",
  };

  return `${JSON.stringify(pkg, null, 2)}\n`;
};

export const getTsConfig = (): string => {
  return `{
  "compilerOptions": {
    "allowJs": false,
    "allowSyntheticDefaultImports": true,
    "declaration": false,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "forceConsistentCasingInFileNames": true,
    "importHelpers": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "noEmit": true,
    "paths": {
      "src/*": ["./src/*"]
    },
    "resolveJsonModule": true,
    "rootDir": ".",
    "skipLibCheck": true,
    "strict": true,
    "target": "es2015",
    "typeRoots": ["node_modules/@types"],
    "types": ["jest", "node"],
    "incremental": true,
    "plugins": [
      { "name": "next" },
      { "name": "typescript-plugin-css-modules" }
    ]
  },
  "include": [
    "cssprops.d.ts",
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".jest/setupTests.ts",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules", "next.config.ts"]
}
`;
};

export const getBiomeConfig = (): string => {
  return `{
  "$schema": "./node_modules/@biomejs/biome/schema.json",
  "formatter": {
    "includes": [
      "**/*.ts",
      "**/*.tsx",
      "**/*.mts",
      "**/*.cts",
      "**/*.css",
      "**/*.module.css",
      "!**/*.json",
      "!**/*.md",
      "!**/.eslintrc",
      "!**/.vscode"
    ],
    "enabled": true,
    "formatWithErrors": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 80,
    "attributePosition": "auto"
  },
  "assist": { "actions": { "source": { "organizeImports": "on" } } },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "staging"
  },
  "css": {
    "parser": { "cssModules": true },
    "formatter": {
      "enabled": true,
      "indentStyle": "space",
      "indentWidth": 2,
      "lineWidth": 80
    },
    "linter": { "enabled": true }
  },
  "files": {
    "includes": [
      "**/*.ts",
      "**/*.tsx",
      "**/*.css",
      "**/*.module.css",
      "!**/node_modules",
      "!**/dist"
    ]
  },
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended",
      "a11y": { "noSvgWithoutTitle": "off" },
      "complexity": {
        "noImportantStyles": "warn",
        "noForEach": "off"
      },
      "correctness": {
        "useExhaustiveDependencies": "warn",
        "noUnusedVariables": "error",
        "noUnusedImports": "error",
        "noUnknownProperty": "error"
      },
      "security": { "noDangerouslySetInnerHtml": "warn" },
      "style": {
        "useLiteralEnumMembers": "off",
        "noParameterAssign": "error",
        "useAsConstAssertion": "error",
        "useDefaultParameterLast": "error",
        "useEnumInitializers": "error",
        "useSelfClosingElements": "error",
        "useSingleVarDeclarator": "error",
        "noUnusedTemplateLiteral": "error",
        "useNumberNamespace": "error",
        "noInferrableTypes": "error",
        "noUselessElse": "error"
      },
      "suspicious": { "noArrayIndexKey": "off" }
    },
    "includes": [
      "**/*.ts",
      "**/*.tsx",
      "**/*.mts",
      "**/*.cts",
      "**/*.css",
      "**/*.module.css",
      "!**/next.config.js",
      "!**/.vscode"
    ]
  },
  "javascript": {
    "formatter": {
      "jsxQuoteStyle": "double",
      "quoteProperties": "asNeeded",
      "semicolons": "always",
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": false,
      "quoteStyle": "double",
      "attributePosition": "auto",
      "indentStyle": "space",
      "indentWidth": 2
    }
  }
}
`;
};

export const getStylelintConfig = (): string => {
  return `/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard", "stylelint-config-css-modules"],
  plugins: ["stylelint-value-no-unknown-custom-properties"],
  rules: {
    "block-no-empty": true,
    "csstools/value-no-unknown-custom-properties": [
      true,
      {
        importFrom: [
          "src/styles/variables.css",
          "src/styles/runtime-variables.json",
        ],
      },
    ],
    "keyframes-name-pattern": null,
    "selector-class-pattern": null,
  },
};
`;
};

export const getPostcssConfig = (): string => {
  return `${JSON.stringify(
    {
      plugins: {
        "postcss-flexbugs-fixes": {},
        "postcss-preset-env": {
          autoprefixer: { flexbox: "no-2009" },
          features: { "custom-properties": false },
          stage: 3,
        },
      },
    },
    null,
    2,
  )}\n`;
};

export const getBrowserslistrc = (): string => {
  return `# This file is used by:
# 1. autoprefixer to adjust CSS to support the below specified browsers
# 2. babel preset-env / SWC to adjust included polyfills
#
# Targets browsers with native support for Array.prototype.at, Object.hasOwn,
# Object.fromEntries, etc. to avoid legacy polyfills (PageSpeed).
# https://github.com/browserslist/browserslist#queries

chrome >= 93
edge >= 93
firefox >= 92
safari >= 15.4
not dead
`;
};

export const getToolVersions = (
  nodeVersion: string,
  pnpmVersion: string,
): string => {
  return `nodejs ${nodeVersion}\npnpm ${pnpmVersion}\n`;
};

export const getEditorConfig = (): string => {
  return `# Editor configuration, see http://editorconfig.org

root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
max_line_length = off
trim_trailing_whitespace = false
`;
};

export const getNpmrc = (): string => {
  return "shamefully-hoist=true\nstrict-peer-dependencies=false\n";
};

export const getGitignore = (): string => {
  return `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.
.swc

# Cursor — track shared hooks/rules; ignore local runtime state
.cursor/*
!.cursor/hooks.json
!.cursor/hooks/
!.cursor/rules/
.cursor/hooks-state/
.cursor/mcp.json
.cursor/*.log
.cursor/settings.local.json
.cursor/checkpoints/
.cursor/worktrees/
.cursor/agent-registry.json
.cursor/**/*.local.json

# Claude Code — track shared hooks/settings; ignore local runtime state
.claude/*
!.claude/settings.json
!.claude/hooks/
.claude/settings.local.json
.claude/*.log

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.vercel
.env*.local

public/generated-sitemap-*.xml
`;
};

export const getPnpmWorkspace = (): string => {
  return `allowBuilds:
  esbuild: true
  "@parcel/watcher": true

overrides:
  '@babel/helpers@<7.26.10': '>=7.26.10'
  '@babel/runtime@<7.26.10': '>=7.26.10'
  'brace-expansion@>=1.0.0 <=1.1.11': '>=1.1.12'
  'brace-expansion@>=2.0.0 <=2.0.1': '>=2.0.2'
  'glob@>=10.2.0 <10.5.0': '>=10.5.0'
  'js-yaml@<3.14.2': '>=3.14.2'
  'js-yaml@>=4.0.0 <4.1.1': '>=4.1.1'
  'jws@<3.2.3': '>=3.2.3'
  'nanoid@<3.3.8': '>=3.3.8'
`;
};

export const getMakefile = (_a: ProjectAnswers): string => {
  return `SHELL := /bin/bash
.SILENT: release

release:
\tif [ -z "$(tag)"  ]; then echo "tag is required."; exit 1; fi
\tif [[ "$(tag)" =~ ^v ]]; then \\
\t\tbash scripts/verify-vercel-for-release.sh && \\
\t\tgit tag $(tag) && \\
\t\tgit push --tags; \\
\telse \\
\t\techo "Tag name must start with v (eg, v0.0.1)"; \\
\t\texit 1; \\
\tfi

sitemap:
\tnode scripts/make_sitemap.js
`;
};

export const getJestConfig = (): string => {
  return `// jest.config.ts
import type { Config } from "@jest/types";
import nextJest from "next/jest.js";

const customJestConfig: Config.InitialOptions = {
  verbose: true,
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/scripts/",
  ],
  setupFiles: ["<rootDir>/.jest/setEnvVars.ts"],
  setupFilesAfterEnv: ["<rootDir>/.jest/setupTests.ts"],
  moduleDirectories: ["node_modules", "<rootDir>"],
  testEnvironment: "jest-environment-jsdom",
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!isbot|jest-dom|@faker-js|@base-ui)",
  ],
  preset: "ts-jest",
};

const createJestConfig = nextJest({ dir: "./" })(customJestConfig);

export default async () => {
  const jestConfig = await createJestConfig();

  const allowEsmPackagesInTransformIgnorePatterns = (patterns: string[]) =>
    patterns.map((pattern) => {
      if (pattern.includes("next/src/shared/lib)/")) {
        return pattern.replace(
          "next/src/shared/lib)/",
          "next/src/shared/lib|@faker-js|@base-ui)/",
        );
      }
      if (pattern.includes("next[\\\\/]src[\\\\/]shared[\\\\/]lib)[\\\\/]")) {
        return pattern.replace(
          "next[\\\\/]src[\\\\/]shared[\\\\/]lib)[\\\\/]",
          "next[\\\\/]src[\\\\/]shared[\\\\/]lib|@faker-js|@base-ui\\\\+)[\\\\/]",
        );
      }
      return pattern;
    });

  const moduleNameMapper = {
    ...jestConfig.moduleNameMapper,
    "\\\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^.+\\\\.(svg)$": "<rootDir>/src/tests/mocks/svgMock.tsx",
    "^src/lib/toast/appToast$": "<rootDir>/src/tests/mocks/appToast.mock.ts",
  };

  return {
    ...jestConfig,
    moduleNameMapper,
    testTimeout: 20000,
    transformIgnorePatterns: allowEsmPackagesInTransformIgnorePatterns(
      jestConfig.transformIgnorePatterns ?? [],
    ),
  };
};
`;
};

export const getKnipConfig = (a: ProjectAnswers): string => {
  const ignore = [
    ".claude/hooks/**",
    ".cursor/hooks/**",
    "scripts/**",
    "src/app/fonts.ts",
    "src/copy/**",
    "src/hooks/useIsBrowser.ts",
    "src/interfaces/**",
    "src/lib/generateSitemap.ts",
    "src/tests/factories/**",
    "src/tests/mocks/mockNextNavigation.ts",
    "src/types/KeysMatch.ts",
    "src/ui/**",
    "src/utils/constants.ts",
    "src/utils/factory.helpers.ts",
    "src/utils/style.helpers.ts",
  ];

  if (a.includeContentful) {
    ignore.unshift("src/contentful/types/**");
  } else {
    ignore.push("src/components/ExitDraftModeLink/**");
  }

  const ignoreDependencies = [
    "@faker-js/faker",
    "@svgr/webpack",
    "jest-mock",
    "styled-components",
    "csstype",
    "react-is",
  ];

  return `${JSON.stringify(
    {
      $schema: "./node_modules/knip/schema.json",
      entry: ["jest.config.ts", "scripts/cursor-handbook-guard.runner.spec.ts"],
      ignoreExportsUsedInFile: true,
      ignore,
      ignoreBinaries: ["make"],
      ignoreDependencies,
      ignoreIssues: {
        "src/api/helpers.ts": ["types", "enumMembers"],
        "src/components/**": ["exports"],
        "src/lib/schema.ts": ["exports"],
      },
      rules: {
        duplicates: "off",
      },
      tags: ["-lintignore"],
      workspaces: {
        ".": {},
      },
    },
    null,
    2,
  )}\n`;
};

export const getCssPropsDeclaration = (): string => {
  return `import type { CSSProp } from "styled-components";

declare module "react" {
  interface Attributes {
    css?: CSSProp;
  }
}
`;
};

export const getNextEnvDeclaration = (): string => {
  return `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`;
};

export const getEnvLocalExample = (a: ProjectAnswers): string => {
  const lines: string[] = [];

  if (a.includeContentful) {
    lines.push(
      "# ── Contentful ──────────────────────────────────────────────────────────────",
      "# Your Contentful Space ID (find it in Settings > API keys)",
      "CONTENTFUL_SPACE_ID=",
      "",
      "# Content Delivery API token (public, read-only)",
      "CONTENTFUL_CONTENT_DELIVERY_API_KEY=",
      "",
      "# Content Preview API token (for draft mode)",
      "CONTENTFUL_PREVIEW_API_KEY=",
      "",
      "# Secret used to authenticate draft mode requests",
      "CONTENTFUL_PREVIEW_SECRET=",
      "",
      "# Content Management API token (used for type generation only)",
      "CONTENTFUL_CMA_TOKEN=",
      "",
    );
  }

  lines.push(
    "# ── App environment ─────────────────────────────────────────────────────────",
    "# One of: staging | production",
    "ENVIRONMENT=staging",
    "# ENVIRONMENT=production",
    "# ENVIRONMENT=local  # Not used — configure next.config.ts as needed",
    "# See src/utils/environment.helpers.ts → envUrl() for URL resolution logic",
    "",
    "",
  );

  if (a.includeGA) {
    lines.push(
      "# ── Google Analytics ────────────────────────────────────────────────────────",
      "# Your GA4 Measurement ID (e.g. G-XXXXXXXXXX)",
      "GA_MEASUREMENT_ID=",
      "",
    );
  }

  if (a.includeResend) {
    lines.push(
      "# ── Resend ──────────────────────────────────────────────────────────────────",
      "# Resend API key",
      "RESEND_API_KEY=",
      "",
      "# Resend audience ID for general newsletter/contact list",
      "RESEND_GENERAL_AUDIENCE_ID=",
      "",
    );
  }

  if (a.includeRecaptcha) {
    lines.push(
      "# ── reCAPTCHA ───────────────────────────────────────────────────────────────",
      "# Google reCAPTCHA v2/v3 site key (public)",
      "RECAPTCHA_SITE_KEY=",
      "",
      "# Google reCAPTCHA secret key (server-side only)",
      "RECAPTCHA_SECRET_KEY=",
      "",
    );
  }

  lines.push(
    "# ── Vercel ──────────────────────────────────────────────────────────────────",
    "# Ensures Vercel installs dependencies with the same package manager version as",
    "# package.json's packageManager field (Corepack). Vercel: Settings → Environment Variables.",
    "ENABLE_EXPERIMENTAL_COREPACK=1",
    "",
    "# Vercel API token (for polling deploy status on refresh-content)",
    "VERCEL_API_TOKEN=",
    "",
    "# Vercel team slug or ID (scopes List Deployments API when under a team)",
    "VERCEL_TEAM_SLUG=",
    "VERCEL_TEAM_ID=",
    "",
    "# Deploy hooks for refresh-content (list with vercel deploy-hooks ls)",
    "VERCEL_DEPLOY_HOOK_STAGING=",
    "VERCEL_DEPLOY_HOOK_PRODUCTION=",
    "",
    "# Token required to access /refresh-content when set (omit for local-only access)",
    "REFRESH_CONTENT_ACCESS_TOKEN=",
    "",
  );

  return lines.join("\n");
};
