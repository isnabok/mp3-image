import { siteMessages } from "@/lib/i18n";

const fallbackSiteUrl = "https://tagsmp3.com/";

function normalizeSiteUrl(value?: string | null): string {
  const normalized = value?.trim();

  if (!normalized) {
    return fallbackSiteUrl;
  }

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export const siteConfig = {
  name: siteMessages.header.title,
  shortName: "MP3 Tag Editor",
  description: siteMessages.meta.description,
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: siteMessages.lang === "ru" ? "ru_RU" : "en_US",
  keywords: [
    "mp3 tag editor",
    "id3 editor",
    "mp3 metadata editor",
    "cover art editor",
    "edit mp3 tags",
    "change mp3 cover",
  ] as string[],
  authors: [
    {
      name: siteMessages.header.title,
    },
  ] as Array<{ name: string }>,
  creator: siteMessages.header.title,
  publisher: siteMessages.header.title,
  category: "technology",
  socialImagePath: "/opengraph-image",
  twitterImagePath: "/twitter-image",
};

export function buildAbsoluteUrl(pathname = "/"): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${siteConfig.siteUrl}${normalizedPath}`;
}
