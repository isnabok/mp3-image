import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";

import { HomeContentSection } from "@/components/home-content-section";
import HomeEditor from "@/components/home-editor";
import { getContentNavigationPages, getHomeContent } from "@/lib/content";
import {
  getHomeFaqStructuredData,
  getHomePageStructuredData,
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

export default async function HomePage() {
  const headerPages = [
    {
      slug: "batch",
      title: "Batch",
    },
    ...(await getContentNavigationPages("header")).filter((page) => page.slug !== "batch"),
  ];
  const footerPages = await getContentNavigationPages("footer");
  const homeContent = await getHomeContent();
  const content = await renderMdx(homeContent.body);
  const pageStructuredData = getHomePageStructuredData(homeContent);
  const faqStructuredData = getHomeFaqStructuredData(homeContent);

  return (
    <HomeEditor headerPages={headerPages} footerPages={footerPages}>
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

      <HomeContentSection title={homeContent.title} description={homeContent.description}>
        {content}
      </HomeContentSection>
    </HomeEditor>
  );
}
