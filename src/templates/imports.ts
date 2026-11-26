/** The module an import statement reads from, or "" if it has none. */
export const importSource = (statement: string): string =>
  statement.match(/from "([^"]+)";?\s*$/)?.[1] ??
  statement.match(/^import "([^"]+)"/)?.[1] ??
  "";

// Biome's import order: node: builtins, then bare and src/ paths, then relative
// paths, compared segment by segment (so "next/navigation" sorts before "next-intl").
export const importSortKey = (source: string): string => {
  const rank = source.startsWith("node:") ? 0 : source.startsWith(".") ? 2 : 1;

  return `${rank}${source.toLowerCase().replaceAll("/", "\u0000")}`;
};

/** Import statements in the order Biome's organizeImports keeps them. */
export const sortImports = (statements: readonly string[]): string[] =>
  [...statements].sort((left, right) => {
    const leftKey = importSortKey(importSource(left));
    const rightKey = importSortKey(importSource(right));

    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
