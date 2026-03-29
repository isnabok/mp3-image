import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { siteMessages } from "@/lib/i18n";
import { buildAbsoluteUrl, siteConfig } from "@/lib/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const googleSiteVerification = process.env.SITE_VERIFICATION_GOOGLE?.trim() || undefined;
const bingSiteVerification = process.env.SITE_VERIFICATION_BING?.trim() || undefined;
const googleAnalyticsId = process.env.GOOGLE_ANALYTICS_ID?.trim() || undefined;

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
  verification: {
    google: googleSiteVerification,
    other: bingSiteVerification
      ? {
          "msvalidate.01": bingSiteVerification,
        }
      : undefined,
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
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsentBanner />
        {googleAnalyticsId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}');
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
