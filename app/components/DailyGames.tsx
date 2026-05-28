'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLang } from '../../lib/LanguageContext';

/* ═══════════════════════ DATA ═══════════════════════ */

type Country = { code: string };

// Tiered by recognizability:
//   indices  0–19  → easy pool   (top 20)
//   indices 20–49  → normal pool (top 50)
//   indices 50–79  → hard pool   (all 80)
const ALL_COUNTRIES: Country[] = [
  // ── easy (0–19) ──────────────────────────────────────────
  { code: 'US' }, { code: 'GB' }, { code: 'DE' }, { code: 'FR' },
  { code: 'IT' }, { code: 'ES' }, { code: 'JP' }, { code: 'CN' },
  { code: 'CA' }, { code: 'AU' }, { code: 'BR' }, { code: 'RU' },
  { code: 'IN' }, { code: 'MX' }, { code: 'KR' }, { code: 'TR' },
  { code: 'NL' }, { code: 'SE' }, { code: 'NO' }, { code: 'CH' },
  // ── normal (20–49) ───────────────────────────────────────
  { code: 'CZ' }, { code: 'SK' }, { code: 'PL' }, { code: 'AT' },
  { code: 'BE' }, { code: 'DK' }, { code: 'FI' }, { code: 'PT' },
  { code: 'GR' }, { code: 'ZA' }, { code: 'EG' }, { code: 'SA' },
  { code: 'AE' }, { code: 'TH' }, { code: 'ID' }, { code: 'MY' },
  { code: 'SG' }, { code: 'UA' }, { code: 'RO' }, { code: 'HU' },
  { code: 'HR' }, { code: 'CO' }, { code: 'IL' }, { code: 'NG' },
  { code: 'KE' }, { code: 'PH' }, { code: 'VN' }, { code: 'IE' },
  { code: 'NZ' }, { code: 'AR' },
  // ── hard (50–79) ─────────────────────────────────────────
  { code: 'CL' }, { code: 'PE' }, { code: 'EC' }, { code: 'PK' },
  { code: 'BD' }, { code: 'LK' }, { code: 'QA' }, { code: 'KW' },
  { code: 'OM' }, { code: 'BG' }, { code: 'RS' }, { code: 'LT' },
  { code: 'LV' }, { code: 'EE' }, { code: 'IS' }, { code: 'LU' },
  { code: 'DZ' }, { code: 'MA' }, { code: 'ET' }, { code: 'GH' },
  { code: 'TZ' }, { code: 'SN' }, { code: 'GE' }, { code: 'AL' },
  { code: 'AM' }, { code: 'AZ' }, { code: 'MD' }, { code: 'BY' },
  { code: 'MM' }, { code: 'KH' },
];

// Pool slices used by difficulty
const POOL_EASY   = ALL_COUNTRIES.slice(0, 20);
const POOL_NORMAL = ALL_COUNTRIES.slice(0, 50);
const POOL_HARD   = ALL_COUNTRIES;            // all 80

// MemoryGame still needs a flat unique array (up to 50 pairs for 10×10)
const UNIQUE_COUNTRIES = ALL_COUNTRIES;

