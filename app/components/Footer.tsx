'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '../../lib/LanguageContext';
import { LANGUAGES, type Lang } from '../../lib/i18n';
import { homeStrings } from '../../lib/homeI18n';
import { SOCIAL_LINKS } from '../../lib/siteConfig';
import { formatCurrencies } from '../../lib/homeI18n';
import { CURRENCY_COUNT } from '../../lib/currencies';

/* Pages without the site chrome */
const HIDDEN_ON = ['/maintenance', '/admin'];

const SOCIAL_ICONS: Record<(typeof SOCIAL_LINKS)[number]['id'], string> = {
  x: 'M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2Z',
  instagram: 'M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 2c-2.7 0-3.1 0-4.1.06C4.7 2.2 2.2 4.7 2.06 7.9 2 8.9 2 9.3 2 12s0 3.1.06 4.1c.14 3.2 2.64 5.7 5.84 5.84 1 .06 1.4.06 4.1.06s3.1 0 4.1-.06c3.2-.14 5.7-2.64 5.84-5.84.06-1 .06-1.4.06-4.1s0-3.1-.06-4.1C21.8 4.7 19.3 2.2 16.1 2.06 15.1 2 14.7 2 12 2Z',
  facebook: 'M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4Z',
  tiktok: 'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z',
  youtube: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z',
};

export default function Footer() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLang();
  const f = homeStrings(lang).footer;
  const socials = SOCIAL_LINKS.filter(s => s.url);

  if (HIDDEN_ON.some(p => pathname === p || pathname.startsWith(p + '/'))) return null;

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: f.tools,
      links: [
        { href: '/world-time', label: t.topbar.worldTime },
        { href: '/currency', label: `${t.nav.currency} · ${formatCurrencies(CURRENCY_COUNT, lang)}` },
        { href: '/unit-converter', label: t.nav.unitConverter },
        { href: '/weather', label: t.topbar.weather },
        { href: '/sports', label: t.topbar.sports },
      ],
    },
    {
      title: f.games,
      links: [
        { href: '/games/daily-puzzle', label: t.dailyPuzzle.title },
        { href: '/games/sky-tower', label: t.gamesHub.name_skyTower },
        { href: '/games/daily-blocks', label: t.gamesHub.name_dailyBlocks },
        { href: '/games', label: f.leaderboards },
      ],
    },
    {
      title: f.site,
      links: [
        { href: '/about', label: f.aboutLink },
        { href: '/suggest', label: f.suggest },
        { href: '/privacy-policy', label: f.privacy },
        { href: '/cookies', label: f.cookies },
        { href: '/contact', label: f.contact },
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link href="/" className="tb-logo" aria-label="EVERY DAY">
            <span className="tb-globe" aria-hidden="true" />
            <span className="tb-logo-text">EVERY <span>DAY</span></span>
          </Link>
          <p className="site-footer__about">{f.about}</p>
          {socials.length > 0 && (
            <div className="site-footer__social">
              {socials.map(s => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={SOCIAL_ICONS[s.id]} />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {columns.map(col => (
          <nav key={col.title} className="site-footer__col" aria-label={col.title}>
            <h3>{col.title}</h3>
            <ul>
              {col.links.map(l => (
                <li key={l.href + l.label}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="site-footer__bottom">
        <span>© 2026 EVERY DAY</span>
        <label className="site-footer__lang">
          <span aria-hidden="true">🌐</span>
          <span className="sr-only">{f.language}</span>
          <select value={lang} onChange={e => setLang(e.target.value as Lang)} aria-label={f.language}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </label>
      </div>
    </footer>
  );
}
