/* Site-wide settings you fill in before launch. */

/** Social profiles shown in the footer. Empty = hidden (the whole row hides when all are empty). */
export const SOCIAL_LINKS: { id: 'x' | 'instagram' | 'facebook' | 'tiktok' | 'youtube'; label: string; url: string }[] = [
  { id: 'x',         label: 'X',         url: '' },
  { id: 'instagram', label: 'Instagram', url: '' },
  { id: 'facebook',  label: 'Facebook',  url: '' },
  { id: 'tiktok',    label: 'TikTok',    url: '' },
  { id: 'youtube',   label: 'YouTube',   url: '' },
];

/** Contact e-mail — PLACEHOLDER, replace before launch (used on /contact and /privacy-policy drafts). */
export const CONTACT_EMAIL = 'kontakt@example.com';
