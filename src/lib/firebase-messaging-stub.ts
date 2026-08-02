// Stands in for `firebase/messaging`, an optional peer dep of
// @capacitor-firebase/messaging that only its *web* implementation needs.
// Push is native-only here (push.ts no-ops on web), so aliasing this in keeps
// the whole Firebase JS SDK out of the bundle. See vite.config.mts.

export function getMessaging(): never {
  throw new Error('web push is not supported in this app');
}
export async function getToken(): Promise<string> {
  throw new Error('web push is not supported in this app');
}
export async function deleteToken(): Promise<boolean> {
  return false;
}
export async function isSupported(): Promise<boolean> {
  return false;
}
export function onMessage(): () => void {
  return () => {};
}
