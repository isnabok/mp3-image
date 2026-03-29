import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { siteMessages } from "@/lib/i18n";
import { buildAbsoluteUrl, siteConfig } from "@/lib/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  applicationName: siteConfig.name,
  title: {
    default: siteMessages.meta.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteMessages.meta.description,
  referrer: "origin-when-cross-origin",
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  category: siteConfig.category,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    title: siteMessages.meta.title,
    description: siteMessages.meta.description,
    images: [
      {
        url: buildAbsoluteUrl(siteConfig.socialImagePath),
        width: 1200,
        height: 630,
        alt: siteMessages.meta.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMessages.meta.title,
    description: siteMessages.meta.description,
    images: [buildAbsoluteUrl(siteConfig.twitterImagePath)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5fbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#070a0c" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={siteMessages.lang}
      suppressHydrationWarning
      className={`${geist.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
