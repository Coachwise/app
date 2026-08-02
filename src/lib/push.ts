import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { isNative, platform } from './platform';
import * as DevicesAPI from '@/api/devices';

// Native push. The payload carries no text — the backend sends loc keys and the
// OS renders them from the app's own string catalogs — so everything here is
// about the token lifecycle and what happens when a notification is tapped.

const TOKEN_KEY = 'coachwise-push-token';

// Must match the channel the backend sends (src/push/fcm.go). Android shows the
// name in system settings, so it is copy and belongs here, not on the server.
const CHANNEL_ID = 'coachwise_default';
const CHANNEL_NAME: Record<string, string> = { fa: 'اعلان‌ها', en: 'Notifications' };

/** What a tapped notification carries; keys mirror the backend's data block. */
export type PushData = {
  type?: string;
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
};

type TapHandler = (data: PushData) => void;

let tapHandler: TapHandler | null = null;
let listenersBound = false;

/** Route taps to the app's navigation; replaces any previous handler. */
export function onPushOpened(handler: TapHandler | null) {
  tapHandler = handler;
}

async function sendToken(authToken: string, deviceToken: string, locale: string) {
  localStorage.setItem(TOKEN_KEY, deviceToken);
  await DevicesAPI.registerDevice(authToken, {
    token: deviceToken,
    platform: platform() === 'ios' ? 'ios' : 'android',
    locale,
  });
}

/**
 * Ask for permission, register the token, and keep it fresh. Safe to call on
 * every launch and after each login — registration is an upsert. No-op on web.
 */
export async function registerPush(authToken: string, locale: string): Promise<void> {
  if (!isNative()) return;
  try {
    const { receive } = await FirebaseMessaging.requestPermissions();
    if (receive !== 'granted') return;

    // Without this channel Android drops the message's importance to default.
    if (platform() === 'android') {
      await FirebaseMessaging.createChannel({
        id: CHANNEL_ID,
        name: CHANNEL_NAME[locale] ?? CHANNEL_NAME.en,
        importance: 4,
        visibility: 1,
      }).catch(() => {});
    }

    const { token } = await FirebaseMessaging.getToken();
    if (token) await sendToken(authToken, token, locale);

    if (listenersBound) return;
    listenersBound = true;

    // FCM rotates tokens on its own schedule; an unregistered rotation means
    // silence until the next launch.
    await FirebaseMessaging.addListener('tokenReceived', (event) => {
      if (event.token) void sendToken(authToken, event.token, locale).catch(() => {});
    });

    await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      tapHandler?.((event.notification?.data ?? {}) as PushData);
    });
  } catch {
    /* permission denied or Firebase not configured — push stays off */
  }
}

/**
 * Drop this device on logout so the next person to use the phone doesn't get
 * the previous account's notifications.
 */
export async function unregisterPush(authToken: string): Promise<void> {
  if (!isNative()) return;
  const deviceToken = localStorage.getItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  if (!deviceToken) return;
  try {
    await DevicesAPI.unregisterDevice(authToken, deviceToken);
  } catch {
    /* best effort — the server also prunes tokens FCM reports dead */
  }
  try {
    await FirebaseMessaging.deleteToken();
  } catch {
    /* ignore */
  }
}
