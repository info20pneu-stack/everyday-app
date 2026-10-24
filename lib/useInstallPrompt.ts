'use client';

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** iPhone/iPod/iPad — iPadOS reports itself as a Mac, so check for touch too. */
function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

/** Already running as an installed app (home-screen icon). */
function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function subscribeDisplayMode(onChange: () => void) {
  const mq = window.matchMedia('(display-mode: standalone)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** iOS has no install prompt event — users add the app via Share → Add to Home Screen. */
const getIosManual = () => isIOS() && !isStandalone();
const getServerFalse = () => false;

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const iosManual = useSyncExternalStore(subscribeDisplayMode, getIosManual, getServerFalse);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function installed() { setDeferredPrompt(null); }
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    /** The browser offers a native install prompt (Chrome, Edge, Android…). */
    canInstall: !!deferredPrompt,
    promptInstall,
    /** iOS without an install prompt: show "Share → Add to Home Screen" instructions instead. */
    showIosHint: !deferredPrompt && iosManual,
  };
}
