import type { MDXComponents } from "mdx/types";

function mergeClasses(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    h1: ({ className, ...props }) => (
      <h1
        className={mergeClasses(
          "text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-4xl",
          className,
        )}
        {...props}
      />
    ),
    h2: ({ className, ...props }) => (
      <h2
        className={mergeClasses(
          "mt-10 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-[1.8rem]",
          className,
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        className={mergeClasses(
          "mt-8 text-xl font-semibold tracking-[-0.02em] text-[var(--foreground)]",
          className,
        )}
        {...props}
      />
    ),
    p: ({ className, ...props }) => (
      <p
        className={mergeClasses("text-base leading-8 text-[var(--muted)]", className)}
        {...props}
      />
    ),
    ul: ({ className, ...props }) => (
      <ul
        className={mergeClasses("list-disc space-y-3 pl-6 text-[var(--muted)]", className)}
        {...props}
      />
    ),
    ol: ({ className, ...props }) => (
      <ol
        className={mergeClasses("list-decimal space-y-3 pl-6 text-[var(--muted)]", className)}
        {...props}
      />
    ),
    li: ({ className, ...props }) => (
      <li className={mergeClasses("leading-8", className)} {...props} />
    ),
    a: ({ className, ...props }) => (
      <a
        className={mergeClasses(
          "font-medium text-[var(--accent)] underline underline-offset-4 transition hover:text-[var(--accent-strong)]",
          className,
        )}
        {...props}
      />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={mergeClasses(
          "border-l-2 border-[var(--accent)] pl-5 italic text-[var(--foreground)]",
          className,
        )}
        {...props}
      />
    ),
    pre: ({ className, ...props }) => (
      <pre
        className={mergeClasses(
          "overflow-x-auto rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--foreground)]",
          className,
        )}
        {...props}
      />
    ),
    code: ({ className, ...props }) => (
      <code
        className={mergeClasses(
          "rounded-md bg-[var(--surface-soft)] px-1.5 py-0.5 text-[0.92em] text-[var(--foreground)]",
          className,
        )}
        {...props}
      />
    ),
    ...components,
  };
}
