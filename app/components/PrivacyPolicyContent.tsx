'use client';

import { useLang } from '../../lib/LanguageContext';

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

const b = { color: '#fff' };

export default function PrivacyPolicyContent() {
  const { lang } = useLang();
  const cs = lang === 'cs';

  return (
    <div style={S.card}>
      <h1 style={S.h1}>{cs ? 'Zásady ochrany osobních údajů' : 'Privacy Policy'}</h1>
      <p style={S.date}>{cs ? 'Poslední aktualizace: 4. července 2026' : 'Last updated: July 4, 2026'}</p>

      {cs ? (
        <>
          <p style={S.p}>
            Vítejte na <strong style={b}>EVERY DAY</strong> ("my", "nás", "naše"). Tyto Zásady ochrany osobních
            údajů vysvětlují, jak shromažďujeme, používáme, zveřejňujeme a chráníme vaše informace při návštěvě
            našeho webu na adrese <a href="https://everyday-app.vercel.app" style={S.a}>everyday-app.vercel.app</a>{' '}
            ("Služba"). Přečtěte si prosím tyto zásady pozorně. Pokud s jejich obsahem nesouhlasíte, přestaňte
            prosím Službu používat.
          </p>

          <h2 style={S.h2}>1. Jaké informace shromažďujeme</h2>
          <p style={S.p}>Informace shromažďujeme následujícími způsoby:</p>
          <ul style={S.ul}>
            <li><strong style={b}>Údaje o používání</strong> — navštívené stránky, používané funkce, typ prohlížeče, operační systém a odkazující URL adresy, shromažďované automaticky pomocí serverových logů a analytiky.</li>
            <li><strong style={b}>Údaje o poloze</strong> — přibližná geolokace (na úrovni města/země) odvozená z vaší IP adresy, používaná k poskytování lokalizovaného počasí, časů východu/západu slunce a funkcí vyhledání IP.</li>
            <li><strong style={b}>Dobrovolně zadané údaje</strong> — data, která zadáte do nástrojů (data, výšky, váhy, města). Tato data jsou zpracována výhradně ve vašem prohlížeči a nikdy nejsou odeslána na naše servery.</li>
            <li><strong style={b}>IP adresy pro žebříčky</strong> — při odeslání výsledku do herního žebříčku shromažďujeme vaši IP adresu za účelem zajištění integrity žebříčku a ochrany proti podvádění. IP adresa <strong style={b}>není nikdy zobrazena veřejně</strong> — u výsledku ukládáme pouze jednosměrný hash IP adresy.</li>
            <li><strong style={b}>Místní úložiště (localStorage)</strong> — vaše preference, jako je zvolený jazyk, oblíbená města a lokálně uložené herní výsledky, uchovávané pouze ve vašem prohlížeči.</li>
          </ul>

          <h2 style={S.h2}>2. Cookies</h2>
          <p style={S.p}>
            Používáme cookies a podobné sledovací technologie k provozu a vylepšování Služby. Typy cookies, které používáme:
          </p>
          <ul style={S.ul}>
            <li><strong style={b}>Nezbytné cookies</strong> — nutné pro fungování Služby (např. stav relace). Nelze je zakázat.</li>
            <li><strong style={b}>Analytické cookies</strong> — pomáhají nám pochopit, jak návštěvníci interagují se Službou (např. Google Analytics). Odhlásit se můžete na{' '}
              <a href="https://tools.google.com/dlpage/gaoptout" style={S.a}>tools.google.com/dlpage/gaoptout</a>.</li>
            <li><strong style={b}>Reklamní cookies</strong> — nastavené službou Google AdSense pro zobrazování relevantních reklam. Jde o cookies třetích stran, které mohou sledovat vaše chování napříč jinými weby. Více viz zásady Google níže.</li>
          </ul>
          <p style={S.p}>
            Cookies můžete ovládat v nastavení svého prohlížeče nebo pomocí nástroje jako{' '}
            <a href="https://www.youronlinechoices.eu/" style={S.a}>EU Online Choices</a>. Zakázání cookies může
            ovlivnit některé funkce Služby.
          </p>

          <h2 style={S.h2}>3. Google AdSense a reklama</h2>
          <p style={S.p}>
            Pro zobrazování reklam používáme Google AdSense. Google a jeho partneři mohou používat cookies třetích
            stran k zobrazování reklam na základě vašich předchozích návštěv našeho webu i jiných webů.
          </p>
          <p style={S.p}>
            Personalizovanou reklamu můžete vypnout na{' '}
            <a href="https://www.google.com/settings/ads" style={S.a}>Google Ads Settings</a> nebo{' '}
            <a href="https://www.aboutads.info/choices/" style={S.a}>aboutads.info</a>. Více informací o tom, jak
            Google používá data z webů využívajících služby Google, najdete na{' '}
            <a href="https://policies.google.com/technologies/partner-sites" style={S.a}>
              policies.google.com/technologies/partner-sites
            </a>.
          </p>

          <h2 style={S.h2}>4. Žebříčky a herní data</h2>
          <p style={S.p}>
            Herní výsledky ukládáme do databáze <strong style={b}>Upstash Redis</strong>, abychom mohli provozovat
            žebříčky napříč hrami. U každého záznamu v žebříčku ukládáme:
          </p>
          <ul style={S.ul}>
            <li>přezdívku, kterou zadáte</li>
            <li>zemi a město (odvozené z IP adresy)</li>
            <li>dosažený herní čas / výsledek</li>
            <li>jednosměrný hash vaší IP adresy (samotná IP adresa se neukládá v čitelné podobě a není nikdy veřejně zobrazena)</li>
          </ul>
          <p style={S.p}>
            Tato data slouží výhradně k zajištění fungujících a proti podvádění odolných žebříčků.
          </p>

          <h2 style={S.h2}>5. Analytika (Vercel Analytics a Google Analytics)</h2>
          <p style={S.p}>
            Pro sledování návštěvnosti a pochopení chování uživatelů používáme <strong style={b}>Vercel Analytics</strong>{' '}
            a <strong style={b}>Google Analytics</strong>. Tyto nástroje pracují s agregovanými, anonymizovanými
            daty a neshromažďují osobní údaje umožňující vaši přímou identifikaci.
          </p>

          <h2 style={S.h2}>6. Služby třetích stran</h2>
          <p style={S.p}>Služba je propojena s následujícími API třetích stran. Každá má vlastní zásady ochrany osobních údajů:</p>
          <ul style={S.ul}>
            <li><strong style={b}>Open-Meteo</strong> (data o počasí) — <a href="https://open-meteo.com/en/terms" style={S.a}>open-meteo.com/en/terms</a></li>
            <li><strong style={b}>CoinGecko</strong> (ceny kryptoměn) — <a href="https://www.coingecko.com/en/privacy" style={S.a}>coingecko.com/en/privacy</a></li>
            <li><strong style={b}>ESPN</strong> (sportovní data) — <a href="https://www.espn.com/espn/privacypolicy" style={S.a}>espn.com/espn/privacypolicy</a></li>
            <li><strong style={b}>ipify / ip-api</strong> (IP geolokace) — vaše IP adresa je této službě odeslána při použití widgetu IP adresy.</li>
            <li><strong style={b}>Upstash Redis</strong> (databáze žebříčků) — ukládá herní výsledky popsané v sekci 4.</li>
            <li><strong style={b}>Vercel Analytics</strong> a <strong style={b}>Google Analytics</strong> — sledování návštěvnosti, viz sekce 5.</li>
            <li><strong style={b}>Google Fonts / Vercel</strong> — hosting a doručování fontů může zahrnovat zpracování vaší IP adresy dle jejich příslušných zásad.</li>
          </ul>

          <h2 style={S.h2}>7. Jak vaše informace používáme</h2>
          <ul style={S.ul}>
            <li>K provozu a vylepšování Služby</li>
            <li>K udržení spravedlivých a proti podvádění odolných žebříčků</li>
            <li>K zobrazování relevantní reklamy</li>
            <li>K analýze používání a optimalizaci výkonu</li>
            <li>K plnění právních povinností</li>
          </ul>

          <h2 style={S.h2}>8. Uchovávání dat</h2>
          <p style={S.p}>
            Serverové logy uchováváme až 90 dní. Analytická data jsou uchovávána podle výchozích retenčních zásad
            Google Analytics (až 26 měsíců). Záznamy v žebříčcích, včetně hashované IP adresy, uchováváme, dokud
            nepožádáte o jejich smazání. Data zadaná do kalkulaček neukládáme — veškerá data nástrojů žijí výhradně
            v paměti vašeho prohlížeče a jsou zahozena po zavření karty.
          </p>

          <h2 style={S.h2}>9. Vaše práva a soulad s GDPR</h2>
          <p style={S.p}>
            V souladu s obecným nařízením o ochraně osobních údajů (GDPR) a v závislosti na vaší jurisdikci můžete mít právo na:
          </p>
          <ul style={S.ul}>
            <li>přístup k osobním údajům, které o vás uchováváme</li>
            <li>opravu nebo <strong style={b}>smazání</strong> vašich dat (právo být zapomenut) — včetně smazání záznamu v žebříčku</li>
            <li>omezení nebo vznesení námitky proti zpracování</li>
            <li>přenositelnost dat</li>
            <li>odvolání souhlasu s používáním cookies třetích stran</li>
            <li>odmítnutí prodeje osobních údajů (CCPA)</li>
          </ul>
          <p style={S.p}>
            Pro uplatnění kteréhokoli z těchto práv, včetně žádosti o smazání vašich dat, nás kontaktujte na{' '}
            <a href="mailto:info20pneu@gmail.com" style={S.a}>info20pneu@gmail.com</a>. Na žádosti reagujeme
            v souladu se lhůtami stanovenými GDPR.
          </p>

          <h2 style={S.h2}>10. Ochrana soukromí dětí</h2>
          <p style={S.p}>
            Služba není určena dětem mladším 13 let. Vědomě neshromažďujeme osobní údaje od dětí. Pokud se
            domníváte, že nám dítě poskytlo osobní údaje, kontaktujte nás a my je smažeme.
          </p>

          <h2 style={S.h2}>11. Změny těchto zásad</h2>
          <p style={S.p}>
            Tyto Zásady ochrany osobních údajů můžeme čas od času aktualizovat. O významných změnách vás
            informujeme zveřejněním nové verze na této stránce a aktualizací data "Poslední aktualizace".
            Pokračováním v používání Služby po provedení změn vyjadřujete souhlas s revidovanými zásadami.
          </p>

          <h2 style={S.h2}>12. Kontakt</h2>
          <p style={S.p}>
            Máte-li dotazy ohledně těchto Zásad ochrany osobních údajů, kontaktujte nás:<br />
            <strong style={b}>E-mail:</strong>{' '}
            <a href="mailto:info20pneu@gmail.com" style={S.a}>info20pneu@gmail.com</a><br />
            <strong style={b}>Web:</strong>{' '}
            <a href="https://everyday-app.vercel.app" style={S.a}>everyday-app.vercel.app</a>
          </p>
        </>
      ) : (
        <>
          <p style={S.p}>
            Welcome to <strong style={b}>EVERY DAY</strong> ("we", "our", "us"). This Privacy Policy
            explains how we collect, use, disclose and safeguard your information when you visit our website at{' '}
            <a href="https://everyday-app.vercel.app" style={S.a}>everyday-app.vercel.app</a> (the "Service").
            Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.
          </p>

          <h2 style={S.h2}>1. Information We Collect</h2>
          <p style={S.p}>We collect information in the following ways:</p>
          <ul style={S.ul}>
            <li><strong style={b}>Usage data</strong> — pages visited, features used, browser type, operating system and referring URLs, collected automatically via server logs and analytics.</li>
            <li><strong style={b}>Location data</strong> — approximate geolocation (city/country level) derived from your IP address, used to provide localised weather, sunrise/sunset and IP-lookup features.</li>
            <li><strong style={b}>Voluntary inputs</strong> — data you type into tools (dates, heights, weights, cities). This data is processed entirely in your browser and is never transmitted to our servers.</li>
            <li><strong style={b}>IP addresses for leaderboards</strong> — when you submit a score to a game leaderboard, we collect your IP address for leaderboard integrity and anti-cheat protection. Your IP address is <strong style={b}>never displayed publicly</strong> — only a one-way hash of it is stored alongside your score.</li>
            <li><strong style={b}>Local storage</strong> — preferences such as your selected language, favourite cities and locally cached game results, stored only in your browser.</li>
          </ul>

          <h2 style={S.h2}>2. Cookies</h2>
          <p style={S.p}>
            We use cookies and similar tracking technologies to operate and improve the Service. Types of cookies we use:
          </p>
          <ul style={S.ul}>
            <li><strong style={b}>Essential cookies</strong> — required for the Service to function (e.g. session state). Cannot be disabled.</li>
            <li><strong style={b}>Analytics cookies</strong> — help us understand how visitors interact with the Service (e.g. Google Analytics). You may opt out at <a href="https://tools.google.com/dlpage/gaoptout" style={S.a}>tools.google.com/dlpage/gaoptout</a>.</li>
            <li><strong style={b}>Advertising cookies</strong> — set by Google AdSense to deliver relevant ads. These are third-party cookies that may track your browsing across other sites. See Google's policy below.</li>
          </ul>
          <p style={S.p}>
            You can control cookies through your browser settings or use a tool like the{' '}
            <a href="https://www.youronlinechoices.eu/" style={S.a}>EU Online Choices</a> opt-out page.
            Disabling cookies may affect some features of the Service.
          </p>

          <h2 style={S.h2}>3. Google AdSense &amp; Advertising</h2>
          <p style={S.p}>
            We use Google AdSense to display advertisements. Google and its partners may use third-party cookies to
            serve ads based on your prior visits to our website and other websites. Google's use of advertising
            cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on
            the Internet.
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

          <h2 style={S.h2}>4. Leaderboards &amp; Game Data</h2>
          <p style={S.p}>
            We store game results in an <strong style={b}>Upstash Redis</strong> database to power cross-game
            leaderboards. For each leaderboard entry we store:
          </p>
          <ul style={S.ul}>
            <li>the nickname you enter</li>
            <li>your country and city (derived from your IP address)</li>
            <li>your game time / score</li>
            <li>a one-way hash of your IP address (the raw IP address is not stored in readable form and is never displayed publicly)</li>
          </ul>
          <p style={S.p}>
            This data is used solely to keep leaderboards functional and resistant to cheating.
          </p>

          <h2 style={S.h2}>5. Analytics (Vercel Analytics &amp; Google Analytics)</h2>
          <p style={S.p}>
            We use <strong style={b}>Vercel Analytics</strong> and <strong style={b}>Google Analytics</strong> to
            understand traffic and usage trends. These tools operate on aggregated, anonymised data and do not
            collect personally identifiable information.
          </p>

          <h2 style={S.h2}>6. Third-Party Services</h2>
          <p style={S.p}>The Service integrates with the following third-party APIs. Each has its own privacy policy:</p>
          <ul style={S.ul}>
            <li><strong style={b}>Open-Meteo</strong> (weather data) — <a href="https://open-meteo.com/en/terms" style={S.a}>open-meteo.com/en/terms</a></li>
            <li><strong style={b}>CoinGecko</strong> (cryptocurrency prices) — <a href="https://www.coingecko.com/en/privacy" style={S.a}>coingecko.com/en/privacy</a></li>
            <li><strong style={b}>ESPN</strong> (sports data) — <a href="https://www.espn.com/espn/privacypolicy" style={S.a}>espn.com/espn/privacypolicy</a></li>
            <li><strong style={b}>ipify / ip-api</strong> (IP geolocation) — your IP address is sent to this service when you use the IP Address widget.</li>
            <li><strong style={b}>Upstash Redis</strong> (leaderboard database) — stores game results as described in Section 4.</li>
            <li><strong style={b}>Vercel Analytics</strong> and <strong style={b}>Google Analytics</strong> — traffic tracking, see Section 5.</li>
            <li><strong style={b}>Google Fonts / Vercel</strong> — hosting and font delivery may involve processing of your IP address per their respective policies.</li>
          </ul>

          <h2 style={S.h2}>7. How We Use Your Information</h2>
          <ul style={S.ul}>
            <li>To operate and improve the Service</li>
            <li>To keep leaderboards fair and resistant to cheating</li>
            <li>To display relevant advertising</li>
            <li>To analyse usage patterns and optimise performance</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2 style={S.h2}>8. Data Retention</h2>
          <p style={S.p}>
            We retain server logs for up to 90 days. Analytics data is retained per Google Analytics' default
            retention settings (up to 26 months). Leaderboard entries, including hashed IP addresses, are retained
            until you request their deletion. We do not store any personal calculator inputs — all tool data lives
            exclusively in your browser's memory and is discarded when you close the tab.
          </p>

          <h2 style={S.h2}>9. Your Rights &amp; GDPR Compliance</h2>
          <p style={S.p}>
            In accordance with the General Data Protection Regulation (GDPR) and depending on your jurisdiction,
            you may have the right to:
          </p>
          <ul style={S.ul}>
            <li>Access the personal data we hold about you</li>
            <li>Request correction or <strong style={b}>deletion</strong> of your data (right to erasure) — including removal of your leaderboard entry</li>
            <li>Object to or restrict processing</li>
            <li>Data portability</li>
            <li>Withdraw consent to third-party cookies</li>
            <li>Opt out of the sale of personal information (CCPA)</li>
          </ul>
          <p style={S.p}>
            To exercise any of these rights, including requesting deletion of your data, contact us at{' '}
            <a href="mailto:info20pneu@gmail.com" style={S.a}>info20pneu@gmail.com</a>. We respond to requests
            within the timeframes required by GDPR.
          </p>

          <h2 style={S.h2}>10. Children's Privacy</h2>
          <p style={S.p}>
            The Service is not directed at children under 13. We do not knowingly collect personal information from
            children. If you believe a child has provided us personal data, please contact us and we will delete it.
          </p>

          <h2 style={S.h2}>11. Changes to This Policy</h2>
          <p style={S.p}>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting
            the new policy on this page and updating the "Last updated" date. Continued use of the Service after
            changes constitutes acceptance of the revised policy.
          </p>

          <h2 style={S.h2}>12. Contact</h2>
          <p style={S.p}>
            If you have questions about this Privacy Policy, please contact us:<br />
            <strong style={b}>Email:</strong>{' '}
            <a href="mailto:info20pneu@gmail.com" style={S.a}>info20pneu@gmail.com</a><br />
            <strong style={b}>Website:</strong>{' '}
            <a href="https://everyday-app.vercel.app" style={S.a}>everyday-app.vercel.app</a>
          </p>
        </>
      )}
    </div>
  );
}
