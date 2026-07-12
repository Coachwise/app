const apiURL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const config = {
  env: import.meta.env.VITE_ENV || "development",
  apiURL,
  // WebSocket base for the realtime refetch-signal socket (http→ws, https→wss).
  wsURL: apiURL.replace(/^http/, "ws"),
};

/**
 * App version + release channel. In CI these come from the git tag / build env
 * (VITE_APP_VERSION, VITE_APP_CHANNEL); locally they fall back to dev defaults.
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.1.0-dev";
export const APP_IS_BETA =
  (import.meta.env.VITE_APP_CHANNEL || "beta").toLowerCase() === "beta";

/**
 * Feature flags for staged rollout.
 *
 * These features are hidden for the first public release. Flip a flag to `true`
 * to re-enable it in a future release — every place that shows the feature reads
 * from this single source, so no other code changes are required.
 */
export const FEATURES = {
  /** SPARK / ENT reward token: balance widget, claim screen, token payment option. */
  spark: false,
  /** Coach broadcast channels: Messages "Channels" tab, channel view & invites. */
  channels: false,
  /** Social feed tab + create-post. Deferred to a later phase. */
  feed: false,
} as const;
