import type { Lang } from './i18n';

/* Texts for the dashboard's lower part (Today's Trio, My Day) and the site footer, in 14 languages.
   Each row lists the values in the order of its key list below. */

const TRIO_KEYS = [
  'title', 'subtitle', 'allGames', 'puzzleDesc', 'hlDesc', 'blocksDesc',
  'done', 'play', 'share', 'copied', 'today', 'solvedIn', 'notSolved', 'score',
] as const;

const MYDAY_KEYS = [
  'title', 'edit', 'doneEdit', 'add', 'pick', 'cities', 'weather', 'team', 'crypto', 'birthday', 'challenge',
  'citiesEmpty', 'weatherEmpty', 'teamEmpty', 'cryptoEmpty', 'birthdayEmpty',
  'searchCity', 'useLocation', 'myLocation', 'changeCity', 'untilBirthday', 'birthdayToday',
  'challengeDone', 'streak', 'last', 'next', 'noMatch', 'h24',
] as const;

const FOOTER_KEYS = [
  'about', 'tools', 'games', 'site', 'aboutLink', 'suggest', 'privacy', 'cookies', 'contact', 'leaderboards', 'language',
] as const;

type Dict<K extends readonly string[]> = Record<K[number], string>;
type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export type HomeStrings = {
  trio: Dict<typeof TRIO_KEYS>;
  myDay: Dict<typeof MYDAY_KEYS>;
  footer: Dict<typeof FOOTER_KEYS>;
  /** Word for "day(s)" by plural category, e.g. cs: 1 den, 2 dny, 5 dní */
  dayForms: PluralForms;
};

function zip<K extends readonly string[]>(keys: K, values: string[]): Dict<K> {
  if (values.length !== keys.length) throw new Error(`homeI18n: expected ${keys.length} values, got ${values.length}`);
  return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as Dict<K>;
}

function lang(trio: string[], myDay: string[], footer: string[], dayForms: PluralForms): HomeStrings {
  return { trio: zip(TRIO_KEYS, trio), myDay: zip(MYDAY_KEYS, myDay), footer: zip(FOOTER_KEYS, footer), dayForms };
}

