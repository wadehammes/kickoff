import type { ProjectAnswers } from "../../types.js";
import { contentful } from "./contentful.js";
import type { CmsAdapter } from "./types.js";

const ADAPTERS: Record<CmsAdapter["id"], CmsAdapter> = { contentful };

/** The project's CMS adapter, or undefined when content lives in code. */
export const getCms = (a: ProjectAnswers): CmsAdapter | undefined =>
  a.cms === "none" ? undefined : ADAPTERS[a.cms];

/** True when pages come from a CMS (draft mode, CMS routes in the sitemap and [slug]). */
export const usesCms = (a: ProjectAnswers): boolean => a.cms !== "none";
