import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import Currency from '../../components/Currency';

const PAIRS: Record<string, { from: string; to: string; fromName: string; toName: string }> = {
  'usd-eur': { from: 'USD', to: 'EUR', fromName: 'US Dollar',       toName: 'Euro' },
  'usd-gbp': { from: 'USD', to: 'GBP', fromName: 'US Dollar',       toName: 'British Pound' },
  'usd-jpy': { from: 'USD', to: 'JPY', fromName: 'US Dollar',       toName: 'Japanese Yen' },
  'usd-cad': { from: 'USD', to: 'CAD', fromName: 'US Dollar',       toName: 'Canadian Dollar' },
  'usd-aud': { from: 'USD', to: 'AUD', fromName: 'US Dollar',       toName: 'Australian Dollar' },
  'usd-chf': { from: 'USD', to: 'CHF', fromName: 'US Dollar',       toName: 'Swiss Franc' },
  'usd-cny': { from: 'USD', to: 'CNY', fromName: 'US Dollar',       toName: 'Chinese Yuan' },
  'usd-inr': { from: 'USD', to: 'INR', fromName: 'US Dollar',       toName: 'Indian Rupee' },
  'usd-czk': { from: 'USD', to: 'CZK', fromName: 'US Dollar',       toName: 'Czech Koruna' },
  'usd-brl': { from: 'USD', to: 'BRL', fromName: 'US Dollar',       toName: 'Brazilian Real' },
  'usd-mxn': { from: 'USD', to: 'MXN', fromName: 'US Dollar',       toName: 'Mexican Peso' },
  'usd-sgd': { from: 'USD', to: 'SGD', fromName: 'US Dollar',       toName: 'Singapore Dollar' },
  'usd-hkd': { from: 'USD', to: 'HKD', fromName: 'US Dollar',       toName: 'Hong Kong Dollar' },
  'usd-krw': { from: 'USD', to: 'KRW', fromName: 'US Dollar',       toName: 'South Korean Won' },
  'eur-usd': { from: 'EUR', to: 'USD', fromName: 'Euro',             toName: 'US Dollar' },
  'eur-gbp': { from: 'EUR', to: 'GBP', fromName: 'Euro',             toName: 'British Pound' },
  'eur-czk': { from: 'EUR', to: 'CZK', fromName: 'Euro',             toName: 'Czech Koruna' },
  'eur-jpy': { from: 'EUR', to: 'JPY', fromName: 'Euro',             toName: 'Japanese Yen' },
  'gbp-usd': { from: 'GBP', to: 'USD', fromName: 'British Pound',   toName: 'US Dollar' },
  'gbp-eur': { from: 'GBP', to: 'EUR', fromName: 'British Pound',   toName: 'Euro' },
};

export function generateStaticParams() {
  return Object.keys(PAIRS).map(pair => ({ pair }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ pair: string }> }
): Promise<Metadata> {
  const { pair } = await params;
  const p = PAIRS[pair];
  if (!p) {
    return { title: 'Currency Exchange | EVERY DAY' };
  }
  const title = `${p.from} to ${p.to} Exchange Rate | EVERY DAY`;
  const description = `Live ${p.fromName} to ${p.toName} (${p.from}/${p.to}) exchange rate. Convert any amount instantly.`;
  return {
    title,
    description,
    alternates: { canonical: `/currency/${pair}` },
    openGraph: {
      title,
      description,
      url: `https://everyday-app.vercel.app/currency/${pair}`,
      siteName: 'EVERY DAY',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default async function CurrencyPairPage(
  { params }: { params: Promise<{ pair: string }> }
) {
  const { pair } = await params;
  const p = PAIRS[pair];

  return (
    <PageShell>
      {p && (
        <div style={{
          background: 'rgba(15,20,40,0.92)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ fontSize: '28px' }}>💱</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', fontFamily: 'Poppins' }}>
              {p.from} → {p.to}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
              {p.fromName} to {p.toName}
            </div>
          </div>
        </div>
      )}
      <Currency />
    </PageShell>
  );
}
