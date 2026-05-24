import type { Metadata } from 'next';
import PageShell from '../components/PageShell';

export const metadata: Metadata = {
  title: 'Privacy Policy | EVERY DAY',
  description: 'Privacy Policy for EVERY DAY — how we collect, use and protect your data, including cookies and Google AdSense.',
};

const S = {
  card: {
    background: 'rgba(15,20,40,0.92)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px' as const,
    padding: '2rem',
  } as React.CSSProperties,
  h1: {
    fontFamily: 'Poppins, sans-serif',
    fontSize: '24px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '.25rem',
  } as React.CSSProperties,
  date: {
    fontSize: '12px',
    color: 'var(--text3)',
    marginBottom: '2rem',
  } as React.CSSProperties,
  h2: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    marginTop: '1.75rem',
    marginBottom: '.5rem',
    fontFamily: 'Poppins, sans-serif',
  } as React.CSSProperties,
  p: {
    fontSize: '13px',
    color: 'var(--text2)',
    lineHeight: '1.75',
    marginBottom: '.75rem',
  } as React.CSSProperties,
  ul: {
    fontSize: '13px',
    color: 'var(--text2)',
    lineHeight: '1.9',
    paddingLeft: '1.25rem',
    marginBottom: '.75rem',
  } as React.CSSProperties,
  a: {
    color: 'var(--purple3)',
    textDecoration: 'underline',
  } as React.CSSProperties,
};

