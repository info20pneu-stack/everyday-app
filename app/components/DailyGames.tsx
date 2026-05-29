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

type GameId = 'sliding' | 'memory' | 'flagquiz' | 'wordchain' | 'mathrush' | 'reflex' | 'reaction' | 'stack' | 'felixjump';
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
  const { lang, t } = useLang();
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
        setSubmitErr((data.error as string) || t.games.submitError);
      }
    } catch {
      setSubmitErr(t.games.connectionError);
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
  const gameLabel: Record<GameId, string> = {
    sliding:   `🧩 ${t.games.sliding}`,
    memory:    `🃏 ${t.games.memory}`,
    flagquiz:  `🌍 ${t.games.flagquiz}`,
    wordchain: `📝 ${t.games.wordchain}`,
    mathrush:  `🔢 ${t.games.mathrush}`,
    reflex:    `⏱ ${t.games.reflex}`,
    reaction:  `⚡ ${t.games.reaction}`,
    stack:     `🏗 ${t.games.stackGame}`,
    felixjump: `🏃 ${t.games.felixJump}`,
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={box}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>🏆</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: '700', color: '#fff' }}>
            {gameLabel[game]} {t.games.completed}
          </div>
        </div>

        {/* Result display */}
        <div style={{ textAlign: 'center', marginBottom: '16px', padding: '14px 12px', background: 'rgba(93,76,255,0.1)', borderRadius: '12px', border: '1px solid rgba(93,76,255,0.25)' }}>
          {game === 'mathrush' && score !== undefined ? (
            <>
              <div style={{ fontFamily: 'Poppins', fontSize: '60px', fontWeight: '900', background: 'linear-gradient(135deg,var(--purple3),#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                {t.games.correct} · 60s{diff ? ` · ${diff}` : ''}
              </div>
            </>
          ) : game === 'reflex' ? (
            <>
              <div style={{ fontFamily: 'Poppins', fontSize: '44px', fontWeight: '900', color: timeMs < 100 ? 'var(--green2)' : timeMs < 300 ? '#FFB300' : '#EF4444', lineHeight: 1 }}>±{timeMs}ms</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{t.games.avgDev}</div>
            </>
          ) : game === 'reaction' ? (
            <>
              <div style={{ fontFamily: 'Poppins', fontSize: '44px', fontWeight: '900', color: timeMs < 200 ? 'var(--green2)' : timeMs < 350 ? '#FFB300' : '#EF4444', lineHeight: 1 }}>{timeMs}ms</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{t.games.avgReact}</div>
            </>
          ) : game === 'stack' || game === 'felixjump' ? (
            <>
              <div style={{ fontFamily: 'Poppins', fontSize: '60px', fontWeight: '900', background: 'linear-gradient(135deg,var(--purple3),#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{score ?? 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                {game === 'stack' ? t.games.blocks : t.games.distance}
              </div>
            </>
          ) : game === 'wordchain' && score !== undefined ? (
            <>
              <div style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                {t.games.youRemembered} {score} {wPlural(score, t.games)}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: '700', color: 'var(--green2)', letterSpacing: '1px', fontVariantNumeric: 'tabular-nums' }}>
                {t.games.inTime} {fmtTimePrecise4(timeMs)}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: '700', color: 'var(--green2)', letterSpacing: '1px', fontVariantNumeric: 'tabular-nums' }}>
                {fmtTimePrecise4(timeMs)}
              </div>
              {score !== undefined && (
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                  {t.games.score}: {score}{moves !== undefined ? ` · ${moves} ${t.games.moves}` : ''}
                </div>
              )}
              {score === undefined && moves !== undefined && (
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{moves} {t.games.moves}</div>
              )}
            </>
          )}
        </div>

        {phase === 'form' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text" placeholder={t.games.nickPlaceholder} value={nick} maxLength={30}
                onChange={e => setNick(e.target.value.slice(0, 30))}
                style={inputSt}
              />
              <select value={country} onChange={e => setCountry(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                <option value="">{t.games.countryPlaceholder}</option>
                {WORLD_COUNTRIES.map(code => (
                  <option key={code} value={code}>
                    {flagEmoji(code)} {getCountryName(code, lang)}
                  </option>
                ))}
              </select>
              <input
                type="text" placeholder={t.games.cityPlaceholder} value={city} maxLength={60}
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
                {submitting ? '…' : t.games.submitToLb}
              </button>
              <button onClick={onClose} style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px', color: 'var(--text2)', fontSize: '13px', fontWeight: '600',
                padding: '11px', cursor: 'pointer',
              }}>
                {t.games.skip}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: '700', color: 'var(--green2)' }}>
                {t.games.addedToLb}
              </div>
              {myRank && (
                <div style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '6px' }}>
                  {t.games.rankIs} <span style={{ color: '#FFB300', fontWeight: '700' }}>#{myRank}</span> {t.games.rankGlobal}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { onShowLeaderboard(); onClose(); }} style={{
                flex: 2, background: 'rgba(255,179,0,0.12)', border: '1px solid rgba(255,179,0,0.3)',
                borderRadius: '10px', color: '#FFB300', fontSize: '14px', fontWeight: '600',
                padding: '11px', cursor: 'pointer',
              }}>
                {t.games.showLeaderboard}
              </button>
              <button onClick={onClose} style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px', color: 'var(--text2)', fontSize: '13px', fontWeight: '600',
                padding: '11px', cursor: 'pointer',
              }}>
                {t.games.close}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ GLOBAL LEADERBOARD ═══════════════════════ */

// wPlural: pick correct plural form for word count
function wPlural(n: number, g: { wordsOne: string; wordsFew: string; wordsMany: string }) {
  return n === 1 ? g.wordsOne : n < 5 ? g.wordsFew : g.wordsMany;
}

