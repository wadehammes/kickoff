import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "src/**/*.test.ts",
        "src/types.ts",
        "src/templates/index.ts",
        "src/verifyScaffoldE2e.ts",
      ],
      include: ["src/**/*.ts", "scaffold-assets/claude-hooks/*.mjs"],
      provider: "v8",
      reporter: ["text-summary", "text"],
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
    environment: "node",
    exclude: ["**/node_modules/**", "**/scaffold-assets/**"],
    fileParallelism: false,
  },
});
