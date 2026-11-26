import type { ProjectAnswers } from "../../types.js";
import { contentful } from "./contentful.js";
import { prismic } from "./prismic.js";
import type { CmsAdapter } from "./types.js";

const ADAPTERS: Record<CmsAdapter["id"], CmsAdapter> = { contentful, prismic };

/** The project's CMS adapter, or undefined when content lives in code. */
export const getCms = (a: ProjectAnswers): CmsAdapter | undefined =>
  a.cms === "none" ? undefined : ADAPTERS[a.cms];

/** The generated paths as inline code, e.g. "`src/contentful/types/`". */
export const listGeneratedPaths = (cms: CmsAdapter): string =>
  cms.generatedPaths.map((generated) => `\`${generated}\``).join(" and ");

/**
 * What the root layout adds for previews, with imports split so each lands
 * where Biome sorts it: packages at the top, `src/` modules before the CSS.
 */
export const getLayoutPreview = (a: ProjectAnswers) => {
  const layout = getCms(a)?.preview.layout;
  const imports = layout?.imports ?? [];
  const lines = (local: boolean) =>
    imports
      .filter((line) => line.includes('from "src/') === local)
      .map((line) => `${line}\n`)
      .join("");

  return {
    element: layout ? `      ${layout.element}\n` : "",
    localImports: lines(true),
    packageImports: lines(false),
  };
};

/** True when pages come from a CMS (draft mode, CMS routes in the sitemap and [slug]). */
export const usesCms = (a: ProjectAnswers): boolean => a.cms !== "none";
