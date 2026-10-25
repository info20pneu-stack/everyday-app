'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { CONTACT_EMAIL } from '../../lib/siteConfig';

/* Draft content for /about, /cookies and /contact — Czech and English (other languages see English),
   like the privacy policy. The yellow note at the top must go before launch. */

function InfoShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="info-page">
      <p className="info-page__draft" role="note">⚠️ Návrh – zkontroluj před spuštěním</p>
      <h1>{title}</h1>
      {children}
    </article>
  );
}

export function AboutContent() {
  const { lang } = useLang();
  if (lang === 'cs') {
    return (
      <InfoShell title="O projektu">
        <p>
          <strong>EVERY DAY</strong> je rozcestník věcí, které člověk řeší každý den: přesný čas ve světě, počasí,
          kurzy měn, převodníky jednotek, zprávy, sport a pár krátkých her na přestávku.
        </p>
        <h2>Pro koho to je</h2>
        <p>
          Pro každého, kdo chce mít užitečné nástroje na jednom místě – bez registrace, bez instalace a ve 14 jazycích.
          Web funguje i jako aplikace, stačí ho přidat na plochu.
        </p>
        <h2>Denní hry</h2>
        <p>
          Dnešní hádanka, Vyšší nebo nižší a Denní bloky jsou každý den stejné pro celý svět. Můžeš si porovnat
          výsledek s kamarády nebo se zapsat do denního žebříčku.
        </p>
        <h2>Jak je web financovaný</h2>
        <p>
          EVERY DAY je zdarma. Provoz platí reklamy (Google AdSense). Podrobnosti najdeš v{' '}
          <Link href="/privacy-policy">ochraně soukromí</Link> a v <Link href="/cookies">zásadách cookies</Link>.
        </p>
        <h2>Chceš něco přidat?</h2>
        <p>
          Nápady na nové funkce sbíráme v sekci <Link href="/suggest">Navrhnout funkci</Link>, kde se o nich dá i hlasovat.
          Ostatní dotazy piš přes <Link href="/contact">kontakt</Link>.
        </p>
      </InfoShell>
    );
  }
  return (
    <InfoShell title="About the project">
      <p>
        <strong>EVERY DAY</strong> is a hub for the things people check every day: the exact time around the world,
        weather, exchange rates, unit converters, news, sports and a few quick games for a break.
      </p>
      <h2>Who it is for</h2>
      <p>
        Anyone who wants useful tools in one place — no sign-up, no install, in 14 languages. The site also works
        as an app: just add it to your home screen.
      </p>
      <h2>Daily games</h2>
      <p>
        Today&apos;s Puzzle, Higher or Lower and Daily Blocks are the same for the whole world each day. Compare your
        result with friends or join the daily leaderboard.
      </p>
      <h2>How the site is funded</h2>
      <p>
        EVERY DAY is free. Ads (Google AdSense) pay for running it. See the <Link href="/privacy-policy">privacy policy</Link>{' '}
        and the <Link href="/cookies">cookie policy</Link> for details.
      </p>
      <h2>Want something added?</h2>
      <p>
        We collect feature ideas in <Link href="/suggest">Suggest a feature</Link>, where you can also vote on them.
        For anything else, use the <Link href="/contact">contact page</Link>.
      </p>
    </InfoShell>
  );
}

