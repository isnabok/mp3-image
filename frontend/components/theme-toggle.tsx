"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";
type ThemeToggleProps = {
  label?: string;
};

const STORAGE_KEY = "mp3-cover-editor-theme";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle({ label = "Toggle theme" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    return savedTheme === "light" ? "light" : "dark";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggle = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={handleToggle}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[0_12px_28px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] dark:shadow-none"
    >
      <svg
        viewBox="0 0 25 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
      >
        <path
          d="M12.0508 16.5C10.8573 16.5 9.71271 16.0259 8.8688 15.182C8.02489 14.3381 7.55078 13.1935 7.55078 12C7.55078 10.8065 8.02489 9.66193 8.8688 8.81802C9.71271 7.97411 10.8573 7.5 12.0508 7.5C13.2443 7.5 14.3888 7.97411 15.2328 8.81802C16.0767 9.66193 16.5508 10.8065 16.5508 12C16.5508 13.1935 16.0767 14.3381 15.2328 15.182C14.3888 16.0259 13.2443 16.5 12.0508 16.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M12.0508 1V3.5M12.0508 20.5V23M23.0508 12H20.5508M3.55078 12H1.05078M19.829 4.22183L18.0612 5.9896M6.04038 18.0104L4.2726 19.7782M19.829 19.7782L18.0612 18.0104M6.04038 5.9896L4.2726 4.22183"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
