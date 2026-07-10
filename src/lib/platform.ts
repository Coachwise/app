import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/** True when running inside the Capacitor native shell (Android/iOS), false on web. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** 'android' | 'ios' | 'web' */
export function platform(): string {
  return Capacitor.getPlatform();
}

/**
 * Open a URL outside the app view.
 *
 * On native this uses an in-app browser (Capacitor Browser) styled to the brand,
 * which is required for payment gateways — after the hosted return page loads and
 * the user closes it, `onClose` fires. On web it opens a new tab. The wallet also
 * refreshes independently over the realtime "wallet" socket signal, so `onClose`
 * is a belt-and-suspenders refresh, not the only path.
 */
export async function openExternal(url: string, onClose?: () => void): Promise<void> {
  if (isNative()) {
    if (onClose) {
      const sub = await Browser.addListener('browserFinished', () => {
        sub.remove();
        onClose();
      });
    }
    await Browser.open({ url, presentationStyle: 'popover', toolbarColor: '#0E0E55' });
    return;
  }
  window.open(url, '_blank');
}

/**
 * One-time native setup: a navy status bar (light icons) that blends into the
 * app's navy headers and keeps the webview inside the OS safe area (no overlay),
 * then dismiss the splash once the web layer is up. No-op on web.
 */
export async function initNative(): Promise<void> {
  if (!isNative()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark }); // dark bg → light content
    if (platform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#0E0E55' });
    }
  } catch {
    /* status bar not available */
  }
  try {
    await SplashScreen.hide();
  } catch {
    /* no splash */
  }
}

/** Programmatically close the in-app browser (e.g. once a purchase settles). */
export async function closeExternal(): Promise<void> {
  if (isNative()) {
    try {
      await Browser.close();
    } catch {
      /* already closed */
    }
  }
}
