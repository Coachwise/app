// @ts-check
/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.coachwise.app',
  appName: 'Coachwise',
  // Vite builds to build/ (not dist/) — see vite.config.mts.
  webDir: 'build',
  // Dev live-reload: set CAP_SERVER_URL to your machine's LAN URL
  // (e.g. http://192.168.1.20:3000) to load the running Vite dev server on a
  // device instead of the bundled build. Leave unset for a production build.
  server: process.env.CAP_SERVER_URL
    ? { url: process.env.CAP_SERVER_URL, cleartext: true }
    : undefined,
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#0E0E55', // brand navy
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      backgroundColor: '#0E0E55',
      style: 'DARK', // dark background → light icons
    },
    Keyboard: {
      resize: 'native',
    },
  },
};

module.exports = config;