export function CookiesContent() {
  const { lang } = useLang();
  if (lang === 'cs') {
    return (
      <InfoShell title="Zásady cookies">
        <p>Tato stránka vysvětluje, jaké cookies a jaká data v prohlížeči EVERY DAY používá.</p>

        <h2>Reklama – Google AdSense</h2>
        <p>
          Reklamy zobrazuje Google AdSense. Google a jeho partneři mohou používat cookies k zobrazování reklam
          na základě tvých předchozích návštěv tohoto a jiných webů a k měření reklam. Personalizovanou reklamu
          můžeš vypnout v <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">nastavení reklam Google</a>.
          Více v <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">zásadách Google pro reklamu</a>.
        </p>

        <h2>Statistika návštěvnosti</h2>
        <p>
          Pro anonymní počítání návštěv nastavujeme vlastní cookie <code>ea_vid</code> (náhodný identifikátor,
          platnost 1 rok). Neobsahuje jméno, e-mail ani jiné osobní údaje. Používáme také Vercel Analytics, které
          cookies nepoužívá.
        </p>

        <h2>Data uložená v prohlížeči (localStorage)</h2>
        <p>Tato data zůstávají jen v tvém prohlížeči a na náš server se neposílají:</p>
        <ul>
          <li>nastavení – jazyk a vzhled (motiv),</li>
          <li>Můj den – oblíbená města, město pro počasí, tým, kryptoměna a datum narození,</li>
          <li>hry – dnešní postup, výsledky, série a osobní rekordy,</li>
          <li>Denní boost – splněné aktivity.</li>
        </ul>
        <p>Smažeš je vymazáním dat webu v nastavení prohlížeče.</p>

        <h2>Žebříčky</h2>
        <p>
          Když se zapíšeš do žebříčku, uložíme na server přezdívku, zemi (a město, pokud ho vyplníš), výsledek
          a typ zařízení. Tyto údaje jsou v žebříčku veřejně vidět. Přezdívku a zemi si pamatuje i tvůj prohlížeč,
          abys je nemusel zadávat znovu. Denní žebříčky se mažou po 30 dnech.
        </p>

        <h2>Kontakt</h2>
        <p>Dotazy k datům posílej na <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </InfoShell>
    );
  }
  return (
    <InfoShell title="Cookie policy">
      <p>This page explains which cookies and browser storage EVERY DAY uses.</p>

      <h2>Advertising — Google AdSense</h2>
      <p>
        Ads are served by Google AdSense. Google and its partners may use cookies to show ads based on your
        previous visits to this and other websites and to measure ads. You can turn off personalised ads in{' '}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
        More in <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google&apos;s advertising policies</a>.
      </p>

      <h2>Visit statistics</h2>
      <p>
        To count visits anonymously we set our own cookie <code>ea_vid</code> (a random ID, valid for 1 year).
        It contains no name, e-mail or other personal data. We also use Vercel Analytics, which uses no cookies.
      </p>

      <h2>Data stored in your browser (localStorage)</h2>
      <p>This data stays in your browser and is not sent to our server:</p>
      <ul>
        <li>settings — language and theme,</li>
        <li>My Day — favourite cities, weather city, team, coin and date of birth,</li>
        <li>games — today&apos;s progress, results, streaks and personal bests,</li>
        <li>Daily Boost — completed activities.</li>
      </ul>
      <p>You can delete it by clearing this site&apos;s data in your browser settings.</p>

      <h2>Leaderboards</h2>
      <p>
        When you join a leaderboard we store your nickname, country (and city, if you enter one), score and device
        type on our server. These are shown publicly on the leaderboard. Your browser also remembers your nickname and
        country so you don&apos;t have to type them again. Daily leaderboards are deleted after 30 days.
      </p>

      <h2>Contact</h2>
      <p>Questions about your data: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </InfoShell>
  );
}

export function ContactContent() {
  const { lang } = useLang();
  const cs = lang === 'cs';
  return (
    <InfoShell title={cs ? 'Kontakt' : 'Contact'}>
      <p>
        {cs ? 'Napiš nám na ' : 'Write to us at '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        {cs ? ' Odpovídáme obvykle do několika dní.' : ' We usually reply within a few days.'}
      </p>
      <h2>{cs ? 'Nápady a chyby' : 'Ideas and bugs'}</h2>
      <p>
        {cs ? 'Návrhy nových funkcí nejrychleji projdou přes ' : 'Feature ideas get looked at fastest via '}
        <Link href="/suggest">{cs ? 'Navrhnout funkci' : 'Suggest a feature'}</Link>
        {cs ? ' – ostatní tam pro ně můžou hlasovat. Když narazíš na chybu, pošli nám stránku, zařízení a prohlížeč.'
          : ' — others can vote for them there. If you find a bug, tell us the page, device and browser.'}
      </p>
      <h2>{cs ? 'Reklama a spolupráce' : 'Advertising and partnerships'}</h2>
      <p>
        {cs ? 'Pro spolupráci použij stejný e-mail a do předmětu napiš „Spolupráce“.'
          : 'For partnerships, use the same e-mail with “Partnership” in the subject.'}
      </p>
    </InfoShell>
  );
}