// Multilingual word banks — 5 topics × 12 words = 60 per language
// Topics: capitals, currencies, sports teams, countries, animals
const WORD_BANKS: Record<string, string[]> = {
  en: [
    'London','Paris','Berlin','Tokyo','Rome','Madrid','Moscow','Beijing','Cairo','Ottawa',
    'Canberra','Seoul','Vienna','Warsaw','Prague','Lisbon','Athens','Budapest','Brussels','Amsterdam',
    'Dollar','Euro','Yen','Pound','Yuan','Ruble','Rupee','Peso','Franc','Krona',
    'Arsenal','Chelsea','Bayern','Juventus','Barcelona','Liverpool','PSG','Ajax','Lakers','Yankees',
    'France','Germany','Japan','Italy','Spain','Brazil','Russia','China','India','Mexico',
    'Lion','Tiger','Eagle','Wolf','Shark','Dolphin','Elephant','Leopard','Cobra','Falcon',
  ],
  de: [
    'Berlin','Paris','London','Tokio','Rom','Madrid','Moskau','Peking','Kairo','Ottawa',
    'Canberra','Seoul','Wien','Warschau','Prag','Lissabon','Athen','Budapest','Brüssel','Amsterdam',
    'Euro','Dollar','Yen','Pfund','Yuan','Rubel','Rupie','Peso','Franken','Krone',
    'Bayern','Dortmund','Schalke','Juventus','Arsenal','Chelsea','Barcelona','Real','PSG','Ajax',
    'Frankreich','Deutschland','Japan','Italien','Spanien','Brasilien','Russland','China','Indien','Mexiko',
    'Löwe','Tiger','Adler','Wolf','Hai','Delfin','Elefant','Leopard','Kobra','Falke',
  ],
  it: [
    'Roma','Parigi','Berlino','Tokio','Londra','Madrid','Mosca','Pechino','Il Cairo','Ottawa',
    'Canberra','Seul','Vienna','Varsavia','Praga','Lisbona','Atene','Budapest','Bruxelles','Amsterdam',
    'Euro','Dollaro','Yen','Sterlina','Yuan','Rublo','Rupia','Peso','Franco','Corona',
    'Juventus','Milan','Inter','Lazio','Napoli','Arsenal','Barça','Bayern','Chelsea','PSG',
    'Francia','Germania','Giappone','Italia','Spagna','Brasile','Russia','Cina','India','Messico',
    'Leone','Tigre','Aquila','Lupo','Squalo','Delfino','Elefante','Leopardo','Cobra','Falcone',
  ],
  fr: [
    'Paris','Berlin','Londres','Tokyo','Rome','Madrid','Moscou','Pékin','Le Caire','Ottawa',
    'Canberra','Séoul','Vienne','Varsovie','Prague','Lisbonne','Athènes','Budapest','Bruxelles','Amsterdam',
    'Euro','Dollar','Yen','Livre','Yuan','Rouble','Roupie','Peso','Franc','Couronne',
    'PSG','Lyon','Monaco','Arsenal','Chelsea','Bayern','Juventus','Barça','Real','Ajax',
    'France','Allemagne','Japon','Italie','Espagne','Brésil','Russie','Chine','Inde','Mexique',
    'Lion','Tigre','Aigle','Loup','Requin','Dauphin','Éléphant','Léopard','Cobra','Faucon',
  ],
  cs: [
    'Praha','Berlín','Paříž','Londýn','Tokio','Řím','Madrid','Moskva','Peking','Káhira',
    'Canberra','Soul','Vídeň','Varšava','Lisabon','Atény','Budapešť','Brusel','Amsterdam','Ottawa',
    'Koruna','Euro','Dolar','Jen','Libra','Juan','Rubl','Rupie','Peso','Frank',
    'Sparta','Slavia','Bayern','Arsenal','Chelsea','Juventus','Barça','Real','Ajax','Borussia',
    'Česko','Německo','Francie','Japonsko','Itálie','Španělsko','Brazílie','Rusko','Čína','Indie',
    'Lev','Tygr','Orel','Vlk','Žralok','Delfín','Slon','Leopard','Kobra','Sokol',
  ],
  es: [
    'Madrid','París','Berlín','Tokio','Roma','Londres','Moscú','Pekín','El Cairo','Ottawa',
    'Canberra','Seúl','Viena','Varsovia','Praga','Lisboa','Atenas','Budapest','Bruselas','Ámsterdam',
    'Euro','Dólar','Yen','Libra','Yuan','Rublo','Rupia','Peso','Franco','Corona',
    'Real','Barça','Atlético','Sevilla','Arsenal','Chelsea','Bayern','Juventus','PSG','Ajax',
    'España','Francia','Alemania','Japón','Italia','Brasil','Rusia','China','India','México',
    'León','Tigre','Águila','Lobo','Tiburón','Delfín','Elefante','Leopardo','Cobra','Halcón',
  ],
  pl: [
    'Warszawa','Berlin','Paryż','Londyn','Tokio','Rzym','Madryt','Moskwa','Pekin','Kair',
    'Canberra','Seul','Wiedeń','Praga','Lizbona','Ateny','Budapeszt','Bruksela','Amsterdam','Ottawa',
    'Złoty','Euro','Dolar','Jen','Funt','Juan','Rubel','Rupia','Peso','Frank',
    'Legia','Wisła','Bayern','Arsenal','Chelsea','Juventus','Barcelona','Real','Ajax','Borussia',
    'Polska','Niemcy','Francja','Japonia','Włochy','Hiszpania','Brazylia','Rosja','Chiny','Indie',
    'Lew','Tygrys','Orzeł','Wilk','Rekin','Delfin','Słoń','Lampart','Kobra','Sokół',
  ],
  pt: [
    'Lisboa','Madrid','Paris','Berlim','Tóquio','Roma','Londres','Moscovo','Pequim','Cairo',
    'Camberra','Seul','Viena','Varsóvia','Praga','Atenas','Budapeste','Bruxelas','Amesterdão','Ottawa',
    'Euro','Dólar','Iene','Libra','Yuan','Rublo','Rúpia','Peso','Franco','Coroa',
    'Benfica','Porto','Sporting','Arsenal','Chelsea','Bayern','Juventus','Barça','Real','Ajax',
    'Portugal','Espanha','França','Alemanha','Japão','Itália','Brasil','Rússia','China','Índia',
    'Leão','Tigre','Águia','Lobo','Tubarão','Golfinho','Elefante','Leopardo','Cobra','Falcão',
  ],
  ru: [
    'Москва','Берлин','Париж','Лондон','Токио','Рим','Мадрид','Пекин','Каир','Оттава',
    'Канберра','Сеул','Вена','Варшава','Прага','Лиссабон','Афины','Будапешт','Брюссель','Амстердам',
    'Рубль','Евро','Доллар','Иена','Фунт','Юань','Рупия','Песо','Франк','Крона',
    'Зенит','Спартак','ЦСКА','Локомотив','Бавария','Арсенал','Челси','Барселона','Реал','Аякс',
    'Россия','Германия','Франция','Япония','Италия','Испания','Бразилия','Китай','Индия','Мексика',
    'Лев','Тигр','Орёл','Волк','Акула','Дельфин','Слон','Леопард','Кобра','Сокол',
  ],
  zh: [
    '北京','巴黎','柏林','东京','伦敦','罗马','马德里','莫斯科','开罗','渥太华',
    '堪培拉','首尔','维也纳','华沙','布拉格','里斯本','雅典','布达佩斯','布鲁塞尔','阿姆斯特丹',
    '人民币','欧元','美元','日元','英镑','卢布','卢比','比索','法郎','克朗',
    '巴萨','皇马','拜仁','曼联','尤文','切尔西','阿森纳','大巴黎','阿贾克斯','利物浦',
    '中国','法国','德国','日本','意大利','西班牙','巴西','俄罗斯','印度','墨西哥',
    '狮子','老虎','雄鹰','狼','鲨鱼','海豚','大象','豹子','眼镜蛇','猎鹰',
  ],
  ja: [
    '東京','パリ','ベルリン','ロンドン','ローマ','マドリード','モスクワ','北京','カイロ','オタワ',
    'キャンベラ','ソウル','ウィーン','ワルシャワ','プラハ','リスボン','アテネ','ブダペスト','ブリュッセル','アムステルダム',
    '円','ユーロ','ドル','ポンド','元','ルーブル','ルピー','ペソ','フラン','クローナ',
    'バルサ','レアル','バイエルン','マンU','ユベントス','チェルシー','読売','阪神','楽天','ソフトバンク',
    '日本','フランス','ドイツ','イギリス','イタリア','スペイン','ブラジル','ロシア','中国','インド',
    'ライオン','トラ','ワシ','オオカミ','サメ','イルカ','ゾウ','ヒョウ','コブラ','ハヤブサ',
  ],
  ko: [
    '서울','파리','베를린','도쿄','런던','로마','마드리드','모스크바','베이징','카이로',
    '캔버라','빈','바르샤바','프라하','리스본','아테네','부다페스트','브뤼셀','암스테르담','오타와',
    '원','유로','달러','엔','파운드','위안','루블','루피','페소','프랑',
    '바르사','레알','바이에른','맨유','유벤투스','첼시','아스날','삼성','두산','기아',
    '한국','프랑스','독일','일본','이탈리아','스페인','브라질','러시아','중국','인도',
    '사자','호랑이','독수리','늑대','상어','돌고래','코끼리','표범','코브라','매',
  ],
  ar: [
    'القاهرة','باريس','برلين','طوكيو','لندن','روما','مدريد','موسكو','بكين','أوتاوا',
    'كانبيرا','سيول','فيينا','وارسو','براغ','لشبونة','أثينا','بودابست','بروكسل','أمستردام',
    'دولار','يورو','ين','جنيه','يوان','روبل','روبية','بيسو','فرنك','كرونة',
    'برشلونة','ريال','بايرن','مانشستر','يوفنتوس','تشيلسي','أرسنال','الأهلي','الزمالك','الهلال',
    'مصر','فرنسا','ألمانيا','اليابان','إيطاليا','إسبانيا','البرازيل','روسيا','الصين','الهند',
    'أسد','نمر','نسر','ذئب','قرش','دلفين','فيل','فهد','كوبرا','صقر',
  ],
  hi: [
    'दिल्ली','पेरिस','बर्लिन','टोक्यो','लंदन','रोम','मैड्रिड','मॉस्को','बीजिंग','काहिरा',
    'कैनबरा','सियोल','वियना','वारसॉ','प्राग','लिस्बन','एथेंस','बुडापेस्ट','ब्रुसेल्स','एम्स्टर्डम',
    'रुपया','यूरो','डॉलर','येन','पाउंड','युआन','रूबल','पेसो','फ्रैंक','क्रोना',
    'बार्सा','रियल','बायर्न','मैनयू','जुवेंटस','चेल्सी','आर्सेनल','मुंबई','कोलकाता','चेन्नई',
    'भारत','फ्रांस','जर्मनी','जापान','इटली','स्पेन','ब्राजील','रूस','चीन','मेक्सिको',
    'शेर','बाघ','गरुड़','भेड़िया','शार्क','डॉल्फिन','हाथी','तेंदुआ','कोबरा','बाज',
  ],
};

if (typeof window !== 'undefined') {
  console.log(
    '[WordChain] Word bank sizes:',
    Object.fromEntries(Object.entries(WORD_BANKS).map(([l, w]) => [l, w.length]))
  );
}

function flagEmoji(code: string) {
  return [...code.toUpperCase()].map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

function getCountryName(code: string, lang: string): string {
  try {
    const dn = new Intl.DisplayNames([lang, 'en'], { type: 'region' });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223 | 0;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function dateSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fmtTimeSecs(s: number): string {
  if (s < 60) return `${s} s`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// During game: 00:45.23 (centiseconds, 2 decimal places)
function fmtTimeCenti(ms: number): string {
  const totalSecs = ms / 1000;
  const mins = Math.floor(totalSecs / 60);
  const secsInt = Math.floor(totalSecs % 60);
  const centi = Math.floor(((totalSecs % 1)) * 100);
  return `${String(mins).padStart(2,'0')}:${String(secsInt).padStart(2,'0')}.${String(centi).padStart(2,'0')}`;
}

// After game: 00:45.2341 (ten-thousandths, 4 decimal places)
function fmtTimePrecise4(ms: number): string {
  const totalSecs = ms / 1000;
  const mins = Math.floor(totalSecs / 60);
  const secsInt = Math.floor(totalSecs % 60);
  const frac = Math.round(((totalSecs % 1)) * 10000);
  return `${String(mins).padStart(2,'0')}:${String(secsInt).padStart(2,'0')}.${String(frac).padStart(4,'0')}`;
}

const WORLD_COUNTRIES = [
  'AF','AL','DZ','AR','AM','AU','AT','AZ','BH','BD','BY','BE','BO','BA','BR','BG','KH','CA',
  'CL','CN','CO','HR','CZ','DK','EC','EG','EE','ET','FI','FR','GE','DE','GH','GR','GT','HK',
  'HU','IN','ID','IQ','IE','IL','IT','JP','JO','KZ','KE','KW','LV','LB','LT','LU','MY','MX',
  'MA','NL','NZ','NG','NO','OM','PK','PE','PH','PL','PT','QA','RO','RU','SA','RS','SG','SK',
  'ZA','KR','ES','LK','SE','CH','TW','TZ','TH','TN','TR','UA','AE','GB','US','VN',
].sort();

function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ═══════════════════════ SHARED UI ═══════════════════════ */

const CARD_BG: React.CSSProperties = {
  background: 'rgba(15,20,40,0.92)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 'var(--card-radius)',
  padding: '1.25rem',
  boxShadow: 'var(--card-shadow)',
};

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '5px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Poppins', color: '#fff' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{label}</div>
    </div>
  );
}

function BestBadge({ label, value }: { label: string; value: string | number }) {
  if (!value) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.2)', borderRadius: '8px', padding: '3px 10px' }}>
      <span style={{ fontSize: '12px' }}>🏆</span>
      <span style={{ fontSize: '11px', color: 'var(--amber)' }}>{label}: {value}</span>
    </div>
  );
}

