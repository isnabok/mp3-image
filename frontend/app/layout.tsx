import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { siteMessages } from "@/lib/i18n";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteMessages.meta.title,
  description: siteMessages.meta.description,
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
