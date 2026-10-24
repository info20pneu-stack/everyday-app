/* Shared Web Audio context for the new games.
   Games should create sound through getGameAudio() so BossKey can silence everything at once. */

type WithWebkit = typeof window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let muted = false;
/** <audio>/<video> elements that were playing when we muted, so we only resume those. */
let pausedMedia: HTMLMediaElement[] = [];

/** Lazily created shared AudioContext (call from a user gesture the first time). Null when unsupported. */
export function getGameAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as WithWebkit).webkitAudioContext;
    if (!Ctor) return null;
    try { ctx = new Ctor(); } catch { return null; }
  }
  if (muted) ctx.suspend().catch(() => {});
  return ctx;
}

export function isGameAudioMuted(): boolean {
  return muted;
}

/** Silences the shared context and pauses any playing media on the page. */
export function muteGameAudio(): void {
  if (muted) return;
  muted = true;
  ctx?.suspend().catch(() => {});
  if (typeof document === 'undefined') return;
  pausedMedia = Array.from(document.querySelectorAll<HTMLMediaElement>('audio, video')).filter(m => !m.paused);
  pausedMedia.forEach(m => m.pause());
}

export function unmuteGameAudio(): void {
  if (!muted) return;
  muted = false;
  ctx?.resume().catch(() => {});
  pausedMedia.forEach(m => { m.play().catch(() => {}); });
  pausedMedia = [];
}