/* ═══════════════════════ LEADERBOARD MODAL ═══════════════════════ */

type GameId = 'sliding' | 'memory' | 'flagquiz' | 'wordchain';
type LBApiEntry = {
  id: string; game: GameId; name: string; country: string; city: string;
  timeMs: number; score?: number; moves?: number; diff?: string; date: number;
};
type LBApiResponse = { entries: LBApiEntry[]; countries: string[] };

interface ModalProps {
  game: GameId;
  timeMs: number;
  score?: number;
  moves?: number;
  diff?: string;
  onClose: () => void;
  onShowLeaderboard: () => void;
}

function LeaderboardModal({ game, timeMs, score, moves, diff, onClose, onShowLeaderboard }: ModalProps) {
  const { lang } = useLang();
  const [nick,       setNick]       = useState(() => lsGet<string>('lb_nick', ''));
  const [country,    setCountry]    = useState(() => lsGet<string>('lb_country', ''));
  const [city,       setCity]       = useState(() => lsGet<string>('lb_city', ''));
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState('');
  const [phase,      setPhase]      = useState<'form' | 'confirm'>('form');
  const [myRank,     setMyRank]     = useState<number | null>(null);

  async function handleSubmit() {
    if (!nick.trim() || submitting) return;
    setSubmitting(true);
    setSubmitErr('');
    try {
      lsSet('lb_nick', nick.trim());
      lsSet('lb_country', country);
      lsSet('lb_city', city.trim());
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, name: nick.trim(), country, city: city.trim(), timeMs, score, moves, diff }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 201) {
        const raw = await fetch(`/api/leaderboard?game=${game}`);
        const lb = await raw.json() as LBApiResponse;
        const idx = lb.entries.findIndex(e => e.id === (data.entry as LBApiEntry).id);
        setMyRank(idx >= 0 ? idx + 1 : null);
        setPhase('confirm');
      } else if (data.notBetter) {
        setMyRank(data.rank as number);
        setPhase('confirm');
      } else if (data.notInTop) {
        setMyRank(data.rank as number);
        setPhase('confirm');
      } else {
        setSubmitErr((data.error as string) || 'Chyba při odesílání');
      }
    } catch {
      setSubmitErr('Chyba připojení');
    } finally {
      setSubmitting(false);
    }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
  };
  const box: React.CSSProperties = {
    background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(93,76,255,0.35)',
    borderRadius: '18px', padding: '24px 20px', width: '100%', maxWidth: '360px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
    animation: 'modalIn 0.22s cubic-bezier(.34,1.56,.64,1)',
  };
  const inputSt: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9px',
    color: '#fff', fontSize: '14px', padding: '10px 12px', outline: 'none',
    boxSizing: 'border-box',
  };
  const gameLabel = { sliding: '🧩 Puzzle', memory: '🃏 Pexeso', flagquiz: '🌍 Vlajky', wordchain: '📝 Řetěz' };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={box}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>🏆</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: '700', color: '#fff' }}>
            {gameLabel[game]} dokončeno!
          </div>
        </div>

        {/* Result display */}
        <div style={{ textAlign: 'center', marginBottom: '16px', padding: '12px', background: 'rgba(93,76,255,0.1)', borderRadius: '12px', border: '1px solid rgba(93,76,255,0.25)' }}>
          {game === 'wordchain' && score !== undefined ? (
            <>
              <div style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                Zapamatoval/a jsi {score} {score === 1 ? 'slovo' : score < 5 ? 'slova' : 'slov'}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: '700', color: 'var(--green2)', letterSpacing: '1px', fontVariantNumeric: 'tabular-nums' }}>
                za {fmtTimePrecise4(timeMs)}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: '700', color: 'var(--green2)', letterSpacing: '1px', fontVariantNumeric: 'tabular-nums' }}>
                {fmtTimePrecise4(timeMs)}
              </div>
              {score !== undefined && (
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                  Skóre: {score}{moves !== undefined ? ` · ${moves} tahů` : ''}
                </div>
              )}
              {score === undefined && moves !== undefined && (
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{moves} tahů</div>
              )}
            </>
          )}
        </div>

        {phase === 'form' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text" placeholder="Nick / přezdívka" value={nick} maxLength={30}
                onChange={e => setNick(e.target.value.slice(0, 30))}
                style={inputSt}
              />
              <select value={country} onChange={e => setCountry(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                <option value="">🌍 Vyber zemi…</option>
                {WORLD_COUNTRIES.map(code => (
                  <option key={code} value={code}>
                    {flagEmoji(code)} {getCountryName(code, lang)}
                  </option>
                ))}
              </select>
              <input
                type="text" placeholder="Město (volitelné)" value={city} maxLength={60}
                onChange={e => setCity(e.target.value.slice(0, 60))}
                style={inputSt}
              />
            </div>
            {submitErr && <div style={{ fontSize: '12px', color: '#EF4444', marginBottom: '8px', textAlign: 'center' }}>{submitErr}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSubmit}
                disabled={!nick.trim() || submitting}
                style={{
                  flex: 2, background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
                  border: 'none', borderRadius: '10px', color: '#fff',
                  fontSize: '14px', fontWeight: '600', padding: '11px', cursor: 'pointer',
                  opacity: nick.trim() && !submitting ? 1 : 0.5,
                }}
              >
                {submitting ? '…' : '🏅 Přidat do žebříčku'}
              </button>
              <button onClick={onClose} style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px', color: 'var(--text2)', fontSize: '13px', fontWeight: '600',
                padding: '11px', cursor: 'pointer',
              }}>
                Přeskočit
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: '700', color: 'var(--green2)' }}>
                Přidáno do žebříčku!
              </div>
              {myRank && (
                <div style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '6px' }}>
                  Jsi <span style={{ color: '#FFB300', fontWeight: '700' }}>#{myRank}</span> v globálním žebříčku
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { onShowLeaderboard(); onClose(); }} style={{
                flex: 2, background: 'rgba(255,179,0,0.12)', border: '1px solid rgba(255,179,0,0.3)',
                borderRadius: '10px', color: '#FFB300', fontSize: '14px', fontWeight: '600',
                padding: '11px', cursor: 'pointer',
              }}>
                🏆 Zobrazit žebříček
              </button>
              <button onClick={onClose} style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px', color: 'var(--text2)', fontSize: '13px', fontWeight: '600',
                padding: '11px', cursor: 'pointer',
              }}>
                Zavřít
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ GLOBAL LEADERBOARD ═══════════════════════ */

const PERIOD_OPTS = [
  { v: 'all',   label: 'All-time' },
  { v: 'month', label: 'Měsíc' },
  { v: 'week',  label: 'Týden' },
  { v: 'today', label: 'Dnes' },
];

