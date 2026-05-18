import type { ProjectAnswers } from "../types.js";

// ---------------------------------------------------------------------------
// public/sitemap-index.xml
// ---------------------------------------------------------------------------

export const getSitemapIndex = (a: ProjectAnswers): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${a.prodUrl}/generated-sitemap-pages.xml</loc>
  </sitemap>
</sitemapindex>
`;
};
