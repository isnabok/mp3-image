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
          "mt-6 text-[1.2rem] font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-[1.4rem]",
          className,
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        className={mergeClasses(
          "mt-5 text-[1.2rem] font-semibold tracking-[-0.02em] text-[var(--foreground)] md:text-[1.3rem]",
          className,
        )}
        {...props}
      />
    ),
    h4: ({ className, ...props }) => (
      <h4
        className={mergeClasses(
          "mt-4 text-[1.02rem] font-semibold tracking-[-0.01em] text-[var(--foreground)] md:text-[1.08rem]",
          className,
        )}
        {...props}
      />
    ),
    p: ({ className, ...props }) => (
      <p
        className={mergeClasses("text-[0.8rem] leading-6 text-[var(--muted)]", className)}
        {...props}
      />
    ),
    ul: ({ className, ...props }) => (
      <ul
        className={mergeClasses(
          "list-disc space-y-0 pl-6 text-[0.8rem] text-[var(--muted)]",
          className,
        )}
        {...props}
      />
    ),
    ol: ({ className, ...props }) => (
      <ol
        className={mergeClasses(
          "list-decimal space-y-0 pl-6 text-[0.8rem] text-[var(--muted)]",
          className,
        )}
        {...props}
      />
    ),
    li: ({ className, ...props }) => (
      <li className={mergeClasses("leading-5", className)} {...props} />
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