function GlobalLeaderboard({ initialGame }: { initialGame: GameId }) {
  const { lang, t } = useLang();
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

  const glGameLabel: Record<GameId, string> = {
    sliding:   `🧩 ${t.games.sliding}`,
    memory:    `🃏 ${t.games.memory}`,
    flagquiz:  `🌍 ${t.games.flagquiz}`,
    wordchain: `📝 ${t.games.wordchain}`,
    mathrush:  `🔢 ${t.games.mathrush}`,
    reflex:    `⏱ ${t.games.reflex}`,
    reaction:  `⚡ ${t.games.reaction}`,
    stack:     `🏗 ${t.games.stackGame}`,
    felixjump: `🏃 ${t.games.felixJump}`,
  };
  const periodOpts = [
    { v: 'all',   label: t.games.allTime },
    { v: 'month', label: t.games.month },
    { v: 'week',  label: t.games.week },
    { v: 'today', label: t.games.today },
  ];

  return (
    <div style={{ marginTop: '14px' }}>
      {/* Game selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {(['sliding','memory','flagquiz','wordchain','mathrush','reflex','reaction','stack','felixjump'] as GameId[]).map(g => (
          <button key={g} onClick={() => setGame(g)} style={{
            padding: '5px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap',
            background: g === game ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.06)',
            color: g === game ? '#fff' : 'var(--text3)',
          }}>{glGameLabel[g]}</button>
        ))}
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
        {periodOpts.map(p => (
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
          <option value="">🌍 {t.games.allCountries} ({entries.length})</option>
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
            <option value="">{t.games.allCities}</option>
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
        {country ? `${flagEmoji(country)} ${getCountryName(country, lang)}${city ? ' · ' + city : ''} — ${filtered.length} ${t.games.players}` : `🌍 ${t.games.globalTop100}`}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--text3)' }}>{t.games.loading}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--text3)' }}>
          {entries.length === 0 ? t.games.noRecords : t.games.noPlayersArea}
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
              {/* Score badge — for score-based games */}
              {(game === 'mathrush' || game === 'stack' || game === 'felixjump') && e.score !== undefined && (
                <span style={{ fontSize: '13px', color: 'var(--purple3)', fontWeight: '800', fontFamily: 'Poppins', flexShrink: 0 }}>{e.score}</span>
              )}
              {(game === 'flagquiz' || game === 'wordchain') && e.score !== undefined && (
                <span style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: '700', flexShrink: 0 }}>{e.score}b</span>
              )}
              {/* Time metric — formatted per game type */}
              {game === 'reflex' && (
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: e.timeMs < 100 ? 'var(--green2)' : e.timeMs < 300 ? '#FFB300' : '#EF4444', flexShrink: 0 }}>±{e.timeMs}ms</span>
              )}
              {game === 'reaction' && (
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: e.timeMs < 200 ? 'var(--green2)' : e.timeMs < 350 ? '#FFB300' : '#EF4444', flexShrink: 0 }}>{e.timeMs}ms</span>
              )}
              {game !== 'reflex' && game !== 'reaction' && game !== 'stack' && game !== 'felixjump' && (
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--green2)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {fmtTimePrecise4(e.timeMs)}
                </span>
              )}
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
  const { lang, t } = useLang();
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
        <StatChip label={t.games.moves} value={moves} />
        <StatChip label={t.games.time} value={fmtTimeCenti(elapsedMs)} />
        <StatChip label={t.games.pairs} value={`${matched.size / 2}/${DIFFS[diff].pairs}`} />
        <button onClick={() => initGame(diff)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text3)', fontSize: '13px', padding: '0 12px', cursor: 'pointer' }}>↺</button>
      </div>

      {best[diff] && <div style={{ marginBottom: '10px' }}><BestBadge label={diff} value={`${best[diff]} ${t.games.moves}`} /></div>}

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
          <div style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '700', color: '#fff' }}>{t.games.completed}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{moves} {t.games.moves} · {fmtTimePrecise4(finalMs)}</div>
          <button onClick={() => initGame(diff)} style={{ marginTop: '12px', background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '9px', color: '#fff', fontSize: '13px', padding: '9px 24px', cursor: 'pointer', fontWeight: '600' }}>
            {t.games.playAgain}
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
  const { lang, t } = useLang();
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
        <StatChip label={t.games.round} value={round} />
        <StatChip label={t.games.sequence} value={sequence.length} />
        <StatChip label={t.games.words} value={wordsTotal} />
        <StatChip label={t.games.time} value={fmtTimeCenti(elapsedMs)} />
        {bestRef.current > 0 && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}><BestBadge label={t.games.record} value={`${bestRef.current} ${t.games.wordsMany}`} /></div>}
      </div>

      {phase === 'showing' && (
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {t.games.memorizeOrder}
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
            {phase === 'success' ? t.games.correctNext : `${t.games.clickInOrder} (${clicked.length + 1}/${sequence.length})`}
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
            {t.games.youRemembered} {finalWords} {wPlural(finalWords, t.games)}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '600', color: 'var(--green2)', marginBottom: '4px', fontVariantNumeric: 'tabular-nums' }}>
            {t.games.inTime} {fmtTimeCenti(finalMs)}
          </div>
          {finalWords >= bestRef.current && finalWords > 0 && (
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFB300', marginBottom: '8px', animation: 'newRecBadge 0.5s cubic-bezier(.34,1.56,.64,1) both' }}>
              {t.games.newRecord}
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>
            {t.games.correctOrder} {sequence.join(' → ')}
          </div>
          <button onClick={restart} style={{ background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '9px', color: '#fff', fontSize: '13px', padding: '9px 24px', cursor: 'pointer', fontWeight: '600' }}>
            {t.games.playAgain}
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
  const { lang, t } = useLang();
  const fqDiffs: { key: FQDiff; label: string; pool: Country[] }[] = [
    { key: 'easy',   label: t.games.easy,   pool: POOL_EASY   },
    { key: 'normal', label: t.games.medium, pool: POOL_NORMAL },
    { key: 'hard',   label: t.games.hard,   pool: POOL_HARD   },
  ];
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
    const cfg = fqDiffs.find(x => x.key === d)!;
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
    const diffLabel = fqDiffs.find(fd => fd.key === diff)?.label ?? diff;
    const text = `🌍 Flag Quiz (${diffLabel}): ${score}/${TOTAL_Q} ${t.games.inTime} ${fmtTimePrecise4(finalMs)}!${isNewRecord ? ` 🏆 ${t.games.newRecord}` : ''} ${SHARE_URL}`;
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
          { v: 'A' as FQVariant, label: t.games.flagToName },
          { v: 'B' as FQVariant, label: t.games.nameToFlag },
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
        {fqDiffs.map(d => (
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
              <span>{t.games.question} {current + 1} / {TOTAL_Q}</span>
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
                  {t.games.whichCountryFlag}
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
                  {t.games.whichFlagCountry}
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
                🏆 {t.games.newRecord}
              </div>
            )}
          </div>

          {/* Reaction text */}
          <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '14px' }}>
            {score === 10 ? t.games.perfect : score >= 8 ? t.games.excellent : score >= 6 ? t.games.good : score >= 4 ? t.games.keepPracticing : t.games.geographyHard}
          </div>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '14px' }}>
            <StatChip label={t.games.correct} value={score} />
            <StatChip label={t.games.wrong}   value={TOTAL_Q - score} />
            {maxStreak >= 2 && <StatChip label={t.games.maxStreak} value={`${maxStreak} 🔥`} />}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
            <button onClick={() => init()} style={{
              background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontSize: '13px', fontWeight: '600', padding: '10px 22px', cursor: 'pointer',
            }}>
              ↺ {t.games.playAgain}
            </button>
            <button onClick={handleShare} style={{
              background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
              border: copied ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px', color: copied ? 'var(--green2)' : 'var(--text2)',
              fontSize: '13px', fontWeight: '600', padding: '10px 22px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              {copied ? t.games.copied : t.games.shareResult}
            </button>
          </div>

          {/* Local top 5 */}
          {top5.length > 0 && (
            <div style={{ textAlign: 'left', marginTop: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '5px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{t.games.myTop5}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {top5.map((rec, i) => {
                  const diffEmoji = rec.diff === 'easy' ? '🟢' : rec.diff === 'normal' ? '🟡' : '🔴';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '13px', width: '20px', flexShrink: 0 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', minWidth: '32px' }}>{rec.score}/{TOTAL_Q}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'monospace' }}>{fmtTimeSecs(rec.time)}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: 'auto' }}>{new Date(rec.date).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</span>
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
  const { t } = useLang();
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
        <StatChip label={t.games.moves} value={moves} />
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
          <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{t.games.time}</div>
        </div>
        <button onClick={reset} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', color: 'var(--text3)', fontSize: '13px',
          padding: '0 14px', cursor: 'pointer', alignSelf: 'stretch',
        }}>↺</button>
      </div>

      {bestMs !== null && phase !== 'solved' && (
        <div style={{ marginBottom: '10px' }}>
          <BestBadge label={t.games.bestTime} value={fmtTimePrecise4(bestMs!)} />
        </div>
      )}

      {phase === 'idle' && (
        <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          {t.games.clickToStart}
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
            {t.games.solved}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: '700', color: 'var(--green2)', fontVariantNumeric: 'tabular-nums', marginBottom: '2px' }}>
            {fmtTimePrecise4(finalMs)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: isNewBest ? '4px' : '12px' }}>
            {moves} {t.games.moves}
          </div>
          {isNewBest && (
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFB300', marginBottom: '12px', animation: 'newRecBadge 0.5s cubic-bezier(.34,1.56,.64,1) both' }}>
              🏆 {t.games.newRecord}
            </div>
          )}

          <button onClick={reset} style={{
            background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
            border: 'none', borderRadius: '9px', color: '#fff',
            fontSize: '13px', fontWeight: '600', padding: '9px 22px', cursor: 'pointer',
          }}>
            ↺ {t.games.playAgain}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ AUDIO ═══════════════════════ */

function playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
    osc.onended = () => ctx.close();
  } catch { /* silent fail */ }
}

/* ═══════════════════════ MATH RUSH ═══════════════════════ */

type MathDiff = 'easy' | 'medium' | 'hard';
type MathPhase = 'idle' | 'countdown' | 'playing' | 'done';

function genProblem(diff: MathDiff): { expr: string; answer: number; choices: number[] } {
  let a: number, b: number, answer: number, expr: string;
  if (diff === 'easy') {
    const op = Math.random() < 0.5 ? '+' : '-';
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    if (op === '-') { if (a < b) [a, b] = [b, a]; }
    answer = op === '+' ? a + b : a - b;
    expr = `${a} ${op} ${b}`;
  } else if (diff === 'medium') {
    const r = Math.random();
    if (r < 0.4) { a = Math.floor(Math.random() * 9) + 2; b = Math.floor(Math.random() * 9) + 2; answer = a * b; expr = `${a} × ${b}`; }
    else if (r < 0.7) { a = Math.floor(Math.random() * 49) + 10; b = Math.floor(Math.random() * 29) + 5; answer = a + b; expr = `${a} + ${b}`; }
    else { a = Math.floor(Math.random() * 49) + 20; b = Math.floor(Math.random() * 19) + 2; answer = a - b; expr = `${a} − ${b}`; }
  } else {
    const r = Math.random();
    if (r < 0.3) { b = Math.floor(Math.random() * 9) + 2; answer = Math.floor(Math.random() * 14) + 2; a = b * answer; expr = `${a} ÷ ${b}`; }
    else if (r < 0.6) { a = Math.floor(Math.random() * 18) + 5; b = Math.floor(Math.random() * 11) + 3; answer = a * b; expr = `${a} × ${b}`; }
    else { a = Math.floor(Math.random() * 98) + 20; b = Math.floor(Math.random() * 79) + 10; if (Math.random() < 0.5) { answer = a + b; expr = `${a} + ${b}`; } else { if (a < b) [a, b] = [b, a]; answer = a - b; expr = `${a} − ${b}`; } }
  }
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const d = Math.floor(Math.random() * 7) + 1;
    const w = Math.random() < 0.5 ? answer + d : answer - d;
    if (w !== answer && w >= 0) wrongs.add(w);
  }
  const choices = [answer, ...wrongs].sort(() => Math.random() - 0.5);
  return { expr, answer, choices };
}

