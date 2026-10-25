/* Currencies supported by the converter (rate = fallback per 1 USD when the live API fails). */
export const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar',          rate: 1 },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro',               rate: 0.912 },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound',      rate: 0.785 },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen',       rate: 154.8 },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar',    rate: 1.362 },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar',  rate: 1.534 },
  { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc',        rate: 0.893 },
  { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan',       rate: 7.25 },
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee',       rate: 83.4 },
  { code: 'BRL', flag: '🇧🇷', name: 'Brazilian Real',     rate: 5.12 },
  { code: 'MXN', flag: '🇲🇽', name: 'Mexican Peso',       rate: 17.8 },
  { code: 'KRW', flag: '🇰🇷', name: 'South Korean Won',   rate: 1321 },
  { code: 'SEK', flag: '🇸🇪', name: 'Swedish Krona',      rate: 10.45 },
  { code: 'NOK', flag: '🇳🇴', name: 'Norwegian Krone',    rate: 10.7 },
  { code: 'DKK', flag: '🇩🇰', name: 'Danish Krone',       rate: 6.88 },
  { code: 'CZK', flag: '🇨🇿', name: 'Czech Koruna',       rate: 22.9 },
  { code: 'PLN', flag: '🇵🇱', name: 'Polish Zloty',       rate: 3.92 },
  { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham',         rate: 3.672 },
  { code: 'SAR', flag: '🇸🇦', name: 'Saudi Riyal',        rate: 3.75 },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar',   rate: 1.34 },
  { code: 'HKD', flag: '🇭🇰', name: 'Hong Kong Dollar',   rate: 7.82 },
  { code: 'TRY', flag: '🇹🇷', name: 'Turkish Lira',       rate: 32.1 },
  { code: 'ZAR', flag: '🇿🇦', name: 'South African Rand', rate: 18.6 },
];

/** How many currencies the site supports — shown in the hero tile, the Currency card and the footer. */
export const CURRENCY_COUNT = CURRENCIES.length;
