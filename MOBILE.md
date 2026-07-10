# Mobile apps (Capacitor)

Coachwise ships as native Android + iOS apps that wrap the same React/Vite web
build via [Capacitor](https://capacitorjs.com). App ID: **`com.coachwise.app`**.

- Native projects live in `android/` and `ios/` (committed; regenerated assets are
  gitignored by each project's own `.gitignore`).
- Web config: `capacitor.config.js` (plain CommonJS — Capacitor's CLI can't read a
  `.ts` config under TypeScript 7, so keep it `.js`).
- Native-aware code goes through `src/lib/platform.ts` (`isNative`, `openExternal`,
  `initNative`). Prefer these over touching `window`/plugins directly.

## Prerequisites

- **Android:** Android Studio + Android SDK, JDK 17. (Not installed in this repo's
  dev container — build on a machine that has them.)
- **iOS:** a Mac with Xcode. Capacitor 8 uses Swift Package Manager, so no
  CocoaPods needed.

## Build & run

```bash
# from app/
npm run build:mobile        # vite build → build/, then cap sync into android+ios
npm run cap:android         # opens the project in Android Studio → Run
npm run cap:ios             # opens the project in Xcode → Run   (Mac only)
```

`cap sync` copies the latest web build into the native projects and updates
plugins. Re-run `npm run build:mobile` after any web change before rebuilding the
app.

## Dev with live reload (optional)

Point the native shell at the running Vite dev server instead of the bundled
build so web edits hot-reload on the device:

```bash
npm run dev                 # Vite on :3000, reachable on your LAN
CAP_SERVER_URL=http://<your-LAN-IP>:3000 npx cap sync
npm run cap:android         # (or cap:ios) then Run
```

Unset `CAP_SERVER_URL` and re-sync to go back to a bundled production build.

## API URL on a device — IMPORTANT

The app talks to the Go API via `VITE_API_URL` (see `src/config.ts`). `localhost`
resolves to the *phone*, not your dev machine, so a device build must use a
reachable address:

```bash
VITE_API_URL=http://<your-LAN-IP>:8000 npm run build:mobile   # LAN testing
VITE_API_URL=https://api.coachwise...  npm run build:mobile   # production
```

**Backend CORS must allow the native webview origins.** Inside the app the web
origin is not `localhost:3000` — it's:

- Android: `https://localhost`
- iOS: `capacitor://localhost`

Add both to `api/config.yml` `cors.allowed_origins` (alongside the existing dev
origins) or API/WebSocket calls from the app will be blocked. The realtime socket
(`wsURL`) is derived from the same base URL and needs the same reachability.

## Payments

Payment gateways open in an in-app browser (Capacitor Browser on native, a new
tab on web) via `openExternal()`. The API's payment **return URL is a hosted web
page** — no custom URL scheme. After the return page loads and the user closes
the browser, the wallet refreshes; the primary refresh path is the realtime
`wallet` socket signal that fires when the gateway callback settles.

## App icon & splash

Provide a 1024×1024 icon (and optional splash) and generate all sizes with:

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#0E0E55' --splashBackgroundColor '#0E0E55'
```

Splash/status-bar colors are brand navy `#0E0E55`, configured in
`capacitor.config.js` and `src/lib/platform.ts` (`initNative`).
