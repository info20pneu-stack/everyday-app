import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://everyday-app.vercel.app'),
  title: "EVERY DAY | Time, Weather, Sports, Converter and More",
  description: "Everything you need every day: world clocks, weather, sports, converters, countdowns and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}