const STRINGS: Record<Lang, HomeStrings> = {
  en: lang(
    ["Today's Trio", '3 quick games, the same for the whole world', 'All games', 'Guess the word of the day in 6 tries', '10 pairs: which is more?', 'Same pieces for everyone',
      'DONE', 'Play', 'Share', 'Copied!', 'today', 'Solved in {n}/6', 'Not solved · X/6', 'Score {n}'],
    ['My Day', 'Edit', 'Done', '+ Add', '+ Choose', 'My cities', 'Weather', 'My team', 'Crypto', 'Birthday', "Today's challenge",
      'Clocks for your cities', 'Pick your city', 'Follow your team', 'Track a coin', 'Countdown to your birthday',
      'Search city…', 'Use my location', 'My location', 'Change city', 'until birthday', 'Today! 🎉',
      'done', 'streak', 'Last', 'Next', 'No match found', '24 h'],
    ['Your everyday hub: time, weather, converters, news and quick games. Free, no sign-up.', 'Tools', 'Games', 'About', 'About the project', 'Suggest a feature', 'Privacy', 'Cookies', 'Contact', 'Leaderboards', 'Language'],
    { one: 'day', other: 'days' },
  ),
  de: lang(
    ['Das heutige Trio', '3 kurze Spiele, gleich für die ganze Welt', 'Alle Spiele', 'Errate das Wort des Tages in 6 Versuchen', '10 Paare: Was ist mehr?', 'Gleiche Steine für alle',
      'FERTIG', 'Spielen', 'Teilen', 'Kopiert!', 'heute', 'Gelöst in {n}/6', 'Nicht gelöst · X/6', 'Punkte {n}'],
    ['Mein Tag', 'Bearbeiten', 'Fertig', '+ Hinzufügen', '+ Wählen', 'Meine Städte', 'Wetter', 'Mein Team', 'Krypto', 'Geburtstag', 'Heutige Challenge',
      'Uhren deiner Städte', 'Wähle deine Stadt', 'Folge deinem Team', 'Verfolge eine Münze', 'Countdown bis zum Geburtstag',
      'Stadt suchen…', 'Meinen Standort verwenden', 'Mein Standort', 'Stadt ändern', 'bis zum Geburtstag', 'Heute! 🎉',
      'erledigt', 'Serie', 'Letztes', 'Nächstes', 'Kein Spiel gefunden', '24 h'],
    ['Dein täglicher Begleiter: Zeit, Wetter, Umrechner, Nachrichten und kurze Spiele. Kostenlos, ohne Anmeldung.', 'Werkzeuge', 'Spiele', 'Über die Seite', 'Über das Projekt', 'Funktion vorschlagen', 'Datenschutz', 'Cookies', 'Kontakt', 'Bestenlisten', 'Sprache'],
    { one: 'Tag', other: 'Tage' },
  ),
  it: lang(
    ['Il tris di oggi', '3 giochi brevi, uguali per tutto il mondo', 'Tutti i giochi', 'Indovina la parola del giorno in 6 tentativi', '10 coppie: quale è di più?', 'Gli stessi pezzi per tutti',
      'FATTO', 'Gioca', 'Condividi', 'Copiato!', 'oggi', 'Risolto in {n}/6', 'Non risolto · X/6', 'Punteggio {n}'],
    ['La mia giornata', 'Modifica', 'Fatto', '+ Aggiungi', '+ Scegli', 'Le mie città', 'Meteo', 'La mia squadra', 'Cripto', 'Compleanno', 'Sfida di oggi',
      'Orologi delle tue città', 'Scegli la tua città', 'Segui la tua squadra', 'Segui una moneta', 'Conto alla rovescia al compleanno',
      'Cerca città…', 'Usa la mia posizione', 'La mia posizione', 'Cambia città', 'al compleanno', 'Oggi! 🎉',
      'fatte', 'serie', 'Ultima', 'Prossima', 'Nessuna partita trovata', '24 h'],
    ['Il tuo punto di riferimento quotidiano: ora, meteo, convertitori, notizie e giochi brevi. Gratis, senza registrazione.', 'Strumenti', 'Giochi', 'Il sito', 'Il progetto', 'Suggerisci una funzione', 'Privacy', 'Cookie', 'Contatti', 'Classifiche', 'Lingua'],
    { one: 'giorno', other: 'giorni' },
  ),
  fr: lang(
    ['Le trio du jour', '3 jeux courts, les mêmes pour le monde entier', 'Tous les jeux', 'Devine le mot du jour en 6 essais', '10 paires : lequel est le plus grand ?', 'Les mêmes pièces pour tous',
      'TERMINÉ', 'Jouer', 'Partager', 'Copié !', "aujourd'hui", 'Trouvé en {n}/6', 'Non trouvé · X/6', 'Score {n}'],
    ['Ma journée', 'Modifier', 'Terminé', '+ Ajouter', '+ Choisir', 'Mes villes', 'Météo', 'Mon équipe', 'Crypto', 'Anniversaire', 'Défi du jour',
      "L'heure de tes villes", 'Choisis ta ville', 'Suis ton équipe', 'Suis une crypto', "Compte à rebours de l'anniversaire",
      'Rechercher une ville…', 'Utiliser ma position', 'Ma position', 'Changer de ville', "avant l'anniversaire", "Aujourd'hui ! 🎉",
      'faites', 'série', 'Dernier', 'Prochain', 'Aucun match trouvé', '24 h'],
    ['Ton compagnon du quotidien : heure, météo, convertisseurs, actualités et petits jeux. Gratuit, sans inscription.', 'Outils', 'Jeux', 'Le site', 'À propos', 'Proposer une fonction', 'Confidentialité', 'Cookies', 'Contact', 'Classements', 'Langue'],
    { one: 'jour', other: 'jours' },
  ),
  cs: lang(
    ['Dnešní trojka', '3 krátké hry, stejné pro celý svět', 'Všechny hry', 'Uhodni slovo dne na 6 pokusů', '10 dvojic: co je víc?', 'Stejné kostky pro všechny',
      'HOTOVO', 'Hrát', 'Sdílet', 'Zkopírováno!', 'dnes', 'Uhodnuto na {n}/6', 'Neuhodnuto · X/6', 'Skóre {n}'],
    ['Můj den', 'Upravit', 'Hotovo', '+ Přidat', '+ Vybrat', 'Moje města', 'Počasí', 'Můj tým', 'Krypto', 'Narozeniny', 'Dnešní výzva',
      'Hodiny tvých měst', 'Vyber své město', 'Sleduj svůj tým', 'Sleduj kurz mince', 'Odpočet do narozenin',
      'Hledat město…', 'Použít moji polohu', 'Moje poloha', 'Změnit město', 'do narozenin', 'Dnes! 🎉',
      'hotovo', 'série', 'Posl.', 'Příští', 'Žádný zápas', '24 h'],
    ['Tvůj denní rozcestník: čas, počasí, převodníky, zprávy a krátké hry. Zdarma a bez registrace.', 'Nástroje', 'Hry', 'O webu', 'O projektu', 'Navrhnout funkci', 'Ochrana soukromí', 'Cookies', 'Kontakt', 'Žebříčky', 'Jazyk'],
    { one: 'den', few: 'dny', many: 'dne', other: 'dní' },
  ),
  es: lang(
    ['El trío de hoy', '3 juegos cortos, iguales para todo el mundo', 'Todos los juegos', 'Adivina la palabra del día en 6 intentos', '10 pares: ¿cuál es mayor?', 'Las mismas piezas para todos',
      'HECHO', 'Jugar', 'Compartir', '¡Copiado!', 'hoy', 'Resuelto en {n}/6', 'No resuelto · X/6', 'Puntos {n}'],
    ['Mi día', 'Editar', 'Listo', '+ Añadir', '+ Elegir', 'Mis ciudades', 'Tiempo', 'Mi equipo', 'Cripto', 'Cumpleaños', 'Reto de hoy',
      'Relojes de tus ciudades', 'Elige tu ciudad', 'Sigue a tu equipo', 'Sigue una moneda', 'Cuenta atrás para tu cumpleaños',
      'Buscar ciudad…', 'Usar mi ubicación', 'Mi ubicación', 'Cambiar ciudad', 'para el cumpleaños', '¡Hoy! 🎉',
      'hechas', 'racha', 'Último', 'Próximo', 'Sin partidos', '24 h'],
    ['Tu centro diario: hora, tiempo, conversores, noticias y juegos cortos. Gratis y sin registro.', 'Herramientas', 'Juegos', 'Sobre la web', 'Sobre el proyecto', 'Sugerir una función', 'Privacidad', 'Cookies', 'Contacto', 'Clasificaciones', 'Idioma'],
    { one: 'día', other: 'días' },
  ),
  pl: lang(
    ['Dzisiejsza trójka', '3 krótkie gry, takie same dla całego świata', 'Wszystkie gry', 'Odgadnij słowo dnia w 6 próbach', '10 par: co jest większe?', 'Te same klocki dla wszystkich',
      'GOTOWE', 'Graj', 'Udostępnij', 'Skopiowano!', 'dziś', 'Odgadnięte w {n}/6', 'Nieodgadnięte · X/6', 'Wynik {n}'],
    ['Mój dzień', 'Edytuj', 'Gotowe', '+ Dodaj', '+ Wybierz', 'Moje miasta', 'Pogoda', 'Moja drużyna', 'Krypto', 'Urodziny', 'Dzisiejsze wyzwanie',
      'Zegary twoich miast', 'Wybierz swoje miasto', 'Śledź swoją drużynę', 'Śledź kurs monety', 'Odliczanie do urodzin',
      'Szukaj miasta…', 'Użyj mojej lokalizacji', 'Moja lokalizacja', 'Zmień miasto', 'do urodzin', 'Dziś! 🎉',
      'zrobione', 'seria', 'Ostatni', 'Następny', 'Brak meczu', '24 h'],
    ['Twoje codzienne centrum: czas, pogoda, przeliczniki, wiadomości i krótkie gry. Za darmo, bez rejestracji.', 'Narzędzia', 'Gry', 'O serwisie', 'O projekcie', 'Zaproponuj funkcję', 'Prywatność', 'Cookies', 'Kontakt', 'Rankingi', 'Język'],
    { one: 'dzień', few: 'dni', many: 'dni', other: 'dnia' },
  ),
  pt: lang(
    ['O trio de hoje', '3 jogos rápidos, iguais para o mundo inteiro', 'Todos os jogos', 'Adivinha a palavra do dia em 6 tentativas', '10 pares: qual é maior?', 'As mesmas peças para todos',
      'FEITO', 'Jogar', 'Partilhar', 'Copiado!', 'hoje', 'Resolvido em {n}/6', 'Não resolvido · X/6', 'Pontos {n}'],
    ['O meu dia', 'Editar', 'Concluído', '+ Adicionar', '+ Escolher', 'As minhas cidades', 'Tempo', 'A minha equipa', 'Cripto', 'Aniversário', 'Desafio de hoje',
      'Relógios das tuas cidades', 'Escolhe a tua cidade', 'Segue a tua equipa', 'Acompanha uma moeda', 'Contagem para o aniversário',
      'Procurar cidade…', 'Usar a minha localização', 'A minha localização', 'Mudar cidade', 'até ao aniversário', 'Hoje! 🎉',
      'feitas', 'sequência', 'Último', 'Próximo', 'Sem jogos', '24 h'],
    ['O teu centro diário: hora, tempo, conversores, notícias e jogos rápidos. Grátis, sem registo.', 'Ferramentas', 'Jogos', 'Sobre o site', 'Sobre o projeto', 'Sugerir uma função', 'Privacidade', 'Cookies', 'Contacto', 'Classificações', 'Idioma'],
    { one: 'dia', other: 'dias' },
  ),
  ru: lang(
    ['Тройка дня', '3 короткие игры, одинаковые для всего мира', 'Все игры', 'Угадай слово дня за 6 попыток', '10 пар: что больше?', 'Одинаковые фигуры для всех',
      'ГОТОВО', 'Играть', 'Поделиться', 'Скопировано!', 'сегодня', 'Угадано за {n}/6', 'Не угадано · X/6', 'Очки {n}'],
    ['Мой день', 'Изменить', 'Готово', '+ Добавить', '+ Выбрать', 'Мои города', 'Погода', 'Моя команда', 'Крипто', 'День рождения', 'Задание дня',
      'Часы твоих городов', 'Выбери свой город', 'Следи за командой', 'Следи за монетой', 'Отсчёт до дня рождения',
      'Найти город…', 'Использовать моё местоположение', 'Моё местоположение', 'Сменить город', 'до дня рождения', 'Сегодня! 🎉',
      'выполнено', 'серия', 'Посл.', 'След.', 'Матчей нет', '24 ч'],
    ['Твой ежедневный помощник: время, погода, конвертеры, новости и короткие игры. Бесплатно и без регистрации.', 'Инструменты', 'Игры', 'О сайте', 'О проекте', 'Предложить функцию', 'Конфиденциальность', 'Cookies', 'Контакты', 'Рейтинги', 'Язык'],
    { one: 'день', few: 'дня', many: 'дней', other: 'дня' },
  ),
  zh: lang(
    ['今日三连', '3 个小游戏，全世界都一样', '全部游戏', '6 次机会猜出今日单词', '10 组对比：哪个更多？', '所有人都是同样的方块',
      '已完成', '开始', '分享', '已复制！', '今日', '{n}/6 猜中', '未猜中 · X/6', '得分 {n}'],
    ['我的一天', '编辑', '完成', '+ 添加', '+ 选择', '我的城市', '天气', '我的球队', '加密货币', '生日', '今日挑战',
      '你的城市时钟', '选择你的城市', '关注你的球队', '关注一种币', '生日倒计时',
      '搜索城市…', '使用我的位置', '我的位置', '更换城市', '距离生日', '就是今天！🎉',
      '已完成', '连续', '上场', '下场', '暂无比赛', '24 小时'],
    ['你的每日工具站：时间、天气、换算、新闻和小游戏。免费，无需注册。', '工具', '游戏', '关于本站', '关于项目', '建议功能', '隐私', 'Cookie', '联系', '排行榜', '语言'],
    { other: '天' },
  ),
  ja: lang(
    ['今日のトリオ', '世界共通の3つのミニゲーム', 'すべてのゲーム', '6回で今日の単語を当てよう', '10組：どっちが大きい？', '全員同じブロック',
      '完了', 'プレイ', 'シェア', 'コピーしました！', '今日', '{n}/6 で正解', '不正解 · X/6', 'スコア {n}'],
    ['マイデイ', '編集', '完了', '+ 追加', '+ 選択', 'マイ都市', '天気', 'マイチーム', '暗号資産', '誕生日', '今日のチャレンジ',
      'あなたの都市の時計', '都市を選択', 'チームをフォロー', 'コインを追跡', '誕生日までのカウントダウン',
      '都市を検索…', '現在地を使う', '現在地', '都市を変更', '誕生日まで', '今日です！🎉',
      '完了', '連続', '前回', '次回', '試合なし', '24時間'],
    ['毎日のハブ：時刻、天気、換算、ニュース、ミニゲーム。無料・登録不要。', 'ツール', 'ゲーム', 'サイトについて', 'プロジェクトについて', '機能を提案', 'プライバシー', 'Cookie', 'お問い合わせ', 'ランキング', '言語'],
    { other: '日' },
  ),
  ko: lang(
    ['오늘의 3종', '전 세계가 똑같은 짧은 게임 3개', '모든 게임', '6번 안에 오늘의 단어 맞히기', '10쌍: 어느 쪽이 더 클까?', '모두에게 같은 블록',
      '완료', '플레이', '공유', '복사됨!', '오늘', '{n}/6 정답', '실패 · X/6', '점수 {n}'],
    ['나의 하루', '편집', '완료', '+ 추가', '+ 선택', '내 도시', '날씨', '내 팀', '암호화폐', '생일', '오늘의 도전',
      '내 도시의 시계', '도시를 선택하세요', '팀을 팔로우하세요', '코인을 추적하세요', '생일 카운트다운',
      '도시 검색…', '내 위치 사용', '내 위치', '도시 변경', '생일까지', '오늘이에요! 🎉',
      '완료', '연속', '지난', '다음', '경기 없음', '24시간'],
    ['매일 쓰는 허브: 시간, 날씨, 변환기, 뉴스, 짧은 게임. 무료, 가입 불필요.', '도구', '게임', '사이트 정보', '프로젝트 소개', '기능 제안', '개인정보', '쿠키', '문의', '순위표', '언어'],
    { other: '일' },
  ),
  ar: lang(
    ['ثلاثية اليوم', '3 ألعاب قصيرة، نفسها للعالم كله', 'كل الألعاب', 'خمّن كلمة اليوم في 6 محاولات', '10 أزواج: أيهما أكبر؟', 'القطع نفسها للجميع',
      'تم', 'العب', 'مشاركة', 'تم النسخ!', 'اليوم', 'حُلّت في {n}/6', 'لم تُحل · X/6', 'النقاط {n}'],
    ['يومي', 'تعديل', 'تم', '+ إضافة', '+ اختيار', 'مدني', 'الطقس', 'فريقي', 'العملات الرقمية', 'عيد الميلاد', 'تحدي اليوم',
      'ساعات مدنك', 'اختر مدينتك', 'تابع فريقك', 'تابع عملة', 'العد التنازلي لعيد ميلادك',
      'ابحث عن مدينة…', 'استخدم موقعي', 'موقعي', 'تغيير المدينة', 'حتى عيد الميلاد', 'اليوم! 🎉',
      'منجزة', 'سلسلة', 'الأخيرة', 'القادمة', 'لا توجد مباريات', '24 س'],
    ['مركزك اليومي: الوقت والطقس والمحوّلات والأخبار وألعاب قصيرة. مجاني وبدون تسجيل.', 'الأدوات', 'الألعاب', 'عن الموقع', 'عن المشروع', 'اقترح ميزة', 'الخصوصية', 'ملفات تعريف الارتباط', 'اتصل بنا', 'لوحات الصدارة', 'اللغة'],
    { zero: 'يوم', one: 'يوم', two: 'يومان', few: 'أيام', many: 'يومًا', other: 'يوم' },
  ),
  hi: lang(
    ['आज की तिकड़ी', '3 छोटे गेम, पूरी दुनिया के लिए एक जैसे', 'सभी गेम', '6 कोशिशों में आज का शब्द पहचानें', '10 जोड़े: कौन ज़्यादा?', 'सबके लिए एक जैसे ब्लॉक',
      'पूरा', 'खेलें', 'शेयर', 'कॉपी हो गया!', 'आज', '{n}/6 में हल', 'हल नहीं · X/6', 'स्कोर {n}'],
    ['मेरा दिन', 'बदलें', 'हो गया', '+ जोड़ें', '+ चुनें', 'मेरे शहर', 'मौसम', 'मेरी टीम', 'क्रिप्टो', 'जन्मदिन', 'आज की चुनौती',
      'आपके शहरों की घड़ियाँ', 'अपना शहर चुनें', 'अपनी टीम फ़ॉलो करें', 'कोई कॉइन ट्रैक करें', 'जन्मदिन की उलटी गिनती',
      'शहर खोजें…', 'मेरी लोकेशन इस्तेमाल करें', 'मेरी लोकेशन', 'शहर बदलें', 'जन्मदिन तक', 'आज! 🎉',
      'पूरे', 'लगातार', 'पिछला', 'अगला', 'कोई मैच नहीं', '24 घं'],
    ['आपका रोज़ का हब: समय, मौसम, कन्वर्टर, ख़बरें और छोटे गेम। मुफ़्त, बिना साइन-अप।', 'टूल्स', 'गेम', 'साइट के बारे में', 'प्रोजेक्ट के बारे में', 'फ़ीचर सुझाएँ', 'गोपनीयता', 'कुकीज़', 'संपर्क', 'लीडरबोर्ड', 'भाषा'],
    { one: 'दिन', other: 'दिन' },
  ),
};

