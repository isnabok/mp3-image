import type { MetadataRoute } from "next";

import { getAllContentPages } from "@/lib/content";
import { buildAbsoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getAllContentPages();
  const now = new Date();

  const contentEntries = pages
    .filter((page) => !page.noindex)
    .map((page) => ({
      url: page.canonical ?? buildAbsoluteUrl(`/${page.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [
    {
      url: buildAbsoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...contentEntries,
  ];
}
