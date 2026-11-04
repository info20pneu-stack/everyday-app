/* Small line icons of Mahjong (from the original). */

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function Star({ on, className }: { on?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={on ? '#F0C873' : 'rgba(0,0,0,.35)'} stroke={on ? '#FFF0C4' : 'rgba(255,255,255,.25)'} strokeWidth="1.4" aria-hidden="true">
      <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z" />
    </svg>
  );
}
export const StarSmall = () => (
  <svg viewBox="0 0 24 24" fill="#E3B45C" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z" /></svg>
);
export const SoundIcon = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" {...line} aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z" />{on ? <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" /> : <path d="M16 9l5 6M21 9l-5 6" />}</svg>
);
export const Flame = () => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth={2.2} aria-hidden="true"><path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-3 3 0-3-1-5-3-7 0 4-4 7-4 13 0 4 3 7 7 7z" /></svg>
);
export const Back = () => <svg viewBox="0 0 24 24" {...line} aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>;
export const Chevron = () => <svg viewBox="0 0 24 24" width="20" height="20" {...line} aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;
export const PauseIcon = () => <svg viewBox="0 0 24 24" {...line} strokeWidth={2.4} aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>;
export const UndoIcon = () => <svg viewBox="0 0 24 24" {...line} aria-hidden="true"><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 010 10h-3" /></svg>;
export const HintIcon = () => <svg viewBox="0 0 24 24" {...line} aria-hidden="true"><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" /></svg>;
export const ShuffleIcon = () => <svg viewBox="0 0 24 24" {...line} aria-hidden="true"><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg>;