function GlobalLeaderboard({ initialGame }: { initialGame: GameId }) {
  const { lang } = useLang();
  const [game,    setGame]    = useState<GameId>(initialGame);
  const [period,  setPeriod]  = useState('all');
  const [country, setCountry] = useState('');
  const [city,    setCity]    = useState('');
  const [entries, setEntries] = useState<LBApiEntry[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const cities = useMemo(() =>
    country ? [...new Set(entries.filter(e => e.country === country).map(e => e.city).filter(Boolean))].sort() : [],
    [entries, country]
  );
  const filtered = useMemo(() => {
    let r = entries;
    if (country) r = r.filter(e => e.country === country);
    if (city)    r = r.filter(e => e.city === city);
    return r;
  }, [entries, country, city]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ game, period });
    fetch(`/api/leaderboard?${params}`)
      .then(r => r.json() as Promise<LBApiResponse>)
      .then(d => { setEntries(d.entries ?? []); setCountries(d.countries ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
    setCountry(''); setCity('');
  }, [game, period]);

  const gameLabel: Record<GameId, string> = { sliding: '🧩 Puzzle', memory: '🃏 Pexeso', flagquiz: '🌍 Vlajky', wordchain: '📝 Řetěz' };

  return (
    <div style={{ marginTop: '14px' }}>
      {/* Game selector */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
        {(['sliding','memory','flagquiz','wordchain'] as GameId[]).map(g => (
          <button key={g} onClick={() => setGame(g)} style={{
            flex: 1, padding: '6px 2px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11px', fontWeight: '600',
            background: g === game ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.06)',
            color: g === game ? '#fff' : 'var(--text3)',
          }}>{gameLabel[g]}</button>
        ))}
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
        {PERIOD_OPTS.map(p => (
          <button key={p.v} onClick={() => setPeriod(p.v)} style={{
            flex: 1, padding: '5px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11px', fontWeight: '600',
            background: p.v === period ? 'rgba(93,76,255,0.25)' : 'rgba(255,255,255,0.05)',
            color: p.v === period ? 'var(--purple3)' : 'var(--text3)',
            outline: p.v === period ? '1px solid rgba(93,76,255,0.4)' : 'none',
          }}>{p.label}</button>
        ))}
      </div>

      {/* Country/city filters */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <select value={country} onChange={e => { setCountry(e.target.value); setCity(''); }} style={{
          flex: 1, minWidth: '130px', background: 'rgba(255,255,255,0.07)',
          border: country ? '1px solid rgba(93,76,255,0.5)' : '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px', color: '#fff', fontSize: '11px', padding: '5px 8px', outline: 'none',
        }}>
          <option value="">🌍 Všechny země ({entries.length})</option>
          {countries.map(c => (
            <option key={c} value={c}>
              {flagEmoji(c)} {getCountryName(c, lang)} ({entries.filter(e => e.country === c).length})
            </option>
          ))}
        </select>
        {country && cities.length > 1 && (
          <select value={city} onChange={e => setCity(e.target.value)} style={{
            flex: 1, minWidth: '90px', background: 'rgba(255,255,255,0.07)',
            border: city ? '1px solid rgba(93,76,255,0.5)' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', color: '#fff', fontSize: '11px', padding: '5px 8px', outline: 'none',
          }}>
            <option value="">Všechna města</option>
            {cities.map(ct => <option key={ct} value={ct}>{ct}</option>)}
          </select>
        )}
        {(country || city) && (
          <button onClick={() => { setCountry(''); setCity(''); }} style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', color: '#EF4444', fontSize: '12px', padding: '5px 10px', cursor: 'pointer',
          }}>✕</button>
        )}
      </div>

      {/* Header */}
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', marginBottom: '5px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
        {country ? `${flagEmoji(country)} ${getCountryName(country, lang)}${city ? ' · ' + city : ''} — ${filtered.length} hráčů` : `🌍 Globální žebříček — Top 100`}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--text3)' }}>Načítám…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--text3)' }}>
          {entries.length === 0 ? 'Zatím žádné záznamy. Buď první!' : 'Žádní hráči z této oblasti.'}
        </div>
      ) : (
        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {filtered.map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 10px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid transparent',
            }}>
              <span style={{ fontSize: '13px', width: '26px', textAlign: 'right', flexShrink: 0, color: 'var(--text3)' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.name}
              </span>
              {e.country && !country && (
                <span style={{ fontSize: '14px', flexShrink: 0 }} title={e.city || e.country}>{flagEmoji(e.country)}</span>
              )}
              {e.city && !city && (
                <span style={{ fontSize: '10px', color: 'var(--text3)', flexShrink: 0, maxWidth: '54px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.city}</span>
              )}
              {(e.score !== undefined) && (
                <span style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: '700', flexShrink: 0 }}>{e.score}b</span>
              )}
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--green2)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {fmtTimePrecise4(e.timeMs)}
              </span>
              {e.moves !== undefined && (
                <span style={{ fontSize: '10px', color: 'var(--text3)', flexShrink: 0 }}>{e.moves}t</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ MEMORY GAME ═══════════════════════ */

const DIFFS = {
  '4×4':   { cols: 4,  pairs: 8,  cardPx: 74 },
  '6×6':   { cols: 6,  pairs: 18, cardPx: 52 },
  '8×8':   { cols: 8,  pairs: 32, cardPx: 40 },
  '10×10': { cols: 10, pairs: 50, cardPx: 32 },
} as const;
type DiffKey = keyof typeof DIFFS;

type MemCard = { id: number; pairId: number; code: string };

function MemoryGame({ onComplete }: { onComplete: (timeMs: number, moves: number, diff: string) => void }) {
  const { lang } = useLang();
  const [diff, setDiff]       = useState<DiffKey>('4×4');
  const [cards, setCards]     = useState<MemCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves]     = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalMs, setFinalMs]     = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver]       = useState(false);
  const [locked, setLocked]   = useState(false);
  const best = lsGet<Record<DiffKey, number>>('mem_best', {} as Record<DiffKey, number>);
  const startRef = useRef<number>(0);
  const rafRef   = useRef<number>(0);

  const initGame = useCallback((d: DiffKey) => {
    cancelAnimationFrame(rafRef.current);
    const { pairs } = DIFFS[d];
    const seed = dateSeed();
    const countries = seededShuffle(UNIQUE_COUNTRIES, seed).slice(0, pairs);
    const deck: MemCard[] = [];
    countries.forEach((c, i) => {
      deck.push({ id: i * 2, pairId: i, code: c.code });
      deck.push({ id: i * 2 + 1, pairId: i, code: c.code });
    });
    setCards(seededShuffle(deck, seed + 7));
    setFlipped([]); setMatched(new Set()); setMoves(0); setElapsedMs(0); setFinalMs(0);
    setRunning(false); setOver(false); setLocked(false);
  }, []);

  useEffect(() => { initGame(diff); }, [diff, initGame]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function handleClick(cardId: number) {
    if (locked || over || flipped.length >= 2 || flipped.includes(cardId) || matched.has(cardId)) return;
    if (!running) {
      setRunning(true);
      startRef.current = performance.now();
      const tick = () => {
        setElapsedMs(performance.now() - startRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }
    const next = [...flipped, cardId];
    setFlipped(next);
    if (next.length === 2) {
      const newMoves = moves + 1;
      setMoves(newMoves);
      const [a, b] = next;
      const ca = cards.find(c => c.id === a)!;
      const cb = cards.find(c => c.id === b)!;
      if (ca.pairId === cb.pairId) {
        const nm = new Set(matched); nm.add(a); nm.add(b);
        setMatched(nm); setFlipped([]);
        if (nm.size === cards.length) {
          cancelAnimationFrame(rafRef.current);
          const done = performance.now() - startRef.current;
          setFinalMs(done); setElapsedMs(done);
          setOver(true); setRunning(false);
          const prev = best[diff] ?? Infinity;
          if (newMoves < prev) lsSet('mem_best', { ...best, [diff]: newMoves });
          setTimeout(() => onComplete(done, newMoves, diff), 400);
        }
      } else {
        setLocked(true);
        setTimeout(() => { setFlipped([]); setLocked(false); }, 900);
      }
    }
  }

  const { cols, cardPx } = DIFFS[diff];
  const emojiSz = cols <= 4 ? 28 : cols <= 6 ? 20 : cols <= 8 ? 15 : 12;

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {(Object.keys(DIFFS) as DiffKey[]).map(d => (
          <button key={d} onClick={() => setDiff(d)} style={{
            flex: 1, padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
            background: d === diff ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.06)',
            color: d === diff ? '#fff' : 'var(--text3)',
          }}>{d}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <StatChip label="Tahy" value={moves} />
        <StatChip label="Čas" value={fmtTimeCenti(elapsedMs)} />
        <StatChip label="Páry" value={`${matched.size / 2}/${DIFFS[diff].pairs}`} />
        <button onClick={() => initGame(diff)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text3)', fontSize: '13px', padding: '0 12px', cursor: 'pointer' }}>↺</button>
      </div>

      {best[diff] && <div style={{ marginBottom: '10px' }}><BestBadge label={diff} value={`${best[diff]} tahů`} /></div>}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '4px' }}>
        {cards.map(card => {
          const isFlipped  = flipped.includes(card.id) || matched.has(card.id);
          const isMatched  = matched.has(card.id);
          const isActive   = flipped.includes(card.id) && !isMatched;
          return (
            <div
              key={card.id}
              onClick={() => handleClick(card.id)}
              style={{ height: cardPx, perspective: '600px', cursor: isFlipped || locked ? 'default' : 'pointer' }}
            >
              <div style={{
                width: '100%', height: '100%', position: 'relative',
                transformStyle: 'preserve-3d', transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  background: 'rgba(93,76,255,0.15)', border: '1px solid rgba(93,76,255,0.3)',
                  borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: Math.max(emojiSz - 6, 10), color: 'rgba(93,76,255,0.5)',
                }}>✦</div>
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: isMatched ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.07)',
                  border: isMatched ? '1px solid rgba(34,197,94,0.45)' : isActive ? '1px solid rgba(93,76,255,0.7)' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '1px',
                  boxShadow: isActive ? '0 0 14px rgba(93,76,255,0.55)' : 'none',
                }}>
                  <span style={{ fontSize: emojiSz, lineHeight: 1 }}>{flagEmoji(card.code)}</span>
                  {cols <= 6 && (
                    <span style={{ fontSize: '7px', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                      {getCountryName(card.code, lang)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {over && (
        <div style={{ marginTop: '14px', background: 'linear-gradient(135deg, rgba(93,76,255,0.15), rgba(59,130,246,0.1))', border: '1px solid rgba(93,76,255,0.35)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎉</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '700', color: '#fff' }}>Splněno!</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{moves} tahů · {fmtTimePrecise4(finalMs)}</div>
          <button onClick={() => initGame(diff)} style={{ marginTop: '12px', background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '9px', color: '#fff', fontSize: '13px', padding: '9px 24px', cursor: 'pointer', fontWeight: '600' }}>
            Hrát znovu
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ WORD CHAIN ═══════════════════════ */

type WCPhase = 'showing' | 'recall' | 'success' | 'fail';

const WC_WORD_SHOW_MS = 1500;

function WordChain({ onComplete }: { onComplete: (timeMs: number, score: number) => void }) {
  const { lang } = useLang();
  const [round, setRound]         = useState(1);
  const [sequence, setSequence]   = useState<string[]>([]);
  const [display, setDisplay]     = useState<string[]>([]);
  const [phase, setPhase]         = useState<WCPhase>('showing');
  const [showIdx, setShowIdx]     = useState(-1);
  const [clicked, setClicked]     = useState<string[]>([]);
  const [shakingWord, setShaking] = useState<string | null>(null);
  const [glowWord, setGlowWord]   = useState<string | null>(null);
  // words recalled correctly across all completed rounds
  const [wordsTotal, setWordsTotal] = useState(0);
  const [elapsedMs, setElapsedMs]   = useState(0);
  const [finalWords, setFinalWords] = useState(0);
  const [finalMs, setFinalMs]       = useState(0);
  const bestRef    = useRef(lsGet<number>('wc_best_words', 0));
  const startRef   = useRef<number>(0);
  const rafRef     = useRef<number>(0);
  const startedRef = useRef(false);

  function startRound(r: number) {
    const bank = WORD_BANKS[lang] ?? WORD_BANKS.en;
    const seed = dateSeed() + r * 37;
    const seq = seededShuffle(bank, seed).slice(0, r + 2);
    setSequence(seq);
    setDisplay(seededShuffle(seq, seed + 1));
    setPhase('showing');
    setShowIdx(-1);
    setClicked([]);
    setShaking(null);
    setGlowWord(null);
  }

  useEffect(() => {
    startRound(1); setRound(1); setWordsTotal(0);
    setElapsedMs(0); setFinalWords(0); setFinalMs(0);
    startedRef.current = false;
    cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    const bank = WORD_BANKS[lang] ?? WORD_BANKS.en;
    console.log(`[WordChain] Lang: ${lang}, word bank: ${bank.length} words`);
  }, [lang]);

  useEffect(() => {
    if (phase !== 'showing') return;
    if (showIdx >= sequence.length - 1) {
      const t = setTimeout(() => setPhase('recall'), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowIdx(i => i + 1), WC_WORD_SHOW_MS);
    return () => clearTimeout(t);
  }, [phase, showIdx, sequence.length]);

  function handleWordClick(word: string) {
    if (phase !== 'recall') return;
    if (!startedRef.current) {
      startedRef.current = true;
      startRef.current = performance.now();
      const tick = () => {
        setElapsedMs(performance.now() - startRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }
    const expected = sequence[clicked.length];
    if (word === expected) {
      setGlowWord(word);
      setTimeout(() => setGlowWord(null), 500);
      const next = [...clicked, word];
      setClicked(next);
      if (next.length === sequence.length) {
        setPhase('success');
        const newTotal = wordsTotal + sequence.length;
        setWordsTotal(newTotal);
        if (newTotal > bestRef.current) {
          bestRef.current = newTotal;
          lsSet('wc_best_words', newTotal);
        }
        setTimeout(() => {
          const nextRound = round + 1;
          setRound(nextRound);
          startRound(nextRound);
        }, 1200);
      }
    } else {
      setShaking(word);
      cancelAnimationFrame(rafRef.current);
      const done = startedRef.current ? performance.now() - startRef.current : 1;
      const total = wordsTotal + clicked.length;
      setElapsedMs(done);
      setFinalMs(done);
      setFinalWords(total);
      if (total > bestRef.current) {
        bestRef.current = total;
        lsSet('wc_best_words', total);
      }
      setTimeout(() => setShaking(null), 600);
      setTimeout(() => {
        setPhase('fail');
        onComplete(done, total);
      }, 700);
    }
  }

  function restart() {
    cancelAnimationFrame(rafRef.current);
    startedRef.current = false;
    setRound(1); setWordsTotal(0); setElapsedMs(0); setFinalWords(0); setFinalMs(0);
    startRound(1);
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <StatChip label="Kolo" value={round} />
        <StatChip label="Sekvence" value={sequence.length} />
        <StatChip label="Slova" value={wordsTotal} />
        <StatChip label="Čas" value={fmtTimeCenti(elapsedMs)} />
        {bestRef.current > 0 && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}><BestBadge label="Rekord" value={`${bestRef.current} slov`} /></div>}
      </div>

      {phase === 'showing' && (
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Zapamatuj si pořadí!
          </div>
          {/* current word highlight + countdown bar */}
          {showIdx >= 0 && showIdx < sequence.length && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'inline-block', fontSize: '22px', fontWeight: '700', color: '#fff',
                background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
                borderRadius: '12px', padding: '10px 28px',
                boxShadow: '0 0 24px rgba(93,76,255,0.5)',
                animation: 'wordPop 0.25s ease',
              }}>
                {sequence[showIdx]}
              </div>
              <div style={{ marginTop: '8px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', maxWidth: '160px', margin: '8px auto 0' }}>
                <div style={{
                  height: '100%', borderRadius: '2px',
                  background: 'linear-gradient(90deg, var(--purple), #7A3FFF)',
                  animation: `wcCountdown ${WC_WORD_SHOW_MS}ms linear`,
                }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>
                {showIdx + 1} / {sequence.length}
              </div>
            </div>
          )}
          {/* sequence progress dots */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '4px' }}>
            {sequence.map((w, i) => (
              <div key={w + i} style={{
                padding: '5px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                background: i < showIdx ? 'rgba(93,76,255,0.18)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: i < showIdx ? 'var(--purple3)' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.2s',
              }}>
                {i < showIdx ? w : '—'}
              </div>
            ))}
          </div>
        </div>
      )}

      {(phase === 'recall' || phase === 'success') && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px', textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {phase === 'success' ? '✅ Správně! Připravuji další…' : `Klikni ve správném pořadí (${clicked.length + 1}/${sequence.length})`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {display.map((w, i) => {
              const isClicked = clicked.includes(w);
              const isGlowing = glowWord === w;
              const isShaking = shakingWord === w;
              return (
                <button key={w + i} onClick={() => handleWordClick(w)} disabled={isClicked || phase === 'success'} style={{
                  padding: '9px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                  cursor: isClicked ? 'default' : 'pointer',
                  background: isGlowing ? 'rgba(34,197,94,0.25)' : isClicked ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.07)',
                  color: isClicked ? 'var(--green2)' : '#fff',
                  boxShadow: isGlowing ? '0 0 18px rgba(34,197,94,0.5)' : 'none',
                  border: isGlowing ? '1px solid rgba(34,197,94,0.5)' : isClicked ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.1)',
                  animation: isShaking ? 'shake 0.5s ease' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}>
                  {isClicked ? `✓ ${w}` : w}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '14px' }}>
            {sequence.map((_, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < clicked.length ? 'var(--green2)' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'fail' && (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>😅</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
            Zapamatoval/a jsi {finalWords} {finalWords === 1 ? 'slovo' : finalWords < 5 ? 'slova' : 'slov'}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '600', color: 'var(--green2)', marginBottom: '4px', fontVariantNumeric: 'tabular-nums' }}>
            za {fmtTimeCenti(finalMs)}
          </div>
          {finalWords >= bestRef.current && finalWords > 0 && (
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFB300', marginBottom: '8px', animation: 'newRecBadge 0.5s cubic-bezier(.34,1.56,.64,1) both' }}>
              🏆 Nový rekord!
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>
            Správné pořadí: {sequence.join(' → ')}
          </div>
          <button onClick={restart} style={{ background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '9px', color: '#fff', fontSize: '13px', padding: '9px 24px', cursor: 'pointer', fontWeight: '600' }}>
            Hrát znovu
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ FLAG QUIZ ═══════════════════════ */

type FQState   = 'playing' | 'answered' | 'done';
type FQDiff    = 'easy' | 'normal' | 'hard';
type FQVariant = 'A' | 'B';
type Question  = { correct: Country; options: Country[] };
type FQRecord  = { score: number; time: number; date: number; diff: FQDiff; variant: FQVariant };

const TOTAL_Q = 10;
const SHARE_URL = 'everyday-app.vercel.app';

const FQ_DIFFS: { key: FQDiff; label: string; pool: Country[] }[] = [
  { key: 'easy',   label: '🟢 Lehká',   pool: POOL_EASY   },
  { key: 'normal', label: '🟡 Střední', pool: POOL_NORMAL },
  { key: 'hard',   label: '🔴 Těžká',   pool: POOL_HARD   },
];

const CONFETTI_COLORS = ['#5D4CFF','#FFB300','#4ade80','#f87171','#60a5fa','#e879f9','#fb923c'];

function ConfettiBurst() {
  const pieces = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 2 * Math.PI;
    const r     = 56 + (i % 4) * 18;
    return {
      tx: Math.round(Math.cos(angle) * r),
      ty: Math.round(Math.sin(angle) * r),
      color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size:   i % 2 === 0 ? 7 : 5,
      round:  i % 3 !== 0,
      delay:  (i % 5) * 55,
    };
  });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: p.size, height: p.size,
          marginLeft: -p.size / 2, marginTop: -p.size / 2,
          borderRadius: p.round ? '50%' : '2px',
          background: p.color,
          animation: `cflyOut 0.65s ease-out ${p.delay}ms both`,
          ['--tx' as string]: `${p.tx}px`,
          ['--ty' as string]: `${p.ty}px`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// Always 4 options
function buildQuestions(seed: number, pool: Country[]): Question[] {
  const shuffled = seededShuffle(pool, seed);
  return shuffled.slice(0, TOTAL_Q).map((correct, i) => {
    const wrong = seededShuffle(
      shuffled.filter(c => c.code !== correct.code), seed + i + 1
    ).slice(0, 3);
    return { correct, options: seededShuffle([correct, ...wrong], seed + i + 99) };
  });
}

function optionColors(
  code: string, correct: string, selected: string | null, state: FQState
): { bg: string; border: string; color: string; shadow: string; anim: string } {
  const isCorrect  = code === correct;
  const isSelected = code === selected;
  const show       = state === 'answered';
  if (show && isCorrect)                return { bg: 'rgba(34,197,94,0.15)',  border: '1px solid rgba(34,197,94,0.5)',  color: 'var(--green2)', shadow: '0 0 16px rgba(34,197,94,0.3)', anim: 'none' };
  if (show && isSelected && !isCorrect) return { bg: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)',  color: '#EF4444',       shadow: 'none',                         anim: 'shake 0.4s ease' };
  return { bg: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', shadow: 'none', anim: 'none' };
}

function FlagQuiz({ onComplete }: { onComplete: (timeMs: number, score: number, diff: string) => void }) {
  const { lang } = useLang();
  const [diff,        setDiff]        = useState<FQDiff>('normal');
  const [variant,     setVariant]     = useState<FQVariant>('A');
  const [questions,   setQuestions]   = useState<Question[]>([]);
  const [current,     setCurrent]     = useState(0);
  const [score,       setScore]       = useState(0);
  const [selected,    setSelected]    = useState<string | null>(null);
  const [state,       setState]       = useState<FQState>('playing');
  const [streak,      setStreak]      = useState(0);
  const [maxStreak,   setMaxStreak]   = useState(0);
  const [liveMs,      setLiveMs]      = useState(0);
  const [finalMs,     setFinalMs]     = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [copied,      setCopied]      = useState(false);

  const startTimeRef  = useRef<number | null>(null);
  const rafRef        = useRef<number>(0);
  const recordsRef    = useRef<FQRecord[]>(lsGet<FQRecord[]>('fq_records', []));

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function stopTimer(): number {
    cancelAnimationFrame(rafRef.current);
    return startTimeRef.current ? performance.now() - startTimeRef.current : 0;
  }

  function init(d: FQDiff = diff, v: FQVariant = variant) {
    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    const cfg = FQ_DIFFS.find(x => x.key === d)!;
    setQuestions(buildQuestions(dateSeed() + Math.floor(Math.random() * 1000), cfg.pool));
    setCurrent(0); setScore(0); setSelected(null); setState('playing');
    setStreak(0); setMaxStreak(0);
    setLiveMs(0); setFinalMs(0); setIsNewRecord(false); setCopied(false);
  }

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDiff(d: FQDiff)       { setDiff(d);    init(d, variant); }
  function handleVariant(v: FQVariant) { setVariant(v); init(diff, v); }

  function handleAnswer(code: string) {
    if (state !== 'playing' || selected) return;

    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
      const tick = () => {
        setLiveMs(performance.now() - startTimeRef.current!);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    setSelected(code);
    setState('answered');
    const isCorrect  = questions[current]?.correct.code === code;
    const newScore   = isCorrect ? score + 1 : score;
    const newStreak  = isCorrect ? streak + 1 : 0;
    if (isCorrect) setScore(newScore);
    setStreak(newStreak);
    setMaxStreak(m => Math.max(m, newStreak));

    setTimeout(() => {
      if (current + 1 >= TOTAL_Q) {
        const elapsed = stopTimer();
        setFinalMs(elapsed);
        setState('done');

        const prevRecs = recordsRef.current.filter(r => r.diff === diff && r.variant === variant);
        const prevBestScore = prevRecs.length ? Math.max(...prevRecs.map(r => r.score)) : -1;
        const prevBestTime  = prevRecs.filter(r => r.score === prevBestScore).reduce((m, r) => Math.min(m, r.time), Infinity);
        const isRecord = newScore > prevBestScore || (newScore === prevBestScore && elapsed < prevBestTime);
        setIsNewRecord(isRecord);

        const entry: FQRecord = { score: newScore, time: Math.round(elapsed / 1000), date: Date.now(), diff, variant };
        const updated = [...recordsRef.current, entry].sort((a, b) => b.score - a.score || a.time - b.time);
        recordsRef.current = updated;
        lsSet('fq_records', updated);
        setTimeout(() => onComplete(elapsed, newScore, `${diff}-${variant}`), 400);
      } else {
        setCurrent(c => c + 1);
        setSelected(null);
        setState('playing');
      }
    }, 1100);
  }

  async function handleShare() {
    const diffLabel = FQ_DIFFS.find(d => d.key === diff)?.label ?? diff;
    const text = `🌍 Flag Quiz (${diffLabel}): ${score}/${TOTAL_Q} za ${fmtTimePrecise4(finalMs)}!${isNewRecord ? ' 🏆 Nový rekord!' : ''} Dokážeš mě porazit? ${SHARE_URL}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* cancelled */ }
    }
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  if (!questions.length) return null;
  const q      = questions[current];
  const top5   = recordsRef.current.slice(0, 5);

  return (
    <div>
      {/* ── Variant toggle ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {([
          { v: 'A' as FQVariant, label: '🚩 Vlajka → Název' },
          { v: 'B' as FQVariant, label: '🔤 Název → Vlajka' },
        ]).map(({ v, label }) => (
          <button key={v} onClick={() => handleVariant(v)} style={{
            flex: 1, padding: '7px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: '600',
            background: v === variant ? 'rgba(93,76,255,0.25)' : 'rgba(255,255,255,0.04)',
            color: v === variant ? 'var(--purple3)' : 'var(--text3)',
            outline: v === variant ? '1px solid rgba(93,76,255,0.5)' : '1px solid rgba(255,255,255,0.06)',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Difficulty selector ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {FQ_DIFFS.map(d => (
          <button key={d.key} onClick={() => handleDiff(d.key)} style={{
            flex: 1, padding: '6px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11px', fontWeight: '600',
            background: d.key === diff ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.06)',
            color: d.key === diff ? '#fff' : 'var(--text3)',
          }}>{d.label}</button>
        ))}
      </div>

      {/* ── In-game ── */}
      {state !== 'done' && (
        <>
          {/* Progress + live timer */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '5px' }}>
              <span>Otázka {current + 1} / {TOTAL_Q}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {streak >= 2 && <span style={{ animation: 'firePulse 1s infinite', display: 'inline-block' }}>🔥 {streak}</span>}
                <span>✅ {score}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: liveMs > 0 ? 'var(--text2)' : 'var(--text3)', fontFamily: 'monospace' }}>
                  ⏱ {fmtTimeCenti(liveMs)}
                </span>
              </div>
            </div>
            <div style={{ height: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(current / TOTAL_Q) * 100}%`, background: 'linear-gradient(90deg, var(--purple), var(--blue2))', borderRadius: '4px', transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Variant A: flag → text options */}
          {variant === 'A' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{
                  display: 'inline-block', fontSize: '96px', lineHeight: 1,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '18px', padding: '14px 24px',
                  boxShadow: '0 0 40px rgba(93,76,255,0.12)',
                }}>
                  {flagEmoji(q.correct.code)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
                  Které zemi patří tato vlajka?
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {q.options.map(opt => {
                  const { bg, border, color, shadow, anim } = optionColors(opt.code, q.correct.code, selected, state);
                  const isC = opt.code === q.correct.code;
                  const isS = opt.code === selected;
                  return (
                    <button key={opt.code} onClick={() => handleAnswer(opt.code)} disabled={!!selected} style={{
                      padding: '14px 12px', borderRadius: '10px', border, background: bg, color,
                      fontSize: '13px', fontWeight: '600', cursor: selected ? 'default' : 'pointer',
                      textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      boxShadow: shadow, animation: anim, transition: 'all 0.2s',
                    }}>
                      <span style={{ lineHeight: 1.3 }}>{getCountryName(opt.code, lang)}</span>
                      {state === 'answered' && isC && <span style={{ flexShrink: 0 }}>✓</span>}
                      {state === 'answered' && isS && !isC && <span style={{ flexShrink: 0 }}>✗</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Variant B: name → flag options */}
          {variant === 'B' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '18px', padding: '18px 32px',
                  boxShadow: '0 0 40px rgba(93,76,255,0.12)',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff', fontFamily: 'Poppins, sans-serif', lineHeight: 1.2 }}>
                    {getCountryName(q.correct.code, lang)}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
                  Která vlajka patří tomuto státu?
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {q.options.map(opt => {
                  const { bg, border, shadow, anim } = optionColors(opt.code, q.correct.code, selected, state);
                  const isC = opt.code === q.correct.code;
                  const isS = opt.code === selected;
                  return (
                    <button key={opt.code} onClick={() => handleAnswer(opt.code)} disabled={!!selected} style={{
                      padding: '18px 8px', borderRadius: '12px', border, background: bg,
                      cursor: selected ? 'default' : 'pointer', position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      boxShadow: shadow, animation: anim, transition: 'all 0.2s',
                    }}>
                      <span style={{ fontSize: '52px', lineHeight: 1 }}>{flagEmoji(opt.code)}</span>
                      {state === 'answered' && isC  && <span style={{ position: 'absolute', top: 6, right: 8, fontSize: '14px', color: 'var(--green2)' }}>✓</span>}
                      {state === 'answered' && isS && !isC && <span style={{ position: 'absolute', top: 6, right: 8, fontSize: '14px', color: '#EF4444' }}>✗</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Results ── */}
      {state === 'done' && (
        <div style={{ textAlign: 'center' }}>

          {/* Score card — pulse gold border on new record */}
          <div style={{
            display: 'inline-block', position: 'relative',
            borderRadius: '16px', padding: '18px 32px', marginBottom: '12px',
            background: isNewRecord
              ? 'linear-gradient(135deg, rgba(255,179,0,0.12), rgba(93,76,255,0.1))'
              : 'rgba(255,255,255,0.03)',
            border: isNewRecord ? '1px solid rgba(255,179,0,0.5)' : '1px solid rgba(255,255,255,0.06)',
            animation: isNewRecord ? 'newRecPulse 0.8s ease-out' : 'none',
          }}>
            {isNewRecord && <ConfettiBurst />}

            <div style={{
              fontSize: '52px', fontWeight: '800', fontFamily: 'Poppins',
              background: 'linear-gradient(135deg, var(--purple3), var(--blue2))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 1,
            }}>
              {score}/{TOTAL_Q}
            </div>
            <div style={{ fontSize: '15px', color: 'var(--text2)', marginTop: '6px', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
              ⏱ {fmtTimePrecise4(finalMs)}
            </div>

            {isNewRecord && (
              <div style={{
                marginTop: '8px', fontSize: '13px', fontWeight: '700',
                color: '#FFB300', animation: 'newRecBadge 0.5s cubic-bezier(.34,1.56,.64,1) 0.1s both',
                letterSpacing: '0.5px',
              }}>
                🏆 NOVÝ REKORD!
              </div>
            )}
          </div>

          {/* Reaction text */}
          <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '14px' }}>
            {score === 10 ? '🏆 Perfektní skóre!' : score >= 8 ? '🌟 Výborně!' : score >= 6 ? '👍 Dobře!' : score >= 4 ? '📚 Trénuj dál' : '🌍 Zeměpis není snadný'}
          </div>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '14px' }}>
            <StatChip label="Správně" value={score} />
            <StatChip label="Špatně"  value={TOTAL_Q - score} />
            {maxStreak >= 2 && <StatChip label="Max série" value={`${maxStreak} 🔥`} />}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
            <button onClick={() => init()} style={{
              background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontSize: '13px', fontWeight: '600', padding: '10px 22px', cursor: 'pointer',
            }}>
              ↺ Hrát znovu
            </button>
            <button onClick={handleShare} style={{
              background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
              border: copied ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px', color: copied ? 'var(--green2)' : 'var(--text2)',
              fontSize: '13px', fontWeight: '600', padding: '10px 22px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              {copied ? '✓ Zkopírováno!' : '↗ Sdílet výsledek'}
            </button>
          </div>

          {/* Local top 5 */}
          {top5.length > 0 && (
            <div style={{ textAlign: 'left', marginTop: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '5px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>🏅 Moje top 5</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {top5.map((rec, i) => {
                  const diffEmoji = rec.diff === 'easy' ? '🟢' : rec.diff === 'normal' ? '🟡' : '🔴';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '13px', width: '20px', flexShrink: 0 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', minWidth: '32px' }}>{rec.score}/{TOTAL_Q}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'monospace' }}>{fmtTimeSecs(rec.time)}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: 'auto' }}>{new Date(rec.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}</span>
                      <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '1px 5px', color: 'var(--text3)' }}>{diffEmoji}{rec.variant}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ SLIDING PUZZLE ═══════════════════════ */


const SP_GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];

function spIsSolvable(tiles: number[]): boolean {
  const arr = tiles.filter(t => t !== 0);
  let inv = 0;
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)
      if (arr[i] > arr[j]) inv++;
  const blankRowFromBottom = 4 - Math.floor(tiles.indexOf(0) / 4);
  return (inv + blankRowFromBottom) % 2 === 0;
}

function spIsSolved(tiles: number[]): boolean {
  return tiles.every((t, i) => t === SP_GOAL[i]);
}

function spGenerate(): number[] {
  let t: number[];
  do {
    t = [...SP_GOAL];
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
  } while (!spIsSolvable(t) || spIsSolved(t));
  return t;
}

function SlidingPuzzle({ onComplete }: { onComplete: (timeMs: number, moves: number) => void }) {
  const [tiles, setTiles]         = useState<number[]>(() => spGenerate());
  const [phase, setPhase]         = useState<'idle' | 'playing' | 'solved'>('idle');
  const [moves, setMoves]         = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalMs, setFinalMs]     = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [bestMs, setBestMs]       = useState<number | null>(() => lsGet<number | null>('sp_best_ms', null));

  const startRef  = useRef<number>(0);
  const rafRef    = useRef<number>(0);
  const activeRef = useRef(false);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function reset() {
    cancelAnimationFrame(rafRef.current);
    activeRef.current = false;
    setTiles(spGenerate());
    setPhase('idle');
    setMoves(0);
    setElapsedMs(0);
    setFinalMs(0);
    setIsNewBest(false);
  }

  function handleTileClick(idx: number) {
    if (phase === 'solved') return;
    const emptyIdx = tiles.indexOf(0);
    const row = Math.floor(idx / 4),      col = idx % 4;
    const eRow = Math.floor(emptyIdx / 4), eCol = emptyIdx % 4;
    if (!(row === eRow && Math.abs(col - eCol) === 1) &&
        !(col === eCol && Math.abs(row - eRow) === 1)) return;

    const next = [...tiles];
    [next[idx], next[emptyIdx]] = [0, next[idx]];
    setTiles(next);
    const newMoves = moves + 1;
    setMoves(newMoves);

    if (!activeRef.current) {
      activeRef.current = true;
      startRef.current  = performance.now();
      setPhase('playing');
      const tick = () => {
        setElapsedMs(performance.now() - startRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    if (spIsSolved(next)) {
      cancelAnimationFrame(rafRef.current);
      activeRef.current = false;
      const done = performance.now() - startRef.current;
      setElapsedMs(done);
      setFinalMs(done);
      setPhase('solved');
      const prev    = lsGet<number | null>('sp_best_ms', null);
      const newBest = !prev || done < prev;
      if (newBest) { lsSet('sp_best_ms', done); setBestMs(done); }
      setIsNewBest(newBest);
      setTimeout(() => onComplete(done, newMoves), 400);
    }
  }

  const emptyIdx = tiles.indexOf(0);
  const eRow = Math.floor(emptyIdx / 4);
  const eCol = emptyIdx % 4;

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <StatChip label="Tahy" value={moves} />
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
          padding: '5px 12px', textAlign: 'center',
        }}>
          <div style={{
            fontSize: '15px', fontWeight: '700', fontFamily: 'monospace',
            letterSpacing: '0.5px', fontVariantNumeric: 'tabular-nums',
            color: phase === 'solved' ? 'var(--green2)' : '#fff',
          }}>
            {fmtTimeCenti(elapsedMs)}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Čas</div>
        </div>
        <button onClick={reset} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', color: 'var(--text3)', fontSize: '13px',
          padding: '0 14px', cursor: 'pointer', alignSelf: 'stretch',
        }}>↺</button>
      </div>

      {bestMs !== null && phase !== 'solved' && (
        <div style={{ marginBottom: '10px' }}>
          <BestBadge label="Nejlepší čas" value={fmtTimePrecise4(bestMs!)} />
        </div>
      )}

      {phase === 'idle' && (
        <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          Klikni na dlaždici pro start ↓
        </div>
      )}

      {/* 4×4 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', maxWidth: '280px', margin: '0 auto' }}>
        {tiles.map((tile, idx) => {
          if (tile === 0) return <div key="empty" style={{ height: '64px' }} />;
          const tRow = Math.floor(idx / 4), tCol = idx % 4;
          const canSlide = (tRow === eRow && Math.abs(tCol - eCol) === 1) ||
                           (tCol === eCol && Math.abs(tRow - eRow) === 1);
          const inPlace  = SP_GOAL[idx] === tile && phase === 'playing';
          return (
            <button
              key={tile}
              onClick={() => handleTileClick(idx)}
              style={{
                height: '64px', borderRadius: '10px',
                fontSize: '20px', fontWeight: '700', fontFamily: 'Poppins', color: '#fff',
                cursor: canSlide ? 'pointer' : 'default',
                border: phase === 'solved'
                  ? '1px solid rgba(34,197,94,0.5)'
                  : canSlide
                  ? '1px solid rgba(93,76,255,0.8)'
                  : inPlace
                  ? '1px solid rgba(34,197,94,0.2)'
                  : '1px solid rgba(93,76,255,0.28)',
                background: phase === 'solved'
                  ? 'rgba(34,197,94,0.13)'
                  : canSlide
                  ? 'rgba(93,76,255,0.28)'
                  : inPlace
                  ? 'rgba(34,197,94,0.07)'
                  : 'rgba(93,76,255,0.10)',
                boxShadow: canSlide ? '0 0 10px rgba(93,76,255,0.35)' : 'none',
                transition: 'background 0.12s, border 0.12s, box-shadow 0.12s',
              }}
            >
              {tile}
            </button>
          );
        })}
      </div>

      {/* Solved panel */}
      {phase === 'solved' && (
        <div style={{
          marginTop: '16px',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(93,76,255,0.06))',
          border: '1px solid rgba(34,197,94,0.3)', borderRadius: '14px',
          padding: '16px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '26px', marginBottom: '6px' }}>🎉</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
            Vyřešeno!
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: '700', color: 'var(--green2)', fontVariantNumeric: 'tabular-nums', marginBottom: '2px' }}>
            {fmtTimePrecise4(finalMs)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: isNewBest ? '4px' : '12px' }}>
            {moves} tahů
          </div>
          {isNewBest && (
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFB300', marginBottom: '12px', animation: 'newRecBadge 0.5s cubic-bezier(.34,1.56,.64,1) both' }}>
              🏆 Nový rekord!
            </div>
          )}

          <button onClick={reset} style={{
            background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
            border: 'none', borderRadius: '9px', color: '#fff',
            fontSize: '13px', fontWeight: '600', padding: '9px 22px', cursor: 'pointer',
          }}>
            ↺ Hrát znovu
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ MAIN ═══════════════════════ */

type TabId = 'memory' | 'wordchain' | 'flagquiz' | 'sliding';
const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'memory',    label: 'Pexeso',  emoji: '🃏' },
  { id: 'wordchain', label: 'Řetěz',   emoji: '📝' },
  { id: 'flagquiz',  label: 'Vlajky',  emoji: '🌍' },
  { id: 'sliding',   label: 'Puzzle',  emoji: '🧩' },
];

type ModalState = { game: GameId; timeMs: number; score?: number; moves?: number; diff?: string } | null;

export default function DailyGames() {
  const [tab,         setTab]         = useState<TabId>('memory');
  const [modal,       setModal]       = useState<ModalState>(null);
  const [showLB,      setShowLB]      = useState(false);
  const [lbGame,      setLbGame]      = useState<GameId>('sliding');

  function openModal(game: GameId, timeMs: number, extra?: { score?: number; moves?: number; diff?: string }) {
    setModal({ game, timeMs, ...extra });
  }

  function handleShowLeaderboard() {
    if (modal) setLbGame(modal.game);
    setShowLB(true);
  }

  return (
    <div className="card" style={CARD_BG}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', margin: 0 }}>
          🎮 Denní hry
        </h2>
        <button onClick={() => { setShowLB(s => !s); if (!showLB) setLbGame(tab as GameId); }} style={{
          background: showLB ? 'rgba(255,179,0,0.12)' : 'rgba(255,255,255,0.06)',
          border: showLB ? '1px solid rgba(255,179,0,0.3)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', color: showLB ? '#FFB300' : 'var(--text3)',
          fontSize: '12px', fontWeight: '600', padding: '5px 12px', cursor: 'pointer',
        }}>🏆 Žebříček</button>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            fontWeight: '600', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            background: t.id === tab ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.05)',
            color: t.id === tab ? '#fff' : 'var(--text2)',
          }}>
            <span>{t.emoji}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'memory'    && <MemoryGame    onComplete={(ms, mv, df) => openModal('memory',    ms, { moves: mv, diff: df })} />}
      {tab === 'wordchain' && <WordChain     onComplete={(ms, sc)     => openModal('wordchain', ms, { score: sc })} />}
      {tab === 'flagquiz'  && <FlagQuiz      onComplete={(ms, sc, df) => openModal('flagquiz',  ms, { score: sc, diff: df })} />}
      {tab === 'sliding'   && <SlidingPuzzle onComplete={(ms, mv)     => openModal('sliding',   ms, { moves: mv })} />}

      {showLB && (
        <GlobalLeaderboard initialGame={lbGame} />
      )}

      {modal && (
        <LeaderboardModal
          game={modal.game}
          timeMs={modal.timeMs}
          score={modal.score}
          moves={modal.moves}
          diff={modal.diff}
          onClose={() => setModal(null)}
          onShowLeaderboard={handleShowLeaderboard}
        />
      )}

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-7px); }
          40%      { transform: translateX(7px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes wordPop {
          0%   { transform: scale(0.85); opacity: 0.4; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes firePulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.3); }
        }
        @keyframes cflyOut {
          from { opacity: 1; transform: translate(0,0) scale(1) rotate(0deg); }
          to   { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.25) rotate(200deg); }
        }
        @keyframes newRecPulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,179,0,0.7); }
          50%  { box-shadow: 0 0 0 18px rgba(255,179,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,179,0,0); }
        }
        @keyframes newRecBadge {
          from { opacity: 0; transform: scale(0.5) translateY(6px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wcCountdown {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
