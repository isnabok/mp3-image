import type { Metadata } from "next";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";

import { BatchEditor } from "@/components/batch-editor";
import { HomeContentSection } from "@/components/home-content-section";
import { getBatchContent, getContentNavigationPages } from "@/lib/content";
import { buildAbsoluteUrl, siteConfig } from "@/lib/site";
import {
  getBatchFaqStructuredData,
  getBatchPageStructuredData,
} from "@/lib/structured-data";
import { useMDXComponents } from "@/mdx-components";

async function renderMdx(source: string) {
  const module = await evaluate(source, {
    ...runtime,
    useMDXComponents,
  });

  const Content = module.default;
  return <Content />;
}

export async function generateMetadata(): Promise<Metadata> {
  const batchContent = await getBatchContent();
  const pageUrl = batchContent.canonical ?? buildAbsoluteUrl("/batch");

  return {
    title: batchContent.title,
    description: batchContent.description,
    keywords: batchContent.keywords,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: pageUrl,
      siteName: siteConfig.name,
      title: batchContent.title,
      description: batchContent.description,
      images: [
        {
          url: buildAbsoluteUrl(siteConfig.socialImagePath),
          width: 1200,
          height: 630,
          alt: batchContent.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: batchContent.title,
      description: batchContent.description,
      images: [buildAbsoluteUrl(siteConfig.twitterImagePath)],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BatchPage() {
  const headerPages = [
    {
      slug: "batch",
      title: "Batch",
    },
    ...(await getContentNavigationPages("header")).filter((page) => page.slug !== "batch"),
  ];
  const footerPages = await getContentNavigationPages("footer");
  const batchContent = await getBatchContent();
  const content = await renderMdx(batchContent.body);
  const pageStructuredData = getBatchPageStructuredData(batchContent);
  const faqStructuredData = getBatchFaqStructuredData(batchContent);

  return (
    <BatchEditor headerPages={headerPages} footerPages={footerPages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageStructuredData),
        }}
      />
      {faqStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqStructuredData),
          }}
        />
      ) : null}

      <HomeContentSection title={batchContent.title} description={batchContent.description}>
        {content}
      </HomeContentSection>
    </BatchEditor>
  );
}
