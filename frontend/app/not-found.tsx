import Link from "next/link";

import { siteMessages } from "@/lib/i18n";

export default function NotFoundPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,var(--hero-orb),transparent_30%),var(--background)]">
      <section className="relative flex min-h-screen items-center py-10">
        <div className="container-shell">
          <div className="mx-auto max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[0_20px_48px_var(--surface-shadow)] md:p-10">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">404</p>
            <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.04em] text-[var(--foreground)] md:text-[2.6rem]">
              Page not found
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
              This page does not exist or may have been moved. You can return to the main editor
              and continue working with your MP3 files.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-3.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_16px_32px_var(--accent-glow)] transition hover:translate-y-[-1px]"
              >
                {siteMessages.content.home}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
