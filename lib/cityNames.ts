import type { Lang } from './i18n';

/* Localized names of common cities, keyed by the English name (= the city part of the IANA zone,
   e.g. "Europe/Prague" → "Prague"). Order of each row:
   en, de, it, fr, cs, es, pl, pt, ru, zh, ja, ko, ar, hi. Missing cities fall back to English. */

const ORDER: Lang[] = ['en', 'de', 'it', 'fr', 'cs', 'es', 'pl', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'];

const ROWS: string[][] = [
  ['Prague', 'Prag', 'Praga', 'Prague', 'Praha', 'Praga', 'Praga', 'Praga', 'Прага', '布拉格', 'プラハ', '프라하', 'براغ', 'प्राग'],
  ['Vienna', 'Wien', 'Vienna', 'Vienne', 'Vídeň', 'Viena', 'Wiedeń', 'Viena', 'Вена', '维也纳', 'ウィーン', '빈', 'فيينا', 'वियना'],
  ['Berlin', 'Berlin', 'Berlino', 'Berlin', 'Berlín', 'Berlín', 'Berlin', 'Berlim', 'Берлин', '柏林', 'ベルリン', '베를린', 'برلين', 'बर्लिन'],
  ['Bratislava', 'Bratislava', 'Bratislava', 'Bratislava', 'Bratislava', 'Bratislava', 'Bratysława', 'Bratislava', 'Братислава', '布拉迪斯拉发', 'ブラチスラヴァ', '브라티슬라바', 'براتيسلافا', 'ब्रातिस्लावा'],
  ['Warsaw', 'Warschau', 'Varsavia', 'Varsovie', 'Varšava', 'Varsovia', 'Warszawa', 'Varsóvia', 'Варшава', '华沙', 'ワルシャワ', '바르샤바', 'وارسو', 'वारसॉ'],
  ['Budapest', 'Budapest', 'Budapest', 'Budapest', 'Budapešť', 'Budapest', 'Budapeszt', 'Budapeste', 'Будапешт', '布达佩斯', 'ブダペスト', '부다페스트', 'بودابست', 'बुडापेस्ट'],
  ['London', 'London', 'Londra', 'Londres', 'Londýn', 'Londres', 'Londyn', 'Londres', 'Лондон', '伦敦', 'ロンドン', '런던', 'لندن', 'लंदन'],
  ['Paris', 'Paris', 'Parigi', 'Paris', 'Paříž', 'París', 'Paryż', 'Paris', 'Париж', '巴黎', 'パリ', '파리', 'باريس', 'पेरिस'],
  ['Rome', 'Rom', 'Roma', 'Rome', 'Řím', 'Roma', 'Rzym', 'Roma', 'Рим', '罗马', 'ローマ', '로마', 'روما', 'रोम'],
  ['Madrid', 'Madrid', 'Madrid', 'Madrid', 'Madrid', 'Madrid', 'Madryt', 'Madrid', 'Мадрид', '马德里', 'マドリード', '마드리드', 'مدريد', 'मैड्रिड'],
  ['Lisbon', 'Lissabon', 'Lisbona', 'Lisbonne', 'Lisabon', 'Lisboa', 'Lizbona', 'Lisboa', 'Лиссабон', '里斯本', 'リスボン', '리스본', 'لشبونة', 'लिस्बन'],
  ['Amsterdam', 'Amsterdam', 'Amsterdam', 'Amsterdam', 'Amsterdam', 'Ámsterdam', 'Amsterdam', 'Amesterdão', 'Амстердам', '阿姆斯特丹', 'アムステルダム', '암스테르담', 'أمستردام', 'एम्स्टर्डम'],
  ['Brussels', 'Brüssel', 'Bruxelles', 'Bruxelles', 'Brusel', 'Bruselas', 'Bruksela', 'Bruxelas', 'Брюссель', '布鲁塞尔', 'ブリュッセル', '브뤼셀', 'بروكسل', 'ब्रुसेल्स'],
  ['Zurich', 'Zürich', 'Zurigo', 'Zurich', 'Curych', 'Zúrich', 'Zurych', 'Zurique', 'Цюрих', '苏黎世', 'チューリッヒ', '취리히', 'زيورخ', 'ज़्यूरिख़'],
  ['Stockholm', 'Stockholm', 'Stoccolma', 'Stockholm', 'Stockholm', 'Estocolmo', 'Sztokholm', 'Estocolmo', 'Стокгольм', '斯德哥尔摩', 'ストックホルム', '스톡홀름', 'ستوكهولم', 'स्टॉकहोम'],
  ['Oslo', 'Oslo', 'Oslo', 'Oslo', 'Oslo', 'Oslo', 'Oslo', 'Oslo', 'Осло', '奥斯陆', 'オスロ', '오슬로', 'أوسلو', 'ओस्लो'],
  ['Copenhagen', 'Kopenhagen', 'Copenaghen', 'Copenhague', 'Kodaň', 'Copenhague', 'Kopenhaga', 'Copenhaga', 'Копенгаген', '哥本哈根', 'コペンハーゲン', '코펜하겐', 'كوبنهاغن', 'कोपेनहेगन'],
  ['Helsinki', 'Helsinki', 'Helsinki', 'Helsinki', 'Helsinky', 'Helsinki', 'Helsinki', 'Helsínquia', 'Хельсинки', '赫尔辛基', 'ヘルシンキ', '헬싱키', 'هلسنكي', 'हेलसिंकी'],
  ['Athens', 'Athen', 'Atene', 'Athènes', 'Atény', 'Atenas', 'Ateny', 'Atenas', 'Афины', '雅典', 'アテネ', '아테네', 'أثينا', 'एथेंस'],
  ['Istanbul', 'Istanbul', 'Istanbul', 'Istanbul', 'Istanbul', 'Estambul', 'Stambuł', 'Istambul', 'Стамбул', '伊斯坦布尔', 'イスタンブール', '이스탄불', 'إسطنبول', 'इस्तांबुल'],
  ['Moscow', 'Moskau', 'Mosca', 'Moscou', 'Moskva', 'Moscú', 'Moskwa', 'Moscovo', 'Москва', '莫斯科', 'モスクワ', '모스크바', 'موسكو', 'मॉस्को'],
  ['Kyiv', 'Kyjiw', 'Kiev', 'Kyiv', 'Kyjev', 'Kiev', 'Kijów', 'Kiev', 'Киев', '基辅', 'キーウ', '키이우', 'كييف', 'कीव'],
  ['Bucharest', 'Bukarest', 'Bucarest', 'Bucarest', 'Bukurešť', 'Bucarest', 'Bukareszt', 'Bucareste', 'Бухарест', '布加勒斯特', 'ブカレスト', '부쿠레슈티', 'بوخارست', 'बुखारेस्ट'],
  ['Dublin', 'Dublin', 'Dublino', 'Dublin', 'Dublin', 'Dublín', 'Dublin', 'Dublin', 'Дублин', '都柏林', 'ダブリン', '더블린', 'دبلن', 'डबलिन'],
  ['New York', 'New York', 'New York', 'New York', 'New York', 'Nueva York', 'Nowy Jork', 'Nova Iorque', 'Нью-Йорк', '纽约', 'ニューヨーク', '뉴욕', 'نيويورك', 'न्यूयॉर्क'],
  ['Los Angeles', 'Los Angeles', 'Los Angeles', 'Los Angeles', 'Los Angeles', 'Los Ángeles', 'Los Angeles', 'Los Angeles', 'Лос-Анджелес', '洛杉矶', 'ロサンゼルス', '로스앤젤레스', 'لوس أنجلوس', 'लॉस एंजेलिस'],
  ['Chicago', 'Chicago', 'Chicago', 'Chicago', 'Chicago', 'Chicago', 'Chicago', 'Chicago', 'Чикаго', '芝加哥', 'シカゴ', '시카고', 'شيكاغو', 'शिकागो'],
  ['Toronto', 'Toronto', 'Toronto', 'Toronto', 'Toronto', 'Toronto', 'Toronto', 'Toronto', 'Торонто', '多伦多', 'トロント', '토론토', 'تورونتو', 'टोरंटो'],
  ['Mexico City', 'Mexiko-Stadt', 'Città del Messico', 'Mexico', 'Ciudad de México', 'Ciudad de México', 'Meksyk', 'Cidade do México', 'Мехико', '墨西哥城', 'メキシコシティ', '멕시코시티', 'مدينة مكسيكو', 'मेक्सिको सिटी'],
  ['Sao Paulo', 'São Paulo', 'San Paolo', 'São Paulo', 'São Paulo', 'São Paulo', 'São Paulo', 'São Paulo', 'Сан-Паулу', '圣保罗', 'サンパウロ', '상파울루', 'ساو باولو', 'साओ पाउलो'],
  ['Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Буэнос-Айрес', '布宜诺斯艾利斯', 'ブエノスアイレス', '부에노스아이레스', 'بوينس آيرس', 'ब्यूनस आयर्स'],
  ['Tokyo', 'Tokio', 'Tokyo', 'Tokyo', 'Tokio', 'Tokio', 'Tokio', 'Tóquio', 'Токио', '东京', '東京', '도쿄', 'طوكيو', 'टोक्यो'],
  ['Shanghai', 'Shanghai', 'Shanghai', 'Shanghai', 'Šanghaj', 'Shanghái', 'Szanghaj', 'Xangai', 'Шанхай', '上海', '上海', '상하이', 'شانغهاي', 'शंघाई'],
  ['Beijing', 'Peking', 'Pechino', 'Pékin', 'Peking', 'Pekín', 'Pekin', 'Pequim', 'Пекин', '北京', '北京', '베이징', 'بكين', 'बीजिंग'],
  ['Seoul', 'Seoul', 'Seul', 'Séoul', 'Soul', 'Seúl', 'Seul', 'Seul', 'Сеул', '首尔', 'ソウル', '서울', 'سول', 'सियोल'],
  ['Singapore', 'Singapur', 'Singapore', 'Singapour', 'Singapur', 'Singapur', 'Singapur', 'Singapura', 'Сингапур', '新加坡', 'シンガポール', '싱가포르', 'سنغافورة', 'सिंगापुर'],
  ['Hong Kong', 'Hongkong', 'Hong Kong', 'Hong Kong', 'Hongkong', 'Hong Kong', 'Hongkong', 'Hong Kong', 'Гонконг', '香港', '香港', '홍콩', 'هونغ كونغ', 'हांगकांग'],
  ['Dubai', 'Dubai', 'Dubai', 'Dubaï', 'Dubaj', 'Dubái', 'Dubaj', 'Dubai', 'Дубай', '迪拜', 'ドバイ', '두바이', 'دبي', 'दुबई'],
  ['Riyadh', 'Riad', 'Riad', 'Riyad', 'Rijád', 'Riad', 'Rijad', 'Riade', 'Эр-Рияд', '利雅得', 'リヤド', '리야드', 'الرياض', 'रियाद'],
  ['Kolkata', 'Kalkutta', 'Calcutta', 'Calcutta', 'Kalkata', 'Calcuta', 'Kalkuta', 'Calcutá', 'Калькутта', '加尔各答', 'コルカタ', '콜카타', 'كولكاتا', 'कोलकाता'],
  ['Mumbai', 'Mumbai', 'Mumbai', 'Bombay', 'Bombaj', 'Bombay', 'Mumbaj', 'Mumbai', 'Мумбаи', '孟买', 'ムンバイ', '뭄바이', 'مومباي', 'मुंबई'],
  ['Bangkok', 'Bangkok', 'Bangkok', 'Bangkok', 'Bangkok', 'Bangkok', 'Bangkok', 'Banguecoque', 'Бангкок', '曼谷', 'バンコク', '방콕', 'بانكوك', 'बैंकॉक'],
  ['Jakarta', 'Jakarta', 'Giacarta', 'Jakarta', 'Jakarta', 'Yakarta', 'Dżakarta', 'Jacarta', 'Джакарта', '雅加达', 'ジャカルタ', '자카르타', 'جاكرتا', 'जकार्ता'],
  ['Karachi', 'Karatschi', 'Karachi', 'Karachi', 'Karáčí', 'Karachi', 'Karaczi', 'Carachi', 'Карачи', '卡拉奇', 'カラチ', '카라치', 'كراتشي', 'कराची'],
  ['Cairo', 'Kairo', 'Il Cairo', 'Le Caire', 'Káhira', 'El Cairo', 'Kair', 'Cairo', 'Каир', '开罗', 'カイロ', '카이로', 'القاهرة', 'काहिरा'],
  ['Johannesburg', 'Johannesburg', 'Johannesburg', 'Johannesburg', 'Johannesburg', 'Johannesburgo', 'Johannesburg', 'Joanesburgo', 'Йоханнесбург', '约翰内斯堡', 'ヨハネスブルグ', '요하네스버그', 'جوهانسبرغ', 'जोहान्सबर्ग'],
  ['Lagos', 'Lagos', 'Lagos', 'Lagos', 'Lagos', 'Lagos', 'Lagos', 'Lagos', 'Лагос', '拉各斯', 'ラゴス', '라고스', 'لاغوس', 'लागोस'],
  ['Nairobi', 'Nairobi', 'Nairobi', 'Nairobi', 'Nairobi', 'Nairobi', 'Nairobi', 'Nairobi', 'Найроби', '内罗毕', 'ナイロビ', '나이로비', 'نيروبي', 'नैरोबी'],
  ['Sydney', 'Sydney', 'Sydney', 'Sydney', 'Sydney', 'Sídney', 'Sydney', 'Sydney', 'Сидней', '悉尼', 'シドニー', '시드니', 'سيدني', 'सिडनी'],
  ['Melbourne', 'Melbourne', 'Melbourne', 'Melbourne', 'Melbourne', 'Melbourne', 'Melbourne', 'Melbourne', 'Мельбурн', '墨尔本', 'メルボルン', '멜버른', 'ملبورن', 'मेलबर्न'],
];

/** IANA zone city parts that differ from the English name. */
const ALIASES: Record<string, string> = { Kiev: 'Kyiv', Calcutta: 'Kolkata', 'São Paulo': 'Sao Paulo' };

const MAP = new Map(ROWS.map(r => [r[0], r]));

/** City name in the given language; unknown cities come back unchanged. */
export function localizedCity(englishName: string, lang: Lang): string {
  const row = MAP.get(ALIASES[englishName] ?? englishName);
  if (!row) return englishName;
  return row[ORDER.indexOf(lang)] || row[0];
}

/** City part of an IANA zone ("Europe/Prague" → "Prague"), localized. */
export function localizedZoneCity(timeZone: string, lang: Lang): string {
  const en = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? '';
  return localizedCity(en, lang);
}
