import type { ProjectAnswers } from "../../types.js";
import { contentful } from "./contentful.js";
import { prismic } from "./prismic.js";
import type { CmsAdapter } from "./types.js";

const ADAPTERS: Record<CmsAdapter["id"], CmsAdapter> = { contentful, prismic };

/** The project's CMS adapter, or undefined when content lives in code. */
export const getCms = (a: ProjectAnswers): CmsAdapter | undefined =>
  a.cms === "none" ? undefined : ADAPTERS[a.cms];

/** The generated paths as inline code, e.g. "`src/contentful/types/`". */
export const listGeneratedPaths = (cms: CmsAdapter): string => {
  const paths = cms.generatedPaths.map((generated) => `\`${generated}\``);

  return paths.length < 3
    ? paths.join(" and ")
    : `${paths.slice(0, -1).join(", ")}, and ${paths.at(-1)}`;
};

/** What the root layout adds for previews: its imports and the element. */
export const getLayoutPreview = (a: ProjectAnswers) => {
  const layout = getCms(a)?.preview.layout;

  return {
    element: layout ? `      ${layout.element}\n` : "",
    imports: layout?.imports ?? [],
  };
};

/** True when pages come from a CMS (draft mode, CMS routes in the sitemap and [slug]). */
export const usesCms = (a: ProjectAnswers): boolean => a.cms !== "none";
