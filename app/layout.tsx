import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "./components/Providers";
import Analytics from "./components/Analytics";
import StructuredData from "./components/StructuredData";
import PageLoader from "./components/PageLoader";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.everyday1234567.com'),
  title: "EVERY DAY | Time, Weather, Sports, Converter and More",
  description: "Everything you need every day: world clocks, weather, sports, converters, countdowns and more.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EVERY DAY',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#02040E',
    'msapplication-tap-highlight': 'no',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#02040E" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <PageLoader />
        <Providers>{children}</Providers>
        <StructuredData />
        <Analytics />
        <VercelAnalytics />
      </body>
    </html>
  );
}git add .