/* Country helpers shared by the leaderboard forms. */

export const WORLD_COUNTRIES = [
  'AF','AL','DZ','AR','AM','AU','AT','AZ','BH','BD','BY','BE','BO','BA','BR','BG','KH','CA',
  'CL','CN','CO','HR','CZ','DK','EC','EG','EE','ET','FI','FR','GE','DE','GH','GR','GT','HK',
  'HU','IN','ID','IQ','IE','IL','IT','JP','JO','KZ','KE','KW','LV','LB','LT','LU','MY','MX',
  'MA','NL','NZ','NG','NO','OM','PK','PE','PH','PL','PT','QA','RO','RU','SA','RS','SG','SK',
  'ZA','KR','ES','LK','SE','CH','TW','TZ','TH','TN','TR','UA','AE','GB','US','VN',
].sort();

export function flagEmoji(code: string) {
  return [...code.toUpperCase()].map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

export function getCountryName(code: string, lang: string): string {
  try {
    const dn = new Intl.DisplayNames([lang, 'en'], { type: 'region' });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}
