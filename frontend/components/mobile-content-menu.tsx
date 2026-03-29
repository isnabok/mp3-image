"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { ContentLinkItem } from "@/components/content-links";
import { siteMessages } from "@/lib/i18n";

type MobileContentMenuProps = {
  pages: ContentLinkItem[];
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M4 12h16" strokeLinecap="round" />
      <path d="M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M6 6 18 18" strokeLinecap="round" />
      <path d="M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function MobileContentMenu({ pages }: MobileContentMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (pages.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label={siteMessages.content.openMenu}
        title={siteMessages.content.openMenu}
        onClick={() => setIsOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)] shadow-[0_12px_28px_var(--surface-shadow)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-soft)] hover:text-[var(--accent)] lg:hidden"
      >
        <MenuIcon />
      </button>

      {isMounted && isOpen
        ? createPortal(
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={siteMessages.content.closeMenu}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-[min(22rem,100vw)] flex-col border-l border-[var(--border)] bg-[var(--surface)] p-5 shadow-[-24px_0_48px_var(--surface-shadow)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                  {siteMessages.content.menuTitle}
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                  {siteMessages.header.title}
                </p>
              </div>

              <button
                type="button"
                aria-label={siteMessages.content.closeMenu}
                title={siteMessages.content.closeMenu}
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="mt-6 flex flex-1 flex-col gap-2 overflow-y-auto">
              {pages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {page.title}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
          ,
          document.body,
        )
        : null}
    </>
  );
}
