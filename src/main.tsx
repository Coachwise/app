import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { RealtimeProvider } from "./contexts/RealtimeContext.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { initNative } from "./lib/platform.ts";
import { installGlobalHandlers } from "./lib/report.ts";
import { initTheme } from "./lib/theme.ts";
import "./styles/globals.css";

// Apply the saved colour mode + accent before first paint (no flash of default).
initTheme();

// Configure the native shell (status bar, splash) when running under Capacitor.
initNative();

// Catch uncaught errors and unhandled promise rejections app-wide, so a crash
// outside React's render tree still reaches #alert-log.
installGlobalHandlers();

// ErrorBoundary is outermost: a crash while the providers mount must still be
// caught and reported, and its fallback must not depend on any of them.
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <RealtimeProvider>
        <App />
      </RealtimeProvider>
    </AuthProvider>
  </ErrorBoundary>
);
