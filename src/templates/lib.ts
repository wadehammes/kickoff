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

export const createOrganizationSchema = (
  name = "${a.siteName}",
): Organization => {
  return {
    "@type": "Organization",
    name,
  };
};

export const createBreadcrumbSchema = (
  items: BreadcrumbItem[],
): BreadcrumbList => {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index,
      name: item.name,
      item: item.url,
    })),
  };
};

export const createPersonSchema = ({
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
}): Person => {
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
};

export const createVideoObjectSchema = ({
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
}): VideoObject => {
  const schema: VideoObject = {
    "@type": "VideoObject",
    name,
    contentUrl,
  };

  if (description) {
    schema.description = description;
  }

  if (embedUrl) {
    schema.embedUrl = embedUrl;
  }

  if (uploadDate) {
    schema.uploadDate = uploadDate;
  }

  if (datePublished) {
    schema.datePublished = datePublished;
  }

  if (dateModified) {
    schema.dateModified = dateModified;
  }

  if (publisher) {
    schema.publisher = publisher;
  }

  if (creator) {
    schema.creator = creator;
  }

  if (url) {
    schema.url = url;
  }

  return schema;
};

export const createVideoListSchema = ({
  name,
  description,
  items,
}: {
  name: string;
  description?: string;
  items: VideoObject[];
}): ItemList => {
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
};

export const createWebPageSchema = ({
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
}): WebPage => {
  const schema: WebPage = {
    "@type": "WebPage",
    "@id": url,
    url,
    name,
  };

  if (description) {
    schema.description = description;
  }

  if (datePublished) {
    schema.datePublished = datePublished;
  }

  if (dateModified) {
    schema.dateModified = dateModified;
  }

  if (breadcrumb) {
    schema.breadcrumb = breadcrumb;
  }

  if (publisher) {
    schema.publisher = publisher;
  }

  if (video) {
    schema.video = video;
  }

  return schema;
};

export const createSchemaGraph = (schemas: Thing[]): Graph => {
  return {
    "@context": "https://schema.org",
    "@graph": schemas,
  };
};
`;
};
