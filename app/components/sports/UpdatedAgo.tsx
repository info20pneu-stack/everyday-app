'use client';

import { useEffect, useState } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { sportsStrings } from '../../../lib/sportsI18n';

/** "Updated 3 min ago" under a live table; ticks every 30 s. */
export default function UpdatedAgo({ at }: { at: number }) {
  const { lang } = useLang();
  const ss = sportsStrings(lang);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const min = Math.max(0, Math.floor((now - at) / 60_000));
  const text = min < 1
    ? ss.updatedNow
    : ss.updated.replace('{ago}', new Intl.RelativeTimeFormat(lang, { numeric: 'always', style: 'short' }).format(-min, 'minute'));
  return <div className="sp-updated">{text}</div>;
}
