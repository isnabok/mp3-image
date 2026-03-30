import { evaluate } from "@mdx-js/mdx";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import * as runtime from "react/jsx-runtime";

import { getAllContentPages, getContentPageBySlug } from "@/lib/content";
import { siteMessages } from "@/lib/i18n";
import { buildAbsoluteUrl, siteConfig } from "@/lib/site";
import {
  getBreadcrumbStructuredData,
  getPageStructuredData,
} from "@/lib/structured-data";
import { useMDXComponents } from "@/mdx-components";

export const dynamicParams = false;

type ContentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const pages = await getAllContentPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getContentPageBySlug(slug);

  if (!page) {
    return {};
  }

  const pageUrl = page.canonical ?? buildAbsoluteUrl(`/${page.slug}`);
  const openGraphType = page.schemaType === "Article" ? "article" : "website";

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: page.canonical ?? `/${page.slug}`,
    },
    openGraph: {
      type: openGraphType,
      locale: siteConfig.locale,
      url: pageUrl,
      siteName: siteConfig.name,
      title: page.title,
      description: page.description,
      section: page.section,
      publishedTime: page.publishedTime,
      modifiedTime: page.modifiedTime,
      images: [
        {
          url: buildAbsoluteUrl(siteConfig.socialImagePath),
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [buildAbsoluteUrl(siteConfig.twitterImagePath)],
    },
    robots: page.noindex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

async function renderMdx(source: string): Promise<ReactElement> {
  const module = await evaluate(source, {
    ...runtime,
    useMDXComponents,
  });

  const Content = module.default;
  return <Content />;
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { slug } = await params;
  const page = await getContentPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const content = await renderMdx(page.body);
  const breadcrumbStructuredData = getBreadcrumbStructuredData(page);
  const pageStructuredData = getPageStructuredData(page);

  return (
    <main className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top,var(--hero-orb),transparent_30%),var(--background)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageStructuredData),
        }}
      />

      <section className="relative py-10 md:py-14">
        <div className="container-shell">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <span aria-hidden="true">&lt;</span>
              {siteMessages.content.backToEditor}
            </Link>

            <nav
              aria-label={siteMessages.content.breadcrumbs}
              className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]"
            >
              <Link href="/" className="transition hover:text-[var(--accent)]">
                {siteMessages.content.home}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-[var(--foreground)]">{page.title}</span>
            </nav>

            <article className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_48px_var(--surface-shadow)] md:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                {siteMessages.header.eyebrow}
              </p>
              <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[var(--foreground)] md:text-[2.75rem]">
                {page.title}
              </h1>
              <p className="mt-3 max-w-2xl text-[0.8rem] leading-5 text-[var(--muted)]">
                {page.description}
              </p>

              <div className="mt-6 space-y-4">{content}</div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
