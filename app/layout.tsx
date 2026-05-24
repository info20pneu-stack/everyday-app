import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "./components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL('https://everyday-app.vercel.app'),
  title: "EVERY DAY | Time, Weather, Sports, Converter and More",
  description: "Everything you need every day: world clocks, weather, sports, converters, countdowns and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
