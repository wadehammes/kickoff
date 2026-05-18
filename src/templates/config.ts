import type { ProjectAnswers } from "../types.js";

export function getPackageJson(a: ProjectAnswers): string {
  const deps: Record<string, string> = {
    "@faker-js/faker": "latest",
    "@jest/types": "latest",
    "@next/third-parties": "latest",
    "@svgr/webpack": "latest",
    "@tanstack/react-query": "latest",
    classnames: "latest",
    "html-react-parser": "latest",
    "jest-mock": "latest",
    next: "latest",
    "postcss-flexbugs-fixes": "latest",
    "postcss-preset-env": "latest",
    react: "latest",
    "react-aria": "latest",
    "react-dom": "latest",
    "react-hook-form": "latest",
    "react-intersection-observer": "latest",
    "safe-json-stringify": "latest",
    "schema-dts": "latest",
    sonner: "latest",
    tslib: "latest",
  };

  if (a.includeContentful) {
    deps["@contentful/rich-text-react-renderer"] = "latest";
    deps["@contentful/rich-text-types"] = "latest";
    deps.contentful = "latest";
  }

  if (a.includeI18n) {
    deps["next-intl"] = "latest";
  }
  if (a.includeResend) {
    deps.resend = "latest";
  }
  if (a.includeRecaptcha) {
    deps["react-google-recaptcha"] = "latest";
  }

  const devDeps: Record<string, string> = {
    // Pinned: biome.json schema and rule names change between releases
    "@biomejs/biome": "2.4.15",
    "@testing-library/dom": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/jest": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/safe-json-stringify": "latest",
    csstype: "latest",
    jest: "latest",
    "jest-environment-jsdom": "latest",
    "react-is": "latest",
    stylelint: "latest",
    "stylelint-config-css-modules": "latest",
    "stylelint-config-standard": "latest",
    "stylelint-value-no-unknown-custom-properties": "latest",
    "ts-jest": "latest",
    "ts-node": "latest",
    typescript: "latest",
    "typescript-plugin-css-modules": "latest",
  };

  if (a.includeRecaptcha) {
    devDeps["@types/react-google-recaptcha"] = "latest";
  }

  if (a.includeContentful) {
    devDeps["cf-content-types-generator"] = "latest";
  }

  const scripts: Record<string, string> = {
    build: "next build && make sitemap",
    dev: `NODE_OPTIONS='--inspect' next dev -p ${a.devPort} --webpack`,
    "dev:preview": "tsx scripts/dev-with-preview.ts",
    lint: "biome check",
    "lint:ci": "biome ci --reporter=github",
    "lint:css": 'stylelint "**/*.css"',
    "lint:css:fix": 'stylelint "**/*.css" --fix',
    "lint:fix": "biome check --fix .",
    scaffold: "bash scripts/scaffold.sh",
    start: `next start -p ${a.devPort}`,
    "test:ci": "jest --passWithNoTests",
    "tsc:ci": "tsc --strict",
  };

  if (a.includeContentful) {
    scripts["types:contentful"] =
      "export $(cat .env.local | sed '/^#/d; s/[$\"]//g'); cf-content-types-generator -s $CONTENTFUL_SPACE_ID -t $CONTENTFUL_CMA_TOKEN -o src/contentful/types -r -g && biome format --write src/contentful/types";
  }

  const pkg = {
    dependencies: Object.fromEntries(Object.entries(deps).sort()),
    devDependencies: Object.fromEntries(Object.entries(devDeps).sort()),
    name: a.projectName,
    packageManager: "pnpm@10.33.3",
    private: true,
    scripts,
    version: "0.0.0",
  };

  return `${JSON.stringify(pkg, null, 2)}\n`;
}

export function getTsConfig(): string {
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
}

export function getBiomeConfig(): string {
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
      "recommended": true,
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
}

export function getStylelintConfig(): string {
  return `import type { Config } from "stylelint";

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
} satisfies Config;
`;
}

export function getPostcssConfig(): string {
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
}

export function getBrowserslistrc(): string {
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
}

export function getToolVersions(
  nodeVersion: string,
  pnpmVersion: string,
): string {
  return `nodejs ${nodeVersion}\npnpm ${pnpmVersion}\n`;
}

export function getEditorConfig(): string {
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
}

export function getNpmrc(): string {
  return "shamefully-hoist=true\nstrict-peer-dependencies=false\n";
}

export function getGitignore(): string {
  return `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.
.swc
.cursor

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
}

export function getPnpmWorkspace(): string {
  return `overrides:
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
}

export function getMakefile(_a: ProjectAnswers): string {
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
}

export function getJestConfig(): string {
  return `// jest.config.ts
import type { Config } from "@jest/types";
import nextJest from "next/jest.js";

const customJestConfig: Config.InitialOptions = {
  verbose: true,
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  setupFiles: ["<rootDir>/.jest/setEnvVars.ts"],
  setupFilesAfterEnv: ["<rootDir>/.jest/setupTests.ts"],
  moduleDirectories: ["node_modules", "<rootDir>"],
  testEnvironment: "jest-environment-jsdom",
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!isbot|jest-dom)"],
  preset: "ts-jest",
};

const createJestConfig = nextJest({ dir: "./" })(customJestConfig);

export default async () => {
  const jestConfig = await createJestConfig();

  const moduleNameMapper = {
    ...jestConfig.moduleNameMapper,
    "\\\\.(css|less|scss|sass)$": "identity-obj-proxy",
  };

  return { ...jestConfig, moduleNameMapper, testTimeout: 20000 };
};
`;
}

export function getKnipConfig(a: ProjectAnswers): string {
  const ignoreFiles = [
    "scripts/make_sitemap.js",
    "test-utils.tsx",
    "src/tests/**",
  ];
  if (a.includeContentful) {
    ignoreFiles.unshift("src/contentful/types/**");
  }
  return `${JSON.stringify(
    {
      $schema: "https://unpkg.com/knip@5/schema.json",
      ignoreFiles,
    },
    null,
    2,
  )}\n`;
}

export function getCssPropsDeclaration(): string {
  return `import type { CSSProp } from "styled-components";

declare module "react" {
  interface Attributes {
    css?: CSSProp;
  }
}
`;
}

export function getNextEnvDeclaration(): string {
  return `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`;
}

export function getEnvLocalExample(a: ProjectAnswers): string {
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
    "# Vercel API token (for programmatic deploy/cache purge)",
    "VERCEL_API_TOKEN=",
    "",
    "# Vercel team ID (find in team settings)",
    "VERCEL_TEAM_ID=",
    "",
  );

  return lines.join("\n");
}