export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      <div style={S.card}>
        <h1 style={S.h1}>Privacy Policy</h1>
        <p style={S.date}>Last updated: May 24, 2026</p>

        <p style={S.p}>
          Welcome to <strong style={{ color: '#fff' }}>EVERY DAY</strong> ("we", "our", "us"). This Privacy Policy
          explains how we collect, use, disclose and safeguard your information when you visit our website at{' '}
          <a href="https://everyday-app.vercel.app" style={S.a}>everyday-app.vercel.app</a> (the "Service").
          Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.
        </p>

        <h2 style={S.h2}>1. Information We Collect</h2>
        <p style={S.p}>We collect information in the following ways:</p>
        <ul style={S.ul}>
          <li><strong style={{ color: '#fff' }}>Usage data</strong> — pages visited, features used, browser type, operating system and referring URLs, collected automatically via server logs and analytics.</li>
          <li><strong style={{ color: '#fff' }}>Location data</strong> — approximate geolocation (city/country level) derived from your IP address, used to provide localised weather, sunrise/sunset and IP-lookup features.</li>
          <li><strong style={{ color: '#fff' }}>Voluntary inputs</strong> — data you type into tools (dates, heights, weights, cities). This data is processed entirely in your browser and is never transmitted to our servers.</li>
        </ul>

        <h2 style={S.h2}>2. Cookies</h2>
        <p style={S.p}>
          We use cookies and similar tracking technologies to operate and improve the Service. Types of cookies we use:
        </p>
        <ul style={S.ul}>
          <li><strong style={{ color: '#fff' }}>Essential cookies</strong> — required for the Service to function (e.g. session state). Cannot be disabled.</li>
          <li><strong style={{ color: '#fff' }}>Analytics cookies</strong> — help us understand how visitors interact with the Service (e.g. Google Analytics). You may opt out at <a href="https://tools.google.com/dlpage/gaoptout" style={S.a}>tools.google.com/dlpage/gaoptout</a>.</li>
          <li><strong style={{ color: '#fff' }}>Advertising cookies</strong> — set by Google AdSense to deliver relevant ads. These cookies may track your browsing across other sites. See Google's policy below.</li>
        </ul>
        <p style={S.p}>
          You can control cookies through your browser settings or use a tool like the{' '}
          <a href="https://www.youronlinechoices.eu/" style={S.a}>EU Online Choices</a> opt-out page.
          Disabling cookies may affect some features of the Service.
        </p>

        <h2 style={S.h2}>3. Google AdSense & Advertising</h2>
        <p style={S.p}>
          We use Google AdSense to display advertisements. Google and its partners may use cookies to serve ads based
          on your prior visits to our website and other websites. Google's use of advertising cookies enables it and
          its partners to serve ads based on your visit to our site and/or other sites on the Internet.
        </p>
        <p style={S.p}>
          You may opt out of personalised advertising by visiting{' '}
          <a href="https://www.google.com/settings/ads" style={S.a}>Google Ads Settings</a> or{' '}
          <a href="https://www.aboutads.info/choices/" style={S.a}>aboutads.info</a>. For more information about
          how Google uses data from sites that use Google services, see{' '}
          <a href="https://policies.google.com/technologies/partner-sites" style={S.a}>
            policies.google.com/technologies/partner-sites
          </a>.
        </p>

        <h2 style={S.h2}>4. Third-Party Services</h2>
        <p style={S.p}>The Service integrates with the following third-party APIs. Each has its own privacy policy:</p>
        <ul style={S.ul}>
          <li><strong style={{ color: '#fff' }}>Open-Meteo</strong> (weather data) — <a href="https://open-meteo.com/en/terms" style={S.a}>open-meteo.com/en/terms</a></li>
          <li><strong style={{ color: '#fff' }}>CoinGecko</strong> (cryptocurrency prices) — <a href="https://www.coingecko.com/en/privacy" style={S.a}>coingecko.com/en/privacy</a></li>
          <li><strong style={{ color: '#fff' }}>ESPN</strong> (sports data) — <a href="https://www.espn.com/espn/privacypolicy" style={S.a}>espn.com/espn/privacypolicy</a></li>
          <li><strong style={{ color: '#fff' }}>ipify / ip-api</strong> (IP geolocation) — your IP address is sent to this service when you use the IP Address widget.</li>
          <li><strong style={{ color: '#fff' }}>Google Fonts / Vercel</strong> — hosting and font delivery may involve processing of your IP address per their respective policies.</li>
        </ul>

        <h2 style={S.h2}>5. How We Use Your Information</h2>
        <ul style={S.ul}>
          <li>To operate and improve the Service</li>
          <li>To display relevant advertising</li>
          <li>To analyse usage patterns and optimise performance</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 style={S.h2}>6. Data Retention</h2>
        <p style={S.p}>
          We retain server logs for up to 90 days. Analytics data is retained per Google Analytics' default retention
          settings (up to 26 months). We do not store any personal calculator inputs — all tool data lives exclusively
          in your browser's memory and is discarded when you close the tab.
        </p>

        <h2 style={S.h2}>7. Your Rights (GDPR / CCPA)</h2>
        <p style={S.p}>Depending on your jurisdiction, you may have the right to:</p>
        <ul style={S.ul}>
          <li>Access the personal data we hold about you</li>
          <li>Request correction or deletion of your data</li>
          <li>Object to or restrict processing</li>
          <li>Data portability</li>
          <li>Opt out of the sale of personal information (CCPA)</li>
        </ul>
        <p style={S.p}>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:info20pneu@gmail.com" style={S.a}>info20pneu@gmail.com</a>.
        </p>

        <h2 style={S.h2}>8. Children's Privacy</h2>
        <p style={S.p}>
          The Service is not directed at children under 13. We do not knowingly collect personal information from
          children. If you believe a child has provided us personal data, please contact us and we will delete it.
        </p>

        <h2 style={S.h2}>9. Changes to This Policy</h2>
        <p style={S.p}>
          We may update this Privacy Policy from time to time. We will notify you of significant changes by posting
          the new policy on this page and updating the "Last updated" date. Continued use of the Service after
          changes constitutes acceptance of the revised policy.
        </p>

        <h2 style={S.h2}>10. Contact</h2>
        <p style={S.p}>
          If you have questions about this Privacy Policy, please contact us:<br />
          <strong style={{ color: '#fff' }}>Email:</strong>{' '}
          <a href="mailto:info20pneu@gmail.com" style={S.a}>info20pneu@gmail.com</a><br />
          <strong style={{ color: '#fff' }}>Website:</strong>{' '}
          <a href="https://everyday-app.vercel.app" style={S.a}>everyday-app.vercel.app</a>
        </p>
      </div>
    </PageShell>
  );
}
