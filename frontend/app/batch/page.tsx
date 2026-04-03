import type { Metadata } from "next";

import { BatchEditor } from "@/components/batch-editor";
import { HomeContentSection } from "@/components/home-content-section";
import { getContentNavigationPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Batch MP3 Editor",
  description:
    "Upload multiple MP3 files, edit each track in its own expandable card, and save updated files one by one.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function BatchPage() {
  const headerPages = [
    {
      slug: "batch",
      title: "Batch",
    },
    ...(await getContentNavigationPages("header")).filter((page) => page.slug !== "batch"),
  ];
  const footerPages = await getContentNavigationPages("footer");

  return (
    <BatchEditor headerPages={headerPages} footerPages={footerPages}>
      <HomeContentSection
        title="Why Use Batch MP3 Editor"
        description="Batch mode helps when you want to process several MP3 files in one session, keep each track in its own card, and work through metadata updates without leaving the page."
      >
        <p className="text-[0.8rem] leading-5 text-[var(--muted)]">
          Use the batch editor to upload multiple MP3 files at once, inspect the queue, and open only
          the cards you want to edit right now. Each file keeps its own metadata form, cover controls,
          player, and save action, so the workflow stays clear even with a larger set of tracks.
        </p>
        <h2 className="mt-6 text-[1.2rem] font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-[1.4rem]">
          What Batch Mode Does
        </h2>
        <ul className="list-disc space-y-1 pl-6 text-[0.8rem] leading-5 text-[var(--muted)]">
          <li>load several MP3 files into one queue</li>
          <li>open each track in its own expandable editing card</li>
          <li>update title, artist, album, year, genre, track, comment, and filename independently</li>
          <li>replace or remove cover art per file</li>
          <li>save and download each updated MP3 one by one</li>
        </ul>
        <h2 className="mt-6 text-[1.2rem] font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-[1.4rem]">
          Why This Flow Helps
        </h2>
        <p className="text-[0.8rem] leading-5 text-[var(--muted)]">
          The single-file editor is still the fastest path for quick changes, while batch mode is better
          when you are reviewing several files in one pass. It keeps the editing state separated by card,
          which makes it easier to work carefully through a queue without mixing files together.
        </p>
      </HomeContentSection>
    </BatchEditor>
  );
}
