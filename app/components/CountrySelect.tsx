'use client';

import { useMemo } from 'react';
import { WORLD_COUNTRIES, getCountryName } from '../../lib/games/countries';
import FlagSelect from './FlagSelect';

/* Country picker for the leaderboard forms: SVG flags, names in the UI language, sorted by name.
   value '' = no country chosen (shown with a globe and the placeholder). */
export default function CountrySelect({
  value, onChange, lang, placeholder, style, className,
}: {
  value: string;
  onChange: (code: string) => void;
  lang: string;
  placeholder: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  // Some translations start the placeholder with 🌍 — the option already shows a globe icon
  const text = placeholder.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, '');
  const options = useMemo(() => {
    const countries = WORLD_COUNTRIES
      .map(code => ({ value: code, flag: code, label: getCountryName(code, lang) }))
      .sort((a, b) => a.label.localeCompare(b.label, lang));
    return [{ value: '', flag: 'world', label: text }, ...countries];
  }, [lang, text]);

  return (
    <FlagSelect
      value={value} onChange={onChange} options={options} label={text}
      style={{ width: '100%', ...style }} className={className}
    />
  );
}
