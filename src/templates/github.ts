// ---------------------------------------------------------------------------
// .github/workflows/ci.yml
// ---------------------------------------------------------------------------

export const getCIWorkflow = (): string => {
  return `name: CI
on:
  pull_request:
    branches:
      - staging

permissions:
  contents: read

jobs:
  ci:
    name: Lint/Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        name: Checkout code
        with:
          fetch-depth: 0
      - name: Setup PNPM
        uses: pnpm/action-setup@fc06bc1257f339d1d5d8b3a19a8cae5388b55320 # v5.0.0
        with:
          package_json_file: package.json
      - name: Read Node.js version from .tool-versions
        id: get_node_version
        run: |
          echo "$(awk '/nodejs/ {print $2}' .tool-versions)"
          echo "node_version=$(awk '/nodejs/ {print $2}' .tool-versions)" >> $GITHUB_OUTPUT
        shell: bash
      - name: Setup Node.js
        uses: actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f # v6.3.0
        with:
          node-version: \${{ steps.get_node_version.outputs.node_version }}
          cache: "pnpm"
      - name: Install dependencies
        run: pnpm install
      - name: Run TSC
        run: pnpm tsc:ci
      - name: Run Biome
        run: pnpm lint:ci
      - name: Run Stylelint
        run: pnpm lint:css
      - name: Run Jest
        run: pnpm test:ci
`;
};

// ---------------------------------------------------------------------------
// .github/workflows/release.yml
// ---------------------------------------------------------------------------

export const getReleaseWorkflow = (): string => {
  return `name: create-release
on:
  push:
    tags:
      - "v*"
permissions:
  contents: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          fetch-depth: 0
          token: \${{ secrets.GITHUB_TOKEN }}
      - name: Reset Main
        id: reset_main
        run: |
          echo \${{ github.ref }}
          /usr/bin/git push origin \${{ github.ref }}:main
      - name: Generate changelog
        id: changelog
        uses: metcalfc/changelog-generator@0440d0932f9a0dd1cc9ecd8412830761351323bd # v4.7.0
        with:
          myToken: \${{ secrets.GITHUB_TOKEN }}
      - name: Create Release
        id: create_release
        uses: softprops/action-gh-release@153bb8e04406b158c6c84fc1615b65b24149a1fe # v2.6.1
        with:
          name: \${{ github.ref_name }}
          body: \${{ steps.changelog.outputs.changelog }}
          draft: false
          prerelease: false
          token: \${{ secrets.GITHUB_TOKEN }}
`;
};

// ---------------------------------------------------------------------------
// .github/dependabot.yml
// ---------------------------------------------------------------------------

export const getDependabotConfig = (): string => {
  return `version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 0
`;
};

// ---------------------------------------------------------------------------
// .github/labeler.yml
// ---------------------------------------------------------------------------

export const getLabelerYml = (): string => {
  return `javascript:
  - src/**/*
  - scripts/**/*
  - public/**/*
  - .tool-versions

documentation:
  - docs/**/*
  - README.md
  - CLAUDE.md

configuration:
  - next.config.ts
  - next-env.d.ts
  - postcss.config.json
  - biome.json
  - stylelint.config.mjs
  - jest.config.ts
  - tsconfig.json

dependencies:
  - .tool-versions
  - package.json
  - pnpm-lock.yaml
  - pnpm-workspace.yaml
`;
};

// ---------------------------------------------------------------------------
// .github/workflows/labeler.yml
// ---------------------------------------------------------------------------

export const getLabelerWorkflow = (): string => {
  return `name: "Pull Request Labeler"
on:
  - pull_request_target
permissions:
  contents: read
  pull-requests: write
jobs:
  labeler:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: "\${{ secrets.GITHUB_TOKEN }}"
`;
};
