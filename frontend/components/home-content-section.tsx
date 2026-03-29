import type { ReactNode } from "react";

type HomeContentSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function HomeContentSection({
  title,
  description,
  children,
}: HomeContentSectionProps) {
  return (
    <section className="relative py-6 md:py-8">
      <div className="container-shell">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_48px_var(--surface-shadow)] md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Content</p>
          <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--foreground)] md:text-[2.2rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
            {description}
          </p>

          <div className="mt-8 space-y-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
