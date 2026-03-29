import en from "@/messages/en.json";
import ru from "@/messages/ru.json";

export type Messages = typeof ru;
export type Locale = "en" | "ru";

const dictionaries = {
  en,
  ru,
} satisfies Record<Locale, Messages>;

const DEFAULT_LOCALE: Locale = "en";

function isLocale(value: string): value is Locale {
  return value === "en" || value === "ru";
}

export function normalizeLocale(value?: string | null): Locale {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const normalized = value.toLowerCase().split(/[-_]/)[0];
  return isLocale(normalized) ? normalized : DEFAULT_LOCALE;
}

export function getMessages(locale?: string | null): Messages {
  return dictionaries[normalizeLocale(locale)];
}

export const siteLocale = normalizeLocale(process.env.NEXT_PUBLIC_SITE_LOCALE);
export const siteMessages = getMessages(siteLocale);

export function formatMessage(
  template: string,
  values: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}
