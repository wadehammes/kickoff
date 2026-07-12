import type { ProjectAnswers } from "../types.js";

// ---------------------------------------------------------------------------
// src/lib/schema.ts
// ---------------------------------------------------------------------------

export const getSchema = (a: ProjectAnswers): string => {
  return `import type {
  BreadcrumbList,
  Graph,
  ItemList,
  Organization,
  Person,
  Thing,
  VideoObject,
  WebPage,
} from "schema-dts";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function createOrganizationSchema(
  name = "${a.siteName}",
): Organization {
  return {
    "@type": "Organization",
    name,
  };
}

export function createBreadcrumbSchema(
  items: BreadcrumbItem[],
): BreadcrumbList {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index,
      name: item.name,
      item: item.url,
    })),
  };
}

export function createPersonSchema({
  name,
  description,
  jobTitle,
  url,
  worksFor,
  image,
}: {
  name: string;
  description?: string;
  jobTitle?: string;
  url?: string;
  worksFor?: Organization;
  image?: string;
}): Person {
  const schema: Person = {
    "@type": "Person",
    name,
  };

  if (description) {
    schema.description = description;
  }

  if (jobTitle) {
    schema.jobTitle = jobTitle;
  }

  if (url) {
    schema.url = url;
  }

  if (worksFor) {
    schema.worksFor = worksFor;
  }

  if (image) {
    schema.image = image;
  }

  return schema;
}

export function createVideoObjectSchema({
  name,
  description,
  contentUrl,
  embedUrl,
  uploadDate,
  datePublished,
  dateModified,
  publisher,
  creator,
  url,
}: {
  name: string;
  description?: string;
  contentUrl: string;
  embedUrl?: string;
  uploadDate?: string;
  datePublished?: string;
  dateModified?: string;
  publisher?: Organization;
  creator?: Person;
  url?: string;
}): VideoObject {
  const schema: VideoObject = {
    "@type": "VideoObject",
    name,
    contentUrl,
  };

  if (description) schema.description = description;
  if (embedUrl) schema.embedUrl = embedUrl;
  if (uploadDate) schema.uploadDate = uploadDate;
  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;
  if (publisher) schema.publisher = publisher;
  if (creator) schema.creator = creator;
  if (url) schema.url = url;

  return schema;
}

export function createVideoListSchema({
  name,
  description,
  items,
}: {
  name: string;
  description?: string;
  items: VideoObject[];
}): ItemList {
  const schema: ItemList = {
    "@type": "ItemList",
    name,
    itemListElement: items.map((video, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: video,
    })),
  };

  if (description) {
    schema.description = description;
  }

  return schema;
}

export function createWebPageSchema({
  url,
  name,
  description,
  datePublished,
  dateModified,
  breadcrumb,
  publisher,
  video,
}: {
  url: string;
  name: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumb?: BreadcrumbList;
  publisher?: Organization;
  video?: VideoObject;
}): WebPage {
  const schema: WebPage = {
    "@type": "WebPage",
    "@id": url,
    url,
    name,
  };

  if (description) schema.description = description;
  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;
  if (breadcrumb) schema.breadcrumb = breadcrumb;
  if (publisher) schema.publisher = publisher;
  if (video) schema.video = video;

  return schema;
}

export function createSchemaGraph(schemas: Thing[]): Graph {
  return {
    "@context": "https://schema.org",
    "@graph": schemas,
  };
}
`;
};

// ---------------------------------------------------------------------------
// src/lib/generateSitemap.ts
// ---------------------------------------------------------------------------

export const getGenerateSitemap = (a: ProjectAnswers): string => {
  return `import fs from "node:fs";

const baseUrl = "${a.prodUrl}";

export interface SitemapItem {
  route: string;
  modTime: string;
}

const generateSitemapItem = ({ route, modTime }: SitemapItem): string => \`
  <url>
    <loc>\${baseUrl}\${route}</loc>
    <xhtml:link rel="alternate" hreflang="x-default" href="\${baseUrl}\${route}" />
    <lastmod>\${modTime}</lastmod>
  </url>
\`;

export const generateSitemap = (
  routes: SitemapItem[],
): string => \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
    \${routes
      .map((route) =>
        generateSitemapItem({
          route: route.route,
          modTime: route.modTime,
        }),
      )
      .join("")}
</urlset>
\`;

export const outputSitemap = (routes: SitemapItem[], filename: string) => {
  if (!routes || !filename) {
    return console.error("Missing routes or filename");
  }

  const sitemap = generateSitemap(routes);

  fs.writeFileSync(\`./public/generated-sitemap-\${filename}.xml\`, sitemap);
};
`;
};
