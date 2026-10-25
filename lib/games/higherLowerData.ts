import type { Lang } from '../i18n';
import { flagEmoji, getCountryName } from './countries';

/* Data for Higher or Lower (ported from games-reference/higher-lower).
   Values are rounded, commonly cited approximations:
   - population: millions of people (≈2024)
   - area: total area in km² (Norway without Svalbard, Denmark without Greenland)
   - mountains: height in metres above sea level
   - rivers: length of the main stem in km
   Country names come from Intl.DisplayNames, so they are translated in every language for free;
   mountains and rivers carry their own names in all 14 languages. */

export const ROUNDS = 10;

export type CategoryId = 'pop' | 'area' | 'mountain' | 'river';

/** Names in the order of NAME_LANGS. */
type Names = readonly [en: string, de: string, it: string, fr: string, cs: string, es: string, pl: string,
  pt: string, ru: string, zh: string, ja: string, ko: string, ar: string, hi: string];

const NAME_LANGS: readonly Lang[] = ['en', 'de', 'it', 'fr', 'cs', 'es', 'pl', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'];

export interface HLItem {
  id: string;
  emoji: string;
  value: number;
  /** ISO country code — the name is looked up with Intl.DisplayNames. */
  country?: string;
  names?: Names;
}

export interface HLCategory {
  id: CategoryId;
  /** Share of the daily rounds that come from this category. */
  weight: number;
  items: HLItem[];
}

const country = (code: string, value: number): HLItem => ({ id: code, emoji: flagEmoji(code), value, country: code });
const named = (id: string, emoji: string, value: number, names: Names): HLItem => ({ id, emoji, value, names });

/* ── Population (millions) ── */
const POPULATION: HLItem[] = [
  country('CN', 1410), country('IN', 1440), country('US', 335), country('ID', 278), country('BR', 216),
  country('NG', 224), country('RU', 144), country('JP', 124), country('MX', 129), country('ET', 127),
  country('EG', 113), country('DE', 84), country('TR', 85), country('FR', 68), country('GB', 68),
  country('IT', 59), country('ZA', 61), country('KR', 52), country('ES', 48), country('AR', 46),
  country('CA', 40), country('PL', 37), country('MA', 37), country('AU', 27), country('CL', 19.6),
  country('NL', 18), country('BE', 11.8), country('CZ', 10.9), country('SE', 10.5), country('GR', 10.4),
  country('HU', 9.6), country('AT', 9.1), country('CH', 8.9), country('DK', 5.9), country('FI', 5.6),
  country('NO', 5.5), country('SK', 5.4), country('IE', 5.3), country('HR', 3.9), country('IS', 0.39),
];

/* ── Area (km²) ── */
const AREA: HLItem[] = [
  country('RU', 17098246), country('CA', 9984670), country('US', 9833520), country('CN', 9596961),
  country('BR', 8515767), country('AU', 7692024), country('IN', 3287263), country('AR', 2780400),
  country('MX', 1964375), country('ID', 1904569), country('ZA', 1221037), country('ET', 1104300),
  country('EG', 1002450), country('NG', 923768), country('TR', 783562), country('CL', 756102),
  country('FR', 643801), country('ES', 505990), country('SE', 450295), country('MA', 446550),
  country('JP', 377975), country('DE', 357588), country('FI', 338455), country('NO', 323802),
  country('PL', 312696), country('IT', 301340), country('GB', 243610), country('GR', 131957),
  country('IS', 103000), country('KR', 100210), country('HU', 93030), country('AT', 83879),
  country('CZ', 78871), country('IE', 70273), country('HR', 56594), country('SK', 49035),
  country('DK', 42933), country('NL', 41850), country('CH', 41285), country('BE', 30689),
];

/* ── Mountains (m a.s.l.) ── */
const MOUNTAINS: HLItem[] = [
  named('everest', '🏔️', 8849, ['Mount Everest', 'Mount Everest', 'Monte Everest', 'Mont Everest', 'Mount Everest', 'Monte Everest', 'Mount Everest', 'Monte Evereste', 'Эверест', '珠穆朗玛峰', 'エベレスト', '에베레스트산', 'إيفرست', 'माउंट एवरेस्ट']),
  named('k2', '🏔️', 8611, ['K2', 'K2', 'K2', 'K2', 'K2', 'K2', 'K2', 'K2', 'К2 (Чогори)', '乔戈里峰', 'K2', 'K2', 'كي 2', 'के2']),
  named('kangchenjunga', '🏔️', 8586, ['Kangchenjunga', 'Kangchendzönga', 'Kangchenjunga', 'Kangchenjunga', 'Kančendženga', 'Kangchenjunga', 'Kanczendzonga', 'Kangchenjunga', 'Канченджанга', '干城章嘉峰', 'カンチェンジュンガ', '칸첸중가', 'كانشينجونغا', 'कंचनजंगा']),
  named('aconcagua', '⛰️', 6961, ['Aconcagua', 'Aconcagua', 'Aconcagua', 'Aconcagua', 'Aconcagua', 'Aconcagua', 'Aconcagua', 'Aconcágua', 'Аконкагуа', '阿空加瓜山', 'アコンカグア', '아콩카과산', 'أكونكاغوا', 'अकोंकागुआ']),
  named('denali', '⛰️', 6190, ['Denali', 'Denali', 'Denali', 'Denali', 'Denali', 'Denali', 'Denali', 'Denali', 'Денали', '迪纳利山', 'デナリ', '디날리산', 'دينالي', 'देनाली']),
  named('kilimanjaro', '🌋', 5895, ['Kilimanjaro', 'Kilimandscharo', 'Kilimangiaro', 'Kilimandjaro', 'Kilimandžáro', 'Kilimanjaro', 'Kilimandżaro', 'Quilimanjaro', 'Килиманджаро', '乞力马扎罗山', 'キリマンジャロ', '킬리만자로산', 'كليمنجارو', 'किलिमंजारो']),
  named('elbrus', '⛰️', 5642, ['Elbrus', 'Elbrus', 'Elbrus', 'Elbrouz', 'Elbrus', 'Elbrus', 'Elbrus', 'Elbrus', 'Эльбрус', '厄尔布鲁士山', 'エルブルス山', '엘브루스산', 'إلبروس', 'एल्ब्रुस']),
  named('kenya', '⛰️', 5199, ['Mount Kenya', 'Mount Kenya', 'Monte Kenya', 'Mont Kenya', 'Hora Keňa', 'Monte Kenia', 'Góra Kenia', 'Monte Quénia', 'Гора Кения', '肯尼亚山', 'ケニア山', '케냐산', 'جبل كينيا', 'माउंट केन्या']),
  named('vinson', '🏔️', 4892, ['Mount Vinson', 'Mount Vinson', 'Massiccio Vinson', 'Mont Vinson', 'Vinsonův masiv', 'Macizo Vinson', 'Masyw Vinsona', 'Maciço Vinson', 'Массив Винсон', '文森山', 'ヴィンソン・マシフ', '빈슨산괴', 'جبل فينسون', 'विन्सन मैसिफ़']),
  named('montblanc', '🏔️', 4806, ['Mont Blanc', 'Mont Blanc', 'Monte Bianco', 'Mont Blanc', 'Mont Blanc', 'Mont Blanc', 'Mont Blanc', 'Monte Branco', 'Монблан', '勃朗峰', 'モンブラン', '몽블랑', 'مون بلان', 'मों ब्लां']),
  named('matterhorn', '🏔️', 4478, ['Matterhorn', 'Matterhorn', 'Cervino', 'Cervin', 'Matterhorn', 'Cervino', 'Matterhorn', 'Matterhorn', 'Маттерхорн', '马特洪峰', 'マッターホルン', '마터호른', 'ماترهورن', 'मैटरहॉर्न']),
  named('maunakea', '🌋', 4207, ['Mauna Kea', 'Mauna Kea', 'Mauna Kea', 'Mauna Kea', 'Mauna Kea', 'Mauna Kea', 'Mauna Kea', 'Mauna Kea', 'Мауна-Кеа', '冒纳凯阿火山', 'マウナ・ケア', '마우나케아산', 'مونا كيا', 'मौना की']),
  named('grossglockner', '⛰️', 3798, ['Grossglockner', 'Großglockner', 'Grossglockner', 'Grossglockner', 'Grossglockner', 'Grossglockner', 'Grossglockner', 'Grossglockner', 'Гросглоккнер', '大格洛克纳山', 'グロースグロックナー', '그로스글로크너산', 'غروسغلوكنر', 'ग्रॉसग्लॉकनर']),
  named('fuji', '🗻', 3776, ['Mount Fuji', 'Fuji', 'Monte Fuji', 'Mont Fuji', 'Fudži', 'Monte Fuji', 'Fudżi', 'Monte Fuji', 'Фудзияма', '富士山', '富士山', '후지산', 'جبل فوجي', 'फ़ूजी पर्वत']),
  named('etna', '🌋', 3357, ['Mount Etna', 'Ätna', 'Etna', 'Etna', 'Etna', 'Etna', 'Etna', 'Etna', 'Этна', '埃特纳火山', 'エトナ山', '에트나산', 'إتنا', 'एटना']),
  named('zugspitze', '⛰️', 2962, ['Zugspitze', 'Zugspitze', 'Zugspitze', 'Zugspitze', 'Zugspitze', 'Zugspitze', 'Zugspitze', 'Zugspitze', 'Цугшпитце', '楚格峰', 'ツークシュピッツェ', '추크슈피체', 'تسوغشبيتسه', 'त्सुगस्पित्से']),
  named('olympus', '⛰️', 2918, ['Mount Olympus', 'Olymp', 'Monte Olimpo', 'Mont Olympe', 'Olymp', 'Monte Olimpo', 'Olimp', 'Monte Olimpo', 'Олимп', '奥林匹斯山', 'オリンポス山', '올림포스산', 'جبل الأوليمب', 'ओलिंपस पर्वत']),
  named('triglav', '⛰️', 2864, ['Triglav', 'Triglav', 'Triglav', 'Triglav', 'Triglav', 'Triglav', 'Triglav', 'Triglav', 'Триглав', '特里格拉夫峰', 'トリグラフ山', '트리글라우산', 'تريغلاف', 'त्रिग्लाव']),
  named('gerlach', '⛰️', 2655, ['Gerlachovský štít', 'Gerlachspitze', 'Gerlachovský štít', 'Gerlachovský štít', 'Gerlachovský štít', 'Gerlachovský štít', 'Gerlach', 'Gerlachovský štít', 'Герлаховски-Штит', '格尔拉赫峰', 'ゲルラホフスキー・シュティート', '게를라호프스키봉', 'غيرلاخ', 'गेरलाख']),
  named('rysy', '⛰️', 2499, ['Rysy', 'Meeraugspitze', 'Rysy', 'Rysy', 'Rysy', 'Rysy', 'Rysy', 'Rysy', 'Рысы', '雷西峰', 'リシ山', '리시산', 'ريسي', 'रिसी']),
  named('kosciuszko', '⛰️', 2228, ['Mount Kosciuszko', 'Mount Kosciuszko', 'Monte Kosciuszko', 'Mont Kosciuszko', 'Kosciuszko', 'Monte Kosciuszko', 'Góra Kościuszki', 'Monte Kosciuszko', 'Гора Косцюшко', '科修斯科山', 'コジオスコ山', '코지어스코산', 'جبل كوزيوسكو', 'कोसियुस्को पर्वत']),
  named('snezka', '⛰️', 1603, ['Sněžka', 'Schneekoppe', 'Sněžka', 'Sněžka', 'Sněžka', 'Sněžka', 'Śnieżka', 'Sněžka', 'Снежка', '斯涅日卡山', 'スニェシュカ山', '스녜슈카산', 'سنيجكا', 'स्नेज़्का']),
  named('praded', '⛰️', 1491, ['Praděd', 'Altvater', 'Praděd', 'Praděd', 'Praděd', 'Praděd', 'Pradziad', 'Praděd', 'Прадед', '普拉代德山', 'プラジェト山', '프라데트산', 'براديد', 'प्राडेड']),
  named('bennevis', '⛰️', 1345, ['Ben Nevis', 'Ben Nevis', 'Ben Nevis', 'Ben Nevis', 'Ben Nevis', 'Ben Nevis', 'Ben Nevis', 'Ben Nevis', 'Бен-Невис', '本尼维斯山', 'ベン・ネビス山', '벤네비스산', 'بن نيفيس', 'बेन नेविस']),
  named('lysa', '⛰️', 1323, ['Lysá hora', 'Lysá hora', 'Lysá hora', 'Lysá hora', 'Lysá hora', 'Lysá hora', 'Łysa Góra (Beskidy)', 'Lysá hora', 'Лиса-Гора', '利萨山', 'リサー・ホラ', '리사호라', 'ليسا هورا', 'लीसा होरा']),
  named('jested', '⛰️', 1012, ['Ještěd', 'Jeschken', 'Ještěd', 'Ještěd', 'Ještěd', 'Ještěd', 'Jesztiad', 'Ještěd', 'Йештед', '耶什捷德山', 'イェシュチェト山', '예슈테트산', 'ييشتيد', 'येश्त्येद']),
  named('rip', '⛰️', 456, ['Říp', 'Georgsberg (Říp)', 'Říp', 'Říp', 'Říp', 'Říp', 'Rzip', 'Říp', 'Ржип', '日普山', 'ジープ山', '르지프산', 'ريب', 'र्ज़िप']),
];

/* ── Rivers (km) ── */
const RIVERS: HLItem[] = [
  named('nile', '🌊', 6650, ['Nile', 'Nil', 'Nilo', 'Nil', 'Nil', 'Nilo', 'Nil', 'Nilo', 'Нил', '尼罗河', 'ナイル川', '나일강', 'النيل', 'नील नदी']),
  named('amazon', '🌊', 6400, ['Amazon', 'Amazonas', 'Rio delle Amazzoni', 'Amazone', 'Amazonka', 'Amazonas', 'Amazonka', 'Amazonas', 'Амазонка', '亚马孙河', 'アマゾン川', '아마존강', 'الأمازون', 'अमेज़न नदी']),
  named('yangtze', '🌊', 6300, ['Yangtze', 'Jangtsekiang', 'Fiume Azzurro', 'Yangzi Jiang', 'Jang-c’-ťiang', 'Yangtsé', 'Jangcy', 'Yangtzé', 'Янцзы', '长江', '長江', '양쯔강', 'اليانغتسي', 'यांग्त्से नदी']),
  named('yellow', '🌊', 5464, ['Yellow River', 'Gelber Fluss', 'Fiume Giallo', 'Fleuve Jaune', 'Žlutá řeka', 'Río Amarillo', 'Huang He', 'Rio Amarelo', 'Хуанхэ', '黄河', '黄河', '황허강', 'النهر الأصفر', 'ह्वांग हो']),
  named('parana', '🌊', 4880, ['Paraná', 'Paraná', 'Paraná', 'Paraná', 'Paraná', 'Paraná', 'Parana', 'Paraná', 'Парана', '巴拉那河', 'パラナ川', '파라나강', 'نهر بارانا', 'पराना नदी']),
  named('congo', '🌊', 4700, ['Congo', 'Kongo', 'Congo', 'Congo', 'Kongo', 'Congo', 'Kongo', 'Congo', 'Конго', '刚果河', 'コンゴ川', '콩고강', 'نهر الكونغو', 'कांगो नदी']),
  named('amur', '🌊', 4444, ['Amur', 'Amur', 'Amur', 'Amour', 'Amur', 'Amur', 'Amur', 'Amur', 'Амур', '黑龙江', 'アムール川', '아무르강', 'نهر أمور', 'अमूर नदी']),
  named('lena', '🌊', 4400, ['Lena', 'Lena', 'Lena', 'Léna', 'Lena', 'Lena', 'Lena', 'Lena', 'Лена', '勒拿河', 'レナ川', '레나강', 'نهر لينا', 'लेना नदी']),
  named('mekong', '🌊', 4350, ['Mekong', 'Mekong', 'Mekong', 'Mékong', 'Mekong', 'Mekong', 'Mekong', 'Mekong', 'Меконг', '湄公河', 'メコン川', '메콩강', 'نهر ميكونغ', 'मेकांग नदी']),
  named('niger', '🌊', 4180, ['Niger', 'Niger', 'Niger', 'Niger', 'Niger', 'Níger', 'Niger', 'Níger', 'Нигер', '尼日尔河', 'ニジェール川', '니제르강', 'نهر النيجر', 'नाइजर नदी']),
  named('mississippi', '🌊', 3730, ['Mississippi', 'Mississippi', 'Mississippi', 'Mississippi', 'Mississippi', 'Misisipi', 'Missisipi', 'Mississípi', 'Миссисипи', '密西西比河', 'ミシシッピ川', '미시시피강', 'نهر المسيسيبي', 'मिसिसिपी नदी']),
  named('volga', '🌊', 3530, ['Volga', 'Wolga', 'Volga', 'Volga', 'Volha', 'Volga', 'Wołga', 'Volga', 'Волга', '伏尔加河', 'ヴォルガ川', '볼가강', 'نهر الفولغا', 'वोल्गा नदी']),
  named('yenisei', '🌊', 3487, ['Yenisei', 'Jenissei', 'Enisej', 'Ienisseï', 'Jenisej', 'Yeniséi', 'Jenisej', 'Ienissei', 'Енисей', '叶尼塞河', 'エニセイ川', '예니세이강', 'نهر ينيسي', 'येनिसेई नदी']),
  named('indus', '🌊', 3180, ['Indus', 'Indus', 'Indo', 'Indus', 'Indus', 'Indo', 'Indus', 'Indo', 'Инд', '印度河', 'インダス川', '인더스강', 'نهر السند', 'सिंधु नदी']),
  named('danube', '🌊', 2850, ['Danube', 'Donau', 'Danubio', 'Danube', 'Dunaj', 'Danubio', 'Dunaj', 'Danúbio', 'Дунай', '多瑙河', 'ドナウ川', '도나우강', 'نهر الدانوب', 'डेन्यूब नदी']),
  named('euphrates', '🌊', 2800, ['Euphrates', 'Euphrat', 'Eufrate', 'Euphrate', 'Eufrat', 'Éufrates', 'Eufrat', 'Eufrates', 'Евфрат', '幼发拉底河', 'ユーフラテス川', '유프라테스강', 'نهر الفرات', 'फ़रात नदी']),
  named('zambezi', '🌊', 2574, ['Zambezi', 'Sambesi', 'Zambesi', 'Zambèze', 'Zambezi', 'Zambeze', 'Zambezi', 'Zambeze', 'Замбези', '赞比西河', 'ザンベジ川', '잠베지강', 'نهر زامبيزي', 'ज़ाम्बेज़ी नदी']),
  named('ganges', '🌊', 2525, ['Ganges', 'Ganges', 'Gange', 'Gange', 'Ganga', 'Ganges', 'Ganges', 'Ganges', 'Ганг', '恒河', 'ガンジス川', '갠지스강', 'نهر الغانج', 'गंगा नदी']),
  named('dnieper', '🌊', 2201, ['Dnieper', 'Dnepr', 'Dnepr', 'Dniepr', 'Dněpr', 'Dniéper', 'Dniepr', 'Dniepre', 'Днепр', '第聂伯河', 'ドニエプル川', '드니프로강', 'نهر دنيبر', 'नीपर नदी']),
  named('rhine', '🌊', 1233, ['Rhine', 'Rhein', 'Reno', 'Rhin', 'Rýn', 'Rin', 'Ren', 'Reno', 'Рейн', '莱茵河', 'ライン川', '라인강', 'نهر الراين', 'राइन नदी']),
  named('elbe', '🌊', 1094, ['Elbe', 'Elbe', 'Elba', 'Elbe', 'Labe', 'Elba', 'Łaba', 'Elba', 'Эльба', '易北河', 'エルベ川', '엘베강', 'نهر إلبه', 'एल्बे नदी']),
  named('vistula', '🌊', 1047, ['Vistula', 'Weichsel', 'Vistola', 'Vistule', 'Visla', 'Vístula', 'Wisła', 'Vístula', 'Висла', '维斯瓦河', 'ヴィスワ川', '비스와강', 'نهر فيستولا', 'विस्तुला नदी']),
  named('loire', '🌊', 1006, ['Loire', 'Loire', 'Loira', 'Loire', 'Loira', 'Loira', 'Loara', 'Loire', 'Луара', '卢瓦尔河', 'ロワール川', '루아르강', 'نهر اللوار', 'लौआर नदी']),
  named('oder', '🌊', 854, ['Oder', 'Oder', 'Oder', 'Oder', 'Odra', 'Óder', 'Odra', 'Oder', 'Одра', '奥得河', 'オーデル川', '오데르강', 'نهر أودر', 'ओडर नदी']),
  named('seine', '🌊', 777, ['Seine', 'Seine', 'Senna', 'Seine', 'Seina', 'Sena', 'Sekwana', 'Sena', 'Сена', '塞纳河', 'セーヌ川', '센강', 'نهر السين', 'सेन नदी']),
  named('po', '🌊', 652, ['Po', 'Po', 'Po', 'Pô', 'Pád', 'Po', 'Pad', 'Pó', 'По', '波河', 'ポー川', '포강', 'نهر بو', 'पो नदी']),
  named('vltava', '🌊', 430, ['Vltava', 'Moldau', 'Moldava', 'Vltava', 'Vltava', 'Moldava', 'Wełtawa', 'Moldava', 'Влтава', '伏尔塔瓦河', 'ヴルタヴァ川', '블타바강', 'نهر فلتافا', 'वल्टावा नदी']),
  named('thames', '🌊', 346, ['Thames', 'Themse', 'Tamigi', 'Tamise', 'Temže', 'Támesis', 'Tamiza', 'Tâmisa', 'Темза', '泰晤士河', 'テムズ川', '템스강', 'نهر التايمز', 'टेम्स नदी']),
];

export const CATEGORIES: Record<CategoryId, HLCategory> = {
  pop: { id: 'pop', weight: 0.3, items: POPULATION },
  area: { id: 'area', weight: 0.25, items: AREA },
  mountain: { id: 'mountain', weight: 0.25, items: MOUNTAINS },
  river: { id: 'river', weight: 0.2, items: RIVERS },
};
const CATEGORY_LIST = Object.values(CATEGORIES);

/** Item name in the given language (falls back to English). */
export function itemName(item: HLItem, lang: string): string {
  if (item.country) return getCountryName(item.country, lang);
  const i = NAME_LANGS.indexOf(lang as Lang);
  return item.names?.[i >= 0 ? i : 0] ?? item.id;
}

/** Number formatted for the language; population below 20 million keeps one decimal (10.5 vs 10.9). */
export function formatValue(cat: CategoryId, value: number, lang: string): string {
  const digits = cat === 'pop' && value < 20 ? 1 : 0;
  try {
    return new Intl.NumberFormat(lang, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
  } catch {
    return value.toFixed(digits);
  }
}

/** FNV-1a hash of the seed + mulberry32 (same generator as Daily Blocks), so everyone gets the same sequence.
   The demo's xorshift gave correlated consecutive numbers: some days every answer was "lower". */
function seededRandom(seed: string): () => number {
  let s = 2166136261;
  for (const c of seed) { s ^= c.charCodeAt(0); s = Math.imul(s, 16777619) >>> 0; }
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface HLPair { cat: CategoryId; a: HLItem; b: HLItem }

/** The 10 pairs for a seed (the UTC date for the daily set). No pair repeats and values never tie. */
export function buildPairs(seed: string): HLPair[] {
  const r = seededRandom(seed);
  const out: HLPair[] = [];
  const used = new Set<string>();
  while (out.length < ROUNDS) {
    let x = r();
    const cat = CATEGORY_LIST.find(c => (x -= c.weight) < 0) ?? CATEGORY_LIST[CATEGORY_LIST.length - 1];
    const it = cat.items;
    const a = it[Math.floor(r() * it.length)];
    const b = it[Math.floor(r() * it.length)];
    const key = `${cat.id}:${[a.id, b.id].sort().join('|')}`;
    if (a === b || a.value === b.value || used.has(key)) continue;
    used.add(key);
    out.push({ cat: cat.id, a, b });
  }
  return out;
}
