"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { siteMessages } from "@/lib/i18n";

const CONSENT_COOKIE_NAME = "site_cookie_consent";
const CONSENT_COOKIE_VALUE = "accepted";
const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

function hasCookieConsent(): boolean {
  if (typeof document === "undefined") {
    return true;
  }

  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === `${CONSENT_COOKIE_NAME}=${CONSENT_COOKIE_VALUE}`);
}

function persistCookieConsent() {
  document.cookie = `${CONSENT_COOKIE_NAME}=${CONSENT_COOKIE_VALUE}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!hasCookieConsent());
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-5xl rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_20px_48px_var(--surface-shadow)] backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
              {siteMessages.cookies.bannerTitle}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--foreground)] sm:text-base">
              {siteMessages.cookies.bannerText}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/cookies"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {siteMessages.cookies.learnMore}
            </Link>
            <button
              type="button"
              onClick={() => {
                persistCookieConsent();
                setIsVisible(false);
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_16px_32px_var(--accent-glow)] transition hover:translate-y-[-1px]"
            >
              {siteMessages.cookies.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
