import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { cache } from "react";

export type ContentFrontmatter = {
  title: string;
  menuTitle?: string;
  description: string;
  slug: string;
  order?: number;
  canonical?: string;
  noindex?: boolean;
  navigation?: "header" | "footer" | "both" | "none";
  keywords?: string[];
  section?: string;
  publishedTime?: string;
  modifiedTime?: string;
  schemaType?: "WebPage" | "Article" | "FAQPage";
  faq?: Array<{
    question: string;
    answer: string;
  }>;
};

export type ContentPage = ContentFrontmatter & {
  body: string;
  filepath: string;
};

export type HomeContentFrontmatter = {
  title: string;
  description: string;
  keywords?: string[];
  section?: string;
  schemaType?: "WebPage" | "FAQPage";
  faq?: Array<{
    question: string;
    answer: string;
  }>;
};

export type HomeContent = HomeContentFrontmatter & {
  body: string;
  filepath: string;
};

export type ContentNavigationPage = {
  slug: string;
  title: string;
};

export type ContentNavigationPosition = "header" | "footer";

const CONTENT_DIR = path.join(process.cwd(), "content", "pages");
const HOME_CONTENT_FILE = path.join(process.cwd(), "content", "home.mdx");

function isValidFrontmatter(data: unknown): data is ContentFrontmatter {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.title === "string" &&
    (candidate.menuTitle === undefined || typeof candidate.menuTitle === "string") &&
    typeof candidate.description === "string" &&
    typeof candidate.slug === "string" &&
    (candidate.order === undefined || typeof candidate.order === "number") &&
    (candidate.canonical === undefined || typeof candidate.canonical === "string") &&
    (candidate.noindex === undefined || typeof candidate.noindex === "boolean") &&
    (candidate.navigation === undefined ||
      candidate.navigation === "header" ||
      candidate.navigation === "footer" ||
      candidate.navigation === "both" ||
      candidate.navigation === "none") &&
    (candidate.keywords === undefined ||
      (Array.isArray(candidate.keywords) &&
        candidate.keywords.every((keyword) => typeof keyword === "string"))) &&
    (candidate.section === undefined || typeof candidate.section === "string") &&
    (candidate.publishedTime === undefined || typeof candidate.publishedTime === "string") &&
    (candidate.modifiedTime === undefined || typeof candidate.modifiedTime === "string") &&
    (candidate.schemaType === undefined ||
      candidate.schemaType === "WebPage" ||
      candidate.schemaType === "Article" ||
      candidate.schemaType === "FAQPage") &&
    (candidate.faq === undefined ||
      (Array.isArray(candidate.faq) &&
        candidate.faq.every(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof (item as Record<string, unknown>).question === "string" &&
            typeof (item as Record<string, unknown>).answer === "string",
        )))
  );
}

function normalizeFrontmatter(data: unknown, filepath: string): ContentFrontmatter {
  if (!isValidFrontmatter(data)) {
    throw new Error(
      `Invalid frontmatter in "${filepath}". Required fields: title, description, slug.`,
    );
  }

  return {
    title: data.title.trim(),
    menuTitle: data.menuTitle?.trim() || undefined,
    description: data.description.trim(),
    slug: data.slug.trim(),
    order: data.order,
    canonical: data.canonical?.trim() || undefined,
    noindex: data.noindex,
    navigation: data.navigation ?? "both",
    keywords: data.keywords?.map((keyword) => keyword.trim()).filter(Boolean) ?? undefined,
    section: data.section?.trim() || undefined,
    publishedTime: data.publishedTime?.trim() || undefined,
    modifiedTime: data.modifiedTime?.trim() || undefined,
    schemaType: data.schemaType ?? (data.publishedTime ? "Article" : "WebPage"),
    faq:
      data.faq?.map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      })) ?? undefined,
  };
}

function isValidHomeFrontmatter(data: unknown): data is HomeContentFrontmatter {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    (candidate.keywords === undefined ||
      (Array.isArray(candidate.keywords) &&
        candidate.keywords.every((keyword) => typeof keyword === "string"))) &&
    (candidate.section === undefined || typeof candidate.section === "string") &&
    (candidate.schemaType === undefined ||
      candidate.schemaType === "WebPage" ||
      candidate.schemaType === "FAQPage") &&
    (candidate.faq === undefined ||
      (Array.isArray(candidate.faq) &&
        candidate.faq.every(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof (item as Record<string, unknown>).question === "string" &&
            typeof (item as Record<string, unknown>).answer === "string",
        )))
  );
}

function normalizeHomeFrontmatter(data: unknown, filepath: string): HomeContentFrontmatter {
  if (!isValidHomeFrontmatter(data)) {
    throw new Error(
      `Invalid frontmatter in "${filepath}". Required fields: title and description.`,
    );
  }

  return {
    title: data.title.trim(),
    description: data.description.trim(),
    keywords: data.keywords?.map((keyword) => keyword.trim()).filter(Boolean) ?? undefined,
    section: data.section?.trim() || undefined,
    schemaType: data.schemaType ?? "WebPage",
    faq:
      data.faq?.map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      })) ?? undefined,
  };
}

async function readContentFile(filepath: string): Promise<ContentPage> {
  const fileContents = await fs.readFile(filepath, "utf8");
  const { content, data } = matter(fileContents);
  const frontmatter = normalizeFrontmatter(data, filepath);

  return {
    ...frontmatter,
    body: content,
    filepath,
  };
}

async function readHomeContentFile(filepath: string): Promise<HomeContent> {
  const fileContents = await fs.readFile(filepath, "utf8");
  const { content, data } = matter(fileContents);
  const frontmatter = normalizeHomeFrontmatter(data, filepath);

  return {
    ...frontmatter,
    body: content,
    filepath,
  };
}

export const getAllContentPages = cache(async (): Promise<ContentPage[]> => {
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  const mdxFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"));

  const pages = await Promise.all(
    mdxFiles.map((entry) => readContentFile(path.join(CONTENT_DIR, entry.name))),
  );

  return pages.sort((left, right) => {
    const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.title.localeCompare(right.title);
  });
});

export const getContentPageBySlug = cache(async (slug: string): Promise<ContentPage | null> => {
  const pages = await getAllContentPages();
  return pages.find((page) => page.slug === slug) ?? null;
});

export const getContentNavigationPages = cache(
  async (position: ContentNavigationPosition): Promise<ContentNavigationPage[]> => {
  const pages = await getAllContentPages();

  return pages
    .filter((page) => {
      if (page.noindex || page.navigation === "none") {
        return false;
      }

      return page.navigation === "both" || page.navigation === position;
    })
    .map((page) => ({
      slug: page.slug,
      title: page.menuTitle ?? page.title,
    }));
  },
);

export const getHomeContent = cache(async (): Promise<HomeContent> => {
  return readHomeContentFile(HOME_CONTENT_FILE);
});