function MathRush({ onComplete }: { onComplete: (timeMs: number, score: number, diff: string) => void }) {
  const { t } = useLang();
  const [diff, setDiff] = useState<MathDiff>('easy');
  const [phase, setPhase] = useState<MathPhase>('idle');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [problem, setProblem] = useState(() => genProblem('easy'));
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0); // reliable ref — avoids stale closure in setInterval

  useEffect(() => () => { clearInterval(timerRef.current!); clearInterval(cdRef.current!); }, []);

  function startGame(d: MathDiff = diff) {
    clearInterval(timerRef.current!); clearInterval(cdRef.current!);
    scoreRef.current = 0;
    setDiff(d); setScore(0); setStreak(0); setTimeLeft(60); setFlash(null); setFinalScore(0);
    setProblem(genProblem(d));
    setCountdown(3); setPhase('countdown');
    cdRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(cdRef.current!);
          setPhase('playing');
          timerRef.current = setInterval(() => {
            setTimeLeft(tl => {
              if (tl <= 1) {
                clearInterval(timerRef.current!);
                const finalSc = scoreRef.current;
                setFinalScore(finalSc);
                setPhase('done');
                setTimeout(() => onComplete(60000, finalSc, d), 300);
                return 0;
              }
              return tl - 1;
            });
          }, 1000);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function handleChoice(choice: number) {
    if (phase !== 'playing') return;
    if (choice === problem.answer) {
      playTone(880, 0.08, 'sine', 0.1);
      setFlash('correct');
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setStreak(s => s + 1);
    } else {
      playTone(220, 0.15, 'sawtooth', 0.08);
      setFlash('wrong');
      setStreak(0);
    }
    setTimeout(() => { setFlash(null); setProblem(genProblem(diff)); }, 180);
  }

  const timerPct = (timeLeft / 60) * 100;
  const timerColor = timeLeft > 20 ? 'var(--purple)' : timeLeft > 10 ? '#FFB300' : '#EF4444';
  const diffs: MathDiff[] = ['easy', 'medium', 'hard'];
  const diffLabels: Record<MathDiff, string> = { easy: t.games.easy, medium: t.games.medium, hard: t.games.hard };

  return (
    <div>
      {phase === 'idle' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔢</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>{t.games.mathrush}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>60s · {t.games.score}: max</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
            {diffs.map(d => (
              <button key={d} onClick={() => setDiff(d)} style={{
                padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                background: d === diff ? 'linear-gradient(135deg,var(--purple),#7A3FFF)' : 'rgba(255,255,255,0.07)',
                color: d === diff ? '#fff' : 'var(--text3)',
              }}>{diffLabels[d]}</button>
            ))}
          </div>
          <button onClick={() => startGame(diff)} style={{
            background: 'linear-gradient(135deg,var(--purple),#7A3FFF)', border: 'none', borderRadius: '12px',
            color: '#fff', fontSize: '16px', fontWeight: '700', padding: '14px 36px', cursor: 'pointer',
            boxShadow: '0 0 28px rgba(93,76,255,0.5)',
          }}>▶ Start</button>
        </div>
      )}

      {phase === 'countdown' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontFamily: 'Poppins', fontSize: '96px', fontWeight: '900', color: 'var(--purple3)', animation: 'mathCountdown 0.8s ease-out', lineHeight: 1 }}>{countdown}</div>
        </div>
      )}

      {phase === 'playing' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: '4px', transition: 'width 0.9s linear, background 0.3s' }} />
            </div>
            <div style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: '800', color: timerColor, minWidth: '36px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{timeLeft}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <StatChip label={t.games.score} value={score} />
            {streak >= 3 && <StatChip label="🔥" value={streak} />}
          </div>
          <div style={{
            textAlign: 'center', marginBottom: '20px', padding: '20px',
            background: flash === 'correct' ? 'rgba(34,197,94,0.15)' : flash === 'wrong' ? 'rgba(239,68,68,0.12)' : 'rgba(93,76,255,0.1)',
            border: `1px solid ${flash === 'correct' ? 'rgba(34,197,94,0.4)' : flash === 'wrong' ? 'rgba(239,68,68,0.4)' : 'rgba(93,76,255,0.3)'}`,
            borderRadius: '16px', transition: 'background 0.15s, border 0.15s',
          }}>
            <div style={{ fontFamily: 'Poppins', fontSize: '40px', fontWeight: '900', color: '#fff', letterSpacing: '-1px' }}>{problem.expr} =</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {problem.choices.map(c => (
              <button key={c} onClick={() => handleChoice(c)} style={{
                padding: '18px', borderRadius: '12px', border: '1px solid rgba(93,76,255,0.3)',
                background: 'rgba(93,76,255,0.12)', color: '#fff', fontSize: '24px', fontWeight: '800',
                fontFamily: 'Poppins', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(93,76,255,0.2)',
                transition: 'transform 0.08s, background 0.08s',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >{c}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎉</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '72px', fontWeight: '900', background: 'linear-gradient(135deg,var(--purple3),#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{finalScore}</div>
          <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '6px' }}>{t.games.correct} · 60s</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '16px' }}>Leaderboard modal loading…</div>
          <button onClick={() => setPhase('idle')} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'var(--text2)', fontSize: '13px', fontWeight: '600', padding: '9px 22px', cursor: 'pointer' }}>↺ {t.games.playAgain}</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ REFLEX TIMER ═══════════════════════ */

