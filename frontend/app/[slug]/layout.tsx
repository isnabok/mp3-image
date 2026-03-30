import Link from "next/link";

import { ContentLinks } from "@/components/content-links";
import { MobileContentMenu } from "@/components/mobile-content-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { getContentNavigationPages } from "@/lib/content";
import { siteMessages } from "@/lib/i18n";

export default async function ContentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerPages = await getContentNavigationPages("header");
  const footerPages = await getContentNavigationPages("footer");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header-surface)] backdrop-blur-xl">
        <div className="container-shell flex min-h-[70px] items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] text-[var(--accent-contrast)] shadow-[0_10px_24px_var(--accent-glow)]"
              aria-label={siteMessages.header.title}
            >
              <span className="text-lg font-semibold">♪</span>
            </Link>
            <Link href="/" className="block transition hover:text-[var(--accent)]">
              <p className="text-[0.95rem] font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-[1.15rem]">
                {siteMessages.header.title}
              </p>
              <p className="mt-0.5 text-[0.68rem] text-[var(--muted)] md:text-[0.74rem]">
                {siteMessages.header.subtitle}
              </p>
            </Link>
          </div>

          <div className="flex items-center justify-end gap-3">
            <MobileContentMenu pages={headerPages} />
            <ThemeToggle label={siteMessages.actions.toggleTheme} />
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]/50 py-6">
        <div className="container-shell flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-[var(--muted)]">{siteMessages.footer.text}</p>
          <ContentLinks pages={footerPages} linkClassName="text-xs" />
        </div>
      </footer>
    </div>
  );
}
