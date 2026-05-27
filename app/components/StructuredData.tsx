const BASE = 'https://everyday-app.vercel.app';

export default function StructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE}/#website`,
        name: 'EVERY DAY',
        url: BASE,
        description: 'Everything you need every day: world clocks, weather, sports, converters, countdowns and more.',
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${BASE}/?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${BASE}/#webapp`,
        name: 'EVERY DAY',
        url: BASE,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        description: 'Everything you need every day: world clocks, weather, sports, converters, countdowns and more.',
        inLanguage: 'en',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: [
          'World Time Clocks',
          'Weather Forecast',
          'Cryptocurrency Prices',
          'Currency Exchange Rates',
          'Sports Scores',
          'Market Indices & Forex',
          'BMI Calculator',
          'Age Calculator',
          'Unit Converter',
          'Date Counter',
          'Password Generator',
          'Internet Speed Test',
          'Daily Games',
          'Daily Boost',
          'Sunrise & Sunset Times',
        ],
        screenshot: `${BASE}/og-image.png`,
        image: `${BASE}/og-image.png`,
      },
      {
        '@type': 'Organization',
        '@id': `${BASE}/#organization`,
        name: 'EVERY DAY',
        url: BASE,
        logo: { '@type': 'ImageObject', url: `${BASE}/icons/icon-192.png` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
