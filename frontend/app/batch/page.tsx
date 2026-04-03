import type { Metadata } from "next";

import { BatchEditor } from "@/components/batch-editor";
import { getContentNavigationPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Batch MP3 Editor Prototype",
  description:
    "Frontend prototype for batch MP3 uploads with accordion-based editing cards and per-file controls.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BatchPage() {
  const headerPages = await getContentNavigationPages("header");
  const footerPages = await getContentNavigationPages("footer");

  return <BatchEditor headerPages={headerPages} footerPages={footerPages} />;
}
