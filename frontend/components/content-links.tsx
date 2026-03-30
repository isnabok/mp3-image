import Link from "next/link";

export type ContentLinkItem = {
  slug: string;
  title: string;
};

type ContentLinksProps = {
  pages: ContentLinkItem[];
  className?: string;
  linkClassName?: string;
};

function joinClasses(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function ContentLinks({ pages, className, linkClassName }: ContentLinksProps) {
  if (pages.length === 0) {
    return null;
  }

  return (
    <nav className={joinClasses("flex flex-wrap items-center gap-2", className)}>
      {pages.map((page) => (
        <Link
          key={page.slug}
          href={`/${page.slug}`}
          className={joinClasses(
            "rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2 text-[0.8rem] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]",
            linkClassName,
          )}
        >
          {page.title}
        </Link>
      ))}
    </nav>
  );
}
