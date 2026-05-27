import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import Weather from '../components/Weather';

export const metadata: Metadata = {
  title: 'Weather Forecast | EVERY DAY',
  description: 'Current weather conditions and 7-day forecast for any city. Temperature, humidity, wind speed and precipitation.',
  alternates: { canonical: '/weather' },
  openGraph: {
    title: 'Weather Forecast | EVERY DAY',
    description: 'Current weather and 7-day forecast — temperature, humidity, wind and precipitation.',
    url: 'https://everyday-app.vercel.app/weather',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weather Forecast | EVERY DAY',
    description: 'Current weather and 7-day forecast for any city.',
    images: ['/og-image.png'],
  },
};

export default function WeatherPage() {
  return (
    <PageShell>
      <Weather />
    </PageShell>
  );
}