const RT_TARGET = 5000;
const RT_ROUNDS = 5;
type RTPhase = 'idle' | 'running' | 'stopped' | 'done';

function ReflexTimer({ onComplete }: { onComplete: (timeMs: number) => void }) {
  const { t } = useLang();
  const [phase, setPhase] = useState<RTPhase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<number[]>([]);
  const [lastDev, setLastDev] = useState<number | null>(null);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  function tick() { setElapsed(performance.now() - startRef.current); rafRef.current = requestAnimationFrame(tick); }

  function handleStart() {
    if (phase !== 'idle' && phase !== 'stopped') return;
    startRef.current = performance.now();
    setElapsed(0);
    setPhase('running');
    rafRef.current = requestAnimationFrame(tick);
  }

  function handleStop() {
    if (phase !== 'running') return;
    cancelAnimationFrame(rafRef.current);
    const ms = performance.now() - startRef.current;
    const dev = Math.abs(ms - RT_TARGET);
    setElapsed(ms);
    setLastDev(dev);
    playTone(dev < 100 ? 1046 : dev < 300 ? 659 : 440, 0.2, 'sine', 0.12);
    const newResults = [...results, dev];
    setResults(newResults);
    setPhase('stopped');
    if (newResults.length >= RT_ROUNDS) {
      const avg = newResults.reduce((a, b) => a + b, 0) / newResults.length;
      setTimeout(() => { setPhase('done'); onComplete(Math.round(avg)); }, 800);
    }
  }

  function reset() { cancelAnimationFrame(rafRef.current); setPhase('idle'); setElapsed(0); setRound(1); setResults([]); setLastDev(null); }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function advance() { if (phase !== 'stopped' || results.length >= RT_ROUNDS) return; setRound(r => r + 1); setPhase('idle'); setElapsed(0); setLastDev(null); }

  const displayMs = phase === 'running' ? elapsed : elapsed;
  const targetStr = '5.000';
  const devColor = lastDev === null ? '#fff' : lastDev < 100 ? 'var(--green2)' : lastDev < 300 ? '#FFB300' : '#EF4444';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>{t.games.attempt} {Math.min(round, RT_ROUNDS)} / {RT_ROUNDS}</div>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
          {Array.from({ length: RT_ROUNDS }, (_, i) => (
            <div key={i} style={{ width: '28px', height: '6px', borderRadius: '3px', background: i < results.length ? 'var(--green2)' : i === results.length ? 'rgba(93,76,255,0.6)' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text3)' }}>Target: <span style={{ color: '#FFB300', fontWeight: '700', fontFamily: 'monospace' }}>{targetStr}s</span></div>

      <div style={{
        fontFamily: 'Poppins', fontSize: '72px', fontWeight: '900', fontVariantNumeric: 'tabular-nums',
        color: phase === 'running' ? 'var(--purple3)' : phase === 'stopped' ? devColor : 'rgba(255,255,255,0.3)',
        lineHeight: 1, marginBottom: '6px', letterSpacing: '-2px',
        textShadow: phase === 'running' ? '0 0 30px rgba(93,76,255,0.6)' : 'none',
        transition: 'color 0.3s',
      }}>
        {(displayMs / 1000).toFixed(3)}
      </div>

      {phase === 'stopped' && lastDev !== null && (
        <div style={{ marginBottom: '16px', animation: 'newRecBadge 0.4s cubic-bezier(.34,1.56,.64,1) both' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: devColor }}>
            {lastDev < 50 ? '🎯 Perfect!' : lastDev < 150 ? '⚡ Great!' : lastDev < 400 ? '👍 OK' : '😅 Off'}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text3)', marginLeft: '8px' }}>±{lastDev.toFixed(0)}ms</span>
        </div>
      )}

      {results.length > 0 && phase !== 'running' && (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          {results.map((d, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontFamily: 'monospace', color: d < 100 ? 'var(--green2)' : d < 300 ? '#FFB300' : '#EF4444' }}>±{d.toFixed(0)}</div>
          ))}
        </div>
      )}

      {phase === 'idle' && (
        <button onClick={handleStart} style={{ background: 'linear-gradient(135deg,var(--purple),#7A3FFF)', border: 'none', borderRadius: '50%', width: '100px', height: '100px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 32px rgba(93,76,255,0.5)' }}>
          {round === 1 ? '▶ Start' : '▶ Go'}
        </button>
      )}
      {phase === 'running' && (
        <button onClick={handleStop} style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.6)', borderRadius: '50%', width: '100px', height: '100px', color: '#EF4444', fontSize: '13px', fontWeight: '800', cursor: 'pointer', animation: 'rtPulse 1s infinite', boxShadow: '0 0 24px rgba(239,68,68,0.3)' }}>
          STOP
        </button>
      )}
      {phase === 'stopped' && results.length < RT_ROUNDS && (
        <button onClick={advance} style={{ background: 'rgba(93,76,255,0.15)', border: '1px solid rgba(93,76,255,0.4)', borderRadius: '12px', color: 'var(--purple3)', fontSize: '14px', fontWeight: '700', padding: '12px 28px', cursor: 'pointer' }}>
          Next →
        </button>
      )}
      {phase === 'done' && (
        <div>
          <div style={{ fontFamily: 'Poppins', fontSize: '15px', color: 'var(--text2)', marginBottom: '6px' }}>{t.games.avgDev}</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '48px', fontWeight: '900', color: 'var(--green2)', marginBottom: '16px' }}>
            ±{(results.reduce((a, b) => a + b, 0) / results.length).toFixed(0)}ms
          </div>
          <button onClick={reset} style={{ background: 'linear-gradient(135deg,var(--purple),#7A3FFF)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '700', padding: '11px 28px', cursor: 'pointer' }}>↺ {t.games.playAgain}</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ REACTION CLICK ═══════════════════════ */

const RC_ROUNDS = 5;
const RC_FALSE_PENALTY = 200;
type RCPhase = 'idle' | 'waiting' | 'ready' | 'result' | 'done';

function ReactionClick({ onComplete }: { onComplete: (timeMs: number) => void }) {
  const { t } = useLang();
  const [phase, setPhase] = useState<RCPhase>('idle');
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [falseStart, setFalseStart] = useState(false);
  const [circleColor, setCircleColor] = useState('#5D4CFF');
  const waitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appearRef = useRef(0);

  const COLORS = ['#5D4CFF', '#4ade80', '#f87171', '#FFB300', '#60a5fa', '#e879f9'];

  function startWait() {
    setPhase('waiting'); setFalseStart(false); setLastMs(null);
    const delay = 1200 + Math.random() * 2800;
    waitRef.current = setTimeout(() => {
      setCircleColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setPhase('ready');
      appearRef.current = performance.now();
    }, delay);
  }

  function handleClick() {
    if (phase === 'idle') return;
    if (phase === 'waiting') {
      clearTimeout(waitRef.current!);
      setFalseStart(true);
      const ms = RC_FALSE_PENALTY;
      setLastMs(ms);
      const nr = [...results, ms];
      setResults(nr);
      setPhase('result');
      playTone(220, 0.2, 'sawtooth', 0.08);
      if (nr.length >= RC_ROUNDS) {
        const avg = nr.reduce((a, b) => a + b, 0) / nr.length;
        setTimeout(() => { setPhase('done'); onComplete(Math.round(avg)); }, 600);
      }
      return;
    }
    if (phase === 'ready') {
      const ms = Math.round(performance.now() - appearRef.current);
      setLastMs(ms);
      playTone(ms < 200 ? 1046 : ms < 350 ? 659 : 440, 0.15, 'sine', 0.1);
      const nr = [...results, ms];
      setResults(nr);
      setPhase('result');
      if (nr.length >= RC_ROUNDS) {
        const avg = nr.reduce((a, b) => a + b, 0) / nr.length;
        setTimeout(() => { setPhase('done'); onComplete(Math.round(avg)); }, 600);
      }
    }
  }

  function reset() { clearTimeout(waitRef.current!); setPhase('idle'); setRound(1); setResults([]); setLastMs(null); setFalseStart(false); }

  function advance() { if (phase !== 'result' || results.length >= RC_ROUNDS) return; setRound(r => r + 1); startWait(); }

  useEffect(() => () => clearTimeout(waitRef.current!), []);

  const avgMs = results.length ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : null;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <StatChip label={t.games.attempt} value={`${Math.min(round, RC_ROUNDS)}/${RC_ROUNDS}`} />
        {avgMs !== null && <StatChip label={t.games.avgReact} value={`${avgMs}ms`} />}
      </div>

      <div
        onClick={handleClick}
        style={{
          position: 'relative', height: '200px', borderRadius: '16px', cursor: phase === 'idle' ? 'default' : 'pointer',
          background: phase === 'waiting' ? 'rgba(15,20,40,0.95)' : phase === 'ready' ? `${circleColor}22` : 'rgba(15,20,40,0.6)',
          border: phase === 'ready' ? `2px solid ${circleColor}` : '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
          transition: 'background 0.1s, border 0.1s',
          boxShadow: phase === 'ready' ? `0 0 40px ${circleColor}44` : 'none',
        }}
      >
        {phase === 'idle' && <div style={{ fontSize: '13px', color: 'var(--text3)', textAlign: 'center' }}>Click Start, then tap when circle appears</div>}
        {phase === 'waiting' && (
          <>
            <div style={{ fontSize: '32px', animation: 'rtPulse 1.2s infinite' }}>👁</div>
            <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Wait for the circle…</div>
          </>
        )}
        {phase === 'ready' && (
          <>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: circleColor, boxShadow: `0 0 40px ${circleColor}`, animation: 'rcPop 0.15s cubic-bezier(.34,1.56,.64,1)' }} />
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', fontFamily: 'Poppins' }}>CLICK!</div>
          </>
        )}
        {phase === 'result' && (
          <div style={{ textAlign: 'center', animation: 'newRecBadge 0.3s ease' }}>
            {falseStart ? (
              <><div style={{ fontSize: '24px', marginBottom: '4px' }}>⚠️</div><div style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: '800', color: '#EF4444' }}>False start!</div><div style={{ fontSize: '13px', color: 'var(--text3)' }}>+{RC_FALSE_PENALTY}ms penalty</div></>
            ) : (
              <><div style={{ fontFamily: 'Poppins', fontSize: '52px', fontWeight: '900', color: lastMs! < 200 ? 'var(--green2)' : lastMs! < 350 ? '#FFB300' : '#EF4444', lineHeight: 1 }}>{lastMs}ms</div><div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{lastMs! < 200 ? '⚡ Lightning!' : lastMs! < 300 ? '🎯 Great!' : lastMs! < 450 ? '👍 Good' : '🐌 Slow'}</div></>
            )}
          </div>
        )}
        {phase === 'done' && <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Done!</div>}
      </div>

      <div style={{ marginTop: '12px', display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {results.map((ms, i) => <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontFamily: 'monospace', color: ms <= RC_FALSE_PENALTY ? '#EF4444' : ms < 250 ? 'var(--green2)' : ms < 400 ? '#FFB300' : 'var(--text3)' }}>{ms}ms</div>)}
      </div>

      <div style={{ marginTop: '14px', textAlign: 'center' }}>
        {phase === 'idle' && <button onClick={() => { setRound(1); setResults([]); startWait(); }} style={{ background: 'linear-gradient(135deg,var(--purple),#7A3FFF)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '700', padding: '11px 28px', cursor: 'pointer' }}>▶ Start</button>}
        {phase === 'result' && results.length < RC_ROUNDS && <button onClick={advance} style={{ background: 'rgba(93,76,255,0.15)', border: '1px solid rgba(93,76,255,0.4)', borderRadius: '10px', color: 'var(--purple3)', fontSize: '14px', fontWeight: '700', padding: '10px 24px', cursor: 'pointer' }}>Next →</button>}
        {phase === 'done' && (
          <div>
            <div style={{ fontFamily: 'Poppins', fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>{t.games.avgReact}</div>
            <div style={{ fontFamily: 'Poppins', fontSize: '42px', fontWeight: '900', color: 'var(--green2)', marginBottom: '14px' }}>{avgMs}ms</div>
            <button onClick={reset} style={{ background: 'linear-gradient(135deg,var(--purple),#7A3FFF)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '700', padding: '11px 28px', cursor: 'pointer' }}>↺ {t.games.playAgain}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ STACK ═══════════════════════ */

const STACK_W = 280;
const STACK_BLOCK_H = 22;
const STACK_MAX_BLOCKS = 12;

interface StackBlock { left: number; width: number; }
type StackPhase = 'idle' | 'playing' | 'done';

function StackGame({ onComplete }: { onComplete: (timeMs: number, score: number) => void }) {
  const { t } = useLang();
  const [phase, setPhase] = useState<StackPhase>('idle');
  const [blocks, setBlocks] = useState<StackBlock[]>([{ left: 0, width: STACK_W }]);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; color: string }[]>([]);
  const movingRef = useRef({ left: 0, direction: 1, speed: 2 });
  const animRef = useRef(0);
  const startMsRef = useRef(0);
  const blocksRef = useRef<StackBlock[]>([{ left: 0, width: STACK_W }]);
  const scoreRef = useRef(0);
  const [movingLeft, setMovingLeft] = useState(0);
  const [movingWidth, setMovingWidth] = useState(STACK_W);

  function startGame() {
    const base: StackBlock = { left: 0, width: STACK_W };
    blocksRef.current = [base];
    scoreRef.current = 0;
    movingRef.current = { left: 0, direction: 1, speed: 2 };
    setBlocks([base]); setScore(0); setFinalScore(0); setParticles([]);
    setMovingLeft(0); setMovingWidth(STACK_W);
    setPhase('playing');
    startMsRef.current = Date.now();
    function loop() {
      const mv = movingRef.current;
      mv.left += mv.direction * mv.speed;
      const w = blocksRef.current[blocksRef.current.length - 1]?.width ?? STACK_W;
      if (mv.left <= 0) { mv.left = 0; mv.direction = 1; }
      if (mv.left + w >= STACK_W) { mv.left = STACK_W - w; mv.direction = -1; }
      setMovingLeft(mv.left);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
  }

  function drop() {
    if (phase !== 'playing') return;
    cancelAnimationFrame(animRef.current);
    const top = blocksRef.current[blocksRef.current.length - 1];
    const mLeft = movingRef.current.left;
    const mRight = mLeft + top.width;
    const tRight = top.left + top.width;
    const overlapLeft = Math.max(mLeft, top.left);
    const overlapRight = Math.min(mRight, tRight);
    const overlapW = overlapRight - overlapLeft;
    if (overlapW <= 2) {
      playTone(220, 0.3, 'sawtooth', 0.1);
      setFinalScore(scoreRef.current);
      const elapsed = Date.now() - startMsRef.current;
      setPhase('done');
      onComplete(elapsed, scoreRef.current);
      return;
    }
    playTone(440 + scoreRef.current * 30, 0.06, 'sine', 0.08);
    const newBlock: StackBlock = { left: overlapLeft, width: overlapW };
    const newBlocks = [...blocksRef.current, newBlock];
    blocksRef.current = newBlocks;
    scoreRef.current += 1;
    setBlocks([...newBlocks]);
    setScore(scoreRef.current);
    setParticles(p => [...p, { id: Date.now(), x: overlapLeft + overlapW / 2, color: `hsl(${220 + scoreRef.current * 15},80%,65%)` }]);
    setTimeout(() => setParticles(p => p.slice(1)), 600);
    const newSpeed = 2 + scoreRef.current * 0.22;
    movingRef.current = { left: overlapLeft, direction: Math.random() < 0.5 ? 1 : -1, speed: newSpeed };
    setMovingLeft(overlapLeft); setMovingWidth(overlapW);
    if (newBlocks.length > STACK_MAX_BLOCKS) {
      setFinalScore(scoreRef.current);
      setPhase('done');
      onComplete(Date.now() - startMsRef.current, scoreRef.current);
      return;
    }
    function loop() {
      const mv = movingRef.current;
      mv.left += mv.direction * mv.speed;
      const w = movingRef.current.left + newBlock.width;
      if (mv.left <= 0) { mv.left = 0; mv.direction = 1; }
      if (mv.left + newBlock.width >= STACK_W) { mv.left = STACK_W - newBlock.width; mv.direction = -1; }
      setMovingLeft(mv.left);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
  }

  function reset() { cancelAnimationFrame(animRef.current); setPhase('idle'); setBlocks([{ left: 0, width: STACK_W }]); setScore(0); setParticles([]); blocksRef.current = [{ left: 0, width: STACK_W }]; scoreRef.current = 0; }

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const BLOCK_COLORS = ['#5D4CFF','#7A3FFF','#9333ea','#a855f7','#c084fc','#d8b4fe','#e9d5ff','#f0abfc','#f5d0fe','#fae8ff','#fdf4ff','#fff'];
  const containerH = (STACK_MAX_BLOCKS + 2) * STACK_BLOCK_H;
  const topIdx = blocks.length - 1;
  const topWidth = blocks[topIdx]?.width ?? STACK_W;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <StatChip label={t.games.blocks} value={score} />
        {phase === 'playing' && <div style={{ fontSize: '11px', color: 'var(--text3)', alignSelf: 'center', marginLeft: '4px' }}>Tap to drop!</div>}
      </div>

      {phase === 'idle' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏗</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '16px', color: '#fff', fontWeight: '700', marginBottom: '6px' }}>{t.games.stackGame}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' }}>Stack blocks as precisely as possible!</div>
          <button onClick={startGame} style={{ background: 'linear-gradient(135deg,var(--purple),#7A3FFF)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '700', padding: '11px 28px', cursor: 'pointer' }}>▶ Start</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div onClick={drop} style={{ position: 'relative', width: STACK_W, margin: '0 auto', height: containerH, cursor: phase === 'playing' ? 'pointer' : 'default', userSelect: 'none' }}>
          {/* Stacked blocks */}
          {blocks.map((b, i) => (
            <div key={i} style={{
              position: 'absolute', height: STACK_BLOCK_H - 2,
              left: b.left, width: b.width,
              bottom: i * STACK_BLOCK_H,
              background: BLOCK_COLORS[Math.min(i, BLOCK_COLORS.length - 1)],
              borderRadius: '4px',
              boxShadow: i === topIdx ? '0 0 12px rgba(93,76,255,0.6)' : 'none',
              transition: 'width 0.1s',
            }} />
          ))}
          {/* Moving block */}
          {phase === 'playing' && (
            <div style={{
              position: 'absolute', height: STACK_BLOCK_H - 2,
              left: movingLeft, width: topWidth,
              bottom: blocks.length * STACK_BLOCK_H,
              background: BLOCK_COLORS[Math.min(blocks.length, BLOCK_COLORS.length - 1)],
              borderRadius: '4px',
              boxShadow: '0 0 16px rgba(93,76,255,0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
            }} />
          )}
          {/* Particles */}
          {particles.map(p => (
            <div key={p.id} style={{ position: 'absolute', left: p.x - 4, bottom: blocks.length * STACK_BLOCK_H, width: 8, height: 8, borderRadius: '50%', background: p.color, animation: 'cflyOut 0.5s ease-out both', pointerEvents: 'none', '--tx': '0px', '--ty': '-40px' } as React.CSSProperties} />
          ))}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <div style={{ fontFamily: 'Poppins', fontSize: '48px', fontWeight: '900', color: 'var(--purple3)', lineHeight: 1 }}>{finalScore}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>{t.games.blocks} stacked</div>
          <button onClick={reset} style={{ background: 'linear-gradient(135deg,var(--purple),#7A3FFF)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '700', padding: '11px 28px', cursor: 'pointer' }}>↺ {t.games.playAgain}</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ FELIX JUMP ═══════════════════════ */

const FJ_W = 320, FJ_H = 180;
const FJ_GROUND = FJ_H - 36;
const FJ_PLAYER_X = 60;
const FJ_PLAYER_SIZE = 28;
const FJ_GRAVITY = 0.55;
const FJ_JUMP_VY = -11;

interface FJObs { x: number; w: number; h: number; }
type FJPhase = 'idle' | 'playing' | 'dead';

function FelixJump({ onComplete }: { onComplete: (timeMs: number, score: number) => void }) {
  const { t } = useLang();
  const [phase, setPhase] = useState<FJPhase>('idle');
  const [playerY, setPlayerY] = useState(FJ_GROUND);
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState<FJObs[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const stateRef = useRef({
    phase: 'idle' as FJPhase,
    playerY: FJ_GROUND, vy: 0, jumpsLeft: 2,
    obs: [] as FJObs[], score: 0, speed: 3,
    nextObs: 180, startMs: 0, frame: 0,
  });
  const rafRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function jump() {
    const s = stateRef.current;
    if (s.phase === 'idle') { startGame(); return; }
    if (s.phase !== 'playing') return;
    if (s.jumpsLeft > 0) {
      playTone(s.jumpsLeft === 2 ? 440 : 330, 0.08, 'sine', 0.08);
      s.vy = FJ_JUMP_VY;
      s.jumpsLeft -= 1;
    }
  }

  function startGame() {
    const s = stateRef.current;
    s.phase = 'playing'; s.playerY = FJ_GROUND; s.vy = 0; s.jumpsLeft = 2;
    s.obs = []; s.score = 0; s.speed = 3; s.nextObs = 200; s.frame = 0;
    s.startMs = Date.now();
    setPhase('playing'); setPlayerY(FJ_GROUND); setScore(0); setObstacles([]);
    function loop() {
      const st = stateRef.current;
      if (st.phase !== 'playing') return;
      st.frame++;
      // Physics
      st.vy += FJ_GRAVITY;
      st.playerY += st.vy;
      if (st.playerY >= FJ_GROUND) { st.playerY = FJ_GROUND; st.vy = 0; st.jumpsLeft = 2; }
      // Score
      st.score = Math.floor((Date.now() - st.startMs) / 100);
      st.speed = 3 + st.score * 0.018;
      // Obstacles
      st.obs = st.obs.map(o => ({ ...o, x: o.x - st.speed })).filter(o => o.x + o.w > -10);
      st.nextObs -= st.speed;
      if (st.nextObs <= 0) {
        const h = 24 + Math.random() * 28;
        st.obs.push({ x: FJ_W, w: 18, h });
        st.nextObs = 120 + Math.random() * 160 - st.score * 0.3;
        if (st.nextObs < 80) st.nextObs = 80;
      }
      // Collision
      const px = FJ_PLAYER_X, py = st.playerY, ps = FJ_PLAYER_SIZE;
      for (const o of st.obs) {
        const oy = FJ_GROUND + FJ_PLAYER_SIZE - o.h;
        if (px + ps - 6 > o.x + 2 && px + 6 < o.x + o.w - 2 && py + ps - 4 > oy) {
          st.phase = 'dead';
          playTone(200, 0.4, 'sawtooth', 0.1);
          const elapsed = Date.now() - st.startMs;
          setPhase('dead'); setFinalScore(st.score);
          onComplete(elapsed, st.score);
          return;
        }
      }
      setPlayerY(st.playerY);
      setScore(st.score);
      setObstacles([...st.obs]);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function reset() { cancelAnimationFrame(rafRef.current); stateRef.current.phase = 'idle'; setPhase('idle'); setScore(0); setObstacles([]); setPlayerY(FJ_GROUND); }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.code === 'Space') { e.preventDefault(); jump(); } }
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); cancelAnimationFrame(rafRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pBottom = FJ_GROUND + FJ_PLAYER_SIZE - playerY;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <StatChip label={t.games.distance} value={score} />
        {phase === 'playing' && <div style={{ fontSize: '11px', color: 'var(--text3)', alignSelf: 'center' }}>SPACE / tap to jump · double jump OK</div>}
      </div>

      <div
        ref={containerRef}
        onClick={jump}
        style={{
          position: 'relative', width: FJ_W, height: FJ_H, margin: '0 auto',
          background: 'linear-gradient(180deg,#02040E 60%,#0d1025 100%)',
          border: '1px solid rgba(93,76,255,0.3)', borderRadius: '12px', overflow: 'hidden',
          cursor: phase === 'idle' ? 'pointer' : phase === 'playing' ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        {/* Stars */}
        {[10,40,80,130,190,240,290,50,160,220].map((x, i) => (
          <div key={i} style={{ position: 'absolute', width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', left: x, top: [12,25,8,18,30,15,22,35,10,28][i] }} />
        ))}
        {/* Ground line */}
        <div style={{ position: 'absolute', bottom: FJ_H - FJ_GROUND - FJ_PLAYER_SIZE, left: 0, right: 0, height: '2px', background: 'rgba(93,76,255,0.4)' }} />
        {/* Player */}
        <div style={{
          position: 'absolute',
          left: FJ_PLAYER_X,
          bottom: pBottom,
          width: FJ_PLAYER_SIZE, height: FJ_PLAYER_SIZE,
          fontSize: '20px', lineHeight: `${FJ_PLAYER_SIZE}px`, textAlign: 'center',
          filter: phase === 'dead' ? 'grayscale(1) opacity(0.5)' : 'none',
          transition: phase === 'dead' ? 'filter 0.3s' : 'none',
        }}>🏃</div>
        {/* Obstacles */}
        {obstacles.map((o, i) => (
          <div key={i} style={{
            position: 'absolute', left: o.x, bottom: FJ_H - FJ_GROUND - FJ_PLAYER_SIZE,
            width: o.w, height: o.h,
            background: 'linear-gradient(180deg,#EF4444,#b91c1c)',
            borderRadius: '3px 3px 0 0',
            boxShadow: '0 0 8px rgba(239,68,68,0.5)',
          }} />
        ))}
        {/* Idle overlay */}
        {phase === 'idle' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,4,14,0.7)' }}>
            <div style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{t.games.felixJump}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Tap / SPACE to start & jump</div>
          </div>
        )}
        {/* Dead overlay */}
        {phase === 'dead' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,4,14,0.75)' }}>
            <div style={{ fontFamily: 'Poppins', fontSize: '28px', fontWeight: '900', color: '#EF4444', marginBottom: '4px' }}>{finalScore}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{t.games.distance}</div>
          </div>
        )}
      </div>

      {phase === 'dead' && (
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button onClick={reset} style={{ background: 'linear-gradient(135deg,var(--purple),#7A3FFF)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '700', padding: '10px 26px', cursor: 'pointer' }}>↺ {t.games.playAgain}</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ MAIN ═══════════════════════ */

type TabId = 'memory' | 'wordchain' | 'flagquiz' | 'sliding' | 'mathrush' | 'reflex' | 'reaction' | 'stack' | 'felixjump';

type ModalState = { game: GameId; timeMs: number; score?: number; moves?: number; diff?: string } | null;

export default function DailyGames() {
  const { t } = useLang();
  const tabs: { id: TabId; label: string; emoji: string }[] = [
    { id: 'memory',    label: t.games.memory,     emoji: '🃏' },
    { id: 'wordchain', label: t.games.wordchain,   emoji: '📝' },
    { id: 'flagquiz',  label: t.games.flagquiz,    emoji: '🌍' },
    { id: 'sliding',   label: t.games.sliding,     emoji: '🧩' },
    { id: 'mathrush',  label: t.games.mathrush,    emoji: '🔢' },
    { id: 'reflex',    label: t.games.reflex,      emoji: '⏱' },
    { id: 'reaction',  label: t.games.reaction,    emoji: '⚡' },
    { id: 'stack',     label: t.games.stackGame,   emoji: '🏗' },
    { id: 'felixjump', label: t.games.felixJump,   emoji: '🏃' },
  ];
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
          🎮 {t.games.title}
        </h2>
        <button onClick={() => { setShowLB(s => !s); if (!showLB) setLbGame(tab as GameId); }} style={{
          background: showLB ? 'rgba(255,179,0,0.12)' : 'rgba(255,255,255,0.06)',
          border: showLB ? '1px solid rgba(255,179,0,0.3)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', color: showLB ? '#FFB300' : 'var(--text3)',
          fontSize: '12px', fontWeight: '600', padding: '5px 12px', cursor: 'pointer',
        }}>🏆 {t.games.leaderboard}</button>
      </div>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            flexShrink: 0, padding: '7px 10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            fontWeight: '600', fontSize: '11px',
            display: 'flex', alignItems: 'center', gap: '4px',
            background: tb.id === tab ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.05)',
            color: tb.id === tab ? '#fff' : 'var(--text2)',
            whiteSpace: 'nowrap',
          }}>
            <span>{tb.emoji}</span><span>{tb.label}</span>
          </button>
        ))}
      </div>

      {tab === 'memory'    && <MemoryGame    onComplete={(ms, mv, df) => openModal('memory',    ms, { moves: mv, diff: df })} />}
      {tab === 'wordchain' && <WordChain     onComplete={(ms, sc)     => openModal('wordchain', ms, { score: sc })} />}
      {tab === 'flagquiz'  && <FlagQuiz      onComplete={(ms, sc, df) => openModal('flagquiz',  ms, { score: sc, diff: df })} />}
      {tab === 'sliding'   && <SlidingPuzzle onComplete={(ms, mv)     => openModal('sliding',   ms, { moves: mv })} />}
      {tab === 'mathrush'  && <MathRush      onComplete={(ms, sc, df) => openModal('mathrush',  ms, { score: sc, diff: df })} />}
      {tab === 'reflex'    && <ReflexTimer   onComplete={(ms)         => openModal('reflex',    ms)} />}
      {tab === 'reaction'  && <ReactionClick onComplete={(ms)         => openModal('reaction',  ms)} />}
      {tab === 'stack'     && <StackGame     onComplete={(ms, sc)     => openModal('stack',     ms, { score: sc })} />}
      {tab === 'felixjump' && <FelixJump     onComplete={(ms, sc)     => openModal('felixjump', ms, { score: sc })} />}

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
        @keyframes mathCountdown {
          0%   { transform: scale(1.4); opacity: 0; }
          50%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 0.8; }
        }
        @keyframes rtPulse {
          0%,100% { transform: scale(1);   box-shadow: 0 0 24px rgba(239,68,68,0.3); }
          50%     { transform: scale(1.05); box-shadow: 0 0 36px rgba(239,68,68,0.6); }
        }
        @keyframes rcPop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
