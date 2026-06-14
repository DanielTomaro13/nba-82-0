import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import SisterSites from "@/components/SisterSites";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import AdUnit from "@/components/AdUnit";
import { AD_CLIENT, AD_SLOTS } from "@/lib/ads";
import { SITE } from "@/lib/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // draw into the notch / dynamic island
  themeColor: "#0b0b10",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "NBA 82-0 — Build the perfect all-time NBA team",
    template: "%s — NBA 82-0",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "NBA", "NBA game", "basketball game", "NBA team builder", "all-time NBA team",
    "82-0", "perfect season", "NBA fantasy", "NBA trivia", "basketball quiz",
    "NBA legends", "NBA MVP", "NBA ladder", "NBA stats", "Hoople NBA",
  ],
  authors: [{ name: "Daniel Tomaro" }],
  alternates: { canonical: "/" },
  // AdSense site verification — Google's crawler looks for this meta tag.
  other: { "google-adsense-account": "ca-pub-2087141992057731" },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: "NBA 82-0 — Build the perfect all-time NBA team",
    description: SITE.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NBA 82-0 — Build the perfect all-time NBA team",
    description: SITE.description,
    site: SITE.twitter,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  appleWebApp: {
    capable: true,
    title: "NBA 82-0",
    statusBarStyle: "black-translucent",
  },
  // Stop iOS Safari from auto-linking stat numbers / dates as phone numbers.
  formatDetection: { telephone: false, date: false, address: false, email: false },
  manifest: "/manifest.webmanifest",
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "en-US",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/players?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};
const appLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  inLanguage: "en-US",
};
const orgEntityLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/icon.svg`,
  description: SITE.tagline,
  sameAs: [
    "https://afl23-0.com",
    "https://nrl24-0.com",
    "https://mlb162-0.com",
    "https://footballinvincibles.com",
    "https://f1slam.com",
    "https://twitter.com/nba820",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body>
        <SisterSites active="nba" />
        <SiteHeader />
        <main className="container-x" style={{ paddingTop: "1.5rem", minHeight: "60vh" }}>
          {children}
        </main>
        <div className="container-x">
          <AdUnit slot={AD_SLOTS.inline} />
        </div>
        <SiteFooter />
        <JsonLd data={orgLd} />
        <JsonLd data={appLd} />
        <JsonLd data={orgEntityLd} />
        {/* Google AdSense loader — literal async <script> so React hoists it into
            <head>; this is the exact tag AdSense's crawler looks for to verify. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
          crossOrigin="anonymous"
        />
        {/* Cloudflare Web Analytics — privacy-friendly, no cookies */}
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon='{"token": "d59a007182594e61a9820fdbc5f6f742"}'
        />
      </body>
    </html>
  );
}
