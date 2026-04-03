import type { ContentPage, HomeContent, BatchContent } from "@/lib/content";
import { buildAbsoluteUrl, siteConfig } from "@/lib/site";

type JsonLd = Record<string, unknown>;

function getPageUrl(page: ContentPage): string {
  return page.canonical ?? buildAbsoluteUrl(`/${page.slug}`);
}

export function getBreadcrumbStructuredData(page: ContentPage): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: siteConfig.name,
        item: buildAbsoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.title,
        item: getPageUrl(page),
      },
    ],
  };
}

export function getPageStructuredData(page: ContentPage): JsonLd {
  const pageUrl = getPageUrl(page);
  const image = buildAbsoluteUrl(siteConfig.socialImagePath);

  if (page.schemaType === "FAQPage" && page.faq?.length) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };
  }

  if (page.schemaType === "Article") {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.title,
      description: page.description,
      image: [image],
      datePublished: page.publishedTime,
      dateModified: page.modifiedTime ?? page.publishedTime,
      author: siteConfig.authors.map((author) => ({
        "@type": "Organization",
        name: author.name,
      })),
      publisher: {
        "@type": "Organization",
        name: siteConfig.publisher,
      },
      mainEntityOfPage: pageUrl,
      articleSection: page.section,
      inLanguage: siteConfig.locale,
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: pageUrl,
    inLanguage: siteConfig.locale,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
    about: page.section,
  };
}

export function getHomePageStructuredData(home: HomeContent): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: siteConfig.name,
    description: home.description,
    url: buildAbsoluteUrl("/"),
    inLanguage: siteConfig.locale,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
    about: home.section,
  };
}

export function getHomeFaqStructuredData(home: HomeContent): JsonLd | null {
  if (!home.faq?.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: home.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function getBatchPageStructuredData(batch: BatchContent): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: batch.title,
    description: batch.description,
    url: batch.canonical ?? buildAbsoluteUrl("/batch"),
    inLanguage: siteConfig.locale,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
    about: batch.section,
  };
}

export function getBatchFaqStructuredData(batch: BatchContent): JsonLd | null {
  if (!batch.faq?.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: batch.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
