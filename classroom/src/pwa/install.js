// ─────────────────────────────────────────────────────────────
//  PWA суулгах туслах — "Апп болгож суулгах" товчийг удирдана.
//
//  Chrome/Edge (Android, desktop) дээр beforeinstallprompt үйл явдлыг
//  барьж аваад дараа нь дуудна. iOS Safari дээр энэ үйл явдал байхгүй тул
//  гар аргаар суулгах зааврыг харуулна.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';

let deferredPrompt = null;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(!!deferredPrompt));
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);

  useEffect(() => {
    const fn = (v) => setCanInstall(v);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notify();
    return outcome === 'accepted';
  }

  return { canInstall, promptInstall, standalone: isStandalone(), ios: isIOS() };
}

// Service Worker-ийг бүртгэнэ (production build дээр).
export function registerSW() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      /* офлайн дэмжлэг идэвхжихгүй ч апп хэвийн ажиллана */
    });
  });
}
