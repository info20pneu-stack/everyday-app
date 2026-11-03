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

/** Facebook app id for the Messenger "send" dialog on computers. Empty = the Messenger button
 *  copies the link and opens messenger.com (phones use the Messenger app directly). */
export const FACEBOOK_APP_ID = '';
