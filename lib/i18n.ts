export type Lang =
  | 'en' | 'de' | 'it' | 'fr' | 'cs'
  | 'es' | 'pl' | 'pt' | 'ru' | 'zh'
  | 'ja' | 'ko' | 'ar' | 'hi';

export type Translations = {
  nav: {
    home: string;
    worldTime: string;
    currency: string;
    unitConverter: string;
    dateCounter: string;
    weather: string;
    ageCalculator: string;
    sports: string;
    trending: string;
    crypto: string;
    dailyBoost: string;
    dailyGames: string;
    markets: string;
    ipAddress: string;
    speedTest: string;
    passwordGenerator: string;
    sunriseSunset: string;
    bmi: string;
  };
  topbar: {
    home: string;
    worldTime: string;
    converters: string;
    weather: string;
    sports: string;
    more: string;
    search: string;
  };
  buttons: {
    exploreNow: string;
    upgradeNow: string;
    viewAll: string;
  };
  general: {
    loading: string;
    error: string;
  };
  premium: {
    title: string;
    description: string;
  };
};

const t: Record<Lang, Translations> = {
  en: {
    nav: {
      home: 'Home',
      worldTime: 'World Time',
      currency: 'Currency',
      unitConverter: 'Unit Converter',
      dateCounter: 'Date Counter',
      weather: 'Weather',
      ageCalculator: 'Age Calculator',
      sports: 'Sports Center',
      trending: 'Trending',
      crypto: 'Crypto',
      dailyBoost: 'Daily Boost',
      dailyGames: 'Daily Games',
      markets: 'Markets',
      ipAddress: 'IP Address',
      speedTest: 'Speed Test',
      passwordGenerator: 'Password Generator',
      sunriseSunset: 'Sunrise & Sunset',
      bmi: 'BMI',
    },
    topbar: {
      home: 'Home',
      worldTime: 'World Time',
      converters: 'Converters',
      weather: 'Weather',
      sports: 'Sports',
      more: 'More',
      search: 'Search anything...',
    },
    buttons: {
      exploreNow: 'Explore Now',
      upgradeNow: 'Upgrade Now',
      viewAll: 'View All',
    },
    general: { loading: 'Loading...', error: 'Error' },
    premium: {
      title: 'GO PREMIUM',
      description: 'Ad-free experience and more powerful features',
    },
  },

  de: {
    nav: {
      home: 'Startseite',
      worldTime: 'Weltzeit',
      currency: 'Währung',
      unitConverter: 'Einheitenrechner',
      dateCounter: 'Datumszähler',
      weather: 'Wetter',
      ageCalculator: 'Altersrechner',
      sports: 'Sportzentrum',
      trending: 'Trending',
      crypto: 'Krypto',
      dailyBoost: 'Tagesboost',
      dailyGames: 'Tagesspiele',
      markets: 'Märkte',
      ipAddress: 'IP-Adresse',
      speedTest: 'Geschwindigkeitstest',
      passwordGenerator: 'Passwortgenerator',
      sunriseSunset: 'Sonnenauf- & -untergang',
      bmi: 'BMI',
    },
    topbar: {
      home: 'Startseite',
      worldTime: 'Weltzeit',
      converters: 'Konverter',
      weather: 'Wetter',
      sports: 'Sport',
      more: 'Mehr',
      search: 'Suche...',
    },
    buttons: {
      exploreNow: 'Jetzt erkunden',
      upgradeNow: 'Jetzt upgraden',
      viewAll: 'Alle anzeigen',
    },
    general: { loading: 'Laden...', error: 'Fehler' },
    premium: {
      title: 'PREMIUM',
      description: 'Werbefreie Erfahrung und erweiterte Funktionen',
    },
  },

  it: {
    nav: {
      home: 'Home',
      worldTime: 'Ora mondiale',
      currency: 'Valuta',
      unitConverter: 'Convertitore unità',
      dateCounter: 'Conta giorni',
      weather: 'Meteo',
      ageCalculator: 'Calcola età',
      sports: 'Centro sportivo',
      trending: 'Tendenze',
      crypto: 'Crypto',
      dailyBoost: 'Boost quotidiano',
      dailyGames: 'Giochi quotidiani',
      markets: 'Mercati',
      ipAddress: 'Indirizzo IP',
      speedTest: 'Test velocità',
      passwordGenerator: 'Generatore password',
      sunriseSunset: 'Alba e tramonto',
      bmi: 'BMI',
    },
    topbar: {
      home: 'Home',
      worldTime: 'Ora mondiale',
      converters: 'Convertitori',
      weather: 'Meteo',
      sports: 'Sport',
      more: 'Altro',
      search: 'Cerca...',
    },
    buttons: {
      exploreNow: 'Esplora ora',
      upgradeNow: 'Aggiorna ora',
      viewAll: 'Vedi tutto',
    },
    general: { loading: 'Caricamento...', error: 'Errore' },
    premium: {
      title: 'PREMIUM',
      description: 'Esperienza senza pubblicità e funzioni avanzate',
    },
  },

  fr: {
    nav: {
      home: 'Accueil',
      worldTime: 'Heure mondiale',
      currency: 'Devise',
      unitConverter: 'Convertisseur',
      dateCounter: 'Compte jours',
      weather: 'Météo',
      ageCalculator: "Calcul d'âge",
      sports: 'Centre sportif',
      trending: 'Tendances',
      crypto: 'Crypto',
      dailyBoost: 'Boost quotidien',
      dailyGames: 'Jeux du jour',
      markets: 'Marchés',
      ipAddress: 'Adresse IP',
      speedTest: 'Test de vitesse',
      passwordGenerator: 'Générateur de mot de passe',
      sunriseSunset: 'Lever et coucher',
      bmi: 'IMC',
    },
    topbar: {
      home: 'Accueil',
      worldTime: 'Heure mondiale',
      converters: 'Convertisseurs',
      weather: 'Météo',
      sports: 'Sport',
      more: 'Plus',
      search: 'Rechercher...',
    },
    buttons: {
      exploreNow: 'Explorer',
      upgradeNow: 'Mettre à niveau',
      viewAll: 'Voir tout',
    },
    general: { loading: 'Chargement...', error: 'Erreur' },
    premium: {
      title: 'PREMIUM',
      description: 'Expérience sans pub et fonctionnalités avancées',
    },
  },

  cs: {
    nav: {
      home: 'Domů',
      worldTime: 'Světový čas',
      currency: 'Měna',
      unitConverter: 'Převodník jednotek',
      dateCounter: 'Počítadlo dnů',
      weather: 'Počasí',
      ageCalculator: 'Věková kalkulačka',
      sports: 'Sportovní centrum',
      trending: 'Trendy',
      crypto: 'Krypto',
      dailyBoost: 'Denní boost',
      dailyGames: 'Denní hry',
      markets: 'Trhy',
      ipAddress: 'IP adresa',
      speedTest: 'Test rychlosti',
      passwordGenerator: 'Generátor hesel',
      sunriseSunset: 'Východ a západ slunce',
      bmi: 'BMI',
    },
    topbar: {
      home: 'Domů',
      worldTime: 'Světový čas',
      converters: 'Převodníky',
      weather: 'Počasí',
      sports: 'Sport',
      more: 'Více',
      search: 'Hledat...',
    },
    buttons: {
      exploreNow: 'Prozkoumat',
      upgradeNow: 'Upgradovat',
      viewAll: 'Zobrazit vše',
    },
    general: { loading: 'Načítání...', error: 'Chyba' },
    premium: {
      title: 'PREMIUM',
      description: 'Bez reklam a přístup k pokročilým funkcím',
    },
  },

  es: {
    nav: {
      home: 'Inicio',
      worldTime: 'Hora mundial',
      currency: 'Divisas',
      unitConverter: 'Conversor de unidades',
      dateCounter: 'Contador de fechas',
      weather: 'Tiempo',
      ageCalculator: 'Calculadora de edad',
      sports: 'Centro deportivo',
      trending: 'Tendencias',
      crypto: 'Cripto',
      dailyBoost: 'Impulso diario',
      dailyGames: 'Juegos diarios',
      markets: 'Mercados',
      ipAddress: 'Dirección IP',
      speedTest: 'Test de velocidad',
      passwordGenerator: 'Generador de contraseñas',
      sunriseSunset: 'Amanecer y atardecer',
      bmi: 'IMC',
    },
    topbar: {
      home: 'Inicio',
      worldTime: 'Hora mundial',
      converters: 'Conversores',
      weather: 'Tiempo',
      sports: 'Deportes',
      more: 'Más',
      search: 'Buscar...',
    },
    buttons: {
      exploreNow: 'Explorar ahora',
      upgradeNow: 'Actualizar ahora',
      viewAll: 'Ver todo',
    },
    general: { loading: 'Cargando...', error: 'Error' },
    premium: {
      title: 'PREMIUM',
      description: 'Sin anuncios y funciones más avanzadas',
    },
  },

  pl: {
    nav: {
      home: 'Strona główna',
      worldTime: 'Czas światowy',
      currency: 'Waluta',
      unitConverter: 'Przelicznik jednostek',
      dateCounter: 'Licznik dat',
      weather: 'Pogoda',
      ageCalculator: 'Kalkulator wieku',
      sports: 'Centrum sportowe',
      trending: 'Trendy',
      crypto: 'Krypto',
      dailyBoost: 'Codzienny boost',
      dailyGames: 'Gry dnia',
      markets: 'Rynki',
      ipAddress: 'Adres IP',
      speedTest: 'Test prędkości',
      passwordGenerator: 'Generator haseł',
      sunriseSunset: 'Wschód i zachód słońca',
      bmi: 'BMI',
    },
    topbar: {
      home: 'Strona główna',
      worldTime: 'Czas światowy',
      converters: 'Przeliczniki',
      weather: 'Pogoda',
      sports: 'Sport',
      more: 'Więcej',
      search: 'Szukaj...',
    },
    buttons: {
      exploreNow: 'Odkryj teraz',
      upgradeNow: 'Ulepsz teraz',
      viewAll: 'Zobacz wszystko',
    },
    general: { loading: 'Ładowanie...', error: 'Błąd' },
    premium: {
      title: 'PREMIUM',
      description: 'Brak reklam i więcej zaawansowanych funkcji',
    },
  },

  pt: {
    nav: {
      home: 'Início',
      worldTime: 'Hora mundial',
      currency: 'Moeda',
      unitConverter: 'Conversor de unidades',
      dateCounter: 'Contador de datas',
      weather: 'Tempo',
      ageCalculator: 'Calculadora de idade',
      sports: 'Centro esportivo',
      trending: 'Tendências',
      crypto: 'Cripto',
      dailyBoost: 'Impulso diário',
      dailyGames: 'Jogos diários',
      markets: 'Mercados',
      ipAddress: 'Endereço IP',
      speedTest: 'Teste de velocidade',
      passwordGenerator: 'Gerador de senhas',
      sunriseSunset: 'Nascer e pôr do sol',
      bmi: 'IMC',
    },
    topbar: {
      home: 'Início',
      worldTime: 'Hora mundial',
      converters: 'Conversores',
      weather: 'Tempo',
      sports: 'Esportes',
      more: 'Mais',
      search: 'Pesquisar...',
    },
    buttons: {
      exploreNow: 'Explorar agora',
      upgradeNow: 'Atualizar agora',
      viewAll: 'Ver tudo',
    },
    general: { loading: 'Carregando...', error: 'Erro' },
    premium: {
      title: 'PREMIUM',
      description: 'Sem anúncios e recursos mais avançados',
    },
  },

  ru: {
    nav: {
      home: 'Главная',
      worldTime: 'Мировое время',
      currency: 'Валюта',
      unitConverter: 'Конвертер единиц',
      dateCounter: 'Счётчик дат',
      weather: 'Погода',
      ageCalculator: 'Калькулятор возраста',
      sports: 'Спортивный центр',
      trending: 'Тренды',
      crypto: 'Крипто',
      dailyBoost: 'Ежедневный буст',
      dailyGames: 'Игры дня',
      markets: 'Рынки',
      ipAddress: 'IP-адрес',
      speedTest: 'Тест скорости',
      passwordGenerator: 'Генератор паролей',
      sunriseSunset: 'Рассвет и закат',
      bmi: 'ИМТ',
    },
    topbar: {
      home: 'Главная',
      worldTime: 'Мировое время',
      converters: 'Конверторы',
      weather: 'Погода',
      sports: 'Спорт',
      more: 'Ещё',
      search: 'Поиск...',
    },
    buttons: {
      exploreNow: 'Открыть',
      upgradeNow: 'Улучшить',
      viewAll: 'Смотреть все',
    },
    general: { loading: 'Загрузка...', error: 'Ошибка' },
    premium: {
      title: 'ПРЕМИУМ',
      description: 'Без рекламы и расширенные возможности',
    },
  },

  zh: {
    nav: {
      home: '首页',
      worldTime: '世界时间',
      currency: '货币',
      unitConverter: '单位换算',
      dateCounter: '日期计算',
      weather: '天气',
      ageCalculator: '年龄计算',
      sports: '体育中心',
      trending: '趋势',
      crypto: '加密货币',
      dailyBoost: '每日激励',
      dailyGames: '每日游戏',
      markets: '市场',
      ipAddress: 'IP地址',
      speedTest: '速度测试',
      passwordGenerator: '密码生成器',
      sunriseSunset: '日出日落',
      bmi: 'BMI',
    },
    topbar: {
      home: '首页',
      worldTime: '世界时间',
      converters: '换算工具',
      weather: '天气',
      sports: '体育',
      more: '更多',
      search: '搜索...',
    },
    buttons: {
      exploreNow: '立即探索',
      upgradeNow: '立即升级',
      viewAll: '查看全部',
    },
    general: { loading: '加载中...', error: '错误' },
    premium: {
      title: '高级版',
      description: '无广告体验和更多强大功能',
    },
  },

  ja: {
    nav: {
      home: 'ホーム',
      worldTime: '世界時計',
      currency: '通貨',
      unitConverter: '単位変換',
      dateCounter: '日付カウンター',
      weather: '天気',
      ageCalculator: '年齢計算',
      sports: 'スポーツセンター',
      trending: 'トレンド',
      crypto: '暗号通貨',
      dailyBoost: 'デイリーブースト',
      dailyGames: 'デイリーゲーム',
      markets: 'マーケット',
      ipAddress: 'IPアドレス',
      speedTest: '速度テスト',
      passwordGenerator: 'パスワード生成',
      sunriseSunset: '日の出・日没',
      bmi: 'BMI',
    },
    topbar: {
      home: 'ホーム',
      worldTime: '世界時計',
      converters: '変換ツール',
      weather: '天気',
      sports: 'スポーツ',
      more: 'もっと',
      search: '検索...',
    },
    buttons: {
      exploreNow: '今すぐ探索',
      upgradeNow: 'アップグレード',
      viewAll: 'すべて見る',
    },
    general: { loading: '読み込み中...', error: 'エラー' },
    premium: {
      title: 'プレミアム',
      description: '広告なしと高度な機能',
    },
  },

  ko: {
    nav: {
      home: '홈',
      worldTime: '세계 시각',
      currency: '통화',
      unitConverter: '단위 변환',
      dateCounter: '날짜 계산기',
      weather: '날씨',
      ageCalculator: '나이 계산기',
      sports: '스포츠 센터',
      trending: '트렌드',
      crypto: '암호화폐',
      dailyBoost: '데일리 부스트',
      dailyGames: '오늘의 게임',
      markets: '시장',
      ipAddress: 'IP 주소',
      speedTest: '속도 테스트',
      passwordGenerator: '비밀번호 생성기',
      sunriseSunset: '일출 & 일몰',
      bmi: 'BMI',
    },
    topbar: {
      home: '홈',
      worldTime: '세계 시각',
      converters: '변환기',
      weather: '날씨',
      sports: '스포츠',
      more: '더보기',
      search: '검색...',
    },
    buttons: {
      exploreNow: '지금 탐색',
      upgradeNow: '지금 업그레이드',
      viewAll: '전체 보기',
    },
    general: { loading: '로딩 중...', error: '오류' },
    premium: {
      title: '프리미엄',
      description: '광고 없는 경험과 더 강력한 기능',
    },
  },

  ar: {
    nav: {
      home: 'الرئيسية',
      worldTime: 'التوقيت العالمي',
      currency: 'العملة',
      unitConverter: 'محول الوحدات',
      dateCounter: 'حساب التاريخ',
      weather: 'الطقس',
      ageCalculator: 'حساب العمر',
      sports: 'مركز الرياضة',
      trending: 'الرائج',
      crypto: 'العملات الرقمية',
      dailyBoost: 'دفعة يومية',
      dailyGames: 'ألعاب يومية',
      markets: 'الأسواق',
      ipAddress: 'عنوان IP',
      speedTest: 'اختبار السرعة',
      passwordGenerator: 'مولد كلمات المرور',
      sunriseSunset: 'شروق وغروب الشمس',
      bmi: 'مؤشر كتلة الجسم',
    },
    topbar: {
      home: 'الرئيسية',
      worldTime: 'التوقيت العالمي',
      converters: 'المحولات',
      weather: 'الطقس',
      sports: 'الرياضة',
      more: 'المزيد',
      search: 'ابحث...',
    },
    buttons: {
      exploreNow: 'استكشف الآن',
      upgradeNow: 'ترقية الآن',
      viewAll: 'عرض الكل',
    },
    general: { loading: 'جارٍ التحميل...', error: 'خطأ' },
    premium: {
      title: 'الاشتراك المميز',
      description: 'تجربة بدون إعلانات وميزات أكثر قوة',
    },
  },

  hi: {
    nav: {
      home: 'होम',
      worldTime: 'विश्व समय',
      currency: 'मुद्रा',
      unitConverter: 'इकाई परिवर्तक',
      dateCounter: 'तिथि काउंटर',
      weather: 'मौसम',
      ageCalculator: 'आयु कैलकुलेटर',
      sports: 'खेल केंद्र',
      trending: 'ट्रेंडिंग',
      crypto: 'क्रिप्टो',
      dailyBoost: 'दैनिक बूस्ट',
      dailyGames: 'दैनिक खेल',
      markets: 'बाज़ार',
      ipAddress: 'आईपी पता',
      speedTest: 'गति परीक्षण',
      passwordGenerator: 'पासवर्ड जनरेटर',
      sunriseSunset: 'सूर्योदय और सूर्यास्त',
      bmi: 'बीएमआई',
    },
    topbar: {
      home: 'होम',
      worldTime: 'विश्व समय',
      converters: 'परिवर्तक',
      weather: 'मौसम',
      sports: 'खेल',
      more: 'अधिक',
      search: 'खोजें...',
    },
    buttons: {
      exploreNow: 'अभी देखें',
      upgradeNow: 'अभी अपग्रेड करें',
      viewAll: 'सभी देखें',
    },
    general: { loading: 'लोड हो रहा है...', error: 'त्रुटि' },
    premium: {
      title: 'प्रीमियम',
      description: 'विज्ञापन-मुक्त अनुभव और उन्नत सुविधाएं',
    },
  },
};

export const LANGUAGES: { code: Lang; name: string; flag: string; rtl?: boolean }[] = [
  { code: 'en', name: 'English',    flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch',    flag: '🇩🇪' },
  { code: 'fr', name: 'Français',   flag: '🇫🇷' },
  { code: 'it', name: 'Italiano',   flag: '🇮🇹' },
  { code: 'es', name: 'Español',    flag: '🇪🇸' },
  { code: 'pt', name: 'Português',  flag: '🇵🇹' },
  { code: 'cs', name: 'Čeština',    flag: '🇨🇿' },
  { code: 'pl', name: 'Polski',     flag: '🇵🇱' },
  { code: 'ru', name: 'Русский',    flag: '🇷🇺' },
  { code: 'zh', name: '中文',        flag: '🇨🇳' },
  { code: 'ja', name: '日本語',      flag: '🇯🇵' },
  { code: 'ko', name: '한국어',      flag: '🇰🇷' },
  { code: 'ar', name: 'العربية',    flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'हिन्दी',     flag: '🇮🇳' },
];

export function isRTL(lang: Lang): boolean {
  return lang === 'ar';
}

export default t;