export function homeStrings(l: Lang): HomeStrings {
  return STRINGS[l] ?? STRINGS.en;
}

/** "5 dní", "1 day", "3 天" — number plus the right plural form of "day". */
export function formatDays(n: number, l: Lang): string {
  const forms = homeStrings(l).dayForms;
  const cat = new Intl.PluralRules(l).select(n);
  const word = forms[cat] ?? forms.other;
  return ['zh', 'ja', 'ko'].includes(l) ? `${n}${word}` : `${n} ${word}`;
}

/** Just the plural word for "day", for layouts that show the number separately. */
export function dayWord(n: number, l: Lang): string {
  const forms = homeStrings(l).dayForms;
  return forms[new Intl.PluralRules(l).select(n)] ?? forms.other;
}

/* "{n} currencies" by plural category — the number goes in {n}. */
const CURRENCY_FORMS: Record<Lang, PluralForms> = {
  en: { one: '{n} currency', other: '{n} currencies' },
  de: { one: '{n} Währung', other: '{n} Währungen' },
  it: { one: '{n} valuta', other: '{n} valute' },
  fr: { one: '{n} devise', other: '{n} devises' },
  cs: { one: '{n} měna', few: '{n} měny', many: '{n} měny', other: '{n} měn' },
  es: { one: '{n} moneda', other: '{n} monedas' },
  pl: { one: '{n} waluta', few: '{n} waluty', many: '{n} walut', other: '{n} waluty' },
  pt: { one: '{n} moeda', other: '{n} moedas' },
  ru: { one: '{n} валюта', few: '{n} валюты', many: '{n} валют', other: '{n} валюты' },
  zh: { other: '{n} 种货币' },
  ja: { other: '{n}通貨' },
  ko: { other: '{n}개 통화' },
  ar: { zero: '{n} عملة', one: 'عملة واحدة', two: 'عملتان', few: '{n} عملات', many: '{n} عملة', other: '{n} عملة' },
  hi: { one: '{n} मुद्रा', other: '{n} मुद्राएँ' },
};

/** "23 měn", "23 currencies", "23 валюты" */
export function formatCurrencies(n: number, l: Lang): string {
  const forms = CURRENCY_FORMS[l] ?? CURRENCY_FORMS.en;
  return (forms[new Intl.PluralRules(l).select(n)] ?? forms.other).replace('{n}', String(n));
}
